/* LP CRM wiring — eTeacher endpoint, ProductID 26 (Longevity),
   CampaignID 117600 (Longevity Email Marketing) — no UTM tagging.
   The CampaignID is the ONLY source classifier eTeacher CRM honors. */
(function () {
  var LGV_CAMPAIGN_ID = 117600;   // Longevity — Email Marketing (per Omri, 2026-07-21)

  function boot() {
    if (!window.eTeacherLeads || !window.LLA_US) {
      return setTimeout(boot, 200);
    }

    var LP_ID = (window.LLA_LP_ATTRIBUTION && window.LLA_LP_ATTRIBUTION.lp_id) || 'lp';
    var ADMIN_PREFIX = 'LGV EMAIL LP · ' + LP_ID.toUpperCase() + ' · Founders Voucher Aug26';

    // Wipe any stale UTM email-marketing values from prior LP versions so
    // DynamicParameters no longer carries them into the CRM.
    try {
      var stored = JSON.parse(localStorage.getItem('lla_attribution_v1') || '{}');
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){ delete stored[k]; });
      stored.last_touch_at = Date.now();
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

      var stateVal = (form.querySelector('[name="country"]') || {}).value || '';
      var fields = {
        firstName: (form.querySelector('[name="firstName"]') || {}).value || '',
        lastName:  (form.querySelector('[name="lastName"]')  || {}).value || '',
        email:     (form.querySelector('[name="email"]')     || {}).value || '',
        phone:     (form.querySelector('[name="phone"]')     || {}).value || '',
        countryIso: stateVal,
        adminNotes: ADMIN_PREFIX,
        campaignId: LGV_CAMPAIGN_ID       // <-- ensures CRM classifies as Longevity Email Marketing
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
              campaign_id: LGV_CAMPAIGN_ID,
              product_id: 26,
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
