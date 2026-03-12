// =====================================================
// MYELIN GEOMETRY — TRUE SHEATHS + NODES OF RANVIER
// =====================================================
// ✔ Sheaths are primary geometry
// ✔ Nodes are TRUE gaps between sheaths
// ✔ First node at axon initial segment (AIS)
// ✔ Node phase computed from TRUE path distance
// ✔ Sheaths restricted to MID-AXON region
// ✔ Passive debug dots at sheath midpoints
// ✔ NO user interaction
// =====================================================

console.log("myelinGeometry loaded");

// -----------------------------------------------------
// TEACHING PARAMETERS
// -----------------------------------------------------
const SHEATH_LENGTH = 14; // px (visual only)
const NODE_LENGTH   = 28; // px (visual only)

// Fractional region of axon that is myelinated
const MYELIN_START_FRACTION = 0.12; // after AIS
const MYELIN_END_FRACTION   = 0.82; // before terminals

// Debug dot offset (normal to axon)
const DEBUG_DOT_OFFSET = 6;

// -----------------------------------------------------
// Generate myelin geometry from axon path
// -----------------------------------------------------
function generateMyelinGeometry(axonPath) {

  if (!axonPath || axonPath.length < 2) {
    return { sheaths: [], nodes: [] };
  }

  const sheaths = [];
  const nodes   = [];

  // -----------------------------------------------
  // PRECOMPUTE CUMULATIVE PATH LENGTH
  // -----------------------------------------------
  const cumulative = [0];
  let totalLen = 0;

  for (let i = 0; i < axonPath.length - 1; i++) {
    const a = axonPath[i];
    const b = axonPath[i + 1];
    totalLen += dist(a.x, a.y, b.x, b.y);
    cumulative.push(totalLen);
  }

  // -----------------------------------------------
  // WALK PATH IN TRUE PHYSICAL BLOCKS
  // -----------------------------------------------
  let nextDistance  = 0;
  let placingSheath = false; // 🔑 START WITH NODE AT AIS

  for (let i = 0; i < axonPath.length - 1; i++) {

    const p1 = axonPath[i];
    const p2 = axonPath[i + 1];

    const segStart = cumulative[i];
    const segEnd   = cumulative[i + 1];
    const segLen   = segEnd - segStart;

    while (nextDistance < segEnd) {

      const blockLen = placingSheath ? SHEATH_LENGTH : NODE_LENGTH;
      const blockEnd = nextDistance + blockLen;

      if (blockEnd > segEnd) break;

      const t0 = (nextDistance - segStart) / segLen;
      const t1 = (blockEnd     - segStart) / segLen;

      const x0 = lerp(p1.x, p2.x, t0);
      const y0 = lerp(p1.y, p2.y, t0);
      const x1 = lerp(p1.x, p2.x, t1);
      const y1 = lerp(p1.y, p2.y, t1);

      const centerDist  = (nextDistance + blockEnd) * 0.5;
      const centerPhase = centerDist / totalLen;

      if (placingSheath) {

        // -----------------------------
        // MYELIN SHEATH (MID-AXON ONLY)
        // -----------------------------
        if (
          centerPhase > MYELIN_START_FRACTION &&
          centerPhase < MYELIN_END_FRACTION
        ) {
          sheaths.push({ x0, y0, x1, y1 });
        }

      } else {

        // -----------------------------
        // NODE OF RANVIER (TRUE GAP)
        // -----------------------------
        const cx = (x0 + x1) * 0.5;
        const cy = (y0 + y1) * 0.5;

        nodes.push({
          x: cx,
          y: cy,
          phase: nextDistance / totalLen,
          isFirst: nodes.length === 0
        });
      }

      placingSheath = !placingSheath;
      nextDistance += blockLen;
    }
  }

  return { sheaths, nodes };
}

// -----------------------------------------------------
// DEBUG DRAW — SHEATH MIDPOINT DOTS (PASSIVE)
// -----------------------------------------------------
function drawMyelinSheathDebugDots() {

  const sheaths = neuron?.axon?.sheaths;
  if (!sheaths || sheaths.length === 0) return;

  push();
  noStroke();
  fill(0, 180, 255); // cyan debug dots

  sheaths.forEach(s => {

    const mx = (s.x0 + s.x1) * 0.5;
    const my = (s.y0 + s.y1) * 0.5;

    const dx = s.x1 - s.x0;
    const dy = s.y1 - s.y0;
    const len = Math.hypot(dx, dy) || 1;

    const nx = -dy / len;
    const ny =  dx / len;

    ellipse(
      mx + nx * DEBUG_DOT_OFFSET,
      my + ny * DEBUG_DOT_OFFSET,
      5,
      5
    );
  });

  pop();
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.generateMyelinGeometry    = generateMyelinGeometry;
window.drawMyelinSheathDebugDots = drawMyelinSheathDebugDots;
