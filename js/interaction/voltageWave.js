console.log("⚡ voltageWave interaction loaded (DEBUG DOT MODE)");

// =====================================================
// GLOBAL AP STATE (EXPLICIT & SAFE)
// =====================================================
window.apActive   = false;
window.apPhase    = 0;
window.apSpeed    = 0.04;
window.apDuration = 1.2;
window.apTimer    = 0;

// =====================================================
// KEY HANDLER BRIDGE (CALLED BY CENTRAL keyPressed)
// =====================================================
function handleVoltageWaveKeyPressed(evt) {
  if (key !== " ") return false;

  if (evt) {
    evt.preventDefault?.();
    evt.stopPropagation?.();
  }

  if (typeof state !== "undefined" && state.mode !== "synapse") {
    return false;
  }

  if (window.apActive) return false;

  window.apActive = true;
  window.apPhase  = 0;
  window.apTimer  = 0;

  console.log("⚡ Presynaptic AP triggered");
  return true;
}

// =====================================================
// UPDATE — ADVANCE AP TIMER (CALLED FROM SynapseView)
// =====================================================
function updateVoltageWave() {
  if (!window.apActive) return;

  window.apPhase += window.apSpeed;
  window.apTimer += window.apSpeed;

  if (window.apTimer >= window.apDuration) {
    window.apActive = false;
    window.apPhase  = 0;
    window.apTimer  = 0;
  }
}

// =====================================================
// DEBUG DOT RENDERING (STATIC POSITIONS)
// =====================================================
function drawVoltageWave(path) {

  if (
    !window.apActive ||
    !Array.isArray(path) ||
    path.length === 0
  ) return;

  push();
  noStroke();
  blendMode(ADD);

  const pulse = 0.5 + 0.5 * sin(frameCount * 0.25);
  const alpha = lerp(80, 220, pulse);
  const radius = lerp(4, 8, pulse);

  for (const p of path) {
    // Halo
    fill(80, 255, 120, alpha * 0.35);
    circle(p.x, p.y, radius * 3);

    // Core
    fill(120, 255, 160, alpha);
    circle(p.x, p.y, radius);
  }

  blendMode(BLEND);
  pop();
}

window.handleVoltageWaveKeyPressed = handleVoltageWaveKeyPressed;
