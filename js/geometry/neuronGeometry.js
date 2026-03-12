// =====================================================
// BIOLOGICAL-BUT-CLEAN NEURON GEOMETRY (NEURON 1 ONLY)
// =====================================================
console.log("geometry loaded");

// -----------------------------------------------------
// 🔁 HARD ROLLBACK SWITCH
// -----------------------------------------------------
const USE_SHOLL_BIAS = true;

// -----------------------------------------------------
// Bouton density control (Neuron 1 only)
// -----------------------------------------------------
const BOUTON_DENSITY_SCALE = 0.6;

// -----------------------------------------------------
// Neuron definition
// -----------------------------------------------------
const neuron = {
  somaRadius: 42,
  dendrites: [],
  synapses: [],

  hillock: { length: 16 },

  axon: {
    length: 160,
    terminalBranches: []
  }
};

// -----------------------------------------------------
// Utilities
// -----------------------------------------------------
function polarToCartesian(angleDeg, r) {
  const a = radians(angleDeg);
  return { x: cos(a) * r, y: sin(a) * r };
}

// -----------------------------------------------------
// Subtle Sholl-style bias (Gaussian)
// -----------------------------------------------------
function shollBias(distance, peak, width) {
  const x = (distance - peak) / width;
  return exp(-x * x);
}

// -----------------------------------------------------
// Angle generator (prevents twig overlap)
// -----------------------------------------------------
function generateNonOverlappingAngles({
  centerAngle,
  count,
  spread,
  minSeparation = 22,
  maxAttempts = 30
}) {
  const angles = [];

  for (let i = 0; i < count; i++) {
    let a, tries = 0;

    do {
      a = centerAngle + random(-spread, spread);
      tries++;
    } while (
      angles.some(e => abs(e - a) < minSeparation) &&
      tries < maxAttempts
    );

    angles.push(a);
  }

  return angles;
}

// -----------------------------------------------------
// Bouton overlap guard
// -----------------------------------------------------
function canPlaceBouton(x, y, r, existing) {
  return !existing.some(b =>
    dist(x, y, b.x, b.y) < r * 2.2
  );
}

// -----------------------------------------------------
// Build dendritic trunk → branch → twig (ATTACHED)
// -----------------------------------------------------
function createDendriticTree(baseAngle) {

  const segments = [];
  const distalTips = [];

  // --- Soma attachment ---
  const attachAngle = baseAngle + random(-2, 2);
  const somaAttach = polarToCartesian(attachAngle, neuron.somaRadius);

  // --- Trunk ---
  const trunkAngle = attachAngle + random(-4, 4);
  const trunkLength = random(120, 150);
  const trunkSegments = 5;

  const trunk = [];
  trunk.push({ x: somaAttach.x, y: somaAttach.y, r: 10.5 });

  for (let i = 1; i <= trunkSegments; i++) {
    const t = i / trunkSegments;
    const curvature = sin(t * PI) * random(-6, 6);

    const p = polarToCartesian(
      trunkAngle + curvature,
      neuron.somaRadius + trunkLength * t
    );

    trunk.push({
      x: p.x,
      y: p.y,
      r: lerp(10.5, 5.2, t)
    });
  }

  // Trunk is always included
  segments.push(trunk);

  // --- Branches ---
  const branchCount = floor(random(4, 6));

  for (let i = 0; i < branchCount; i++) {

    const idxMin = max(2, floor(trunk.length * 0.45));
    const idx = floor(random(idxMin, trunk.length));
    const origin = trunk[idx];

    const side = random() < 0.5 ? -1 : 1;
    const branchAngle = trunkAngle + side * random(45, 65);
    const branchLength = random(50, 70);

    const mid = {
      x: origin.x + cos(radians(branchAngle)) * branchLength * 0.5,
      y: origin.y + sin(radians(branchAngle)) * branchLength * 0.5
    };

    const end = {
      x: origin.x + cos(radians(branchAngle)) * branchLength,
      y: origin.y + sin(radians(branchAngle)) * branchLength
    };

    const branch = [
      origin,
      { x: mid.x, y: mid.y, r: 4.0 },
      { x: end.x, y: end.y, r: 3.0 }
    ];

    // --- Twig decision (ONLY place Sholl bias is applied) ---
    let twigCount = floor(random(1, 3));
    const d = dist(origin.x, origin.y, 0, 0);
    let dNorm = constrain(
      (d - neuron.somaRadius) / max(1, trunkLength),
      0, 1
    );

    if (USE_SHOLL_BIAS) {
      const bias = shollBias(
        d,
        neuron.somaRadius + trunkLength * 0.6,
        trunkLength * 0.35
      );

      twigCount =
        bias > 0.65 ? 2 :
        bias > 0.45 ? 1 :
        0;

      // Favor richer distal arborization.
      if (dNorm > 0.55) twigCount += 1;
      if (dNorm > 0.78 && random() < 0.65) twigCount += 1;
      twigCount = min(4, twigCount);
    }

    if (twigCount === 0) continue;

    const distalSpread = lerp(30, 58, dNorm);
    const distalSeparation = lerp(22, 36, dNorm);
    let twigAngles = generateNonOverlappingAngles({
      centerAngle: branchAngle,
      count: twigCount,
      spread: distalSpread,
      minSeparation: distalSeparation
    });

    // Distal fan-out: spread twig endpoints so neighboring twigs are clearly separated.
    if (twigAngles.length > 1) {
      twigAngles = twigAngles
        .sort((a, b) => a - b)
        .map((_, i) => {
          const n = twigAngles.length - 1;
          const k = n <= 0 ? 0 : (i / n) * 2 - 1; // -1..1
          return branchAngle + k * distalSpread * 0.9 + random(-distalSpread * 0.08, distalSpread * 0.08);
        });
    }

    twigAngles.forEach(tAngle => {
      const minTipSep = lerp(20, 36, dNorm);
      let placed = false;

      for (let attempt = 0; attempt < 8 && !placed; attempt++) {
        const angleJitter = random(-distalSpread * 0.16, distalSpread * 0.16);
        const tryAngle = tAngle + angleJitter;
        const twigLen = random(24, 40) * lerp(0.95, 1.1, dNorm);

        const twigEnd = {
          x: end.x + cos(radians(tryAngle)) * twigLen,
          y: end.y + sin(radians(tryAngle)) * twigLen
        };

        const overlapsTip = distalTips.some(pt =>
          dist(twigEnd.x, twigEnd.y, pt.x, pt.y) < minTipSep
        );

        const overlapsBranch = segments.some(seg =>
          seg.some(p => dist(twigEnd.x, twigEnd.y, p.x, p.y) < minTipSep * 0.72)
        );

        if (overlapsTip || overlapsBranch) continue;

        segments.push([
          ...branch,
          { x: twigEnd.x, y: twigEnd.y, r: 2.0 }
        ]);
        distalTips.push({ x: twigEnd.x, y: twigEnd.y });
        placed = true;
      }
    });
  }

  return segments;
}

// -----------------------------------------------------
// Build EPSP path (tip → soma)
// -----------------------------------------------------
function buildPathToSoma(branch) {

  const path = [];

  for (let i = branch.length - 1; i >= 0; i--) {
    path.push({ x: branch[i].x, y: branch[i].y });
  }

  path.push({ x: 0, y: 0 });

  return path;
}

// -----------------------------------------------------
// Reduce bouton count while preserving ratio
// -----------------------------------------------------
function reduceBoutonCountPreserveRatio() {

  if (!neuron.synapses.length) return;

  const targetCount = floor(
    neuron.synapses.length * BOUTON_DENSITY_SCALE
  );

  shuffle(neuron.synapses, true);
  neuron.synapses = neuron.synapses.slice(0, targetCount);
}

// -----------------------------------------------------
// Initialize dendrites + synapses
// -----------------------------------------------------
function initSynapses() {

  neuron.dendrites = [];
  neuron.synapses = [];
  neuron.axon.terminalBranches = [];

  let synapseId = 0;

  const trunkAngles = [150, 225, 300];

  trunkAngles.forEach(angle => {

    const trees = createDendriticTree(angle);

    trees.forEach(branch => {

      neuron.dendrites.push(branch);

      // ❌ Only terminal twigs get synapses
      if (branch.length < 4) return;

      const tip = branch[branch.length - 1];
      const r = 12;

      const x = tip.x + random(-6, 6);
      const y = tip.y + random(-6, 6);

      if (!canPlaceBouton(x, y, r, neuron.synapses)) return;

      neuron.synapses.push({
        id: synapseId++,
        x, y,
        radius: r,
        hovered: false,
        selected: false,
        type: null,
        path: buildPathToSoma(branch)
      });
    });
  });

  reduceBoutonCountPreserveRatio();
  assignSynapseTypes();
  initAxonTerminalBranches();
}

// -----------------------------------------------------
// Excitatory / inhibitory balance
// -----------------------------------------------------
function assignSynapseTypes() {

  const syns = neuron.synapses;
  if (!syns.length) return;

  const inhCount = min(3, floor(syns.length / 3));
  const indices = syns.map((_, i) => i);

  shuffle(indices, true);

  indices.forEach((idx, i) => {
    syns[idx].type = i < inhCount ? "inh" : "exc";
  });
}

// -----------------------------------------------------
// Axon geometry (unchanged)
// -----------------------------------------------------
function getAxonEndPoint() {

  const x0 = neuron.somaRadius + neuron.hillock.length;

  return {
    x: bezierPoint(
      x0,
      neuron.somaRadius + 70,
      neuron.somaRadius + 120,
      neuron.somaRadius + neuron.axon.length,
      1
    ),
    y: bezierPoint(0, 14, -14, 0, 1)
  };
}

function initAxonTerminalBranches() {

  const base = getAxonEndPoint();

  neuron.axon.terminalBranches = [
    createTerminalBranch(base, 44, -26),
    createTerminalBranch(base, 56,   0),
    createTerminalBranch(base, 44,  28)
  ];
}

function createTerminalBranch(base, dx, dy) {
  return {
    start: { x: base.x, y: base.y },
    ctrl: {
      x: base.x + dx * 0.55,
      y: base.y + dy * 0.55 + random(-8, 8)
    },
    end: {
      x: base.x + dx,
      y: base.y + dy
    },
    boutonRadius: 6
  };
}

// -----------------------------------------------------
// Global axon helper
// -----------------------------------------------------
function getAxonPoint(t) {

  const x0 = neuron.somaRadius + neuron.hillock.length;

  return {
    x: bezierPoint(
      x0,
      neuron.somaRadius + 70,
      neuron.somaRadius + 120,
      neuron.somaRadius + neuron.axon.length,
      t
    ),
    y: bezierPoint(0, 14, -14, 0, t)
  };
}
