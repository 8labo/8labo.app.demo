(function(){
  const path=location.pathname.split('/').pop()||'';
  if(!['website-admin.html','website-admin-v2.html'].includes(path))return;

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.defer=true;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error(src+' の読み込みに失敗しました'));
      document.head.appendChild(s);
    });
  }

  function baseReady(){
    const app=document.getElementById('app');
    const mediaList=document.getElementById('mediaList');
    const status=document.getElementById('status');
    return !!(app&&!app.classList.contains('hidden')&&mediaList&&mediaList.children.length&&status);
  }

  async function start(){
    let tries=0;
    while(!baseReady()&&tries<100){
      await new Promise(r=>setTimeout(r,100));
      tries++;
    }
    if(!baseReady())return;

    // photo-library-v2 は単独動作を確認済み。先に適用する。
    await loadScript('photo-library-v2.js?v=4');

    // photo-editor-v2 の初期処理は renderMedia() を短時間繰り返す可能性があるため、
    // 初期化中だけ再描画を1回に制限する。編集機能そのものは変更しない。
    const originalRenderMedia=window.renderMedia;
    let renderCount=0;
    if(typeof originalRenderMedia==='function'){
      window.renderMedia=function(){
        renderCount++;
        if(renderCount===1)return originalRenderMedia.apply(this,arguments);
      };
    }

    try{
      await loadScript('photo-editor-v2.js?v=9');
      await new Promise(r=>setTimeout(r,700));
    }finally{
      if(typeof originalRenderMedia==='function'){
        window.renderMedia=originalRenderMedia;
        originalRenderMedia();
      }
    }

    // 一括明るさ調整は、通常の画像調整UIが安定してから最後に追加する。
    await loadScript('photo-auto-normalize.js?v=p072-safe1');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{start().catch(console.error)});
  else start().catch(console.error);
})();