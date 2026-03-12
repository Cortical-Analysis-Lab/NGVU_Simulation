console.log("🫧 vesicleLoading loaded — CHEMISTRY RESTORED");

// =====================================================
// SYNAPTIC VESICLE LOADING — CHEMISTRY ONLY
// =====================================================
//
// ✔ H⁺ priming (chemotactic)
// ✔ ATP priming + hydrolysis
// ✔ NT loading into vesicle lumen
// ✔ Visible dwell before transport
//
// HARD RULES:
// • Chemistry exists ONLY in presynaptic space
// • Chemistry exists ONLY during loading states
// • One vesicle loads at a time
// • Chemistry alone decides LOADED readiness
//
// =====================================================


// -----------------------------------------------------
// GLOBAL CHEMISTRY STORAGE (RELOAD SAFE)
// -----------------------------------------------------
window.synapseH   = window.synapseH   || [];
window.synapseATP = window.synapseATP || [];


// -----------------------------------------------------
// CANONICAL VESICLE STATES (CHEMISTRY-OWNED)
// -----------------------------------------------------
const VESICLE_STATE = {
  EMPTY:         "EMPTY",
  PRIMING:       "PRIMING",
  PRIMED:        "PRIMED",
  LOADING:       "LOADING",
  LOADED_HOLD:   "LOADED_HOLD",
  LOADED_TRAVEL: "LOADED_TRAVEL",
  LOADED:        "LOADED"
};


// -----------------------------------------------------
// CHEMISTRY PARAMETERS
// -----------------------------------------------------
const H_SPEED    = window.SYNAPSE_H_SPEED    ?? 0.35;
const H_LIFE     = window.SYNAPSE_H_LIFE     ?? 140;

const ATP_SPEED  = window.SYNAPSE_ATP_SPEED  ?? 0.45;
const ATP_LIFE   = window.SYNAPSE_ATP_LIFE   ?? 200;
const ATP_BOUNCE = window.SYNAPSE_ATP_BOUNCE ?? 0.45;

const NT_TARGET  = window.SYNAPSE_NT_TARGET  ?? 12;
const NT_RATE    = window.SYNAPSE_NT_PACK_RATE ?? 0.35;

const LOADED_HOLD_FRAMES = 90;


// -----------------------------------------------------
// CHEMOTACTIC HOMING
// -----------------------------------------------------
const CHEMO_DAMPING = 0.92;
const CHEMO_MAX_V   = 1.2;
const H_CHEMO_GAIN   = 0.045;
const ATP_CHEMO_GAIN = 0.070;


// -----------------------------------------------------
// SERIAL LOADING GATE
// -----------------------------------------------------
function hasActiveLoadingVesicle() {
  return window.synapseVesicles?.some(v =>
    v.state === VESICLE_STATE.PRIMING ||
    v.state === VESICLE_STATE.PRIMED  ||
    v.state === VESICLE_STATE.LOADING ||
    v.state === VESICLE_STATE.LOADED_HOLD
  );
}


// -----------------------------------------------------
// SPAWN PRIMING PARTICLES
// -----------------------------------------------------
function spawnPrimingParticles(v) {

  if (window.synapseH.some(h => h.target === v)) return;
  if (window.synapseATP.some(a => a.target === v)) return;

  const a1 = random(TWO_PI);
  window.synapseH.push({
    x: v.x + cos(a1) * 36,
    y: v.y + sin(a1) * 36,
    vx: -cos(a1) * H_SPEED,
    vy: -sin(a1) * H_SPEED,
    target: v,
    life: H_LIFE
  });

  const a2 = random(TWO_PI);
  window.synapseATP.push({
    x: v.x + cos(a2) * 42,
    y: v.y + sin(a2) * 42,
    vx: -cos(a2) * ATP_SPEED,
    vy: -sin(a2) * ATP_SPEED,
    state: "ATP",
    alpha: 255,
    target: v,
    life: ATP_LIFE
  });
}


// -----------------------------------------------------
// MAIN UPDATE — CHEMISTRY ONLY
// -----------------------------------------------------
function updateVesicleLoading() {

  const vesicles = window.synapseVesicles;
  if (!Array.isArray(vesicles) || vesicles.length === 0) return;

  // ---------------------------------------------------
  // 🔒 HARD GUARD: EMPTY VESICLES MAY NOT TRAVEL LOADED
  // ---------------------------------------------------
  for (const v of vesicles) {
    if (
      v.state === VESICLE_STATE.LOADED_TRAVEL &&
      (!v.nts || v.nts.length === 0)
    ) {
      v.state     = VESICLE_STATE.EMPTY;
      v.primedH   = false;
      v.primedATP = false;
      v.nts       = [];
    }
  }

  // ---------------------------------------------------
  // BEGIN PRIMING (SERIAL)
  // ---------------------------------------------------
  if (!hasActiveLoadingVesicle()) {

    const next = vesicles.find(v => v.state === VESICLE_STATE.EMPTY);
    if (next) {
      next.state     = VESICLE_STATE.PRIMING;
      next.primedH   = false;
      next.primedATP = false;
      next.nts       = [];
      next.holdTimer = 0;
      spawnPrimingParticles(next);
    }
  }

  // ---------------------------------------------------
  // VESICLE-LOCAL CHEMISTRY
  // ---------------------------------------------------
  for (const v of vesicles) {

    // ---------------- PRIMING ----------------
    if (v.state === VESICLE_STATE.PRIMING) {

      spawnPrimingParticles(v);

      if (v.primedH && v.primedATP) {
        v.state = VESICLE_STATE.PRIMED;
      }
    }

    // ---------------- TRANSITION ----------------
    if (v.state === VESICLE_STATE.PRIMED) {
      v.state = VESICLE_STATE.LOADING;
      v.nts = [];
    }

    // ---------------- NT LOADING ----------------
    if (v.state === VESICLE_STATE.LOADING) {

      if (v.nts.length < NT_TARGET && random() < NT_RATE) {
        v.nts.push({
          x: random(-3, 3),
          y: random(-3, 3),
          vx: random(-0.18, 0.18),
          vy: random(-0.18, 0.18)
        });
      }

      if (v.nts.length >= NT_TARGET) {
        v.state     = VESICLE_STATE.LOADED_HOLD;
        v.holdTimer = 0;
      }
    }

    // ---------------- LOADED DWELL ----------------
    if (v.state === VESICLE_STATE.LOADED_HOLD) {

      v.holdTimer++;

      if (v.holdTimer >= LOADED_HOLD_FRAMES) {
        v.state = VESICLE_STATE.LOADED_TRAVEL;
      }
    }

    // ---------------- FINALIZE LOADING ----------------
    // Chemistry declares vesicle READY only once
    // it is physically inside the loaded pool
    if (
      v.state === VESICLE_STATE.LOADED_TRAVEL &&
      v.nts &&
      v.nts.length >= NT_TARGET &&
      typeof getLoadedPoolRect === "function"
    ) {

      const pool = getLoadedPoolRect();
      const r = v.radius;

      const insideLoaded =
        v.x - r >= pool.xMin &&
        v.x + r <= pool.xMax &&
        v.y - r >= pool.yMin &&
        v.y + r <= pool.yMax;

      if (insideLoaded) {
        v.state = VESICLE_STATE.LOADED;
        v.vx = 0;
        v.vy *= 0.5;
      }
    }

    // ---------------- NT JITTER ----------------
    for (const p of v.nts || []) {
      p.x += p.vx;
      p.y += p.vy;

      if (Math.hypot(p.x, p.y) > window.SYNAPSE_VESICLE_RADIUS - 3) {
        p.vx *= -1;
        p.vy *= -1;
      }
    }
  }

  updatePrimingParticles();
}


// -----------------------------------------------------
// CHEMOTACTIC HOMING
// -----------------------------------------------------
function applyHoming(p, target, gain) {

  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d  = Math.hypot(dx, dy) || 1;

  p.vx += (dx / d) * gain;
  p.vy += (dy / d) * gain;

  p.vx *= CHEMO_DAMPING;
  p.vy *= CHEMO_DAMPING;

  const speed = Math.hypot(p.vx, p.vy);
  if (speed > CHEMO_MAX_V) {
    p.vx *= CHEMO_MAX_V / speed;
    p.vy *= CHEMO_MAX_V / speed;
  }
}


// -----------------------------------------------------
// UPDATE PRIMING PARTICLES
// -----------------------------------------------------
function updatePrimingParticles() {

  const r = window.SYNAPSE_VESICLE_RADIUS;

  // --- H⁺ ---
  for (let i = window.synapseH.length - 1; i >= 0; i--) {

    const h = window.synapseH[i];
    const v = h.target;

    if (!v || v.state !== VESICLE_STATE.PRIMING) {
      window.synapseH.splice(i, 1);
      continue;
    }

    applyHoming(h, v, H_CHEMO_GAIN);
    h.x += h.vx;
    h.y += h.vy;
    h.life--;

    if (dist(h.x, h.y, v.x, v.y) < r * 0.85) {
      v.primedH = true;
      window.synapseH.splice(i, 1);
    }
  }

  // --- ATP → ADP + Pi ---
  for (let i = window.synapseATP.length - 1; i >= 0; i--) {

    const a = window.synapseATP[i];
    const v = a.target;

    if (!v || v.state === VESICLE_STATE.LOADED_TRAVEL) {
      window.synapseATP.splice(i, 1);
      continue;
    }

    applyHoming(a, v, ATP_CHEMO_GAIN);
    a.x += a.vx;
    a.y += a.vy;
    a.life--;

    if (a.state === "ATP" && dist(a.x, a.y, v.x, v.y) < r) {
      a.state = "ADP";
      v.primedATP = true;
      a.vx *= -ATP_BOUNCE;
      a.vy *= -ATP_BOUNCE;
    } else {
      a.alpha -= 0.8;
    }

    if (a.life <= 0 || a.alpha <= 0) {
      window.synapseATP.splice(i, 1);
    }
  }
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------
window.updateVesicleLoading = updateVesicleLoading;
