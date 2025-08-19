// MyMemory-only + Night sky + Stars + Meteors + Moon phase + Space icons + Click-burst
const contentEl = document.getElementById('content');
const tabs = Array.from(document.querySelectorAll('.tabs .tab'));
const indicator = document.querySelector('.tab-indicator');

/* ---------- Tabs Loader ---------- */
async function loadTab(path){
  try{
    const res = await fetch(path, {cache:'no-store'});
    const html = await res.text();
    contentEl.innerHTML = html;
    if (path.includes('translate.html')) initTranslatePanel();
    const activeBtn = tabs.find(t => t.dataset.tab === path || t.getAttribute('data-tab') === path);
    if(activeBtn) moveIndicator(activeBtn);
    // gắn burst cho nội dung tab mới render (nếu có nút)
    attachBurstToButtons(contentEl);
  }catch{
    contentEl.innerHTML = `<div class="border-wrap"><p>Không thể tải tab: ${path}</p></div>`;
  }
}
function moveIndicator(btn){
  const r = btn.getBoundingClientRect(), pr = btn.parentElement.getBoundingClientRect();
  indicator.style.width = r.width + 'px';
  indicator.style.transform = `translateX(${r.left - pr.left}px)`;
}
tabs.forEach(btn=>{
  if(!btn.dataset.tab) btn.dataset.tab = btn.textContent.trim().toLowerCase() + '.html';
  btn.addEventListener('click', (e)=>{
    tabs.forEach(b=>{ b.classList.toggle('is-active', b===btn); b.setAttribute('aria-selected', b===btn ? 'true':'false'); });
    loadTab(btn.dataset.tab);
    spawnStarBurst(e.clientX, e.clientY);
  });
});
window.addEventListener('load', ()=>{
  const first = tabs[0];
  first.classList.add('is-active'); first.setAttribute('aria-selected','true');
  loadTab(first.dataset.tab || 'schedule.html');
  attachBurstToButtons(document); // lần đầu
});
window.addEventListener('resize', ()=>{
  const current = document.querySelector('.tabs .tab.is-active');
  if(current) moveIndicator(current);
});

/* ---------- Time Sync ---------- */
let serverNow = null, lastSyncEpoch = null;
async function fetchTimeFromWorldTimeAPI(){
  const r = await fetch('https://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh',{cache:'no-store'});
  if(!r.ok) throw new Error('time api');
  const j = await r.json();
  return new Date(j.datetime);
}
async function syncTime(){
  const badge = document.getElementById('timeSync');
  try{
    serverNow = await fetchTimeFromWorldTimeAPI(); lastSyncEpoch = Date.now();
    if(badge){ badge.textContent='Đã đồng bộ thời gian web'; badge.dataset.status='ok'; }
  }catch(e){
    serverNow=null; if(badge){ badge.textContent='Lỗi đồng bộ – dùng giờ máy'; badge.dataset.status='fail'; }
  }
}
function getNow(){
  if(serverNow && lastSyncEpoch) return new Date(serverNow.getTime() + (Date.now()-lastSyncEpoch));
  return new Date();
}

/* ---------- Stars ---------- */
function ensureStars(count=180){
  const wrap = document.getElementById('stars');
  if(!wrap || wrap.dataset.populated === '1') return;
  const frag = document.createDocumentFragment();
  for(let i=0;i<count;i++){
    const d = document.createElement('div');
    d.className = 'star' + (Math.random()<0.15?' big': (Math.random()<0.5?' tiny':''));
    d.style.top  = (Math.random()*100).toFixed(2)+'%';
    d.style.left = (Math.random()*100).toFixed(2)+'%';
    d.style.setProperty('--twinkleDur', (1.8 + Math.random()*2.2).toFixed(2) + 's');
    d.style.animationDelay = (Math.random()*2.5).toFixed(2) + 's';
    frag.appendChild(d);
  }
  wrap.appendChild(frag);
  wrap.dataset.populated = '1';
}

/* ---------- Space Icons (night only) ---------- */
function svgAstronaut(){return `
<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="36" r="24" fill="#E7ECFF" stroke="#9aa7ff" stroke-width="3"/>
  <rect x="34" y="58" width="52" height="52" rx="12" fill="#DDE3FF" stroke="#9aa7ff" stroke-width="3"/>
  <circle cx="60" cy="36" r="14" fill="#1b1f3a"/>
  <rect x="24" y="86" width="20" height="12" rx="6" fill="#b9c3ff"/>
  <rect x="76" y="86" width="20" height="12" rx="6" fill="#b9c3ff"/>
  <rect x="48" y="110" width="12" height="22" rx="6" fill="#b9c3ff"/>
  <rect x="60" y="110" width="12" height="22" rx="6" fill="#b9c3ff"/>
</svg>`}
function svgRocket(){return `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 8 C78 24 86 52 86 70 L60 58 L34 70 C34 52 42 24 60 8 Z" fill="#E3F2FD" stroke="#7fb2ff" stroke-width="3"/>
  <circle cx="60" cy="40" r="10" fill="#1b1f3a" stroke="#7fb2ff" stroke-width="3"/>
  <path d="M34 70 L22 90 L40 82 Z" fill="#FFD54F"/><path d="M86 70 L80 82 L98 90 Z" fill="#FFD54F"/>
  <path d="M58 84 L62 104 L50 96 Z" fill="#FF6D00"/>
</svg>`}
function svgSaturn(){return `
<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="80" cy="58" rx="34" ry="30" fill="#E6D6FF" stroke="#B39CFF" stroke-width="3"/>
  <ellipse cx="80" cy="62" rx="70" ry="18" fill="none" stroke="#c7b6ff" stroke-width="6"/>
</svg>`}
function svgJupiter(){return `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="40" fill="#FFE0B2" stroke="#FFB74D" stroke-width="3"/>
  <rect x="20" y="46" width="80" height="10" fill="#FFCC80"/><rect x="16" y="64" width="88" height="10" fill="#FFAB91"/>
</svg>`}
function svgVenus(){return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="34" fill="#FFF3C4" stroke="#FFD54F" stroke-width="3"/>
</svg>`}
function svgMars(){return `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="34" fill="#FFB199" stroke="#FF7043" stroke-width="3"/>
  <circle cx="36" cy="42" r="6" fill="#FF8A65"/><circle cx="68" cy="60" r="5" fill="#FF8A65"/>
</svg>`}
function svgNeptune(){return `
<svg viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
  <circle cx="55" cy="55" r="36" fill="#9CCBFF" stroke="#64B5F6" stroke-width="3"/>
  <rect x="24" y="50" width="62" height="6" rx="3" fill="#64B5F6"/>
</svg>`}
function svgUranus(){return `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="60" r="34" fill="#C5F6FF" stroke="#80DEEA" stroke-width="3"/>
  <ellipse cx="60" cy="60" rx="70" ry="16" fill="none" stroke="#9CE9F2" stroke-width="5"/>
</svg>`}
function svgMercury(){return `
<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
  <circle cx="45" cy="45" r="28" fill="#D9D9D9" stroke="#B0B0B0" stroke-width="3"/>
</svg>`}
function ensureSpaceLayer(){
  let space = document.getElementById('space');
  if(!space){
    space = document.createElement('div');
    space.id = 'space'; space.className = 'space';
    document.body.appendChild(space);
  }
  if(space.dataset.populated === '1') return;
  const items = [
    {html:svgAstronaut(), cls:'space-obj float-mid',  style:'left:4%;  top:68%; width:90px;'},
    {html:svgRocket(),    cls:'space-obj float-slow', style:'right:6%; top:18%; width:110px; transform:rotate(10deg)'},
    {html:svgSaturn(),    cls:'space-obj spin-mid',   style:'left:6%;  top:8%;  width:180px;'},
    {html:svgJupiter(),   cls:'space-obj spin-slow',  style:'right:8%; bottom:12%; width:140px;'},
    {html:svgVenus(),     cls:'space-obj float-slow', style:'left:10%; bottom:8%; width:110px;'},
    {html:svgMars(),      cls:'space-obj float-mid',  style:'right:16%; top:58%; width:100px;'},
    {html:svgNeptune(),   cls:'space-obj spin-slow',  style:'left:18%;  bottom:14%; width:130px;'},
    {html:svgUranus(),    cls:'space-obj spin-mid',   style:'right:20%; top:8%; width:150px;'},
    {html:svgMercury(),   cls:'space-obj float-slow', style:'left:38%;  top:18%; width:80px;'}
  ];
  items.forEach(it=>{
    const d = document.createElement('div');
    d.className = it.cls; d.style = it.style; d.innerHTML = it.html;
    space.appendChild(d);
  });
  space.dataset.populated = '1';
}

/* ---------- Meteors ---------- */
function randomMeteor(){
  if(!document.body.classList.contains('night')) return;
  if(Math.random() < 0.066){ // ~1/15s
    const m = document.createElement('div');
    m.className = 'meteor';
    const startX = window.innerWidth * (0.3 + Math.random()*0.7);
    const startY = window.innerHeight * (Math.random()*0.4);
    const dx = - (400 + Math.random()*800);
    const dy =  200 + Math.random()*500;
    const dur = (1.2 + Math.random()*1.4).toFixed(2)+'s';
    m.style.left = startX+'px'; m.style.top = startY+'px';
    m.style.setProperty('--dx', dx+'px'); m.style.setProperty('--dy', dy+'px');
    m.style.setProperty('--dur', dur);
    m.style.setProperty('--deg','315deg');
    document.body.appendChild(m);
    setTimeout(()=> m.remove(), parseFloat(dur)*1000 + 200);
  }
}

/* ---------- Moon phase ---------- */
function moonPhaseShiftPx(dateObj){
  const synodic = 29.53058867;
  const base = new Date(Date.UTC(2000,0,6,18,14)); // gần kỳ trăng non
  const days = (dateObj - base) / 86400000;
  const phase = (days % synodic + synodic) % synodic;
  const ratio = Math.cos(2*Math.PI*phase/synodic); // -1..1
  return (ratio * 50).toFixed(1) + 'px'; // -50..+50px
}

/* ---------- Sky update ---------- */
function updateSky(){
  const sun  = document.getElementById('sun');
  const moon = document.getElementById('moon');
  const stars= document.getElementById('stars');
  if(!sun||!moon||!stars) return;

  const now = getNow();
  const h = now.getHours(), m = now.getMinutes(), hours = h + m/60;

  // Sun arc (6h -> 18h)
  const start = 6, end = 18;
  let p = (hours - start) / (end - start);
  p = Math.max(0, Math.min(1, p));
  const radiusX = Math.max(window.innerWidth/2 - 120, 260);
  const radiusY = Math.min(360, Math.max(220, window.innerHeight*0.36));
  const cx = window.innerWidth/2, horizon = window.innerHeight*0.98;
  const angle = p * Math.PI;
  sun.style.left = (cx - radiusX * Math.cos(angle)) + 'px';
  sun.style.top  = (horizon - radiusY * Math.sin(angle)) + 'px';

  const isNight = (h >= 18) || (h < 6);
  document.body.classList.toggle('night', isNight);
  if(isNight) ensureSpaceLayer();

  moon.style.opacity = isNight ? 1 : 0;
  if(isNight){
    const nightHour = h < 6 ? h + 24 : h;
    let np = (nightHour - 18) / 12;
    const nang = np * Math.PI;
    moon.style.left = (cx + radiusX * Math.cos(nang)) + 'px';
    moon.style.top  = (horizon - radiusY * Math.sin(nang) - 20) + 'px';
    const shade = moon.querySelector('.shade') || (()=>{ const d=document.createElement('div'); d.className='shade'; moon.appendChild(d); return d; })();
    shade.style.setProperty('--phase-shift', moonPhaseShiftPx(now));
  }
}

/* ---------- Animation toggles ---------- */
const fabAnim = document.getElementById('fabAnim');
const fabSquiggle = document.getElementById('fabSquiggle');
function setPaused(paused){
  document.body.classList.toggle('paused', paused);
  if(fabAnim){ fabAnim.textContent = paused ? '▶️' : '⏸️'; fabAnim.setAttribute('aria-pressed', paused ? 'true' : 'false'); }
}
function setSquiggle(on){
  document.body.classList.toggle('nosquiggle', !on);
  if(fabSquiggle){ fabSquiggle.textContent = on ? '✨' : '🚫✨'; fabSquiggle.setAttribute('aria-pressed', on ? 'true' : 'false'); }
}
fabAnim && fabAnim.addEventListener('click', (e)=>{ setPaused(!document.body.classList.contains('paused')); spawnStarBurst(e.clientX,e.clientY); });
fabSquiggle && fabSquiggle.addEventListener('click', (e)=>{ setSquiggle(document.body.classList.contains('nosquiggle')); spawnStarBurst(e.clientX,e.clientY); });

/* ---------- Click Star Burst (from element edges) ---------- */
let burstLockUntil = 0; // throttle

function spawnStarBurstFromEl(el){
  const now = performance.now();
  if(now < burstLockUntil) return;
  burstLockUntil = now + 90;

  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const rx = rect.width  / 2;
  const ry = rect.height / 2;

  // tạo container phủ viewport
  const layer = document.createElement('div');
  layer.className = 'burst';
  document.body.appendChild(layer);

  const dur = 600 + Math.random()*300; // 600–900ms
  const count = 16 + Math.floor(Math.random()*10); // 16–25 hạt

  const frag = document.createDocumentFragment();

  for(let i=0;i<count;i++){
    // chọn góc ngẫu nhiên quanh viền nút
    const ang = Math.random()*Math.PI*2;

    // điểm xuất phát nằm trên (hoặc rất sát) viền hình elip bao quanh nút
    const edgeX = cx + Math.cos(ang) * rx * 0.98;
    const edgeY = cy + Math.sin(ang) * ry * 0.98;

    // quãng bay ra ngoài theo cùng hướng (xa hơn viền)
    const travel = 80 + Math.random()*140; // 80–220 px
    const dx = Math.cos(ang) * travel;
    const dy = Math.sin(ang) * travel;

    const star = document.createElement('span');
    star.className = 'burst-star' + (Math.random()<0.2?' big': (Math.random()<0.5?' tiny':''));
    star.style.left = edgeX + 'px';
    star.style.top  = edgeY + 'px';
    star.style.setProperty('--dx', dx.toFixed(1)+'px');
    star.style.setProperty('--dy', dy.toFixed(1)+'px');
    star.style.setProperty('--rot', (Math.random()*360).toFixed(1)+'deg');
    star.style.setProperty('--dur', dur.toFixed(0)+'ms');

    frag.appendChild(star);
  }

  layer.appendChild(frag);
  setTimeout(()=> layer.remove(), dur + 100);
}
// gán cho tất cả nút có lớp .btn, .swap-btn, .fab và các .tab
function attachBurstToButtons(scope){
  (scope.querySelectorAll?.('.btn,.swap-btn,.fab,.tab') || []).forEach(el=>{
    if(el._burstBound) return;
    el.addEventListener('click', (ev)=>{
      const x = ev.clientX, y = ev.clientY;
      if(x || y) spawnStarBurst(x,y);
    });
    el._burstBound = true;
  });
}
// click ở bất kỳ đâu trên document cho vui (nhẹ nhàng)
document.addEventListener('click', (ev)=>{
  const target = ev.target;
  // chỉ burst nếu là button/tab (đã gắn ở trên) hoặc có data-burst
  if(target.matches?.('.btn,.swap-btn,.fab,.tab,[data-burst]')) return; // đã xử lý
  // không burst khi bấm vào input/textarea/selection
  if(target.closest?.('textarea,input,select')) return;
});

/* ---------- Translate (MyMemory only) ---------- */
function initTranslatePanel(){
  let ttsRate = 1;
  const lblFrom = document.getElementById('lblFrom');
  const lblTo   = document.getElementById('lblTo');
  const srcText = document.getElementById('srcText');
  const dstText = document.getElementById('dstText');
  const swapBtn = document.getElementById('swapBtn');
  const translateBtn = document.getElementById('translateBtn');
  const tStatus = document.getElementById('tStatus');
  const clearSrc= document.getElementById('clearSrc');
  const copyDst = document.getElementById('copyDst');
  const histList= document.getElementById('historyList');
  const clearHistBtn = document.getElementById('clearHistory');
  if(!srcText) return;

  let srcLang = 'vi', dstLang = 'en';
  const updateLabels = ()=>{
    lblFrom.textContent = srcLang === 'vi' ? 'Tiếng Việt' : 'English';
    lblTo.textContent   = dstLang === 'vi' ? 'Tiếng Việt' : 'English';
  };
  updateLabels();

  async function translateMyMemory(q, source, target){
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${source}|${target}`;
    const r = await fetch(url, {cache:'no-store'});
    if(!r.ok) throw new Error('MyMemory error');
    const j = await r.json();
    return (j.responseData && j.responseData.translatedText) ? j.responseData.translatedText : '';
  }
  async function doTranslate(){
    const q = srcText.value.trim();
    if(!q){ dstText.value=''; tStatus.textContent=''; return; }
    tStatus.textContent = 'Đang dịch (MyMemory)...';
    try{
      const out = await translateMyMemory(q, srcLang, dstLang);
      dstText.value = out || '';
      tStatus.textContent = out ? '✔ MyMemory' : 'Không có kết quả';
      if(out){ saveHistory(q, out, srcLang, dstLang); renderHistory(); }
    }catch{ tStatus.textContent = '❌ Lỗi dịch (MyMemory)'; }
  }
  let typeTimer=null;
  srcText.addEventListener('input', ()=>{ clearTimeout(typeTimer); typeTimer = setTimeout(doTranslate, 600); });
  translateBtn && translateBtn.addEventListener('click', (e)=>{ doTranslate(); spawnStarBurst(e.clientX,e.clientY); });
  swapBtn && swapBtn.addEventListener('click', (e)=>{
    [srcLang, dstLang] = [dstLang, srcLang]; updateLabels();
    const a = srcText.value; srcText.value = dstText.value; dstText.value = a;
    if (srcText.value.trim()) doTranslate();
    spawnStarBurst(e.clientX,e.clientY);
  });
  clearSrc && clearSrc.addEventListener('click', (e)=>{ srcText.value=''; dstText.value=''; tStatus.textContent=''; spawnStarBurst(e.clientX,e.clientY); });
  copyDst && copyDst.addEventListener('click', async (e)=>{
    try{ await navigator.clipboard.writeText(dstText.value||''); tStatus.textContent='✔ Đã copy'; }
    catch{ tStatus.textContent='Không copy được'; }
    setTimeout(()=>tStatus.textContent='',1500);
    spawnStarBurst(e.clientX,e.clientY);
  });

  // TTS en-US / vi-VN
  function speak(text, lang){
    if(!('speechSynthesis' in window)) { tStatus.textContent = 'Trình duyệt không hỗ trợ đọc TTS'; return; }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = (lang==='vi' ? 'vi-VN' : 'en-US');
    const voices = window.speechSynthesis.getVoices();
    if(lang !== 'vi'){
      let enUS = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.toLowerCase().includes('en-us')) || voices.find(v => v.lang.startsWith('en'));
      if(enUS) utter.voice = enUS;
    } else {
      let viVN = voices.find(v => v.lang === 'vi-VN') || voices.find(v => v.lang.toLowerCase().includes('vi-vn')) || voices.find(v => v.lang.startsWith('vi'));
      if(viVN) utter.voice = viVN;
    }
    utter.rate = ttsRate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }
  document.getElementById('speakSrc')?.addEventListener('click', (e)=>{ const t=srcText.value.trim(); if(t) speak(t, (srcLang==='en'?'en':'vi')); spawnStarBurst(e.clientX,e.clientY); });
  document.getElementById('speakDst')?.addEventListener('click', (e)=>{ const t=dstText.value.trim(); if(t) speak(t, (dstLang==='en'?'en':'vi')); spawnStarBurst(e.clientX,e.clientY); });

  // History
  const HIST_KEY = 'ttn_translate_history';
  const loadHistory = ()=>{ try{ return JSON.parse(localStorage.getItem(HIST_KEY)||'[]'); }catch{ return []; } };
  const saveHistory = (src,dst,sl,tl)=>{ const list=loadHistory(); list.unshift({t:Date.now(),sl,tl,src,dst}); localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(0,50))); };
  const clearHistory = ()=>{ localStorage.removeItem(HIST_KEY); renderHistory(); };
  function renderHistory(){
    if(!histList) return;
    const list = loadHistory();
    if(!list.length){ histList.innerHTML='<div class="hist-item">Chưa có lịch sử dịch.</div>'; return; }
    const esc = s => (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    histList.innerHTML = list.map((it, idx)=>`
      <div class="hist-item" data-idx="${idx}">
        <div class="hist-top"><span class="badge-mini">${it.sl.toUpperCase()} → ${it.tl.toUpperCase()}</span><span class="when">${new Date(it.t).toLocaleString()}</span></div>
        <div class="hist-src"><strong>Src:</strong> ${esc(it.src)}</div>
        <div class="hist-dst"><strong>Dst:</strong> ${esc(it.dst)}</div>
        <div class="hist-actions"><button class="btn small use-btn">Dùng lại</button><button class="btn small speak-btn">🔊</button></div>
      </div>`).join('');
    histList.querySelectorAll('.hist-item').forEach(div=>{
      const idx = +div.dataset.idx; const data = loadHistory()[idx];
      div.querySelector('.use-btn').addEventListener('click', (e)=>{ document.getElementById('srcText').value=data.src; document.getElementById('dstText').value=data.dst; spawnStarBurst(e.clientX,e.clientY); });
      div.querySelector('.speak-btn').addEventListener('click', (e)=>{ if(data.tl==='en') speak(data.dst,'en'); else if(data.sl==='en') speak(data.src,'en'); else speak(data.dst,data.tl); spawnStarBurst(e.clientX,e.clientY); });
    });
  }
  clearHistBtn?.addEventListener('click', (e)=>{ clearHistory(); spawnStarBurst(e.clientX,e.clientY); });
  renderHistory();
}

/* ---------- Init ---------- */
(async function init(){
  await syncTime();
  ensureStars(180);
  updateSky();
  setInterval(updateSky, 60000);
  setInterval(syncTime, 10*60*1000);
  setInterval(randomMeteor, 15000);
  document.getElementById('timeSync')?.addEventListener('click', (e)=>{ syncTime(); spawnStarBurst(e.clientX,e.clientY); });
  window.addEventListener('resize', updateSky);
})();
