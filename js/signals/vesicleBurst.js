// =====================================================
// SYNAPTIC VESICLE BURST (PRESYNAPTIC → POSTSYNAPTIC)
// =====================================================
console.log("🫧 vesicleBurst loaded");

// -----------------------------------------------------
// Parameters
// -----------------------------------------------------
const VESICLE_LIFETIME = 36;
const VESICLE_SPEED   = 0.7;
const VESICLE_SPREAD  = 0.35;   // angular jitter
const VESICLE_RADIUS  = 4;

// -----------------------------------------------------
// Active vesicles
// -----------------------------------------------------
const vesicles = [];

// -----------------------------------------------------
// Spawn vesicles biased toward postsynapse
// -----------------------------------------------------
function spawnVesicleBurst(bouton, postsynaptic) {

  // --------------------------------------------------
  // 🔑 ASTROCYTE RESPONSE (ONCE PER BURST)
// --------------------------------------------------
  if (typeof triggerAstrocyteResponse === "function") {
    triggerAstrocyteResponse();

    // 🟣 GLIAL LOG (educational, non-spammy)
    if (!state.paused && typeof logEvent === "function") {
      logEvent(
        "glial",
        "Astrocyte detected neurotransmitter release at tripartite synapse",
        "astrocyte"
      );
    }
  }

  // --------------------------------------------------
  // Backward compatibility
  // --------------------------------------------------
  if (arguments.length === 2) {
    // OK
  } else if (arguments.length === 1 && bouton?.x !== undefined) {
    postsynaptic = neuron2?.synapses?.[0];
  } else {
    return;
  }

  if (!bouton || !postsynaptic) return;

  const count = floor(random(10, 16));

  // --------------------------------------------------
  // Direction vector toward postsynaptic density
  // --------------------------------------------------
  const dx = postsynaptic.x - bouton.x;
  const dy = postsynaptic.y - bouton.y;
  const mag = sqrt(dx * dx + dy * dy) || 1;

  const ux = dx / mag;
  const uy = dy / mag;

  // --------------------------------------------------
  // Spawn vesicles
  // --------------------------------------------------
  for (let i = 0; i < count; i++) {

    const jitterX = random(-VESICLE_SPREAD, VESICLE_SPREAD);
    const jitterY = random(-VESICLE_SPREAD, VESICLE_SPREAD);

    vesicles.push({
      x: bouton.x,
      y: bouton.y,

      vx: (ux + jitterX) * VESICLE_SPEED,
      vy: (uy + jitterY) * VESICLE_SPEED,

      life: VESICLE_LIFETIME
    });
  }
}

// -----------------------------------------------------
// Update vesicles (diffusion + decay)
// -----------------------------------------------------
function updateVesicles() {
  for (let i = vesicles.length - 1; i >= 0; i--) {
    const v = vesicles[i];

    v.x += v.vx;
    v.y += v.vy;
    v.life--;

    // Gentle damping
    v.vx *= 0.95;
    v.vy *= 0.95;

    if (v.life <= 0) {
      vesicles.splice(i, 1);
    }
  }
}

// -----------------------------------------------------
// Draw vesicles (synaptic cleft)
// -----------------------------------------------------
function drawVesicles() {
  vesicles.forEach(v => {
    const alpha = map(v.life, 0, VESICLE_LIFETIME, 40, 200);

    push();
    noStroke();
    fill(getColor("vesicle", alpha));
    ellipse(v.x, v.y, VESICLE_RADIUS, VESICLE_RADIUS);
    pop();
  });
}
