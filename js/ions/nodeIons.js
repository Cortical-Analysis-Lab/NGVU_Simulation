// =====================================================
// NODE IONS — MYELINATED AXON (Na⁺ / K⁺)
// =====================================================
// ✔ Node-authoritative (node center is ground truth)
// ✔ Na⁺ spawns in halo → moves INTO node only
// ✔ K⁺ expelled → relaxes locally around node halo
// ✔ No sheath interaction possible
// ✔ Works for all nodes including first
// =====================================================

console.log("🧬 nodeIons loaded");

// -----------------------------------------------------
// GLOBAL STORAGE
// -----------------------------------------------------
window.ecsIons = window.ecsIons || {};
ecsIons.NodeNa = ecsIons.NodeNa || [];
ecsIons.NodeK  = ecsIons.NodeK  || [];

// -----------------------------------------------------
// GEOMETRY (MATCH VISUAL AXON SCALE)
// -----------------------------------------------------
const NODE_HALO_RADIUS    = 26;
const NODE_HALO_THICKNESS = 4;

// -----------------------------------------------------
// LIFETIME / BURST TUNING
// -----------------------------------------------------
const NODE_NA_LIFETIME = 26;
const NODE_K_LIFETIME  = 38;

const NODE_NA_BURST_COUNT = 6;
const NODE_K_BURST_COUNT  = 6;

// -----------------------------------------------------
// MOTION TUNING (SLOW + MYELIN-COMPATIBLE)
// -----------------------------------------------------
const NA_INWARD_FORCE = 0.07;
const NA_DAMPING      = 0.60;

const K_RELAX_FORCE   = 0.035;
const K_DAMPING       = 0.88;

// -----------------------------------------------------
// Na⁺ INFLUX — HALO → NODE CENTER
// -----------------------------------------------------
function triggerNodeNaInflux(nodeIdx) {

  if (!window.myelinEnabled) return;

  const node = neuron?.axon?.nodes?.[nodeIdx];
  if (!node) return;

  for (let i = 0; i < NODE_NA_BURST_COUNT; i++) {

    const angle = random(TWO_PI);
    const r = random(
      NODE_HALO_RADIUS,
      NODE_HALO_RADIUS + NODE_HALO_THICKNESS
    );

    ecsIons.NodeNa.push({
      x: node.x + cos(angle) * r,
      y: node.y + sin(angle) * r,
      tx: node.x,
      ty: node.y,
      vx: 0,
      vy: 0,
      life: NODE_NA_LIFETIME
    });
  }
}

// -----------------------------------------------------
// K⁺ EFFLUX — NODE → LOCAL HALO
// -----------------------------------------------------
function triggerNodeKEfflux(nodeIdx) {

  if (!window.myelinEnabled) return;

  const node = neuron?.axon?.nodes?.[nodeIdx];
  if (!node) return;

  for (let i = 0; i < NODE_K_BURST_COUNT; i++) {

    const angle = random(TWO_PI);
    const r = random(
      NODE_HALO_RADIUS,
      NODE_HALO_RADIUS + NODE_HALO_THICKNESS
    );

    ecsIons.NodeK.push({
      x: node.x,
      y: node.y,
      tx: node.x + cos(angle) * r,
      ty: node.y + sin(angle) * r,
      vx: 0,
      vy: 0,
      life: NODE_K_LIFETIME
    });
  }
}

// -----------------------------------------------------
// DRAW
// -----------------------------------------------------
function drawNodeIons() {

  push();
  textAlign(CENTER, CENTER);
  noStroke();

  // -----------------------------
  // Na⁺ — ATTRACTED INTO NODE
  // -----------------------------
  fill(getColor("sodium", 180));

  ecsIons.NodeNa = ecsIons.NodeNa.filter(p => {
    p.life--;

    const dx = p.tx - p.x;
    const dy = p.ty - p.y;

    p.vx += dx * NA_INWARD_FORCE;
    p.vy += dy * NA_INWARD_FORCE;

    p.vx *= NA_DAMPING;
    p.vy *= NA_DAMPING;

    p.x += p.vx;
    p.y += p.vy;

    text("Na⁺", p.x, p.y);
    return p.life > 0;
  });

  // -----------------------------
  // K⁺ — RELAXES IN NODE HALO
  // -----------------------------
  fill(getColor("potassium", 150));

  ecsIons.NodeK = ecsIons.NodeK.filter(p => {
    p.life--;

    p.vx += (p.tx - p.x) * K_RELAX_FORCE;
    p.vy += (p.ty - p.y) * K_RELAX_FORCE;

    p.vx *= K_DAMPING;
    p.vy *= K_DAMPING;

    p.x += p.vx;
    p.y += p.vy;

    text("K⁺", p.x, p.y);
    return p.life > 0;
  });

  pop();
}

// -----------------------------------------------------
// RESET
// -----------------------------------------------------
function initNodeIons() {
  ecsIons.NodeNa.length = 0;
  ecsIons.NodeK.length  = 0;
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.triggerNodeNaInflux = triggerNodeNaInflux;
window.triggerNodeKEfflux = triggerNodeKEfflux;
window.drawNodeIons       = drawNodeIons;
window.initNodeIons       = initNodeIons;
