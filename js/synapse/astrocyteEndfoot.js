console.log("🟪 astrocyteEndfoot loaded — CONSTRAINT AUTHORITY");

// =====================================================
// ASTROCYTE ENDFOOT — MEMBRANE INTERACTION LAYER
// =====================================================
//
// ROLE (ANALOGOUS TO preSynapse.js):
// ✔ Applies astrocyte membrane constraints
// ✔ Uses geometry from astrocyteSynapse.js
// ✔ FORCE / CLAMP ONLY — NO integration
// ✔ NO geometry definition
// ✔ NO NT creation or decay
//
// HARD RULES:
// • Does NOT update position history
// • Does NOT apply drift
// • Does NOT spawn slabs
// • Does NOT own NT motion
//
// =====================================================


// =====================================================
// 🔧 TUNING — ELASTIC RESPONSE (BIOLOGICAL)
// =====================================================

// How strongly NTs are pushed back out of astrocyte
const ASTRO_MEMBRANE_SPRING_K = 0.18;

// Tangential damping along membrane
const ASTRO_MEMBRANE_DAMPING = 0.94;

// Safety cap (prevents numerical explosions)
const ASTRO_MAX_RESPONSE = 0.9;

// Bounce restitution against astrocyte membrane
const ASTRO_BOUNCE_RESTITUTION = 0.92;


// =====================================================
// 🔑 ASTROCYTE CONSTRAINT — FORCE ONLY
// =====================================================
//
// This function is CALLED by NT motion code.
// It NEVER integrates position.
// It NEVER applies global logic.
//
// Input:
// • p      → NT particle (x, y, vx, vy)
// • prevY  → previous y position (for crossing logic)
//
// =====================================================
window.applyAstrocyteConstraint = function (p, prevY) {

  if (!p) return;
  if (typeof window.getAstrocyteMembraneY !== "function") return;

  const yMem = window.getAstrocyteMembraneY(p.x);
  if (yMem === null) return;

  const sampleDx = 1.5;
  const yL = window.getAstrocyteMembraneY(p.x - sampleDx);
  const yR = window.getAstrocyteMembraneY(p.x + sampleDx);
  const dydx =
    (Number.isFinite(yL) && Number.isFinite(yR))
      ? (yR - yL) / (2 * sampleDx)
      : 0;

  // Tangent [1, dydx], normal candidates [-dydx, 1] and [dydx, -1].
  // Keep the one pointing DOWNWARD into allowed space.
  let nx = -dydx;
  let ny = 1;
  const nLen = Math.hypot(nx, ny) || 1;
  nx /= nLen;
  ny /= nLen;

  // -----------------------------------------------
  // HALF-SPACE DEFINITION
  //
  // Astrocyte is ABOVE membrane (smaller Y in p5)
  // Allowed region: y >= yMem
  // -----------------------------------------------

  const penetration = yMem - p.y;

  // -----------------------------------------------
  // CASE 1: NT has crossed INTO astrocyte
  // -----------------------------------------------
  if (penetration > 0) {

    // --- positional correction onto membrane ---
    p.y = yMem;

    // --- elastic response (force only) ---
    p.vx += nx * penetration * ASTRO_MEMBRANE_SPRING_K;
    p.vy += ny * penetration * ASTRO_MEMBRANE_SPRING_K;

    // --- reflect inward velocity component ---
    const vN = p.vx * nx + p.vy * ny;
    if (vN < 0) {
      p.vx -= (1 + ASTRO_BOUNCE_RESTITUTION) * vN * nx;
      p.vy -= (1 + ASTRO_BOUNCE_RESTITUTION) * vN * ny;
    }

    // --- tangential damping ---
    p.vx *= ASTRO_MEMBRANE_DAMPING;
    p.vy *= ASTRO_MEMBRANE_DAMPING;

  }

  // -----------------------------------------------
  // CASE 2: NT crossed membrane this frame
  // (used for logging / future uptake logic)
  // -----------------------------------------------
  else if (prevY >= yMem && p.y < yMem) {

    // Snap exactly to membrane
    p.y = yMem;

    const vN = p.vx * nx + p.vy * ny;
    if (vN < 0) {
      p.vx -= (1 + ASTRO_BOUNCE_RESTITUTION) * vN * nx;
      p.vy -= (1 + ASTRO_BOUNCE_RESTITUTION) * vN * ny;
    }
    p.vx *= ASTRO_MEMBRANE_DAMPING;
    p.vy *= ASTRO_MEMBRANE_DAMPING;
  }

  // -----------------------------------------------
  // SAFETY CAP
  // -----------------------------------------------
  const speed = Math.hypot(p.vx, p.vy);
  if (speed > ASTRO_MAX_RESPONSE) {
    p.vx *= ASTRO_MAX_RESPONSE / speed;
    p.vy *= ASTRO_MAX_RESPONSE / speed;
  }
};


// =====================================================
// 🟦 DEBUG DRAW — ASTROCYTE RESPONSE NORMALS
// =====================================================
//
// Visualizes direction of constraint force
// DOES NOT affect physics
//
window.drawAstrocyteEndfootDebug = function () {

  if (!window.DEBUG_ASTROCYTE?.enabled) return;
  if (typeof window.getAstrocyteMembraneY !== "function") return;

  const step = window.DEBUG_ASTROCYTE.sampleStep ?? 8;
  const len  = 12;

  push();
  stroke(160, 200, 255, 160);
  strokeWeight(1);

  for (let x = window.ASTRO_X_MIN; x <= window.ASTRO_X_MAX; x += step) {

    const y = window.getAstrocyteMembraneY(x);
    if (y === null) continue;

    // Normal points DOWNWARD (allowed space)
    line(x, y, x, y + len);
  }

  pop();
};


// =====================================================
// 🔒 CONTRACT ASSERTION
// =====================================================
if (window.DEBUG_SYNapseContracts) {
  console.log("🔒 astrocyteEndfoot contract: FORCE-ONLY, NO INTEGRATION");
}
