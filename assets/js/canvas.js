// ── PREMIUM SPACE CANVAS ─────────────────────────────────────────────────────────
const canvas = document.getElementById('spaceCanvas');
const ctx = canvas?.getContext('2d');
const hCanvas = document.getElementById('headerBlackHole');
const hCtx = hCanvas?.getContext('2d');
let width, height, time = 0, stars = [];
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
    ctx.shadowBlur = body.name === 'सूर्य' ? 50 : 15;
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

    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.08)';
    stars.forEach(s => {
        s.y -= s.speed;
        if (s.y < 0) s.y = height;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // 2. Draw Header Black Hole (if exists)
    if (hCtx) {
        hCtx.clearRect(0, 0, 110, 110);
        hCtx.save();
        hCtx.translate(55, 55);
        hCtx.rotate(time * 2.2);
        const g = hCtx.createRadialGradient(0, 0, 8, 0, 0, 44);
        g.addColorStop(0, '#000');
        g.addColorStop(0.3, 'rgba(225,173,1,0.75)');
        g.addColorStop(1, 'transparent');
        hCtx.fillStyle = g;
        hCtx.beginPath();
        hCtx.ellipse(0, 0, 50, 14, 0, 0, Math.PI * 2);
        hCtx.fill();
        hCtx.fillStyle = '#000';
        hCtx.beginPath();
        hCtx.arc(0, 0, 15, 0, Math.PI * 2);
        hCtx.fill();
        hCtx.restore();
    }

    // 3. Draw Grid & Planets
    const cx = width / 2, cy = height / 2, step = 60;
    ctx.strokeStyle = isDark() ? 'rgba(225,173,1,0.08)' : 'rgba(184,138,0,0.05)';
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
