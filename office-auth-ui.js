(function(){
  const $=id=>document.getElementById(id);
  async function init(){
    if((location.pathname.split('/').pop()||'')!=='office-accounts.html'||!window.supabase||!window.EIGHTLABO_CONFIG)return;
    const cfg=window.EIGHTLABO_CONFIG;
    const sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    const editor=$('editor'); if(!editor)return;

    const box=document.createElement('div');
    box.id='officeAuthInviteBox';
    box.style.cssText='margin:14px 0;padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;';
    box.innerHTML='<div style="font-size:10px;font-weight:900;margin-bottom:7px">ログイン認証</div><div id="officeAuthCurrent" style="font-size:10px;color:#64748b;margin-bottom:9px">事務局アカウントを選択してください。</div><div style="display:grid;grid-template-columns:minmax(220px,1fr) minmax(180px,.7fr) auto;gap:8px;align-items:end"><div><div style="font-size:9px;font-weight:800;color:#64748b;margin-bottom:5px">ログインメール</div><input id="officeLoginEmail" type="email" autocomplete="off" placeholder="8labo.academy+01@gmail.com" style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px;background:#fff;color:#111827"></div><div><div style="font-size:9px;font-weight:800;color:#64748b;margin-bottom:5px">初期パスワード</div><input id="officeInitialPassword" type="password" autocomplete="new-password" minlength="8" placeholder="8文字以上" style="width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px;background:#fff;color:#111827"></div><button id="officeProvisionBtn" type="button" style="border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;font-weight:900;font-size:10px;cursor:pointer;white-space:nowrap">アカウントを有効化</button></div><div id="officeInviteMsg" style="font-size:9px;line-height:1.6;margin-top:8px;color:#64748b">８LABO IDや人物データは作成せず、この事務局アカウント専用のログインを設定します。すでに招待済みの事務局01も、ここでパスワードを設定し直せます。</div>';
    const firstRow=editor.querySelector('.row');
    if(firstRow) firstRow.insertAdjacentElement('beforebegin',box); else editor.prepend(box);

    let cache=[];
    async function refresh(){
      const {data,error}=await sb.from('office_accounts').select('id,display_name,account_code,auth_user_id,login_email,status').order('account_code');
      if(error)return;
      cache=data||[];
      const title=$('title')?.textContent?.trim();
      const a=cache.find(x=>x.display_name===title);
      if(!a)return;
      const input=$('officeLoginEmail'),pwd=$('officeInitialPassword'),btn=$('officeProvisionBtn');
      if(document.activeElement!==input) input.value=a.login_email||'';
      if(document.activeElement!==pwd) pwd.value='';
      input.disabled=false; pwd.disabled=false; btn.disabled=false; btn.style.opacity='1';
      $('officeAuthCurrent').textContent=a.auth_user_id?`接続済み：${a.login_email||'メール不明'}（パスワード再設定可能）`:'未接続：メールアドレスと初期パスワードを設定してください。';
      btn.textContent=a.auth_user_id?'パスワードを設定・更新':'アカウントを有効化';
    }

    const accountList=$('accounts');
    if(accountList) accountList.addEventListener('click',e=>{if(e.target.closest('.account'))setTimeout(refresh,80)});
    setTimeout(refresh,350);

    $('officeProvisionBtn').onclick=async()=>{
      const title=$('title')?.textContent?.trim();
      const a=cache.find(x=>x.display_name===title);
      const email=$('officeLoginEmail').value.trim().toLowerCase();
      const password=$('officeInitialPassword').value;
      const msg=$('officeInviteMsg');
      if(!a||!email){msg.textContent='事務局アカウントを選択し、メールアドレスを入力してください。';msg.style.color='#991b1b';return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='メールアドレスの形式をご確認ください。';msg.style.color='#991b1b';return;}
      if(password.length<8){msg.textContent='初期パスワードは8文字以上で設定してください。';msg.style.color='#991b1b';return;}
      const btn=$('officeProvisionBtn');btn.disabled=true;btn.textContent='設定中…';
      const {data:{session}}=await sb.auth.getSession();
      try{
        const res=await fetch(`${cfg.supabaseUrl}/functions/v1/provision-office-account`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token||''}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({office_account_id:a.id,email,password})});
        const out=await res.json();
        if(!res.ok)throw new Error(out.error||'ログインアカウントを設定できませんでした。');
        msg.textContent=`${email} の事務局ログインを設定しました。ポータルのログインから、このメールアドレスと設定したパスワードでログインできます。`;
        msg.style.color='#166534';
        await refresh();
      }catch(e){msg.textContent=e.message||String(e);msg.style.color='#991b1b';btn.disabled=false;btn.textContent=a.auth_user_id?'パスワードを設定・更新':'アカウントを有効化';}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();