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

  // Hard escape — never leave user stuck
  const hardEscape = setTimeout(destroy, 9000);

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Gem center from DOM ──────────────────────────────────
  function gemCenter() {
    const r = gemEl.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
  }

  // ── Moldavite palette ────────────────────────────────────
  const COLORS = [
    '#0a1f10','#132d1c','#1e4228','#2d6040','#3D7A50','#4e9462',
    '#62ae78','#78c48e','#0d3318','#1a4a26','#8dc8a0',
    '#C4A040','#a88428','#d4b84a','#f0d870',
    '#c0e0c8','#183824','#2a5c38','#264d32',
  ];
  function randColor() { return COLORS[Math.floor(Math.random() * COLORS.length)]; }

  // ── State ────────────────────────────────────────────────
  let shards   = [];
  let sparks   = [];
  let flash    = 0;
  let shakeX   = 0, shakeY = 0;
  let exploded = false;
  let rafId    = null;
  let autoTimer;

  // ── Build triangular shards ──────────────────────────────
  function buildShards(gcx, gcy, gr) {
    const N   = 24;
    const out = [], mid = [];

    for (let i = 0; i < N; i++) {
      const base = (i / N) * Math.PI * 2;
      const ao = base + (Math.random() - 0.5) * (Math.PI * 2 / N) * 0.6;
      const ro = gr * (0.88 + Math.random() * 0.38);
      out.push([gcx + Math.cos(ao) * ro, gcy + Math.sin(ao) * ro]);

      const am = base + Math.PI / N + (Math.random() - 0.5) * 0.22;
      const rm = gr * (0.28 + Math.random() * 0.28);
      mid.push([gcx + Math.cos(am) * rm, gcy + Math.sin(am) * rm]);
    }

    for (let i = 0; i < N; i++) {
      const ni = (i + 1) % N;
      addShard([[gcx, gcy], mid[i], mid[ni]], gcx, gcy, gr);
      addShard([mid[i], out[i], mid[ni]], gcx, gcy, gr);
      addShard([out[i], out[ni], mid[ni]], gcx, gcy, gr);
    }
  }

  function addShard(pts, gcx, gcy, gr) {
    const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
    const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    const dx = cx - gcx, dy = cy - gcy;
    const d  = Math.sqrt(dx * dx + dy * dy) || 1;
    const df = Math.min(d / gr, 1);
    const spd = 6 + df * 16 + Math.random() * 10;

    shards.push({
      pts, cx, cy, pivX: cx, pivY: cy,
      vx: (dx / d) * spd + (Math.random() - 0.5) * 6,
      vy: (dy / d) * spd + (Math.random() - 0.5) * 6 - 3,
      ay: 0.45, omega: (Math.random() - 0.5) * 0.22, rot: 0,
      alpha: 1, life: 1,
      decay: 0.011 + Math.random() * 0.009,
      fill: randColor(),
      bright: Math.random() > 0.82,
    });
  }

  // ── Build sparks ─────────────────────────────────────────
  function buildSparks(gcx, gcy) {
    for (let i = 0; i < 95; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 4 + Math.random() * 24;
      sparks.push({
        x: gcx + (Math.random() - 0.5) * 24,
        y: gcy + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1.5,
        ay: 0.38, r: 0.8 + Math.random() * 2.8,
        alpha: 1, trail: [],
        color: Math.random() > 0.55 ? '#d4b84a' : '#62ae78',
        decay: 0.018 + Math.random() * 0.022,
      });
    }
  }

  // ── Draw shard ───────────────────────────────────────────
  function drawShard(s) {
    if (s.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.translate(s.cx, s.cy);
    ctx.rotate(s.rot);
    ctx.translate(-s.pivX, -s.pivY);
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
    ctx.lineTo(s.pts[1][0], s.pts[1][1]);
    ctx.lineTo(s.pts[2][0], s.pts[2][1]);
    ctx.closePath();
    if (s.bright) {
      const g = ctx.createLinearGradient(s.pts[0][0], s.pts[0][1], s.pts[2][0], s.pts[2][1]);
      g.addColorStop(0, '#d4f0dc'); g.addColorStop(1, s.fill);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = s.fill;
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  // ── Animation tick ───────────────────────────────────────
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shakeX *= 0.7; shakeY *= 0.7;
    overlay.style.transform = `translate(${shakeX.toFixed(1)}px,${shakeY.toFixed(1)}px)`;

    if (flash > 0) {
      ctx.fillStyle = `rgba(180,255,200,${flash})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flash = Math.max(0, flash - 0.055);
    }

    let alive = false;

    for (const s of shards) {
      if (s.alpha <= 0) continue;
      s.vx += 0; s.vy += s.ay;
      s.cx += s.vx; s.cy += s.vy;
      s.rot += s.omega;
      s.life -= s.decay;
      s.alpha = Math.max(0, s.life);
      drawShard(s);
      alive = true;
    }

    for (const sp of sparks) {
      if (sp.alpha <= 0) continue;
      sp.vx *= 0.96; sp.vy += sp.ay;
      sp.x += sp.vx; sp.y += sp.vy;
      sp.alpha = Math.max(0, sp.alpha - sp.decay);
      sp.trail.unshift({ x: sp.x, y: sp.y, a: sp.alpha });
      if (sp.trail.length > 7) sp.trail.pop();
      for (let t = 0; t < sp.trail.length; t++) {
        const pt = sp.trail[t];
        const ta = pt.a * (1 - t / sp.trail.length) * 0.5;
        if (ta < 0.01) continue;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, sp.r * (1 - t / sp.trail.length) * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = sp.color; ctx.globalAlpha = ta; ctx.fill();
      }
      ctx.globalAlpha = sp.alpha;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = sp.color; ctx.fill();
      ctx.globalAlpha = 1;
      alive = true;
    }

    if (alive || flash > 0 || Math.abs(shakeX) > 0.5 || Math.abs(shakeY) > 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      fadeOut();
    }
  }

  // ── Trigger explosion ────────────────────────────────────
  function explode() {
    if (exploded) return;
    exploded = true;
    clearTimeout(autoTimer);
    document.removeEventListener('keydown', onInteract);

    const { x, y, r } = gemCenter();
    gemEl.style.transition = 'none';
    gemEl.style.opacity    = '0';
    gemEl.style.transform  = 'scale(0.05)';
    if (hint) hint.style.opacity = '0';

    flash  = 1;
    shakeX = (Math.random() - 0.5) * 52;
    shakeY = (Math.random() - 0.5) * 52;

    buildShards(x, y, r * 1.15);
    buildSparks(x, y);

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);

    // Emergency bail — if animation somehow hangs, force exit after 5s
    setTimeout(() => { if (overlay.isConnected) fadeOut(); }, 5000);
  }

  // ── Fade out overlay ─────────────────────────────────────
  function fadeOut() {
    cancelAnimationFrame(rafId);
    overlay.style.transition = 'opacity 0.6s ease';
    overlay.style.opacity    = '0';
    setTimeout(destroy, 680);
  }

  function destroy() {
    clearTimeout(hardEscape);
    cancelAnimationFrame(rafId);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onInteract);
    if (overlay && overlay.isConnected) overlay.remove();
  }

  // ── Interactions ─────────────────────────────────────────
  function onInteract() { explode(); }

  overlay.addEventListener('click', onInteract);
  overlay.addEventListener('touchstart', onInteract, { passive: true });
  document.addEventListener('keydown', onInteract);

  autoTimer = setTimeout(explode, 3500);

  setTimeout(() => { if (!exploded && hint) hint.style.opacity = '1'; }, 1600);

})();
