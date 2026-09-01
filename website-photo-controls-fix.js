(function(){
  function activateTab(button){
    const tab=button?.dataset?.tab;
    if(!tab)return;
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===button));
    document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===tab));
  }
  function patchLabels(){
    document.querySelectorAll('#mediaList button').forEach(btn=>{
      const code=btn.getAttribute('onclick')||'';
      if(code.includes('openCrop('))btn.textContent='画像調整';
    });
  }
  function init(){
    if(!document.getElementById('app'))return;
    document.addEventListener('click',e=>{
      const tab=e.target.closest?.('.tab[data-tab]');
      if(tab){e.preventDefault();activateTab(tab);return;}
      const btn=e.target.closest?.('#mediaList button');
      if(!btn)return;
      const code=btn.getAttribute('onclick')||'';
      const m=code.match(/openCrop\('([^']+)'\)/);
      if(!m)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof window.openCrop==='function')window.openCrop(m[1]);
    },true);
    const list=document.getElementById('mediaList');
    if(list){new MutationObserver(patchLabels).observe(list,{childList:true,subtree:true});patchLabels();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();