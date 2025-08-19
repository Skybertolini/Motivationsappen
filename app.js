// Preload alle 12 lydklipp
const clips = {};
for (let i=1;i<=12;i++){
  const path = `sounds/${i}.mp3`;
  const a = new Audio(path);
  a.preload = 'auto';
  clips[path] = a;
}

// Spill av valgt klipp
function playSound(file){
  const a = clips[file];
  if (!a) return;
  try { 
    a.currentTime = 0; 
    a.play(); 
  } catch(e){ 
    console.error(e); 
  }
}