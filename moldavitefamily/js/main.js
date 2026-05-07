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

    let activeCategory = 'all';
    let activeMin = 0;
    let activeMax = Infinity;

    function flashCount() {
      if (!shopCount) return;
      shopCount.classList.remove('count-flash');
      void shopCount.offsetWidth; // force reflow
      shopCount.classList.add('count-flash');
    }

    function applyFilters() {
      let visible = 0;
      productCards.forEach(card => {
        const cats  = (card.dataset.categories || '').split(' ');
        const price = parseFloat(card.dataset.price) || 0;
        const catOk   = activeCategory === 'all' || cats.includes(activeCategory);
        const priceOk = price >= activeMin && price <= activeMax;
        const show    = catOk && priceOk;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (shopCount) {
        shopCount.textContent = `Showing ${visible} products`;
        flashCount();
      }
    }

    sidebarLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        activeCategory = link.dataset.filter;
        applyFilters();
      });
    });

    // Price range apply
    const priceApply = document.querySelector('.price-range .btn');
    const minInput   = document.querySelector('.range-input input[data-min]');
    const maxInput   = document.querySelector('.range-input input[data-max]');
    if (priceApply && minInput && maxInput) {
      priceApply.addEventListener('click', () => {
        activeMin = parseFloat(minInput.value) || 0;
        activeMax = parseFloat(maxInput.value) || Infinity;
        applyFilters();
      });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const grid  = document.querySelector('.product-grid-shop');
        if (!grid) return;
        const cards = [...grid.querySelectorAll('.product-card')];
        const val   = sortSelect.value;

        cards.sort((a, b) => {
          const pa = parseFloat(a.dataset.price) || 0;
          const pb = parseFloat(b.dataset.price) || 0;
          if (val === 'price-asc')  return pa - pb;
          if (val === 'price-desc') return pb - pa;
          // 'default' and 'newest' — restore original DOM order via data-index
          const ia = parseInt(a.dataset.index ?? a.dataset.price ?? 0);
          const ib = parseInt(b.dataset.index ?? b.dataset.price ?? 0);
          return ia - ib;
        });

        // Re-append in sorted order (preserves display:none state)
        cards.forEach(c => grid.appendChild(c));
        flashCount();
      });
    }

    // Activate filter from URL hash (e.g. shop.html#besednice → filter besednice)
    const hashFilter = window.location.hash.replace('#', '');
    if (hashFilter) {
      const matchLink = [...sidebarLinks].find(l => l.dataset.filter === hashFilter);
      if (matchLink) matchLink.click();
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

  // ── Scroll progress bar ──────────────────────────────
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
    }, { passive: true });
  }

  // ── Custom cursor ────────────────────────────────────
  const cursorDot  = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  if (cursorDot && cursorRing && !window.matchMedia('(pointer:coarse)').matches) {
    let mx = -200, my = -200, rx = -200, ry = -200;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursorDot.style.left = mx + 'px';
      cursorDot.style.top  = my + 'px';
    }, { passive: true });

    document.addEventListener('mousedown', () => cursorDot.classList.add('clicking'));
    document.addEventListener('mouseup',   () => cursorDot.classList.remove('clicking'));

    // Image reveal element — sits inside the lagging ring
    const cursorImg = document.createElement('div');
    cursorImg.className = 'cursor-image';
    cursorImg.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorImg);

    (function trackRing() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
      cursorImg.style.left  = rx + 'px';
      cursorImg.style.top   = ry + 'px';
      requestAnimationFrame(trackRing);
    })();

    document.querySelectorAll('a, button, .cat-card, .product-card, .gallery-thumb, .nav-toggle').forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovered'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovered'));
    });

    // Product card image reveal
    document.querySelectorAll('.product-card').forEach(card => {
      const img = card.querySelector('.product-img-wrap img');
      if (!img) return;
      card.addEventListener('mouseenter', () => {
        cursorImg.style.backgroundImage = `url(${img.src})`;
        cursorImg.classList.add('visible');
        cursorRing.classList.add('image-mode');
      });
      card.addEventListener('mouseleave', () => {
        cursorImg.classList.remove('visible');
        cursorRing.classList.remove('image-mode');
      });
    });

    // Category card image reveal
    document.querySelectorAll('.cat-card').forEach(card => {
      const imgEl = card.querySelector('.cat-card-img');
      if (!imgEl) return;
      const bg = window.getComputedStyle(imgEl).backgroundImage;
      if (!bg || bg === 'none') return;
      card.addEventListener('mouseenter', () => {
        cursorImg.style.backgroundImage = bg;
        cursorImg.classList.add('visible');
        cursorRing.classList.add('image-mode');
      });
      card.addEventListener('mouseleave', () => {
        cursorImg.classList.remove('visible');
        cursorRing.classList.remove('image-mode');
      });
    });
  }

  // ── Hero mouse parallax ──────────────────────────────
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg && !window.matchMedia('(pointer:coarse)').matches) {
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      heroBg.style.transform = `scale(1.08) translate(${x}px,${y}px)`;
    }, { passive: true });
  }

  // ── Magnetic buttons ─────────────────────────────────
  if (!window.matchMedia('(pointer:coarse)').matches) {
    document.querySelectorAll('.btn-gold, .btn-primary').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'transform 0.18s var(--ease), background 0.25s, border-color 0.25s';
      });
      btn.addEventListener('mousemove', e => {
        const r  = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width  / 2)) * 0.3;
        const dy = (e.clientY - (r.top  + r.height / 2)) * 0.3;
        btn.style.transform = `translate(${dx}px,${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), background 0.25s, border-color 0.25s';
        btn.style.transform = '';
        setTimeout(() => { btn.style.transition = ''; }, 560);
      });
    });
  }

  // ── Hero canvas particles ─────────────────────────────
  const heroSec = document.querySelector('.hero');
  if (heroSec) {
    const hc = document.createElement('canvas');
    hc.className = 'hero-particles';
    hc.setAttribute('aria-hidden', 'true');
    heroSec.insertBefore(hc, heroSec.querySelector('.hero-content'));
    const hx = hc.getContext('2d');

    const resizeHC = () => {
      hc.width  = heroSec.offsetWidth;
      hc.height = heroSec.offsetHeight;
    };
    resizeHC();
    window.addEventListener('resize', resizeHC, { passive: true });

    let hmx = hc.width / 2, hmy = hc.height / 2;
    heroSec.addEventListener('mousemove', e => { hmx = e.clientX; hmy = e.clientY; }, { passive: true });

    const hpts = Array.from({ length: 68 }, () => ({
      x:    Math.random() * (heroSec.offsetWidth  || 1200),
      y:    Math.random() * (heroSec.offsetHeight || 800),
      vx:   (Math.random() - 0.5) * 0.22,
      vy:   -(0.06 + Math.random() * 0.2),
      r:    0.4 + Math.random() * 1.6,
      a:    0.06 + Math.random() * 0.32,
      da:   (Math.random() - 0.5) * 0.007,
      gold: Math.random() > 0.62,
    }));

    (function hloop() {
      hx.clearRect(0, 0, hc.width, hc.height);
      hpts.forEach(p => {
        const ddx  = hmx - p.x, ddy = hmy - p.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        if (dist < 220) { p.vx += ddx / dist * 0.006; p.vy += ddy / dist * 0.006; }
        p.vx *= 0.988; p.vy *= 0.988;
        p.vy -= 0.0015;
        p.x  += p.vx;  p.y += p.vy;
        p.a  += p.da;
        if (p.a < 0.05 || p.a > 0.42) p.da *= -1;
        if (p.y < -5)              p.y = hc.height + 5;
        if (p.x < -5)              p.x = hc.width  + 5;
        if (p.x > hc.width + 5)   p.x = -5;
        hx.beginPath();
        hx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        hx.fillStyle    = p.gold ? '#C4A040' : '#3D7A50';
        hx.globalAlpha  = p.a;
        hx.fill();
      });
      hx.globalAlpha = 1;
      requestAnimationFrame(hloop);
    })();
  }

  // ── 3D perspective card tilt ──────────────────────────
  if (!window.matchMedia('(pointer:coarse)').matches) {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.12s ease, border-color 0.3s';
      });
      card.addEventListener('mousemove', e => {
        const r    = card.getBoundingClientRect();
        const xPct = (e.clientX - r.left)  / r.width  - 0.5;
        const yPct = (e.clientY - r.top)   / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${-yPct * 9}deg) rotateY(${xPct * 9}deg) translateY(-4px) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s';
        card.style.transform  = '';
      });
    });
  }

  // ── Footer year ──────────────────────────────────────────────
  const fy = document.getElementById('footerYear');
  if (fy) fy.textContent = new Date().getFullYear();

  // ── Dynamic years in business ────────────────────────────────
  const yearsInBiz = new Date().getFullYear() - 1987;
  document.querySelectorAll('.years-in-biz').forEach(el => {
    el.textContent = yearsInBiz;
  });
  const yearsCountEl = document.querySelector('[data-years-from="1987"]');
  if (yearsCountEl) {
    yearsCountEl.dataset.count = yearsInBiz;
    yearsCountEl.textContent   = yearsInBiz;
  }

  // ── Toast (used by cart) ─────────────────────────────────────
  let _toastTimer;
  window.showMFToast = function(msg) {
    let toast = document.getElementById('cartToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cartToast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('visible'), 2000);
  };

  // ── btn-wish SKU routing ──────────────────────────────────────
  document.querySelectorAll('.product-card').forEach(card => {
    const sku     = card.querySelector('.product-sku')?.textContent?.trim();
    const wishBtn = card.querySelector('.btn-wish');
    if (wishBtn && sku) {
      wishBtn.setAttribute('href', `product.html?sku=${sku}`);
      wishBtn.setAttribute('aria-label', 'View details');
    }
  });

  // ── Scroll-to-top button ─────────────────────────────────────
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── New Arrivals show more ────────────────────────────────────
  const showMoreBtn   = document.getElementById('newArrivalsShowMore');
  const arrivalsExtra = document.getElementById('newArrivalsExtra');
  if (showMoreBtn && arrivalsExtra) {
    showMoreBtn.addEventListener('click', () => {
      const expanded = arrivalsExtra.classList.toggle('expanded');
      showMoreBtn.textContent = expanded ? 'Show Less ↑' : 'Show More ↓';
    });
  }

  // ── Newsletter form ───────────────────────────────────────────
  const newsletterForm    = document.getElementById('newsletterForm');
  const newsletterSuccess = document.getElementById('newsletterSuccess');
  const newsletterError   = document.getElementById('newsletterError');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail')?.value?.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      newsletterError.style.display   = valid ? 'none' : 'block';
      newsletterSuccess.style.display = 'none';
      if (valid) {
        newsletterSuccess.style.display = 'block';
        newsletterForm.querySelector('input').value = '';
      }
    });
  }

  // ── Page transitions ──────────────────────────────────
  const ptOverlay = document.createElement('div');
  ptOverlay.className = 'page-transition-overlay active';
  ptOverlay.setAttribute('aria-hidden', 'true');
  document.body.prepend(ptOverlay);

  // Double rAF ensures the browser paints the active state before we remove it
  requestAnimationFrame(() => requestAnimationFrame(() => ptOverlay.classList.remove('active')));

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href
      || href.startsWith('#')
      || href.startsWith('http')
      || href.startsWith('mailto')
      || href.startsWith('tel')
      || link.target === '_blank'
      || link.hasAttribute('download')) return;
    e.preventDefault();
    ptOverlay.classList.add('active');
    setTimeout(() => { window.location.href = href; }, 420);
  });

});
