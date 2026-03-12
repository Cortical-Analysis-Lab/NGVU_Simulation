// =====================================================
// MYELINATED AXON ACTION POTENTIAL (CONTINUOUS + OCCLUDED)
// =====================================================
// ✔ Continuous electrical conduction
// ✔ Faster under myelin, slower at nodes
// ✔ Visible only at nodes
// ✔ Na⁺ influx triggered just BEFORE node
// ✔ K⁺ efflux triggered AT node
// ✔ Uses node.phase from geometry (NO guessing)
// ✔ Stable (no freezing, no NaN, no boundary stalls)
// =====================================================

console.log("⚡ myelinAP loaded");

// -----------------------------------------------------
// CONDUCTION SPEEDS (TEACHING-SAFE)
// -----------------------------------------------------
// NOTE: These MUST be slower than visual ion motion
const MYELIN_SPEED_NODE   = 0.008;
const MYELIN_SPEED_SHEATH = 0.02;

// Visible AP size
const AP_RADIUS = 10;

// -----------------------------------------------------
// ACTIVE MYELINATED APS
// -----------------------------------------------------
const myelinAPs = [];

// -----------------------------------------------------
// SPAWN AP AT AXON INITIAL SEGMENT (AIS)
// -----------------------------------------------------
function spawnMyelinAP() {

  if (!window.myelinEnabled) return;

  // Prevent unrealistically dense firing
  if (myelinAPs.length > 0) {
    const last = myelinAPs[myelinAPs.length - 1];
    if (last.phase < 0.06) return;
  }

  myelinAPs.push({
    phase: 0,
    lastPhase: 0,
    firedNa: new Set(),
    firedK:  new Set()
  });
}

// -----------------------------------------------------
// VISUAL-ONLY MYELIN OCCLUSION
// (midpoint between node phases)
// -----------------------------------------------------
function isPhaseUnderMyelin(phase) {

  const nodes = neuron?.axon?.nodes;
  if (!nodes || nodes.length < 2) return false;

  for (let i = 0; i < nodes.length - 1; i++) {

    const a = nodes[i].phase;
    const b = nodes[i + 1].phase;
    if (a == null || b == null) continue;

    const center = (a + b) * 0.5;
    const half   = (b - a) * 0.35;

    if (phase > center - half && phase < center + half) {
      return true;
    }
  }

  return false;
}

// -----------------------------------------------------
// UPDATE AP PROPAGATION + NODE EVENTS
// -----------------------------------------------------
function updateMyelinAPs() {

  const nodes = neuron?.axon?.nodes;
  if (!nodes || nodes.length === 0) return;

  for (let i = myelinAPs.length - 1; i >= 0; i--) {

    const ap = myelinAPs[i];
    ap.lastPhase = ap.phase;

    // -----------------------------
    // CONTINUOUS CONDUCTION
    // -----------------------------
    const underMyelin = isPhaseUnderMyelin(ap.phase);

    ap.phase += underMyelin
      ? MYELIN_SPEED_SHEATH
      : MYELIN_SPEED_NODE;

    // Clamp for numerical safety
    ap.phase = constrain(ap.phase, 0, 1);

    // -----------------------------
    // NODE-CROSSED DETECTION
    // -----------------------------
    for (let n = 0; n < nodes.length; n++) {

      const nodePhase = nodes[n].phase;
      if (nodePhase == null) continue;

      // 🔵 Na⁺ — just BEFORE node crossing
      if (
        ap.lastPhase < nodePhase &&
        ap.phase >= nodePhase &&
        !ap.firedNa.has(n)
      ) {
        ap.firedNa.add(n);
        triggerNodeNaInflux?.(n);
      }

      // 🟣 K⁺ — AT node (same crossing)
      if (
        ap.lastPhase < nodePhase &&
        ap.phase >= nodePhase &&
        !ap.firedK.has(n)
      ) {
        ap.firedK.add(n);
        triggerNodeKEfflux?.(n);
      }
    }

    // -----------------------------
    // TERMINAL HANDOFF
    // -----------------------------
    if (ap.phase >= AXON_TERMINAL_START) {
      spawnTerminalSpikes?.();
      myelinAPs.splice(i, 1);
      continue;
    }

    // Final cleanup
    if (ap.phase >= 1) {
      myelinAPs.splice(i, 1);
    }
  }
}

// -----------------------------------------------------
// DRAW AP (VISIBLE ONLY AT NODES)
// -----------------------------------------------------
function drawMyelinAPs() {

  myelinAPs.forEach(ap => {

    // Hide under myelin
    if (isPhaseUnderMyelin(ap.phase)) return;

    const p = getAxonPoint(ap.phase);
    if (!p) return;

    push();
    noStroke();
    fill(getColor("ap"));
    ellipse(p.x, p.y, AP_RADIUS, AP_RADIUS);
    pop();
  });
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.spawnMyelinAP    = spawnMyelinAP;
window.updateMyelinAPs = updateMyelinAPs;
window.drawMyelinAPs   = drawMyelinAPs;
