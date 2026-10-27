document.querySelectorAll('[data-phase]').forEach(button=>{
 button.addEventListener('click',()=>{
  document.querySelectorAll('[data-phase]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  document.querySelectorAll('.phase-panel').forEach(panel=>panel.hidden=panel.id!=='phase-'+button.dataset.phase);
 });
 button.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
  event.preventDefault();
  const buttons=[...document.querySelectorAll('[data-phase]')],index=buttons.indexOf(button);
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
  buttons[next].click();buttons[next].focus();
 });
});
document.querySelectorAll('.pillar-visual video').forEach(video=>{
 const fallback=document.createElement('img');
 fallback.src=video.poster;fallback.alt='';fallback.setAttribute('aria-hidden','true');video.before(fallback);
 video.addEventListener('playing',()=>video.parentElement.classList.add('has-frame'));
 video.addEventListener('error',()=>video.parentElement.classList.remove('has-frame'));
});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  const video=entry.target;
  if(entry.isIntersecting){video.play().catch(()=>{});}else video.pause();
 }),{threshold:.25});
 document.querySelectorAll('.pillar-visual video').forEach(video=>observer.observe(video));
}
