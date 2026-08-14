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
      box.style.cssText = 'display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;margin:10px auto 0;width:min(1120px,calc(100% - 28px));';
      box.innerHTML = `<a href="data-import.html?type=${info.type}" style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#374151;text-decoration:none">${info.label}</a><a href="data-export.html" style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;font-size:10px;font-weight:800;color:#374151;text-decoration:none">データ管理センター</a>`;
      const main = document.querySelector('main');
      if (main && main.parentNode) main.parentNode.insertBefore(box, main);
    } catch (_) {}
  };

  const init = () => { wireServiceLinks(); addStaffAdminEntry(); addContextDataTools(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
