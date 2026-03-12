// =====================================================
// BACKGROUND ECS IONS — STATIC CONTEXT (EXCLUSION-AWARE)
// =====================================================
console.log("🧂 backgroundIons loaded");

// -----------------------------------------------------
// GLOBAL ECS CONTAINER (RELOAD-SAFE)
// -----------------------------------------------------
window.ecsIons = window.ecsIons || {};
ecsIons.Na = ecsIons.Na || [];
ecsIons.K  = ecsIons.K  || [];

// -----------------------------------------------------
// VISUAL CONSTANTS
// -----------------------------------------------------
const ECS_ION_COUNTS = { Na: 380, K: 240 };

const ION_TEXT_SIZE_NA = 10;
const ION_TEXT_SIZE_K  = 11;

// -----------------------------------------------------
// EXCLUSION CONSTANTS
// -----------------------------------------------------
const ARTERY_EXCLUSION_RADIUS = 80; // lumen + wall + buffer
const TRACE_PADDING = 10;

// -----------------------------------------------------
// Utility — point near artery?
// -----------------------------------------------------
function isInsideArteryExclusion(x, y) {
  if (!window.arteryPath || arteryPath.length === 0) return false;

  for (let i = 0; i < arteryPath.length; i++) {
    const p = arteryPath[i];
    const d = dist(x, y, p.x, p.y);
    if (d < ARTERY_EXCLUSION_RADIUS) return true;
  }
  return false;
}

// -----------------------------------------------------
// Utility — inside voltage trace box?
// (Matches voltageTrace.js exactly)
// -----------------------------------------------------
function isInsideVoltageTrace(x, y) {

  const x0 = neuron.somaRadius * 0.6;
  const y0 = neuron.somaRadius + 50;

  const traceWidth  = 200;
  const traceHeight = 85;

  return (
    x > x0 - TRACE_PADDING &&
    x < x0 + traceWidth + TRACE_PADDING &&
    y > y0 - TRACE_PADDING &&
    y < y0 + traceHeight + TRACE_PADDING
  );
}

// -----------------------------------------------------
// VALID SPAWN TEST
// -----------------------------------------------------
function isValidECSLocation(x, y) {
  return (
    !isInsideArteryExclusion(x, y) &&
    !isInsideVoltageTrace(x, y)
  );
}

// -----------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------
function initBackgroundIons() {

  // Clear without breaking references
  ecsIons.Na.length = 0;
  ecsIons.K.length  = 0;

  const bounds = {
    xmin: -width * 0.9,
    xmax:  width * 0.9,
    ymin: -height * 0.9,
    ymax:  height * 0.9
  };

  function spawn(type) {
    let tries = 0;
    while (tries < 1000) {
      const x = random(bounds.xmin, bounds.xmax);
      const y = random(bounds.ymin, bounds.ymax);

      if (isValidECSLocation(x, y)) {
        ecsIons[type].push({ x, y });
        return;
      }
      tries++;
    }
  }

  for (let i = 0; i < ECS_ION_COUNTS.Na; i++) spawn("Na");
  for (let i = 0; i < ECS_ION_COUNTS.K;  i++) spawn("K");
}

// -----------------------------------------------------
// DRAW
// -----------------------------------------------------
function drawBackgroundIons() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();

  textSize(ION_TEXT_SIZE_NA);
  fill(getColor("sodium", 120));
  ecsIons.Na.forEach(p => text("Na⁺", p.x, p.y));

  textSize(ION_TEXT_SIZE_K);
  fill(getColor("potassium", 130));
  ecsIons.K.forEach(p => text("K⁺", p.x, p.y));

  pop();
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.initBackgroundIons  = initBackgroundIons;
window.drawBackgroundIons = drawBackgroundIons;
