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
  function boot(){wire();applyStatic();}
  if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();
