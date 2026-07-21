/* LLA Campaign LP Gate — token in URL or localStorage. */
(function(){
  var TOKEN = 'lgv-aug26';
  var params = new URLSearchParams(location.search);
  var qToken = params.get('k');
  var stored = null;
  try { stored = localStorage.getItem('lla_lp_token'); } catch(e){}
  var ok = (qToken === TOKEN) || (stored === TOKEN);
  if (qToken === TOKEN) { try { localStorage.setItem('lla_lp_token', TOKEN); } catch(e){} }
  if (!ok) {
    document.documentElement.innerHTML =
      '<head><title>Not found</title><meta name="robots" content="noindex,nofollow"><style>body{background:#0A1220;color:#c8d3ea;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.b{text-align:center;padding:40px;max-width:520px}.b h1{font-family:Georgia,serif;font-size:36px;margin:0 0 12px;font-weight:400}.b p{font-size:15px;opacity:.7;line-height:1.6}</style></head>'+
      '<body><div class="b"><h1>Page not found</h1><p>This page is not publicly available. If you received an invitation from Longevity Life Academy, please use the exact link from your email.</p></div></body>';
    document.title = 'Not found';
    return;
  }
  // Robots + attribution: mark as email-marketing lead
  var meta = document.createElement('meta');
  meta.name = 'robots'; meta.content = 'noindex,nofollow';
  document.head && document.head.appendChild(meta);
  window.LLA_LP_ATTRIBUTION = {
    utm_source: 'email',
    utm_medium: 'email',
    utm_campaign: 'LGV_EN_EMAIL_FoundersVoucher_2026-08',
    lp_id: (location.pathname.indexOf('founders-invitation') > -1) ? 'founders-invitation' : 'founders-voucher'
  };
})();
