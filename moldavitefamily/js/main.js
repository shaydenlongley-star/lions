/* ═══════════════════════════════════════════════════════════
   MOLDAVITE FAMILY — Main JS
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Nav scroll ─────────────────────────────────────────
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  // ── Mobile menu ─────────────────────────────────────────
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
      })
    );
  }

  // ── Character scatter on hero title ────────────────────
  const heroTitle = document.querySelector('.hero-scatter');
  if (heroTitle) {
    const text = heroTitle.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const nodes = Array.from(doc.body.childNodes);
    heroTitle.innerHTML = '';

    let letterIndex = 0;
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split('').forEach(ch => {
          const span = document.createElement('span');
          span.textContent = ch;
          if (ch.trim()) {
            span.classList.add('scatter-letter');
            const tx = (Math.random() - 0.5) * 140;
            const ty = (Math.random() - 0.5) * 80;
            span.style.setProperty('--tx', `${tx}px`);
            span.style.setProperty('--ty', `${ty}px`);
            span.style.setProperty('--delay', `${0.06 + letterIndex * 0.04}s`);
            letterIndex++;
          }
          heroTitle.appendChild(span);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = document.createElement(node.tagName.toLowerCase());
        el.className = node.className;
        node.textContent.split('').forEach(ch => {
          const span = document.createElement('span');
          span.textContent = ch;
          if (ch.trim()) {
            span.classList.add('scatter-letter');
            const tx = (Math.random() - 0.5) * 140;
            const ty = (Math.random() - 0.5) * 80;
            span.style.setProperty('--tx', `${tx}px`);
            span.style.setProperty('--ty', `${ty}px`);
            span.style.setProperty('--delay', `${0.06 + letterIndex * 0.04}s`);
            letterIndex++;
          }
          el.appendChild(span);
        });
        heroTitle.appendChild(el);
      }
    });
  }

  // ── Spotlight glow on product cards ────────────────────
  document.querySelectorAll('.product-card').forEach(card => {
    const spotlight = document.createElement('div');
    spotlight.classList.add('spotlight');
    card.prepend(spotlight);

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      spotlight.style.background =
        `radial-gradient(400px at ${x}% ${y}%, rgba(61,122,80,0.12) 0%, transparent 70%)`;
    });
  });

  // ── Duplicate marquee for seamless loop ────────────────
  const track = document.querySelector('.marquee-track');
  if (track) {
    const clone = track.innerHTML;
    track.innerHTML += clone;
  }

  // ── Fade-up on scroll ──────────────────────────────────
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // ── Counter roll on stat numbers ───────────────────────
  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      const step = ts => {
        const t = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = (Number.isInteger(end)
          ? Math.round(ease * end)
          : (ease * end).toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

  // ── Gallery switcher (product page) ───────────────────
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const mainImg = document.querySelector('.gallery-main img');
  if (thumbs.length && mainImg) {
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImg.src = thumb.querySelector('img').src;
        mainImg.style.opacity = '0';
        setTimeout(() => mainImg.style.opacity = '1', 50);
        mainImg.style.transition = 'opacity 0.4s';
      });
    });
  }

  // ── Qty controls ──────────────────────────────────────
  const qtyInput = document.querySelector('.qty-input input');
  if (qtyInput) {
    document.querySelectorAll('.qty-input button').forEach(btn => {
      btn.addEventListener('click', () => {
        let v = parseInt(qtyInput.value) || 1;
        if (btn.dataset.action === 'dec') v = Math.max(1, v - 1);
        else v++;
        qtyInput.value = v;
      });
    });
  }

  // ── Shop sidebar category filter ──────────────────────
  const sidebarLinks = document.querySelectorAll('.sidebar-list a[data-filter]');
  const productCards = document.querySelectorAll('.product-grid-shop .product-card');
  const shopCount    = document.querySelector('.shop-count');

  if (sidebarLinks.length && productCards.length) {
    sidebarLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const filter = link.dataset.filter;
        let visible = 0;
        productCards.forEach(card => {
          const cats = card.dataset.categories || '';
          const show = filter === 'all' || cats.includes(filter);
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (shopCount) shopCount.textContent = `Showing ${visible} products`;
      });
    });

    // Price range apply
    const priceApply = document.querySelector('.price-range .btn');
    const minInput   = document.querySelector('.range-input input[data-min]');
    const maxInput   = document.querySelector('.range-input input[data-max]');
    if (priceApply && minInput && maxInput) {
      priceApply.addEventListener('click', () => {
        const min = parseFloat(minInput.value) || 0;
        const max = parseFloat(maxInput.value) || Infinity;
        let visible = 0;
        productCards.forEach(card => {
          const price = parseFloat(card.dataset.price) || 0;
          const show  = price >= min && price <= max;
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        if (shopCount) shopCount.textContent = `Showing ${visible} products`;
      });
    }
  }

  // ── Contact form — Formspree ───────────────────────────
  const contactForm = document.querySelector('.contact-form form');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          btn.textContent = 'Message Sent ✓';
          btn.style.background = 'var(--green)';
          contactForm.reset();
        } else {
          throw new Error('Server error');
        }
      } catch {
        btn.textContent = orig;
        btn.disabled = false;
        alert('Something went wrong. Please email us directly at moldavitefamily@gmail.com');
      }
    });
  }

  // ── Active nav link ────────────────────────────────────
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

});
