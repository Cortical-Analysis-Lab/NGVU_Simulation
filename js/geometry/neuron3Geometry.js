// =====================================================
// INHIBITORY INTERNEURON GEOMETRY (NEURON 3)
// =====================================================
console.log("neuron3 geometry loaded");

// -----------------------------------------------------
const neuron3 = {
  somaRadius: 30,
  soma: { x: 0, y: 0 },
  dendrites: [],
  synapses: [],
  axon: {
    angle: -90,
    shaft: null,
    terminalBranches: []
  }
};

function inNeuron3DendriteEnvelope(x, y) {
  const dx = x - neuron3.soma.x;
  const dy = y - neuron3.soma.y;
  return dx > -132 && dx < 132 && dy > -52 && dy < 184;
}

function pushUniqueNeuron3Branch(branches, branch, usedTips, minTipSeparation = 14) {
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

function makeNeuron3TaperedBranch(origin, angleDeg, length, startR, endR, bendDeg = 0) {
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

function initNeuron3Axon() {
  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const halfW = wf.width * 0.5;
  const halfH = wf.height * 0.5;
  const ax = radians(neuron3.axon.angle);
  const aisLen = neuron3.somaRadius * 0.25;
  const start = {
    x: neuron3.soma.x + cos(ax) * (neuron3.somaRadius + aisLen),
    y: neuron3.soma.y + sin(ax) * (neuron3.somaRadius + aisLen)
  };
  const edgeY = -halfH + 16;
  const edgeT = (edgeY - start.y) / min(-0.001, sin(ax));
  const edgeX = constrain(start.x + cos(ax) * edgeT, -halfW + 16, halfW - 16);
  const terminalBase = { x: edgeX, y: edgeY + 42 };

  neuron3.axon.shaft = {
    start,
    c1: { x: start.x - 28, y: start.y - 78 },
    c2: { x: terminalBase.x + 10, y: terminalBase.y - 18 },
    end: terminalBase
  };

  neuron3.axon.terminalBranches = [-24, 0, 24].map((dx, i) => ({
    start: terminalBase,
    ctrl: {
      x: terminalBase.x + dx * 0.6,
      y: terminalBase.y - 18 - (i === 1 ? 0 : 4)
    },
    end: {
      x: constrain(terminalBase.x + dx, -halfW + 18, halfW - 18),
      y: edgeY
    },
    boutonRadius: 5
  }));
}

function growNeuron3SecondaryBranches(trunk, baseAngle, branchSlots, options = {}) {
  const usedBranchTips = [];
  const usedTwigTips = [];
  const branchSeparation = options.branchSeparation ?? 11;
  const twigSeparation = options.twigSeparation ?? 7;

  branchSlots.forEach((slot, slotIndex) => {
    const origin = trunk[slot.index];
    if (!origin) return;

    const branchAngle = baseAngle + slot.angleOffset + random(-4, 4);
    const branchLength = slot.length + random(-3, 3);

    const mid = {
      x: origin.x + cos(radians(branchAngle)) * branchLength * 0.5,
      y: origin.y + sin(radians(branchAngle)) * branchLength * 0.5
    };

    const end = {
      x: origin.x + cos(radians(branchAngle)) * branchLength,
      y: origin.y + sin(radians(branchAngle)) * branchLength
    };

    if (
      dist(end.x, end.y, neuron3.soma.x, neuron3.soma.y) <=
      dist(origin.x, origin.y, neuron3.soma.x, neuron3.soma.y) ||
      !inNeuron3DendriteEnvelope(end.x, end.y)
    ) {
      return;
    }

    const branch = [
      origin,
      { x: mid.x, y: mid.y, r: 2.4 },
      { x: end.x, y: end.y, r: 2.0 }
    ];

    if (!pushUniqueNeuron3Branch(neuron3.dendrites, branch, usedBranchTips, branchSeparation)) return;

    const twigCount = slotIndex < 2 ? 2 : 3;

    for (let j = 0; j < twigCount; j++) {
      const twigSpread = twigCount === 2 ? 14 : 18;
      const twigAngle = branchAngle + map(j, 0, twigCount - 1, -twigSpread, twigSpread) + random(-3, 3);

      const twigEnd = {
        x: end.x + cos(radians(twigAngle)) * random(10, 16),
        y: end.y + sin(radians(twigAngle)) * random(10, 16)
      };

      if (!inNeuron3DendriteEnvelope(twigEnd.x, twigEnd.y)) continue;

      const twigBranch = [
        ...branch,
        { x: twigEnd.x, y: twigEnd.y, r: 1.5 }
      ];
      if (!pushUniqueNeuron3Branch(neuron3.dendrites, twigBranch, usedTwigTips, twigSeparation)) continue;

      if (random() < 0.52) {
        const distalAngle = twigAngle + random(-14, 14);
        const distalEnd = {
          x: twigEnd.x + cos(radians(distalAngle)) * random(7, 11),
          y: twigEnd.y + sin(radians(distalAngle)) * random(7, 11)
        };

        if (!inNeuron3DendriteEnvelope(distalEnd.x, distalEnd.y)) continue;

        pushUniqueNeuron3Branch(neuron3.dendrites, [
          ...branch,
          { x: twigEnd.x, y: twigEnd.y, r: 1.5 },
          { x: distalEnd.x, y: distalEnd.y, r: 1.1 }
        ], usedTwigTips, twigSeparation - 1);
      }
    }
  });
}

// -----------------------------------------------------
// Initialize neuron 3
// -----------------------------------------------------
function initNeuron3() {

  neuron3.dendrites = [];
  neuron3.synapses  = [];

  // ---------------------------------------------------
  // 1) Select TOPMOST axon terminal from neuron 1
  // ---------------------------------------------------
  let topBranch = null;
  let minY = Infinity;

  neuron.axon.terminalBranches.forEach(b => {
    if (b.end.y < minY) {
      minY = b.end.y;
      topBranch = b;
    }
  });

  if (!topBranch) return;

  const bouton = {
    x: topBranch.end.x,
    y: topBranch.end.y
  };

  // ---------------------------------------------------
  // 2) Postsynaptic contact (IPSP site)
  // ---------------------------------------------------
  const dendriteContact = {
    x: bouton.x - 26,
    y: bouton.y - 10
  };

  neuron3.synapses.push({
    x: dendriteContact.x,
    y: dendriteContact.y,
    radius: 7
  });

  // ---------------------------------------------------
  // 3) Soma placement (open upper space)
  // ---------------------------------------------------
  const SOMA_DISTANCE = 170;
  const somaAngle = radians(-70); // up-left relative to bouton

  neuron3.soma.x = dendriteContact.x + cos(somaAngle) * SOMA_DISTANCE;
  neuron3.soma.y = dendriteContact.y + sin(somaAngle) * SOMA_DISTANCE;

  // ---------------------------------------------------
  // 4) PRIMARY SYNAPTIC TRUNK (MUST CONNECT)
  // ---------------------------------------------------
  const synTrunk = [];
  const synSegments = 5;

  synTrunk.push({
    x: neuron3.soma.x,
    y: neuron3.soma.y,
    r: 5.8
  });

  const synAngle = degrees(
    atan2(
      dendriteContact.y - neuron3.soma.y,
      dendriteContact.x - neuron3.soma.x
    )
  );

  const synLength = dist(
    neuron3.soma.x,
    neuron3.soma.y,
    dendriteContact.x,
    dendriteContact.y
  );

  for (let i = 1; i <= synSegments; i++) {
    const t = i / synSegments;
    const bend = sin(t * PI) * 4;

    const p = polarToCartesian(
      synAngle + bend,
      synLength * t
    );

    synTrunk.push({
      x: neuron3.soma.x + p.x,
      y: neuron3.soma.y + p.y,
      r: lerp(5.8, 2.6, t)
    });
  }

  neuron3.dendrites.push(synTrunk);
  [
    { index: 2, angleOffset: -22, length: 30 },
    { index: 2, angleOffset: 22, length: 30 },
    { index: 3, angleOffset: -34, length: 40 },
    { index: 3, angleOffset: 34, length: 40 }
  ].forEach((slot, slotIndex) => {
    const origin = synTrunk[slot.index];
    if (!origin) return;
    const primaryAngle = synAngle + slot.angleOffset + random(-4, 4);
    const primaryBranch = makeNeuron3TaperedBranch(
      origin,
      primaryAngle,
      slot.length + random(-3, 3),
      3.4,
      2.3,
      random(-8, 8)
    );
    const tip = primaryBranch[primaryBranch.length - 1];
    if (!inNeuron3DendriteEnvelope(tip.x, tip.y)) return;
    if (!pushUniqueNeuron3Branch(neuron3.dendrites, primaryBranch, [], 0)) return;

    const twigBranch = makeNeuron3TaperedBranch(
      tip,
      primaryAngle + (slotIndex % 2 === 0 ? -16 : 16),
      random(14, 22),
      1.9,
      1.1,
      random(-8, 8)
    );
    const twigTip = twigBranch[twigBranch.length - 1];
    if (!inNeuron3DendriteEnvelope(twigTip.x, twigTip.y)) return;
    neuron3.dendrites.push(twigBranch);
  });
  growNeuron3SecondaryBranches(
    synTrunk,
    synAngle,
    [
      { index: 2, angleOffset: -34, length: 28 },
      { index: 2, angleOffset: 34, length: 28 },
      { index: 3, angleOffset: -48, length: 34 },
      { index: 3, angleOffset: 48, length: 34 }
    ],
    { branchSeparation: 10, twigSeparation: 6 }
  );

  // ---------------------------------------------------
  // 5) ADDITIONAL PRIMARY TRUNKS (SHORT, DIVERGENT)
  // ---------------------------------------------------
  const extraTrunkAngles = [
    synAngle + 110,
    synAngle - 110
  ];

  extraTrunkAngles.forEach(baseAngle => {

    const trunkLength = random(70, 95);
    const segments = 4;
    const trunk = [];

    trunk.push({
      x: neuron3.soma.x,
      y: neuron3.soma.y,
      r: 5.2
    });

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const bend = sin(t * PI) * random(3, 5);

      const p = polarToCartesian(
        baseAngle + bend,
        trunkLength * t
      );

      const px = neuron3.soma.x + p.x;
      const py = neuron3.soma.y + p.y;

      // Radial exclusion: never re-enter soma zone
      if (dist(px, py, neuron3.soma.x, neuron3.soma.y) <
          neuron3.somaRadius + 14) {
        continue;
      }

      trunk.push({
        x: px,
        y: py,
        r: lerp(5.2, 2.4, t)
      });
    }

    neuron3.dendrites.push(trunk);
    [
      { index: 2, angleOffset: -20, length: 28 },
      { index: 2, angleOffset: 20, length: 28 },
      { index: 3, angleOffset: -32, length: 36 },
      { index: 3, angleOffset: 32, length: 36 }
    ].forEach((slot, slotIndex) => {
      const origin = trunk[slot.index];
      if (!origin) return;
      const primaryAngle = baseAngle + slot.angleOffset + random(-4, 4);
      const primaryBranch = makeNeuron3TaperedBranch(
        origin,
        primaryAngle,
        slot.length + random(-3, 3),
        3.2,
        2.2,
        random(-8, 8)
      );
      const tip = primaryBranch[primaryBranch.length - 1];
      if (!inNeuron3DendriteEnvelope(tip.x, tip.y)) return;
      if (!pushUniqueNeuron3Branch(neuron3.dendrites, primaryBranch, [], 0)) return;

      if (random() < 0.75) {
        const twigBranch = makeNeuron3TaperedBranch(
          tip,
          primaryAngle + (slotIndex % 2 === 0 ? -14 : 14),
          random(12, 20),
          1.8,
          1.1,
          random(-7, 7)
        );
        const twigTip = twigBranch[twigBranch.length - 1];
        if (!inNeuron3DendriteEnvelope(twigTip.x, twigTip.y)) return;
        neuron3.dendrites.push(twigBranch);
      }
    });
    growNeuron3SecondaryBranches(
      trunk,
      baseAngle,
      [
        { index: 1, angleOffset: -22, length: 24 },
        { index: 1, angleOffset: 22, length: 24 },
        { index: 1, angleOffset: -34, length: 30 },
        { index: 1, angleOffset: 34, length: 30 },
        { index: 2, angleOffset: -46, length: 34 },
        { index: 2, angleOffset: 46, length: 34 },
        { index: 2, angleOffset: -58, length: 38 },
        { index: 2, angleOffset: 58, length: 38 },
        { index: 3, angleOffset: -68, length: 40 },
        { index: 3, angleOffset: 68, length: 40 }
      ],
      { branchSeparation: 11, twigSeparation: 7 }
    );
  });

  initNeuron3Axon();
}
