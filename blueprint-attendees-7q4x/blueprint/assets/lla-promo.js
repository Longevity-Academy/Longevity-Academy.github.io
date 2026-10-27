/* Julie's promo, Sep 2026. Code-gated: applied only when the buyer has the code.
 * Loaded by index.html (enrollment popup) and checkout.html (payment page).
 * Ends 2026-09-24 23:59:59 ET. ?promo=on forces on, ?promo=off forces off and clears storage.
 * Monthly during promo: 5 x $149 = $745 (list $1,395, 47% off). Upfront $799 unchanged.
 * CRM: FirstPayment 149 / NumberOfPayments 5 / LeftToPay 596 via the price override path
 * (assets/eteacher-ecomm.js reads CFG.crmPrice / CFG.crmPlans through activePrice()).
 *
 * window.LLA_PROMO = { code, active, deadline, first, n, left, total, regular, regularTotal,
 *                      remaining(), isValid(str), activate(), deactivate() }
 * activate() is idempotent and works at runtime after page load (popup Apply button). */
(function(){
  var CODE = 'JULIE249';
  /* MASTERCLASS-VIP (2026-09-24): the credit code emailed by ActiveCampaign to VIP Masterclass
   * buyers (LGV onboarding u1-u4). Same published price contract as JULIE249 (5 x $149, upfront
   * $799, VIP Masterclass included); both codes are valid through Dec 31, 2026. The applied code is stored and stamped on the
   * CRM lead note as "Promo <code>" so the two entry paths stay distinguishable. */
  var VIP_CODE = 'MASTERCLASS-VIP';
  var CODES = [CODE, VIP_CODE];
  var DEADLINE = '2026-12-31T23:59:59-05:00'; /* Omri 2026-09-24: both codes expire Dec 31, 2026 (matches the Julie thank-you screen). */
  var SKEY = 'lla_promo_code';
  var TTL_MS = 48 * 60 * 60 * 1000;

  var q = {}; try { q = Object.fromEntries(new URLSearchParams(location.search)); } catch(e){}

  /* ---------- storage ---------- */
  function normalize(s){ return String(s == null ? '' : s).trim().toUpperCase(); }
  function isValid(s){ return Date.now() <= new Date(DEADLINE).getTime() && CODES.indexOf(normalize(s)) > -1; }
  function storedCode(){
    try { var s = sessionStorage.getItem(SKEY); if (s) return s; } catch(e){}
    try {
      var raw = localStorage.getItem(SKEY); if (!raw) return null;
      var o = null; try { o = JSON.parse(raw); } catch(e2){ o = null; }
      if (o && o.code && typeof o.ts === 'number' && (Date.now() - o.ts) < TTL_MS) return o.code;
      try { localStorage.removeItem(SKEY); } catch(e3){}
    } catch(e){}
    return null;
  }
  function storeCode(code){
    var c = isValid(code) ? normalize(code) : CODE;
    try { sessionStorage.setItem(SKEY, c); } catch(e){}
    try { localStorage.setItem(SKEY, JSON.stringify({ code: c, ts: Date.now() })); } catch(e){}
  }
  function clearCode(){
    try { sessionStorage.removeItem(SKEY); } catch(e){}
    try { localStorage.removeItem(SKEY); } catch(e){}
  }

  /* ---------- initial state ---------- */
  var stored0 = storedCode();
  var applied = isValid(stored0) ? normalize(stored0) : CODE;
  var active = (q.promo === 'on') || isValid(stored0);
  /* ?code=<valid code> (2026-09-24): email links (VIP onboarding u1-u4) land with the credit
   * pre-applied. The link code wins over a previously stored code and is stored like a typed one. */
  if (isValid(q.code)) { applied = normalize(q.code); active = true; storeCode(applied); }
  if (q.promo === 'off') { active = false; clearCode(); applied = CODE; }

  var P = window.LLA_PROMO = {
    code: applied, vipCode: VIP_CODE, codes: CODES.slice(), active: active, deadline: DEADLINE,
    first: 149, n: 5, left: 596, total: 745, regular: 179, regularTotal: 895, list: 1395,
    remaining: remaining, isValid: isValid, activate: activate, deactivate: deactivate
  };

  /* ---------- CRM price override (only when activated) ---------- */
  function applyPrices(){
    var CFG = window.LLA_ECOMM_CONFIG = window.LLA_ECOMM_CONFIG || {};
    CFG.crmPrice = { firstPayment: 149, numberOfPayments: 5, leftToPay: 596 };
    CFG.crmPlans = { monthly: { firstPayment: 149, numberOfPayments: 5, leftToPay: 596 }, upfront: { firstPayment: 799, numberOfPayments: 1, leftToPay: 0 } };
  }

  /* ---------- text swaps ---------- */
  var MAP = [
    ['4 x $179.00','4 x $149.00'],['$179.00','$149.00'],['$179','$149'],
    ['$895.00','$745.00'],['$895','$745'],
    ['36% OFF','47% OFF'],['36% off','47% off'],['36%','47%'],
    ['you save $500','you save $650'],['You save $500','You save $650'],['save $500','save $650'],['Save $500','Save $650'],
    ['Total $799 USD, save $96','Total $799 USD, one payment'],[' · $96 vs monthly',''],[' &middot; $96 vs monthly',''],['You save $96','One payment']
  ];
  var SKIP = '[data-no-promo],script,style,#julie-promo,#vip-bonus,#emSum,.em-sum';
  function swapText(node){
    if (!node || node.nodeType !== 3) return;
    var p = node.parentNode; if (!p) return;
    if (p.closest && p.closest(SKIP)) return;
    var t = node.nodeValue, o = t;
    for (var i=0;i<MAP.length;i++){ if (t.indexOf(MAP[i][0])>-1) t = t.split(MAP[i][0]).join(MAP[i][1]); }
    if (t !== o) node.nodeValue = t;
  }
  function walk(root){
    if (!root) return;
    if (root.nodeType === 3) return swapText(root);
    if (root.nodeType !== 1) return;
    if (root.matches && root.matches(SKIP)) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); var n; var list=[];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(swapText);
  }

  /* ---------- countdown ---------- */
  function remaining(){ var d=Math.max(0,new Date(DEADLINE).getTime()-Date.now()); return {d:Math.floor(d/864e5),h:Math.floor(d%864e5/36e5),m:Math.floor(d%36e5/6e4)}; }
  /* Codes are valid through DEADLINE (Dec 31, 2026); after that isValid() is false and pricing reverts to $179. */
  function shortLeft(){ var r=remaining(); if(!r.d&&!r.h&&!r.m) return 'soon'; return r.d>0 ? r.d+'d '+r.h+'h' : r.h+'h '+r.m+'m'; }

  /* ---------- injected line ---------- */
  var LINE_CSS = 'font-family:Inter,sans-serif;margin:14px 0 0;padding:16px 18px;border-radius:12px;background:#F2F7FF;border:1px solid #CFE0FF;color:#0B1B33;line-height:1.4;text-align:left';
  function lineHTML(){
    return '<div class="lla-jp-line" data-no-promo style="'+LINE_CSS+'">'
      +'<div style="display:flex;align-items:baseline;gap:10px;margin:0 0 8px"><span style="font-family:Inter,sans-serif;font-size:40px;font-weight:800;line-height:1;color:#006EFF;letter-spacing:-.03em">$149</span><span style="font-family:Inter,sans-serif;font-size:17px;font-weight:700;color:#0B1B33">a month</span><s style="font-family:Inter,sans-serif;font-size:17px;color:#7A8699;margin-left:auto">$179</s></div>'
      +'<div style="font-family:Inter,sans-serif;font-size:15.5px;font-weight:500;color:#3B4A63;margin:0 0 4px">$30 off every month, 5 payments of $149, $745 in total. Masterclass attendee pricing. Seat confirmed by email.</div>'
      +'<div style="font-family:Inter,sans-serif;font-size:15.5px;font-weight:700;color:#067647;margin:0 0 4px">You save $249</div>'
      +(P.code === VIP_CODE ? '<div style="font-family:Inter,sans-serif;font-size:15px;font-weight:600;color:#006EFF">VIP Masterclass credit applied (code '+VIP_CODE+') &middot; valid until <span data-att-deadline>midnight ET tomorrow</span></div>' : '<div style="font-family:Inter,sans-serif;font-size:15px;font-weight:600;color:#006EFF">Valid until <b data-att-deadline>midnight ET tomorrow</b></div>')
      +'</div>';
  }
  function markPopupCard(){
    var pp = document.getElementById('pp'); if (!pp) return;
    var mp = pp.querySelector('.pp-card[data-pl="monthly"] .pp-price');
    if (mp && !mp.querySelector('s')) mp.insertAdjacentHTML('afterbegin','<s data-no-promo style="opacity:.55;font-weight:500;margin-right:8px">$179</s>');
  }
  function injectLines(){
    var pp = document.getElementById('pp');
    if (pp && pp.parentNode && !pp.parentNode.querySelector('.lla-jp-line')) {
      pp.insertAdjacentHTML('afterend', lineHTML());
      markPopupCard();
    }
    var ps = document.getElementById('planSummary');
    if (ps && ps.parentNode && !ps.parentNode.querySelector('.lla-jp-line')) ps.insertAdjacentHTML('afterend', lineHTML());
  }
  /* Payment page: retire any old-style heading that still reads "Julie's promo applied". */
  function fixOldHeadings(){
    if (!IS_CHECKOUT) return;
    var all = document.body ? document.body.querySelectorAll('h1,h2,h3,h4,p,div,span,b,strong') : [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.children.length) continue;
      if (el.closest && el.closest('.lla-jp-line,script,style')) continue;
      var t = (el.textContent || '').trim();
      if (/^Julie'?s promo applied\b/i.test(t)) el.textContent = 'Promo applied: $149 a month';
    }
  }
  function tick(){
    var r=remaining();
    document.querySelectorAll('[data-jp-d]').forEach(function(e){e.textContent=String(r.d).padStart(2,'0')});
    document.querySelectorAll('[data-jp-h]').forEach(function(e){e.textContent=String(r.h).padStart(2,'0')});
    document.querySelectorAll('[data-jp-m]').forEach(function(e){e.textContent=String(r.m).padStart(2,'0')});
    document.querySelectorAll('[data-jp-left]').forEach(function(e){e.textContent='December 31, 2026'}); /* fixed validity date, no live countdown */
  }

  /* Pricing card, floater and FAQ keep the regular frame: $179 x 5, 36% off.
   * The promo is applied only inside the enrollment popup and on the payment page. */
  var IS_CHECKOUT = /checkout/i.test(location.pathname) || !!document.getElementById('sumRow1V');
  function roots(){ if (IS_CHECKOUT) return [document.body]; return Array.prototype.slice.call(document.querySelectorAll('#emStep1,#emStep2,.em-screen,.em-modal')); }
  var pending=false;
  function run(){ pending=false; roots().forEach(walk); injectLines(); markPopupCard(); fixOldHeadings(); tick(); }
  function schedule(){ if(pending) return; pending=true; setTimeout(run,30); }

  var started = false, observer = null, timer = null;
  function start(){
    if (started) return; started = true;
    run();
    try {
      observer = new MutationObserver(function(muts){ for (var i=0;i<muts.length;i++){ if (muts[i].addedNodes.length || muts[i].type==='characterData'){ schedule(); break; } } });
      observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    } catch(e){}
    timer = setInterval(tick,30000);
    document.documentElement.classList.add('lla-promo-on');
  }

  /* ---------- public actions ---------- */
  function activate(code){
    if (isValid(code)) applied = normalize(code);
    else if (isValid(storedCode())) applied = normalize(storedCode());
    P.code = applied;
    storeCode(applied);
    applyPrices();
    P.active = active = true;
    document.documentElement.classList.add('lla-promo-on');
    if (started) { schedule(); return true; }
    if (document.readyState === 'loading') {
      if (!activate._bound) { activate._bound = true; document.addEventListener('DOMContentLoaded', start); }
    } else start();
    return true;
  }
  function deactivate(){
    clearCode();
    return true;
  }

  if (active) activate();
})();
