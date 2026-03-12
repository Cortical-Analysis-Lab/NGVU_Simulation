// =====================================================
// PRESYNAPTIC → POSTSYNAPTIC COUPLING (CHEMICAL)
// =====================================================
console.log("synapseCoupling loaded");

// -----------------------------------------------------
// Parameters (visual timing, not physiological scale)
// -----------------------------------------------------
const SYNAPTIC_DELAY        = 15;  // AP → vesicle fusion
const CLEFT_DIFFUSION_DELAY = 10;  // vesicle → receptor binding
const RELEASE_PROB          = 0.9; // probabilistic release

// -----------------------------------------------------
// Pending delayed synaptic events
// -----------------------------------------------------
const pendingReleases = [];

// -----------------------------------------------------
// 🔑 Active synaptic clefts (for astrocyte targeting)
// -----------------------------------------------------
window.activeSynapticClefts = window.activeSynapticClefts || [];

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
function getBoutonAmplitude(bouton) {
  const br =
    (bouton && typeof bouton.boutonRadius === "number")
      ? bouton.boutonRadius
      : 6;

  // Map bouton size to PSP amplitude range
  return constrain(map(br, 4, 10, 10, 26), 6, 30);
}

function findNearestPostsynapticTarget(bouton) {
  let target = null;
  let targetNeuron = null;
  let minDist = Infinity;

  // ---- neuron 2 (excitatory) ----
  if (neuron2?.synapses?.length) {
    neuron2.synapses.forEach(s => {
      const d = dist(bouton.x, bouton.y, s.x, s.y);
      if (d < minDist) {
        minDist = d;
        target = s;
        targetNeuron = "neuron2";
      }
    });
  }

  // ---- neuron 3 (inhibitory interneuron) ----
  if (neuron3?.synapses?.length) {
    neuron3.synapses.forEach(s => {
      const d = dist(bouton.x, bouton.y, s.x, s.y);
      if (d < minDist) {
        minDist = d;
        target = s;
        targetNeuron = "neuron3";
      }
    });
  }

  return { target, targetNeuron };
}

// -----------------------------------------------------
// Called by axonSpike.js when AP reaches bouton
// -----------------------------------------------------
function triggerSynapticRelease(bouton) {

  if (!bouton) return;
  if (random() > RELEASE_PROB) return;

  const hit = findNearestPostsynapticTarget(bouton);
  if (!hit.target) return;

  // =====================================================
  // 🟡 NEURAL LOG — neurotransmitter release
  // =====================================================
  if (
    !state.paused &&
    typeof logEvent === "function"
  ) {
    logEvent(
      "neural",
      "Neurotransmitter released into synaptic cleft",
      "synapse"
    );
  }

  // =====================================================
  // 🔑 Register synaptic cleft midpoint
  // (bouton ↔ postsynapse)
  // =====================================================
  const cleftX = (bouton.x + hit.target.x) * 0.5;
  const cleftY = (bouton.y + hit.target.y) * 0.5;

  window.activeSynapticClefts.push({
    x: cleftX,
    y: cleftY,
    life: 60   // frames astrocyte can target this cleft
  });

  pendingReleases.push({
    bouton,
    synapse: hit.target,
    targetNeuron: hit.targetNeuron,
    timer: SYNAPTIC_DELAY,
    phase: "release"
  });
}

// -----------------------------------------------------
// Update delayed chemical transmission
// -----------------------------------------------------
function updateSynapticCoupling() {

  for (let i = pendingReleases.length - 1; i >= 0; i--) {
    const e = pendingReleases[i];
    e.timer--;

    // ----------------------------
    // Vesicle fusion
    // ----------------------------
    if (e.timer <= 0 && e.phase === "release") {

      if (typeof spawnVesicleBurst === "function") {
        spawnVesicleBurst(e.bouton, e.synapse);
      }

      e.phase = "psp";
      e.timer = CLEFT_DIFFUSION_DELAY;
    }

    // ----------------------------
    // Postsynaptic effect
    // ----------------------------
    else if (e.timer <= 0 && e.phase === "psp") {

      spawnPostsynapticPSP(e.synapse, e.targetNeuron, e.bouton);
      pendingReleases.splice(i, 1);
    }
  }

  // =====================================================
  // 🔑 Decay synaptic cleft markers
  // =====================================================
  for (let i = window.activeSynapticClefts.length - 1; i >= 0; i--) {
    window.activeSynapticClefts[i].life--;
    if (window.activeSynapticClefts[i].life <= 0) {
      window.activeSynapticClefts.splice(i, 1);
    }
  }
}

// -----------------------------------------------------
// Spawn PSP on correct target
// -----------------------------------------------------
function spawnPostsynapticPSP(synapse, targetNeuron, bouton) {

  // ----------------------------
  // Neuron 2: EPSP → dendrite → soma
  // ----------------------------
  if (targetNeuron === "neuron2") {

    if (
      !state.paused &&
      typeof logEvent === "function"
    ) {
      logEvent(
        "neural",
        "Excitatory signal propagates toward postsynaptic neuron",
        "dendrite"
      );
    }

    if (typeof spawnNeuron2EPSP === "function") {
      spawnNeuron2EPSP(synapse);
    }
    triggerAstrocyteBorderGlow?.();
    return;
  }

  // ----------------------------
  // Neuron 3: interneuron IPSP
  // ----------------------------
  if (targetNeuron === "neuron3") {

    if (
      !state.paused &&
      typeof logEvent === "function"
    ) {
      logEvent(
        "neural",
        "Inhibitory signal suppresses downstream firing",
        "interneuron"
      );
    }

    if (typeof spawnNeuron3IPSP === "function") {
      spawnNeuron3IPSP(synapse);
    }
    triggerAstrocyteBorderGlow?.();
  }
}
