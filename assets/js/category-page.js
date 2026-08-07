(function(){
  var CAT={
    space:{hi:'अंतरिक्ष',aw:'अंतरिक्ष',en2:'Space',en:'THE INFINITE EXPANSE',ep:'ब्रह्मांड का द्वार',epAw:'ब्रह्मांड क द्वार',epEn:'Gateway to the Cosmos',color:'#ef8a34'},
    science:{hi:'विज्ञान',aw:'विज्ञान',en2:'Science',en:'THE CURIOUS MIND',ep:'खोज का सागर',epAw:'खोज क सागर',epEn:'Ocean of Discovery',color:'#4f9bff'},
    tech:{hi:'तकनीक',aw:'तकनीक',en2:'Technology',en:'THE SILICON FRONTIER',ep:'भविष्य की धड़कन',epAw:'भविष्य क धड़कन',epEn:'Pulse of the Future',color:'#22c9b8'},
    environment:{hi:'पर्यावरण',aw:'पर्यावरन',en2:'Environment',en:'THE LIVING EARTH',ep:'हमारा एकमात्र घर',epAw:'हमार एकलौत घर',epEn:'Our Only Home',color:'#4fbf63'},
    health:{hi:'स्वास्थ्य',aw:'सेहत',en2:'Health',en:'THE HUMAN BODY',ep:'जीवन का विज्ञान',epAw:'जिनगी क विज्ञान',epEn:'The Science of Life',color:'#ff6f9c'},
    srijan:{hi:'सृजन रोबॉटिक्स',aw:'सृजन रोबॉटिक्स',en2:'Srijan Robotics',en:'THE AWAKENING MIND',ep:'प्रज्ञा का अवतार',epAw:'प्रज्ञा क अवतार',epEn:'The Awakening Mind',color:'#b98cff'}
  };
  var H2K={'अंतरिक्ष':'space','विज्ञान':'science','तकनीक':'tech','पर्यावरण':'environment','स्वास्थ्य':'health','सृजन रोबॉटिक्स':'srijan'};
  function key(){var p=(location.pathname||'').toLowerCase();var m=['space','science','tech','environment','health','srijan'];for(var i=0;i<m.length;i++)if(p.indexOf(m[i])>-1)return m[i];return 'space';}
  var k=key(),d=CAT[k],ARTS=[];
  function P(h,a,e){return window.PLpick?window.PLpick(h,a,e):h;}
  function esc(s){return (s==null?'':(''+s)).replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});}
  function ago(x){if(!x)return '';var t=(Date.now()-new Date(x).getTime())/86400000;if(t<1)return P('आज','आज','Today');if(t<2)return P('कल','काल्ह','Yesterday');if(t<8)return Math.floor(t)+' '+P('दिन पहले','दिन पहिले','days ago');return new Date(x).toLocaleDateString('hi-IN',{day:'numeric',month:'short'});}
  function night(){return document.body.getAttribute('data-theme')!=='light';}
  function initTheme(){var b=document.getElementById('theme-toggle');function lab(){if(b)b.textContent=night()?'🌙 रात':'☀️ दिन';}try{var s=localStorage.getItem('theme');if(s)document.body.setAttribute('data-theme',s);}catch(e){}lab();if(b)b.addEventListener('click',function(){document.body.setAttribute('data-theme',night()?'light':'dark');try{localStorage.setItem('theme',document.body.getAttribute('data-theme'));}catch(e){}lab();});}
  function setHero(){document.documentElement.style.setProperty('--cc',d.color);document.body.style.setProperty('--cc',d.color);document.title=P(d.hi,d.aw,d.en2)+' — PrajnaAGI';
    var eb=document.getElementById('catEyebrow');if(eb)eb.textContent=P('क्षेत्र','क्षेत्र','REALM')+' · '+d.en;
    var tt=document.getElementById('catTitle');if(tt)tt.textContent=P(d.hi,d.aw,d.en2);
    var sb=document.getElementById('catSub');if(sb)sb.textContent=P(d.ep,d.epAw,d.epEn);
    [].forEach.call(document.querySelectorAll('#nav a'),function(a){a.classList.toggle('active',a.getAttribute('data-k')===k);});}
  function render(){var g=document.getElementById('catGrid');if(!g)return;
    if(!ARTS.length){g.innerHTML='<p class="empty hi">'+P('इस श्रेणी में लेख जल्द आ रहे हैं…','ई श्रेणी में लेख जल्दिये आई…','Articles coming soon…')+'</p>';return;}
    var h='';ARTS.forEach(function(a,i){var big=i===0?' big':'';
      h+='<a class="artcard'+big+'" style="--d:'+(Math.min(i,12)*0.05)+'s" href="article.html?id='+encodeURIComponent(a.slug)+'">'
        +'<div class="thumb"><div class="img" style="background-image:url(\''+esc(a.image)+'\')"></div><span class="tag hi">'+esc(a.tag||d.hi)+'</span></div>'
        +'<div class="body"><h3 class="hi">'+esc(a.title)+'</h3><p class="hi">'+esc(a.summary||'')+'</p>'
        +'<div class="foot"><span class="hi">'+ago(a.date)+'</span><span class="read hi">'+P('पढ़ें →','पढ़ीं →','Read →')+'</span></div></div></a>';});
    g.innerHTML=h;}
  async function boot(){setHero();initTheme();
    try{var data=await (await fetch('content/articles.json',{cache:'no-store'})).json();
      ARTS=(data.articles||[]).filter(function(a){return H2K[a.category]===k&&!a.hidden;}).sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
      render();}catch(e){var g=document.getElementById('catGrid');if(g)g.innerHTML='<p class="empty hi">लेख लोड नहीं हो सके।</p>';}
    var lo=document.getElementById('load');if(lo)setTimeout(function(){lo.classList.add('hide');},400);}
  document.addEventListener('plang',function(){setHero();render();});
  if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();
