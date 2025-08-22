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
const COUNT_TOTAL = 18;      // 1..17 vanlige + random
const SOUND_MAX   = 17;      // 1..17 har lyd
const NO_REPEAT_WINDOW = Math.min(10, SOUND_MAX - 1);
const RANDOM_FLASHES   = 5;   // antall blink
const FLASH_INTERVAL   = 160; // ms mellom blink
const RANDOM_ACTIVE_MS = 3000; // hvor lenge random-knappen selv lyser

// ====== Preload lyd ======
const clips = {};
for (let i = 1; i <= SOUND_MAX; i++) {
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[i] = a;
}

// Shuffle-lyd for random-knappen
const shuffleSound = new Audio('sounds/shuffle.mp3');
shuffleSound.preload = 'auto';

// ====== State ======
let currentAudio = null;
let activeIndex  = null;       // 1..17 aktiv
const history = [];

// ====== DOM helpers ======
const deck = document.querySelector('.deck');

function btnFor(i) { return deck.querySelector(`.btn[data-index="${i}"]`); }
function imgFor(i) { return btnFor(i)?.querySelector('img'); }
function randomBtn() { return deck.querySelector('.btn[data-randomizer]'); }
function randomImg() { return randomBtn()?.querySelector('img'); }

function setActiveVisual(n) {
  if (activeIndex && activeIndex !== n) {
    const prevImg = imgFor(activeIndex);
    if (prevImg) prevImg.src = `img/btn${activeIndex}.png`;
    btnFor(activeIndex)?.classList.remove('active');
  }
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
  if (!a) return;
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
    history.shift();
    candidates = [];
    for (let n = 1; n <= SOUND_MAX; n++) if (!history.includes(n)) candidates.push(n);
  }
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  history.push(idx);
  if (history.length > NO_REPEAT_WINDOW) history.shift();
  return idx;
}

// Blink 5 tilfeldige, så sluttvalg
async function runRandomizer() {
  // stopp evt. lyd
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  clearActiveVisual();

  // vis random-knappen som aktiv i 3 sek
  const rImg = randomImg();
  if (rImg) {
    rImg.src = `img/btnrandomactive.png`;
    setTimeout(() => {
      rImg.src = `img/btnrandom.png`;
    }, RANDOM_ACTIVE_MS);
  }

  // spill shuffle-lyd
  shuffleSound.currentTime = 0;
  shuffleSound.play().catch(()=>{});

  // blink 5 tilfeldige
  for (let i = 0; i < RANDOM_FLASHES; i++) {
    const r = 1 + Math.floor(Math.random() * SOUND_MAX);
    const img = imgFor(r);
    if (img) {
      img.src = `img/btn${r}active.png`;
      setTimeout(() => {
        if (activeIndex !== r) img.src = `img/btn${r}.png`;
      }, FLASH_INTERVAL - 20);
    }
    await new Promise(res => setTimeout(res, FLASH_INTERVAL));
  }

  // sluttvalg
  const final = pickIndexNoRepeat();
  setActiveVisual(final);
  playIndex(final);
}

// ====== Interaksjon ======
deck.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const idx = Number(btn.getAttribute('data-index'));

  // Randomizer
  if (btn.hasAttribute('data-randomizer')) {
    runRandomizer();
    return;
  }

  // Vanlig knapp
  setActiveVisual(idx);
  playIndex(idx);
});

// Tastatur
document.addEventListener('keydown', e => {
  if (!['Enter', ' '].includes(e.key)) return;
  const btn = document.activeElement?.closest?.('.btn');
  if (!btn) return;
  e.preventDefault();
  btn.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true}));
});

console.log('[INIT] Grid-UI aktiv (18 knapper, btnrandom med shuffle-lyd og 3s glow)');
