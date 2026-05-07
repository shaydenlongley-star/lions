/* ── Experience Page — Scroll Narrative ──────────────────── */
(function () {
  'use strict';

  const chapters = Array.from(document.querySelectorAll('.exp-chapter'));
  const ctaChapter = document.getElementById('ch5');
  const dots = Array.from(document.querySelectorAll('.exp-dot'));
  let current = 0;
  let isAnimating = false;
  let touchStartY = 0;

  /* ── Particle Canvas ───────────────────────────────────── */
  const canvas = document.getElementById('exp-particles');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function spawnParticles(count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.45 + 0.05,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.012,
        color: Math.random() > 0.6
          ? `rgba(61,122,80,`
          : `rgba(196,160,64,`
      });
    }
  }
  spawnParticles(120);

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + a + ')';
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -4)  p.x = canvas.width + 4;
      if (p.x > canvas.width + 4) p.x = -4;
      if (p.y < -4)  p.y = canvas.height + 4;
      if (p.y > canvas.height + 4) p.y = -4;
    });
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  /* ── Chapter visibility ────────────────────────────────── */
  const totalSections = chapters.length + 1; // +1 for CTA

  function getSectionIndex() {
    const scrollTop = window.scrollY;
    const vh = window.innerHeight;

    // Check if CTA is in view
    if (ctaChapter) {
      const rect = ctaChapter.getBoundingClientRect();
      if (rect.top < vh * 0.5) return chapters.length;
    }

    let idx = 0;
    chapters.forEach((ch, i) => {
      const rect = ch.getBoundingClientRect();
      if (rect.top < vh * 0.5) idx = i;
    });
    return idx;
  }

  function revealChapterContent(idx) {
    const ch = idx < chapters.length ? chapters[idx] : null;
    if (!ch) {
      // CTA — reveal via IntersectionObserver
      return;
    }
    const heading = ch.querySelector('h2');
    const body    = ch.querySelector('.exp-body-text');
    const divider = ch.querySelector('.exp-divider');
    if (heading) heading.classList.add('visible');
    if (body)    body.classList.add('visible');
    if (divider) divider.classList.add('visible');
  }

  function updateDots(idx) {
    const dotIdx = Math.min(idx, dots.length - 1);
    dots.forEach((d, i) => d.classList.toggle('active', i === dotIdx));
  }

  /* ── Scroll-based reveal ────────────────────────────────── */
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = chapters.indexOf(entry.target);
        if (idx !== -1) {
          revealChapterContent(idx);
          updateDots(idx);
          current = idx;
        }
      }
    });
  }, { threshold: 0.45 });

  chapters.forEach(ch => observer.observe(ch));

  // CTA chapter observer
  if (ctaChapter) {
    const ctaObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) updateDots(chapters.length);
      });
    }, { threshold: 0.3 });
    ctaObs.observe(ctaChapter);
  }

  /* ── Ken Burns parallax on scroll ──────────────────────── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.innerWidth < 768;

  window.addEventListener('scroll', () => {
    if (prefersReduced || isMobile()) return;
    const vh = window.innerHeight;
    chapters.forEach(ch => {
      const bg = ch.querySelector('.exp-bg');
      if (!bg) return;
      const rect = ch.getBoundingClientRect();
      const progress = -rect.top / vh;
      const parallax = progress * 30;
      bg.style.transform = `scale(1.08) translateY(${parallax}px)`;
    });
  }, { passive: true });

  /* ── Dot click navigation ─────────────────────────────── */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (i < chapters.length) {
        chapters[i].scrollIntoView({ behavior: 'smooth' });
      } else {
        ctaChapter && ctaChapter.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ── Keyboard nav ─────────────────────────────────────── */
  document.addEventListener('keydown', e => {
    const allSections = [...chapters, ctaChapter].filter(Boolean);
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      const next = allSections[current + 1];
      if (next) {
        next.scrollIntoView({ behavior: 'smooth' });
        current = Math.min(current + 1, allSections.length - 1);
      }
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      const prev = allSections[current - 1];
      if (prev) {
        prev.scrollIntoView({ behavior: 'smooth' });
        current = Math.max(current - 1, 0);
      }
    }
  });

  /* ── Touch swipe ──────────────────────────────────────── */
  document.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const delta = touchStartY - e.changedTouches[0].clientY;
    const allSections = [...chapters, ctaChapter].filter(Boolean);
    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      const next = allSections[current + 1];
      if (next) { next.scrollIntoView({ behavior: 'smooth' }); current++; }
    } else {
      const prev = allSections[current - 1];
      if (prev) { prev.scrollIntoView({ behavior: 'smooth' }); current--; }
    }
  }, { passive: true });

  /* ── Cinematic letter entrance for chapter headings ────── */
  function scatterHeading(el) {
    if (!el || el.dataset.scattered) return;
    el.dataset.scattered = 'true';
    const text = el.innerHTML;
    const wrapper = document.createElement('span');
    wrapper.style.display = 'inline';
    let i = 0;
    el.innerHTML = '';

    // Preserve italic em tags
    const div = document.createElement('div');
    div.innerHTML = text;
    div.childNodes.forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split('').forEach(ch => {
          if (ch === ' ' || ch === '\n') {
            el.appendChild(document.createTextNode(ch));
            return;
          }
          const span = document.createElement('span');
          span.className = 'scatter-letter';
          span.textContent = ch;
          const tx = (Math.random() - 0.5) * 80;
          const ty = (Math.random() - 0.5) * 60;
          span.style.setProperty('--tx', tx + 'px');
          span.style.setProperty('--ty', ty + 'px');
          span.style.setProperty('--delay', (i * 0.035) + 's');
          el.appendChild(span);
          i++;
        });
      } else if (node.nodeName === 'EM' || node.nodeName === 'BR') {
        el.appendChild(node.cloneNode(true));
      }
    });
  }

  /* Run scatter on first visible chapter */
  setTimeout(() => {
    const firstH2 = chapters[0] && chapters[0].querySelector('h2');
    if (firstH2) scatterHeading(firstH2);
  }, 100);

  // Scatter chapter headings as they become visible
  const scatterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const h2 = entry.target.querySelector('h2');
        if (h2) setTimeout(() => scatterHeading(h2), 200);
      }
    });
  }, { threshold: 0.3 });
  chapters.forEach(ch => scatterObs.observe(ch));

  /* ── Reveal first chapter immediately ─────────────────── */
  revealChapterContent(0);

})();
