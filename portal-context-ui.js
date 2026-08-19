(function(){
  const path=location.pathname.split('/').pop()||'index.html';
  if(!['','index.html'].includes(path)) return;
  if(!window.supabase||!window.EIGHTLABO_CONFIG) return;
  const cfg=window.EIGHTLABO_CONFIG;
  const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function init(){
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(!session) return;
      const {data:ua}=await sb.from('user_accounts').select('person_id').eq('auth_user_id',session.user.id).maybeSingle();
      if(!ua?.person_id) return;
      const subjectIds=[ua.person_id];
      const {data:rels}=await sb.from('person_relationships').select('to_person_id').eq('from_person_id',ua.person_id).eq('relationship_type','guardian').eq('status','active').eq('can_view',true);
      for(const r of rels||[]) if(r.to_person_id&&!subjectIds.includes(r.to_person_id)) subjectIds.push(r.to_person_id);
      const {data:svc}=await sb.from('services').select('id,service_code').eq('service_code','ACADEMY').maybeSingle();
      const academyId=svc?.id||null;
      const {data:members}=await sb.from('service_memberships').select('person_id,membership_status,service_id').in('person_id',subjectIds);
      const academyPeople=new Set((members||[]).filter(m=>m.service_id===academyId&&['active','trial','paused'].includes(m.membership_status)).map(m=>m.person_id));
      const {data:results}=await sb.from('assessment_results').select('person_id').in('person_id',subjectIds).limit(500);
      const hasPortalMeasurement=(results||[]).some(r=>!academyPeople.has(r.person_id));
      if(!hasPortalMeasurement) return;
      const grid=document.querySelector('.section-title + .grid');
      if(!grid||document.getElementById('portalMeasurementCard')) return;
      const card=document.createElement('a');
      card.id='portalMeasurementCard';
      card.className='card service';
      card.href='measurement-card.html';
      card.innerHTML=`<div><div class="tag">測定結果</div><h3>測定カルテ</h3><p>イベントなどで測定した結果と、これまでの変化を確認できます。</p></div><div class="arrow">→</div>`;
      grid.appendChild(card);
    }catch(e){console.warn('portal contextual UI:',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250));else setTimeout(init,250);
})();