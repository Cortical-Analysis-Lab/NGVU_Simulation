// =====================================================
// HEMODYNAMICS — Cardiac + Vasomotion Signals
// =====================================================
// Diagnostic-safe signal generator
// Motion + coupling intentionally disabled
// Provides READ-ONLY cardiac phase & envelopes
// =====================================================

console.log("💓 hemodynamics loaded");

// -----------------------------------------------------
// PARAMETERS
// -----------------------------------------------------

let heartRate = 72;         // bpm
let vasomotionRate = 0.05; // Hz

let cardiacPhase = 0;      // 0 → 1
let vasoPhase    = 0;      // 0 → 1

let lastTime = 0;

// -----------------------------------------------------
// Update (called once per frame)
// -----------------------------------------------------

function updateHemodynamics() {
  const now = millis();
  const dt  = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime  = now;

  // normalized phases
  cardiacPhase = (cardiacPhase + dt * (heartRate / 60)) % 1;
  vasoPhase    = (vasoPhase + dt * vasomotionRate) % 1;
}

// -----------------------------------------------------
// CARDIAC PHASE (0 → 1)
// -----------------------------------------------------
// Single source of truth for heartbeat timing
// -----------------------------------------------------

function getCardiacPhase() {
  return cardiacPhase;
}

// -----------------------------------------------------
// SYSTOLIC ENVELOPE (0 → 1)
// -----------------------------------------------------
// Fast upstroke, slow decay
// Use this for:
//   - artery expansion
//   - blood advancement
// -----------------------------------------------------

function getSystolicEnvelope() {
  const p = cardiacPhase;

  if (p < 0.15) {
    // rapid systole
    return p / 0.15;
  } else {
    // diastolic decay
    return Math.exp(-(p - 0.15) * 5);
  }
}

// -----------------------------------------------------
// Vasomotion (0 → 1)
// -----------------------------------------------------

function getVasomotion() {
  return 0.5 + 0.5 * sin(TWO_PI * vasoPhase);
}

// -----------------------------------------------------
// Combined hemodynamic scaling (READ-ONLY)
// -----------------------------------------------------
// Existing consumers continue to work unchanged
// -----------------------------------------------------

function getHemodynamicScale() {
  return (
    1 +
    0.12 * getSystolicEnvelope() +
    0.08 * getVasomotion()
  );
}

// =====================================================
// REQUIRED MAIN LOOP HOOKS (NO-OP — BY DESIGN)
// =====================================================
// main.js expects these to exist.
// Logic will be added later, safely.
// =====================================================

function updateSupplyWaves() {
  // intentionally empty
}

function updatePressureWaves() {
  // intentionally empty
}

// -----------------------------------------------------
// GLOBAL EXPORTS
// -----------------------------------------------------

window.updateHemodynamics    = updateHemodynamics;

// Cardiac timing
window.getCardiacPhase       = getCardiacPhase;
window.getSystolicEnvelope   = getSystolicEnvelope;

// Legacy-compatible helpers
window.getCardiacPulse       = getSystolicEnvelope;
window.getVasomotion         = getVasomotion;
window.getHemodynamicScale  = getHemodynamicScale;

// Required hooks
window.updateSupplyWaves     = updateSupplyWaves;
window.updatePressureWaves   = updatePressureWaves;
