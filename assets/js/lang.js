(function(){
  var LABELS={hi:'हिंदी',aw:'अवधी',en:'English'},ORDER=['hi','aw','en'];
  function gv(){try{return localStorage.getItem('lang')||'hi';}catch(e){return 'hi';}}
  function sv(l){try{localStorage.setItem('lang',l);}catch(e){}}
  window.PLANG=gv();
  window.PLpick=function(hi,aw,en){return window.PLANG==='en'?(en!=null?en:hi):(window.PLANG==='aw'?(aw!=null?aw:hi):hi);};
  function applyStatic(){
    document.documentElement.lang=(window.PLANG==='en'?'en':'hi');
    document.body.setAttribute('data-lang',window.PLANG);
    [].forEach.call(document.querySelectorAll('[data-hi]'),function(el){
      var v=window.PLANG==='en'?el.getAttribute('data-en'):(window.PLANG==='aw'?el.getAttribute('data-aw'):el.getAttribute('data-hi'));
      if(v!=null)el.textContent=v;});
    var ll=document.getElementById('langlabel');if(ll)ll.textContent=LABELS[window.PLANG];
  }
  function wire(){var b=document.getElementById('lang-toggle');if(!b)return;
    b.addEventListener('click',function(){window.PLANG=ORDER[(ORDER.indexOf(window.PLANG)+1)%ORDER.length];sv(window.PLANG);applyStatic();try{document.dispatchEvent(new Event('plang'));}catch(e){}});}
  function wireNav(){
    var nav=document.querySelector('.nav'),tools=document.querySelector('.tools');
    if(!nav||!tools||document.getElementById('navToggle'))return;
    var b=document.createElement('button');b.id='navToggle';b.className='navtoggle';b.setAttribute('aria-label','मेनू');b.textContent='☰';
    tools.insertBefore(b,tools.firstChild);
    b.addEventListener('click',function(e){e.stopPropagation();nav.classList.toggle('open');});
    document.addEventListener('click',function(e){if(nav.classList.contains('open')&&!nav.contains(e.target)&&e.target!==b)nav.classList.remove('open');});
    nav.addEventListener('click',function(e){if(e.target.tagName==='A')nav.classList.remove('open');});
  }
  function boot(){wire();wireNav();applyStatic();}
  if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();
