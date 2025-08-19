// Tabs
const tabs=document.querySelectorAll('.tab');
const contentEl=document.getElementById('content');

function loadTab(file){
  fetch(file).then(r=>r.text()).then(html=>{
    contentEl.innerHTML=html;
    attachBurstToButtons(contentEl);
  });
}
tabs.forEach(btn=>{
  btn.addEventListener('click',e=>{
    tabs.forEach(b=>b.classList.toggle('is-active',b===btn));
    loadTab(btn.dataset.tab);
    spawnStarBurstFromEl(e.currentTarget);
  });
});

// ===== Day/Night Sync =====
function setDayNight(){
  const h=new Date().getHours();
  if(h>=18||h<6){
    document.body.classList.add('night');
    spawnStars();
    randomMeteors();
    spawnPlanets();
  }else{
    document.body.classList.remove('night');
  }
}
setDayNight();
setInterval(setDayNight,60000);

// Spawn stars
function spawnStars(){
  for(let i=0;i<80;i++){
    const s=document.createElement('div');
    s.className='star';
    s.style.left=Math.random()*100+'%';
    s.style.top=Math.random()*100+'%';
    s.style.width=s.style.height=(Math.random()*2+1)+'px';
    s.style.animationDuration=(1+Math.random()*2)+'s';
    document.body.appendChild(s);
  }
}
// Meteors
function randomMeteors(){
  setInterval(()=>{
    if(Math.random()<0.2){
      const m=document.createElement('div');
      m.className='meteor';
      m.style.left=Math.random()*window.innerWidth+'px';
      m.style.top='-100px';
      document.body.appendChild(m);
      setTimeout(()=>m.remove(),1000);
    }
  },2000);
}
// Planets + astronaut
function spawnPlanets(){
  const j=document.createElement('div');j.className='planet jupiter';
  const s=document.createElement('div');s.className='planet saturn';
  const v=document.createElement('div');v.className='planet venus';
  const a=document.createElement('div');a.className='astro';
  document.body.append(j,s,v,a);
}

// ===== Burst Effect =====
let burstLock=0;
function spawnStarBurstFromEl(el){
  const now=performance.now();if(now<burstLock)return;burstLock=now+90;
  const rect=el.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  const rx=rect.width/2, ry=rect.height/2;
  const layer=document.createElement('div');layer.className='burst';document.body.appendChild(layer);
  const count=18+Math.floor(Math.random()*8);
  const frag=document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const ang=Math.random()*2*Math.PI;
    const ex=cx+Math.cos(ang)*rx*0.95, ey=cy+Math.sin(ang)*ry*0.95;
    const travel=80+Math.random()*140;
    const dx=Math.cos(ang)*travel, dy=Math.sin(ang)*travel;
    const star=document.createElement('span');
    star.className='burst-star'+(Math.random()<0.2?' big':(Math.random()<0.5?' tiny':''));
    star.style.left=ex+'px';star.style.top=ey+'px';
    star.style.setProperty('--dx',dx+'px');star.style.setProperty('--dy',dy+'px');
    star.style.setProperty('--rot',Math.random()*360+'deg');
    star.style.setProperty('--dur',(600+Math.random()*300)+'ms');
    frag.appendChild(star);
  }
  layer.appendChild(frag);setTimeout(()=>layer.remove(),1000);
}
function attachBurstToButtons(scope){
  (scope.querySelectorAll?.('.btn,.tab,.fab')||[]).forEach(el=>{
    if(el._burstBound)return;
    el.addEventListener('click',ev=>spawnStarBurstFromEl(ev.currentTarget));
    el._burstBound=true;
  });
}
attachBurstToButtons(document);
