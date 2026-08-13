window.EIGHTLABO_CONFIG = {
  supabaseUrl: 'https://uksoinulgbchzvvbcezi.supabase.co',
  supabasePublishableKey: 'sb_publishable_fm6TZ6GTN8papKDtKakX9w_O5Vf8Oax',
  serviceUrls: {
    ACADEMY: 'https://8labo.github.io/8labo-academy.app.demo2/',
    BIZFIT: 'https://8labo.github.io/bizfit-club.app.demo2/'
  }
};

// 共通ポータルから各サービスの現在のDEMOへ遷移
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

      const openService = () => {
        window.location.href = url;
      };

      card.addEventListener('click', openService);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openService();
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireServiceLinks);
  } else {
    wireServiceLinks();
  }
})();
