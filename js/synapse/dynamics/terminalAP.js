console.log("⚡ terminalAP loaded");

// =====================================================
// TERMINAL ACTION POTENTIAL (PRESYNAPTIC)
// =====================================================
//
// ✔ Local-space only
// ✔ Event-driven (no phase math)
// ✔ Visual + functional coupling
// ✔ Drives presynaptic highlight + Ca2+ channel activation
//
// NON-RESPONSIBILITIES:
// ✘ No vesicle motion
// ✘ No pool logic
// ✘ No geometry authority
// ✘ No lifecycle state changes
//
// =====================================================


// -----------------------------------------------------
// GLOBAL STATE (RELOAD SAFE)
// -----------------------------------------------------
window.terminalAP = window.terminalAP || {
  active: false,
  progress: 0,
  fired: false,
  apId: 0,
  apReleaseMode: {}
};

if (!window.terminalAP.apReleaseMode) {
  window.terminalAP.apReleaseMode = {};
}

// -----------------------------------------------------
// TUNING PARAMETERS
// -----------------------------------------------------
const AP_SPEED = 0.038;       // Slower traversal for educational readability
const AP_RADIUS_CORE = 10;
const AP_RADIUS_GLOW = 22;


// -----------------------------------------------------
// COLORS (PURE VISUAL)
// -----------------------------------------------------
const AP_CORE_COLOR = () => color(120, 255, 160);
const AP_GLOW_COLOR = () => color(120, 255, 160, 120);


// -----------------------------------------------------
// START TERMINAL AP
// -----------------------------------------------------
function triggerTerminalAP(options = {}) {
  const releaseMode =
    options.releaseMode === "single" ? "single" : "all";

  terminalAP.active   = true;
  terminalAP.progress = 0;
  terminalAP.fired    = false;
  terminalAP.apId     = (terminalAP.apId || 0) + 1;
  terminalAP.apReleaseMode[terminalAP.apId] = releaseMode;
  window.notePostSynapticStimulation?.();

  // Debug / UI compatibility ONLY
  window.apActive = true;
}


// -----------------------------------------------------
// UPDATE AP STATE
// -----------------------------------------------------
function updateTerminalAP(path) {

  if (!terminalAP.active) return;

  terminalAP.progress += AP_SPEED;

  if (terminalAP.progress >= 1) {
    terminalAP.progress = 1;
  }

  // ---------------------------------------------------
  // MARK AP ARRIVAL AT TERMINAL (Ca2+ coupling handled elsewhere)
  // ---------------------------------------------------
  if (
    terminalAP.progress >= 0.95 &&
    !terminalAP.fired
  ) {
    terminalAP.fired = true;
  }

  // ---------------------------------------------------
  // END AP
  // ---------------------------------------------------
  if (terminalAP.progress >= 1) {
    terminalAP.active = false;
    window.apActive = false; // debug only
  }
}


// -----------------------------------------------------
// DRAW AP PARTICLE ALONG PATH (READ-ONLY)
// -----------------------------------------------------
function drawTerminalAP(path) {

  if (!terminalAP.active) return;
  if (!Array.isArray(path) || path.length === 0) return;

  const idx = floor(terminalAP.progress * (path.length - 1));
  const p   = path[idx];

  push();
  noStroke();
  blendMode(ADD);

  // Glow
  fill(AP_GLOW_COLOR());
  circle(p.x, p.y, AP_RADIUS_GLOW);

  // Core
  fill(AP_CORE_COLOR());
  circle(p.x, p.y, AP_RADIUS_CORE);

  blendMode(BLEND);
  pop();
}


// -----------------------------------------------------
// PUBLIC EXPORTS
// -----------------------------------------------------
window.triggerTerminalAP = triggerTerminalAP;
window.updateTerminalAP  = updateTerminalAP;
window.drawTerminalAP    = drawTerminalAP;
