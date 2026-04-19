/* ============================================
   main.js — Shaydefy Studio v4
   ============================================ */
(function () {
  'use strict';

  /* ----------------------------------------
     YEAR
  ---------------------------------------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  var lenis = null;

  /* ----------------------------------------
     PRELOADER — dismiss then kick off hero
  ---------------------------------------- */
  var preloader = document.getElementById('preloader');

  function dismissPreloader() {
    if (!preloader) { revealHero(); return; }
    preloader.classList.add('out');
    preloader.addEventListener('transitionend', revealHero, { once: true });
    document.body.style.overflow = '';
  }

  var ready = false;
  function tryDismiss() {
    if (ready) return;
    ready = true;
    setTimeout(dismissPreloader, 1700);
  }

  window.addEventListener('load', tryDismiss);
  setTimeout(tryDismiss, 2200);

  /* ----------------------------------------
     HERO REVEAL — word clip animation
  ---------------------------------------- */
  function revealHero() {
    var words   = document.querySelectorAll('.hero-title .word');
    var eyebrow = document.querySelector('.hero-eyebrow');
    var rule    = document.querySelector('.hero-rule');
    var sub     = document.querySelector('.hero-sub');
    var actions = document.querySelector('.hero-actions');
    var aside   = document.querySelector('.hero-aside');
    var scroll  = document.querySelector('.hero-scroll-hint');

    if (typeof gsap !== 'undefined') {
      var tl = gsap.timeline({ onComplete: initScrollFeatures });

      tl.to(eyebrow, { opacity:1, y:0, duration:0.7, ease:'power2.out' }, 0);
      tl.to(rule,    { opacity:1, duration:0.6, ease:'power2.out' }, 0.2);
      tl.to(words,   { y:'0%', duration:1.0, stagger:0.12, ease:'power4.out' }, 0.15);
      tl.to(sub,     { opacity:1, y:0, duration:0.8, ease:'power2.out' }, 0.55);
      tl.to(actions, { opacity:1, y:0, duration:0.7, ease:'power2.out' }, 0.72);
      tl.to(aside,   { opacity:1, y:0, duration:0.8, ease:'power2.out' }, 0.6);
      tl.to(scroll,  { opacity:1, duration:0.6, ease:'power2.out' }, 1.1);

    } else {
      [eyebrow, rule, sub, actions, aside, scroll].forEach(function (el) {
        if (el) el.style.opacity = '1';
      });
      words.forEach(function (w) { w.style.transform = 'translateY(0)'; });
      initScrollFeatures();
    }
  }

  /* ----------------------------------------
     SCROLL PROGRESS
  ---------------------------------------- */
  var bar = document.getElementById('scrollProgress');
  function updateBar() {
    if (!bar) return;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0) bar.style.width = (window.scrollY / total * 100) + '%';
  }
  window.addEventListener('scroll', updateBar, { passive: true });

  /* ----------------------------------------
     NAVBAR scroll state
  ---------------------------------------- */
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateBar();
  }, { passive: true });

  /* ----------------------------------------
     MOBILE NAV TOGGLE
  ---------------------------------------- */
  var navMenu   = document.getElementById('navMenu');
  var navToggle = document.getElementById('navToggle');
  var isOpen    = false;

  function setMenu(open) {
    isOpen = open;
    if (navMenu)   navMenu.classList.toggle('open', open);
    if (navToggle) navToggle.parentElement.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (navToggle) navToggle.addEventListener('click', function () { setMenu(!isOpen); });
  if (navMenu) navMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ----------------------------------------
     ACTIVE NAV LINK + SECTION INDICATOR
  ---------------------------------------- */
  var sectionIndicator = document.getElementById('sectionIndicator');
  var sectionNum       = document.getElementById('sectionNum');
  var sectionLabel     = document.getElementById('sectionLabel');
  var trackedSections  = document.querySelectorAll('[data-section-label]');
  var navLinks         = document.querySelectorAll('.nav-menu a[href^="#"]');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;

      // Nav active state
      navLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });

      // Section indicator
      var label = e.target.getAttribute('data-section-label');
      var num   = e.target.getAttribute('data-section-num');
      if (label && sectionNum && sectionLabel) {
        sectionNum.textContent   = num;
        sectionLabel.textContent = label;
        if (sectionIndicator) sectionIndicator.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[id]').forEach(function (s) { io.observe(s); });

  /* ----------------------------------------
     SCROLL REVEAL — data-reveal elements
     Work cards stagger left-to-right in grid
  ---------------------------------------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        ro.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Work cards in grid get staggered delay
  var workCards = document.querySelectorAll('.work-grid .work-card');
  workCards.forEach(function (card, i) {
    card.style.transitionDelay = (i % 3) * 0.1 + 's';
  });

  reveals.forEach(function (el) { ro.observe(el); });

  /* ----------------------------------------
     SPOTLIGHT GLOW — work cards
  ---------------------------------------- */
  document.querySelectorAll('.work-card').forEach(function (card) {
    var img = card.querySelector('.work-card-img');
    card.addEventListener('mousemove', function (e) {
      if (!img) return;
      var r = img.getBoundingClientRect();
      img.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      img.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  /* ----------------------------------------
     CURSOR PREVIEW — work cards
  ---------------------------------------- */
  (function () {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var preview = document.getElementById('cursorPreview');
    var previewImg = document.getElementById('cursorPreviewImg');
    if (!preview || !previewImg) return;

    var px = 0, py = 0, cx = 0, cy = 0;
    var active = false;

    document.addEventListener('mousemove', function (e) {
      px = e.clientX; py = e.clientY;
    }, { passive: true });

    (function loop() {
      requestAnimationFrame(loop);
      cx += (px - cx) * 0.1;
      cy += (py - cy) * 0.1;
      preview.style.transform = 'translate(' + (cx + 20) + 'px,' + (cy - 70) + 'px)';
    })();

    document.querySelectorAll('.work-card[data-preview]').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        previewImg.style.backgroundImage = "url('" + card.getAttribute('data-preview') + "')";
        preview.classList.add('active');
        active = true;
      });
      card.addEventListener('mouseleave', function () {
        preview.classList.remove('active');
        active = false;
      });
    });
  })();

  /* ----------------------------------------
     LIQUID CURSOR BLOB
  ---------------------------------------- */
  (function () {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var el = document.createElement('div');
    el.className = 'cursor';
    el.innerHTML = '<div class="cursor-dot"></div>';
    document.body.appendChild(el);
    var dot = el.querySelector('.cursor-dot');
    document.documentElement.classList.add('cursor-on');

    var mx=0,my=0,cx=0,cy=0,px=0,py=0;
    var hovering = false;
    el.style.opacity = '0';

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      el.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    document.addEventListener('mouseover', function (e) {
      hovering = !!e.target.closest('a,button,[role="button"]');
      dot.classList.toggle('big', hovering);
    });

    (function loop() {
      requestAnimationFrame(loop);
      px = cx; py = cy;
      cx += (mx - cx) * 0.13;
      cy += (my - cy) * 0.13;
      var vx = cx - px, vy = cy - py;
      var spd = Math.sqrt(vx*vx + vy*vy);
      var str = Math.min(spd * 0.18, 1.6);
      var sx  = hovering ? 1 : 1 + str;
      var sy  = hovering ? 1 : Math.max(0.5, 1/(1 + str*0.55));
      var ang = (!hovering && spd > 0.3) ? Math.atan2(vy,vx)*(180/Math.PI) : 0;
      el.style.transform  = 'translate(' + cx + 'px,' + cy + 'px)';
      dot.style.transform = 'translate(-50%,-50%) rotate(' + ang + 'deg) scaleX(' + sx + ') scaleY(' + sy + ')';
    })();
  })();

  /* ----------------------------------------
     CLICK SHOCKWAVE
  ---------------------------------------- */
  document.addEventListener('click', function (e) {
    var r = document.createElement('span');
    r.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
      'width:0;height:0;border-radius:50%;border:1px solid rgba(201,168,76,0.6);' +
      'transform:translate(-50%,-50%);pointer-events:none;z-index:9997;' +
      'transition:width 0.55s ease,height 0.55s ease,opacity 0.55s ease;opacity:1;';
    document.body.appendChild(r);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        r.style.width = '72px'; r.style.height = '72px'; r.style.opacity = '0';
      });
    });
    setTimeout(function () { r.remove(); }, 600);
  });

  /* ----------------------------------------
     PAGE TRANSITION CURTAIN
  ---------------------------------------- */
  (function () {
    var c = document.getElementById('pageCurtain');
    if (!c) return;

    if (sessionStorage.getItem('curtainEntry')) {
      sessionStorage.removeItem('curtainEntry');
      c.classList.add('in');
      c.style.transition = 'none';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          c.style.transition = '';
          c.classList.replace('in','out');
          c.addEventListener('transitionend', function () {
            c.style.pointerEvents = 'none';
          }, { once: true });
        });
      });
    }

    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h.startsWith('#') || h.startsWith('http') ||
          h.startsWith('//') || h.startsWith('mailto') || h.startsWith('tel')) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.setItem('curtainEntry','1');
        c.classList.remove('out'); c.classList.add('in');
        c.style.transition = '';
        setTimeout(function () { window.location.href = h; }, 560);
      });
    });
  })();

  /* ----------------------------------------
     SMOOTH ANCHOR SCROLL
  ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(t, { offset: -72, duration: 1.2 });
      } else {
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     SCROLL-DRIVEN FEATURES (GSAP ScrollTrigger)
  ---------------------------------------- */
  function initScrollFeatures() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* -- Hero title parallax on scroll -- */
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      gsap.to(heroTitle, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* -- Process line scrub -- */
    var processLine    = document.getElementById('processLineFill');
    var processSection = document.querySelector('.process-section');
    if (processLine && processSection) {
      gsap.to(processLine, {
        scaleX: 1, ease: 'none',
        scrollTrigger: {
          trigger: processSection,
          start: 'top 65%',
          end: 'top 15%',
          scrub: 0.8
        }
      });
    }

    /* -- Featured card parallax -- */
    var featuredImg = document.querySelector('.work-featured-img');
    if (featuredImg) {
      gsap.to(featuredImg, {
        yPercent: 18, ease: 'none',
        scrollTrigger: {
          trigger: '.work-featured',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* -- Counter animations -- */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var obj    = { val: 0 };

      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target, duration: 1.6, ease: 'power2.out',
            snap: { val: 1 },
            onUpdate: function () {
              el.textContent = Math.round(obj.val) + suffix;
            }
          });
        }
      });
    });

    /* -- Magnetic buttons -- */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('[data-magnetic]').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width  / 2) * 0.28;
          var y = (e.clientY - r.top  - r.height / 2) * 0.28;
          gsap.to(el, { x: x, y: y, duration: 0.45, ease: 'power2.out', overwrite: true });
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: true });
        });
      });
    }
  }

  /* ----------------------------------------
     CONTACT FORM — Formspree
  ---------------------------------------- */
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('contactSuccess');

  if (form && success) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn  = form.querySelector('button[type="submit"]');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        if (res.ok) {
          form.style.transition = 'opacity 0.4s';
          form.style.opacity = '0';
          setTimeout(function () {
            form.style.display = 'none';
            success.classList.add('show');
          }, 400);
        } else {
          btn.textContent = orig;
          btn.disabled = false;
          alert('Something went wrong. Please email hello@shaydefy.com directly.');
        }
      })
      .catch(function () {
        btn.textContent = orig;
        btn.disabled = false;
        alert('Something went wrong. Please email hello@shaydefy.com directly.');
      });
    });
  }

})();
