/**
 * LLA per-visitor beacon (checkout-first).
 *
 * Captures, per session:
 *   - landing event with page/referrer/utm/fbclid/gclid/tz/viewport
 *   - every input focus + blur on the checkout page (form-field ids only,
 *     never values; values are hashed lengths for privacy)
 *   - scroll depth milestones (25/50/75/100%)
 *   - click on any [data-fn-cta], .fn-btn, a[href^="/checkout"], #enroll button
 *   - final exit beacon with time_on_page_ms, last_focused, fields_touched,
 *     scroll_pct, exit_reason (navigation | tab_hide | pagehide)
 *
 * All beacons POST to /lla-beacon on the same origin (Cloudflare Pages Function).
 * Uses sendBeacon for reliability during unload. Fires nothing on non-http pages.
 */
(function () {
  if (!/^https?:$/.test(location.protocol)) return;
  if (window.__LLA_BEACON_LOADED__) return; window.__LLA_BEACON_LOADED__ = true;

  var ENDPOINT = "/lla-beacon";
  var START = Date.now();

  // Session id — persistent across pages, resets on new tab / >30min idle
  var SID_KEY = "lla_beacon_sid";
  var SID_TS_KEY = "lla_beacon_sid_ts";
  function newSid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  var sid;
  try {
    var prev = sessionStorage.getItem(SID_KEY);
    var prevTs = parseInt(sessionStorage.getItem(SID_TS_KEY) || "0", 10);
    if (prev && Date.now() - prevTs < 30 * 60 * 1000) sid = prev;
  } catch (e) {}
  if (!sid) sid = newSid();
  try {
    sessionStorage.setItem(SID_KEY, sid);
    sessionStorage.setItem(SID_TS_KEY, String(Date.now()));
  } catch (e) {}

  var q = new URLSearchParams(location.search);
  function param(n) { return q.get(n) || ""; }

  // fbclid may also be in the raw querystring (URLSearchParams handles it)
  var base = {
    sid: sid,
    page: location.pathname + location.search,
    referrer: document.referrer || "",
    utm_source: param("utm_source"),
    utm_campaign: param("utm_campaign"),
    fbclid: param("fbclid"),
    gclid: param("gclid"),
    tz: (Intl.DateTimeFormat().resolvedOptions().timeZone) || "",
    viewport: window.innerWidth + "x" + window.innerHeight,
  };

  function send(evt) {
    var body = Object.assign({}, base, evt);
    try {
      var payload = JSON.stringify(body);
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }
      fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  // Landing beacon
  send({ event: "landing", stage: pageStage() });

  // Scroll depth milestones
  var hit = { 25: false, 50: false, 75: false, 100: false };
  function scrollPct() {
    var h = document.documentElement;
    var b = document.body;
    var st = h.scrollTop || b.scrollTop || 0;
    var sh = Math.max(h.scrollHeight, b.scrollHeight);
    var vh = window.innerHeight || h.clientHeight;
    if (sh <= vh) return 100;
    return Math.min(100, Math.round(((st + vh) / sh) * 100));
  }
  var lastPct = 0;
  window.addEventListener("scroll", function () {
    var p = scrollPct();
    lastPct = Math.max(lastPct, p);
    [25, 50, 75, 100].forEach(function (m) {
      if (!hit[m] && p >= m) { hit[m] = true; send({ event: "scroll", stage: pageStage(), value: String(m) }); }
    });
  }, { passive: true });

  // CTA clicks (any element the page treats as an Enroll / primary CTA)
  var CTA_SEL = '[data-fn-cta],.fn-btn,.section-cta-btn,a[href*="checkout"],#enroll,#enroll-mini a,.fn-hero-cta';
  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t.nodeType === 1) {
      if (t.matches && t.matches(CTA_SEL)) {
        send({
          event: "cta_click",
          stage: pageStage(),
          field: (t.getAttribute("data-fn-cta") || t.id || t.className || "").slice(0, 64),
          value: (t.textContent || "").trim().slice(0, 80),
        });
        return;
      }
      t = t.parentElement;
    }
  }, true);

  // Field-level tracking on /checkout only
  var isCheckout = /\/checkout(\.html)?(\/|$|\?)/.test(location.pathname + location.search);
  var lastFocused = "";
  var focused = {}; // field id -> first focus ms since START
  var touched = {}; // field id -> ms since focus at last blur
  var order = [];   // ordered ids as they were first focused

  if (isCheckout) {
    document.addEventListener("focusin", function (e) {
      var el = e.target;
      if (!isFormField(el)) return;
      var id = fieldId(el);
      lastFocused = id;
      if (!(id in focused)) {
        focused[id] = Date.now() - START;
        order.push(id);
        send({ event: "field_focus", stage: "checkout", field: id });
      }
    }, true);

    document.addEventListener("focusout", function (e) {
      var el = e.target;
      if (!isFormField(el)) return;
      var id = fieldId(el);
      var start = focused[id] != null ? START + focused[id] : Date.now();
      var dwell = Date.now() - start;
      var vlen = el.value ? String(el.value).length : 0;
      touched[id] = dwell;
      send({
        event: "field_blur",
        stage: "checkout",
        field: id,
        value: "len=" + vlen + " dwell=" + dwell + "ms",
      });
    }, true);

    // Submit attempts
    document.addEventListener("submit", function (e) {
      var f = e.target;
      send({
        event: "form_submit",
        stage: "checkout",
        field: f && f.id ? f.id : (f && f.getAttribute("name")) || "form",
      });
    }, true);
  }

  // Exit tracking
  function exitBeacon(reason) {
    send({
      event: "exit",
      stage: pageStage(),
      time_on_page_ms: Date.now() - START,
      scroll_pct: lastPct,
      last_focused: lastFocused,
      fields_touched: order,
      exit_reason: reason,
    });
  }
  var exited = false;
  function fireExit(reason) { if (exited) return; exited = true; exitBeacon(reason); }

  window.addEventListener("pagehide", function () { fireExit("pagehide"); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") fireExit("tab_hide");
  });

  function isFormField(el) {
    if (!el || !el.tagName) return false;
    var t = el.tagName.toUpperCase();
    return t === "INPUT" || t === "SELECT" || t === "TEXTAREA";
  }
  function fieldId(el) {
    return (el.id || el.name || el.getAttribute("data-field") || (el.tagName + "." + (el.className || "").split(" ")[0])).slice(0, 64);
  }
  function pageStage() {
    if (/\/checkout/.test(location.pathname)) return "checkout";
    if (location.pathname === "/" || /index/.test(location.pathname)) return "landing";
    return location.pathname.replace(/^\//, "").slice(0, 32) || "other";
  }
})();
