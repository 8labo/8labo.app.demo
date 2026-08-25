(function(){
  const path=location.pathname.split('/').pop()||'';
  if(!['website-admin.html','website-admin-v2.html'].includes(path)) return;

  const style=document.createElement('style');
  style.textContent=`
    .hero{background:#111827!important}
    .voice-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .voice-item{padding:14px 0;border-top:1px solid #eef1f4}
    .voice-item:first-child{border-top:0}
    .voice-item h3{font-size:13px;margin:6px 0 4px}
    .voice-item p{font-size:11px;line-height:1.75;color:#4b5563;margin:0 0 8px}
    .voice-meta{font-size:9px;color:#6b7280}
    .voice-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:#eef2f7;font-size:8px;font-weight:800;margin-right:5px}
    .voice-badge.live{background:#dcfce7;color:#166534}
    @media(max-width:800px){.voice-admin-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const init=async()=>{
    const app=document.getElementById('app');
    const tabs=document.querySelector('.tabs');
    if(!app||!tabs||document.getElementById('voice')) return;

    const tab=document.createElement('button');
    tab.className='tab';
    tab.dataset.tab='voice';
    tab.textContent='VOICE';
    tabs.appendChild(tab);

    const panel=document.createElement('section');
    panel.id='voice';
    panel.className='panel';
    panel.innerHTML=`
      <div class="voice-admin-grid">
        <div class="card">
          <h2 id="voiceFormTitle">VOICEを追加</h2>
          <input id="voiceId" type="hidden">
          <div class="field"><label>表示名・属性</label><input id="voiceAudience" placeholder="例：小学3年生 保護者"></div>
          <div class="field"><label>教室名（任意）</label><input id="voiceClass" placeholder="例：清水教室"></div>
          <div class="field"><label>コメント</label><textarea id="voiceQuote" placeholder="実際にいただいた声を入力してください"></textarea></div>
          <div class="row">
            <div class="field"><label>掲載順</label><input id="voiceOrder" type="number" value="0"></div>
            <div class="field"><label>公開状態</label><select id="voicePublished"><option value="false">下書き</option><option value="true">公開</option></select></div>
          </div>
          <div class="actions"><button id="saveVoice" class="btn blue">保存</button><button id="clearVoice" class="btn ghost">新規入力に戻す</button></div>
        </div>
        <div class="card"><h2>登録済みのVOICE</h2><p class="sub">公開中のものだけACADEMYページに表示されます。</p><div id="voiceList"></div></div>
      </div>`;
    app.appendChild(panel);

    const allTabs=[...document.querySelectorAll('.tab')];
    allTabs.forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));
      document.querySelectorAll('.panel').forEach(x=>x.classList.toggle('active',x.id===b.dataset.tab));
    }));

    const cfg=window.EIGHTLABO_CONFIG;
    const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    let voices=[];
    const $=id=>document.getElementById(id);
    const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

    const render=()=>{
      $('voiceList').innerHTML=voices.map(v=>`<div class="voice-item"><span class="voice-badge ${v.is_published?'live':''}">${v.is_published?'公開中':'下書き'}</span>${v.class_name?`<span class="voice-badge">${esc(v.class_name)}</span>`:''}<h3>${esc(v.audience||'VOICE')}</h3><p>${esc(v.quote)}</p><div class="voice-meta">掲載順：${Number(v.sort_order)||0}</div><div class="actions" style="margin-top:8px"><button class="btn ghost" data-edit="${v.id}">編集</button><button class="btn danger" data-delete="${v.id}">削除</button></div></div>`).join('')||'<div class="empty">VOICEはまだありません。</div>';
      $('voiceList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editVoice(Number(b.dataset.edit)));
      $('voiceList').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteVoice(Number(b.dataset.delete)));
    };

    const load=async()=>{
      const {data,error}=await client.from('website_voices').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
      if(error){$('voiceList').innerHTML=`<div class="empty">${esc(error.message)}</div>`;return;}
      voices=data||[];render();
    };

    const clear=()=>{
      $('voiceId').value='';$('voiceAudience').value='';$('voiceClass').value='';$('voiceQuote').value='';$('voiceOrder').value='0';$('voicePublished').value='false';$('voiceFormTitle').textContent='VOICEを追加';$('saveVoice').textContent='保存';
    };

    const editVoice=id=>{
      const v=voices.find(x=>Number(x.id)===id);if(!v)return;
      $('voiceId').value=v.id;$('voiceAudience').value=v.audience||'';$('voiceClass').value=v.class_name||'';$('voiceQuote').value=v.quote||'';$('voiceOrder').value=v.sort_order??0;$('voicePublished').value=String(!!v.is_published);$('voiceFormTitle').textContent='VOICEを編集中';$('saveVoice').textContent='変更を保存';
      panel.scrollIntoView({behavior:'smooth',block:'start'});
    };

    const deleteVoice=async id=>{
      if(!confirm('このVOICEを削除しますか？'))return;
      const {error}=await client.from('website_voices').delete().eq('id',id);
      if(error)return alert(error.message);
      clear();await load();
    };

    $('saveVoice').onclick=async()=>{
      const quote=$('voiceQuote').value.trim();if(!quote)return alert('コメントを入力してください。');
      const payload={audience:$('voiceAudience').value.trim(),class_name:$('voiceClass').value.trim(),quote,sort_order:Number($('voiceOrder').value)||0,is_published:$('voicePublished').value==='true',updated_at:new Date().toISOString()};
      const id=$('voiceId').value;
      const r=id?await client.from('website_voices').update(payload).eq('id',id):await client.from('website_voices').insert(payload);
      if(r.error)return alert(r.error.message);
      clear();await load();alert('VOICEを保存しました。');
    };
    $('clearVoice').onclick=clear;
    await load();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
