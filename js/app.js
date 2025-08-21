// ====== Lås zoom ======
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// ====== Konfig ======
const COUNT = 15;             // antall spor
const NO_REPEAT_WINDOW = 10;  // ikke gjenta nylig
const EXTRA_SPINS = 4;        // fulle runder
const SPIN_DURATION = 4000;   // 4 sekunder

// ====== Lyd-preload ======
const clips = {};
for (let i = 1; i <= COUNT; i++) {
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[i] = a;
}

// Tick-lyd
const tick = new Audio('sounds/tick.mp3');
tick.preload = 'auto';

// ====== Bygg hjul ======
const wheel = document.getElementById('wheel');
const chosenEl = document.getElementById('chosen');
const items = [];

for (let i = 1; i <= COUNT; i++) {
  const wrap = document.createElement('div');
  wrap.className = 'wheel-item';
  const img = document.createElement('img');
  img.alt = `${i}`;
  img.src = `img/btn${i}.png`;
  wrap.appendChild(img);

  const angle = (360 / COUNT) * (i - 1);
  wrap.style.transform = `rotate(${angle}deg) translateY(-330px)`;
  items.push({ i, angle, wrap, img });
  wheel.appendChild(wrap);
}

// ====== Logikk ======
let currentRotation = 0;
let currentAudio = null;
const history = [];

function pickIndex() {
  const recent = new Set(history);
  const candidates = [];
  for (let n = 1; n <= COUNT; n++) {
    if (!recent.has(n)) candidates.push(n);
  }
  while (candidates.length === 0 && history.length) {
    history.shift();
    for (let n = 1; n <= COUNT; n++) {
      if (!history.includes(n)) candidates.push(n);
    }
  }
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  history.push(idx);
  if (history.length > NO_REPEAT_WINDOW) history.shift();
  return idx;
}

function angleForIndex(n) {
  return (360 / COUNT) * (n - 1);
}

function spinToIndex(n) {
  const targetAngle = angleForIndex(n);
  const targetRotation = -(targetAngle) + 360 * EXTRA_SPINS;
  currentRotation += targetRotation;
  wheel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(.12,.9,.39,1)`;
  wheel.style.transform = `rotate(${currentRotation}deg)`;
}

function setActiveVisual(n) {
  for (const it of items) {
    it.img.src = (it.i === n) ? `img/btn${it.i}active.png` : `img/btn${it.i}.png`;
  }
  chosenEl.textContent = n;
}

function playIndex(n) {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  const a = clips[n];
  if (!a) return;
  currentAudio = a;
  a.currentTime = 0;
  a.play().catch(err => console.error('play() feilet:', err));
}

// ====== Tick under spinn ======
let tickInterval = null;
function startTicks() {
  stopTicks();
  tickInterval = setInterval(() => {
    tick.currentTime = 0;
    tick.play().catch(()=>{});
  }, 120);
}
function stopTicks() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ====== Interaksjon ======
document.getElementById('btnselector').addEventListener('click', () => {
  const n = pickIndex();
  setActiveVisual(n);
  spinToIndex(n);
  startTicks();

  setTimeout(() => {
    stopTicks();
    playIndex(n);
  }, SPIN_DURATION);
});

console.log('[INIT] Lykkehjul klart (4 sek, tick-lyd)');
