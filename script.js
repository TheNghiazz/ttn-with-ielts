// ================== Helpers ==================
function $(sel, scope=document){ return scope.querySelector(sel); }
function $all(sel, scope=document){ return Array.from(scope.querySelectorAll(sel)); }
function normalizePath(p){ return (p || "").replace(/\\/g, "/"); }

// ================== Tabs ==================
const tabs = $all('.tab');
const contentEl = $('#content');
const indicator = $('.tab-indicator');

function setIndicator(btn){
  if(!btn || !indicator) return;
  const r = btn.getBoundingClientRect();
  const parentR = btn.parentElement.getBoundingClientRect();
  const w = r.width;
  const x = r.left - parentR.left;
  indicator.style.width = w + 'px';
  indicator.style.transform = `translateX(${x}px)`;
}

async function loadTab(file){
  const url = normalizePath(file);
  try{
    const r = await fetch(url);
    const html = await r.text();
    contentEl.innerHTML = html;
    attachBurstToButtons(contentEl);
    // after injecting html, wire up features conditionally
    setupTranslateUI();
    applyClockToInjected(); // keep profile's #clock in sync
  }catch(err){
    console.error('Load tab failed:', err);
    contentEl.innerHTML = `<div class="card">Không tải được nội dung tab: ${url}</div>`;
  }
}

tabs.forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    tabs.forEach(b=>b.classList.toggle('is-active', b===btn));
    setIndicator(btn);
    loadTab(btn.dataset.tab);
    spawnStarBurstFromEl(e.currentTarget);
  });
});

// on first paint, load the active tab
window.addEventListener('DOMContentLoaded', ()=>{
  const activeTab = document.querySelector('.tab.is-active') || tabs[0];
  if(activeTab){
    setIndicator(activeTab);
    loadTab(activeTab.getAttribute('data-tab'));
  }
  initDayNightCycle();
  initTimeSync();
  initFabToggles();
  attachBurstToButtons(document);
});

// ================== Day/Night by local device time + broadcast ==================
let isNight = false;
function computeNightByHour(h){
  return (h>=18 || h<6);
}
function applyNight(night){
  isNight = !!night;
  document.body.classList.toggle('night', isNight);
}

// sky anim (sun/moon positions)
function updateSkyByTime(t=new Date()){
  const h = t.getHours();
  const m = t.getMinutes();
  const dayProgress = (h + m/60) / 24;  // 0..1
  const sun = $('#sun'); const moon = $('#moon');
  if(sun){
    sun.style.left = (10 + dayProgress*80) + 'vw';
    sun.style.top  = (25 + Math.sin(dayProgress*Math.PI)*-18) + 'vh';
  }
  if(moon){
    moon.style.left = (80 - dayProgress*80) + 'vw';
    moon.style.top  = (20 + Math.sin((dayProgress+0.5)*Math.PI)*-12) + 'vh';
    moon.style.opacity = isNight ? 1 : 0;
  }
}

function initDayNightCycle(){
  const t = new Date();
  applyNight(computeNightByHour(t.getHours()));
  updateSkyByTime(t);
  setInterval(()=>{
    const now = new Date();
    applyNight(computeNightByHour(now.getHours()));
    updateSkyByTime(now);
  }, 60_000);
}

// ================== Time sync (local device) across tabs ==================
// - No external API
// - BroadcastChannel to keep #timeSync badge and any injected #clock up to date

const timeChan = ('BroadcastChannel' in window) ? new BroadcastChannel('ttn-time') : null;
let isLeader = document.visibilityState === 'visible';

function formatTime(d){
  const h = String(d.getHours()).padStart(2,'0');
  const m = String(d.getMinutes()).padStart(2,'0');
  const s = String(d.getSeconds()).padStart(2,'0');
  return `${h}:${m}:${s}`;
}

function setTimeBadge(text, status='ok'){
  const badge = $('#timeSync');
  if(!badge) return;
  badge.dataset.status = status;
  badge.textContent = text;
}

function applyClockToInjected(d=new Date()){
  // Update clock inside loaded tab (e.g., profile.html)
  const clk = $('#content #clock');
  if(clk) clk.textContent = formatTime(d);
}

function tickLocalClock(){
  const now = new Date();
  // Update own UI
  setTimeBadge(`Đồng bộ: ${formatTime(now)} (Local)`,'ok');
  applyClockToInjected(now);
  // Keep sky/day-night smooth
  applyNight(computeNightByHour(now.getHours()));
  updateSkyByTime(now);
  // Broadcast to other tabs
  if(timeChan && isLeader){
    timeChan.postMessage({ ts: now.getTime(), night: isNight });
  }
}

function initTimeSync(){
  // badge initial
  setTimeBadge('Đang đồng bộ…','ok');
  // drive the clock each second on the active tab
  setInterval(tickLocalClock, 1000);
  document.addEventListener('visibilitychange', ()=>{
    isLeader = (document.visibilityState === 'visible');
  });
  if(timeChan){
    timeChan.onmessage = (ev)=>{
      // Receive remote time ticks as a fallback if this tab is not the leader
      if(!ev?.data) return;
      const d = new Date(ev.data.ts || Date.now());
      applyNight(!!ev.data.night);
      applyClockToInjected(d);
      if(!isLeader){
        setTimeBadge(`Đồng bộ: ${formatTime(d)} (Sync)`, 'ok');
        updateSkyByTime(d);
      }
    };
  }
}

// ================== Translate: add working swap (Vi ⇄ En) ==================
function setupTranslateUI(){
  const fromLbl = $('#lblFrom', contentEl);
  const toLbl = $('#lblTo', contentEl);
  const src = $('#srcText', contentEl);
  const dst = $('#dstText', contentEl);
  const swapBtn = $('#swapBtn', contentEl);
  const translateBtn = $('#translateBtn', contentEl);
  const clearSrc = $('#clearSrc', contentEl);
  const copyDst = $('#copyDst', contentEl);
  const speakSrc = $('#speakSrc', contentEl);
  const speakDst = $('#speakDst', contentEl);
  const status = $('#tStatus', contentEl);
  const histList = $('#historyList', contentEl);
  const clearHist = $('#clearHistory', contentEl);

  if(!fromLbl || !toLbl || !src || !dst || !swapBtn) return; // not on translate tab

  let langFrom = (fromLbl.textContent.includes('Việt')) ? 'vi' : 'en';
  let langTo   = (langFrom === 'vi') ? 'en' : 'vi';

  function setLabels(){
    fromLbl.textContent = (langFrom === 'vi') ? 'Tiếng Việt' : 'English';
    toLbl.textContent   = (langTo   === 'vi') ? 'Tiếng Việt' : 'English';
    src.placeholder = (langFrom === 'vi') ? 'Nhập tiếng Việt...' : 'Enter English...';
    dst.placeholder = 'Bản dịch sẽ hiển thị ở đây...';
  }
  setLabels();

  if(swapBtn && !swapBtn._bound){
    swapBtn.addEventListener('click', ()=>{
      // swap languages
      [langFrom, langTo] = [langTo, langFrom];
      // swap text as well for convenience
      if(src && dst){ [src.value, dst.value] = [dst.value, src.value]; }
      setLabels();
      announce('Đã đổi chiều: ' + fromLbl.textContent + ' ⇄ ' + toLbl.textContent);
    });
    swapBtn._bound = true;
  }

  if(clearSrc && !clearSrc._bound){
    clearSrc.addEventListener('click', ()=>{ src.value=''; announce('Đã xoá'); });
    clearSrc._bound = true;
  }

  if(copyDst && !copyDst._bound){
    copyDst.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(dst.value||''); announce('Đã copy'); }
      catch(e){ announce('Không copy được'); }
    });
    copyDst._bound = true;
  }

  if(translateBtn && !translateBtn._bound){
    translateBtn.addEventListener('click', doTranslate);
    translateBtn._bound = true;
  }

  if(clearHist && !clearHist._bound){
    clearHist.addEventListener('click', ()=>{ if(histList) histList.innerHTML=''; });
    clearHist._bound = true;
  }

  if(speakSrc && !speakSrc._bound){
    speakSrc.addEventListener('click', ()=> ttsSpeak(src.value||'', langFrom));
    speakSrc._bound = true;
  }
  if(speakDst && !speakDst._bound){
    speakDst.addEventListener('click', ()=> ttsSpeak(dst.value||'', langTo));
    speakDst._bound = true;
  }

  async function doTranslate(){
    const q = (src.value||'').trim();
    if(!q){ announce('Nhập nội dung để dịch'); return; }
    announce('Đang dịch…');
    try{
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${langFrom}|${langTo}`;
      const r = await fetch(url);
      const data = await r.json();
      const text = data?.responseData?.translatedText || '';
      dst.value = text;
      addHistory(q, text, `${langFrom}→${langTo}`);
      announce('Hoàn tất');
    }catch(err){
      console.error(err);
      announce('Lỗi dịch');
    }
  }

  function addHistory(srcText, dstText, pair){
    if(!histList) return;
    const item = document.createElement('div');
    item.className = 'hist-item';
    item.innerHTML = `
      <div class="hist-top">
        <span class="badge-mini">${pair}</span>
        <div class="hist-actions">
          <button class="btn small btn-copy">Copy</button>
        </div>
      </div>
      <div class="hist-src">${srcText}</div>
      <div class="hist-dst"><strong>${dstText}</strong></div>
    `;
    item.querySelector('.btn-copy')?.addEventListener('click', ()=>{
      navigator.clipboard.writeText(dstText||'').then(()=>announce('Đã copy'));
    });
    histList.prepend(item);
  }

  function announce(msg){
    if(status){ status.textContent = msg; }
    setTimeout(()=>{ if(status) status.textContent=''; }, 1500);
  }
}

function ttsSpeak(text, lang='vi'){
  if(!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (lang === 'vi') ? 'vi-VN' : 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ================== Burst Effect (kept) ==================
let burstLock=0;
function spawnStarBurstFromEl(el){
  const now=performance.now(); if(now<burstLock) return; burstLock=now+90;
  const rect=el.getBoundingClientRect();
  const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  const rx=rect.width/2, ry=rect.height/2;
  const layer=document.createElement('div'); layer.className='burst'; document.body.appendChild(layer);
  const count=18+Math.floor(Math.random()*8);
  const frag=document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const ang=Math.random()*2*Math.PI;
    const ex=cx+Math.cos(ang)*rx*0.95, ey=cy+Math.sin(ang)*ry*0.95;
    const travel=80+Math.random()*140;
    const dx=Math.cos(ang)*travel, dy=Math.sin(ang)*travel;
    const star=document.createElement('span');
    star.className='burst-star'+(Math.random()<0.2?' big':(Math.random()<0.5?' tiny':''));
    star.style.left=ex+'px'; star.style.top=ey+'px';
    star.style.setProperty('--dx',dx+'px'); star.style.setProperty('--dy',dy+'px');
    star.style.setProperty('--rot',Math.random()*360+'deg');
    star.style.setProperty('--dur',(600+Math.random()*300)+'ms');
    frag.appendChild(star);
  }
  layer.appendChild(frag); setTimeout(()=>layer.remove(),1000);
}
function attachBurstToButtons(scope){
  ($all('.btn,.tab,.fab', scope) || []).forEach(el=>{
    if(el._burstBound) return;
    el.addEventListener('click',ev=>spawnStarBurstFromEl(ev.currentTarget));
    el._burstBound=true;
  });
}

// ================== FAB controls (optional) ==================
function initFabToggles(){
  const fabAnim = $('#fabAnim');
  const fabSquiggle = $('#fabSquiggle');
  if(fabAnim && !fabAnim._bound){
    fabAnim.addEventListener('click', ()=>{
      const pressed = fabAnim.getAttribute('aria-pressed') === 'true';
      fabAnim.setAttribute('aria-pressed', (!pressed).toString());
      document.body.classList.toggle('paused', !pressed);
    });
    fabAnim._bound = true;
  }
  if(fabSquiggle && !fabSquiggle._bound){
    fabSquiggle.addEventListener('click', ()=>{
      const pressed = fabSquiggle.getAttribute('aria-pressed') === 'true';
      fabSquiggle.setAttribute('aria-pressed', (!pressed).toString());
      // toggle svg filter usage by flipping a class on body (content can choose to use it)
      document.body.classList.toggle('no-squiggle', !pressed);
    });
    fabSquiggle._bound = true;
  }
}
