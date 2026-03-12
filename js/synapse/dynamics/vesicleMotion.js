console.log("🫧 vesicleMotion loaded — elastic floating");

// =====================================================
// VESICLE MOTION — MICRODYNAMICS (POOL-COMPATIBLE)
// =====================================================
//
// ✔ Brownian drift (energy injection)
// ✔ Elastic collisions (EMPTY + LOADED)
// ✔ Gentle damping (velocity-preserving)
// ✔ State-aware motion scaling
//
// OWNERSHIP:
// • Disabled during release
// • Disabled during recycling
// • Pools handle confinement ONLY
//
// =====================================================


// -----------------------------------------------------
// 🔧 TUNING — BIOLOGICALLY CALM BUT VISIBLE
// -----------------------------------------------------

// Brownian noise (energy source)
const THERMAL_RESERVE = 0.040;
const THERMAL_LOADED  = 0.020;

// Drag (must be weaker than noise)
const DRAG = 0.992;

// Collision impulse
const COLLISION_PUSH_RESERVE = 0.080;
const COLLISION_PUSH_LOADED  = 0.040;

// Prevent numerical freeze
const MIN_V = 0.001;


// -----------------------------------------------------
// APPLY BROWNIAN MOTION
// -----------------------------------------------------
function applyBrownian(v) {

  if (v.releaseBias || v.recycleBias) return;

  const scale =
    v.state === "LOADED_TRAVEL" ? THERMAL_LOADED * 0.4 :
    v.state === "LOADED"        ? THERMAL_LOADED :
                                  THERMAL_RESERVE;

  v.vx += random(-scale, scale);
  v.vy += random(-scale, scale);

  if (Math.abs(v.vx) < MIN_V) v.vx += random(-MIN_V, MIN_V);
  if (Math.abs(v.vy) < MIN_V) v.vy += random(-MIN_V, MIN_V);
}


// -----------------------------------------------------
// COLLISIONS — EMPTY + LOADED
// -----------------------------------------------------
function resolveCollisions(vesicles) {

  for (let i = 0; i < vesicles.length; i++) {

    const a = vesicles[i];
    if (a.releaseBias || a.recycleBias) continue;
    if (a.state !== "EMPTY" && a.state !== "LOADED") continue;

    for (let j = i + 1; j < vesicles.length; j++) {

      const b = vesicles[j];
      if (b.releaseBias || b.recycleBias) continue;
      if (b.state !== a.state) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d  = Math.hypot(dx, dy);
      const min = a.radius + b.radius;

      if (d > 0 && d < min) {

        const nx = dx / d;
        const ny = dy / d;
        const overlap = (min - d) * 0.5;

        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        const push =
          a.state === "LOADED"
            ? COLLISION_PUSH_LOADED
            : COLLISION_PUSH_RESERVE;

        a.vx -= nx * push;
        a.vy -= ny * push;
        b.vx += nx * push;
        b.vy += ny * push;
      }
    }
  }
}


// -----------------------------------------------------
// INTEGRATION
// -----------------------------------------------------
function integrate(v) {

  if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) {
    v.vx = 0;
    v.vy = 0;
    return;
  }

  v.vx *= DRAG;
  v.vy *= DRAG;

  v.x += v.vx;
  v.y += v.vy;
}


// -----------------------------------------------------
// MAIN UPDATE — FLOATING FIRST
// -----------------------------------------------------
function updateVesicleMotion() {

  const vesicles = window.synapseVesicles;
  if (!Array.isArray(vesicles)) return;

  // 1️⃣ Brownian energy
  for (const v of vesicles) {
    applyBrownian(v);
  }

  // 2️⃣ Collisions (spatial separation)
  resolveCollisions(vesicles);

  // 3️⃣ Integrate (retain inertia)
  for (const v of vesicles) {
    if (!v.releaseBias && !v.recycleBias) {
      integrate(v);
    }
  }
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------
window.updateVesicleMotion = updateVesicleMotion;
