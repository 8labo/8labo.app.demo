(function(){
  const path=location.pathname.split('/').pop()||'';
  if(!['website-admin.html','website-admin-v2.html'].includes(path))return;
  let loading=false,loaded=false,pendingKey=null;
  function loadEditor(key){
    pendingKey=key;
    if(loaded){if(typeof window.openCrop==='function')window.openCrop(key);return;}
    if(loading)return;
    loading=true;
    const s=document.createElement('script');
    s.src='photo-editor-v3.js?v=3';
    s.onload=()=>{
      loading=false;loaded=true;
      const k=pendingKey;pendingKey=null;
      if(typeof window.openCrop==='function'&&k)window.openCrop(k);
    };
    s.onerror=()=>{loading=false;alert('画像調整機能の読み込みに失敗しました。')};
    document.head.appendChild(s);
  }
  window.openCrop=function(key){loadEditor(key)};
  function labelButtons(){
    document.querySelectorAll('#mediaList button').forEach(b=>{
      if((b.getAttribute('onclick')||'').includes('openCrop'))b.textContent='画像調整';
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
    labelButtons();const list=document.getElementById('mediaList');if(list)new MutationObserver(labelButtons).observe(list,{childList:true,subtree:true});
  });else{
    labelButtons();const list=document.getElementById('mediaList');if(list)new MutationObserver(labelButtons).observe(list,{childList:true,subtree:true});
  }
})();