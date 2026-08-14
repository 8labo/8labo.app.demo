(function(){
  const SLOT_RATIOS={
    home_hero_image:{desktop:1.15,mobile:1.39},
    home_featured_image:{desktop:4/3,mobile:16/10},
    home_activity_kids_image:{desktop:1.28,mobile:1.84},
    home_activity_school_image:{desktop:1.40,mobile:1.13},
    home_activity_sports_image:{desktop:1.40,mobile:1.13},
    home_activity_community_image:{desktop:1.40,mobile:1.13},
    academy_hero_image:{desktop:4/3,mobile:4/3}
  };
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  let key=null,device='desktop',row=null;
  let draft={desktop:{x:50,y:50,z:1},mobile:{x:50,y:50,z:1}};
  let dragging=false,lastX=0,lastY=0;

  function css(){
    const s=document.createElement('style');
    s.textContent=`
      #cropEditor{display:none!important}
      .drag-editor{margin-top:18px;padding-top:18px;border-top:1px solid #e5e7eb}
      .drag-editor.hidden{display:none!important}
      .drag-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .drag-head h2{margin:0 0 4px;font-size:17px}.drag-help{margin:0;color:#6b7280;font-size:10px;line-height:1.7}
      .drag-device-tabs{display:flex;gap:7px;margin:14px 0 10px}.drag-device{border:1px solid #e5e7eb;background:#fff;padding:7px 12px;border-radius:999px;font-size:10px;font-weight:800;cursor:pointer}.drag-device.active{background:#075ea8;color:#fff;border-color:#075ea8}
      .slot-note{font-size:9px;color:#6b7280;margin:0 0 8px}
      .drag-frame-wrap{display:flex;justify-content:center;background:#f8fafc;border:1px solid #eef1f4;border-radius:15px;padding:12px}
      .drag-frame{width:min(100%,650px);aspect-ratio:var(--slot-ratio,1.333);overflow:hidden;background:#dfe6ec center/cover no-repeat;border-radius:10px;cursor:grab;touch-action:none;position:relative;box-shadow:0 1px 0 rgba(15,23,42,.04)}
      .drag-frame.dragging{cursor:grabbing}.drag-frame:after{content:'ドラッグして位置を調整';position:absolute;left:10px;bottom:9px;background:rgba(17,24,39,.64);color:#fff;padding:5px 8px;border-radius:7px;font-size:9px;pointer-events:none}
      .zoom-tools{display:flex;align-items:center;justify-content:center;gap:10px;margin:12px 0}.zoom-btn{width:36px;height:36px;border:1px solid #d1d5db;background:#fff;border-radius:50%;font-size:20px;line-height:1;cursor:pointer}.zoom-readout{min-width:70px;text-align:center;font-size:11px;font-weight:800}.zoom-hint{font-size:9px;color:#6b7280;text-align:center;margin:-4px 0 12px}
      .drag-actions{display:flex;gap:7px;flex-wrap:wrap}.drag-actions button{border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;font-weight:900;font-size:10px;cursor:pointer}.drag-actions .primary{background:#075ea8}.drag-actions .ghost{background:#fff;color:#111827;border:1px solid #e5e7eb}
      @media(max-width:800px){.drag-frame{width:100%;max-width:100%}.drag-frame-wrap{padding:8px}}
    `;
    document.head.appendChild(s);
  }

  function makeEditor(){
    const mediaPanel=document.getElementById('media');
    const leftCard=mediaPanel?.querySelector('.grid>.card:first-child');
    if(!leftCard)return null;
    const el=document.createElement('div');
    el.id='dragCropEditor';el.className='drag-editor hidden';
    el.innerHTML=`<div class="drag-head"><div><h2>画角を調整</h2><p class="drag-help">実際の掲載場所に近い縦横比で確認できます。写真を直接つかんで動かしてください。</p></div></div><div class="drag-device-tabs"><button type="button" class="drag-device active" data-drag-device="desktop">PC</button><button type="button" class="drag-device" data-drag-device="mobile">スマホ</button></div><p id="slotRatioNote" class="slot-note"></p><div class="drag-frame-wrap"><div id="dragFrame" class="drag-frame"></div></div><div class="zoom-tools"><button type="button" id="zoomOut" class="zoom-btn" aria-label="縮小">−</button><span id="zoomReadout" class="zoom-readout">1.00×</span><button type="button" id="zoomIn" class="zoom-btn" aria-label="拡大">＋</button></div><p class="zoom-hint">PCではマウスホイールでも拡大・縮小できます。</p><div class="drag-actions"><button type="button" id="dragSave" class="primary">この画角で保存</button><button type="button" id="dragReset" class="ghost">中央に戻す</button></div>`;
    leftCard.appendChild(el);
    bind(el);
    return el;
  }

  function bind(el){
    el.querySelectorAll('[data-drag-device]').forEach(b=>b.addEventListener('click',()=>{device=b.dataset.dragDevice;el.querySelectorAll('[data-drag-device]').forEach(x=>x.classList.toggle('active',x===b));render()}));
    const frame=el.querySelector('#dragFrame');
    frame.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;frame.classList.add('dragging');frame.setPointerCapture?.(e.pointerId)});
    frame.addEventListener('pointermove',e=>{if(!dragging)return;const r=frame.getBoundingClientRect(),dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;const d=draft[device];d.x=clamp(d.x-(dx/r.width)*100/Math.max(1,d.z),0,100);d.y=clamp(d.y-(dy/r.height)*100/Math.max(1,d.z),0,100);renderFrame()});
    const stop=e=>{dragging=false;frame.classList.remove('dragging');try{frame.releasePointerCapture?.(e.pointerId)}catch(_){}};frame.addEventListener('pointerup',stop);frame.addEventListener('pointercancel',stop);
    frame.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?.1:-.1)},{passive:false});
    el.querySelector('#zoomIn').onclick=()=>changeZoom(.1);el.querySelector('#zoomOut').onclick=()=>changeZoom(-.1);
    el.querySelector('#dragReset').onclick=()=>{draft[device]={x:50,y:50,z:1};renderFrame()};
    el.querySelector('#dragSave').onclick=save;
  }

  function changeZoom(delta){const d=draft[device];d.z=clamp(Math.round((d.z+delta)*10)/10,1,3);renderFrame()}
  function ratio(){return SLOT_RATIOS[key]?.[device]||4/3}
  function ratioText(r){if(Math.abs(r-4/3)<.02)return'4:3';if(Math.abs(r-16/10)<.02)return'16:10';return `${r.toFixed(2)}:1`}
  function render(){const el=document.getElementById('dragCropEditor');if(!el||!row)return;const r=ratio();el.querySelector('#dragFrame').style.setProperty('--slot-ratio',r);el.querySelector('#slotRatioNote').textContent=`${device==='desktop'?'PC':'スマホ'}表示｜この掲載場所に近い比率 ${ratioText(r)}`;renderFrame()}
  function renderFrame(){const el=document.getElementById('dragCropEditor'),frame=el?.querySelector('#dragFrame');if(!frame||!row)return;const d=draft[device];frame.style.backgroundImage=`url("${String(row.content_value).replace(/"/g,'%22')}")`;frame.style.backgroundPosition=`${d.x}% ${d.y}%`;frame.style.backgroundSize=`calc(100% * ${d.z}) auto`;frame.style.backgroundRepeat='no-repeat';el.querySelector('#zoomReadout').textContent=d.z.toFixed(2)+'×'}

  async function save(){if(!key||!row)return;const payload={desktop_position_x:Math.round(draft.desktop.x),desktop_position_y:Math.round(draft.desktop.y),desktop_zoom:draft.desktop.z,mobile_position_x:Math.round(draft.mobile.x),mobile_position_y:Math.round(draft.mobile.y),mobile_zoom:draft.mobile.z,updated_at:new Date().toISOString()};const {error}=await sb.from('website_content').update(payload).eq('content_key',key);if(error){msg('画角設定の保存に失敗：'+error.message,false);return}msg('PC・スマホの画角を保存しました。');row={...row,...payload};if(typeof loadAll==='function')await loadAll();}

  function open(k){const x=contents.find(v=>v.content_key===k);if(!x?.content_value)return;key=k;row=x;device='desktop';draft={desktop:{x:Number(x.desktop_position_x??50),y:Number(x.desktop_position_y??50),z:Number(x.desktop_zoom??1)},mobile:{x:Number(x.mobile_position_x??50),y:Number(x.mobile_position_y??50),z:Number(x.mobile_zoom??1)}};const el=document.getElementById('dragCropEditor')||makeEditor();if(!el)return;el.classList.remove('hidden');el.querySelectorAll('[data-drag-device]').forEach(b=>b.classList.toggle('active',b.dataset.dragDevice==='desktop'));render();el.scrollIntoView({behavior:'smooth',block:'nearest'})}

  function init(){if(!document.getElementById('media'))return;css();makeEditor();let tries=0;const timer=setInterval(()=>{tries++;if(typeof window.openCrop==='function'&&typeof contents!=='undefined'){window.openCrop=open;clearInterval(timer)}else if(tries>60)clearInterval(timer)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();