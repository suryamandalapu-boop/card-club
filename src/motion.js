// Snapshot only visible DOM cards. Opponent hands never enter the animation layer.
const bounds=el=>el?.getBoundingClientRect();
const cards=(root,selector)=>new Map([...root.querySelectorAll(selector)].map(el=>[el.dataset.card||el.dataset.face,{rect:bounds(el),html:el.outerHTML,el}]));
export function captureTable(root){
  return {
    phase:root.querySelector('.playing-felt')?.dataset.phase,
    hand:cards(root,'.hand-cards [data-card]'),
    table:cards(root,'[data-discard] [data-face]'),
    stock:bounds(root.querySelector('[data-stock] .playing-card, [data-stock]')),
    players:new Map([...root.querySelectorAll('[data-player]')].map(el=>[el.dataset.player,{count:Number(el.dataset.count),rect:bounds(el.querySelector('.opponent-cards'))}])),
    scroll:root.querySelector('.hand-cards')?.scrollLeft||0
  };
}
function back(){return '<div class="playing-card back"><span>♣</span></div>';}
function fly(html,from,to,delay=0){
  if(!from||!to)return;
  const wrapper=document.createElement('div');
  wrapper.className='card-flight';wrapper.setAttribute('aria-hidden','true');wrapper.inert=true;
  wrapper.innerHTML=html;
  const card=wrapper.firstElementChild;
  card.classList.remove('selected','muted');card.removeAttribute('data-card');card.removeAttribute('data-face');card.removeAttribute('aria-pressed');card.tabIndex=-1;
  Object.assign(wrapper.style,{left:`${to.left}px`,top:`${to.top}px`,width:`${to.width}px`,height:`${to.height}px`});
  Object.assign(card.style,{width:'100%',height:'100%',margin:'0'});
  document.body.append(wrapper);
  const dx=from.left-to.left,dy=from.top-to.top;
  const animation=wrapper.animate([
    {transform:`translate(${dx}px,${dy}px) scale(${Math.max(.25,from.width/to.width)},${Math.max(.25,from.height/to.height)}) rotate(-9deg)`,opacity:.65},
    {transform:`translate(${dx*.35}px,${dy*.5-25}px) scale(1.04) rotate(5deg)`,opacity:1,offset:.55},
    {transform:'translate(0,0) scale(1) rotate(0)',opacity:1}
  ],{duration:420,delay,fill:'both',easing:'cubic-bezier(.22,.7,.25,1)'});
  animation.onfinish=()=>wrapper.remove();
  animation.oncancel=()=>wrapper.remove();
  setTimeout(()=>wrapper.remove(),delay+650);
}
function reveal(el,delay=0){
  el.animate([{opacity:0,offset:0},{opacity:0,offset:.85},{opacity:1,offset:1}],{duration:delay+420,easing:'ease-out'});
}
export function animateTable(root,before){
  const hand=root.querySelector('.hand-cards');
  if(hand)hand.scrollLeft=before.scroll;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.card-flight').forEach(el=>el.remove());return;}
  const after=captureTable(root);
  if(!after.phase){document.querySelectorAll('.card-flight').forEach(el=>el.remove());return;}
  const deal=after.phase==='playing'&&before.phase!=='playing';
  const stock=after.stock||bounds(root.querySelector('.table-middle'));
  const giver=[...before.players].find(([id,p])=>after.players.has(id)&&after.players.get(id).count<p.count)?.[1]?.rect;
  const panel=bounds(hand);
  let drawn=0;
  for(const [id,c]of after.hand){
    const previous=before.hand.get(id);
    if(deal||!previous){
      const delay=Math.min(drawn++,12)*(deal?55:45);
      // A sorted card may land beyond the horizontal hand viewport.
      const visible=panel&&c.rect.left>=panel.left&&c.rect.right<=panel.right;
      const destination=visible?c.rect:panel?{left:Math.max(panel.left,Math.min(panel.right-c.rect.width,c.rect.left)),top:panel.top+20,width:c.rect.width,height:c.rect.height}:c.rect;
      fly(c.html,!deal&&giver?giver:stock,destination,delay);
      if(visible)reveal(c.el,delay);
    }else{
      const dx=previous.rect.left-c.rect.left,dy=previous.rect.top-c.rect.top;
      if(Math.abs(dx)>1||Math.abs(dy)>1)c.el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:c.el.classList.contains('selected')?'translateY(-13px)':'none'}],{duration:260,easing:'ease-out'});
    }
  }
  for(const [id,c]of after.table){
    if(!deal&&before.table.has(id))continue;
    const played=before.hand.get(id);
    const origin=played?.rect||(!deal?giver:stock)||stock;
    fly(c.html,origin,c.rect);reveal(c.el);
  }
  const removed=[...before.hand].filter(([id])=>!after.hand.has(id));
  for(const [id,p]of after.players){
    const prev=before.players.get(id);
    const n=deal?Math.min(p.count,5):Math.max(0,p.count-(prev?.count||p.count));
    for(let i=0;i<Math.min(n,12);i++)fly(back(),!deal&&removed.length?removed[Math.min(i,removed.length-1)][1].rect:stock,{left:p.rect.left+p.rect.width/2-17,top:p.rect.top,width:34,height:48},i*55);
  }
}
