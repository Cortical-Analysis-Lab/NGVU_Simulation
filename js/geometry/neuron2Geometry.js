// =====================================================
// POSTSYNAPTIC NEURON GEOMETRY (NEURON 2)
// MILD SHOLL BIAS + CLEAR TRUNK → BRANCH → TWIG HIERARCHY
// =====================================================
console.log("neuron2 geometry loaded");

// -----------------------------------------------------
// Tunable biological parameters
// -----------------------------------------------------
const SYNAPTIC_CLEFT = 30;
const SOMA_OFFSET    = 140;

// -----------------------------------------------------
const neuron2 = {
  somaRadius: 34,
  soma: { x: 0, y: 0 },
  dendrites: [],
  synapses: [],

  axon: {
    length: 260,
    angle: -20,
    shaft: null,
    terminalBranches: []
  }
};

// -----------------------------------------------------
// Mild Sholl-style probability curve
// Peaks away from soma, suppresses clutter
// -----------------------------------------------------
function shollWeight(t) {
  // t = 0 (soma) → 1 (distal)
  return sin(t * PI); // very mild, symmetric
}

function inNeuron2DendriteEnvelope(x, y) {
  const dx = x - neuron2.soma.x;
  const dy = y - neuron2.soma.y;
  return dx > -120 && dx < 42 && dy > -132 && dy < 132;
}

function pushUniqueNeuron2Branch(branches, branch, usedTips, minTipSeparation = 16) {
  const tip = branch[branch.length - 1];
  if (!tip) return false;

  for (const p of usedTips) {
    if (dist(tip.x, tip.y, p.x, p.y) < minTipSeparation) {
      return false;
    }
  }

  branches.push(branch);
  usedTips.push({ x: tip.x, y: tip.y });
  return true;
}

function makeNeuron2TaperedBranch(origin, angleDeg, length, startR, endR, bendDeg = 0) {
  const p1 = polarToCartesian(angleDeg + bendDeg * 0.35, length * 0.34);
  const p2 = polarToCartesian(angleDeg + bendDeg * 0.72, length * 0.68);
  const p3 = polarToCartesian(angleDeg + bendDeg, length);

  return [
    origin,
    { x: origin.x + p1.x, y: origin.y + p1.y, r: lerp(startR, endR, 0.38) },
    { x: origin.x + p2.x, y: origin.y + p2.y, r: lerp(startR, endR, 0.72) },
    { x: origin.x + p3.x, y: origin.y + p3.y, r: endR }
  ];
}

function initNeuron2Axon() {
  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const halfW = wf.width * 0.5;
  const halfH = wf.height * 0.5;
  const ax = radians(neuron2.axon.angle);
  const aisLen = neuron2.somaRadius * 0.25;
  const start = {
    x: neuron2.soma.x + cos(ax) * (neuron2.somaRadius + aisLen),
    y: neuron2.soma.y + sin(ax) * (neuron2.somaRadius + aisLen)
  };
  const edgeX = halfW - 16;
  const edgeT = (edgeX - start.x) / max(0.001, cos(ax));
  const edgeY = constrain(start.y + sin(ax) * edgeT, -halfH + 16, halfH - 16);
  const terminalBase = { x: edgeX - 44, y: edgeY };

  neuron2.axon.shaft = {
    start,
    c1: { x: start.x + 62, y: start.y + 16 },
    c2: { x: terminalBase.x - 54, y: start.y - 26 },
    end: terminalBase
  };

  neuron2.axon.terminalBranches = [-26, 0, 26].map((dy, i) => ({
    start: terminalBase,
    ctrl: {
      x: terminalBase.x + 18,
      y: terminalBase.y + dy * 0.55 + (i === 1 ? 0 : dy * 0.15)
    },
    end: {
      x: edgeX,
      y: constrain(terminalBase.y + dy, -halfH + 18, halfH - 18)
    },
    boutonRadius: 5
  }));
}

// -----------------------------------------------------
// Initialize neuron 2 geometry
// -----------------------------------------------------
function initNeuron2() {

  neuron2.dendrites = [];
  neuron2.synapses  = [];

  // ---------------------------------------------------
  // 1) Lock to presynaptic bouton
  // ---------------------------------------------------
  const preBranch = neuron.axon.terminalBranches[1];

  const presynapticBouton = {
    x: preBranch.end.x,
    y: preBranch.end.y
  };

  const dendriteContact = {
    x: presynapticBouton.x + SYNAPTIC_CLEFT,
    y: presynapticBouton.y + random(-3, 3)
  };

  // ---------------------------------------------------
  // 2) Soma placement
  // ---------------------------------------------------
  neuron2.soma.x = dendriteContact.x + SOMA_OFFSET;
  neuron2.soma.y = dendriteContact.y + random(-20, 20);

  // ---------------------------------------------------
  // 3) Trunk angles
  // ---------------------------------------------------
  const synapseAngle = degrees(
    atan2(
      dendriteContact.y - neuron2.soma.y,
      dendriteContact.x - neuron2.soma.x
    )
  );

  const trunkAngles = [
    synapseAngle,
    synapseAngle + 110,
    synapseAngle - 110
  ];

  trunkAngles.forEach((baseAngle, trunkIndex) => {

    const trunkLength =
      trunkIndex === 0
        ? dist(
            neuron2.soma.x,
            neuron2.soma.y,
            dendriteContact.x,
            dendriteContact.y
          )
        : random(85, 100);

    const trunkSegments = 4;
    const trunk = [];

    // 🔑 THICK TRUNK BASE
    trunk.push({
      x: neuron2.soma.x,
      y: neuron2.soma.y,
      r: 7.2
    });

    const curvatureBias =
      trunkIndex === 0 ? 0 :
      trunkIndex === 1 ? 4 : -4;

    for (let i = 1; i <= trunkSegments; i++) {
      const t = i / trunkSegments;
      const bend = sin(t * PI) * curvatureBias;

      const p = polarToCartesian(
        baseAngle + bend,
        trunkLength * t
      );

      trunk.push({
        x: neuron2.soma.x + p.x,
        y: neuron2.soma.y + p.y,
        r: lerp(7.2, 3.4, t) // slower taper
      });
    }

    neuron2.dendrites.push(trunk);
    const usedTips = [];

    const primarySlots = trunkIndex === 0
      ? [
          { index: 2, angleOffset: -24, length: 38 },
          { index: 2, angleOffset: 24, length: 38 },
          { index: 3, angleOffset: -36, length: 48 },
          { index: 3, angleOffset: 36, length: 48 }
        ]
      : [
          { index: 2, angleOffset: -22, length: 34 },
          { index: 2, angleOffset: 22, length: 34 },
          { index: 3, angleOffset: -34, length: 42 },
          { index: 3, angleOffset: 34, length: 42 }
        ];

    primarySlots.forEach((slot, slotIndex) => {
      const origin = trunk[slot.index];
      if (!origin) return;
      const primaryAngle = baseAngle + slot.angleOffset + random(-4, 4);
      const primaryBranch = makeNeuron2TaperedBranch(
        origin,
        primaryAngle,
        slot.length + random(-3, 3),
        3.8,
        2.6,
        random(-10, 10)
      );
      const tip = primaryBranch[primaryBranch.length - 1];
      if (!inNeuron2DendriteEnvelope(tip.x, tip.y)) return;
      if (!pushUniqueNeuron2Branch(neuron2.dendrites, primaryBranch, usedTips, 18)) return;

      const twigAngle = primaryAngle + (slotIndex % 2 === 0 ? -18 : 18);
      const twigBranch = makeNeuron2TaperedBranch(
        tip,
        twigAngle,
        random(16, 24),
        2.0,
        1.2,
        random(-8, 8)
      );
      const twigTip = twigBranch[twigBranch.length - 1];
      if (!inNeuron2DendriteEnvelope(twigTip.x, twigTip.y)) return;
      pushUniqueNeuron2Branch(neuron2.dendrites, twigBranch, usedTips, 12);
    });

    // -------------------------------------------------
    // 4) SECONDARY BRANCHES (SHOLL-BIASED)
    // -------------------------------------------------
    const branchSlots = trunkIndex === 0
      ? [
          { index: 1, angleOffset: -34, length: 30 },
          { index: 1, angleOffset: 34, length: 30 },
          { index: 2, angleOffset: -48, length: 36 },
          { index: 2, angleOffset: 48, length: 36 },
          { index: 3, angleOffset: -58, length: 40 },
          { index: 3, angleOffset: 58, length: 40 }
        ]
      : [
          { index: 1, angleOffset: -32, length: 28 },
          { index: 1, angleOffset: 32, length: 28 },
          { index: 2, angleOffset: -46, length: 34 },
          { index: 2, angleOffset: 46, length: 34 },
          { index: 3, angleOffset: -60, length: 38 },
          { index: 3, angleOffset: 60, length: 38 }
        ];

    branchSlots.forEach((slot, slotIndex) => {
      const t = slot.index / (trunk.length - 1);
      if (random() > shollWeight(t) + 0.18) return;

      const origin = trunk[slot.index];
      if (!origin) return;

      const branchAngle = baseAngle + slot.angleOffset + random(-5, 5);
      const branchLength = slot.length + random(-3, 4);

        const mid = {
          x: origin.x + cos(radians(branchAngle)) * branchLength * 0.5,
          y: origin.y + sin(radians(branchAngle)) * branchLength * 0.5
        };

        const end = {
          x: origin.x + cos(radians(branchAngle)) * branchLength,
          y: origin.y + sin(radians(branchAngle)) * branchLength
        };

        if (!inNeuron2DendriteEnvelope(end.x, end.y)) return;

        const branch = [
          origin,
          { x: mid.x, y: mid.y, r: 2.8 },
          { x: end.x, y: end.y, r: 2.2 }
        ];

        if (!pushUniqueNeuron2Branch(neuron2.dendrites, branch, usedTips, 16)) return;

        // -----------------------------------------------
        // 5) TERMINAL TWIGS (DENser BUT COMPACT)
        // -----------------------------------------------
        const twigAngles = [
          branchAngle + (slotIndex % 2 === 0 ? -16 : -12),
          branchAngle + (slotIndex % 2 === 0 ? 12 : 16)
        ];

        twigAngles.forEach(tAngle => {
          if (random() < 0.22) return;

          const twigLen = random(11, 18);

          const twigEnd = {
            x: end.x + cos(radians(tAngle)) * twigLen,
            y: end.y + sin(radians(tAngle)) * twigLen
          };

          if (!inNeuron2DendriteEnvelope(twigEnd.x, twigEnd.y)) return;

          const twigBranch = [
            ...branch,
            { x: twigEnd.x, y: twigEnd.y, r: 1.5 }
          ];
          if (!pushUniqueNeuron2Branch(neuron2.dendrites, twigBranch, usedTips, 12)) return;

          if (random() < 0.45) {
            const subTwigAngle = tAngle + random(-16, 16);
            const subTwigLen = random(8, 13);
            const subTwigEnd = {
              x: twigEnd.x + cos(radians(subTwigAngle)) * subTwigLen,
              y: twigEnd.y + sin(radians(subTwigAngle)) * subTwigLen
            };

            if (!inNeuron2DendriteEnvelope(subTwigEnd.x, subTwigEnd.y)) return;

            pushUniqueNeuron2Branch(neuron2.dendrites, [
              ...branch,
              { x: twigEnd.x, y: twigEnd.y, r: 1.5 },
              { x: subTwigEnd.x, y: subTwigEnd.y, r: 1.1 }
            ], usedTips, 10);
          }
        });
    });
  });

  // ---------------------------------------------------
  // 6) Postsynaptic density marker
  // ---------------------------------------------------
  neuron2.synapses.push({
    x: dendriteContact.x,
    y: dendriteContact.y,
    radius: 7
  });

  initNeuron2Axon();
}
