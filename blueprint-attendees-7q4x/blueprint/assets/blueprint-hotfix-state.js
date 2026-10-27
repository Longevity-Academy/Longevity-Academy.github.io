/* Blueprint state repair. Load defer AFTER lla-country.js and eteacher-ecomm.js.
 * Live-source contract (2026-09-23): LLA_ECOMM.stageLead synchronously stores
 * lla_ecomm_pending; ecommerce state belongs in DynamicParameters, not StateId.
 * No requests, API identities, price changes, or country-lock changes.
 */
(function () {
  'use strict';
  if (window.LLA_BLUEPRINT_STATE) return;
  var rows = 'AL|Alabama;AK|Alaska;AZ|Arizona;AR|Arkansas;CA|California;CO|Colorado;CT|Connecticut;DE|Delaware;DC|District of Columbia;FL|Florida;GA|Georgia;HI|Hawaii;ID|Idaho;IL|Illinois;IN|Indiana;IA|Iowa;KS|Kansas;KY|Kentucky;LA|Louisiana;ME|Maine;MD|Maryland;MA|Massachusetts;MI|Michigan;MN|Minnesota;MS|Mississippi;MO|Missouri;MT|Montana;NE|Nebraska;NV|Nevada;NH|New Hampshire;NJ|New Jersey;NM|New Mexico;NY|New York;NC|North Carolina;ND|North Dakota;OH|Ohio;OK|Oklahoma;OR|Oregon;PA|Pennsylvania;RI|Rhode Island;SC|South Carolina;SD|South Dakota;TN|Tennessee;TX|Texas;UT|Utah;VT|Vermont;VA|Virginia;WA|Washington;WV|West Virginia;WI|Wisconsin;WY|Wyoming'.split(';');
  var valid = {};
  rows.forEach(function (r) { valid[r.split('|')[0]] = true; });
  function el(id) { return document.getElementById(id); }
  function iso() { return el('emCountry') && el('emCountry').value || 'US'; }
  function sync() {
    var s = el('bpBuyerState'), f = el('bpBuyerStateField');
    if (!s || !f) return;
    var us = iso() === 'US';
    f.hidden = !us;
    f.style.display = us ? '' : 'none';
    s.required = us;
    s.disabled = !us;
    if (!us) s.value = '';
  }
  function boot() {
    var c = el('emCountry'), api = window.LLA_ECOMM;
    if (!c || !api || typeof api.stageLead !== 'function') return;
    if (!c.value) c.value = 'US';
    if (!el('bpBuyerState')) {
      var f = document.createElement('div');
      f.id = 'bpBuyerStateField';
      f.style.gridColumn = '1 / -1';
      var lab = document.createElement('label');
      lab.className = 'em-lb';
      lab.htmlFor = 'bpBuyerState';
      lab.textContent = 'State (U.S. only)*';
      var s = document.createElement('select');
      // Deliberately not emState/name=state: lla-country's observer would
      // otherwise wrap this with a second Country selector.
      s.id = 'bpBuyerState'; s.name = 'buyer_state';
      s.className = 'em-in'; s.autocomplete = 'address-level1';
      var ph = document.createElement('option');
      ph.value = ''; ph.textContent = 'Select your state';
      s.appendChild(ph);
      rows.forEach(function (r) {
        var p = r.split('|'), o = document.createElement('option');
        o.value = p[0]; o.textContent = p[1]; s.appendChild(o);
      });
      f.appendChild(lab); f.appendChild(s);
      var anchor = el('emPhone') || c.closest('.em-phone') || c;
      anchor.parentNode.insertBefore(f, anchor.nextSibling);
      c.addEventListener('change', sync);
    }
    sync();
    if (api.__bpStateWrapped) return;
    var original = api.stageLead;
    api.stageLead = function (fields) {
      sync();
      var country = iso(), state = country === 'US' ? el('bpBuyerState').value : '';
      if (country === 'US' && !valid[state]) {
        el('bpBuyerState').reportValidity();
        el('bpBuyerState').focus();
        return { ok: false, error: 'missing_buyer_state' };
      }
      var result = original.call(this, Object.assign({}, fields, { countryIso: country, stateIso: state }));
      if (!result || !result.ok) return result;
      try {
        var key = 'lla_ecomm_pending';
        var pending = JSON.parse(sessionStorage.getItem(key));
        if (!pending || !pending.payload) throw new Error('missing_staged_payload');
        var p = pending.payload;
        // Keep both US country values, all IDs, pricing, attribution and plan.
        if (api.config.mode === 'ecomm') {
          var parts = String(p.DynamicParameters || '').split('&').filter(function (v) {
            return v && !/^stateisocodebyip=/i.test(v);
          }).map(function (v) {
            return /^message=/i.test(v)
              ? v.replace(/US%20State%20[A-Z]{2}(?=%20|$)/g,
                  country === 'US' ? 'US%20State%20' + state : 'Country%20' + country)
              : v;
          });
          if (country === 'US') parts.push('stateisocodebyip=' + state);
          p.DynamicParameters = parts.join('&');
          if (p.DynamicParameters.length > 4000) throw new Error('payload_too_long');
          delete p.State; delete p.StateProvinceRegion; delete p.StateId;
        } else {
          if (country === 'US') { p.State = state; p.StateProvinceRegion = state; }
          else { delete p.State; delete p.StateProvinceRegion; delete p.StateId; }
          p.AdminNotes = String(p.AdminNotes || '').replace(/US State: [A-Z]{2}/g,
            country === 'US' ? 'US State: ' + state : 'US State: -');
        }
        sessionStorage.setItem(key, JSON.stringify(pending));
        sessionStorage.setItem('lla_buyer_country', country);
        // Align persisted identity with the explicit state, not phone area code.
        [localStorage, sessionStorage].forEach(function (store, i) {
          var k = i ? 'lla_buyer_v1' : 'lla_identity_v1';
          try { var identity = JSON.parse(store.getItem(k)); if (identity) {
            identity.st = state.toLowerCase(); store.setItem(k, JSON.stringify(identity));
          } } catch (ignore) {}
        });
        return result;
      } catch (e) {
        try { sessionStorage.removeItem('lla_ecomm_pending'); } catch (ignore) {}
        return { ok: false, error: 'storage_unavailable' };
      }
    };
    api.__bpStateWrapped = true;
  }
  window.LLA_BLUEPRINT_STATE = { boot: boot, states: rows };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
