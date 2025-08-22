// ====== Lås zoom (app-følelse) ======
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// ====== Konfig ======
const COUNT_TOTAL = 18;      // 1..18 knapper
const SOUND_MAX   = 17;      // 1..17 har lyd; #18 = randomizer
const NO_REPEAT_WINDOW = Math.min(10, SOUND_MAX - 1); // unngå nylig gjentakelse
const RANDOM_FLASHES   = 5;  // antall blink før sluttvalg
const FLASH_INTERVAL   = 160; // ms mellom blink

// ====== Preload lyd ======
const clips = {};
for (let i = 1; i <= SOUND_MAX; i++) {
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[i] = a;
}

// ====== State ======
let currentAudio = null;
let activeIndex  = null;       // hvilket nummer (1..17) som er aktivt nå
const history = [];            // nylige valg for anti-gjentakelse

// ====== DOM helpers ======
const deck = document.querySelector('.deck');

function btnFor(i) {
  return deck.querySelector(`.btn[data-index="${i}"]`);
}
function imgFor(i) {
  return btnFor(i)?.querySelector('img');
}

// Sett bilde og .active-klasse
function setActiveVisual(n) {
  // nullstill forrige
  if (activeIndex && activeIndex !== n) {
    const prevImg = imgFor(activeIndex);
    if (prevImg) prevImg.src = `img/btn${activeIndex}.png`;
    btnFor(activeIndex)?.classList.remove('active');
  }
  // sett ny
  const img = imgFor(n);
  if (img) img.src = `img/btn${n}active.png`;
  btnFor(n)?.classList.add('active');
  activeIndex = n;
}

function clearActiveVisual() {
  if (!activeIndex) return;
  const img = imgFor(activeIndex);
  if (img) img.src = `img/btn${activeIndex}.png`;
  btnFor(activeIndex)?.classList.remove('active');
  activeIndex = null;
}

// Spill én lyd (stopp evt. annen)
function playIndex(n) {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const a = clips[n];
  if (!a) {
    console.error('Mangler lyd for', n);
    return;
  }
  currentAudio = a;
  a.currentTime = 0;
  a.play().catch(()=>{});
}

// Velg indeks uten nylig gjentakelse
function pickIndexNoRepeat() {
  const recent = new Set(history);
  let candidates = [];
  for (let n = 1; n <= SOUND_MAX; n++) if (!recent.has(n)) candidates.push(n);
  while (candidates.length === 0 && history.length) {
    history.shift(); // slipp eldste ut
    candidates = [];
    for (let n = 1; n <= SOUND_MAX; n++) if (!history.includes(n)) candidates.push(n);
  }
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  history.push(idx);
  if (history.length > NO_REPEAT_WINDOW) history.shift();
  return idx;
}

// Blink 5 tilfeldige (kan repetere), så sluttvalg uten gjentakelse
async function runRandomizer() {
  // stopp evt. lyd og visuell state
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  clearActiveVisual();

  // 5 raske blink på tilfeldige knapper (1..17)
  for (let i = 0; i < RANDOM_FLASHES; i++) {
    const r = 1 + Math.floor(Math.random() * SOUND_MAX);
    // midlertidig vis active-bilde
    const img = imgFor(r);
    if (img) {
      const prevSrc = img.src;
      img.src = `img/btn${r}active.png`;
      setTimeout(() => {
        // hvis sluttvalget senere ble samme r, vil setActiveVisual holde den aktiv
        if (activeIndex !== r) img.src = `img/btn${r}.png`;
      }, FLASH_INTERVAL - 20);
    }
    await new Promise(res => setTimeout(res, FLASH_INTERVAL));
  }

  // Sluttvalg uten nylig gjentakelse
  const final = pickIndexNoRepeat();
  setActiveVisual(final);
  playIndex(final);
}

// ====== Interaksjon ======
deck.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const idx = Number(btn.getAttribute('data-index'));

  // Randomizer (#18)
  if (btn.hasAttribute('data-randomizer')) {
    runRandomizer();
    return;
  }

  // Vanlig knapp (1..17)
  const fileIdx = idx; // data-file finnes, men vi bruker tallet direkte
  setActiveVisual(fileIdx);
  playIndex(fileIdx);
});

// Tastatur (Enter/Space på fokusert knapp)
document.addEventListener('keydown', e => {
  if (!['Enter', ' '].includes(e.key)) return;
  const btn = document.activeElement?.closest?.('.btn');
  if (!btn) return;
  e.preventDefault();
  btn.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));
});

console.log('[INIT] Grid-UI aktiv (18 knapper, #18 randomizer)');
