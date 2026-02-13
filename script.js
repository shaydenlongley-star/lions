// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile nav when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
const isMobile = () => window.innerWidth <= 768;
window.addEventListener('scroll', () => {
    if (isMobile()) return;
    if (window.scrollY > 50) {
        navbar.style.padding = '12px 40px';
    } else {
        navbar.style.padding = '18px 40px';
    }
});

// Smooth reveal animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('scroll-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll(
    '.feature-card, .stat-card, .sponsor-card, .training-banner, .club-quote, ' +
    '.about-split, .value-card, .training-split, .about-hero, .about-join, ' +
    '.about-mission-overlay, .cta-section, .contact, .map-section, ' +
    '.features-header, .about h2, .about-text, .about-text-2, .sponsor-card-link'
).forEach((el, i) => {
    el.classList.add('scroll-hidden');
    el.style.transitionDelay = (i % 4) * 0.1 + 's';
    observer.observe(el);
});

// Scroll hash target to center of screen with yellow glow
if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('sponsor-highlight');
            setTimeout(() => {
                window.addEventListener('scroll', function removeGlow() {
                    target.classList.remove('sponsor-highlight');
                    history.replaceState(null, '', window.location.pathname);
                    window.removeEventListener('scroll', removeGlow);
                });
            }, 1000);
        }, 100);
    }
}

// Animated stat counters
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const prefix = el.dataset.prefix || '';
            const duration = 1500;
            const start = performance.now();

            function update(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = prefix + current + suffix;
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = prefix + target + suffix;
                }
            }
            requestAnimationFrame(update);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    counterObserver.observe(el);
});

// Contact form handler
function handleSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn');
    btn.textContent = 'Message Sent!';
    btn.style.background = '#4CAF50';
    btn.style.borderColor = '#4CAF50';
    btn.style.color = '#fff';
    e.target.reset();
    setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
    }, 3000);
}
