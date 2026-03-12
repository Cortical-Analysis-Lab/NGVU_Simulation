console.log("🫧 synapticBurst loaded — EMISSION + LIFETIME AUTHORITY");

// =====================================================
// SYNAPTIC NEUROTRANSMITTER BURST — ORCHESTRATOR
// =====================================================
//
// RESPONSIBILITIES:
// ✔ Receive synapticRelease events
// ✔ Emit NTs over time (streaming)
// ✔ Manage NT lifetime + alpha
// ✔ Delegate MOTION to NTmotion.js
// ✔ Delegate DRAWING to NTgeometry.js
//
// HARD RULES (ENFORCED):
// • NO geometry definitions
// • NO constraint logic
// • NO membrane math
// • NO position clamping
// • NO force definitions
// • NO integration math
//
// =====================================================


// -----------------------------------------------------
// STORAGE (RELOAD SAFE)
// -----------------------------------------------------
window.synapticNTs       = window.synapticNTs       || [];
window.activeNTEmitters = window.activeNTEmitters || [];


// -----------------------------------------------------
// EMISSION TUNING (TIME DOMAIN ONLY)
// -----------------------------------------------------
const NT_STREAM_DURATION_MIN = 16;
const NT_STREAM_DURATION_MAX = 28;

const NT_PER_FRAME_MIN = 1;
const NT_PER_FRAME_MAX = 2;

const NT_LIFE_MIN = 1100;
const NT_LIFE_MAX = 1400;


// -----------------------------------------------------
// RELEASE EVENT — ENTRY POINT FROM VESICLES
// -----------------------------------------------------
window.addEventListener("synapticRelease", (e) => {

  const { x, y, strength = 1, normalX = 1 } = e.detail || {};
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  const frames =
    Math.floor(
      random(NT_STREAM_DURATION_MIN, NT_STREAM_DURATION_MAX) * strength
    );

  window.activeNTEmitters.push({
    x,
    y,
    framesLeft: frames,
    normalX: Number.isFinite(normalX) ? normalX : 1,
    sweepPhase: random(TWO_PI)
  });

  if (window.SHOW_SYNAPSE_DEBUG) {
    console.log(
      "🟢 NT emitter created",
      { x: x.toFixed(1), y: y.toFixed(1), frames }
    );
  }
});


// -----------------------------------------------------
// NT FACTORY — STRUCTURE ONLY
// -----------------------------------------------------
//
// ✔ Spawns NTs INSIDE cleft
// ✔ Adds forward bias toward postsynapse
// ❌ No forces defined here
//
function makeNT(emitter) {

  const x = emitter.x;
  const y = emitter.y;
  const facing = emitter.normalX >= 0 ? 1 : -1;
  const baseTheta = facing > 0 ? 0 : PI;
  const spread = radians(86);
  const sweep = Math.sin(emitter.sweepPhase) * spread;
  const theta = baseTheta + sweep + random(-0.24, 0.24);
  const speed = random(0.045, 0.13);
  emitter.sweepPhase += random(0.45, 0.95);

  const life = random(NT_LIFE_MIN, NT_LIFE_MAX);
  const vesicleR =
    Math.max(2, (window.SYNAPSE_VESICLE_RADIUS ?? 10) - (window.NT_RADIUS ?? 2.4));

  return {
    // Start just inside the fusing vesicle side, not on the membrane edge.
    x: x - facing * random(5, 12),
    y: y + random(-12, 12),

    // Seed a cone-shaped plume so NTs splay out from release site.
    vx: cos(theta) * speed,
    vy: sin(theta) * speed,

    // Let particles emerge from vesicle interior before cleft-only confinement.
    cleftDelay: Math.floor(random(4, 8)),
    releaseDirX: facing,
    releaseRamp: Math.floor(random(8, 14)),
    vesicleX: x,
    vesicleY: y,
    vesicleR,
    vesicleContain: Math.floor(random(5, 9)),

    // Lifetime state
    life,
    maxLife: life,
    alpha: 255
  };
}


// -----------------------------------------------------
// MAIN UPDATE — EMISSION + MOTION DELEGATION + LIFETIME
// -----------------------------------------------------
function updateSynapticBurst() {

  const nts      = window.synapticNTs;
  const emitters = window.activeNTEmitters;

  // ---------------------------------------------------
  // 1️⃣ EMIT NTs (TIME-BASED STREAMING)
  // ---------------------------------------------------
  for (let i = emitters.length - 1; i >= 0; i--) {

    const e = emitters[i];
    const count = Math.floor(
      random(NT_PER_FRAME_MIN, NT_PER_FRAME_MAX + 1)
    );

    for (let k = 0; k < count; k++) {
      nts.push(makeNT(e));
    }

    if (--e.framesLeft <= 0) {
      emitters.splice(i, 1);
    }
  }

  if (!nts.length) return;

  // ---------------------------------------------------
  // 2️⃣ MOTION (DELEGATED — SINGLE AUTHORITY)
  // ---------------------------------------------------
  //
  // 🔑 NTmotion.js owns ALL physics + integration
  //
  if (typeof window.updateNTMotion === "function") {
    window.updateNTMotion(nts);
  }

  // ---------------------------------------------------
  // 3️⃣ LIFETIME + ALPHA (OWNED HERE)
  // ---------------------------------------------------
  for (let i = nts.length - 1; i >= 0; i--) {

    const p = nts[i];
    p.life--;

    p.alpha = map(
      p.life,
      0,
      NT_LIFE_MAX,
      0,
      255,
      true
    );

    if (p.life <= 0) {
      nts.splice(i, 1);
    }
  }
}


// -----------------------------------------------------
// DRAW — PURE GEOMETRY DELEGATION
// -----------------------------------------------------
function drawSynapticBurst() {

  if (!window.synapticNTs.length) return;
  if (typeof window.drawNTGeometry !== "function") return;

  window.drawNTGeometry(window.synapticNTs);
}


// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.updateSynapticBurst = updateSynapticBurst;
window.drawSynapticBurst   = drawSynapticBurst;


// -----------------------------------------------------
// 🔒 CONTRACT ASSERTION
// -----------------------------------------------------
if (window.DEBUG_SYNapseContracts) {
  console.log("🔒 synapticBurst contract: EMISSION + LIFETIME ONLY");
}
