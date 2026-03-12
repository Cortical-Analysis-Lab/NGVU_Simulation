// =====================================================
// AXON IONS — HALOS, Na⁺ WAVE, K⁺ EFFLUX
// =====================================================
console.log("🧬 axonIons loaded");

// -----------------------------------------------------
// GLOBAL ECS STORAGE (RELOAD-SAFE)
// -----------------------------------------------------
window.ecsIons = window.ecsIons || {};

ecsIons.AxonNaStatic = ecsIons.AxonNaStatic || [];
ecsIons.AxonKStatic  = ecsIons.AxonKStatic  || [];
ecsIons.AxonNaWave   = ecsIons.AxonNaWave   || [];
ecsIons.AxonKFlux    = ecsIons.AxonKFlux    || [];

// -----------------------------------------------------
// AXON HALO GEOMETRY
// -----------------------------------------------------
const AXON_HALO_RADIUS    = 28;
const AXON_HALO_THICKNESS = 4;

// -----------------------------------------------------
// HALO DYNAMICS (SUBTLE, BACKGROUND)
// -----------------------------------------------------
const HALO_NA_PERTURB = 0.04;
const HALO_K_PUSH     = 1.6;
const HALO_NA_RELAX   = 0.95;
const HALO_K_RELAX    = 0.80;

// -----------------------------------------------------
// Na⁺ WAVE — TEACHING / TUNING KNOBS
// -----------------------------------------------------
const AXON_NA_WAVE_SPEED      = 1.6;
const AXON_NA_WAVE_RADIUS    = 28;
const AXON_NA_WAVE_LIFETIME  = 24;
const AXON_NA_MIDLINE_RADIUS = 6;
const NA_APPROACH_DECAY      = 0.99;

// 🔑 spacing control
const AXON_NA_PHASE_SPACING = 0.08;

// -----------------------------------------------------
// K⁺ EFFLUX (VISIBLE AP ONLY)
// -----------------------------------------------------
const AXON_K_FLUX_SPEED     = 1.6;
const AXON_K_FLUX_LIFETIME  = 40;
const AXON_K_SPAWN_COUNT    = 3;
const AXON_K_PHASE_STEP     = 0.045;

let lastAxonKPhase  = -Infinity;
let lastNaWavePhase = -Infinity;

// =====================================================
// AXON Na⁺ WAVE — PHASE-SPACED, BILATERAL
// =====================================================
function triggerAxonNaWave(apPhase) {

  if (window.myelinEnabled) return;
  if (!neuron?.axon?.path || apPhase == null) return;

  if (apPhase - lastNaWavePhase < AXON_NA_PHASE_SPACING) return;
  lastNaWavePhase = apPhase;

  const path = neuron.axon.path;
  const idx  = Math.floor(apPhase * (path.length - 2));
  if (idx <= 0 || idx >= path.length - 1) return;

  const p1 = path[idx];
  const p2 = path[idx + 1];

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;

  const nx = -dy / len;
  const ny =  dx / len;

  [-1, +1].forEach(side => {
    ecsIons.AxonNaWave.push({
      x: p1.x + nx * AXON_NA_WAVE_RADIUS * side,
      y: p1.y + ny * AXON_NA_WAVE_RADIUS * side,
      vx: -nx * AXON_NA_WAVE_SPEED * side,
      vy: -ny * AXON_NA_WAVE_SPEED * side,
      axonIdx: idx,
      life: AXON_NA_WAVE_LIFETIME
    });
  });
}

// =====================================================
// AXON K⁺ EFFLUX — VISIBLE AP ONLY
// =====================================================
function triggerAxonKEfflux(apPhase) {

  if (window.myelinEnabled) return;
  if (!neuron?.axon?.path || apPhase == null) return;
  if (Math.abs(apPhase - lastAxonKPhase) < AXON_K_PHASE_STEP) return;

  lastAxonKPhase = apPhase;

  const path = neuron.axon.path;
  const idx  = Math.floor(apPhase * (path.length - 2));
  if (idx <= 0 || idx >= path.length - 1) return;

  const p1 = path[idx];
  const p2 = path[idx + 1];

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;

  const nx = -dy / len;
  const ny =  dx / len;

  for (let i = 0; i < AXON_K_SPAWN_COUNT; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    ecsIons.AxonKFlux.push({
      x: p1.x + nx * AXON_HALO_RADIUS * side,
      y: p1.y + ny * AXON_HALO_RADIUS * side,
      vx: nx * AXON_K_FLUX_SPEED * side,
      vy: ny * AXON_K_FLUX_SPEED * side,
      life: AXON_K_FLUX_LIFETIME
    });
  }
}

// =====================================================
// DRAW
// =====================================================
function drawAxonIons() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();

  // ------------------------------
  // STATIC Na⁺ HALO
  // ------------------------------
  fill(getColor("sodium", 110));
  ecsIons.AxonNaStatic.forEach(p => {
    p.vx += (p.x - p.x0) * HALO_NA_PERTURB;
    p.vy += (p.y - p.y0) * HALO_NA_PERTURB;
    p.vx += (p.x0 - p.x) * 0.06;
    p.vy += (p.y0 - p.y) * 0.06;
    p.vx *= HALO_NA_RELAX;
    p.vy *= HALO_NA_RELAX;
    p.x += p.vx;
    p.y += p.vy;
    text("Na⁺", p.x, p.y);
  });

  // ------------------------------
  // STATIC K⁺ HALO
  // ------------------------------
  fill(getColor("potassium", 110));
  ecsIons.AxonKStatic.forEach(p => {
    p.vx += (p.x - p.x0) * HALO_K_PUSH * 0.01;
    p.vy += (p.y - p.y0) * HALO_K_PUSH * 0.01;
    p.vx += (p.x0 - p.x) * 0.008;
    p.vy += (p.y0 - p.y) * 0.008;
    p.vx *= HALO_K_RELAX;
    p.vy *= HALO_K_RELAX;
    p.x += p.vx;
    p.y += p.vy;
    text("K⁺", p.x, p.y);
  });

  // ------------------------------
  // Na⁺ WAVE
  // ------------------------------
  fill(getColor("sodium", 140));
  ecsIons.AxonNaWave = ecsIons.AxonNaWave.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= NA_APPROACH_DECAY;
    p.vy *= NA_APPROACH_DECAY;

    const c = neuron.axon.path[p.axonIdx];
    if (dist(p.x, p.y, c.x, c.y) < AXON_NA_MIDLINE_RADIUS) return false;

    text("Na⁺", p.x, p.y);
    return p.life > 0;
  });

  // ------------------------------
  // K⁺ EFFLUX
  // ------------------------------
  fill(getColor("potassium", 130));
  ecsIons.AxonKFlux = ecsIons.AxonKFlux.filter(p => {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    text("K⁺", p.x, p.y);
    return p.life > 0;
  });

  pop();
}

// =====================================================
// INITIALIZATION (HALOS + RESET)
// =====================================================
function initAxonIons() {

  ecsIons.AxonNaStatic.length = 0;
  ecsIons.AxonKStatic.length  = 0;
  ecsIons.AxonNaWave.length   = 0;
  ecsIons.AxonKFlux.length    = 0;

  lastNaWavePhase = -Infinity;
  lastAxonKPhase  = -Infinity;

  if (!neuron?.axon?.path) return;

  const path = neuron.axon.path;

  function spawnHalo(target, count) {
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / count) * (path.length - 2));
      const p1 = path[idx];
      const p2 = path[idx + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny =  dx / len;
      const side = i % 2 === 0 ? 1 : -1;
      const r = random(AXON_HALO_RADIUS, AXON_HALO_RADIUS + AXON_HALO_THICKNESS);
      const x0 = p1.x + nx * r * side;
      const y0 = p1.y + ny * r * side;

      target.push({ x: x0, y: y0, x0, y0, vx: 0, vy: 0 });
    }
  }

  spawnHalo(ecsIons.AxonNaStatic, 8);
  spawnHalo(ecsIons.AxonKStatic,  4);
}

// =====================================================
// EXPORTS
// =====================================================
window.triggerAxonNaWave   = triggerAxonNaWave;
window.triggerAxonKEfflux = triggerAxonKEfflux;
window.drawAxonIons       = drawAxonIons;
window.initAxonIons       = initAxonIons;
