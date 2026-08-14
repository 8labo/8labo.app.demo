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
  let draft={desktop:{x:50,y:50,z:1.08},mobile:{x:50,y:50,z:1.08}};
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
      .drag-frame{width:min(100%,650px);aspect-ratio:var(--slot-ratio,1.333);overflow:hidden;background:#dfe6ec;border-radius:10px;cursor:grab;touch-action:none;position:relative;box-shadow:0 1px 0 rgba(15,23,42,.04)}
      .drag-frame.dragging{cursor:grabbing}.drag-frame:after{content:'写真をドラッグして上下左右に調整';position:absolute;left:10px;bottom:9px;background:rgba(17,24,39,.64);color:#fff;padding:5px 8px;border-radius:7px;font-size:9px;pointer-events:none;z-index:2}
      .drag-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 50%;user-select:none;pointer-events:none;will-change:transform;transform-origin:center center}
      .nudge-grid{display:grid;grid-template-columns:38px 38px 38px;grid-template-rows:34px 34px 34px;justify-content:center;gap:5px;margin:12px auto 8px}
      .nudge{border:1px solid #d1d5db;background:#fff;border-radius:9px;font-size:16px;cursor:pointer;display:grid;place-items:center;padding:0}.nudge.up{grid-column:2;grid-row:1}.nudge.left{grid-column:1;grid-row:2}.nudge.center{grid-column:2;grid-row:2;font-size:10px;color:#6b7280}.nudge.right{grid-column:3;grid-row:2}.nudge.down{grid-column:2;grid-row:3}
      .zoom-tools{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px 0}.zoom-btn{width:36px;height:36px;border:1px solid #d1d5db;background:#fff;border-radius:50%;font-size:20px;line-height:1;cursor:pointer}.zoom-readout{min-width:70px;text-align:center;font-size:11px;font-weight:800}.zoom-hint{font-size:9px;color:#6b7280;text-align:center;margin:-2px 0 12px;line-height:1.6}
      .position-readout{text-align:center;font-size:9px;color:#6b7280;margin:2px 0 10px}
      .drag-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.drag-actions button{border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;font-weight:900;font-size:10px;cursor:pointer}.drag-actions .primary{background:#075ea8}.drag-actions .ghost{background:#fff;color:#111827;border:1px solid #e5e7eb}.drag-actions button:disabled{opacity:.55;cursor:default}
      .save-state{font-size:10px;color:#166534;font-weight:800;min-height:1.4em}
      @media(max-width:800px){.drag-frame{width:100%;max-width:100%}.drag-frame-wrap{padding:8px}.drag-help{font-size:11px}.nudge-grid{margin-top:10px}}
    `;
    document.head.appendChild(s);
  }

  function makeEditor(){
    const mediaPanel=document.getElementById('media');
    const leftCard=mediaPanel?.querySelector('.grid>.card:first-child');
    if(!leftCard)return null;
    const el=document.createElement('div');
    el.id='dragCropEditor';el.className='drag-editor hidden';
    el.innerHTML=`<div class="drag-head"><div><h2>画角を調整</h2><p class="drag-help">PC・スマホそれぞれ、上下左右の位置と拡大率を設定できます。管理画面をPC・スマホのどちらから操作しても、保存される画角は同じです。</p></div></div><div class="drag-device-tabs"><button type="button" class="drag-device active" data-drag-device="desktop">PC</button><button type="button" class="drag-device" data-drag-device="mobile">スマホ</button></div><p id="slotRatioNote" class="slot-note"></p><div class="drag-frame-wrap"><div id="dragFrame" class="drag-frame"><img id="dragImage" class="drag-image" alt="画角プレビュー"></div></div><div class="nudge-grid"><button type="button" class="nudge up" data-nudge="up" aria-label="上へ">↑</button><button type="button" class="nudge left" data-nudge="left" aria-label="左へ">←</button><button type="button" class="nudge center" data-nudge="center">中央</button><button type="button" class="nudge right" data-nudge="right" aria-label="右へ">→</button><button type="button" class="nudge down" data-nudge="down" aria-label="下へ">↓</button></div><div id="positionReadout" class="position-readout">横 50% ／ 縦 50%</div><div class="zoom-tools"><button type="button" id="zoomOut" class="zoom-btn" aria-label="縮小">−</button><span id="zoomReadout" class="zoom-readout">1.08×</span><button type="button" id="zoomIn" class="zoom-btn" aria-label="拡大">＋</button></div><p class="zoom-hint">ドラッグ操作に加えて矢印でも微調整できます。拡大率を少し上げると、上下左右すべての方向へ動かせる余白が増えます。</p><div class="drag-actions"><button type="button" id="dragSave" class="primary">この画角で保存</button><button type="button" id="dragReset" class="ghost">中央に戻す</button><span id="saveState" class="save-state"></span></div>`;
    leftCard.appendChild(el);
    bind(el);
    return el;
  }

  function bind(el){
    el.querySelectorAll('[data-drag-device]').forEach(b=>b.addEventListener('click',()=>{device=b.dataset.dragDevice;el.querySelectorAll('[data-drag-device]').forEach(x=>x.classList.toggle('active',x===b));clearSaved();render()}));
    const frame=el.querySelector('#dragFrame');
    frame.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;frame.classList.add('dragging');frame.setPointerCapture?.(e.pointerId)});
    frame.addEventListener('pointermove',e=>{if(!dragging)return;const r=frame.getBoundingClientRect(),dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;const d=draft[device];d.x=clamp(d.x-(dx/r.width)*100/Math.max(1,d.z),0,100);d.y=clamp(d.y-(dy/r.height)*100/Math.max(1,d.z),0,100);clearSaved();renderFrame()});
    const stop=e=>{dragging=false;frame.classList.remove('dragging');try{frame.releasePointerCapture?.(e.pointerId)}catch(_){}};frame.addEventListener('pointerup',stop);frame.addEventListener('pointercancel',stop);
    frame.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?0.05:-0.05)},{passive:false});
    el.querySelector('#zoomIn').onclick=()=>changeZoom(0.05);el.querySelector('#zoomOut').onclick=()=>changeZoom(-0.05);
    el.querySelectorAll('[data-nudge]').forEach(b=>b.addEventListener('click',()=>nudge(b.dataset.nudge)));
    el.querySelector('#dragReset').onclick=()=>{draft[device]={x:50,y:50,z:1.08};clearSaved();renderFrame()};
    el.querySelector('#dragSave').onclick=save;
  }

  function clearSaved(){const s=document.getElementById('saveState');if(s)s.textContent=''}
  function nudge(dir){const d=draft[device],step=3;if(dir==='left')d.x=clamp(d.x-step,0,100);if(dir==='right')d.x=clamp(d.x+step,0,100);if(dir==='up')d.y=clamp(d.y-step,0,100);if(dir==='down')d.y=clamp(d.y+step,0,100);if(dir==='center'){d.x=50;d.y=50}clearSaved();renderFrame()}
  function changeZoom(delta){const d=draft[device];d.z=clamp(Math.round((d.z+delta)*100)/100,1,3);clearSaved();renderFrame()}
  function ratio(){return SLOT_RATIOS[key]?.[device]||4/3}
  function ratioText(r){if(Math.abs(r-4/3)<.02)return'4:3';if(Math.abs(r-16/10)<.02)return'16:10';return `${r.toFixed(2)}:1`}
  function render(){const el=document.getElementById('dragCropEditor');if(!el||!row)return;const r=ratio();el.querySelector('#dragFrame').style.setProperty('--slot-ratio',r);el.querySelector('#slotRatioNote').textContent=`${device==='desktop'?'PC':'スマホ'}表示｜掲載時の基準比率 ${ratioText(r)}`;renderFrame()}
  function renderFrame(){const el=document.getElementById('dragCropEditor'),img=el?.querySelector('#dragImage');if(!img||!row)return;const d=draft[device];img.src=String(row.content_value);img.style.objectPosition=`${d.x}% ${d.y}%`;img.style.transform=`scale(${d.z})`;el.querySelector('#zoomReadout').textContent=d.z.toFixed(2)+'×';el.querySelector('#positionReadout').textContent=`横 ${Math.round(d.x)}% ／ 縦 ${Math.round(d.y)}%`}

  async function save(){if(!key||!row)return;const btn=document.getElementById('dragSave'),state=document.getElementById('saveState');btn.disabled=true;btn.textContent='保存中…';state.textContent='';const payload={desktop_position_x:Math.round(draft.desktop.x),desktop_position_y:Math.round(draft.desktop.y),desktop_zoom:Number(draft.desktop.z.toFixed(2)),mobile_position_x:Math.round(draft.mobile.x),mobile_position_y:Math.round(draft.mobile.y),mobile_zoom:Number(draft.mobile.z.toFixed(2)),updated_at:new Date().toISOString()};const {error}=await sb.from('website_content').update(payload).eq('content_key',key);btn.disabled=false;btn.textContent='この画角で保存';if(error){state.textContent='保存できませんでした';msg('画角設定の保存に失敗：'+error.message,false);return}const now=new Date();state.textContent=`保存しました ✓ ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;msg('PC・スマホの画角を保存しました。');row={...row,...payload};if(typeof loadAll==='function')await loadAll();}

  function open(k){const x=contents.find(v=>v.content_key===k);if(!x?.content_value)return;key=k;row=x;device='desktop';draft={desktop:{x:Number(x.desktop_position_x??50),y:Number(x.desktop_position_y??50),z:Number(x.desktop_zoom??1.08)},mobile:{x:Number(x.mobile_position_x??50),y:Number(x.mobile_position_y??50),z:Number(x.mobile_zoom??1.08)}};const el=document.getElementById('dragCropEditor')||makeEditor();if(!el)return;el.classList.remove('hidden');el.querySelectorAll('[data-drag-device]').forEach(b=>b.classList.toggle('active',b.dataset.dragDevice==='desktop'));clearSaved();render();el.scrollIntoView({behavior:'smooth',block:'nearest'})}

  function init(){if(!document.getElementById('media'))return;css();makeEditor();let tries=0;const timer=setInterval(()=>{tries++;if(typeof window.openCrop==='function'&&typeof contents!=='undefined'){window.openCrop=open;clearInterval(timer)}else if(tries>60)clearInterval(timer)},100)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();