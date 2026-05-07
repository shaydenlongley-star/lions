/* ═══════════════════════════════════════════════════════════
   MOLDAVITE FAMILY — Gem Explosion Intro
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const overlay = document.getElementById('mfIntro');
  if (!overlay) return;

  // Only show once per device
  if (localStorage.getItem('mf-intro-v1')) { destroy(); return; }
  localStorage.setItem('mf-intro-v1', '1');

  const gemEl  = document.getElementById('mfGem');
  const canvas = document.getElementById('mfCanvas');
  const hint   = document.getElementById('mfHint');
  const ctx    = canvas.getContext('2d');

  document.body.style.overflow = 'hidden';

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Gem center position from DOM ─────────────────────────
  function gemCenter() {
    const r = gemEl.getBoundingClientRect();
    return {
      x: r.left + r.width  / 2,
      y: r.top  + r.height / 2,
      r: r.width / 2
    };
  }

  // ── Moldavite palette ─────────────────────────────────────
  const SHARD_COLORS = [
    '#0a1f10', '#132d1c', '#1e4228', '#2d6040',
    '#3D7A50', '#4e9462', '#62ae78', '#78c48e',
    '#0d3318', '#1a4a26', '#264d32', '#8dc8a0',
    '#C4A040', '#a88428', '#d4b84a', '#f0d870',
    '#c0e0c8', '#e8f5ec', '#183824', '#2a5c38',
  ];

  function randColor() {
    return SHARD_COLORS[Math.floor(Math.random() * SHARD_COLORS.length)];
  }

  // ── State ─────────────────────────────────────────────────
  let shards    = [];
  let sparks    = [];
  let flash     = 0;      // 0–1 white-green flash alpha
  let shakeX    = 0;
  let shakeY    = 0;
  let exploded  = false;
  let rafId     = null;
  let autoTimer = null;

  // ── Generate triangular shards ───────────────────────────
  // Two concentric rings of Voronoi-ish points → fan triangulation
  function buildShards(gcx, gcy, gr) {
    const N    = 24;   // slices
    const out  = [];   // outer ring pts
    const mid  = [];   // mid ring pts

    for (let i = 0; i < N; i++) {
      const base = (i / N) * Math.PI * 2;

      // outer — irregular radius
      const ao = base + (Math.random() - 0.5) * (Math.PI * 2 / N) * 0.6;
      const ro = gr * (0.88 + Math.random() * 0.38);
      out.push([ gcx + Math.cos(ao) * ro, gcy + Math.sin(ao) * ro ]);

      // mid — offset half-slice, tighter radius
      const am = base + Math.PI / N + (Math.random() - 0.5) * 0.22;
      const rm = gr * (0.28 + Math.random() * 0.28);
      mid.push([ gcx + Math.cos(am) * rm, gcy + Math.sin(am) * rm ]);
    }

    for (let i = 0; i < N; i++) {
      const ni = (i + 1) % N;
      // inner shard
      addShard(out, [ [gcx, gcy], mid[i],    mid[ni]    ], gcx, gcy, gr);
      // outer band shard A
      addShard(out, [ mid[i],     out[i],    mid[ni]    ], gcx, gcy, gr);
      // outer band shard B
      addShard(out, [ out[i],     out[ni],   mid[ni]    ], gcx, gcy, gr);
    }

    function addShard(_, pts, gcx, gcy, gr) {
      const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
      const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      const dx = cx - gcx;
      const dy = cy - gcy;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;

      // Outer shards fly faster
      const distFrac = Math.min(d / gr, 1);
      const spd = 7 + distFrac * 16 + Math.random() * 10;

      shards.push({
        pts,
        cx, cy,              // live centroid (moves each frame)
        pivX: cx, pivY: cy,  // rotation pivot stays with centroid
        vx: (dx / d) * spd + (Math.random() - 0.5) * 6,
        vy: (dy / d) * spd + (Math.random() - 0.5) * 6 - 3,
        ay: 0.45,
        omega: (Math.random() - 0.5) * 0.22,
        rot: 0,
        alpha: 1,
        life: 1,
        decay: 0.011 + Math.random() * 0.009,
        fill: randColor(),
        bright: Math.random() > 0.85, // occasional bright shard
      });
    }
  }

  // ── Generate spark particles ──────────────────────────────
  function buildSparks(gcx, gcy, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 4 + Math.random() * 24;
      const isGold = Math.random() > 0.55;
      sparks.push({
        x: gcx + (Math.random() - 0.5) * 24,
        y: gcy + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1.5,
        ay: 0.38,
        r:  0.8 + Math.random() * 2.8,
        alpha: 1,
        color: isGold ? '#d4b84a' : '#62ae78',
        trail: [],
        decay: 0.018 + Math.random() * 0.022,
      });
    }
  }

  // ── Draw one shard ────────────────────────────────────────
  function drawShard(s) {
    if (s.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = s.alpha;

    // rotate around live centroid
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.rot);
    ctx.translate(-s.pivX, -s.pivY);

    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    ctx.lineTo(s.pts[1][0], s.pts[1][1]);
    ctx.lineTo(s.pts[2][0], s.pts[2][1]);
    ctx.closePath();

    if (s.bright) {
      // shiny highlight shard
      const grd = ctx.createLinearGradient(
        s.pts[0][0], s.pts[0][1], s.pts[2][0], s.pts[2][1]
      );
      grd.addColorStop(0, '#d4f0dc');
      grd.addColorStop(1, s.fill);
      ctx.fillStyle = grd;
    } else {
      ctx.fillStyle = s.fill;
    }
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  // ── Animation loop ────────────────────────────────────────
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Screen shake
    shakeX *= 0.7;
    shakeY *= 0.7;
    overlay.style.transform = `translate(${shakeX.toFixed(1)}px,${shakeY.toFixed(1)}px)`;

    // Flash
    if (flash > 0) {
      ctx.fillStyle = `rgba(180,255,200,${flash})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flash = Math.max(0, flash - 0.055);
    }

    let alive = false;

    // Shards
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.alpha <= 0) continue;

      s.vx  += s.ax || 0;
      s.vy  += s.ay;
      s.cx  += s.vx;
      s.cy  += s.vy;
      s.rot += s.omega;
      s.life -= s.decay;
      s.alpha = Math.max(0, s.life);

      drawShard(s);
      alive = true;
    }

    // Sparks + trails
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      if (sp.alpha <= 0) continue;

      sp.vx *= 0.96;
      sp.vy += sp.ay;
      sp.x  += sp.vx;
      sp.y  += sp.vy;
      sp.alpha = Math.max(0, sp.alpha - sp.decay);

      sp.trail.unshift({ x: sp.x, y: sp.y, a: sp.alpha });
      if (sp.trail.length > 7) sp.trail.pop();

      for (let t = 0; t < sp.trail.length; t++) {
        const pt = sp.trail[t];
        const ta = pt.a * (1 - t / sp.trail.length) * 0.55;
        if (ta < 0.01) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, sp.r * (1 - t / sp.trail.length) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle  = sp.color;
        ctx.globalAlpha = ta;
        ctx.fill();
      }
      ctx.globalAlpha = sp.alpha;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.fill();
      ctx.globalAlpha = 1;

      alive = true;
    }

    if (alive || flash > 0 || Math.abs(shakeX) > 0.5 || Math.abs(shakeY) > 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      fadeOut();
    }
  }

  // ── Trigger the explosion ─────────────────────────────────
  function explode() {
    if (exploded) return;
    exploded = true;

    clearTimeout(autoTimer);
    document.removeEventListener('keydown', onKey);

    const { x, y, r } = gemCenter();

    // Instant gem hide
    gemEl.style.transition  = 'none';
    gemEl.style.opacity     = '0';
    gemEl.style.transform   = 'scale(0.1)';

    if (hint) hint.style.opacity = '0';

    // Flash
    flash = 1;

    // Shake
    shakeX = (Math.random() - 0.5) * 50;
    shakeY = (Math.random() - 0.5) * 50;

    buildShards(x, y, r * 1.15);
    buildSparks(x, y, 95);

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  // ── Overlay fade out ──────────────────────────────────────
  function fadeOut() {
    overlay.style.transition = 'opacity 0.65s ease';
    overlay.style.opacity    = '0';
    setTimeout(destroy, 700);
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    document.body.style.overflow = '';
    overlay.remove();
  }

  // ── Event listeners ───────────────────────────────────────
  function onKey() { explode(); }

  overlay.addEventListener('click', explode);
  overlay.addEventListener('touchstart', explode, { passive: true });
  document.addEventListener('keydown', onKey);

  // Auto-trigger after 3.5s
  autoTimer = setTimeout(explode, 3500);

  // Show hint after 1.6s
  setTimeout(() => {
    if (!exploded && hint) hint.style.opacity = '1';
  }, 1600);

})();
