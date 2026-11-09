/* Approved 2026-10-27: $79 month 1, then four $169 payments.
 * New regular monthly plan: five $169 payments. Credit: $90.
 * CRM NumberOfPayments is normalized to four remaining payments by ecomm.js. */
(function(){
 'use strict';
 const CODES=['JULIE249','MASTERCLASS-VIP'],KEY='lla_promo_code';
 const DEADLINE='2026-12-31T23:59:59-05:00';
 const q=new URLSearchParams(location.search);
 function normalize(v){return String(v||'').trim().toUpperCase();}

 function sha256(a){function r(x,n){return(x>>>n)|(x<<(32-n))}var K=[],H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];for(var i=0,n=2;K.length<64;n++){for(var p=1,j=2;j*j<=n;j++)if(n%j===0){p=0;break}if(p)K.push((Math.pow(n,1/3)%1*4294967296)|0)}var b=unescape(encodeURIComponent(a)),l=b.length*8,w=[];for(var i=0;i<b.length;i++)w[i>>2]|=b.charCodeAt(i)<<(24-8*(i%4));w[l>>5]|=128<<(24-l%32);w[((l+64>>9)<<4)+15]=l;for(var i=0;i<w.length;i+=16){var W=[],a0=H[0],b0=H[1],c0=H[2],d0=H[3],e0=H[4],f0=H[5],g0=H[6],h0=H[7];for(var t=0;t<64;t++){if(t<16)W[t]=w[i+t]|0;else{var s0=r(W[t-15],7)^r(W[t-15],18)^(W[t-15]>>>3),s1=r(W[t-2],17)^r(W[t-2],19)^(W[t-2]>>>10);W[t]=(W[t-16]+s0+W[t-7]+s1)|0}var S1=r(e0,6)^r(e0,11)^r(e0,25),ch=(e0&f0)^(~e0&g0),t1=(h0+S1+ch+K[t]+W[t])|0,S0=r(a0,2)^r(a0,13)^r(a0,22),mj=(a0&b0)^(a0&c0)^(b0&c0),t2=(S0+mj)|0;h0=g0;g0=f0;f0=e0;e0=(d0+t1)|0;d0=c0;c0=b0;b0=a0;a0=(t1+t2)|0}H[0]=(H[0]+a0)|0;H[1]=(H[1]+b0)|0;H[2]=(H[2]+c0)|0;H[3]=(H[3]+d0)|0;H[4]=(H[4]+e0)|0;H[5]=(H[5]+f0)|0;H[6]=(H[6]+g0)|0;H[7]=(H[7]+h0)|0}return H.map(function(x){return('00000000'+(x>>>0).toString(16)).slice(-8)}).join('')}
 const INTERNAL_HASH='f757482be6092cc655a513d22b7aef129eee86566eda8968fd9f482d36cac3a5',INTERNAL_UNTIL='2026-11-09T23:59:59+02:00';
 function internal(v){try{return !!v&&Date.now()<=Date.parse(INTERNAL_UNTIL)&&sha256(normalize(v))===INTERNAL_HASH}catch(e){return false}}
 function valid(v){return internal(v)||(Date.now()<=Date.parse(DEADLINE)&&CODES.includes(normalize(v)));}
 function stored(){try{const s=sessionStorage.getItem(KEY);if(s)return s;const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&Date.now()-Number(v.ts)<48*60*60*1000?v.code:''}catch{return ''}}
 function remember(v){try{sessionStorage.setItem(KEY,v);localStorage.setItem(KEY,JSON.stringify({code:v,ts:Date.now()}))}catch{}}
 const initial=valid(q.get('code'))?normalize(q.get('code')):valid(stored())?normalize(stored()):'JULIE249';
 const P=window.LLA_PROMO={
  code:initial,vipCode:CODES[1],codes:CODES.slice(),active:q.get('promo')!=='off'&&(valid(q.get('code'))||valid(stored())||q.get('promo')==='on'),
  deadline:DEADLINE,first:79,n:5,left:676,total:755,regular:169,regularTotal:845,list:845,monthly:169,credit:90,
  isValid:valid,remaining(){let d=Math.max(0,Date.parse(DEADLINE)-Date.now());return{d:Math.floor(d/864e5),h:Math.floor(d%864e5/36e5),m:Math.floor(d%36e5/6e4)}},
  activate(v){
   if(v!==undefined&&!valid(v))return false;
   if(valid(v))P.code=normalize(v);else if(valid(stored()))P.code=normalize(stored());
   P.active=true;remember(P.code);configure();notify();return true;
  },
  deactivate(){P.active=false;try{sessionStorage.removeItem(KEY);localStorage.removeItem(KEY)}catch{}configure();notify();return true;},
  configure
 };
 function configure(){
  const c=window.LLA_ECOMM_CONFIG=window.LLA_ECOMM_CONFIG||{};
  c.crmPrice={firstPayment:P.active?(internal(P.code)?1:79):169,numberOfPayments:5,leftToPay:676};P.first=P.active&&internal(P.code)?1:79;P.total=P.first+676;
  c.crmPlans={monthly:{...c.crmPrice},upfront:{firstPayment:799,numberOfPayments:1,leftToPay:0}};
 }
 function notify(){
  document.documentElement.classList.toggle('lla-promo-on',P.active);
  window.dispatchEvent(new Event('lla:pricing'));
 }
 configure();if(P.active)remember(P.code);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',notify);else notify();
})();
