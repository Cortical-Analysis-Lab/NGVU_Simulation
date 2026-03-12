// =====================================================
// AXON PATH GEOMETRY — NEURON 1
// =====================================================
// Pure geometry.
// ❌ No drawing
// ❌ No signals
// ✔ Shared axon polyline for AP + myelin
// =====================================================

console.log("axonPath loaded");

// -----------------------------------------------------
// Build axon polyline from soma to terminal start
// -----------------------------------------------------
function buildAxonPath(neuron, samples = 80) {
  const path = [];

  const startX = neuron.somaRadius + neuron.hillock.length;
  const startY = 0;

  const c1x = neuron.somaRadius + 70;
  const c1y = 14;

  const c2x = neuron.somaRadius + 120;
  const c2y = -14;

  const endX = neuron.somaRadius + neuron.axon.length;
  const endY = 0;

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;

    const x = bezierPoint(
      startX,
      c1x,
      c2x,
      endX,
      t
    );

    const y = bezierPoint(
      startY,
      c1y,
      c2y,
      endY,
      t
    );

    path.push({ x, y, t });
  }

  return path;
}

// -----------------------------------------------------
// Attach to neuron object (called once after init)
// -----------------------------------------------------
function initAxonPath(neuron) {
  neuron.axon.path = buildAxonPath(neuron);
}

// -----------------------------------------------------
// Public API
// -----------------------------------------------------
window.initAxonPath = initAxonPath;
