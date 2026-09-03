(function(){
 const clamp=(v)=>Math.min(200,Math.max(50,v));
 function init(){
  const media=document.getElementById('media');
  if(!media||document.getElementById('bulkBrightnessCard'))return;
  const list=document.getElementById('mediaList');
  const card=list?.closest('.card');
  if(!card)return;
  const box=document.createElement('div');
  box.id='bulkBrightnessCard';
  box.style.cssText='margin:14px 0 4px;padding:12px 13px;border:1px solid #e5e7eb;border-radius:13px;background:#fafbfc';
  box.innerHTML='<div style="font-size:11px;font-weight:900;margin-bottom:3px">掲載中の写真を一括で明るさ調整</div><div style="font-size:9px;color:#6b7280;line-height:1.6;margin-bottom:9px">現在掲載されている写真すべての明るさを同じ値にします。画角・ズーム・PC／スマホ設定は変更しません。</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button id="bulkBm" class="btn ghost" type="button">−</button><strong id="bulkBValue" style="min-width:48px;text-align:center;font-size:11px">100%</strong><button id="bulkBp" class="btn ghost" type="button">＋</button><button id="bulkBSave" class="btn blue" type="button">この明るさを一括保存</button><span id="bulkBState" style="font-size:9px;font-weight:800"></span></div>';
  card.insertBefore(box,list);
  let value=100;
  const out=document.getElementById('bulkBValue'),state=document.getElementById('bulkBState'),save=document.getElementById('bulkBSave');
  const draw=()=>out.textContent=value+'%';
  document.getElementById('bulkBm').onclick=()=>{value=clamp(value-5);draw()};
  document.getElementById('bulkBp').onclick=()=>{value=clamp(value+5);draw()};
  save.onclick=async()=>{
   const targets=(typeof contents!=='undefined'?contents:[]).filter(x=>x.content_value&&String(x.content_key||'').endsWith('_image'));
   if(!targets.length){state.textContent='掲載中の写真がありません';return}
   if(!confirm(`掲載中の写真 ${targets.length}枚をすべて明るさ${value}%にしますか？`))return;
   save.disabled=true;save.textContent='保存中…';state.textContent='';
   const keys=targets.map(x=>x.content_key);
   const {error}=await sb.from('website_content').update({image_brightness:value,updated_at:new Date().toISOString()}).in('content_key',keys);
   save.disabled=false;save.textContent='この明るさを一括保存';
   if(error){state.textContent='保存できませんでした';return}
   targets.forEach(x=>x.image_brightness=value);
   state.textContent=`${targets.length}枚を${value}%にしました ✓`;
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();