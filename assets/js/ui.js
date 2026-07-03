// ── SHARED UI LOGIC (secure: no inline handlers, no innerHTML with user data) ──
(function () {
    'use strict';

    // ── Theme Toggle ─────────────────────────────────────────────
    const themeBtn = document.getElementById('theme-toggle');
    const DARK_LABEL = '☀️ दिन';   // shown while dark (click for day)
    const LIGHT_LABEL = '🌙 रात'; // shown while light (click for night)

    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        if (themeBtn) themeBtn.textContent = theme === 'light' ? LIGHT_LABEL : DARK_LABEL;
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            // spacetime warp: stretch toward center, then snap back
            document.body.classList.remove('theme-warp');
            void document.body.offsetWidth; // restart animation
            document.body.classList.add('theme-warp');
            setTimeout(function () { document.body.classList.remove('theme-warp'); }, 450);
            applyTheme(next);
            try { localStorage.setItem('theme_v2', next); } catch (e) { /* private mode */ }
        });
        let saved = null;
        try { saved = localStorage.getItem('theme_v2'); } catch (e) { /* ignore */ }
        if (saved === 'light' || saved === 'dark') {
            applyTheme(saved);
        } else {
            applyTheme('dark'); // original dark space theme is the default
        }
    }

    // ── Hamburger Mobile Menu ────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.toggle('open');
            hamburger.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-label', isOpen ? 'मेनू बंद करें' : 'मेनू खोलें');
        });
        mobileMenu.addEventListener('click', function (e) {
            if (e.target.closest('a')) {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
            }
        });
    }

    // ── Search ───────────────────────────────────────────────────
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    if (searchBtn && searchInput) {
        const performSearch = function () {
            const query = searchInput.value.trim().slice(0, 80);
            if (query) {
                window.location.href = 'index.html?search=' + encodeURIComponent(query);
            }
        };
        searchBtn.addEventListener('click', function () {
            if (!searchInput.classList.contains('expanded')) {
                searchInput.classList.add('expanded');
                searchInput.focus();
            } else {
                performSearch();
            }
        });
        searchInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') performSearch();
        });
    }

    // ── Back to Top ──────────────────────────────────────────────
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            backToTopBtn.classList.toggle('visible', window.scrollY > 300);
        }, { passive: true });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Scroll-to buttons (e.g. nav "सदस्यता" → newsletter) ─────
    document.querySelectorAll('[data-scroll-to]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const target = document.getElementById(btn.getAttribute('data-scroll-to'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // ── Expandable cards (event delegation, no inline onclick) ──
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.read-more-btn');
        if (!btn) return;
        e.preventDefault();
        const card = btn.closest('.clickable-card, .led-card');
        const content = card && card.querySelector('.full-article-content');
        if (!content) return;
        const nowOpen = content.classList.toggle('open');
        btn.textContent = nowOpen ? 'कम दिखाएं ▲' : 'पूरा पढ़ें ▼';
    });


    // ── Card hover: spacetime ripple (concentric circles from cursor) ──
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('mouseenter', function (e) {
            const card = e.target.closest && e.target.closest('.clickable-card, .led-card');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const r = document.createElement('span');
            r.className = 'space-ripple';
            r.style.left = (e.clientX - rect.left) + 'px';
            r.style.top = (e.clientY - rect.top) + 'px';
            card.appendChild(r);
            setTimeout(function () { r.remove(); }, 700);
        }, true);
    }

    // ── Reveal on scroll / progress bars ─────────────────────────
    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) {
                const fill = en.target.querySelector('.progress-fill');
                if (fill) fill.style.width = fill.getAttribute('data-percent') || '0%';
                en.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.2 });
    document.querySelectorAll('.clickable-card, .section-title').forEach(function (el) {
        revealObserver.observe(el);
    });

    // ── Newsletter validation (classes, not inline styles) ──────
    const newsletterForm = document.querySelector('form[name="newsletter"]');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            const inp = this.querySelector('.newsletter-input');
            const btn = this.querySelector('.subscribe-btn');
            const val = inp ? inp.value.trim() : '';
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
            if (valid) {
                if (btn) { btn.textContent = 'धन्यवाद!'; btn.classList.add('btn-ok'); }
            } else {
                e.preventDefault();
                if (inp) {
                    inp.classList.add('input-error');
                    inp.placeholder = 'कृपया मान्य ईमेल लिखें';
                    setTimeout(function () { inp.classList.remove('input-error'); }, 2000);
                }
            }
        });
    }

    // ── Payment Modal (data attributes, validated settings) ─────
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        let settingsLoaded = false;

        function loadPaymentSettings() {
            if (settingsLoaded) return;
            settingsLoaded = true;
            fetch('content/settings.json')
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (settings) {
                    if (!settings || typeof settings !== 'object' || !settings.payments) return;
                    const upi = settings.payments.upi_id;
                    if (typeof upi !== 'string' || !upi || upi.length > 100) return;
                    const upiEl = document.getElementById('upi-id-display');
                    if (upiEl) upiEl.textContent = upi; // textContent = XSS-safe
                    const qrEl = document.getElementById('qr-display');
                    if (qrEl) {
                        let qrSrc = settings.payments.upi_qr;
                        if (typeof qrSrc !== 'string' || !/^https:\/\//.test(qrSrc)) {
                            qrSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
                                encodeURIComponent('upi://pay?pa=' + upi);
                        }
                        qrEl.src = qrSrc;
                        qrEl.hidden = false;
                    }
                })
                .catch(function () { /* payment info unavailable */ });
        }

        document.querySelectorAll('[data-open-payment]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                loadPaymentSettings();
                paymentModal.classList.add('open');
            });
        });
        document.querySelectorAll('[data-close-payment]').forEach(function (btn) {
            btn.addEventListener('click', function () { paymentModal.classList.remove('open'); });
        });
        paymentModal.addEventListener('click', function (e) {
            if (e.target === paymentModal) paymentModal.classList.remove('open');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') paymentModal.classList.remove('open');
        });
    }

    // ── Article share links (built from location, encoded) ──────
    const shareWA = document.getElementById('shareWA');
    const shareX = document.getElementById('shareX');
    if (shareWA || shareX) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        if (shareWA) shareWA.href = 'https://api.whatsapp.com/send?text=' + title + '%20' + url;
        if (shareX) shareX.href = 'https://twitter.com/intent/tweet?text=' + title + '&url=' + url;
    }

    // ── ADMIN BAR (Netlify Identity) ─────────────────────────────
    function initAdminBar() {
        if (!window.netlifyIdentity) return;
        const user = window.netlifyIdentity.currentUser();
        if (!user || document.querySelector('.admin-bar')) return;

        const bar = document.createElement('div');
        bar.className = 'admin-bar';

        function addBtn(text, href) {
            const a = document.createElement('a');
            a.className = 'admin-bar-btn';
            a.textContent = text;
            a.href = href;
            bar.appendChild(a);
        }
        function addDivider() {
            const d = document.createElement('div');
            d.className = 'admin-bar-divider';
            bar.appendChild(d);
        }

        addBtn('» DASHBOARD', '/admin');
        addDivider();
        addBtn('+ NEW ARTICLE', '/admin/#/collections/pages/new');
        addDivider();
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'admin-bar-btn';
        logoutBtn.type = 'button';
        logoutBtn.textContent = '⏻ LOGOUT';
        logoutBtn.addEventListener('click', function () { window.netlifyIdentity.logout(); });
        bar.appendChild(logoutBtn);

        document.body.prepend(bar);
    }

    function wireIdentity() {
        if (!window.netlifyIdentity) return;
        window.netlifyIdentity.on('init', function (user) {
            if (!user) {
                window.netlifyIdentity.on('login', function () { document.location.href = '/admin/'; });
            }
        });
        window.netlifyIdentity.on('login', function () {
            initAdminBar();
            window.netlifyIdentity.close();
        });
        window.netlifyIdentity.on('logout', function () {
            const bar = document.querySelector('.admin-bar');
            if (bar) bar.remove();
        });
        setTimeout(function () {
            const hash = window.location.hash;
            if (hash && (hash.indexOf('recovery_token') !== -1 || hash.indexOf('invite_token') !== -1)) {
                window.netlifyIdentity.open();
            }
        }, 800);
        initAdminBar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireIdentity);
    } else {
        wireIdentity();
    }
})();
