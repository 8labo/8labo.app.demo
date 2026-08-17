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
    box.innerHTML='<div style="font-size:10px;font-weight:900;margin-bottom:7px">ログイン認証</div><div id="officeAuthCurrent" style="font-size:10px;color:#64748b;margin-bottom:9px">事務局アカウントを選択してください。</div><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="officeLoginEmail" type="email" placeholder="例：8labo.academy+01@gmail.com" style="flex:1;min-width:240px;border:1px solid #d1d5db;border-radius:10px;padding:10px;background:#fff"><button id="officeInviteBtn" type="button" style="border:0;border-radius:10px;padding:10px 13px;background:#111827;color:#fff;font-weight:900;font-size:10px;cursor:pointer">招待メールを送信</button></div><div id="officeInviteMsg" style="font-size:9px;line-height:1.6;margin-top:8px;color:#64748b">招待先でパスワードを設定すると、８LABO IDを発行せず、この事務局アカウントだけに接続されます。</div>';
    const firstRow=editor.querySelector('.row');
    if(firstRow) firstRow.insertAdjacentElement('beforebegin',box); else editor.prepend(box);

    function selectedAccount(){
      const active=document.querySelector('.account.active');
      if(!active)return null;
      const title=$('title')?.textContent?.trim();
      return (window.__officeAccountsCache||[]).find(a=>a.display_name===title)||null;
    }

    async function refresh(){
      const {data,error}=await sb.from('office_accounts').select('id,display_name,account_code,auth_user_id,login_email,status').order('account_code');
      if(error)return;
      window.__officeAccountsCache=data||[];
      const title=$('title')?.textContent?.trim();
      const a=(data||[]).find(x=>x.display_name===title);
      if(!a)return;
      $('officeLoginEmail').value=a.login_email||'';
      $('officeLoginEmail').disabled=!!a.auth_user_id;
      $('officeInviteBtn').disabled=!!a.auth_user_id;
      $('officeInviteBtn').style.opacity=a.auth_user_id?'.45':'1';
      $('officeAuthCurrent').textContent=a.auth_user_id?`接続済み：${a.login_email||'メール不明'}`:'未接続：メールアドレスを入力して招待してください。';
    }

    new MutationObserver(()=>setTimeout(refresh,0)).observe(editor,{childList:true,subtree:true,attributes:true});
    setTimeout(refresh,300);

    $('officeInviteBtn').onclick=async()=>{
      const title=$('title')?.textContent?.trim();
      const a=(window.__officeAccountsCache||[]).find(x=>x.display_name===title);
      const email=$('officeLoginEmail').value.trim().toLowerCase();
      if(!a||!email){$('officeInviteMsg').textContent='事務局アカウントを選択し、メールアドレスを入力してください。';return;}
      const btn=$('officeInviteBtn'); btn.disabled=true; btn.textContent='送信中…';
      const {data:{session}}=await sb.auth.getSession();
      try{
        const res=await fetch(`${cfg.supabaseUrl}/functions/v1/invite-office-account`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session?.access_token||''}`,'apikey':cfg.supabasePublishableKey},body:JSON.stringify({office_account_id:a.id,email})});
        const out=await res.json();
        if(!res.ok)throw new Error(out.error||'招待メールを送信できませんでした。');
        $('officeInviteMsg').textContent=`${email} に招待メールを送信しました。メール内のリンクからパスワードを設定してください。`;
        $('officeInviteMsg').style.color='#166534';
        await refresh();
      }catch(e){$('officeInviteMsg').textContent=e.message||String(e);$('officeInviteMsg').style.color='#991b1b';btn.disabled=false;btn.textContent='招待メールを送信';}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();