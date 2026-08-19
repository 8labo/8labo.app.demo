(function(){
  const LABELS={available:'勤務可能',conditional:'調整可',undecided:'未定',unavailable:'勤務不可',preferred:'勤務可能'};
  const OPTIONS=[['available','勤務可能'],['conditional','調整可'],['undecided','未定'],['unavailable','勤務不可']];
  const drafts=new Map();
  const normalized=v=>v==='preferred'?'available':v;
  const monthKey=s=>String(s.shift_date||'').slice(0,7);
  const deadlineOf=s=>{const m=String(s.notes||'').match(/回答期限:([^\n]*)/);if(!m||!m[1])return null;const d=new Date(m[1]);return isNaN(d)?null:d};
  const fmtDeadline=d=>d?d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'設定なし';
  const isExpired=s=>{const d=deadlineOf(s);return !!d&&Date.now()>d.getTime()};
  const responseFor=(slotId,staffId)=>responses.find(r=>r.shift_slot_id===slotId&&r.staff_user_id===staffId);
  const currentChoice=s=>drafts.has(s.id)?drafts.get(s.id):normalized(responseFor(s.id,me)?.response_status||'');
  const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));

  function ensureStyles(){
    if(document.getElementById('shiftResponseV2Style'))return;
    const st=document.createElement('style');st.id='shiftResponseV2Style';st.textContent=`
      .surveyGroup{border:1px solid #e5e7eb;border-radius:15px;padding:13px 14px;margin:12px 0;background:#fbfcfd}.surveyHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:5px}.surveyHead b{font-size:13px}.surveyState{font-size:9px;font-weight:900;border-radius:999px;padding:5px 8px;background:#eef2f7;white-space:nowrap}.surveyState.done{background:#eaf7ef;color:#287653}.surveyState.expired{background:#f3f4f6;color:#6b7280}.answerHelp{margin:10px 0;padding:10px 11px;border-radius:11px;background:#f6f8fa;color:#596579;font-size:10px;line-height:1.7}.answerHelp b{color:#111827}.submitRow{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #e8edf2;padding-top:12px;margin-top:8px}.submitRow .meta{flex:1}.submitAnswer{border:0;border-radius:10px;padding:10px 14px;background:#111827;color:#fff;font-weight:900;cursor:pointer}.submitAnswer:disabled{opacity:.35;cursor:not-allowed}.response button[data-r="conditional"]{border-style:dashed}.response button:disabled{opacity:.48;cursor:not-allowed}`;document.head.appendChild(st);
  }

  function submissionState(list){
    const submitted=list.map(s=>responseFor(s.id,me)).filter(r=>r?.submitted_at);
    if(!submitted.length)return {label:'未提出',cls:''};
    if(submitted.length===list.length)return {label:'回答済み',cls:'done'};
    return {label:'一部回答済み',cls:''};
  }

  window.renderAnswer=function(open){
    ensureStyles();
    const root=$('answerList');
    if(!root)return;
    if(!open.length){root.innerHTML='<div class="empty">回答が必要なシフトはありません。</div>';return;}
    const groups={};open.forEach(s=>(groups[monthKey(s)] ||= []).push(s));
    root.innerHTML='<div class="answerHelp"><b>回答方法</b><br>各日程を選択したあと、月ごとの「回答を送信」を押してください。送信前の選択内容は管理者には共有されません。回答期限までは何度でも再回答できます。<br><b>調整可</b>＝できれば避けたいが、必要であれば勤務可能</div>'+Object.entries(groups).sort().map(([ym,list])=>{
      const state=submissionState(list),deadline=list.map(deadlineOf).filter(Boolean).sort((a,b)=>a-b)[0]||null,expired=list.every(isExpired);
      const rows=list.map(s=>{const choice=currentChoice(s),locked=isExpired(s);return `<div class="shift"><div class="head"><div><h3>${esc(s.title)}</h3><div class="meta">${s.shift_date}｜${tm(s.start_time)}〜${tm(s.end_time)}｜必要${s.required_count}名</div></div><span class="badge">${locked?'回答締切':'回答受付中'}</span></div><div class="response">${OPTIONS.map(([v,l])=>`<button type="button" data-draft-r="${v}" data-draft-s="${s.id}" class="${choice===v?'sel':''}" ${locked?'disabled':''}>${l}</button>`).join('')}</div></div>`}).join('');
      return `<div class="surveyGroup"><div class="surveyHead"><div><b>${ym.replace('-','年')}月 シフト調査</b><div class="meta">回答期限：${fmtDeadline(deadline)}</div></div><span class="surveyState ${expired?'expired':state.cls}">${expired?'受付終了':state.label}</span></div>${rows}<div class="submitRow"><div class="meta">全${list.length}日程に回答してから送信してください。送信後も期限内は変更できます。</div><button class="submitAnswer" data-submit-month="${ym}" ${expired?'disabled':''}>${state.label==='回答済み'?'回答を更新':'回答を送信'}</button></div></div>`;
    }).join('');
    document.querySelectorAll('[data-draft-r]').forEach(b=>b.onclick=()=>{drafts.set(b.dataset.draftS,b.dataset.draftR);renderAnswer(open)});
    document.querySelectorAll('[data-submit-month]').forEach(b=>b.onclick=()=>submitMonth(b.dataset.submitMonth));
  };

  window.saveResponse=function(s,v){drafts.set(s,v);render()};

  async function submitMonth(ym){
    const list=slots.filter(s=>s.status==='open'&&monthKey(s)===ym);
    if(!list.length)return;
    if(list.some(isExpired))return alert('回答期限を過ぎているため送信できません。');
    const missing=list.filter(s=>!currentChoice(s));
    if(missing.length)return alert(`未回答の日程が${missing.length}件あります。全日程を回答してから送信してください。`);
    if(!confirm('この内容でシフト希望を送信しますか？\n回答期限までは再回答できます。'))return;
    const now=new Date().toISOString();
    for(const s of list){
      const value=currentChoice(s),old=responseFor(s.id,me);
      const q=old?sb.from('staff_shift_responses').update({response_status:value,submitted_at:now,updated_at:now}).eq('id',old.id):sb.from('staff_shift_responses').insert({shift_slot_id:s.id,staff_user_id:me,response_status:value,submitted_at:now});
      const {error}=await q;if(error){alert('回答の送信に失敗しました：'+error.message);return;}
      drafts.delete(s.id);
    }
    await load();
    alert('シフト希望を送信しました。');
  }

  window.renderStaff=function(){
    const id=$('slotSelect').value,rs=responses.filter(r=>r.shift_slot_id===id&&r.submitted_at);
    $('staffList').innerHTML=staff.map(st=>{const r=rs.find(x=>x.staff_user_id===st.id),label=r?LABELS[r.response_status]||r.response_status:'未回答';return `<div class="row"><label><input type="checkbox" data-as="${st.id}"> ${esc(p(st.id))}<div class="meta">${r?'回答済み｜':''}${esc(label)}</div></label><select class="role" data-role="${st.id}"><option>メイン担当</option><option selected>サポート担当</option><option>受付</option><option>測定担当</option><option>撮影・広報</option></select><span></span></div>`}).join('');
  };

  const originalRender=window.render;
  window.render=function(){
    const open=slots.filter(s=>s.status==='open'),mine=assignments.filter(a=>a.staff_user_id===me&&a.assignment_status!=='cancelled'&&slots.find(s=>s.id===a.shift_slot_id)?.status==='confirmed');
    const mySubmitted=responses.filter(r=>r.staff_user_id===me&&r.submitted_at);
    $('nAnswer').textContent=open.filter(s=>!mySubmitted.find(r=>r.shift_slot_id===s.id)).length;
    $('nOpen').textContent=open.length;$('nMine').textContent=mine.length;$('nChange').textContent=assignments.filter(a=>{let x=ex(a);return x&&['pending_target','target_approved'].includes(x.status)&&(a.staff_user_id===me||x.target===me)}).length;
    renderAnswer(open);renderConfirmed();renderChange(mine);if(isManager){renderDraft();renderAssign();renderManager()}
  };

  setTimeout(()=>{ensureStyles();try{render()}catch(e){console.warn('shift response v2 init',e)}},50);
})();