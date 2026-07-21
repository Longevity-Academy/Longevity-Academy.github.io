/* LP CRM wiring — same eTeacher endpoint & ProductID 26 as homepage,
   with EMAIL-MARKETING attribution tag in DynamicParameters + AdminNotes
   so leads route as email-marketing, NOT as WebLead / paid ads. */
(function () {
  function boot() {
    if (!window.eTeacherLeads || !window.LLA_US) {
      return setTimeout(boot, 200);
    }
    var LP_ID = (window.LLA_LP_ATTRIBUTION && window.LLA_LP_ATTRIBUTION.lp_id) || 'unknown-lp';
    var CAMPAIGN = 'LGV_EN_EMAIL_FoundersVoucher_2026-08';
    var UTM_SOURCE = 'email';
    var UTM_MEDIUM = 'email';
    var ADMIN_PREFIX = 'EMAIL LP · ' + LP_ID.toUpperCase() + ' · Founders Voucher Aug26';

    // Force email-marketing UTMs into the attribution storage that the
    // eTeacher script reads at submit time (getAttribution → DynamicParameters).
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

    var form = document.getElementById('lp-lead-form');
    if (!form) return;
    var errBox = form.querySelector('.form-error');
    var thanks = document.getElementById('lp-thankyou');
    var submitBtn = form.querySelector('button[type="submit"]');

    function showErr(msg) {
      if (!errBox) { alert(msg); return; }
      errBox.textContent = msg;
      errBox.classList.add('visible');
    }
    function clearErr() {
      if (errBox) { errBox.classList.remove('visible'); errBox.textContent = ''; }
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearErr();

      // Read from named inputs (matches live site: name="country" holds US state code)
      var stateVal = (form.querySelector('[name="country"]') || {}).value || '';
      var fields = {
        firstName: (form.querySelector('[name="firstName"]') || {}).value || '',
        lastName:  (form.querySelector('[name="lastName"]')  || {}).value || '',
        email:     (form.querySelector('[name="email"]')     || {}).value || '',
        phone:     (form.querySelector('[name="phone"]')     || {}).value || '',
        countryIso: stateVal,   // eTeacher submit expects US state code here
        adminNotes: ADMIN_PREFIX
      };
      fields.firstName = fields.firstName.trim();
      fields.lastName  = fields.lastName.trim();
      fields.email     = fields.email.trim();
      fields.phone     = fields.phone.trim();
      fields.countryIso = fields.countryIso.trim().toUpperCase();

      if (!fields.firstName) { showErr('Please enter your first name.'); return; }
      if (!fields.lastName)  { showErr('Please enter your last name.'); return; }
      if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) { showErr('Please enter a valid email address.'); return; }
      if (!fields.phone) { showErr('Please enter your US phone number.'); return; }
      if (!fields.countryIso) {
        showErr('Please select your US state from the dropdown.');
        var sel = form.querySelector('[name="country"]');
        if (sel) { sel.focus(); sel.style.borderColor = '#ff6b6b'; }
        return;
      }

      form.classList.add('is-submitting');
      if (submitBtn) submitBtn.disabled = true;

      window.eTeacherLeads.submit(fields).then(function (res) {
        form.classList.remove('is-submitting');
        if (submitBtn) submitBtn.disabled = false;
        if (res && res.ok) {
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
          if (res && res.error === 'non_us_phone') msg = 'Please enter a valid US mobile number (e.g. 555-123-4567).';
          else if (res && res.error === 'invalid_state') msg = 'Please select your US state from the dropdown.';
          else if (res && res.error === 'Missing or invalid fields') msg = 'Please check all fields are filled correctly.';
          showErr(msg);
        }
      }).catch(function () {
        form.classList.remove('is-submitting');
        if (submitBtn) submitBtn.disabled = false;
        showErr('Network error. Please try again.');
      });
    });
  }
  boot();
})();
