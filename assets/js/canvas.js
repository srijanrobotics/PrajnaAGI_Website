// ── PREMIUM SPACE CANVAS ─────────────────────────────────────────────────────────
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas?.getContext('2d');
const hCanvas = document.getElementById('headerBlackHole');
const hCtx = hCanvas?.getContext('2d');
let width, height, time = 0, stars = [];
let debris = [];
let mouseX = -1000, mouseY = -1000;
let hoveredBody = null;

const celestialBodies = [
    { name: "सूर्य", r: 35, orbit: 0, speed: 0, color: '#FFD700', angle: 0 },
    { name: "बुध", r: 4, orbit: 60, speed: 0.02, color: '#A8A8A8', angle: Math.random() * Math.PI * 2 },
    { name: "शुक्र", r: 8, orbit: 95, speed: 0.015, color: '#E3BB76', angle: Math.random() * Math.PI * 2 },
    { 
        name: "पृथ्वी", r: 10, orbit: 145, speed: 0.01, color: '#4fc3f7', angle: Math.random() * Math.PI * 2,
        children: [
            { name: "चंद्रमा", r: 3, orbit: 22, speed: 0.05, color: '#D3D3D3', angle: 0,
                children: [
                    { name: "प्रज्ञान रोवर", r: 1.5, orbit: 6, speed: 0.1, color: '#ffeb3b', angle: 0 }
                ]
            },
            { name: "New Drishti", r: 2, orbit: 12, speed: 0.08, color: '#58CCED', angle: Math.PI },
            { name: "Aditya-L1", r: 2, orbit: 30, speed: 0, color: '#ff5252', angle: Math.PI }
        ]
    },
    { 
        name: "मंगल", r: 7, orbit: 200, speed: 0.008, color: '#ff5252', angle: Math.random() * Math.PI * 2,
        children: [
            { name: "ISRO MOM", r: 2, orbit: 12, speed: 0.06, color: '#E1AD01', angle: 0 }
        ]
    },
    { name: "बृहस्पति", r: 22, orbit: 280, speed: 0.005, color: '#D39C7E', angle: Math.random() * Math.PI * 2 },
    { name: "शनि", r: 18, orbit: 370, speed: 0.003, color: '#EAD6B8', angle: Math.random() * Math.PI * 2, hasRings: true },
    { name: "अरुण", r: 13, orbit: 450, speed: 0.002, color: '#4B70DD', angle: Math.random() * Math.PI * 2 },
    { name: "वरुण", r: 12, orbit: 520, speed: 0.001, color: '#274687', angle: Math.random() * Math.PI * 2 }
];

function init() {
    if (!canvas) return;
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    if (hCanvas) {
        hCanvas.width = hCanvas.height = 110;
    }

    stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5,
            speed: Math.random() * 0.2 + 0.05
        });
    }

    // interstellar debris: small rocks streaming past the moving solar system
    debris = [];
    for (let i = 0; i < 70; i++) debris.push(newDebris(true));
}

// debris particles fly outward from a vanishing point ahead of the sun's
// direction of travel — conveys that the whole system is moving through space
function newDebris(scatter) {
    const ang = Math.random() * Math.PI * 2;
    return {
        ang: ang,
        dist: scatter ? Math.random() * Math.max(width, height) * 0.5 : 10 + Math.random() * 60,
        speed: 0.4 + Math.random() * 1.2,
        size: 0.6 + Math.random() * 1.8,
        grey: 120 + Math.floor(Math.random() * 100)
    };
}

if (canvas) {
    window.addEventListener('resize', init);
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    init();
}

function isDark() {
    return document.body.getAttribute('data-theme') !== 'light';
}

function deform(gx, gy, cx, cy) {
    const dx = gx - cx, dy = gy - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const pull = (35 * 20) / (dist / 10 + 1);
    if (dist < 400) { gx -= (dx / dist) * pull; gy -= (dy / dist) * pull; }
    return [gx, gy];
}

function drawBody(body, cx, cy, ctx) {
    const currentAngle = body.angle + (body.speed * time * 50);
    const bx = cx + Math.cos(currentAngle) * body.orbit;
    const by = cy + Math.sin(currentAngle) * body.orbit;

    if (body.orbit > 0 && !body.isSat) {
        ctx.beginPath();
        ctx.arc(cx, cy, body.orbit, 0, Math.PI * 2);
        ctx.strokeStyle = isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
        ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = body.name === 'सूर्य' ? (isDark() ? 50 : 25) : 15;
    ctx.shadowColor = body.color;
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(bx, by, body.r, 0, Math.PI * 2);
    ctx.fill();

    if (body.hasRings) {
        ctx.beginPath();
        ctx.ellipse(bx, by, body.r * 2.2, body.r * 0.5, currentAngle, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(234, 214, 184, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    ctx.restore();

    const dist = Math.sqrt((bx - mouseX)**2 + (by - mouseY)**2);
    if (dist < Math.max(body.r + 5, 12)) {
        hoveredBody = { name: body.name, x: bx, y: by, color: body.color };
    }

    if (body.children) {
        body.children.forEach(child => {
            child.isSat = true;
            drawBody(child, bx, by, ctx);
        });
    }
}

function draw() {
    if (!ctx) return;
    time += 0.015;
    hoveredBody = null;

    // 1. Draw Space Background
    ctx.fillStyle = isDark() ? '#000' : '#f7f7f7';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.55)' : 'rgba(0, 102, 153, 0.15)'; // Soft blue dust in light mode
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // 2. Header: GARGANTUA — Interstellar-style lensed black hole.
    // Layers (back to front): lensed halo arching OVER the sphere, back half
    // of the accretion disk, photon ring, event horizon, front half of the
    // disk crossing in front — with doppler beaming (left side brighter)
    // and slowly rotating hot streaks in the disk for a live 3D feel.
    if (hCtx) {
        hCtx.clearRect(0, 0, 110, 110);
        hCtx.save();
        hCtx.translate(55, 55);
        const R = 14;               // event horizon radius
        const spin = time * 1.4;    // disk material rotation

        // helper: warm disk gradient along x (doppler: left = hot/bright)
        function diskGrad(alpha) {
            const g = hCtx.createLinearGradient(-46, 0, 46, 0);
            g.addColorStop(0.00, 'rgba(255,255,245,' + alpha + ')');
            g.addColorStop(0.25, 'rgba(255,215,150,' + (alpha * 0.95) + ')');
            g.addColorStop(0.55, 'rgba(230,150,70,' + (alpha * 0.8) + ')');
            g.addColorStop(1.00, 'rgba(140,70,30,' + (alpha * 0.55) + ')');
            return g;
        }

        // (a) LENSED HALO — disk light bent over the top & under the bottom
        for (let k = 0; k < 2; k++) {
            hCtx.save();
            hCtx.rotate(k === 0 ? 0 : Math.PI);
            hCtx.beginPath();
            hCtx.arc(0, 0, R + 7, Math.PI * 1.05, Math.PI * 1.95);
            hCtx.strokeStyle = diskGrad(k === 0 ? 0.85 : 0.5);
            hCtx.lineWidth = 6.5;
            hCtx.shadowColor = 'rgba(255,190,120,0.8)';
            hCtx.shadowBlur = 8;
            hCtx.stroke();
            hCtx.restore();
        }

        // (b) BACK HALF of accretion disk (upper arc, behind sphere)
        hCtx.save();
        hCtx.beginPath();
        hCtx.ellipse(0, 0, 46, 11, 0, Math.PI, Math.PI * 2);
        hCtx.strokeStyle = diskGrad(0.55);
        hCtx.lineWidth = 7;
        hCtx.shadowColor = 'rgba(255,170,90,0.6)';
        hCtx.shadowBlur = 6;
        hCtx.stroke();
        hCtx.restore();

        // (c) PHOTON RING — razor-thin white ring hugging the horizon
        hCtx.save();
        hCtx.beginPath();
        hCtx.arc(0, 0, R + 1.6, 0, Math.PI * 2);
        hCtx.strokeStyle = 'rgba(255,252,240,0.95)';
        hCtx.lineWidth = 1.3;
        hCtx.shadowColor = 'rgba(255,255,255,0.9)';
        hCtx.shadowBlur = 5;
        hCtx.stroke();
        hCtx.restore();

        // (d) EVENT HORIZON — pure black sphere
        hCtx.fillStyle = '#000';
        hCtx.beginPath();
        hCtx.arc(0, 0, R, 0, Math.PI * 2);
        hCtx.fill();

        // (e) FRONT HALF of disk crossing in front of the sphere
        hCtx.save();
        hCtx.beginPath();
        hCtx.ellipse(0, 0, 46, 11, 0, 0, Math.PI);
        hCtx.strokeStyle = diskGrad(1);
        hCtx.lineWidth = 8;
        hCtx.shadowColor = 'rgba(255,200,130,0.9)';
        hCtx.shadowBlur = 9;
        hCtx.stroke();
        // hot inner edge of the front disk
        hCtx.beginPath();
        hCtx.ellipse(0, 0, 30, 7, 0, 0.1, Math.PI - 0.1);
        hCtx.strokeStyle = 'rgba(255,255,235,0.85)';
        hCtx.lineWidth = 2.2;
        hCtx.shadowBlur = 6;
        hCtx.stroke();
        hCtx.restore();

        // (f) ROTATING HOT STREAKS in the disk — visible orbital motion
        for (let i = 0; i < 5; i++) {
            const a0 = spin + i * (Math.PI * 2 / 5);
            const seg = 0.55;
            const front = Math.sin(a0 % (Math.PI * 2)) > 0; // lower half = front
            hCtx.save();
            hCtx.beginPath();
            hCtx.ellipse(0, 0, 40, 9.6, 0, a0, a0 + seg);
            const bright = 0.55 + 0.45 * Math.cos(a0);      // doppler boost on left
            hCtx.strokeStyle = 'rgba(255,235,200,' + (front ? bright * 0.9 : bright * 0.35) + ')';
            hCtx.lineWidth = front ? 2.4 : 1.6;
            hCtx.shadowColor = 'rgba(255,220,170,0.7)';
            hCtx.shadowBlur = 4;
            hCtx.stroke();
            hCtx.restore();
        }

        // (g) soft ambient glow around the whole system
        const halo = hCtx.createRadialGradient(0, 0, R, 0, 0, 54);
        halo.addColorStop(0, 'rgba(255,180,100,0.16)');
        halo.addColorStop(1, 'rgba(255,180,100,0)');
        hCtx.fillStyle = halo;
        hCtx.beginPath();
        hCtx.arc(0, 0, 54, 0, Math.PI * 2);
        hCtx.fill();

        hCtx.restore();
    }

    // 3. SUN IS MOVING: slow galactic drift + barycenter wobble.
    // The sun is pulled by its heaviest planets (बृहस्पति, शनि) — it orbits
    // the system's barycenter, wobbling opposite to them. Planets follow
    // automatically because every orbit is computed around (cx, cy).
    let wobX = 0, wobY = 0;
    [{ i: 5, m: 0.055 }, { i: 6, m: 0.028 }].forEach(g => {
        const b = celestialBodies[g.i];
        const a = b.angle + (b.speed * time * 50);
        wobX -= Math.cos(a) * b.orbit * g.m;   // pulled opposite the giant
        wobY -= Math.sin(a) * b.orbit * g.m;
    });
    const driftX = Math.sin(time * 0.04) * width * 0.06 + Math.cos(time * 0.017) * width * 0.03;
    const driftY = Math.cos(time * 0.031) * height * 0.05;
    const cx = width / 2 + driftX + wobX, cy = height / 2 + driftY + wobY, step = 60;

    // 3b. DEBRIS STREAM: rocks rushing past from the direction of travel
    // (vanishing point leads the sun's drift), showing the system's speed.
    const vpx = cx + Math.cos(time * 0.04) * 120;
    const vpy = cy - 80;
    for (let i = 0; i < debris.length; i++) {
        const p = debris[i];
        p.dist += p.speed * (1 + p.dist * 0.004);       // accelerates as it nears us
        const px = vpx + Math.cos(p.ang) * p.dist;
        const py = vpy + Math.sin(p.ang) * p.dist;
        if (px < -60 || px > width + 60 || py < -60 || py > height + 60) {
            debris[i] = newDebris(false);
            continue;
        }
        const stretch = Math.min(14, p.dist * 0.02 * p.speed);  // motion streak
        const alpha = Math.min(0.7, 0.15 + p.dist / (width * 0.7));
        ctx.strokeStyle = isDark()
            ? 'rgba(' + p.grey + ',' + p.grey + ',' + p.grey + ',' + alpha + ')'
            : 'rgba(90,80,70,' + (alpha * 0.7) + ')';
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - Math.cos(p.ang) * stretch, py - Math.sin(p.ang) * stretch);
        ctx.stroke();
    }
    ctx.strokeStyle = isDark() ? 'rgba(225,173,1,0.08)' : 'rgba(184,138,0,0.06)';
    for (let x = 0; x < width + step; x += step) {
        ctx.beginPath();
        for (let y = 0; y < height; y += 18) {
            const [nx, ny] = deform(x, y, cx, cy);
            y === 0 ? ctx.moveTo(nx, ny) : ctx.lineTo(nx, ny);
        }
        ctx.stroke();
    }
    for (let y = 0; y < height + step; y += step) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 18) {
            const [nx, ny] = deform(x, y, cx, cy);
            x === 0 ? ctx.moveTo(nx, ny) : ctx.lineTo(nx, ny);
        }
        ctx.stroke();
    }

    celestialBodies.forEach(b => drawBody(b, cx, cy, ctx));

    if (hoveredBody) {
        ctx.save();
        ctx.font = '14px "Noto Sans Devanagari", sans-serif';
        const textWidth = ctx.measureText(hoveredBody.name).width;
        ctx.fillStyle = isDark() ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(hoveredBody.x + 10, hoveredBody.y - 35, textWidth + 20, 26, 5);
        } else {
            ctx.rect(hoveredBody.x + 10, hoveredBody.y - 35, textWidth + 20, 26);
        }
        ctx.fill();
        ctx.strokeStyle = hoveredBody.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isDark() ? '#fff' : '#000';
        ctx.fillText(hoveredBody.name, hoveredBody.x + 20, hoveredBody.y - 17);
        ctx.restore();
    }

    requestAnimationFrame(draw);
}
if (canvas) draw();
