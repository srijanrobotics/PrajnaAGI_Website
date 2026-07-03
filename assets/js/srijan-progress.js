// ── SRIJAN MISSION CONTROL ──────────────────────────────────────────────────
// Driven entirely by content/progress.json:
//  1. Telemetry HUD strip under the nav (PRAJNA vX · VISION: ONLINE · ...)
//  2. Scroll-linked spine: fill grows with scroll, milestones "ignite"
//     exactly when the gold tip reaches their dot (capped at overall %)
//  3. Spec-sheet footers injected into milestone cards (status/stack/bars)
//  4. Odometer counter 0→N% with SVG progress ring
// All DOM built with createElement/textContent. Reduced-motion safe.
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function el(tag, className, text) {
        const n = document.createElement(tag);
        if (className) n.className = className;
        if (text !== undefined) n.textContent = text;
        return n;
    }

    fetch('content/progress.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
            if (!data || typeof data !== 'object') return;
            buildHUD(data);
            buildSpecSheets(data);
            buildCounter(data);
            wireScrollSpine(data);
        })
        .catch(function (e) { console.error('[SRIJAN] progress.json:', e); });

    // ── 1. TELEMETRY HUD ─────────────────────────────────────────
    function buildHUD(data) {
        const nav = document.querySelector('nav');
        if (!nav) return;
        const hud = el('div', 'srijan-hud');
        const inner = el('div', 'srijan-hud-inner');

        inner.appendChild(el('span', 'hud-item hud-version', String(data.version || 'PRAJNA')));

        (Array.isArray(data.systems) ? data.systems : []).forEach(function (sys) {
            if (!sys || typeof sys.label !== 'string') return;
            const item = el('span', 'hud-item');
            item.appendChild(document.createTextNode(sys.label + ': '));
            const st = String(sys.status || '');
            const stEl = el('b', 'hud-status hud-' + st.toLowerCase().replace(/[^a-z]/g, ''), st);
            item.appendChild(stEl);
            inner.appendChild(item);
        });

        // uptime in days since project start
        if (data.since) {
            const days = Math.max(0, Math.floor((Date.now() - new Date(data.since)) / 86400000));
            inner.appendChild(el('span', 'hud-item', 'UPTIME ' + days + 'd'));
        }
        if (data.log) inner.appendChild(el('span', 'hud-item', 'LOG #' + data.log));

        hud.appendChild(inner);
        nav.insertAdjacentElement('afterend', hud);
    }

    // ── 3. SPEC-SHEET FOOTERS ────────────────────────────────────
    function buildSpecSheets(data) {
        const cards = document.querySelectorAll('.srijan-timeline .milestone');
        const specs = Array.isArray(data.milestones) ? data.milestones : [];
        cards.forEach(function (card, i) {
            const spec = specs[i];
            const body = card.querySelector('.milestone-card');
            if (!spec || !body) return;

            const foot = el('div', 'milestone-spec');

            const col1 = el('div', 'spec-col');
            col1.appendChild(el('span', 'spec-key', 'STATUS'));
            col1.appendChild(el('span', 'spec-val spec-' +
                String(spec.status || '').toLowerCase().replace(/[^a-z]/g, ''),
                String(spec.status || '—')));
            foot.appendChild(col1);

            const col2 = el('div', 'spec-col');
            col2.appendChild(el('span', 'spec-key', 'STACK'));
            col2.appendChild(el('span', 'spec-val', String(spec.stack || '—')));
            foot.appendChild(col2);

            const col3 = el('div', 'spec-col spec-col--bars');
            (Array.isArray(spec.bars) ? spec.bars : []).forEach(function (bar) {
                if (!bar || typeof bar.label !== 'string') return;
                const row = el('div', 'spec-bar-row');
                row.appendChild(el('span', 'spec-bar-label', bar.label));
                const track = el('span', 'spec-bar-track');
                const fill = el('span', 'spec-bar-fill');
                const pct = Math.max(0, Math.min(100, Number(bar.pct) || 0));
                fill.style.width = pct + '%';
                track.appendChild(fill);
                row.appendChild(track);
                row.appendChild(el('span', 'spec-bar-pct', pct + '%'));
                col3.appendChild(row);
            });
            foot.appendChild(col3);

            body.appendChild(foot);
        });
    }

    // ── 4. ODOMETER COUNTER + RING ───────────────────────────────
    function buildCounter(data) {
        const chip = document.querySelector('.srijan-progress-label');
        const numEl = document.querySelector('.srijan-progress-num');
        if (!chip || !numEl) return;
        const target = Math.max(0, Math.min(100, Number(data.overall) || 0));

        // SVG ring before the number (r=17, C = 2πr ≈ 106.81)
        const NS = 'http://www.w3.org/2000/svg';
        const C = 2 * Math.PI * 17;
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 44 44');
        svg.setAttribute('class', 'progress-ring');
        svg.setAttribute('aria-hidden', 'true');
        const track = document.createElementNS(NS, 'circle');
        track.setAttribute('cx', '22'); track.setAttribute('cy', '22'); track.setAttribute('r', '17');
        track.setAttribute('class', 'ring-track');
        const arc = document.createElementNS(NS, 'circle');
        arc.setAttribute('cx', '22'); arc.setAttribute('cy', '22'); arc.setAttribute('r', '17');
        arc.setAttribute('class', 'ring-arc');
        arc.style.strokeDasharray = C;
        arc.style.strokeDashoffset = C;
        svg.appendChild(track);
        svg.appendChild(arc);
        chip.insertBefore(svg, chip.firstChild);

        function run() {
            if (reduceMotion) {
                numEl.textContent = target + '%';
                arc.style.strokeDashoffset = C * (1 - target / 100);
                return;
            }
            const t0 = performance.now(), dur = 1400;
            (function step(now) {
                const p = Math.min(1, (now - t0) / dur);
                const ease = 1 - Math.pow(1 - p, 3);              // easeOutCubic
                numEl.textContent = Math.round(target * ease) + '%';
                arc.style.strokeDashoffset = C * (1 - (target * ease) / 100);
                if (p < 1) requestAnimationFrame(step);
            })(t0);
        }

        new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { run(); obs.disconnect(); }
            });
        }, { threshold: 0.6 }).observe(chip);
    }

    // ── 2. SCROLL-LINKED SPINE + MILESTONE IGNITION ──────────────
    function wireScrollSpine(data) {
        const timeline = document.querySelector('.srijan-timeline');
        const fill = document.querySelector('.srijan-spine-fill');
        if (!timeline || !fill) return;
        fill.classList.add('js-driven');                          // disable CSS-only animation

        const milestones = Array.prototype.slice.call(
            timeline.querySelectorAll('.milestone'));
        const current = timeline.querySelector('.milestone.current');

        // cap: fill may never grow past the current milestone's dot
        function capPx() {
            if (!current) return timeline.offsetHeight;
            return current.offsetTop + 24;                        // dot center
        }

        function update() {
            const rect = timeline.getBoundingClientRect();
            const vh = window.innerHeight;
            // progress: 0 when timeline top hits 75% of viewport,
            // 1 when timeline bottom passes 45% of viewport
            const total = rect.height + vh * 0.3;
            const passed = vh * 0.75 - rect.top;
            const p = Math.max(0, Math.min(1, passed / total));
            const px = Math.min(capPx(), p * timeline.offsetHeight * 1.15);
            fill.style.height = px + 'px';

            milestones.forEach(function (m) {
                m.classList.toggle('lit', m.offsetTop + 20 <= px);
            });
        }

        if (reduceMotion) {
            fill.style.height = capPx() + 'px';
            milestones.forEach(function (m) { m.classList.add('lit'); });
            return;
        }
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
    }
})();
