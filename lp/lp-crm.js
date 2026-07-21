/* LP CRM wiring — same eTeacher endpoint & ProductID 26 as homepage,
   with EMAIL-MARKETING attribution tag in DynamicParameters + AdminNotes
   so leads route as email-marketing, NOT as WebLead / paid ads. */
(function () {
  if (!window.eTeacherLeads || !window.LLA_US) {
    console.warn('[LP CRM] eTeacherLeads or LLA_US validator not loaded yet — retry in 200ms');
    setTimeout(arguments.callee, 200); return;
  }
  var LP_ID = (window.LLA_LP_ATTRIBUTION && window.LLA_LP_ATTRIBUTION.lp_id) || 'unknown-lp';
  var CAMPAIGN = 'LGV_EN_EMAIL_FoundersVoucher_2026-08';
  var UTM_SOURCE = 'email';
  var UTM_MEDIUM = 'email';
  var ADMIN_PREFIX = 'EMAIL LP · ' + LP_ID.toUpperCase() + ' · Founders Voucher Aug26';

  // Force email-marketing UTMs into the attribution storage the eTeacher script
  // reads at submit time (getAttribution → buildDynamicParameters → DynamicParameters).
  try {
    var stored = JSON.parse(localStorage.getItem('lla_attribution_v1') || '{}');
    stored.utm_source   = UTM_SOURCE;
    stored.utm_medium   = UTM_MEDIUM;
    stored.utm_campaign = CAMPAIGN;
    stored.utm_content  = LP_ID;
    stored.utm_term     = 'founders-voucher-aug26';
    stored.first_touch_at = stored.first_touch_at || Date.now();
    stored.last_touch_at  = Date.now();
    localStorage.setItem('lla_attribution_v1', JSON.stringify(stored));
  } catch (e) {}

  // Attach handler to LP form
  var form = document.getElementById('lp-lead-form');
  if (!form) return;
  var errBox = form.querySelector('.form-error');
  var thanks = document.getElementById('lp-thankyou');
  var submitBtn = form.querySelector('button[type="submit"]');

  function showErr(msg) {
    if (!errBox) return alert(msg);
    errBox.textContent = msg;
    errBox.classList.add('visible');
  }
  function clearErr() {
    if (errBox) { errBox.classList.remove('visible'); errBox.textContent = ''; }
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearErr();
    var fd = new FormData(form);
    var fields = {
      firstName: (fd.get('firstName') || '').trim(),
      lastName:  (fd.get('lastName') || '').trim(),
      email:     (fd.get('email') || '').trim(),
      phone:     (fd.get('phone') || '').trim(),
      countryIso:(fd.get('state') || '').trim(),  // US state code
      adminNotes: ADMIN_PREFIX
    };
    if (!fields.firstName || !fields.lastName || !fields.email || !fields.phone || !fields.countryIso) {
      showErr('Please fill in all fields, including your US state.'); return;
    }
    form.classList.add('is-submitting');
    if (submitBtn) submitBtn.disabled = true;

    window.eTeacherLeads.submit(fields).then(function (res) {
      form.classList.remove('is-submitting');
      if (submitBtn) submitBtn.disabled = false;
      if (res && res.ok) {
        // Success — show thank-you, hide form
        if (thanks) thanks.style.display = 'block';
        form.style.display = 'none';
        try {
          if (window.dataLayer) window.dataLayer.push({
            event: 'lp_lead_submit',
            lp_id: LP_ID,
            utm_source: UTM_SOURCE,
            utm_medium: UTM_MEDIUM,
            utm_campaign: CAMPAIGN,
            crm_status: 'ok'
          });
        } catch (e) {}
      } else {
        var msg = 'We could not submit your application. Please try again in a moment.';
        if (res && res.error === 'non_us_phone') msg = 'Please enter a valid US mobile number.';
        else if (res && res.error === 'invalid_state') msg = 'Please select your US state.';
        else if (res && res.error === 'Missing or invalid fields') msg = 'Please check all fields are filled correctly.';
        showErr(msg);
      }
    }).catch(function () {
      form.classList.remove('is-submitting');
      if (submitBtn) submitBtn.disabled = false;
      showErr('Network error. Please try again.');
    });
  });
})();
