// --- Hindre pinch/doubletap zoom (for app-følelse) ---
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) e.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

// --- Preload lydfiler ---
const clips = {};
for (let i = 1; i <= 12; i++) {
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[path] = a;
}

// --- Håndtere aktiv knapp ---
let currentBtn = null;

function setActive(btn) {
  // Sett forrige knapp tilbake til normal
  if (currentBtn && currentBtn !== btn) {
    const prevImg = currentBtn.querySelector('img');
    const prevNum = currentBtn.getAttribute('aria-label');
    prevImg.src = `img/btn${prevNum}.png`;
  }

  // Sett ny knapp aktiv
  if (btn) {
    const img = btn.querySelector('img');
    const num = btn.getAttribute('aria-label');
    img.src = `img/btn${num}active.png`;
    currentBtn = btn;
  }
}

// --- Spill lyd + sett knapp aktiv ---
function play(file, btn) {
  const a = clips[file];
  if (!a) return console.error('Fant ikke lydfilen:', file);

  try {
    a.currentTime = 0;
    a.play().catch(err => console.error('play() feilet:', err));
    setActive(btn);
  } catch (err) {
    console.error('Avspilling feilet:', err);
  }
}

// --- Klikk ---
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const file = btn.getAttribute('data-file');
  play(file, btn);
});

// --- Tastatur ---
document.addEventListener('keydown', e => {
  if (!['Enter', ' '].includes(e.key)) return;
  const btn = document.activeElement?.closest?.('.btn');
  if (!btn) return;
  e.preventDefault();
  const file = btn.getAttribute('data-file');
  play(file, btn);
});

console.log('[INIT] Motivationsappen lastet');
