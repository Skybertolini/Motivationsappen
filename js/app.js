// Hindre pinch-zoom (iOS Safari) og ctrl-zoom (desktop)
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('wheel', e => {
  if (e.ctrlKey) e.preventDefault();   // ctrl + mushjul
}, { passive: false });

// Hindre double-tap-zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Preload alle 12 lydklipp
const clips = {};
for (let i = 1; i <= 12; i++) {
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[path] = a;
}

// Spill av når man klikker / trykker på en knapp
function play(file) {
  const a = clips[file];
  if (!a) return;
  try {
    a.currentTime = 0;
    a.play();
  } catch (err) {
    console.error('Spilling feilet:', err);
  }
}

// Deleger klikk til alle .btn
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const file = btn.getAttribute('data-file');
  play(file);
});

// Tastaturstøtte (Enter/Space)
document.addEventListener('keydown', (e) => {
  if (!['Enter', ' '].includes(e.key)) return;
  const btn = document.activeElement.closest?.('.btn');
  if (!btn) return;
  e.preventDefault();
  const file = btn.getAttribute('data-file');
  play(file);
});
