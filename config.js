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

  const init = () => { wireServiceLinks(); addStaffAdminEntry(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
