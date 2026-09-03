(function(){
 const clamp=(v,min=50,max=200)=>Math.min(max,Math.max(min,v));
 const round5=v=>Math.round(v/5)*5;
 async function imageLuminance(url){
  return await new Promise((resolve,reject)=>{
   const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
   img.onload=()=>{try{
    const size=72,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const sw=img.naturalWidth,sh=img.naturalHeight,crop=.08,sx=sw*crop,sy=sh*crop,sww=sw*(1-crop*2),shh=sh*(1-crop*2);
    ctx.drawImage(img,sx,sy,sww,shh,0,0,size,size);
    const d=ctx.getImageData(0,0,size,size).data,vals=[];
    for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];if(y>12&&y<245)vals.push(y)}
    if(vals.length<100)return reject(new Error('画像解析データ不足'));
    vals.sort((a,b)=>a-b);const lo=Math.floor(vals.length*.15),hi=Math.ceil(vals.length*.85),mid=vals.slice(lo,hi);
    const avg=mid.reduce((a,b)=>a+b,0)/mid.length;resolve(avg)
   }catch(e){reject(e)}};
   img.onerror=()=>reject(new Error('画像を読み込めませんでした'));
   img.src=url+(url.includes('?')?'&':'?')+'brightness_analysis=1';
  })
 }
 async function saveValues(items){
  const now=new Date().toISOString();
  const results=await Promise.all(items.map(x=>sb.from('website_content').update({image_brightness:x.value,updated_at:now}).eq('content_key',x.key)));
  const bad=results.find(r=>r.error);if(bad)throw bad.error;
  items.forEach(x=>{const local=(typeof contents!=='undefined'?contents:[]).find(v=>v.content_key===x.key);if(local)local.image_brightness=x.value})
 }
 function init(){
  const media=document.getElementById('media');if(!media||document.getElementById('bulkBrightnessCard'))return;
  const list=document.getElementById('mediaList'),card=list?.closest('.card');if(!card)return;
  const box=document.createElement('div');box.id='bulkBrightnessCard';box.style.cssText='margin:14px 0 4px;padding:12px 13px;border:1px solid #e5e7eb;border-radius:13px;background:#fafbfc';
  box.innerHTML='<div style="font-size:11px;font-weight:900;margin-bottom:3px">掲載写真の明るさをそろえる</div><div style="font-size:9px;color:#6b7280;line-height:1.6;margin-bottom:10px">まず各写真を解析して見た目の明るさを自動でそろえ、その後に全体を±5%ずつ微調整できます。画角・ズーム・PC／スマホ設定は変更しません。</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:9px"><button id="bulkBAuto" class="btn blue" type="button">明るさを自動でそろえる</button><span id="bulkBAutoState" style="font-size:9px;font-weight:800"></span></div><div style="padding-top:9px;border-top:1px solid #e5e7eb"><div style="font-size:9px;font-weight:900;color:#4b5563;margin-bottom:6px">全体を手動で微調整</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><button id="bulkBm" class="btn ghost" type="button">−</button><strong id="bulkBValue" style="min-width:48px;text-align:center;font-size:11px">±0%</strong><button id="bulkBp" class="btn ghost" type="button">＋</button><button id="bulkBSave" class="btn ghost" type="button">この微調整を保存</button><span id="bulkBState" style="font-size:9px;font-weight:800"></span></div></div>';
  card.insertBefore(box,list);
  let delta=0;const deltaOut=document.getElementById('bulkBValue'),state=document.getElementById('bulkBState'),autoState=document.getElementById('bulkBAutoState'),save=document.getElementById('bulkBSave'),auto=document.getElementById('bulkBAuto');
  const targets=()=> (typeof contents!=='undefined'?contents:[]).filter(x=>x.content_value&&String(x.content_key||'').endsWith('_image'));
  const draw=()=>deltaOut.textContent=(delta>0?'+':'')+delta+'%';
  document.getElementById('bulkBm').onclick=()=>{delta=clamp(delta-5,-50,50);draw()};
  document.getElementById('bulkBp').onclick=()=>{delta=clamp(delta+5,-50,50);draw()};
  auto.onclick=async()=>{
   const rows=targets();if(!rows.length){autoState.textContent='掲載中の写真がありません';return}
   if(!confirm(`掲載中の写真 ${rows.length}枚を解析して、明るさを自動でそろえますか？`))return;
   auto.disabled=true;auto.textContent='解析中…';autoState.textContent='';state.textContent='';
   try{
    const measured=[];for(let i=0;i<rows.length;i++){auto.textContent=`解析中… ${i+1}/${rows.length}`;try{measured.push({row:rows[i],lum:await imageLuminance(rows[i].content_value)})}catch(_){}}
    if(measured.length<2)throw new Error('解析できる写真が足りませんでした');
    const sorted=measured.map(x=>x.lum).sort((a,b)=>a-b),targetLum=sorted[Math.floor(sorted.length/2)];
    const updates=measured.map(x=>({key:x.row.content_key,value:clamp(round5(100*targetLum/x.lum),70,140)}));
    await saveValues(updates);delta=0;draw();autoState.textContent=`${updates.length}枚を自動調整しました ✓`;
   }catch(e){autoState.textContent=e.message||'自動調整できませんでした'}finally{auto.disabled=false;auto.textContent='明るさを自動でそろえる'}
  };
  save.onclick=async()=>{
   const rows=targets();if(!rows.length){state.textContent='掲載中の写真がありません';return}if(delta===0){state.textContent='微調整は0%です';return}
   const updates=rows.map(x=>({key:x.content_key,value:clamp(Number(x.image_brightness??100)+delta)}));
   if(!confirm(`掲載中の写真 ${updates.length}枚を、現在の明るさから一律${delta>0?'+':''}${delta}%調整しますか？`))return;
   save.disabled=true;save.textContent='保存中…';state.textContent='';try{await saveValues(updates);state.textContent=`${updates.length}枚を${delta>0?'+':''}${delta}%調整しました ✓`;delta=0;draw()}catch(e){state.textContent='保存できませんでした'}finally{save.disabled=false;save.textContent='この微調整を保存'}
  };
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();