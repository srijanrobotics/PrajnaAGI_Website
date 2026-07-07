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
            applyTheme('light'); // Day mode is the default
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
    (function wireShare() {
        const shareWA = document.getElementById('shareWA');
        const shareX = document.getElementById('shareX');
        const shareFB = document.getElementById('shareFB');
        const shareTG = document.getElementById('shareTG');
        const shareCopy = document.getElementById('shareCopy');
        const shareNative = document.getElementById('shareNative');
        if (!shareWA && !shareX && !shareCopy) return;

        const rawUrl = window.location.href;
        const rawTitle = document.title;
        const url = encodeURIComponent(rawUrl);
        const title = encodeURIComponent(rawTitle);

        if (shareWA) shareWA.href = 'https://api.whatsapp.com/send?text=' + title + '%20' + url;
        if (shareX) shareX.href = 'https://twitter.com/intent/tweet?text=' + title + '&url=' + url;
        if (shareFB) shareFB.href = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
        if (shareTG) shareTG.href = 'https://t.me/share/url?url=' + url + '&text=' + title;
        [shareWA, shareX, shareFB, shareTG].forEach(function (a) { if (a) a.target = '_blank'; });

        if (shareCopy) {
            shareCopy.addEventListener('click', function () {
                const done = function () {
                    const old = shareCopy.getAttribute('title');
                    shareCopy.classList.add('copied');
                    shareCopy.setAttribute('title', 'कॉपी हो गया!');
                    setTimeout(function () {
                        shareCopy.classList.remove('copied');
                        shareCopy.setAttribute('title', old || 'लिंक कॉपी करें');
                    }, 1500);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(rawUrl).then(done).catch(done);
                } else {
                    const t = document.createElement('textarea');
                    t.value = rawUrl; document.body.appendChild(t); t.select();
                    try { document.execCommand('copy'); } catch (e) {}
                    document.body.removeChild(t); done();
                }
            });
        }

        // native share sheet (phones) — reveal only if supported
        if (shareNative && navigator.share) {
            shareNative.hidden = false;
            shareNative.addEventListener('click', function () {
                navigator.share({ title: rawTitle, url: rawUrl }).catch(function () {});
            });
        }
    })();

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

// ── REAL VISITOR COUNTER ────────────────────────────────────────────────────
// Counts every browser once (localStorage flag) via /api/visitors (Netlify
// Blobs). Renders the live total in Hindi units: सौ / हजार / लाख.
(function () {
    'use strict';

    function hindiCount(n) {
        function trim1(v) {
            const s = (Math.round(v * 10) / 10).toFixed(1);
            return s.endsWith('.0') ? s.slice(0, -2) : s;
        }
        if (n >= 10000000) return trim1(n / 10000000) + ' करोड़+';
        if (n >= 100000) return trim1(n / 100000) + ' लाख+';
        if (n >= 1000) return trim1(n / 1000) + ' हजार+';
        if (n >= 100) return Math.floor(n / 100) + ' सौ+';
        return String(n);
    }

    let first = false;
    try { first = !localStorage.getItem('prajnaVisited'); } catch (e) { /* private mode */ }

    fetch('/api/visitors' + (first ? '?hit=1' : ''))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            if (first) { try { localStorage.setItem('prajnaVisited', '1'); } catch (e) {} }
            const p = document.getElementById('visitorCount');
            if (!p || !data || typeof data.count !== 'number' || data.count < 1) return;
            p.textContent = hindiCount(data.count) + (p.dataset.suffix || ' पाठक पहले से जुड़े हैं।');
        })
        .catch(function () { /* offline/local — keep fallback text */ });

    // ── SUPPORT MODAL: rupees rising upward (secure, celebratory) ──
    (function rupeeRain() {
        const canvas = document.querySelector('.rupee-rain');
        const modal = document.getElementById('paymentModal');
        if (!canvas || !modal) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = canvas.getContext('2d');
        let W = 0, H = 0, coins = [], raf = null;

        function size() {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            W = r.width; H = r.height;
            canvas.width = W * dpr; canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        function spawn() {
            return {
                x: Math.random() * W,
                y: H + Math.random() * H,
                s: 10 + Math.random() * 14,          // font size
                v: 0.5 + Math.random() * 1.3,        // upward speed
                a: 0.25 + Math.random() * 0.5,       // opacity
                drift: (Math.random() - 0.5) * 0.4
            };
        }
        function start() {
            size();
            coins = Array.from({ length: Math.round(W / 14) }, spawn);
            cancelAnimationFrame(raf);
            (function frame() {
                ctx.clearRect(0, 0, W, H);
                ctx.font = '700 14px system-ui, sans-serif';
                ctx.textAlign = 'center';
                coins.forEach(function (c) {
                    c.y -= c.v; c.x += c.drift;
                    if (c.y < -20) { Object.assign(c, spawn()); c.y = H + 10; }
                    ctx.font = '700 ' + c.s + 'px system-ui, sans-serif';
                    ctx.fillStyle = 'rgba(255, 200, 40,' + c.a + ')';
                    ctx.fillText('₹', c.x, c.y);
                });
                raf = requestAnimationFrame(frame);
            })();
        }
        function stop() { cancelAnimationFrame(raf); }

        // run only while the modal is open (class 'open')
        const obs = new MutationObserver(function () {
            if (modal.classList.contains('open')) start(); else stop();
        });
        obs.observe(modal, { attributes: true, attributeFilter: ['class'] });
        window.addEventListener('resize', function () { if (modal.classList.contains('open')) start(); });
    })();

    // ── WEBSITE PAUSE OVERLAY ──
    (function () {
        var overlay = document.createElement('div');
        overlay.id = 'maintenance-overlay';
        overlay.className = 'maintenance-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');

        var card = document.createElement('div');
        card.className = 'maintenance-card';

        var quote = document.createElement('div');
        quote.className = 'maintenance-quote';
        
        var p1 = document.createElement('p');
        p1.textContent = 'संभाव्यता के';
        var p2 = document.createElement('p');
        p2.textContent = 'विशाल महासागर में';
        var p3 = document.createElement('p');
        p3.textContent = 'अपरिहार्य-सा द्वीप, संयोग।';

        var spacer = document.createElement('div');
        spacer.className = 'quote-break';

        var p4 = document.createElement('p');
        p4.textContent = 'जहां';
        var p5 = document.createElement('p');
        p5.textContent = 'असंभव प्रतीत होने वाली';
        var p6 = document.createElement('p');
        p6.textContent = 'घटनाएं वास्तव में अनिवार्य हैं।';

        quote.appendChild(p1);
        quote.appendChild(p2);
        quote.appendChild(p3);
        quote.appendChild(spacer);
        quote.appendChild(p4);
        quote.appendChild(p5);
        quote.appendChild(p6);

        var divider = document.createElement('div');
        divider.className = 'maintenance-divider';

        var footer = document.createElement('div');
        footer.className = 'maintenance-footer';
        
        var codeTag = document.createElement('span');
        codeTag.className = 'code-tag';
        codeTag.textContent = '</>';
        
        var footerText = document.createTextNode(' वेबसाईट निर्माणाधीन, जल्द उपलब्ध होगी। कष्ट के लिए खेद आदि।');
        
        footer.appendChild(codeTag);
        footer.appendChild(footerText);

        card.appendChild(quote);
        card.appendChild(divider);
        card.appendChild(footer);
        overlay.appendChild(card);

        function injectOverlay() {
            if (document.body) {
                document.body.classList.add('site-paused');
                document.body.appendChild(overlay);
            } else {
                setTimeout(injectOverlay, 10);
            }
        }
        // injectOverlay(); // Uncomment to enable maintenance mode
    })();
})();

