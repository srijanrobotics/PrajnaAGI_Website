// ── SRIJAN TEASER: THE RISING LINE ──────────────────────────────────────────
// One thin black line rising from the bottom of the viewport, swaying gently
// like incense smoke and dissolving/blurring away near its upper end.
// Meditative, restrained. This page does not use the LED field.
(function () {
    'use strict';

    const canvas = document.getElementById('smokeCanvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS fallback shows a static line

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, t = 0;

    function resize() {
        // DPR-aware sizing: crisp & correctly positioned on desktop/hi-DPI.
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        w = Math.round(rect.width);
        h = Math.round(rect.height);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    // re-measure after layout/fonts settle (fixes wrong desktop sizing on load)
    window.addEventListener('load', resize);
    resize();

    // The line is drawn as many short segments; each higher segment
    // sways more and fades more — smoke dispersing.
    const SEGMENTS = 140;

    function draw() {
        t += 0.006;
        ctx.clearRect(0, 0, w, h);

        const baseX = w / 2;
        const topY = h * 0.16;          // where the line fully dissolves
        const bottomY = h;

        let prevX = baseX, prevY = bottomY;

        for (let i = 1; i <= SEGMENTS; i++) {
            const p = i / SEGMENTS;                       // 0 bottom → 1 top
            const y = bottomY - p * (bottomY - topY);

            // sway grows with height; two slow sine waves layered = organic drift
            const sway =
                Math.sin(t * 1.7 + p * 5.2) * 26 * p * p +
                Math.sin(t * 0.9 + p * 11.0) * 12 * p * p * p;
            const x = baseX + sway;

            // opacity: solid at the base, dissolving at the top
            const alpha = Math.max(0, 0.85 * (1 - p * p));
            // width: thin, thinner still as it rises
            const lw = Math.max(0.4, 1.6 * (1 - p * 0.7));
            // soft glow via shadowBlur that increases with height (smoke blur)
            const blur = 2 + p * 14;

            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(17, 17, 17, ' + alpha.toFixed(3) + ')';
            ctx.lineWidth = lw;
            ctx.shadowColor = 'rgba(17, 17, 17, ' + (alpha * 0.6).toFixed(3) + ')';
            ctx.shadowBlur = blur;
            ctx.lineCap = 'round';
            ctx.stroke();

            prevX = x; prevY = y;
        }

        // faint drifting wisps detaching near the top
        for (let k = 0; k < 3; k++) {
            const wp = ((t * 0.05 + k * 0.33) % 1);
            const wy = topY + 40 - wp * 90;
            const wx = baseX + Math.sin(t * 1.3 + k * 2.1) * (30 + k * 14);
            const wa = Math.max(0, 0.12 * (1 - wp));
            ctx.beginPath();
            ctx.arc(wx, wy, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(17,17,17,' + wa.toFixed(3) + ')';
            ctx.shadowColor = 'rgba(17,17,17,' + wa.toFixed(3) + ')';
            ctx.shadowBlur = 8;
            ctx.fill();
        }

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
})();
