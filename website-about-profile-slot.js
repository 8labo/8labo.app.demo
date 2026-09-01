(function(){
  function install(){
    try{
      if(typeof labels==='undefined'||!document.getElementById('mediaSlot'))return false;
      labels.about_profile_image='私たちについて｜創設者プロフィール写真';
      const select=document.getElementById('mediaSlot');
      if(!select.querySelector('option[value="about_profile_image"]')){
        const o=document.createElement('option');o.value='about_profile_image';o.textContent=labels.about_profile_image;select.appendChild(o);
      }
      if(typeof renderMedia==='function')renderMedia();
      return true;
    }catch(_){return false}
  }
  let n=0;const t=setInterval(()=>{n++;if(install()||n>60)clearInterval(t)},100);
})();
