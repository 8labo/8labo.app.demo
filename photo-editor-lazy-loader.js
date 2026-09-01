(function(){
  const path=location.pathname.split('/').pop()||'';
  if(!['website-admin.html','website-admin-v2.html'].includes(path))return;
  let loading=false,loaded=false,pendingKey=null,installed=false;
  function loadEditor(key){
    pendingKey=key;
    if(loaded){
      if(typeof window.__photoEditorV3Open==='function')window.__photoEditorV3Open(key);
      else if(typeof window.openCrop==='function'&&window.openCrop!==lazyOpen)window.openCrop(key);
      return;
    }
    if(loading)return;
    loading=true;
    const s=document.createElement('script');
    s.src='photo-editor-v3.js?v=4';
    s.onload=()=>{
      loading=false;loaded=true;
      if(typeof window.openCrop==='function'&&window.openCrop!==lazyOpen)window.__photoEditorV3Open=window.openCrop;
      window.openCrop=lazyOpen;
      const k=pendingKey;pendingKey=null;
      if(k&&typeof window.__photoEditorV3Open==='function')window.__photoEditorV3Open(k);
    };
    s.onerror=()=>{loading=false;alert('画像調整機能の読み込みに失敗しました。')};
    document.head.appendChild(s);
  }
  function lazyOpen(key){loadEditor(key)}
  function labelButtons(){
    document.querySelectorAll('#mediaList button').forEach(b=>{
      if((b.getAttribute('onclick')||'').includes('openCrop'))b.textContent='画像調整';
    });
  }
  function install(){
    if(installed)return true;
    const list=document.getElementById('mediaList');
    if(!list||typeof window.openCrop!=='function')return false;
    window.__baseOpenCrop=window.openCrop;
    window.openCrop=lazyOpen;
    labelButtons();
    new MutationObserver(labelButtons).observe(list,{childList:true,subtree:true});
    installed=true;
    return true;
  }
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(install()||tries>=40)clearInterval(timer);
  },250);
  if(document.readyState!=='loading')install();
})();