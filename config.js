window.EIGHTLABO_CONFIG = {
  supabaseUrl: 'https://uksoinulgbchzvvbcezi.supabase.co',
  supabasePublishableKey: 'sb_publishable_fm6TZ6GTN8papKDtKakX9w_O5Vf8Oax',
  serviceUrls: {
    ACADEMY: 'https://8labo.github.io/8labo-academy.app.demo2/',
    BIZFIT: 'https://8labo.github.io/bizfit-club.app.demo2/'
  },
  adminUrls: {
    PORTAL: 'https://8labo.github.io/8labo.app.demo/staff.html',
    COMMON: 'https://8labo.github.io/8labo.app.demo/admin.html',
    EXPORT: 'https://8labo.github.io/8labo.app.demo/data-export.html',
    ACADEMY: 'https://8labo.github.io/8labo-academy.app.demo2/admin.html',
    BIZFIT: 'https://8labo.github.io/bizfit-club.app.demo2/admin.html'
  }
};

(function () {
  const wireServiceLinks = () => {
    const urls = window.EIGHTLABO_CONFIG && window.EIGHTLABO_CONFIG.serviceUrls;
    if (!urls) return;
    document.querySelectorAll('[data-code]').forEach((card) => {
      const code = card.dataset.code;
      const url = urls[code];
      if (!url) return;
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${code}を開く`);
      const openService = () => { window.location.href = url; };
      card.addEventListener('click', openService);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openService(); }
      });
    });
  };

  const addStaffAdminEntry = async () => {
    try {
      if (!window.supabase || !window.EIGHTLABO_CONFIG) return;
      const cfg = window.EIGHTLABO_CONFIG;
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const { data: staffId, error } = await sb.rpc('current_staff_id');
      if (error || !staffId) return;
      const link = document.createElement('a');
      link.href = cfg.adminUrls.PORTAL;
      link.textContent = '管理';
      link.setAttribute('aria-label', 'スタッフ管理ポータル');
      link.style.cssText = ['position:fixed','right:12px','bottom:10px','z-index:20','font-size:9px','font-weight:700','letter-spacing:.06em','color:#9ca3af','text-decoration:none','opacity:.72','padding:5px 7px','border-radius:8px','background:rgba(255,255,255,.78)','border:1px solid rgba(229,231,235,.8)','backdrop-filter:blur(8px)'].join(';');
      document.body.appendChild(link);
    } catch (_) {}
  };

  const addContextDataTools = async () => {
    try {
      const path = location.pathname.split('/').pop() || '';
      const pageTypes = {
        'portal-admin.html': { type: 'persons', label: '人物をインポート' },
        'activity-admin.html': { type: 'activities', label: '活動をインポート' },
        'shift-v2.html': { type: 'shifts', label: 'シフト枠をインポート' }
      };
      const info = pageTypes[path];
      if (!info || !window.supabase) return;
      const cfg = window.EIGHTLABO_CONFIG;
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
      const { data: isAdmin } = await sb.rpc('is_system_admin');
      if (!isAdmin) return;
      const box = document.createElement('div');
      box.setAttribute('aria-label','データ操作');
      box.innerHTML = `<a href="data-import.html?type=${info.type}">${info.label}</a><a href="data-export.html">データ管理</a>`;
      const linkCss = 'display:inline-flex;align-items:center;justify-content:center;min-height:30px;padding:6px 10px;border-radius:8px;font-size:9px;font-weight:800;text-decoration:none;white-space:nowrap;';
      box.querySelectorAll('a').forEach(a=>a.style.cssText=linkCss);
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.position = 'relative';
        box.style.cssText = 'position:absolute;right:12px;bottom:10px;display:flex;gap:8px;z-index:2;';
        box.querySelectorAll('a').forEach(a=>{a.style.background='rgba(255,255,255,.10)';a.style.color='#f3f4f6';a.style.border='1px solid rgba(255,255,255,.28)';a.style.boxShadow='0 1px 2px rgba(0,0,0,.08)';a.style.backdropFilter='blur(6px)';});
        hero.appendChild(box);
      } else {
        const header = document.querySelector('header');
        if (!header) return;
        box.style.cssText = 'display:flex;gap:8px;margin-left:auto;margin-right:10px;color:#6b7280;';
        box.querySelectorAll('a').forEach(a=>{a.style.border='1px solid rgba(107,114,128,.25)';a.style.background='rgba(255,255,255,.78)';a.style.color='#4b5563';});
        const back = header.querySelector('a');
        header.insertBefore(box, back || null);
      }
    } catch (_) {}
  };

  const addPortalAuthStatus = async () => {
    try {
      if ((location.pathname.split('/').pop() || '') !== 'portal-admin.html' || !window.supabase) return;
      const cfg = window.EIGHTLABO_CONFIG;
      const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey);
      const { data: isAdmin } = await sb.rpc('is_system_admin');
      if (!isAdmin) return;
      const detail = document.getElementById('detail'); if (!detail) return;
      let lastPerson = null, busy = false;
      const fmtDate = (v) => v ? new Date(v).toLocaleString('ja-JP') : '—';
      const labels = {linked_confirmed:'登録済み・メール確認済み',linked_unconfirmed:'登録済み・メール確認待ち',linked_auth_missing:'紐付け異常（認証情報なし）',unlinked_candidate_confirmed:'認証済み・人物未紐付け',unlinked_candidate_unconfirmed:'メール確認待ち・人物未紐付け',unregistered:'ログイン未登録'};
      const render = async () => {
        if (busy) return;
        const link = detail.querySelector('a[href*="person-detail.html?person="]'); if (!link) return;
        let personId=''; try { personId = new URL(link.href, location.href).searchParams.get('person') || ''; } catch(_) {}
        if (!personId || personId===lastPerson) return;
        lastPerson=personId; busy=true;
        const old=document.getElementById('authStatusAdminBox'); if(old) old.remove();
        const {data,error}=await sb.rpc('admin_account_status',{target_person_id:personId}); busy=false;
        if(error||!data) return;
        const box=document.createElement('div'); box.id='authStatusAdminBox'; box.style.cssText='margin-top:12px;padding:13px 14px;border:1px solid #e5e7eb;border-radius:14px;background:#f8fafc;font-size:11px;line-height:1.7;';
        const loginEmail=data.login_email||data.candidate_login_email||'—'; const confirmed=data.email_confirmed_at||data.candidate_email_confirmed_at; const lastSign=data.last_sign_in_at||data.candidate_last_sign_in_at; const candidate=String(data.display_status||'').startsWith('unlinked_candidate');
        box.innerHTML=`<div style="font-size:10px;font-weight:900;color:#6b7280;margin-bottom:5px">ログインアカウント状況</div><div style="font-weight:900;color:#111827;margin-bottom:5px">${labels[data.display_status]||data.display_status||'不明'}</div><div><span style="color:#6b7280">ログインメール：</span>${loginEmail}</div><div><span style="color:#6b7280">メール確認：</span>${confirmed?fmtDate(confirmed):'未確認'}</div><div><span style="color:#6b7280">最終ログイン：</span>${fmtDate(lastSign)}</div>${candidate?'<div style="margin-top:7px;color:#9a3412">※連絡先メールと同じ認証アカウントがありますが、この人物にはまだ紐付いていません。</div>':''}`;
        const firstSection=detail.querySelector('.section'); if(firstSection) firstSection.insertAdjacentElement('afterend',box); else detail.appendChild(box);
      };
      new MutationObserver(()=>{ lastPerson=null; setTimeout(render,0); }).observe(detail,{childList:true,subtree:true}); render();
    } catch (_) {}
  };

  const loadWebsitePhotoEditor = () => {
    if ((location.pathname.split('/').pop() || '') !== 'website-admin.html') return;
    const script = document.createElement('script'); script.src = 'photo-editor-v2.js?v=2'; script.defer = true; document.head.appendChild(script);
  };

  const loadOfficeAuthUI = () => {
    if ((location.pathname.split('/').pop() || '') !== 'office-accounts.html') return;
    const script = document.createElement('script'); script.src = 'office-auth-ui.js?v=2'; script.defer = true; document.head.appendChild(script);
  };

  const init = () => { wireServiceLinks(); addStaffAdminEntry(); addContextDataTools(); addPortalAuthStatus(); loadWebsitePhotoEditor(); loadOfficeAuthUI(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
