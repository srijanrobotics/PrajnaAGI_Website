(function(){
 var CANVAS=document.getElementById('spaceCanvas'); if(!CANVAS) return;
 var CAT={space:{color:'#ef8a34',solar:true,moons:['a','b']},science:{color:'#4f9bff',moons:['a','b']},tech:{color:'#22c9b8',moons:['a','b']},environment:{color:'#4fbf63',moons:['a','b']},health:{color:'#ff6f9c',moons:['a','b']},srijan:{color:'#b98cff',moons:['a','b']},contact:{color:'#6ad5ff',moons:['a','b']}};
 function sceneKey(){var p=(location.pathname||'').toLowerCase();var m=['space','science','tech','environment','health','srijan','contact'];for(var i=0;i<m.length;i++)if(p.indexOf(m[i])>-1)return m[i];return 'space';}
 var current=sceneKey();
 function goCat(){}
  /* ---------- Three.js (realistic + interactive) ---------- */
  var THREE,renderer,scene,camera,pGroup,ray,m2,moonLabels=[],starfield=null,ambient,sunLight,keyLight,sceneUpdate=null,camZ=40,camPX=8,baseTilt=0.2;
  function night(){return document.body.getAttribute('data-theme')!=='light';}
  function cv(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function L(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
  function makeNoise(seed){var s=seed%2147483647;if(s<=0)s+=2147483646;return function(){s=(s*16807)%2147483647;return (s-1)/2147483646;};}
  function fbmGrid(seed,GS){var rnd=makeNoise(seed),lat=[];for(var i=0;i<(GS+1)*(GS+1);i++)lat.push(rnd());
    function vn(x,y){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;var a=lat[(yi%GS)*(GS+1)+(xi%GS)],b=lat[(yi%GS)*(GS+1)+((xi+1)%GS)],c=lat[((yi+1)%GS)*(GS+1)+(xi%GS)],dd=lat[((yi+1)%GS)*(GS+1)+((xi+1)%GS)];var u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a*(1-u)*(1-v)+b*u*(1-v)+c*(1-u)*v+dd*u*v;}
    return function(x,y){var s=0,m=.5,f=1;for(var o=0;o<5;o++){s+=m*vn(x*f,y*f);f*=2;m*=.5;}return s;};}
  function tex(c){var t=new THREE.CanvasTexture(c);return t;}
  function bumpCanvas(W,H,fn){var c=cv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;for(var y=0;y<H;y++)for(var x=0;x<W;x++){var v=fn(x/W,y/H)*255,i=(y*W+x)*4;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}g.putImageData(img,0,0);return c;}
  function earthMaps(){var W=512,H=256,c=cv(W,H),g=c.getContext('2d'),img=g.createImageData(W,H),d=img.data;
    var F=fbmGrid(4231,48),Fw=fbmGrid(88,48);var od=[13,52,104],os=[28,104,176],ln=[52,104,52],lh=[120,98,58],ice=[236,242,255];
    var hf=function(x,y){return F(x*9+Fw(x*5,y*5)*1.5,y*5);};
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var lat=Math.abs(y/H-0.5)*2,n=hf(x/W,y/H),col;
      if(n>0.55){col=L(ln,lh,(n-0.55)/0.45);}else{col=L(od,os,n/0.55);}
      if(lat>0.8)col=L(col,ice,(lat-0.8)/0.2);var i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
    g.putImageData(img,0,0);
    var bump=bumpCanvas(256,128,function(x,y){var n=hf(x,y);return n>0.55?0.55+((n-0.55)):0.35;});
    return {map:tex(c),bump:tex(bump)};}
  function cloudTex(){var W=512,H=256,c=cv(W,H),g=c.getContext('2d'),F=fbmGrid(777,40),img=g.createImageData(W,H),d=img.data;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var n=F(x/W*8,y/H*4),a=(n-0.52)*3.2;a=a<0?0:a>1?1:a;var i=(y*W+x)*4;d[i]=d[i+1]=d[i+2]=255;d[i+3]=a*200;}
    g.putImageData(img,0,0);return tex(c);}
  function gasMaps(base,light,dark){var W=512,H=256,c=cv(W,H),g=c.getContext('2d'),F=fbmGrid((base[0]*7+base[1])|0,48),img=g.createImageData(W,H),d=img.data;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var yn=y/H,band=(Math.sin(yn*Math.PI*11)+1)*.5,turb=F(x/W*6,yn*10)*.5,t=Math.max(0,Math.min(1,band*.6+turb*.6)),col=L(dark,light,t);
      var dsx=(x/W-0.72),dsy=(yn-0.66);if(dsx*dsx*2.2+dsy*dsy*9<0.02){col=L(col,[200,90,60],0.6);}
      var i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
    g.putImageData(img,0,0);var bump=bumpCanvas(256,128,function(x,y){return 0.4+F(x*6,y*10)*.4;});return {map:tex(c),bump:tex(bump)};}
  function rockyMaps(base,dark){var W=384,H=192,c=cv(W,H),g=c.getContext('2d'),F=fbmGrid((base[0]*3+base[2])|0,40),img=g.createImageData(W,H),d=img.data;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var n=F(x/W*8,y/H*5),col=L(dark,base,n);var i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
    g.putImageData(img,0,0);var rnd=makeNoise((base[1]*13)|0);for(var k=0;k<40;k++){var cx=rnd()*W,cy=rnd()*H,r=2+rnd()*7;g.beginPath();g.arc(cx,cy,r,0,6.28);g.fillStyle='rgba(0,0,0,'+(0.12+rnd()*0.18)+')';g.fill();g.beginPath();g.arc(cx-r*0.2,cy-r*0.2,r*0.85,0,6.28);g.strokeStyle='rgba(255,255,255,0.10)';g.lineWidth=1;g.stroke();}
    var bump=bumpCanvas(192,96,function(x,y){return 0.3+F(x*8,y*5)*.5;});return {map:tex(c),bump:tex(bump)};}
  function sunTex(){var W=512,H=256,c=cv(W,H),g=c.getContext('2d'),F=fbmGrid(2026,48),img=g.createImageData(W,H),d=img.data;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var n=F(x/W*10,y/H*8),col=L([255,150,26],[255,244,170],n);var i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255;}
    g.putImageData(img,0,0);return tex(c);}
  function glowSprite(hex){var c=cv(128,128),g=c.getContext('2d');var col=new THREE.Color(hex),r=(col.r*255)|0,gg=(col.g*255)|0,b=(col.b*255)|0;var grd=g.createRadialGradient(64,64,0,64,64,64);grd.addColorStop(0,'rgba('+r+','+gg+','+b+',0.95)');grd.addColorStop(0.4,'rgba('+r+','+gg+','+b+',0.35)');grd.addColorStop(1,'rgba('+r+','+gg+','+b+',0)');g.fillStyle=grd;g.fillRect(0,0,128,128);return tex(c);}
  function planetTex(color){var W=384,H=192,c=cv(W,H),g=c.getContext('2d');var base=new THREE.Color(color),light=base.clone().lerp(new THREE.Color('#ffffff'),.62),mid=base.clone(),dark=base.clone().lerp(new THREE.Color('#180d06'),.6);
    var seed=parseInt(color.slice(1),16)||1234,F=fbmGrid(seed,48),Fw=fbmGrid(seed*3+7,48),img=g.createImageData(W,H),d=img.data;
    for(var y=0;y<H;y++)for(var x=0;x<W;x++){var nx=x/W*10,ny=y/H*6,warp=Fw(nx,ny)*2.2,n=F(nx+warp,ny*2.4),band=(Math.sin((y/H)*Math.PI*7+n*5)+1)*.5,t=n*.55+band*.55;t=t<0?0:t>1?1:t;var cc=t<.5?dark.clone().lerp(mid,t*2):mid.clone().lerp(light,(t-.5)*2);var i=(y*W+x)*4;d[i]=cc.r*255;d[i+1]=cc.g*255;d[i+2]=cc.b*255;d[i+3]=255;}
    g.putImageData(img,0,0);var bump=bumpCanvas(192,96,function(x,y){return 0.3+F(x*10,y*6)*.5;});return {map:tex(c),bump:tex(bump)};}
  var ATMO_V='varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vP=mv.xyz;gl_Position=projectionMatrix*mv;}';
  var ATMO_F='varying vec3 vN;varying vec3 vP;uniform vec3 uColor;uniform float uPower;uniform float uIntensity;void main(){vec3 vd=normalize(-vP);float f=pow(1.0-max(dot(vd,vN),0.0),uPower);gl_FragColor=vec4(uColor,f*uIntensity);}';
  function orbitLine(r,op){var pts=[];for(var a=0;a<=180;a++){var t=a/180*6.2832;pts.push(new THREE.Vector3(Math.cos(t)*r,0,Math.sin(t)*r));}return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:night()?0x9fb4ff:0xb08900,transparent:true,opacity:op}));}
  function buildStars(){if(starfield){scene.remove(starfield);starfield=null;}if(!night())return;var N=1400,pos=new Float32Array(N*3);for(var i=0;i<N;i++){var r=70+Math.random()*160,t=Math.random()*6.28,p=Math.acos(2*Math.random()-1);pos[i*3]=r*Math.sin(p)*Math.cos(t);pos[i*3+1]=r*Math.cos(p);pos[i*3+2]=r*Math.sin(p)*Math.sin(t);}var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));starfield=new THREE.Points(g,new THREE.PointsMaterial({color:0xFFE9A6,size:.5,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(starfield);}
  function clearScene(){if(!pGroup)return;while(pGroup.children.length){var o=pGroup.children[0];pGroup.remove(o);o.traverse&&o.traverse(function(x){if(x.geometry)x.geometry.dispose();if(x.material){if(x.material.map)x.material.map.dispose();if(x.material.bumpMap)x.material.bumpMap.dispose();x.material.dispose();}});}moonLabels.forEach(function(l){l.remove();});moonLabels=[];}

  function buildThemed(k){clearScene();camZ=40;camPX=8;baseTilt=0.18;var col=CAT[k].color,mp=planetTex(col);
    var planet=new THREE.Mesh(new THREE.SphereGeometry(8,72,54),new THREE.MeshStandardMaterial({map:mp.map,bumpMap:mp.bump,bumpScale:.35,roughness:.95,metalness:.03}));pGroup.add(planet);
    var cloud=new THREE.Mesh(new THREE.SphereGeometry(8.12,48,48),new THREE.MeshStandardMaterial({map:cloudTex(),transparent:true,opacity:.28,depthWrite:false}));pGroup.add(cloud);
    var ac=new THREE.Color(col).lerp(new THREE.Color('#ffffff'),.35);
    var atmoMat=new THREE.ShaderMaterial({uniforms:{uColor:{value:new THREE.Vector3(ac.r,ac.g,ac.b)},uPower:{value:3.1},uIntensity:{value:night()?1.4:.85}},vertexShader:ATMO_V,fragmentShader:ATMO_F,transparent:true,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false});
    pGroup.add(new THREE.Mesh(new THREE.SphereGeometry(9.5,48,48),atmoMat));
    var moons=[];CAT[k].moons.forEach(function(nm,i){var rad=13+i*4.5;pGroup.add(orbitLine(rad,night()?.3:.32));var m=new THREE.Mesh(new THREE.SphereGeometry(.7+.2*i,20,20),new THREE.MeshStandardMaterial({color:new THREE.Color(col).lerp(new THREE.Color('#fff'),.4),roughness:.8}));pGroup.add(m);var lab=document.createElement('div');lab.className='moonlab';lab.innerHTML='<b>'+nm+'</b>कक्षा '+(1.9+i*.4).toFixed(1)+' · '+(13+i)+'s';document.body.appendChild(lab);moonLabels.push(lab);moons.push({mesh:m,rad:rad,phase:i*2.1,speed:.3-i*.08,lab:lab});});
    ambient.intensity=night()?.32:.6;keyLight.intensity=night()?1.1:1.5;sunLight.intensity=0;buildStars();
    var wp=new THREE.Vector3();
    sceneUpdate=function(t){planet.rotation.y+=.0015;cloud.rotation.y+=.0022;moons.forEach(function(mo){var a=mo.phase+t*mo.speed;mo.mesh.position.set(Math.cos(a)*mo.rad,Math.sin(a*0.6)*1.5,Math.sin(a)*mo.rad);mo.mesh.getWorldPosition(wp);var p=wp.project(camera),sx=(p.x*.5+.5)*innerWidth;if(p.z<1&&sx>470){mo.lab.style.opacity=1;mo.lab.style.left=sx+'px';mo.lab.style.top=(-p.y*.5+.5)*innerHeight+'px';}else mo.lab.style.opacity=0;});};}

  function buildSolar(){clearScene();camZ=60;camPX=0;baseTilt=0.62;
    var sun=new THREE.Mesh(new THREE.SphereGeometry(4.2,48,48),new THREE.MeshBasicMaterial({map:sunTex()}));pGroup.add(sun);
    var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite(0xffb020),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night()?1:.6}));glow.scale.set(24,24,1);pGroup.add(glow);
    sunLight.position.set(0,0,0);sunLight.intensity=2.6;
    var earth=earthMaps();
    var defs=[
      {r:8,s:.55,type:'rocky',c:[150,138,120],dk:[70,64,56],sp:.9,spin:.02},
      {r:11,s:.85,type:'rocky',c:[214,190,120],dk:[150,120,70],sp:.66,spin:.01},
      {r:15.5,s:1.15,type:'earth',sp:.5,spin:.03,earth:true},
      {r:20,s:.75,type:'rocky',c:[186,86,54],dk:[110,44,30],sp:.4,spin:.03},
      {r:27,s:2.2,type:'gas',c:[211,180,138],lt:[226,206,168],dk:[150,110,70],sp:.24,spin:.05},
      {r:34,s:1.7,type:'gas',c:[224,204,160],lt:[236,224,190],dk:[170,140,96],sp:.17,spin:.04,ring:true}
    ];
    var planets=[];
    defs.forEach(function(d){pGroup.add(orbitLine(d.r,night()?.2:.28));
      var maps=d.type==='earth'?earth:(d.type==='gas'?gasMaps(d.c,d.lt,d.dk):rockyMaps(d.c,d.dk));
      var m=new THREE.Mesh(new THREE.SphereGeometry(d.s,40,30),new THREE.MeshStandardMaterial({map:maps.map,bumpMap:maps.bump,bumpScale:.12,roughness:d.type==='gas'?.9:1,metalness:0}));
      m.rotation.z=0.15+Math.random()*0.25;pGroup.add(m);
      var moon=null,clouds=null;
      if(d.earth){clouds=new THREE.Mesh(new THREE.SphereGeometry(d.s*1.02,32,32),new THREE.MeshStandardMaterial({map:cloudTex(),transparent:true,opacity:.4,depthWrite:false}));m.add(clouds);
        moon=new THREE.Mesh(new THREE.SphereGeometry(.32,16,16),new THREE.MeshStandardMaterial({color:0xcfcfcf,roughness:1}));pGroup.add(moon);
        }
      if(d.ring){var rg=new THREE.Mesh(new THREE.RingGeometry(d.s*1.4,d.s*2.4,52),new THREE.MeshBasicMaterial({color:0xe0c48a,side:THREE.DoubleSide,transparent:true,opacity:.5}));rg.rotation.x=Math.PI/2.2;m.add(rg);}
      planets.push({m:m,r:d.r,a:Math.random()*6.28,sp:d.sp,spin:d.spin,moon:moon,clouds:clouds,ma:Math.random()*6.28,earth:d.earth,lab:d._lab});});
    ambient.intensity=night()?.18:.4;keyLight.intensity=0;buildStars();
    var wp=new THREE.Vector3();
    sceneUpdate=function(t){sun.rotation.y+=.002;var pulse=1+Math.sin(t*1.5)*0.03;glow.scale.set(24*pulse,24*pulse,1);
      planets.forEach(function(p){p.a+=p.sp*0.01;p.m.position.set(Math.cos(p.a)*p.r,0,Math.sin(p.a)*p.r);p.m.rotation.y+=p.spin;if(p.clouds)p.clouds.rotation.y+=.004;
        if(p.moon){p.ma+=0.06;p.moon.position.set(p.m.position.x+Math.cos(p.ma)*2.3,Math.sin(p.ma)*0.7,p.m.position.z+Math.sin(p.ma)*2.3);}
        if(p.earth&&p.lab){p.m.getWorldPosition(wp);var pr=wp.project(camera),sx=(pr.x*.5+.5)*innerWidth;if(pr.z<1){p.lab.style.opacity=1;p.lab.style.left=sx+'px';p.lab.style.top=(-pr.y*.5+.5)*innerHeight+'px';}else p.lab.style.opacity=0;}});};}

  function buildQuantum(){clearScene();camZ=44;camPX=6;baseTilt=0.12;
    var nuc=new THREE.Group();for(var i=0;i<8;i++){var m=new THREE.Mesh(new THREE.SphereGeometry(.9,16,16),new THREE.MeshStandardMaterial({color:i%2?0xff7a7a:0x4f9bff,emissive:i%2?0xff7a7a:0x4f9bff,emissiveIntensity:.5,roughness:.5}));m.position.set((Math.random()-.5)*2.2,(Math.random()-.5)*2.2,(Math.random()-.5)*2.2);nuc.add(m);}pGroup.add(nuc);
    var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite(0x8fbaff),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night()?.85:.5}));glow.scale.set(12,12,1);pGroup.add(glow);
    var CN=1500,cp=new Float32Array(CN*3);for(var i=0;i<CN;i++){var r=6+Math.pow(Math.random(),.5)*7,t=Math.random()*6.28,p=Math.acos(2*Math.random()-1);cp[i*3]=r*Math.sin(p)*Math.cos(t);cp[i*3+1]=r*Math.sin(p)*Math.sin(t);cp[i*3+2]=r*Math.cos(p);}var cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));var cloud=new THREE.Points(cg,new THREE.PointsMaterial({color:0x9fd0ff,size:.28,transparent:true,opacity:night()?.5:.35,depthWrite:false,blending:night()?THREE.AdditiveBlending:THREE.NormalBlending}));pGroup.add(cloud);
    var orbs=[],tl=[[0,0],[Math.PI/2.6,.5],[-Math.PI/3,-.6],[Math.PI/2,Math.PI/2]];
    for(var i=0;i<4;i++){var o=new THREE.Group();o.add(orbitLine(9+i*.7,.5));var e=new THREE.Mesh(new THREE.SphereGeometry(.55,14,14),new THREE.MeshStandardMaterial({color:0xdcefff,emissive:0x8fbaff,emissiveIntensity:.8}));o.add(e);o.rotation.x=tl[i][0];o.rotation.z=tl[i][1];pGroup.add(o);orbs.push({o:o,e:e,a:Math.random()*6.28,s:.05+i*.015,r:9+i*.7});}
    ambient.intensity=night()?.5:.7;keyLight.intensity=night()?1:1.3;sunLight.intensity=0;buildStars();
    sceneUpdate=function(t){nuc.rotation.y+=.012;nuc.rotation.x+=.007;cloud.rotation.y+=.001;cloud.rotation.x+=.0006;orbs.forEach(function(q){q.a+=q.s;q.e.position.set(Math.cos(q.a)*q.r,0,Math.sin(q.a)*q.r);q.o.rotation.y+=.004;});};}
  function buildQComputer(){clearScene();camZ=54;camPX=6;baseTilt=0.05;
    var G=new THREE.Group();G.position.y=-1;pGroup.add(G);var gold=0xd9a441,goldE=0xffcf7a,plates=6;
    var wireMat=new THREE.LineBasicMaterial({color:0xd8c9a0,transparent:true,opacity:.5});
    var plateMat=new THREE.MeshStandardMaterial({color:gold,emissive:goldE,emissiveIntensity:.15,metalness:.85,roughness:.35,side:THREE.DoubleSide});
    var rimMat=new THREE.MeshStandardMaterial({color:goldE,emissive:goldE,emissiveIntensity:.35,metalness:.9,roughness:.3});
    var pInfo=[];
    for(var i=0;i<plates;i++){var rad=7-i*.85,y=9-i*3.0;pInfo.push({rad:rad,y:y});
      var plate=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,.22,48,1,true),plateMat);plate.position.y=y;G.add(plate);
      var rim=new THREE.Mesh(new THREE.TorusGeometry(rad,.14,10,48),rimMat);rim.rotation.x=Math.PI/2;rim.position.y=y+.12;G.add(rim);}
    for(var i=0;i<plates-1;i++){var up=pInfo[i],lo=pInfo[i+1],count=26+i*4;
      for(var w=0;w<count;w++){var ang=w/count*6.2832+i*.12,r1=up.rad*.98,r2=lo.rad*.98;
        var A=new THREE.Vector3(Math.cos(ang)*r1,up.y-.1,Math.sin(ang)*r1);
        var B=new THREE.Vector3(Math.cos(ang)*r2,lo.y+.1,Math.sin(ang)*r2);
        var bulge=up.rad+.9;var C=new THREE.Vector3(Math.cos(ang)*bulge,(up.y+lo.y)/2,Math.sin(ang)*bulge);
        var pts=new THREE.QuadraticBezierCurve3(A,C,B).getPoints(14);
        G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wireMat));}}
    var last=pInfo[plates-1];
    for(var w=0;w<70;w++){var ang=Math.random()*6.28,r=Math.random()*last.rad*.85;
      var A=new THREE.Vector3(Math.cos(ang)*r,last.y-.1,Math.sin(ang)*r);
      var B=new THREE.Vector3(Math.cos(ang)*r*.3,last.y-5-Math.random()*2,Math.sin(ang)*r*.3);
      var C=new THREE.Vector3(A.x*1.1,(A.y+B.y)/2,A.z*1.1);
      G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(A,C,B).getPoints(10)),wireMat));}
    var coreY=last.y-6.8;var core=new THREE.Mesh(new THREE.SphereGeometry(.8,24,24),new THREE.MeshStandardMaterial({color:0x9fe8ff,emissive:0x2fd6c4,emissiveIntensity:.9,roughness:.3}));core.position.y=coreY;G.add(core);
    var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite(0x2fd6c4),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}));glow.scale.set(9,9,1);glow.position.y=coreY;G.add(glow);
    ambient.intensity=night()?.5:.78;keyLight.intensity=1.7;sunLight.intensity=0;buildStars();
    sceneUpdate=function(t){G.rotation.y+=.003;var s=1+Math.sin(t*3)*.15;core.scale.set(s,s,s);};}
  function buildSeedGrow(){clearScene();camZ=46;camPX=5;baseTilt=0.06;
    var G=new THREE.Group();pGroup.add(G);
    G.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-24,-13,0),new THREE.Vector3(24,-13,0)]),new THREE.LineBasicMaterial({color:0x6b7a44,transparent:true,opacity:.6})));
    var sun=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite(0xffe08a),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night()?.85:.6}));sun.scale.set(16,16,1);sun.position.set(15,13,-6);G.add(sun);
    var dir=new THREE.DirectionalLight(0xfff0c0,1.3);dir.position.set(15,13,10);G.add(dir);
    var plant=new THREE.Group();plant.position.set(0,-13,0);G.add(plant);
    plant.add(new THREE.Mesh(new THREE.SphereGeometry(.6,12,12),new THREE.MeshStandardMaterial({color:0x6a4a28,roughness:1})));
    var sp=[];for(var i=0;i<=30;i++){var f=i/30;sp.push(new THREE.Vector3(Math.sin(f*3)*1.4*f,f*22,0));}var curve=new THREE.CatmullRomCurve3(sp);
    plant.add(new THREE.Mesh(new THREE.TubeGeometry(curve,44,.35,8,false),new THREE.MeshStandardMaterial({color:0x4a7a3a,roughness:.9})));
    for(var i=0;i<10;i++){var f=.2+i*.08,p=curve.getPoint(f);var lf=new THREE.Mesh(new THREE.SphereGeometry(1.2,10,10),new THREE.MeshStandardMaterial({color:0x5aa03a,roughness:.85,flatShading:true}));lf.scale.set(2,.4,1.2);lf.position.copy(p);lf.position.x+=(i%2?1.8:-1.8);lf.rotation.z=(i%2?-.5:.5);plant.add(lf);}
    var top=curve.getPoint(1),bl=800,bp=new Float32Array(bl*3);for(var i=0;i<bl;i++){var dy=Math.random()*7;bp[i*3]=top.x+(Math.random()-.5)*5;bp[i*3+1]=top.y-dy;bp[i*3+2]=(Math.random()-.5)*4;}var bgeo=new THREE.BufferGeometry();bgeo.setAttribute('position',new THREE.BufferAttribute(bp,3));plant.add(new THREE.Points(bgeo,new THREE.PointsMaterial({color:0xffd23c,size:.85,transparent:true,opacity:.92,depthWrite:false,blending:night()?THREE.AdditiveBlending:THREE.NormalBlending})));
    var rn=200,rp=new Float32Array(rn*3),rv=[];for(var i=0;i<rn;i++){rp[i*3]=(Math.random()-.5)*46;rp[i*3+1]=Math.random()*32-13;rp[i*3+2]=(Math.random()-.5)*14;rv.push(.35+Math.random()*.4);}var rgeo=new THREE.BufferGeometry();rgeo.setAttribute('position',new THREE.BufferAttribute(rp,3));G.add(new THREE.Points(rgeo,new THREE.PointsMaterial({color:0xaaccee,size:.7,transparent:true,opacity:.6,depthWrite:false})));
    ambient.intensity=night()?.45:.78;keyLight.intensity=.7;sunLight.intensity=0;buildStars();var grow=.35;
    sceneUpdate=function(t){grow+=.005;if(grow>1.5)grow=.35;var g=Math.min(1,grow),sc=.3+g*.9;plant.scale.set(sc,sc,sc);var a=rgeo.attributes.position.array;for(var i=0;i<rn;i++){a[i*3+1]-=rv[i];a[i*3]+=.07;if(a[i*3+1]<-13){a[i*3+1]=18;a[i*3]=(Math.random()-.5)*46;}}rgeo.attributes.position.needsUpdate=true;};}
  function buildBrainExploded(){clearScene();camZ=42;camPX=6;baseTilt=0.12;
    var G=new THREE.Group();pGroup.add(G);
    var lobes=[{p:[-3.4,1.4,0],s:[3.4,3.2,3.4]},{p:[3.4,1.4,0],s:[3.4,3.2,3.4]},{p:[0,4.2,-1.4],s:[3,2.2,2.8]},{p:[0,-2.6,-3.6],s:[2.6,1.8,2.2]},{p:[0,-3.4,1.6],s:[1.1,2.4,1.1]}];
    var meshes=[];lobes.forEach(function(l){var geo=new THREE.SphereGeometry(1,26,20),pos=geo.attributes.position;
      for(var i=0;i<pos.count;i++){var vx=pos.getX(i),vy=pos.getY(i),vz=pos.getZ(i),n=Math.sin(vx*5)*Math.cos(vy*5)*Math.sin(vz*5)*.13;pos.setXYZ(i,vx*(1+n),vy*(1+n),vz*(1+n));}geo.computeVertexNormals();
      var m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xff9ab0,emissive:0x7a1c34,emissiveIntensity:.18,roughness:.75,flatShading:true}));m.scale.set(l.s[0]/2,l.s[1]/2,l.s[2]/2);m.userData.home=new THREE.Vector3(l.p[0],l.p[1],l.p[2]);m.position.copy(m.userData.home);G.add(m);meshes.push(m);});
    var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSprite(0xff6f9c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:night()?.5:.3}));glow.scale.set(22,22,1);G.add(glow);
    ambient.intensity=night()?.55:.8;keyLight.intensity=1.35;sunLight.intensity=0;buildStars();
    sceneUpdate=function(t){G.rotation.y+=.004;var ex=1+Math.sin(t*.6)*.35;meshes.forEach(function(m){m.position.copy(m.userData.home).multiplyScalar(ex);});};}
  function buildNeural(){clearScene();camZ=46;camPX=6;baseTilt=0.1;
    var G=new THREE.Group();pGroup.add(G);var layers=[4,6,6,3],xgap=9,ygap=3.2,col=0xb98cff,cyan=0x6ad5ff,nbl=[];
    layers.forEach(function(cnt,li){var arr=[],x=(li-(layers.length-1)/2)*xgap;for(var n=0;n<cnt;n++){var y=(n-(cnt-1)/2)*ygap;var nd=new THREE.Mesh(new THREE.SphereGeometry(.5,16,16),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,roughness:.5}));nd.position.set(x,y,(Math.random()-.5)*2);G.add(nd);arr.push(nd);}nbl.push(arr);});
    var segPts=[],pulses=[];for(var li=0;li<nbl.length-1;li++){nbl[li].forEach(function(a){nbl[li+1].forEach(function(b){if(Math.random()<.6){segPts.push(a.position.clone());segPts.push(b.position.clone());if(Math.random()<.25)pulses.push({a:a.position.clone(),b:b.position.clone(),t:Math.random()});}});});}
    G.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segPts),new THREE.LineBasicMaterial({color:col,transparent:true,opacity:night()?.3:.25})));
    var pc=new Float32Array(pulses.length*3),pgeo=new THREE.BufferGeometry();pgeo.setAttribute('position',new THREE.BufferAttribute(pc,3));G.add(new THREE.Points(pgeo,new THREE.PointsMaterial({color:cyan,size:.7,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending})));
    ambient.intensity=night()?.5:.75;keyLight.intensity=1.1;sunLight.intensity=0;buildStars();
    sceneUpdate=function(t){var arr=pgeo.attributes.position.array;pulses.forEach(function(p,i){p.t+=.01;if(p.t>1)p.t-=1;arr[i*3]=p.a.x+(p.b.x-p.a.x)*p.t;arr[i*3+1]=p.a.y+(p.b.y-p.a.y)*p.t;arr[i*3+2]=p.a.z+(p.b.z-p.a.z)*p.t;});pgeo.attributes.position.needsUpdate=true;nbl.forEach(function(Lr){Lr.forEach(function(n){n.material.emissiveIntensity=.4+Math.sin(t*3+n.position.y)*.25;});});};}

  function buildMessages(){clearScene();camZ=52;camPX=0;baseTilt=0.12;
    function iconTex(kind,hex){var c=document.createElement('canvas');c.width=c.height=128;var g=c.getContext('2d');g.strokeStyle=hex;g.lineWidth=7;g.lineCap='round';g.lineJoin='round';g.translate(64,64);
      if(kind==='mail'){g.strokeRect(-40,-28,80,56);g.beginPath();g.moveTo(-40,-28);g.lineTo(0,6);g.lineTo(40,-28);g.stroke();}
      else if(kind==='lock'){g.strokeRect(-30,-6,60,46);g.beginPath();g.arc(0,-8,20,Math.PI,0,false);g.stroke();g.beginPath();g.arc(0,16,5,0,6.28);g.fillStyle=hex;g.fill();}
      else if(kind==='chat'){g.beginPath();g.moveTo(-38,-26);g.lineTo(38,-26);g.quadraticCurveTo(48,-26,48,-16);g.lineTo(48,10);g.quadraticCurveTo(48,20,38,20);g.lineTo(-14,20);g.lineTo(-30,36);g.lineTo(-28,20);g.lineTo(-38,20);g.quadraticCurveTo(-48,20,-48,10);g.lineTo(-48,-16);g.quadraticCurveTo(-48,-26,-38,-26);g.stroke();}
      else if(kind==='at'){g.font='bold 88px monospace';g.fillStyle=hex;g.textAlign='center';g.textBaseline='middle';g.fillText('@',0,4);}
      else{g.beginPath();g.arc(-16,0,16,0,6.28);g.stroke();g.beginPath();g.moveTo(0,0);g.lineTo(42,0);g.moveTo(30,0);g.lineTo(30,14);g.moveTo(42,0);g.lineTo(42,16);g.stroke();}
      return new THREE.CanvasTexture(c);}
    var cols=['#ffc24d','#6ad5ff','#9ff0e0','#b98cff'],kinds=['mail','lock','chat','at','key'],items=[];
    for(var i=0;i<44;i++){var k=kinds[i%kinds.length],col=cols[i%cols.length];
      var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:iconTex(k,col),transparent:true,depthWrite:false,opacity:.92,blending:night()?THREE.AdditiveBlending:THREE.NormalBlending}));
      var s=2.4+Math.random()*3;sp.scale.set(s,s,1);sp.position.set((Math.random()-.5)*54,(Math.random()-.5)*32,(Math.random()-.5)*34);
      pGroup.add(sp);items.push({sp:sp,by:sp.position.y,ph:Math.random()*6.28,spd:.15+Math.random()*.4,rot:(Math.random()-.5)*.01});}
    var pn=700,pp=new Float32Array(pn*3);for(var i=0;i<pn;i++){pp[i*3]=(Math.random()-.5)*72;pp[i*3+1]=(Math.random()-.5)*46;pp[i*3+2]=(Math.random()-.5)*42;}var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));var parts=new THREE.Points(pg,new THREE.PointsMaterial({color:0x6ad5ff,size:.32,transparent:true,opacity:night()?.5:.32,depthWrite:false,blending:night()?THREE.AdditiveBlending:THREE.NormalBlending}));pGroup.add(parts);
    ambient.intensity=night()?.6:.85;keyLight.intensity=1;sunLight.intensity=0;buildStars();
    sceneUpdate=function(t){items.forEach(function(q){q.sp.position.y=q.by+Math.sin(t*q.spd+q.ph)*2;q.sp.material.rotation+=q.rot;});parts.rotation.y+=.0004;};}
  function buildScene(k){var f={space:buildSolar,science:buildQuantum,tech:buildQComputer,environment:buildSeedGrow,health:buildBrainExploded,srijan:buildNeural,contact:buildMessages}[k];if(f)f();else buildThemed(k);}

  var tgt={x:0,y:0},dragging=false,lx=0,vy=0,rotY=0;
  function onOrient(e){if(e.gamma==null&&e.beta==null)return;tgt.x=Math.max(-0.7,Math.min(0.7,(e.gamma||0)/40));tgt.y=Math.max(-0.7,Math.min(0.7,((e.beta||0)-40)/45));}
  function initThree(){THREE=window.THREE;var canvas=document.getElementById('spaceCanvas');
    renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0,0);renderer.setSize(innerWidth,innerHeight);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,700);camera.position.set(0,0,camZ);
    ambient=new THREE.AmbientLight(0xffffff,.4);scene.add(ambient);keyLight=new THREE.PointLight(0xffffff,1.5);keyLight.position.set(40,25,45);scene.add(keyLight);
    sunLight=new THREE.PointLight(0xfff2d0,0,300);pGroup=null;
    pGroup=new THREE.Group();scene.add(pGroup);pGroup.add(sunLight);ray=new THREE.Raycaster();m2=new THREE.Vector2();
    buildScene(current);
    addEventListener('pointermove',function(e){tgt.x=(e.clientX/innerWidth-.5);tgt.y=(e.clientY/innerHeight-.5);if(dragging){vy=(e.clientX-lx)*.006;rotY+=vy;lx=e.clientX;}});
    canvas.addEventListener('pointerdown',function(e){dragging=true;lx=e.clientX;});addEventListener('pointerup',function(){dragging=false;});
    addEventListener('resize',function(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    window.addEventListener('deviceorientation',onOrient,true);
    window.addEventListener('touchstart',function once(){if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(function(s){if(s==='granted')window.addEventListener('deviceorientation',onOrient,true);}).catch(function(){});}window.removeEventListener('touchstart',once);},{once:true});
    var clock=new THREE.Clock();
    (function frame(){requestAnimationFrame(frame);var t=clock.getElapsedTime();
      rotY+=vy;vy*=.93;rotY+=0.0006;
      pGroup.rotation.y+=(rotY-pGroup.rotation.y)*.06;
      pGroup.rotation.x+=((baseTilt+tgt.y*0.45)-pGroup.rotation.x)*.05;
      pGroup.rotation.z+=((tgt.x*0.3)-pGroup.rotation.z)*.05;
      pGroup.position.x+=(camPX-pGroup.position.x)*.06;
      if(sceneUpdate)sceneUpdate(t);
      camera.position.x+=((tgt.x*7)-camera.position.x)*.05;camera.position.y+=((-tgt.y*5)-camera.position.y)*.05;camera.position.z+=(camZ-camera.position.z)*.05;camera.lookAt(0,0,0);
      if(starfield)starfield.rotation.y+=.0003;renderer.render(scene,camera);})();}



 function loadThree(cb){if(window.THREE){cb();return;}var srcs=['https://unpkg.com/three@0.128.0/build/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'],i=0;(function n(){if(window.THREE){cb();return;}if(i>=srcs.length)return;var s=document.createElement('script');s.src=srcs[i++];s.onload=function(){window.THREE?cb():n();};s.onerror=n;document.head.appendChild(s);})();}
 loadThree(initThree);
 try{new MutationObserver(function(){try{if(window.THREE&&typeof renderer!=='undefined'&&renderer)buildScene(current);}catch(e){}}).observe(document.body,{attributes:true,attributeFilter:['data-theme']});}catch(e){}
})();
