/* ============================================================
   PrajnaAGI · 3D Scene Engine  (replaces old starfield canvas.js)
   Self-loads three.js (unpkg -> jsdelivr fallback), per-page scene,
   theme-aware, reduced-motion & mobile aware, with a 2D fallback so
   the background is never blank. Content & automation untouched.
   ============================================================ */
(function () {
  var CANVAS = document.getElementById('spaceCanvas');
  if (!CANVAS) return;
  function log(m){ try { console.log('[Prajna3D] ' + m); } catch (e) {} }

  var REDUCE = false;
  try { REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var MOBILE = Math.min(window.innerWidth, window.innerHeight) < 720;

  /* force the canvas to be a visible full-screen layer behind content
     (some page/body backgrounds otherwise paint over the -1 layer) */
  (function ensureVisible(){
    var st = document.createElement('style');
    st.textContent =
      '#spaceCanvas{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;' +
      'z-index:-1!important;display:block!important;opacity:1!important;pointer-events:none!important}' +
      'html{background:var(--bg)!important}body{background-color:transparent!important}' + '.hero h1,.hero h1 *{color:#FFE9A6!important;-webkit-text-fill-color:#FFE9A6!important;text-shadow:0 2px 24px rgba(0,0,0,.75),0 0 22px rgba(255,215,0,.30)!important}.hero .hindi-line,.hero .hindi-line *{color:#FFD54F!important;-webkit-text-fill-color:#FFD54F!important}.hero p{color:#cdbd84!important}.hero .dot-rule,.dot-rule{opacity:.5}';
    document.head.appendChild(st);
  })();

  function pickScene() {
    var p = (location.pathname || '').toLowerCase();
    var keys = ['space','science','tech','environment','health','srijan','contact','404','about'];
    for (var i = 0; i < keys.length; i++) if (p.indexOf(keys[i]) > -1) return keys[i];
    return 'home';
  }
  var SID = pickScene();

  function colors() {
    var night = document.body.getAttribute('data-theme') !== 'light';
    return night
      ? { night:true,  star:0xFFE9A6, line:0xFFD54F, accent:0xFFD700, soft:0xE1AD01, dim:0x5a4a00, starOp:0.9,  lineOp:0.6 }
      : { night:false, star:0x9A7A1E, line:0xA9822a, accent:0x8a6d00, soft:0x9a7a00, dim:0xd9c46a, starOp:0.6,  lineOp:0.45 };
  }

  /* ---------- 2D fallback so it is NEVER blank ---------- */
  function fallback2D() {
    log('using 2D fallback');
    try {
      var cv = document.getElementById('spaceCanvasFB');
      if (!cv) { cv = document.createElement('canvas'); cv.id = 'spaceCanvasFB';
        cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
        document.body.appendChild(cv); }
      var ctx = cv.getContext('2d'); if (!ctx) return;
      function size(){ cv.width = window.innerWidth; cv.height = window.innerHeight; }
      size(); window.addEventListener('resize', size);
      var night = document.body.getAttribute('data-theme') !== 'light';
      var rgb = night ? '255,224,130' : '150,120,30';
      var N = MOBILE ? 90 : 170, st = [];
      for (var i=0;i<N;i++) st.push({ x:Math.random(), y:Math.random(), z:Math.random()*0.8+0.2 });
      (function loop(){ requestAnimationFrame(loop);
        ctx.clearRect(0,0,cv.width,cv.height);
        for (var i=0;i<N;i++){ var s=st[i]; s.y += 0.0005*s.z; if (s.y>1) s.y=0;
          ctx.fillStyle = 'rgba('+rgb+','+(s.z*0.9)+')';
          ctx.beginPath(); ctx.arc(s.x*cv.width, s.y*cv.height, s.z*1.7, 0, 6.283); ctx.fill(); }
      })();
    } catch (e) { log('fallback error ' + e); }
  }

  /* ---------- load three.js then boot ---------- */
  function loadThree() {
    var srcs = ['https://unpkg.com/three@0.128.0/build/three.min.js',
                'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'];
    var i = 0;
    (function next(){
      if (window.THREE) { try { boot(); } catch (e) { log('boot error ' + e); fallback2D(); } return; }
      if (i >= srcs.length) { fallback2D(); return; }
      var s = document.createElement('script'); s.src = srcs[i++];
      s.onload = function(){ log('loaded ' + s.src); if (window.THREE) { try { boot(); } catch (e) { log('boot error ' + e); fallback2D(); } } else next(); };
      s.onerror = function(){ log('failed ' + s.src); next(); };
      document.head.appendChild(s);
    })();
  }
  if (window.THREE) { try { boot(); } catch (e) { fallback2D(); } } else loadThree();

  /* ============================================================ */
  function boot() {
    var THREE = window.THREE, renderer, scene, camera, root, current;
    var mx = 0, my = 0, tmx = 0, tmy = 0;

    try { renderer = new THREE.WebGLRenderer({ canvas: CANVAS, antialias: true, alpha: true }); }
    catch (e) { log('no webgl ' + e); fallback2D(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    log('renderer ok, scene=' + SID);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 62);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    var key = new THREE.PointLight(0xffffff, 1.1); key.position.set(40, 30, 60); scene.add(key);

    function glowTex(hex){ var c=document.createElement('canvas'); c.width=c.height=128; var g=c.getContext('2d');
      var col=new THREE.Color(hex), r=(col.r*255)|0, gg=(col.g*255)|0, b=(col.b*255)|0;
      var grd=g.createRadialGradient(64,64,0,64,64,64);
      grd.addColorStop(0,'rgba('+r+','+gg+','+b+',0.95)'); grd.addColorStop(0.4,'rgba('+r+','+gg+','+b+',0.35)'); grd.addColorStop(1,'rgba('+r+','+gg+','+b+',0)');
      g.fillStyle=grd; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
    function blend(C){ return C.night ? THREE.AdditiveBlending : THREE.NormalBlending; }
    function rnd(a,b){ return a + Math.random()*(b-a); }
    function starfield(C,n){ n = MOBILE ? (n*0.5|0) : n; var pos=new Float32Array(n*3);
      for (var i=0;i<n;i++){ var r=rnd(70,340), t=Math.random()*6.2832, p=Math.acos(2*Math.random()-1);
        pos[i*3]=r*Math.sin(p)*Math.cos(t); pos[i*3+1]=r*Math.cos(p)*0.6; pos[i*3+2]=r*Math.sin(p)*Math.sin(t); }
      var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos,3));
      return new THREE.Points(g,new THREE.PointsMaterial({ color:C.star, size:MOBILE?0.8:0.6, transparent:true, opacity:C.starOp, depthWrite:false, blending:blend(C) })); }
    function ell(rx,rz,seg){ var pts=[]; seg=seg||128; for (var a=0;a<=seg;a++){ var t=a/seg*6.2832; pts.push(new THREE.Vector3(Math.cos(t)*rx,0,Math.sin(t)*rz)); } return pts; }
    function ringLine(rx,rz,C,op){ var g=new THREE.BufferGeometry().setFromPoints(ell(rx,rz,140));
      return new THREE.Line(g,new THREE.LineBasicMaterial({ color:C.line, transparent:true, opacity:op==null?C.lineOp:op })); }
    function dot(size,hex,C){ return new THREE.Mesh(new THREE.SphereGeometry(size,20,20),
      new THREE.MeshStandardMaterial({ color:hex, emissive:hex, emissiveIntensity:C.night?0.6:0.15, roughness:0.6 })); }

    var SCENES = {
      home: function (C) { var G=new THREE.Group(); G.add(starfield(C,1300));
        var sun=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(C.accent), transparent:true, depthWrite:false, blending:blend(C), opacity:C.night?0.95:0.55 })); sun.scale.set(38,38,1); G.add(sun);
        G.add(dot(2.6,C.accent,C)); var planets=[], radii=[14,20,27,35], spd=[0.42,0.3,0.22,0.16];
        for (var i=0;i<radii.length;i++){ G.add(ringLine(radii[i],radii[i]*0.94,C,C.lineOp*0.7));
          var pl=dot(rnd(0.7,1.2), i%2?C.soft:C.star, C); G.add(pl);
          planets.push({m:pl,r:radii[i],rz:radii[i]*0.94,a:Math.random()*6.28,s:spd[i]}); }
        scene.add(G); return { root:G, update:function(){ for (var i=0;i<planets.length;i++){ var q=planets[i]; q.a+=q.s*0.01; q.m.position.set(Math.cos(q.a)*q.r, Math.sin(q.a*1.3)*1.2, Math.sin(q.a)*q.rz); } } }; },
      space: function (C) { var G=new THREE.Group(); G.add(starfield(C,1600));
        var planet=new THREE.Mesh(new THREE.SphereGeometry(8,64,48), new THREE.MeshStandardMaterial({ color:C.soft, emissive:C.soft, emissiveIntensity:C.night?0.25:0.05, roughness:0.9 })); planet.position.set(6,0,0); G.add(planet);
        var atmo=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(C.accent), transparent:true, depthWrite:false, blending:blend(C), opacity:C.night?0.6:0.3 })); atmo.scale.set(30,30,1); atmo.position.copy(planet.position); G.add(atmo);
        var ring=new THREE.Mesh(new THREE.RingGeometry(11,16,80), new THREE.MeshBasicMaterial({ color:C.line, side:THREE.DoubleSide, transparent:true, opacity:C.night?0.4:0.28 })); ring.rotation.x=Math.PI/2.4; ring.position.copy(planet.position); G.add(ring);
        var moon=dot(1.1,C.star,C); G.add(moon); var ma=0; scene.add(G);
        return { root:G, update:function(){ planet.rotation.y+=0.0016; ma+=0.012; moon.position.set(6+Math.cos(ma)*22, Math.sin(ma)*3, Math.sin(ma)*22); } }; },
      science: function (C) { var G=new THREE.Group(); G.add(starfield(C,700));
        var nuc=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(C.accent), transparent:true, depthWrite:false, blending:blend(C), opacity:C.night?0.9:0.5 })); nuc.scale.set(12,12,1); G.add(nuc); G.add(dot(1.6,C.accent,C));
        var orb=[], tl=[[0,0],[Math.PI/3,0],[-Math.PI/3,Math.PI/4]];
        for (var i=0;i<3;i++){ var o=new THREE.Group(); o.add(ringLine(16,16,C,C.lineOp)); o.rotation.x=tl[i][0]; o.rotation.z=tl[i][1]; var e=dot(0.7,C.star,C); o.add(e); G.add(o); orb.push({g:o,e:e,a:Math.random()*6.28,s:0.05+i*0.02}); }
        scene.add(G); return { root:G, update:function(){ for (var i=0;i<orb.length;i++){ var q=orb[i]; q.a+=q.s; q.e.position.set(Math.cos(q.a)*16,0,Math.sin(q.a)*16); q.g.rotation.y+=0.004; } } }; },
      tech: function (C) { var G=new THREE.Group(); G.add(starfield(C,500));
        var ico=new THREE.Mesh(new THREE.IcosahedronGeometry(12,1), new THREE.MeshBasicMaterial({ color:C.line, wireframe:true, transparent:true, opacity:C.night?0.55:0.4 })); G.add(ico);
        var np=24, pts=[], nodes=new Float32Array(np*3);
        for (var i=0;i<np;i++){ var t=Math.random()*6.28,p=Math.acos(2*Math.random()-1),r=12; var x=r*Math.sin(p)*Math.cos(t),y=r*Math.cos(p),z=r*Math.sin(p)*Math.sin(t); nodes[i*3]=x;nodes[i*3+1]=y;nodes[i*3+2]=z; pts.push(new THREE.Vector3(x,y,z)); }
        var ng=new THREE.BufferGeometry(); ng.setAttribute('position',new THREE.BufferAttribute(nodes,3));
        G.add(new THREE.Points(ng,new THREE.PointsMaterial({ color:C.accent, size:0.9, transparent:true, opacity:0.95, depthWrite:false, blending:blend(C) })));
        var seg=[]; for (var i=0;i<14;i++){ seg.push(pts[(Math.random()*np)|0]); seg.push(pts[(Math.random()*np)|0]); }
        var lm=new THREE.LineBasicMaterial({ color:C.line, transparent:true, opacity:0.32 }); G.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), lm));
        scene.add(G); return { root:G, update:function(t){ ico.rotation.y+=0.003; ico.rotation.x+=0.0012; lm.opacity=(C.night?0.32:0.2)+Math.sin(t*2)*0.12; } }; },
      environment: function (C) { var G=new THREE.Group();
        var bp0=[new THREE.Vector3(-26,16,0),new THREE.Vector3(-8,12,-4),new THREE.Vector3(10,15,2),new THREE.Vector3(28,11,0)];
        var bg=new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(bp0).getPoints(60));
        G.add(new THREE.Line(bg,new THREE.LineBasicMaterial({ color:C.night?0x7a6630:0x5a4a20, transparent:true, opacity:0.75 })));
        var bl=800, bp=new Float32Array(bl*3), hangs=[-20,-10,0,9,20], k=0;
        for (var h=0;h<hangs.length;h++){ var hx=hangs[h], hy=13+Math.random()*2;
          for (var j=0;j<bl/hangs.length;j++){ var dy=Math.random()*10; var sp=(Math.random()-0.5)*3.2; bp[k*3]=hx+sp+Math.sin(dy)*0.6; bp[k*3+1]=hy-dy; bp[k*3+2]=(Math.random()-0.5)*3; k++; } }
        var bgeo=new THREE.BufferGeometry(); bgeo.setAttribute('position',new THREE.BufferAttribute(bp,3));
        var blossoms=new THREE.Points(bgeo,new THREE.PointsMaterial({ color:C.accent, size:1.0, transparent:true, opacity:C.night?0.95:0.85, depthWrite:false, blending:blend(C) })); G.add(blossoms);
        var pn=MOBILE?90:180, pp=new Float32Array(pn*3), pv=[];
        for (var i=0;i<pn;i++){ pp[i*3]=rnd(-34,34); pp[i*3+1]=rnd(-20,16); pp[i*3+2]=rnd(-8,8); pv.push(rnd(0.02,0.08)); }
        var pgeo=new THREE.BufferGeometry(); pgeo.setAttribute('position',new THREE.BufferAttribute(pp,3));
        var petals=new THREE.Points(pgeo,new THREE.PointsMaterial({ color:C.soft, size:0.8, transparent:true, opacity:0.8, depthWrite:false, blending:blend(C) })); G.add(petals);
        function bird(){ var b=new THREE.Group(); var g1=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.4,0,0),new THREE.Vector3(0,0.5,0),new THREE.Vector3(1.4,0,0)]); b.add(new THREE.Line(g1,new THREE.LineBasicMaterial({ color:C.night?0xcccccc:0x333333, transparent:true, opacity:0.8 }))); return b; }
        var b1=bird(), b2=bird(); b2.scale.set(0.8,0.8,0.8); G.add(b1); G.add(b2); scene.add(G);
        return { root:G, update:function(t){ blossoms.rotation.z=Math.sin(t*0.5)*0.02; var a=pgeo.attributes.position.array;
          for (var i=0;i<pn;i++){ a[i*3+1]-=pv[i]; a[i*3]+=Math.sin(t+i)*0.01; if (a[i*3+1]<-22){ a[i*3+1]=16; a[i*3]=rnd(-34,34); } }
          pgeo.attributes.position.needsUpdate=true;
          b1.position.set(((t*6)%80)-40, 6+Math.sin(t*1.5)*2, -4); b1.children[0].scale.y=1+Math.sin(t*8)*0.4;
          b2.position.set(30-((t*5)%80), 2+Math.cos(t*1.3)*2, 2); b2.children[0].scale.y=1+Math.sin(t*8+1)*0.4; } }; },
      health: function (C) { var G=new THREE.Group(); G.add(starfield(C,400));
        var N=MOBILE?60:110, s1=new Float32Array(N*3), s2=new Float32Array(N*3), rungs=[];
        for (var i=0;i<N;i++){ var y=(i/N-0.5)*46, a=i*0.32; var x1=Math.cos(a)*7,z1=Math.sin(a)*7,x2=Math.cos(a+Math.PI)*7,z2=Math.sin(a+Math.PI)*7;
          s1[i*3]=x1;s1[i*3+1]=y;s1[i*3+2]=z1; s2[i*3]=x2;s2[i*3+1]=y;s2[i*3+2]=z2; if (i%3===0){ rungs.push(new THREE.Vector3(x1,y,z1)); rungs.push(new THREE.Vector3(x2,y,z2)); } }
        function strand(arr,hex){ var g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(arr,3)); return new THREE.Points(g,new THREE.PointsMaterial({ color:hex, size:1.2, transparent:true, opacity:0.95, depthWrite:false, blending:blend(C) })); }
        G.add(strand(s1,C.accent)); G.add(strand(s2,C.star));
        G.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rungs), new THREE.LineBasicMaterial({ color:C.line, transparent:true, opacity:C.night?0.5:0.35 })));
        G.rotation.z=0.25; scene.add(G); return { root:G, update:function(){ G.rotation.y+=0.006; } }; },
      contact: function (C) { var G=new THREE.Group(); G.add(starfield(C,500)); G.add(dot(2.2,C.accent,C));
        var hub=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(C.accent), transparent:true, depthWrite:false, blending:blend(C), opacity:C.night?0.9:0.5 })); hub.scale.set(16,16,1); G.add(hub);
        var nodes=[], NN=6; for (var i=0;i<NN;i++){ var g=new THREE.Group(); var l=ringLine(18,18,C,C.lineOp*0.6); l.rotation.x=Math.PI/2; g.add(l); var nd=dot(0.9,i%2?C.soft:C.star,C); g.add(nd); g.rotation.z=i*(6.28/NN)*0.5; G.add(g); nodes.push({nd:nd,a:i*(6.28/NN),s:0.01+i*0.002}); }
        G.rotation.x=0.5; scene.add(G); return { root:G, update:function(){ for (var i=0;i<nodes.length;i++){ var q=nodes[i]; q.a+=q.s; q.nd.position.set(Math.cos(q.a)*18,Math.sin(q.a)*18,0); } G.rotation.y+=0.0015; } }; },
      '404': function (C) { var G=new THREE.Group(); G.add(starfield(C,500)); var rings=[], layers=[[6,8],[10,12],[15,16]];
        for (var r=0;r<layers.length;r++){ var ring=new THREE.Group(), cnt=layers[r][1];
          for (var i=0;i<cnt;i++){ var pts=[]; for (var a=-1;a<=1;a+=0.1){ pts.push(new THREE.Vector3(Math.sin(a)*layers[r][0],(1-Math.cos(a))*layers[r][0],0)); }
            var pl=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color:r%2?C.accent:C.soft, transparent:true, opacity:C.night?0.55:0.4 })); pl.rotation.z=i*(6.2832/cnt); ring.add(pl); }
          ring.rotation.x=Math.PI/2.6; G.add(ring); rings.push(ring); }
        var glow=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(C.accent), transparent:true, depthWrite:false, blending:blend(C), opacity:C.night?0.7:0.4 })); glow.scale.set(20,20,1); G.add(glow); scene.add(G);
        return { root:G, update:function(t){ var b=1+Math.sin(t*0.7)*0.06; G.scale.set(b,b,b); for (var i=0;i<rings.length;i++) rings[i].rotation.y+=0.001*(i+1); } }; },
      about: function (C) { return SCENES.home(C); },
      srijan: function (C) { return SCENES.home(C); }
    };

    function build(){ var C=colors(); scene.fog = C.night ? new THREE.FogExp2(0x000000,0.0038) : null;
      current = (SCENES[SID] || SCENES.home)(C); root = current.root; }
    function teardown(){ if (!root) return; scene.remove(root);
      root.traverse(function(o){ if (o.geometry) o.geometry.dispose(); if (o.material){ if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); root=null; current=null; }

    build();
    var clock = new THREE.Clock();
    function frame(){ requestAnimationFrame(frame); var t=clock.getElapsedTime();
      tmx += (mx - tmx)*0.04; tmy += (my - tmy)*0.04;
      if (root){ root.rotation.y += (tmx*0.5 - root.rotation.y)*0.02; root.rotation.x = tmy*0.2; }
      if (current && current.update) current.update(t);
      renderer.render(scene, camera); }
    if (REDUCE) renderer.render(scene, camera); else frame();

    window.addEventListener('pointermove', function(e){ mx=(e.clientX/window.innerWidth-0.5); my=(e.clientY/window.innerHeight-0.5); }, { passive:true });
    window.addEventListener('resize', function(){ camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth,window.innerHeight); MOBILE=Math.min(window.innerWidth,window.innerHeight)<720; });
    try { new MutationObserver(function(){ teardown(); build(); if (REDUCE) renderer.render(scene,camera); }).observe(document.body,{ attributes:true, attributeFilter:['data-theme'] }); } catch(e){}
    log('running');
  }
})();
