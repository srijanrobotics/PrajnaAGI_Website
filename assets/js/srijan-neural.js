// ── SRIJAN HERO: NEURAL NETWORK + EXPLODED ROBOT SCHEMATIC ──────────────────
// Left: engineering exploded-view of Srijan's body (head/neck/torso/arms),
// parts separated along the vertical assembly axis with leader lines and
// dimension ticks — like a technical drawing.
// Right: a mathematically-correct feed-forward network (layers 4-6-6-3):
// nodes at exact layer positions, complete bipartite edges between adjacent
// layers, and signal pulses travelling along the edges with activations
// lighting nodes as pulses arrive. Monochrome ink on white + one gold.
(function () {
    'use strict';

    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');

    const INK = '17,17,17';
    const GOLD = '138,109,0';
    let w = 0, h = 0, t = 0;

    // ── neural net definition (exact geometry) ──────────────────
    const LAYER_SIZES = [4, 6, 6, 3];
    let layers = [];      // [{x, nodes:[{x,y,act}]}]
    let pulses = [];      // {l, i, j, p, speed}

    function layout() {
        const stage = canvas.parentElement;
        w = canvas.width = stage.clientWidth;
        h = canvas.height = stage.clientHeight;

        // net occupies right side (58%..92% of width), vertically centered
        const x0 = w * 0.56, x1 = w * 0.92;
        const yTop = h * 0.22, yBot = h * 0.78;
        layers = LAYER_SIZES.map(function (n, li) {
            const x = x0 + (x1 - x0) * (li / (LAYER_SIZES.length - 1));
            const nodes = [];
            for (let i = 0; i < n; i++) {
                // exact even spacing within the layer column
                const y = n === 1 ? (yTop + yBot) / 2 : yTop + (yBot - yTop) * (i / (n - 1));
                nodes.push({ x: x, y: y, act: 0 });
            }
            return nodes;
        });
        pulses = [];
    }
    window.addEventListener('resize', layout);
    layout();

    function spawnPulse() {
        const l = Math.floor(Math.random() * (layers.length - 1));
        pulses.push({
            l: l,
            i: Math.floor(Math.random() * layers[l].length),
            j: Math.floor(Math.random() * layers[l + 1].length),
            p: 0,
            speed: 0.008 + Math.random() * 0.012
        });
    }

    // ── exploded robot parts (left side) ────────────────────────
    // Each part: its assembled position plus an explosion offset that
    // breathes sinusoidally. Leader ticks mark separation distances.
    function ink(a) { return 'rgba(' + INK + ',' + a + ')'; }
    function gold(a) { return 'rgba(' + GOLD + ',' + a + ')'; }

    function drawHead(x, y, s) {
        ctx.strokeRect(x - 0.42 * s, y - 0.42 * s, 0.84 * s, 0.84 * s);      // cranium shell
        ctx.beginPath(); ctx.arc(x - 0.18 * s, y - 0.08 * s, 0.09 * s, 0, Math.PI * 2); ctx.stroke(); // camera eye L
        ctx.beginPath(); ctx.arc(x + 0.18 * s, y - 0.08 * s, 0.09 * s, 0, Math.PI * 2); ctx.stroke(); // camera eye R
        ctx.strokeRect(x - 0.16 * s, y + 0.16 * s, 0.32 * s, 0.1 * s);       // speaker grille
        // gold brain module inside
        ctx.save(); ctx.strokeStyle = gold(0.9);
        ctx.strokeRect(x - 0.3 * s, y - 0.34 * s, 0.6 * s, 0.16 * s);
        ctx.restore();
    }
    function drawNeck(x, y, s) {
        ctx.strokeRect(x - 0.12 * s, y - 0.22 * s, 0.24 * s, 0.44 * s);      // cervical column
        // 3 DOF servo discs
        for (let k = -1; k <= 1; k++) {
            ctx.beginPath(); ctx.arc(x, y + k * 0.16 * s, 0.07 * s, 0, Math.PI * 2); ctx.stroke();
        }
    }
    function drawTorso(x, y, s) {
        ctx.strokeRect(x - 0.5 * s, y - 0.55 * s, 1.0 * s, 1.1 * s);         // chassis
        ctx.strokeRect(x - 0.34 * s, y - 0.4 * s, 0.68 * s, 0.34 * s);       // battery bay
        // shoulder mounts
        ctx.beginPath(); ctx.arc(x - 0.5 * s, y - 0.3 * s, 0.1 * s, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 0.5 * s, y - 0.3 * s, 0.1 * s, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
        // gold core (Prajna compute)
        ctx.save(); ctx.strokeStyle = gold(0.9);
        ctx.strokeRect(x - 0.18 * s, y + 0.06 * s, 0.36 * s, 0.3 * s);
        ctx.restore();
    }
    function drawArm(x, y, s, dir) {
        // upper arm, elbow joint, forearm, 3-finger gripper
        ctx.strokeRect(x - 0.09 * s, y - 0.45 * s, 0.18 * s, 0.42 * s);
        ctx.beginPath(); ctx.arc(x, y + 0.03 * s, 0.09 * s, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeRect(x - 0.07 * s, y + 0.12 * s, 0.14 * s, 0.36 * s);
        for (let f = -1; f <= 1; f++) {
            ctx.beginPath();
            ctx.moveTo(x + f * 0.06 * s, y + 0.48 * s);
            ctx.lineTo(x + f * 0.09 * s, y + 0.62 * s);
            ctx.stroke();
        }
    }
    function drawArmL(x, y, s) { drawArm(x, y, s, -1); }
    function drawArmR(x, y, s) { drawArm(x, y, s, 1); }

    // ── main draw ────────────────────────────────────────────────
    function draw() {
        t += 0.016;
        ctx.clearRect(0, 0, w, h);

        /* ===== LEFT: EXPLODED ROBOT ===== */
        const cx = w * 0.27;
        const cy = h * 0.52;
        const s = Math.min(w * 0.16, h * 0.24);
        const breathe = reduceMotion ? 1 : 1 + 0.06 * Math.sin(t * 0.8);
        const sep = s * 0.95 * breathe;

        ctx.lineWidth = 1.4;
        ctx.strokeStyle = ink(0.8);

        // dashed vertical assembly axis
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = ink(0.25);
        ctx.beginPath();
        ctx.moveTo(cx, cy - 2.6 * sep);
        ctx.lineTo(cx, cy + 2.0 * sep);
        ctx.stroke();
        ctx.restore();

        // draw parts with exploded offsets + leader ticks
        const parts = [
            { label: 'शीर्ष / HEAD', fn: drawHead, dx: 0, dy: -2.1 * sep },
            { label: 'ग्रीवा / NECK · 3 DOF', fn: drawNeck, dx: 0, dy: -1.15 * sep },
            { label: 'धड़ / TORSO', fn: drawTorso, dx: 0, dy: 0 },
            { label: 'भुजा / ARM', fn: drawArmL, dx: -1.05 * sep, dy: 0.15 * sep },
            { label: '', fn: drawArmR, dx: 1.05 * sep, dy: 0.15 * sep }
        ];
        ctx.font = '10px "Courier New", monospace';
        parts.forEach(function (p) {
            ctx.strokeStyle = ink(0.85);
            p.fn(cx + p.dx, cy + p.dy, s);
            // leader line from part to axis with end ticks (dimension style)
            if (p.dx !== 0 || p.dy !== -0) {
                ctx.save();
                ctx.strokeStyle = ink(0.2);
                ctx.beginPath();
                ctx.moveTo(cx + p.dx * 0.35, cy + p.dy * 0.997);
                ctx.lineTo(cx + p.dx, cy + p.dy);
                ctx.stroke();
                ctx.restore();
            }
            if (p.label) {
                ctx.fillStyle = ink(0.45);
                ctx.fillText(p.label, cx + p.dx + 0.55 * s, cy + p.dy - 0.45 * s);
            }
        });

        /* ===== RIGHT: FEED-FORWARD NETWORK ===== */
        // edges: complete bipartite between adjacent layers
        ctx.lineWidth = 0.6;
        for (let l = 0; l < layers.length - 1; l++) {
            for (let i = 0; i < layers[l].length; i++) {
                for (let j = 0; j < layers[l + 1].length; j++) {
                    ctx.strokeStyle = ink(0.10);
                    ctx.beginPath();
                    ctx.moveTo(layers[l][i].x, layers[l][i].y);
                    ctx.lineTo(layers[l + 1][j].x, layers[l + 1][j].y);
                    ctx.stroke();
                }
            }
        }

        // pulses travel along exact edge parametrization P = A + p(B-A)
        if (!reduceMotion) {
            if (pulses.length < 10 && Math.random() < 0.12) spawnPulse();
            for (let k = pulses.length - 1; k >= 0; k--) {
                const pl = pulses[k];
                const A = layers[pl.l][pl.i], B = layers[pl.l + 1][pl.j];
                pl.p += pl.speed;
                if (pl.p >= 1) {
                    B.act = 1;                       // activation on arrival
                    // forward propagation: chance to continue to next layer
                    if (pl.l + 2 < layers.length && Math.random() < 0.7) {
                        pulses.push({ l: pl.l + 1, i: pl.j, j: Math.floor(Math.random() * layers[pl.l + 2].length), p: 0, speed: pl.speed });
                    }
                    pulses.splice(k, 1);
                    continue;
                }
                const px = A.x + (B.x - A.x) * pl.p;
                const py = A.y + (B.y - A.y) * pl.p;
                ctx.fillStyle = gold(0.9);
                ctx.beginPath();
                ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // nodes with decaying activation glow
        layers.forEach(function (layer, li) {
            layer.forEach(function (n) {
                n.act *= 0.96;
                ctx.beginPath();
                ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = n.act > 0.05 ? gold(0.5 + 0.5 * n.act) : ink(0.7);
                ctx.stroke();
                if (n.act > 0.05) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, 5 + 6 * n.act, 0, Math.PI * 2);
                    ctx.strokeStyle = gold(0.25 * n.act);
                    ctx.stroke();
                }
            });
        });

        // layer captions (exact math labels)
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = ink(0.4);
        const caps = ['x ∈ R⁴', 'h₁ = σ(W₁x)', 'h₂ = σ(W₂h₁)', 'y ∈ R³'];
        layers.forEach(function (layer, li) {
            const label = caps[li] || '';
            const tw = ctx.measureText(label).width;
            ctx.fillText(label, layer[0].x - tw / 2, h * 0.84);
        });

        /* ===== BRIDGE: brain (gold head module) → network input ===== */
        ctx.save();
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = gold(0.5);
        ctx.lineWidth = 1;
        const headY = cy - 2.1 * sep - 0.26 * s;
        layers[0].forEach(function (n, i) {
            ctx.beginPath();
            ctx.moveTo(cx + 0.3 * s, headY);
            const midX = (cx + 0.3 * s + n.x) / 2;
            ctx.bezierCurveTo(midX, headY, midX, n.y, n.x - 8, n.y);
            ctx.stroke();
        });
        ctx.restore();

        if (!reduceMotion) requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
})();
