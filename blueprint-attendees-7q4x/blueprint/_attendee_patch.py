#!/usr/bin/env python3
"""Attendee tailoring of the cloned pages.dev funnel. Clone only; production untouched."""
import re, sys, pathlib
root = pathlib.Path('/home/user/workspace/site')
idx = (root/'index.html').read_text(encoding='utf-8')
chk = (root/'checkout.html').read_text(encoding='utf-8')
promo = (root/'assets'/'lla-promo.js').read_text(encoding='utf-8')
orig_len = len(idx)

def rep(s, old, new, count=None, label=''):
    n = s.count(old)
    if n == 0:
        print('!! NOT FOUND:', label or old[:70]); sys.exit(1)
    if count and n != count:
        print(f'!! count {n} != {count}:', label or old[:70]); sys.exit(1)
    return s.replace(old, new)

# ---------- head: noindex + title ----------
idx = rep(idx, '<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">', 1, 'head')
idx = re.sub(r'<title>.*?</title>', '<title>For Masterclass attendees: The Longevity Blueprint with your attendee pricing</title>', idx, count=1, flags=re.S)
chk = rep(chk, '<head>', '<head>\n<meta name="robots" content="noindex,nofollow,noarchive">', 1, 'head chk')
# absolute asset refs -> relative (GitHub Pages subpath)
idx = idx.replace('"/assets/', '"assets/'); chk = chk.replace('"/assets/', '"assets/')
# canonical / og url -> none (unlisted)
idx = re.sub(r'<link rel="canonical"[^>]*>', '', idx)

# ---------- hero copy ----------
idx = rep(idx,
 '<p class="hero-trust">4.6 on Trustpilot, 600+ reviews <i></i> 400,000+ students taught live since 2000 <i></i> As seen in AP News, Yahoo Finance, USA Today</p>\n    <h1 class="pdp-cine-h1',
 '<p class="hero-trust">For attendees of The Longevity Masterclass <i></i> Attendee pricing until <span data-att-deadline>midnight ET tomorrow</span> <i></i> 4.6 on Trustpilot, 600+ reviews</p>\n    <h1 class="pdp-cine-h1', 1, 'hero-trust')
idx = rep(idx,
 '<h1 class="pdp-cine-h1 pdp-cine-h1--v59 pdp-cine-h1--approved">Slow down your <span class="pdp-cine-blue">pace of aging.</span></h1>',
 '<h1 class="pdp-cine-h1 pdp-cine-h1--v59 pdp-cine-h1--approved">You saw the protocol. <span class="pdp-cine-blue">Now build yours.</span></h1>', 1, 'h1')
idx = rep(idx,
 '<p class="pdp-cine-sub pdp-cine-sub--approved"><strong>The longevity course</strong>, a guided protocol built around your biology, your numbers, and the daily practice that turns the next decades into your strongest.</p>',
 '<p class="pdp-cine-sub pdp-cine-sub--approved"><strong>The Longevity Blueprint</strong> is where Julie\u2019s masterclass continues: an 18-week live course, a guided protocol built around your biology, your numbers, and the daily practice that turns the next decades into your strongest.</p>', 1, 'sub')
idx = rep(idx,
 '<a href="checkout.html" class="pdp-cine-cta" data-fn-cta="hero">Reserve My Seat',
 '<a href="#attendee-code" class="pdp-cine-cta" data-fn-cta-skip="1">Apply My Attendee Code', 1, 'hero cta')

# ---------- attendee code section (after hero) ----------
ATT = r'''
<section id="attendee-code" class="att-code" aria-label="Your attendee pricing">
  <div class="container att-wrap">
    <div class="att-left">
      <p class="att-kicker">For attendees of The Longevity Masterclass with Julie Gibson Clark</p>
      <h2 class="att-h2">Your attendee pricing on the Longevity Blueprint</h2>
      <div class="att-price"><span class="att-big">$149</span><span class="att-unit">a month<br><s>$179</s></span></div>
      <p class="att-line">$30 off every monthly payment: five payments of $149, <b>$745 in total instead of $895</b>. Together with your masterclass with Julie, a $99 value, <b>you save $249</b>.</p>
      <p class="att-deadline">Valid until <b data-att-deadline>midnight ET tomorrow</b><span class="att-count" data-att-countdown></span></p>
    </div>
    <div class="att-box">
      <label class="att-label" for="attCodeInput">Enter the code Courtney shared in the chat</label>
      <div class="att-row">
        <input class="att-in" id="attCodeInput" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="Your code" aria-label="Promo code">
        <button class="att-btn" id="attApply" type="button">Apply and enroll</button>
      </div>
      <p class="att-msg" id="attMsg" role="status" aria-live="polite"></p>
      <p class="att-vip">VIP guests: your code arrives by email after the Q&amp;A. It works here too.</p>
      <ul class="att-fine">
        <li>Self-service checkout, two minutes, card or PayPal.</li>
        <li>14-day full refund from your first class.</li>
        <li>Questions first? Call <a href="tel:+18882305110">+1-888-230-5110</a> or <a href="#ask">leave your question</a> below.</li>
      </ul>
      <a id="attGo" class="att-go" href="checkout.html?plan=monthly" data-fn-cta="attendee-code" data-plan="monthly" hidden>Continue to checkout</a>
    </div>
  </div>
</section>
'''
# insert right after hero section close
m = re.search(r'<section[^>]*id="hero".*?</section>', idx, flags=re.S)
idx = idx[:m.end()] + ATT + idx[m.end():]

# ---------- replace VIP section with continuation ----------
CONT = r'''<section id="continuation" class="att-cont" aria-label="From the masterclass to the Blueprint">
  <div class="container">
    <div class="att-cont-grid">
      <figure class="att-cont-media">
        <video class="att-cont-video" src="assets/julie-wide.mp4" poster="assets/julie-poster.jpg" controls playsinline preload="none"></video>
        <figcaption>Julie Gibson Clark, Founding Faculty, Longevity Life Academy</figcaption>
      </figure>
      <div class="att-cont-text">
        <p class="att-kicker light">The continuation of your masterclass</p>
        <h2 class="att-h2 light">From 60 minutes with Julie to your own 18‑week protocol</h2>
        <p>Julie Gibson Clark was ranked the 2nd slowest-aging woman on earth in the Rejuvenation Olympics. She reached that at about $100 a month, with sleep, nutrition, strength and a routine she follows daily. Tonight she showed you the protocol. The Longevity Blueprint is where you build yours: your biology, your numbers, your plan, with a certified longevity instructor and a small group that meets live every week for 18 weeks.</p>
        <p>What you heard in the masterclass, and where the course takes it:</p>
      </div>
    </div>
    <div class="att-map">
      <div class="att-map-card"><span class="att-map-from">Framing</span><span class="att-map-to">Session 1 · Reframing Aging: From Disease Avoidance to Healthspan Design</span></div>
      <div class="att-map-card"><span class="att-map-from">Myths and inputs</span><span class="att-map-to">Session 2 · The Longevity Lens and Baseline Self-Assessment<br>Session 6 · Nutrition Framework: Inputs vs Responses</span></div>
      <div class="att-map-card"><span class="att-map-from">Sleep and food</span><span class="att-map-to">Session 7 · Plate Architecture: Protein, Fiber, Processing<br>Session 8 · Fasting &amp; Meal Timing for Longevity<br>Session 11 · Sleep, Circadian Rhythm &amp; Overnight Glucose</span></div>
      <div class="att-map-card"><span class="att-map-from">Movement, with demo</span><span class="att-map-to">Session 10 · Movement as a Glucose Tool<br>Session 13 · Cardiovascular Longevity: Cardio Fitness, Cholesterol &amp; the #1 Killer</span></div>
      <div class="att-map-card"><span class="att-map-from">Daily routine walkthrough</span><span class="att-map-to">Session 14 · Blood Testing &amp; Reading Your Numbers<br>Session 15 · Supplements, Tests &amp; Health Tech Literacy</span></div>
      <div class="att-map-card"><span class="att-map-from">Recap and bridge</span><span class="att-map-to">Session 17 · Personal Longevity Blueprint<br>Session 18 · Reflection, Integration &amp; the Next 90 Days</span></div>
    </div>
    <p class="att-cont-foot">All 18 sessions are listed below in the full syllabus.</p>
  </div>
</section>'''
m = re.search(r'<section[^>]*id="vip".*?</section>', idx, flags=re.S)
assert m, 'vip section'
idx = idx[:m.start()] + CONT + idx[m.end():]
idx = idx.replace('href="#vip"', 'href="#continuation"')

# ---------- included item 04 + bullet ----------
idx = rep(idx,
 "<h3>Julie Gibson Clark's live Masterclass</h3><p>A live session with the 2nd slowest-aging woman on earth. Free for Blueprint students.</p><b>$99 value, included</b>",
 "<h3>Julie Gibson Clark's Masterclass</h3><p>You attended it. Julie is Founding Faculty here, and the Blueprint is where her masterclass continues, with a certified instructor and your own cohort.</p><b>$99 value, counted in your price</b>", 1, 'incl card')
idx = rep(idx,
 "<span><b>Julie Gibson Clark's live Masterclass.</b> A $99 value, free for students.</span>",
 "<span><b>Julie Gibson Clark's Masterclass.</b> You attended it; a $99 value, counted in your attendee price.</span>", None, 'incl bullet')

# ---------- offer section promo aside ----------
idx = rep(idx, "<b>Julie's code, ending soon</b>", "<b>Your attendee code</b>", 1, 'offer aside b')
idx = rep(idx,
 "<span>$149 a month instead of $179. Her VIP Masterclass ($99 value) included.</span>",
 "<span>$149 a month instead of $179, five payments, $745 instead of $895. Valid until <span data-att-deadline>midnight ET tomorrow</span>.</span>", 1, 'offer aside span')
idx = rep(idx, '<span class="lp-julie-code">JULIE249</span>', '<a class="lp-julie-code" href="#attendee-code">Enter your code</a>', 1, 'offer code chip')

# ---------- modal / mock promo copy (text only) ----------
idx = rep(idx, "Julie\\u2019s promo: <b>$149 a month</b> instead of <span data-no-promo>$179</span>, her VIP Masterclass included. <b>You save $249</b>",
                "Attendee pricing: <b>$149 a month</b> instead of <span data-no-promo>$179</span>, five payments. <b>You save $249</b>", 1, 'mock lb1')
idx = rep(idx, "<span><b>$149</b>/mo + VIP seat</span>", "<span><b>$149</b>/mo, $745 total</span>", None, 'mock sm')
idx = rep(idx, "Julie\\u2019s promo: save $249", "Attendee pricing: save $249", None, 'mock t')
idx = rep(idx, ", and Julie\\u2019s <b>VIP Masterclass in October or November</b> ($99 value) included.</span>",
                ". Your masterclass with Julie, a $99 value, counted in.</span>", None, 'mock d1')
idx = rep(idx, ", and Julie\\u2019s <b>VIP Masterclass in October or November</b> ($99 value) included. Enter the code:</span>",
                ". Your masterclass with Julie, a $99 value, counted in. Enter the code from the chat:</span>", None, 'mock d2')
idx = rep(idx, "Apply Julie\\u2019s code", "Apply my code", None, 'apply btn')
idx = rep(idx, "Julie\\u2019s promo: VIP Masterclass included", "Masterclass attendee pricing", None, 'promo title')
idx = rep(idx, "<span>Julie\\u2019s VIP Masterclass<small>90 minutes live with Julie, October or November, seat confirmed by email</small></span><b>$99</b>",
                "<span>Your masterclass with Julie<small>Attended live. A $99 value, counted toward your course.</small></span><b>$99</b>", None, 'row vip')
idx = rep(idx, ", plus Julie\\u2019s <b>VIP Masterclass</b>, 90 minutes live in October or November, $99 value, included.</p>", ", five payments, $745 in total.</p>", None, 'dead popup line')
import re as _re
_i=idx.find('October or November'); print('STALE at', _i, repr(idx[_i-200:_i+60]))
assert 'October or November' not in idx, 'stale October or November copy remains'

# ---------- FAQ cost ----------
idx = rep(idx,
 "Tuition is $179 per month for five months. It includes",
 "With your masterclass attendee code, tuition is $149 per month for five months, $745 in total. Without the code it is $179 per month for five months. It includes", None, 'faq cost')

# ---------- questions section before FAQ ----------
ASK = r'''
<section id="ask" class="att-ask" aria-label="A question Julie did not get to">
  <div class="container att-ask-wrap">
    <div class="att-ask-text">
      <p class="att-kicker">Didn’t get your question answered?</p>
      <h2 class="att-h2">A question Julie didn’t get to? Leave it here.</h2>
      <p>Write the question you wanted to ask in the masterclass. We’ll call you back, answer it as best we can, and talk through whether the Blueprint is the right next step for you. No pressure, a real conversation.</p>
      <p class="att-ask-alt">Prefer to text? <a href="https://wa.me/12015023701?text=Hi%2C%20I%20attended%20Julie%27s%20Longevity%20Masterclass%20and%20have%20a%20question%3A%20" target="_blank" rel="noopener">Message us on WhatsApp</a> or call <a href="tel:+18882305110">+1-888-230-5110</a>.</p>
    </div>
    <form class="att-form" id="attAskForm" novalidate>
      <div class="att-form-row two">
        <label>First name<input name="firstName" type="text" autocomplete="given-name" required></label>
        <label>Last name<input name="lastName" type="text" autocomplete="family-name" required></label>
      </div>
      <div class="att-form-row two">
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label>Mobile (US)<input name="phone" type="tel" autocomplete="tel" placeholder="(201) 555-0123" required></label>
      </div>
      <label>Your question for Julie or the LLA team<textarea name="question" rows="4" maxlength="1500" required placeholder="What did you want to ask?"></textarea></label>
      <input type="text" name="website" class="att-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="att-btn att-btn-wide" type="submit" id="attAskBtn">Send my question</button>
      <p class="att-msg" id="attAskMsg" role="status" aria-live="polite"></p>
      <p class="att-privacy">We use your details only to answer your question and call you back. <a href="privacy.html">Privacy</a>.</p>
    </form>
  </div>
</section>
'''
m = re.search(r'<section[^>]*id="faq"', idx)
idx = idx[:m.start()] + ASK + idx[m.start():]

# ---------- styles + behaviour ----------
CSS_JS = r'''
<style id="lla-attendee-css">
html body .att-kicker{font:600 12px/1.4 'Inter',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#006EFF;margin:0 0 12px}
html body .att-kicker.light{color:#7DE5FF}
html body .att-h2{font-family:'Playfair Display','Instrument Serif',Georgia,serif;font-weight:500;font-size:clamp(30px,4vw,46px);line-height:1.08;letter-spacing:-.015em;color:#0B1B33;margin:0 0 18px}
html body .att-h2.light{color:#fff}
html body .att-code{background:linear-gradient(180deg,#F3F6FB 0%,#fff 100%);padding:clamp(44px,6vw,80px) 0;border-top:1px solid rgba(10,34,64,.08)}
html body .att-wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:clamp(28px,4vw,64px);align-items:center}
html body .att-price{display:flex;align-items:flex-end;gap:14px;margin:6px 0 14px}
html body .att-big{font-family:'Playfair Display',Georgia,serif;font-size:clamp(64px,8vw,104px);line-height:.9;color:#0B1B33;letter-spacing:-.03em}
html body .att-unit{font:500 18px/1.25 'Inter',sans-serif;color:#0B1B33;padding-bottom:10px}
html body .att-unit s{color:#8892A0;font-weight:400}
html body .att-line{font:400 18px/1.55 'Inter',sans-serif;color:#2b3a52;margin:0 0 14px;max-width:560px}
html body .att-line b{color:#0B1B33;font-weight:700}
html body .att-deadline{font:500 16px/1.5 'Inter',sans-serif;color:#0B1B33;margin:0}
html body .att-deadline b{color:#0051CC}
html body .att-count{display:inline-block;margin-left:10px;color:#8892A0;font-weight:500}
html body .att-box{background:#fff;border-radius:22px;padding:clamp(22px,3vw,34px);box-shadow:0 1px 0 rgba(255,255,255,.7) inset,0 30px 70px -34px rgba(10,34,64,.4),0 2px 8px -2px rgba(10,34,64,.08);border:1px solid rgba(10,34,64,.08)}
html body .att-label{display:block;font:600 15px/1.4 'Inter',sans-serif;color:#0B1B33;margin:0 0 10px}
html body .att-row{display:flex;gap:10px}
html body .att-in{flex:1;min-width:0;height:56px;border:1.5px solid rgba(10,34,64,.18);border-radius:14px;padding:0 16px;font:600 18px/1 'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#0B1B33;background:#fff;outline:none}
html body .att-in:focus{border-color:#006EFF;box-shadow:0 0 0 4px rgba(0,110,255,.14)}
html body .att-in.ok{border-color:#1a9a5a;background:#f2fbf6}
html body .att-btn{height:56px;padding:0 22px;border:0;border-radius:14px;background:#006EFF;color:#fff;font:700 16px/1 'Inter',sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 18px 44px -14px rgba(0,110,255,.7);transition:transform .2s,background .2s}
html body .att-btn:hover{background:#0051CC;transform:translateY(-1px)}
html body .att-btn-wide{width:100%;margin-top:6px}
html body .att-msg{min-height:22px;font:500 15px/1.45 'Inter',sans-serif;color:#1a9a5a;margin:10px 0 0}
html body .att-msg.err{color:#c0392b}
html body .att-vip{font:400 14px/1.5 'Inter',sans-serif;color:#2b3a52;margin:12px 0 0;padding-top:12px;border-top:1px solid rgba(10,34,64,.08)}
html body .att-fine{list-style:none;padding:0;margin:12px 0 0;font:400 14px/1.6 'Inter',sans-serif;color:#5b6778}
html body .att-fine li{padding-left:18px;position:relative}
html body .att-fine li::before{content:'';position:absolute;left:0;top:9px;width:8px;height:8px;border-radius:50%;background:#006EFF}
html body .att-fine a{color:#0051CC;text-decoration:underline}
html body .att-go[hidden]{display:none}
html body .att-cont{padding:clamp(48px,6vw,90px) 0;background:radial-gradient(120% 80% at 80% 0%,#0A2240 0%,#061633 55%,#040D24 100%);color:#e8f1ff}
html body .att-cont-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(28px,4vw,64px);align-items:center;margin-bottom:clamp(28px,4vw,48px)}
html body .att-cont-media{margin:0}
html body .att-cont-video{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:22px;background:#061633;box-shadow:0 1px 0 rgba(255,255,255,.14) inset,0 40px 90px -40px rgba(0,0,0,.8),0 0 0 1px rgba(125,229,255,.12)}
html body .att-cont-media figcaption{font:500 13px/1.4 'Inter',sans-serif;color:#8ea0bd;margin-top:10px}
html body .att-cont-text p{font:400 17px/1.6 'Inter',sans-serif;color:#c8d3e3;margin:0 0 14px}
html body .att-map{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
html body .att-map-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:10px}
html body .att-map-from{font:700 15px/1.3 'Inter',sans-serif;color:#7DE5FF}
html body .att-map-from::after{content:'  →';color:#5b6f90;font-weight:400}
html body .att-map-to{font:400 14px/1.55 'Inter',sans-serif;color:#e8f1ff}
html body .att-cont-foot{font:500 14px/1.5 'Inter',sans-serif;color:#8ea0bd;margin:18px 0 0;text-align:center}
html body .att-ask{background:#F3F6FB;padding:clamp(44px,6vw,80px) 0;border-top:1px solid rgba(10,34,64,.08)}
html body .att-ask-wrap{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,4vw,64px);align-items:start}
html body .att-ask-text p{font:400 17px/1.6 'Inter',sans-serif;color:#2b3a52;margin:0 0 14px}
html body .att-ask-alt a{color:#0051CC;text-decoration:underline;font-weight:600}
html body .att-form{background:#fff;border-radius:22px;padding:clamp(22px,3vw,32px);border:1px solid rgba(10,34,64,.08);box-shadow:0 30px 70px -34px rgba(10,34,64,.3)}
html body .att-form label{display:block;font:600 13px/1.4 'Inter',sans-serif;color:#0B1B33;margin:0 0 12px}
html body .att-form input,html body .att-form textarea{display:block;width:100%;margin-top:6px;border:1.5px solid rgba(10,34,64,.18);border-radius:12px;padding:12px 14px;font:400 16px/1.4 'Inter',sans-serif;color:#0B1B33;background:#fff;outline:none;box-sizing:border-box}
html body .att-form textarea{resize:vertical;min-height:110px}
html body .att-form input:focus,html body .att-form textarea:focus{border-color:#006EFF;box-shadow:0 0 0 4px rgba(0,110,255,.14)}
html body .att-form-row.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
html body .att-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0}
html body .att-privacy{font:400 12px/1.5 'Inter',sans-serif;color:#8892A0;margin:10px 0 0}
html body .att-privacy a{color:#5b6778;text-decoration:underline}
@media (max-width:860px){
  html body .att-wrap,html body .att-cont-grid,html body .att-ask-wrap{grid-template-columns:1fr}
  html body .att-map{grid-template-columns:1fr}
  html body .att-row{flex-direction:column}
  html body .att-btn{width:100%}
  html body .att-form-row.two{grid-template-columns:1fr}
  html body .att-big{font-size:72px}
}
</style>
<script id="lla-attendee-js">
(function(){
  /* Attendee deadline: midnight ET the day after each masterclass session. The promo contract itself stays as configured in lla-promo.js. */
  var DEADLINES=[
    {until:Date.UTC(2026,9,29,3,59,59), label:'midnight ET, Wednesday, October 28'},   /* Session 1: Tue Oct 27, 7 PM ET (EDT, UTC-4) */
    {until:Date.UTC(2026,10,16,4,59,59), label:'midnight ET, Sunday, November 15'}     /* Session 2: Sat Nov 14, 1 PM ET (EST, UTC-5) */
  ];
  function current(){ var now=Date.now(); for(var i=0;i<DEADLINES.length;i++){ if(now<=DEADLINES[i].until) return DEADLINES[i]; } return null; }
  function paintDeadline(){
    var d=current(); var els=document.querySelectorAll('[data-att-deadline]');
    for(var i=0;i<els.length;i++){ els[i].textContent = d ? d.label : 'the attendee window closes; call us for current pricing'; }
    var c=document.querySelector('[data-att-countdown]');
    if(c){ if(!d){c.textContent='';return;} var ms=d.until-Date.now(); if(ms<0){c.textContent='';return;}
      var h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4); c.textContent = h>=48 ? '' : ('· '+h+'h '+String(m).padStart(2,'0')+'m left'); }
  }
  paintDeadline(); setInterval(paintDeadline, 30000);

  /* Code box */
  var inp=document.getElementById('attCodeInput'), btn=document.getElementById('attApply'), msg=document.getElementById('attMsg'), go=document.getElementById('attGo');
  function P(){ return window.LLA_PROMO||null; }
  function setMsg(t,err){ if(!msg) return; msg.textContent=t; msg.className='att-msg'+(err?' err':''); }
  function reflect(){ var p=P(); if(p&&p.active&&p.code&&inp){ inp.value=p.code; inp.classList.add('ok'); setMsg('Code '+p.code+' applied: $149 a month, five payments, $745 in total.'); if(btn) btn.textContent='Continue to checkout'; } }
  function apply(){
    var p=P(); if(!inp) return; var code=(inp.value||'').trim().toUpperCase().replace(/\s+/g,'');
    if(!code){ setMsg('Type the code from the chat, or the one in your VIP email.', true); inp.focus(); return; }
    if(!p||!p.isValid||!p.isValid(code)){ setMsg('That code isn\u2019t valid. Use the code Courtney shared in the Zoom chat, or the one in your VIP email.', true); inp.classList.remove('ok'); return; }
    try{ p.activate(code); }catch(e){}
    try{ var u=new URL(location.href); u.searchParams.set('code',code); history.replaceState(null,'',u.toString()); }catch(e){}
    inp.classList.add('ok'); setMsg('Code '+code+' applied: $149 a month, five payments, $745 in total.');
    if(btn) btn.textContent='Continue to checkout';
    if(go){ if(window.__llaOpenEnroll) window.__llaOpenEnroll(go); else go.click(); }
  }
  if(btn) btn.addEventListener('click', apply);
  if(inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); apply(); } });
  setTimeout(reflect, 300); setTimeout(reflect, 1200);

  /* Questions form -> proven website lead path (CRM AddNewLead via proxy). Staging when ?env=staging. */
  var f=document.getElementById('attAskForm');
  if(f){
    var env=(new URLSearchParams(location.search).get('env')||'production').toLowerCase(); if(env!=='staging') env='production';
    var WORKER='https://eteacher-leads-proxy.gitter-omri.workers.dev';
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var fd=new FormData(f), out=document.getElementById('attAskMsg'), b=document.getElementById('attAskBtn');
      function say(t,err){ out.textContent=t; out.className='att-msg'+(err?' err':''); }
      if(fd.get('website')){ say('Sent.'); return; }
      var first=(fd.get('firstName')||'').trim(), last=(fd.get('lastName')||'').trim(), email=(fd.get('email')||'').trim(), phone=(fd.get('phone')||'').trim(), q=(fd.get('question')||'').trim();
      if(!first||!last||!email||!phone||!q){ say('Please fill in every field so we can call you back.', true); return; }
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ say('Please check your email address.', true); return; }
      var v = (window.LLA_US&&window.LLA_US.validatePhone) ? window.LLA_US.validatePhone(phone) : null;
      var e164 = v&&v.ok ? v.e164 : null;
      if(!e164){ var d=phone.replace(/\D/g,''); if(d.length===10) e164='+1'+d; else if(d.length===11&&d[0]==='1') e164='+'+d; }
      if(!e164){ say('Please enter a US mobile number, or message us on WhatsApp with your question.', true); return; }
      var notes='MASTERCLASS ATTENDEE QUESTION (Julie Gibson Clark masterclass). Please call back and answer: '+q;
      var payload={ ProductID:26, FirstName:first, LastName:last, Email:email, MobilePhone:e164, CountryIsoCode:'US', CountryIsoCodeByIp:'US',
        LandingPage:location.href.split('#')[0], UserAgent:navigator.userAgent, ReferringSite:document.referrer||'', QueryString:(location.search||'').replace(/^\?/,'')+(location.search?'&':'')+'cid=116641&src=masterclass-attendees',
        AdminNotes: notes.slice(0,4000) };
      b.disabled=true; b.textContent='Sending\u2026'; say('');
      fetch(WORKER+'/leads/'+env,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){ return r.text().then(function(t){ return {ok:r.ok,status:r.status,text:t}; }); })
        .then(function(r){
          if(r.ok){ say('Got it. We\u2019ll call you back and answer your question.'); f.reset(); b.textContent='Sent'; }
          else { b.disabled=false; b.textContent='Send my question'; say('That didn\u2019t go through. Please try again, or message us on WhatsApp.', true); }
        }).catch(function(){ b.disabled=false; b.textContent='Send my question'; say('That didn\u2019t go through. Please try again, or message us on WhatsApp.', true); });
    });
  }
})();
</script>
</body>'''
idx = rep(idx, '</body>', CSS_JS, 1, 'body end')

# ---------- lla-promo.js copy (clone only) ----------
promo = rep(promo, "$30 off every month, 5 payments of $149. Julie\\'s VIP Masterclass, 90 minutes live on Zoom in October or November ($99 value), is included. Seat confirmed by email.",
                   "$30 off every month, 5 payments of $149, $745 in total. Masterclass attendee pricing. Seat confirmed by email.", 1, 'promo line')
promo = promo.replace("&middot; valid until December 31, 2026", "&middot; valid until <span data-att-deadline>midnight ET tomorrow</span>")
promo = promo.replace("Valid until December 31, 2026", "Valid until <span data-att-deadline>midnight ET tomorrow</span>")
promo = rep(promo, "Valid until <b data-jp-left>December 31, 2026</b>", "Valid until <b data-att-deadline>midnight ET tomorrow</b>", None, 'promo until b')
idx = rep(idx, "Valid until December 31, 2026", "Valid until <span data-att-deadline>midnight ET tomorrow</span>", None, 'idx until')
assert 'October or November' not in promo

(root/'index.html').write_text(idx, encoding='utf-8')
(root/'checkout.html').write_text(chk, encoding='utf-8')
(root/'assets'/'lla-promo.js').write_text(promo, encoding='utf-8')
(root/'robots.txt').write_text('User-agent: *\nDisallow: /\n', encoding='utf-8')
print('OK', orig_len, '->', len(idx))
