/* Approved 2026-10-27: $79 month 1, then four $169 payments.
 * New regular monthly plan: five $169 payments. Credit: $90.
 * CRM NumberOfPayments is normalized to four remaining payments by ecomm.js. */
(function(){
 'use strict';
 const CODES=['JULIE249','MASTERCLASS-VIP','BFRIDAY'],KEY='lla_promo_code';
 /* 26 Nov 2026: Black Friday. BFRIDAY is the auto-applied code until Nov 27 11:59 PM US Eastern. Same prices ($79, then 4 x $169). */
 const BF_END='2026-11-27T23:59:59-05:00';
 function bfOn(){return Date.now()<=Date.parse(BF_END);}
 const DEADLINE='2026-12-31T23:59:59-05:00';
 const q=new URLSearchParams(location.search);
 function normalize(v){return String(v||'').trim().toUpperCase();}

 function valid(v){v=normalize(v);if(v==='BFRIDAY'&&!bfOn())return false;return Date.now()<=Date.parse(DEADLINE)&&CODES.includes(v);}
 function stored(){try{const s=sessionStorage.getItem(KEY);if(s)return s;const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&Date.now()-Number(v.ts)<48*60*60*1000?v.code:''}catch{return ''}}
 function remember(v){try{sessionStorage.setItem(KEY,v);localStorage.setItem(KEY,JSON.stringify({code:v,ts:Date.now()}))}catch{}}
 const initial=valid(q.get('code'))?normalize(q.get('code')):bfOn()?(normalize(stored())==='MASTERCLASS-VIP'?'MASTERCLASS-VIP':'BFRIDAY'):valid(stored())&&normalize(stored())!=='BFRIDAY'?normalize(stored()):'JULIE249';
 const P=window.LLA_PROMO={
  code:initial,vipCode:CODES[1],codes:CODES.slice(),active:q.get('promo')!=='off'&&(valid(q.get('code'))||valid(stored())||q.get('promo')==='on'),
  deadline:DEADLINE,first:79,n:5,left:676,total:755,regular:169,regularTotal:845,list:845,monthly:169,credit:90,
  isValid:valid,remaining(){let d=Math.max(0,Date.parse(DEADLINE)-Date.now());return{d:Math.floor(d/864e5),h:Math.floor(d%864e5/36e5),m:Math.floor(d%36e5/6e4)}},
  activate(v){
   /* Black Friday: the page's automatic JULIE249 activation (nov-offer.js) becomes BFRIDAY; a JULIE249 link (?code=JULIE249) is kept. */
   if(bfOn()&&normalize(v)==='JULIE249'&&normalize(q.get('code'))!=='JULIE249')v='BFRIDAY';
   if(v!==undefined&&!valid(v))return false;
   if(valid(v))P.code=normalize(v);else if(valid(stored()))P.code=normalize(stored());
   P.active=true;remember(P.code);configure();notify();return true;
  },
  deactivate(){P.active=false;try{sessionStorage.removeItem(KEY);localStorage.removeItem(KEY)}catch{}configure();notify();return true;},
  configure
 };
 function configure(){
  const c=window.LLA_ECOMM_CONFIG=window.LLA_ECOMM_CONFIG||{};
  c.crmPrice={firstPayment:P.active?79:169,numberOfPayments:5,leftToPay:676};
  c.crmPlans={monthly:{...c.crmPrice},upfront:{firstPayment:799,numberOfPayments:1,leftToPay:0}};
 }
 function notify(){
  document.documentElement.classList.toggle('lla-promo-on',P.active);
  window.dispatchEvent(new Event('lla:pricing'));
 }
 configure();if(P.active)remember(P.code);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',notify);else notify();
})();
