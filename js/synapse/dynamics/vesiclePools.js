console.log("🧭 vesiclePools loaded — ELASTIC CONFINEMENT (AUTHORITATIVE)");

// =====================================================
// VESICLE POOLS — SPATIAL OWNERSHIP (AUTHORITATIVE)
// =====================================================
//
// RESPONSIBILITIES:
// ✔ Reserve pool (deep cytosol)
// ✔ Loaded pool (membrane-adjacent, NOT docked)
// ✔ Smooth reserve → loaded travel (force only)
// ✔ Elastic boundary confinement (NO integration)
//
// HARD RULES:
// • Pools NEVER integrate position
// • Pools NEVER apply damping
// • Pools ONLY apply corrective forces when violated
//
// =====================================================


// -----------------------------------------------------
// 🔧 TUNING KNOBS (GEOMETRY ONLY)
// -----------------------------------------------------

const MEMBRANE_GAP_FACTOR = -5;

const LOADED_POOL_WIDTH_FACTOR  = 3.0;
const LOADED_POOL_HEIGHT_FACTOR = 2.0;

const RESERVE_POOL_WIDTH = 75;
const RESERVE_POOL_HEIGHT_FACTOR = 0.9;


// -----------------------------------------------------
// ELASTIC WALL FORCE
// -----------------------------------------------------

const WALL_SPRING_K   = 0.12;   // penetration response
const MAX_POOL_SPEED = 0.45;   // safety cap


// -----------------------------------------------------
// INTERNAL CACHE
// -----------------------------------------------------

let _reserveCacheKey = null;
let _loadedCacheKey  = null;
let _reservePool = null;
let _loadedPool  = null;


// -----------------------------------------------------
// CACHE KEYS
// -----------------------------------------------------

function getReserveCacheKey() {
  return [
    window.SYNAPSE_VESICLE_STOP_X,
    window.SYNAPSE_BACK_OFFSET_X,
    window.SYNAPSE_TERMINAL_RADIUS
  ].join("|");
}

function getLoadedCacheKey() {
  return [
    window.SYNAPSE_VESICLE_STOP_X,
    window.SYNAPSE_VESICLE_RADIUS,
    window.SYNAPSE_TERMINAL_RADIUS,
    MEMBRANE_GAP_FACTOR,
    LOADED_POOL_WIDTH_FACTOR,
    LOADED_POOL_HEIGHT_FACTOR
  ].join("|");
}


// -----------------------------------------------------
// RESERVE POOL
// -----------------------------------------------------

function getReservePoolRect() {

  const key = getReserveCacheKey();
  if (_reservePool && _reserveCacheKey === key) return _reservePool;

  const cy    = window.SYNAPSE_TERMINAL_CENTER_Y;
  const R     = window.SYNAPSE_TERMINAL_RADIUS;
  const stopX = window.SYNAPSE_VESICLE_STOP_X;
  const back  = window.SYNAPSE_BACK_OFFSET_X;

  const HEIGHT = R * RESERVE_POOL_HEIGHT_FACTOR;

  const xMin = stopX + back;
  const xMax = xMin + RESERVE_POOL_WIDTH;

  _reserveCacheKey = key;
  _reservePool = {
    xMin,
    xMax,
    yMin: cy - HEIGHT,
    yMax: cy + HEIGHT
  };

  return _reservePool;
}


// -----------------------------------------------------
// LOADED POOL
// -----------------------------------------------------

function getLoadedPoolRect() {

  const key = getLoadedCacheKey();
  if (_loadedPool && _loadedCacheKey === key) return _loadedPool;

  const cy    = window.SYNAPSE_TERMINAL_CENTER_Y;
  const stopX = window.SYNAPSE_VESICLE_STOP_X;
  const rVes  = window.SYNAPSE_VESICLE_RADIUS;
  const rTerm = window.SYNAPSE_TERMINAL_RADIUS;

  const MEMBRANE_GAP = rVes * MEMBRANE_GAP_FACTOR;

  const WIDTH  = rVes * LOADED_POOL_WIDTH_FACTOR;
  const HEIGHT = rTerm * LOADED_POOL_HEIGHT_FACTOR;

  const xMax = stopX - MEMBRANE_GAP;
  const xMin = xMax - WIDTH;

  _loadedCacheKey = key;
  _loadedPool = {
    xMin,
    xMax,
    yMin: cy - HEIGHT * 0.5,
    yMax: cy + HEIGHT * 0.5
  };

  return _loadedPool;
}


// -----------------------------------------------------
// EMPTY VESICLE CREATION (ANTI-CLUSTER BIAS)
// -----------------------------------------------------

window.requestNewEmptyVesicle = function () {

    if (window.endocytosisSeeds && window.endocytosisSeeds.length > 0) {
    return;
  }
  const vesicles = window.synapseVesicles;
  if (!Array.isArray(vesicles)) return;
  if (vesicles.length >= window.SYNAPSE_MAX_VESICLES) return;

  const pool = getReservePoolRect();
  const r    = window.SYNAPSE_VESICLE_RADIUS;

  vesicles.push({
    x: random(pool.xMin + r, pool.xMax - r),
    y: random(pool.yMin + r, pool.yMax - r),

    vx: random(-0.03, 0.03),
    vy: random(-0.03, 0.03),

    radius: r,

    // static anti-alignment bias
    poolBiasX: random(-6, 6),
    poolBiasY: random(-8, 8),

    state: "EMPTY",
    primedH: false,
    primedATP: false,
    nts: [],

    releaseBias: false,
    recycleBias: false
  });
};


// -----------------------------------------------------
// RESERVE → LOADED ATTRACTION (FORCE ONLY)
// -----------------------------------------------------

function applyLoadedAttraction(v) {

  const r  = getLoadedPoolRect();
  const Rv = v.radius;

  const targetX = r.xMax - Rv + (v.poolBiasX ?? 0);
  v.vx += (targetX - v.x) * 0.005;
}


// -----------------------------------------------------
// ELASTIC BOUNDARY RESPONSE (NO INTEGRATION)
// -----------------------------------------------------

function confineToRect(v, r) {

  const R = v.radius;

  if (v.x - R < r.xMin) {
    v.vx += (r.xMin + R - v.x) * WALL_SPRING_K;
  }
  else if (v.x + R > r.xMax) {
    v.vx += (r.xMax - R - v.x) * WALL_SPRING_K;
  }

  if (v.y - R < r.yMin) {
    v.vy += (r.yMin + R - v.y) * WALL_SPRING_K;
  }
  else if (v.y + R > r.yMax) {
    v.vy += (r.yMax - R - v.y) * WALL_SPRING_K;
  }

  const speed = Math.hypot(v.vx, v.vy);
  if (speed > MAX_POOL_SPEED) {
    v.vx *= MAX_POOL_SPEED / speed;
    v.vy *= MAX_POOL_SPEED / speed;
  }
}


// -----------------------------------------------------
// MAIN UPDATE — FORCE APPLICATION ONLY
// -----------------------------------------------------

function updateVesiclePools() {

  const vesicles = window.synapseVesicles || [];
  if (!vesicles.length) return;

  const reserve = getReservePoolRect();
  const loaded  = getLoadedPoolRect();

  for (const v of vesicles) {

    if (v.releaseBias === true) continue;
    if (v.state === "DETACHED_FLOAT") continue;
    if (v.state === "RECYCLED_TRAVEL" && v.recycleBias === true) continue;


    if (v.state === "EMPTY") {

    if (v.recycleCooldown && v.recycleCooldown > 0) {
      v.recycleCooldown--;
    }
    else if (v.x < loaded.xMin + 14) {
      v.state = "LOADED_TRAVEL";
    }
  }


    if (v.state === "LOADED_TRAVEL") {
      applyLoadedAttraction(v);
      confineToRect(v, loaded);
    }
    else if (v.state === "LOADED") {
      confineToRect(v, loaded);
    }
    else {
      confineToRect(v, reserve);
    }
  }
}

window.updateVesiclePools = updateVesiclePools;
window.getReservePoolRect = getReservePoolRect;
window.getLoadedPoolRect = getLoadedPoolRect;


// =====================================================
// DEBUG VISUALIZATION
// =====================================================

window.SHOW_VESICLE_POOL_DEBUG = false;

window.drawVesiclePoolDebug = function () {

  if (!window.SHOW_VESICLE_POOL_DEBUG) return;

  const reserve = getReservePoolRect();
  const loaded  = getLoadedPoolRect();

  push();
  noFill();
  strokeWeight(2);

  stroke(80, 160, 255, 180);
  rect(
    reserve.xMin,
    reserve.yMin,
    reserve.xMax - reserve.xMin,
    reserve.yMax - reserve.yMin
  );

  stroke(40, 120, 220, 200);
  rect(
    loaded.xMin,
    loaded.yMin,
    loaded.xMax - loaded.xMin,
    loaded.yMax - loaded.yMin
  );

  stroke(255, 80, 80, 160);
  line(
    window.SYNAPSE_VESICLE_STOP_X,
    -400,
    window.SYNAPSE_VESICLE_STOP_X,
     400
  );

  pop();
};
