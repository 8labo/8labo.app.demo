(function(){
  const page=location.pathname.split('/').pop()||'';
  if(page!=='staff.html') return;
  function apply(){
    const content=document.getElementById('content');
    if(!content||content.classList.contains('hidden')) return;
    const cards=[...content.querySelectorAll('.card')];
    cards.forEach(card=>{card.style.display=card.classList.contains('disabled')?'none':'flex';});
    const titles=[...content.querySelectorAll('.title')];
    titles.forEach(title=>{
      const grid=title.nextElementSibling;
      if(!grid?.classList.contains('grid')) return;
      const visible=[...grid.querySelectorAll('.card')].some(c=>!c.classList.contains('disabled'));
      title.style.display=visible?'block':'none';
      grid.style.display=visible?'grid':'none';
    });
  }
  const observer=new MutationObserver(()=>apply());
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      const c=document.getElementById('content');
      if(c)observer.observe(c,{subtree:true,attributes:true,attributeFilter:['class']});
      setTimeout(apply,250);setTimeout(apply,800);
    });
  }else{
    const c=document.getElementById('content');
    if(c)observer.observe(c,{subtree:true,attributes:true,attributeFilter:['class']});
    setTimeout(apply,250);setTimeout(apply,800);
  }
})();