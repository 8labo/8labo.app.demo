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
      const linkCss = 'display:inline-flex;align-items:center;min-height:28px;padding:5px 8px;border-radius:8px;font-size:9px;font-weight:800;color:inherit;text-decoration:none;white-space:nowrap;';
      box.querySelectorAll('a').forEach(a=>a.style.cssText=linkCss);

      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.position = 'relative';
        box.style.cssText = 'position:absolute;right:12px;bottom:10px;display:flex;gap:4px;z-index:2;color:#e5e7eb;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:2px;backdrop-filter:blur(6px);';
        box.querySelectorAll('a').forEach(a=>{a.style.background='transparent';a.style.color='#e5e7eb'});
        hero.appendChild(box);
      } else {
        const header = document.querySelector('header');
        if (!header) return;
        box.style.cssText = 'display:flex;gap:4px;margin-left:auto;margin-right:10px;color:#6b7280;';
        box.querySelectorAll('a').forEach(a=>{a.style.border='1px solid rgba(107,114,128,.18)';a.style.background='rgba(255,255,255,.72)'});
        const back = header.querySelector('a');
        header.insertBefore(box, back || null);
      }
    } catch (_) {}
  };

  const loadWebsitePhotoEditor = () => {
    if ((location.pathname.split('/').pop() || '') !== 'website-admin.html') return;
    const script = document.createElement('script');
    script.src = 'photo-editor-v2.js?v=2';
    script.defer = true;
    document.head.appendChild(script);
  };

  const init = () => { wireServiceLinks(); addStaffAdminEntry(); addContextDataTools(); loadWebsitePhotoEditor(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
