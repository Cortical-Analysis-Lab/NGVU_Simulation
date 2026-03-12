console.log("🧠 neuronShape.js loaded — SCALED GEOMETRY");

// =====================================================
// PURE NEURON SHAPE — GEOMETRY ONLY (AUTHORITATIVE)
// Used by preSynapse.js and postSynapse.js
// =====================================================
//
// ✔ SAFE to scale
// ✔ NO vesicle logic here
// ✔ NO world transforms
// ✔ Membrane shape matches getSynapticMembraneX()
//
// =====================================================


// -----------------------------------------------------
// 🔑 AUTHORITATIVE GEOMETRY SCALE
// -----------------------------------------------------
window.NEURON_GEOMETRY_SCALE = 1;
window.SHAFT_MICROTUBULES = window.SHAFT_MICROTUBULES || {
  enabled: true
};
window.SYNAPTIC_MATERIAL_FLOW = window.SYNAPTIC_MATERIAL_FLOW || {
  enabled: true
};

const SHAFT_STEM_FAR = 2000;
const SHAFT_BAR_THICK = 340;
const SHAFT_START_X = SHAFT_BAR_THICK / 2 + 36;
const SHAFT_END_X = SHAFT_STEM_FAR - 50;
const SHAFT_TUBE_RADIUS = 4.5;
const SHAFT_LATTICE_STEP = 36;
const SHAFT_PIPE_YS = [-17, 0, 17];
const MATERIAL_TOP_LANE_Y = (SHAFT_PIPE_YS[0] + SHAFT_PIPE_YS[1]) * 0.5;
const MATERIAL_BOTTOM_LANE_Y = (SHAFT_PIPE_YS[1] + SHAFT_PIPE_YS[2]) * 0.5;
const MATERIAL_BACK_X = SHAFT_START_X + 260; // visible back segment in synapse view
const MATERIAL_EVENT_PERIOD_FRAMES = 5 * 60; // 5s @ 60 FPS
const MATERIAL_DELIVER_SPEED = 0.22;
const MATERIAL_REMOVE_SPEED = 0.20;
const MATERIAL_DELIVER_FADE_FRAMES = 85;
const MATERIAL_BALL_RADIUS = 5.3;
const MATERIAL_PRE_COLORS = [
  [255, 82, 82],   // red
  [255, 220, 72],  // yellow
  [70, 226, 214],  // turquoise
  [255, 156, 66]   // orange
];
const MATERIAL_POST_COLORS = [
  [95, 162, 255],  // blue
  [255, 156, 66],  // orange
  [255, 220, 72],  // yellow
  [246, 240, 226]  // off-white
];

window.synapticMaterialTransport = window.synapticMaterialTransport || {
  pre: { tick: 0, particles: [], colorIndex: 0 },
  post: { tick: 0, particles: [], colorIndex: 0 }
};
window.synapticMaterialTransport.pre.colorIndex = window.synapticMaterialTransport.pre.colorIndex || 0;
window.synapticMaterialTransport.post.colorIndex = window.synapticMaterialTransport.post.colorIndex || 0;

function spawnSynapticMaterialPair(state, role) {
  const palette = role === "pre" ? MATERIAL_PRE_COLORS : MATERIAL_POST_COLORS;
  const rgb = palette[state.colorIndex % palette.length];
  state.colorIndex = (state.colorIndex + 1) % palette.length;

  // Deliver: back -> front, between lines 2 and 3.
  state.particles.push({
    mode: "deliver",
    x: MATERIAL_BACK_X - random(0, 6),
    y: MATERIAL_TOP_LANE_Y + random(-0.8, 0.8),
    vx: -MATERIAL_DELIVER_SPEED,
    vy: 0,
    drifted: false,
    exiting: false,
    fadeLife: MATERIAL_DELIVER_FADE_FRAMES,
    maxFadeLife: MATERIAL_DELIVER_FADE_FRAMES,
    driftVy: random(-0.06, 0.06),
    r: MATERIAL_BALL_RADIUS,
    color: rgb
  });

  // Remove: front -> back, between lines 4 and 5.
  state.particles.push({
    mode: "remove",
    x: SHAFT_START_X + random(0, 12),
    y: MATERIAL_BOTTOM_LANE_Y + random(-0.8, 0.8),
    vx: MATERIAL_REMOVE_SPEED,
    vy: 0,
    r: MATERIAL_BALL_RADIUS * 0.95,
    color: rgb
  });
}

function updateAndDrawSynapticMaterialFlow(role = "post") {
  if (window.SYNAPTIC_MATERIAL_FLOW?.enabled === false) return;
  const key = role === "pre" ? "pre" : "post";
  const state = window.synapticMaterialTransport[key];
  if (!state) return;

  state.tick += 1;
  if (state.tick % MATERIAL_EVENT_PERIOD_FRAMES === 0) {
    spawnSynapticMaterialPair(state, key);
  }

  push();
  noStroke();
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    if (p.mode === "deliver") {
      p.vx = lerp(p.vx, -MATERIAL_DELIVER_SPEED, 0.02);
      p.vy *= 0.95;

      // Arrival at the synaptic head: soften velocity and drift inward.
      if (p.x <= SHAFT_START_X + 6 && !p.drifted) {
        p.drifted = true;
      }
      if (p.drifted) {
        p.vx = lerp(p.vx, -0.08, 0.035);
        p.vy = lerp(p.vy, p.driftVy || 0, 0.04);
        // Start fading only after material exits the microtubule front.
        if (p.x <= SHAFT_START_X - 8) {
          p.exiting = true;
        }
      }
      if (p.exiting) {
        p.fadeLife -= 2.0;
      }
    } else {
      // Removal stream exits through the bottom lane toward the shaft back.
      p.vx = lerp(p.vx, MATERIAL_REMOVE_SPEED, 0.03);
      p.vy *= 0.95;
    }

    p.x += p.vx;
    p.y += p.vy;

    if (p.mode === "remove" && p.x >= MATERIAL_BACK_X + 8) {
      state.particles.splice(i, 1);
      continue;
    }
    if (p.mode === "deliver" && p.exiting && p.fadeLife <= 0) {
      state.particles.splice(i, 1);
      continue;
    }

    const alpha = p.mode === "deliver" && p.exiting
      ? map(p.fadeLife, 0, p.maxFadeLife, 0, 255, true)
      : 255;
    const rgb = p.color || [255, 220, 160];
    fill(rgb[0], rgb[1], rgb[2], alpha);
    circle(p.x, p.y, (p.r || MATERIAL_BALL_RADIUS) * 2);
    fill(255, 255, 255, alpha * 0.45);
    circle(p.x - 1.1, p.y - 1.2, (p.r || MATERIAL_BALL_RADIUS) * 0.8);
  }
  pop();
}


function drawShaftMicrotubuleLattice() {
  if (window.SHAFT_MICROTUBULES?.enabled === false) return;

  const stemHalf = 40;
  const shaftStartX = SHAFT_START_X;
  const shaftEndX   = SHAFT_END_X;
  const tubeRadius  = SHAFT_TUBE_RADIUS;
  const latticeStep = SHAFT_LATTICE_STEP;
  const tubeYs      = SHAFT_PIPE_YS;

  push();
  noFill();

  // Longitudinal microtubule bundles.
  stroke(246, 244, 232, 155);
  strokeWeight(1.6);
  for (const y of tubeYs) {
    line(shaftStartX, y - tubeRadius, shaftEndX, y - tubeRadius);
    line(shaftStartX, y + tubeRadius, shaftEndX, y + tubeRadius);
    stroke(255, 253, 244, 115);
    line(shaftStartX, y, shaftEndX, y);
    stroke(246, 244, 232, 155);
  }

  // Ring + diagonal repeats give a tube-like lattice feel.
  strokeWeight(1.2);
  for (let x = shaftStartX; x <= shaftEndX; x += latticeStep) {
    for (const y of tubeYs) {
      stroke(250, 248, 238, 140);
      ellipse(x, y, tubeRadius * 2.1, tubeRadius * 2.1);
    }

    stroke(236, 234, 224, 110);
    for (let i = 0; i < tubeYs.length - 1; i++) {
      const yA = tubeYs[i];
      const yB = tubeYs[i + 1];
      line(x - 7, yA + tubeRadius * 0.8, x + 9, yB - tubeRadius * 0.8);
      line(x - 7, yA - tubeRadius * 0.8, x + 9, yB + tubeRadius * 0.8);
    }
  }

  // Keep lattice visually clipped to the shaft interior.
  stroke(252, 249, 236, 34);
  strokeWeight(2.4);
  line(shaftStartX, -stemHalf + 1, shaftEndX, -stemHalf + 1);
  line(shaftStartX, stemHalf - 1, shaftEndX, stemHalf - 1);
  pop();
}


// -----------------------------------------------------
// DRAW NEURON SHAPE (SCALED)
// -----------------------------------------------------
function drawTNeuronShape(dir = 1, role = "post") {

  push();

  // 🔑 Scale ONLY geometry (vesicles are membrane-relative)
  scale(
    dir * window.NEURON_GEOMETRY_SCALE,
    window.NEURON_GEOMETRY_SCALE
  );

  stroke(...window.COLORS?.neuron ?? [245, 225, 140]);
  fill(245, 225, 140, 35);

  const STEM_FAR  = 2000;
  const stemHalf = 40;
  const barHalf  = 140;
  const barThick = 340;
  const rBar     = min(80, barHalf);

  beginShape();

  // ---------------- Stem (open) ----------------
  vertex(STEM_FAR, -stemHalf);
  vertex(barThick / 2, -stemHalf);
  vertex(barThick / 2, -barHalf + rBar);

  // ---------------- Top bar ----------------
  quadraticVertex(
    barThick / 2, -barHalf,
    barThick / 2 - rBar, -barHalf
  );

  // ---------------- Synaptic face (AUTHORITATIVE) ----------------
  vertex(rBar, -barHalf);
  quadraticVertex(0, -barHalf, 0, -barHalf + rBar);
  vertex(0, barHalf - rBar);
  quadraticVertex(0, barHalf, rBar, barHalf);

  // ---------------- Bottom bar ----------------
  vertex(barThick / 2 - rBar, barHalf);
  quadraticVertex(
    barThick / 2, barHalf,
    barThick / 2, barHalf - rBar
  );

  // ---------------- Stem exit ----------------
  vertex(barThick / 2, stemHalf);
  vertex(STEM_FAR, stemHalf);

  endShape(CLOSE);

  drawShaftMicrotubuleLattice();
  updateAndDrawSynapticMaterialFlow(role);
  pop();
}


// -----------------------------------------------------
// MEMBRANE SURFACE SAMPLER (SCALED)
// -----------------------------------------------------
//
// 🔑 MUST match drawTNeuronShape() exactly
// Vesicles, fusion, recycling, NT release depend on this
//
// -----------------------------------------------------
window.getSynapticMembraneX = function (y) {

  const S = window.NEURON_GEOMETRY_SCALE;

  // Convert to unscaled geometry space
  const yLocal = y / S;

  const barHalf = 140;
  const rBar    = 80;

  let xLocal;

  // ---------------- Top rounded corner ----------------
  if (yLocal < -barHalf + rBar) {
    const dy = yLocal + barHalf - rBar;
    xLocal = rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------- Bottom rounded corner ----------------
  else if (yLocal > barHalf - rBar) {
    const dy = yLocal - (barHalf - rBar);
    xLocal = rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------- Flat synaptic face ----------------
  else {
    xLocal = 0;
  }

  // Convert back to scaled space
  return xLocal * S;
};
