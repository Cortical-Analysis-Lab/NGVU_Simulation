console.log("🟡 preSynapse loaded — GEOMETRY AUTHORITY");

// =====================================================
// PRESYNAPTIC GEOMETRY — SINGLE SOURCE OF TRUTH
// =====================================================
//
// AUTHORITATIVE SPATIAL CONTRACT:
// • Vesicle center stops at STOP_X (membrane-normal)
// • Visual fusion / occlusion occurs at FUSION_PLANE_X
// • All downstream files MUST reference these values
// • Curvature MUST match neuronShape.js exactly
//
// =====================================================


// -----------------------------------------------------
// TERMINAL GEOMETRY
// -----------------------------------------------------

window.SYNAPSE_TERMINAL_CENTER_Y = 0;
window.SYNAPSE_TERMINAL_RADIUS   = 130;


// -----------------------------------------------------
// VESICLE GEOMETRY
// -----------------------------------------------------

// Kinematic stop (vesicle center halts at membrane-normal offset)
window.SYNAPSE_VESICLE_STOP_X = 16;

// Cytosolic reserve offset (for recycling return)
window.SYNAPSE_BACK_OFFSET_X = 60;

// Vesicle dimensions
window.SYNAPSE_VESICLE_RADIUS = 10;
window.SYNAPSE_VESICLE_STROKE = 4;

// -----------------------------------------------------
// VISUAL FUSION / OCCLUSION PLANE
// -----------------------------------------------------
//
// IMPORTANT:
// • This is NOT an absolute X coordinate
// • This is an OFFSET along the membrane normal
// • Actual fusion plane position is:
//
//   membraneX(y) + SYNAPSE_FUSION_PLANE_X
//
// -----------------------------------------------------

window.SYNAPSE_FUSION_PLANE_X =
  window.SYNAPSE_VESICLE_STOP_X -
  window.SYNAPSE_VESICLE_RADIUS * 1.65;


// -----------------------------------------------------
// POPULATION
// -----------------------------------------------------

window.SYNAPSE_MAX_VESICLES = 7;


// -----------------------------------------------------
// DEBUG FLAGS
// -----------------------------------------------------

// NOTE:
// • When false, NO planes or guides are drawn
// • Geometry is still used internally
window.SHOW_SYNAPSE_DEBUG = false;


// -----------------------------------------------------
// CONSOLE VERIFICATION
// -----------------------------------------------------

console.log("▶ SYNAPSE_VESICLE_STOP_X  =", window.SYNAPSE_VESICLE_STOP_X);
console.log("▶ SYNAPSE_FUSION_PLANE_X  =", window.SYNAPSE_FUSION_PLANE_X);
console.log("▶ SYNAPSE_VESICLE_RADIUS  =", window.SYNAPSE_VESICLE_RADIUS);
console.log("▶ SYNAPSE_TERMINAL_RADIUS =", window.SYNAPSE_TERMINAL_RADIUS);


// =====================================================
// PRESYNAPTIC AP PATH (VISUAL ONLY)
// =====================================================

window.PRESYNAPTIC_AP_PATH = [
  { x: 153.1, y:  4.7 },
  { x: 170.5, y: -5.1 },
  { x: 181.1, y: -20.5 },
  { x: 200.1, y: -22.9 },
  { x: 214.9, y: -16.9 },
  { x: 219.3, y:   3.7 },
  { x: 219.7, y:  30.1 },
  { x: 215.9, y:  49.7 },
  { x: 204.7, y:  57.5 },
  { x: 186.5, y:  57.9 },
  { x: 171.9, y:  43.1 },
  { x: 170.5, y:  29.1 },
  { x: 153.5, y:  28.7 }
];

window.AP_PATH_SCALE  = 6.0;
window.AP_PATH_OFFSET = { x: -120, y: 0 };

window.calibratePath = function (path) {
  return path.map(p => ({
    x: p.x * window.AP_PATH_SCALE + window.AP_PATH_OFFSET.x,
    y: p.y * window.AP_PATH_SCALE + window.AP_PATH_OFFSET.y
  }));
};

const PRE_CA_CHANNEL_Y = [-124, 124];
const PRE_CA_TOP_SHIFT_ALONG_MEMBRANE = 40;
const PRE_CA_BOTTOM_SHIFT_ALONG_MEMBRANE = 0;
const PRE_CA_TOP_EXTRA_ROTATION = -Math.PI / 2; // 120 deg opposite from current +30
const PRE_CA_TOP_DOWN_NUDGE_Y = -6;
const PRE_WAVE_SLOW_EXPONENT = 1.45;
const PRE_WAVE_TRAIL_WINDOW = 0.13;
const PRE_WAVE_TRAIL_STEP = 0.008;
const PRE_WAVE_SHAFT_START_X = 340;
const PRE_CA_FADE_STEP = 1.95;
const PRE_CA_SPAWN_COOLDOWN = 14;
const PRE_CA_OPEN_HOLD_FRAMES = 180; // ~3s at 60 FPS
const PRE_CA_TRAIN_MIN = 7;
const PRE_CA_TRAIN_MAX = 10;
const PRE_CA_TO_FUSION_DELAY_FRAMES = 66;
const PRE_MITO_PUMP_PERIOD_FRAMES = 600; // 10s at 60 FPS
const PRE_MITO_PARTICLE_LIFE_FRAMES = 90; // 1.5s fade
const PRE_MITO_PUMP_WINDOW_FRAMES = 18;

window.preCaInflux = window.preCaInflux || {
  particles: [],
  releaseDelayFrames: -1,
  pendingApId: -1,
  lastTriggeredApId: -1,
  channels: [
    { cooldown: 0, serial: 0, openTimer: 0, waveContact: false, trainBudget: 0 },
    { cooldown: 0, serial: 0, openTimer: 0, waveContact: false, trainBudget: 0 }
  ]
};
window.preMitoPump = window.preMitoPump || {
  phase: 0,
  particles: [],
  serial: 0
};

function getPresynapticMembraneFrame(y) {
  const eps = 1.2;
  const x = window.getSynapticMembraneX(y);
  const x1 = window.getSynapticMembraneX(y - eps);
  const x2 = window.getSynapticMembraneX(y + eps);
  const dxdy = (x2 - x1) / (2 * eps);

  // Parametric tangent for curve (x(y), y)
  let tx = dxdy;
  let ty = 1;
  const tMag = Math.hypot(tx, ty) || 1;
  tx /= tMag;
  ty /= tMag;

  // Inward normal points toward terminal interior (+X in this local frame).
  let nx = 1;
  let ny = -dxdy;
  const nMag = Math.hypot(nx, ny) || 1;
  nx /= nMag;
  ny /= nMag;

  return {
    x,
    y,
    tx,
    ty,
    nx,
    ny,
    tangentAngle: atan2(ty, tx),
    normalAngle: atan2(ny, nx)
  };
}

function getWaveTrackProgress(progress) {
  const p = constrain(progress, 0, 1);
  return pow(p, PRE_WAVE_SLOW_EXPONENT);
}

function samplePresynapticWaveTrack(lane, tIn) {
  const t = constrain(tIn, 0, 1);
  const s = window.NEURON_GEOMETRY_SCALE || 1;
  const stemHalf = 40 * s;
  const barHalf = 140 * s;
  const rBar = 80 * s;
  const xShaftBack = PRE_WAVE_SHAFT_START_X * s;
  const xStem = 170 * s;
  const xTopInner = (170 - 80) * s;
  const xTopOuter = 80 * s;
  const yJoin = lane === "top" ? -stemHalf : stemHalf;
  const yCurveIn = lane === "top" ? -(barHalf - rBar) : (barHalf - rBar);
  const yTop = lane === "top" ? -barHalf : barHalf;

  const len0 = Math.abs(xStem - xShaftBack);
  const len1 = Math.abs(yCurveIn - yJoin);
  const len2 = HALF_PI * rBar;
  const len3 = Math.abs(xTopOuter - xTopInner);
  const len4 = HALF_PI * rBar;
  const total = len0 + len1 + len2 + len3 + len4;
  let d = t * total;

  if (d <= len0) {
    return {
      x: lerp(xShaftBack, xStem, d / max(len0, 1)),
      y: yJoin
    };
  }
  d -= len0;

  if (d <= len1) {
    return {
      x: xStem,
      y: lerp(yJoin, yCurveIn, d / max(len1, 1))
    };
  }
  d -= len1;

  if (d <= len2) {
    const a = d / max(len2, 1);
    const theta = lane === "top"
      ? lerp(0, -HALF_PI, a)
      : lerp(0, HALF_PI, a);
    const cx = xTopInner;
    const cy = yCurveIn;
    return {
      x: cx + rBar * cos(theta),
      y: cy + rBar * sin(theta)
    };
  }
  d -= len2;

  if (d <= len3) {
    return {
      x: lerp(xTopInner, xTopOuter, d / max(len3, 1)),
      y: yTop
    };
  }
  d -= len3;

  const a = constrain(d / max(len4, 1), 0, 1);
  const theta = lane === "top"
    ? lerp(-HALF_PI, -PI, a)
    : lerp(HALF_PI, PI, a);
  const cx = xTopOuter;
  const cy = yCurveIn;
  return {
    x: cx + rBar * cos(theta),
    y: cy + rBar * sin(theta)
  };
}

function getPresynapticWavePoses(progress) {
  const t = getWaveTrackProgress(progress);
  return {
    top: samplePresynapticWaveTrack("top", t),
    bottom: samplePresynapticWaveTrack("bottom", t)
  };
}

function drawPresynapticMembraneWave(progress) {
  const tCenter = getWaveTrackProgress(progress);
  const poses = getPresynapticWavePoses(progress);
  const pulse = 0.55 + 0.45 * sin(frameCount * 0.38);

  push();
  blendMode(ADD);
  noFill();
  strokeWeight(8.2);
  stroke(255, 236, 98, 215 * pulse);

  for (const lane of ["top", "bottom"]) {
    beginShape();
    for (
      let dt = -PRE_WAVE_TRAIL_WINDOW;
      dt <= PRE_WAVE_TRAIL_WINDOW;
      dt += PRE_WAVE_TRAIL_STEP
    ) {
      const pt = samplePresynapticWaveTrack(lane, tCenter + dt);
      vertex(pt.x, pt.y);
    }
    endShape();

    const head = lane === "top" ? poses.top : poses.bottom;
    strokeWeight(3.1);
    stroke(255, 248, 190, 235 * pulse);
    point(head.x, head.y);

    noStroke();
    fill(255, 248, 170, 240 * pulse);
    circle(head.x, head.y, 20);
    fill(255, 238, 115, 255 * pulse);
    circle(head.x, head.y, 11);

    noFill();
    strokeWeight(8.2);
    stroke(255, 236, 98, 215 * pulse);
  }

  blendMode(BLEND);
  pop();
}

function ensurePreCaInfluxState() {
  if (!window.preCaInflux || !Array.isArray(window.preCaInflux.channels)) {
    window.preCaInflux = {
      particles: [],
      releaseDelayFrames: -1,
      pendingApId: -1,
      lastTriggeredApId: -1,
      channels: [
        { cooldown: 0, serial: 0, openTimer: 0, waveContact: false, trainBudget: 0 },
        { cooldown: 0, serial: 0, openTimer: 0, waveContact: false, trainBudget: 0 }
      ]
    };
    return;
  }

  if (typeof window.preCaInflux.releaseDelayFrames !== "number") {
    window.preCaInflux.releaseDelayFrames = -1;
  }
  if (typeof window.preCaInflux.pendingApId !== "number") {
    window.preCaInflux.pendingApId = -1;
  }
  if (typeof window.preCaInflux.lastTriggeredApId !== "number") {
    window.preCaInflux.lastTriggeredApId = -1;
  }

  for (const ch of window.preCaInflux.channels) {
    if (typeof ch.cooldown !== "number") ch.cooldown = 0;
    if (typeof ch.serial !== "number") ch.serial = 0;
    if (typeof ch.openTimer !== "number") ch.openTimer = 0;
    if (typeof ch.waveContact !== "boolean") ch.waveContact = false;
    if (typeof ch.trainBudget !== "number") ch.trainBudget = 0;
  }
}

function scheduleCaTriggeredFusion(apId) {
  const state = window.preCaInflux;
  if (!state) return;
  if (!Number.isFinite(apId) || apId <= 0) return;
  if (state.pendingApId === apId) return;
  if (state.lastTriggeredApId === apId) return;
  state.pendingApId = apId;
  state.releaseDelayFrames = PRE_CA_TO_FUSION_DELAY_FRAMES;
}

function updateCaTriggeredFusionDelay() {
  const state = window.preCaInflux;
  if (!state || state.releaseDelayFrames < 0) return;

  state.releaseDelayFrames -= 1;
  if (state.releaseDelayFrames > 0) return;

  state.releaseDelayFrames = -1;
  const apId = state.pendingApId;
  state.pendingApId = -1;

  if (!Number.isFinite(apId) || apId <= 0) return;
  if (state.lastTriggeredApId === apId) return;

  if (typeof triggerVesicleReleaseFromAP === "function") {
    const releaseMode =
      window.terminalAP?.apReleaseMode?.[apId] || "all";
    triggerVesicleReleaseFromAP(releaseMode);
    if (window.terminalAP?.apReleaseMode) {
      delete window.terminalAP.apReleaseMode[apId];
    }
    state.lastTriggeredApId = apId;
  }
}

function isPreCaLaneOccupied(frame) {
  const particles = window.preCaInflux?.particles || [];
  for (const p of particles) {
    if (p.enteredCell) continue;
    if (dist(p.x, p.y, frame.x, frame.y) < 2.8) return true;
  }
  return false;
}

function spawnPreCaIon(frame, chState) {
  const laneOffsets = [-1.1, 0, 1.1];
  const lane = laneOffsets[chState.serial % laneOffsets.length];
  chState.serial += 1;
  window.preCaInflux.particles.push({
    x: frame.x + frame.tx * lane,
    y: frame.y + frame.ty * lane,
    vx: frame.nx * random(0.14, 0.19) + frame.tx * lane * 0.01,
    vy: frame.ny * random(0.14, 0.19) + frame.ty * lane * 0.01,
    nx: frame.nx,
    ny: frame.ny,
    tx: frame.tx,
    ty: frame.ty,
    alpha: 230,
    life: 120,
    enteredCell: false,
    travel: 0,
    poreBoost: random(0.016, 0.024),
    spreadSeed: random(-1, 1)
  });
}

function constrainPreCaToPresynapticTerminal(p) {
  const s = window.NEURON_GEOMETRY_SCALE || 1;
  const barHalf = 140 * s;
  const stemHalf = 40 * s;
  const stemX = 170 * s;
  const xShaftMax = 240 * s;

  if (p.y < -barHalf) {
    p.y = -barHalf;
    p.vy = Math.abs(p.vy) * 0.35;
  } else if (p.y > barHalf) {
    p.y = barHalf;
    p.vy = -Math.abs(p.vy) * 0.35;
  }

  const membraneX = window.getSynapticMembraneX(p.y);
  const minX = membraneX + 1.8;
  const maxX = Math.abs(p.y) <= stemHalf ? xShaftMax : stemX;

  if (p.x < minX) {
    const frame = getPresynapticMembraneFrame(p.y);
    p.x = minX;
    p.vx = max(p.vx, 0) + frame.nx * 0.12;
    p.vy += frame.ny * 0.04;
  } else if (p.x > maxX) {
    p.x = maxX;
    p.vx = min(p.vx, 0) * 0.55;
    p.vy *= 0.86;
  }
}

function updateAndDrawPreCaIons() {
  const particles = window.preCaInflux?.particles || [];
  if (!particles.length) return;

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Match AMPA/NMDA ion feel: quick pore pull, then intracellular fan-out.
    if (!p.enteredCell && p.travel >= 2.0) {
      p.enteredCell = true;
      p.vx += (p.tx || 0) * random(-0.18, 0.18);
      p.vy += (p.ty || 0) * random(-0.18, 0.18);
    }

    if (!p.enteredCell) {
      p.vx += (p.nx || 1) * p.poreBoost;
      p.vy += (p.ny || 0) * p.poreBoost;
    } else {
      // Spread throughout bouton interior while gently keeping ions inside terminal bounds.
      const r = Math.hypot(p.x, p.y);
      if (r > 126) {
        p.vx += (-p.x / (r || 1)) * 0.05;
        p.vy += (-p.y / (r || 1)) * 0.05;
      } else if (r > 95) {
        p.vx += (-p.x / (r || 1)) * 0.01;
        p.vy += (-p.y / (r || 1)) * 0.01;
      }
      p.vx += random(-0.035, 0.035) + (p.ty || 0) * p.spreadSeed * 0.01;
      p.vy += random(-0.035, 0.035) - (p.tx || 0) * p.spreadSeed * 0.01;
      p.vx *= 0.985;
      p.vy *= 0.985;
    }

    p.x += p.vx;
    p.y += p.vy;
    constrainPreCaToPresynapticTerminal(p);
    p.travel = (p.travel || 0) + Math.hypot(p.vx, p.vy);
    p.alpha -= PRE_CA_FADE_STEP;
    p.life -= 1;

    if (p.alpha <= 0 || p.life <= 0 || abs(p.x) > 240 || abs(p.y) > 240) {
      particles.splice(i, 1);
    }
  }

  push();
  textSize(10);
  textAlign(CENTER, CENTER);
  for (const p of particles) {
    fill(255, 175, 72, p.alpha);
    push();
    translate(p.x, p.y);
    rotate(PI); // parent synapse is rotated PI; counter-rotate text so Ca2+ is upright
    text("Ca2+", 0, 0);
    pop();
  }
  pop();
}

function drawPresynapticCaChannels(progress) {
  ensurePreCaInfluxState();
  updateCaTriggeredFusionDelay();
  const wavePoses = getPresynapticWavePoses(progress);
  const channelStates = window.preCaInflux.channels;
  const currentApId = window.terminalAP?.apId || 0;

  push();
  textAlign(CENTER, CENTER);
  textSize(8);

  for (let idx = 0; idx < PRE_CA_CHANNEL_Y.length; idx++) {
    const y = PRE_CA_CHANNEL_Y[idx];
    const f = getPresynapticMembraneFrame(y);
    const isTopChannel = y > 0;
    const along = isTopChannel
      ? PRE_CA_TOP_SHIFT_ALONG_MEMBRANE
      : PRE_CA_BOTTOM_SHIFT_ALONG_MEMBRANE;
    const shiftedY = f.y + f.ty * along + (isTopChannel ? PRE_CA_TOP_DOWN_NUDGE_Y : 0);
    const fShift = getPresynapticMembraneFrame(shiftedY);
    const cx = fShift.x;
    const cy = fShift.y;
    const wavePose = y < 0 ? wavePoses.top : wavePoses.bottom;
    const waveHit = window.terminalAP?.active
      && dist(wavePose.x, wavePose.y, fShift.x, fShift.y) < 34;
    const chState = channelStates[idx];

    chState.cooldown = max(0, chState.cooldown - 1);
    chState.openTimer = max(0, chState.openTimer - 1);

    if (waveHit && !chState.waveContact) {
      chState.openTimer = PRE_CA_OPEN_HOLD_FRAMES;
      chState.trainBudget = floor(random(PRE_CA_TRAIN_MIN, PRE_CA_TRAIN_MAX));
    }
    chState.waveContact = waveHit;

    const active = waveHit || chState.openTimer > 0;
    if (active) {
      if (
        chState.trainBudget > 0 &&
        chState.cooldown <= 0 &&
        !isPreCaLaneOccupied(fShift)
      ) {
        spawnPreCaIon(fShift, chState);
        scheduleCaTriggeredFusion(currentApId);
        chState.cooldown = PRE_CA_SPAWN_COOLDOWN;
        chState.trainBudget = max(0, chState.trainBudget - 1);
      }
    }

    push();
    translate(cx, cy);
    rotate(fShift.normalAngle + (isTopChannel ? PRE_CA_TOP_EXTRA_ROTATION : 0));

    // Voltage-gated Ca2+ channel body: two squished pores rotated 90 degrees.
    const poreW = 15.8;
    const poreH = 8.4;
    const pairOffset = 3.8; // slight overlap to look squished together
    noStroke();
    fill(active ? color(255, 166, 56, 230) : color(218, 142, 86, 190));
    ellipse(0, -pairOffset, poreW, poreH);
    ellipse(0, pairOffset, poreW, poreH);
    fill(active ? color(255, 214, 142, 210) : color(245, 198, 138, 160));
    ellipse(0, -pairOffset, poreW * 0.62, poreH * 0.62);
    ellipse(0, pairOffset, poreW * 0.62, poreH * 0.62);

    // Outside: three pluses (cleft-facing)
    fill(255, 242, 190, active ? 240 : 160);
    push();
    translate(-11.2, -0.2);
    rotate(HALF_PI);
    text(`+ + +`, 0, 0);
    pop();

    // Inside: three minuses (cytosol-facing)
    fill(140, 206, 255, active ? 220 : 145);
    push();
    translate(11.2, -0.2);
    rotate(HALF_PI);
    text(`- - -`, 0, 0);
    pop();

    pop();
  }

  pop();
  updateAndDrawPreCaIons();
}

function getPresynapticCaChannelAnchors() {
  const preX = window.SYNAPSE_PRE_X ?? -130;
  const neuronY = window.SYNAPSE_NEURON_Y ?? 40;
  const anchors = [];

  for (const y of PRE_CA_CHANNEL_Y) {
    const f = getPresynapticMembraneFrame(y);
    const isTopChannel = y > 0;
    const along = isTopChannel
      ? PRE_CA_TOP_SHIFT_ALONG_MEMBRANE
      : PRE_CA_BOTTOM_SHIFT_ALONG_MEMBRANE;
    const shiftedY = f.y + f.ty * along + (isTopChannel ? PRE_CA_TOP_DOWN_NUDGE_Y : 0);
    const fShift = getPresynapticMembraneFrame(shiftedY);
    anchors.push({
      x: preX - fShift.x,
      y: neuronY - fShift.y,
      localX: fShift.x,
      localY: fShift.y
    });
  }

  return anchors;
}

function drawMitochondrion(x, y, w = 56, h = 22, tilt = 0, squish01 = 0) {
  push();
  translate(x, y);
  rotate(tilt);
  scale(1 + 0.11 * squish01, 1 - 0.15 * squish01);

  // Outer membrane.
  stroke(156, 52, 46, 225);
  strokeWeight(1.6);
  fill(206, 84, 74, 188);
  ellipse(0, 0, w, h);

  // Intermembrane + inner membrane envelope.
  stroke(138, 44, 40, 215);
  strokeWeight(1.0);
  fill(228, 118, 104, 120);
  ellipse(0, 0, w * 0.88, h * 0.8);

  // Single bulbous/blobby crista-like zig-zag line.
  noFill();
  stroke(122, 36, 34, 214);
  strokeWeight(5.1);
  beginShape();
  for (let t = 0; t <= 22; t++) {
    const u = t / 22;
    const xx = lerp(-w * 0.36, w * 0.36, u);
    const zz = sin(u * TWO_PI * 3) * (h * 0.17);
    const blob = sin(u * TWO_PI * 1.5 + 0.55) * (h * 0.06);
    vertex(xx, zz + blob);
  }
  endShape();

  pop();
}

function getPresynapticBackMembraneFrame(y) {
  const barHalf = 140;
  const rBar = 80;
  const stemX = 170;
  const cornerCx = 90;
  let x = stemX;
  let dxdy = 0;

  if (y < -barHalf + rBar) {
    const dy = y + (barHalf - rBar); // y + 60
    const root = sqrt(max(1e-6, rBar * rBar - dy * dy));
    x = cornerCx + root;
    dxdy = -dy / root;
  } else if (y > barHalf - rBar) {
    const dy = y - (barHalf - rBar); // y - 60
    const root = sqrt(max(1e-6, rBar * rBar - dy * dy));
    x = cornerCx + root;
    dxdy = -dy / root;
  }

  let tx = dxdy;
  let ty = 1;
  const tMag = Math.hypot(tx, ty) || 1;
  tx /= tMag;
  ty /= tMag;

  // Choose inward normal that points into bouton interior (toward -X).
  let nx = -ty;
  let ny = tx;
  if (nx > 0) {
    nx *= -1;
    ny *= -1;
  }

  return {
    x,
    y,
    tx,
    ty,
    nx,
    ny,
    tangentAngle: atan2(ty, tx)
  };
}

function getPresynapticMitoAnchors() {
  // Back-curve placement: parallel to local back membrane tangent.
  const inset = 24;
  const topFrame = getPresynapticBackMembraneFrame(-84);
  const bottomFrame = getPresynapticBackMembraneFrame(84);

  return [
    {
      x: topFrame.x + topFrame.nx * inset,
      y: topFrame.y + topFrame.ny * inset,
      tilt: topFrame.tangentAngle
    },
    {
      x: bottomFrame.x + bottomFrame.nx * inset,
      y: bottomFrame.y + bottomFrame.ny * inset,
      tilt: bottomFrame.tangentAngle
    }
  ];
}

function spawnPreMitoParticle(type, anchor) {
  const a = random(TWO_PI);
  const speed = random(0.22, 0.44);
  const vx = cos(a) * speed;
  const vy = sin(a) * speed;
  window.preMitoPump.particles.push({
    type,
    x: anchor.x + random(-5, 5),
    y: anchor.y + random(-4, 4),
    vx,
    vy,
    life: PRE_MITO_PARTICLE_LIFE_FRAMES,
    maxLife: PRE_MITO_PARTICLE_LIFE_FRAMES
  });
}

function runPreMitoPumpCycle(anchors) {
  const pump = window.preMitoPump;
  pump.phase += 1;

  if (pump.phase > 0 && pump.phase % PRE_MITO_PUMP_PERIOD_FRAMES === 0) {
    for (let i = 0; i < 2; i++) {
      const atpAnchor = anchors[pump.serial % anchors.length];
      pump.serial += 1;
      spawnPreMitoParticle("ATP", atpAnchor);
    }
    for (let i = 0; i < 2; i++) {
      const hAnchor = anchors[pump.serial % anchors.length];
      pump.serial += 1;
      spawnPreMitoParticle("H+", hAnchor);
    }
  }

  for (let i = pump.particles.length - 1; i >= 0; i--) {
    const p = pump.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.992;
    p.vy *= 0.992;
    p.life -= 1;
    if (p.life <= 0) {
      pump.particles.splice(i, 1);
    }
  }
}

function drawPreMitoPumpParticles() {
  const pump = window.preMitoPump;
  if (!pump.particles.length) return;

  push();
  textAlign(CENTER, CENTER);
  textSize(9);
  noStroke();
  for (const p of pump.particles) {
    const alpha = map(p.life, 0, p.maxLife, 0, 255, true);
    push();
    translate(p.x, p.y);
    rotate(PI); // counter parent PI rotation so text stays readable
    if (p.type === "ATP") {
      fill(120, 230, 120, alpha);
      text("ATP", 0, 0);
    } else {
      fill(255, 255, 255, alpha);
      text("H+", 0, 0);
    }
    pop();
  }
  pop();
}

function drawPresynapticMitochondria() {
  const anchors = getPresynapticMitoAnchors();
  runPreMitoPumpCycle(anchors);

  const pulsePhase = window.preMitoPump.phase % PRE_MITO_PUMP_PERIOD_FRAMES;
  const squish01 = pulsePhase < PRE_MITO_PUMP_WINDOW_FRAMES
    ? sin((pulsePhase / PRE_MITO_PUMP_WINDOW_FRAMES) * PI)
    : 0;

  drawMitochondrion(
    anchors[0].x,
    anchors[0].y,
    56,
    22,
    anchors[0].tilt,
    squish01
  );
  drawMitochondrion(
    anchors[1].x,
    anchors[1].y,
    56,
    22,
    anchors[1].tilt,
    squish01
  );
  drawPreMitoPumpParticles();
}


// =====================================================
// PRESYNAPTIC DRAW (GEOMETRY ONLY)
// =====================================================
//
// RULES:
// • This file owns ALL presynaptic geometry
// • Rotation happens HERE and only here
// • Vesicles, fusion, and recycling depend on this
//
// DEBUG ADDITIONS:
// • Verifies recycling draw space
// • Confirms seed presence
// • Visual origin marker
//
// =====================================================

window.drawPreSynapse = function () {

  // -----------------------------------------------
  // DEBUG: function entry
  // -----------------------------------------------
  if (frameCount % 120 === 0) {
    console.log("🧠 drawPreSynapse() frame", frameCount);
  }

  push();

  // ---------------------------------------------------
  // CANONICAL ORIENTATION (DO NOT CHANGE)
  // ---------------------------------------------------
  rotate(PI);

  // ---------------------------------------------------
  // DEBUG: rotated origin marker
  // ---------------------------------------------------
  if (window.SHOW_SYNAPSE_DEBUG) {
    push();
    noStroke();
    fill(255, 0, 0, 180);
    circle(0, 0, 10); // MUST appear centered on terminal
    pop();
  }

  // ---------------------------------------------------
  // TERMINAL GEOMETRY (AUTHORITATIVE SHAPE)
  // ---------------------------------------------------
  drawTNeuronShape(1, "pre");
  drawPresynapticMitochondria();
  drawPresynapticCaChannels(window.terminalAP?.progress ?? 0);
  if (window.terminalAP?.active) {
    drawPresynapticMembraneWave(window.terminalAP.progress ?? 0);
  }

  // ---------------------------------------------------
  // DEBUG: CURVED STOP + FUSION PLANES
  // ---------------------------------------------------
  drawVesicleStopPlaneDebug();

  // ---------------------------------------------------
  // ♻️ ENDOCYTOSIS BUDDING (MEMBRANE-OWNED)
  // ---------------------------------------------------
  if (typeof drawVesicleRecycling === "function") {

    // DEBUG: seed count
    if (frameCount % 60 === 0) {
      console.log(
        "♻️ drawVesicleRecycling() called | seeds =",
        window.endocytosisSeeds?.length ?? "N/A"
      );
    }

    drawVesicleRecycling();
  } else {
    console.warn("⚠️ drawVesicleRecycling not defined");
  }

  // ---------------------------------------------------
  // VESICLES (GEOMETRY + CONTENTS)
  // ---------------------------------------------------
  drawSynapseVesicleGeometry?.();

  // ---------------------------------------------------
  // DEBUG: VESICLE CENTERS
  // ---------------------------------------------------
  if (
    window.SHOW_SYNAPSE_DEBUG &&
    typeof drawVesicleCenters === "function"
  ) {
    drawVesicleCenters();
  }

  // ---------------------------------------------------
  // TERMINAL AP (VISUAL ONLY)
  // ---------------------------------------------------
  const calibratedPath = calibratePath(window.PRESYNAPTIC_AP_PATH);
  drawTerminalAP?.(calibratedPath);

  if (window.apActive === true && window.SHOW_SYNAPSE_DEBUG) {
    drawAPDebugDots(calibratedPath);
  }

  pop();
};


// =====================================================
// DEBUG: STOP PLANE + FUSION PLANE (CURVED)
// =====================================================
//
// IMPORTANT:
// • These curves are NOT straight lines
// • They follow the membrane face exactly
// • They are visualizations ONLY
//
// =====================================================

window.DEBUG_PLANE_HEIGHT = 140;

window.drawVesicleStopPlaneDebug = function () {

  if (!window.SHOW_SYNAPSE_DEBUG) return;

  const H    = window.DEBUG_PLANE_HEIGHT;
  const step = 3;

  push();
  strokeWeight(2);
  noFill();

  // -------------------------
  // 🔵 Vesicle STOP curve
  // -------------------------
  stroke(80, 180, 255, 220);
  beginShape();
  for (let y = -H; y <= H; y += step) {
    const membraneX = window.getSynapticMembraneX(y);
    vertex(
      membraneX + window.SYNAPSE_VESICLE_STOP_X,
      y
    );
  }
  endShape();

  // -------------------------
  // 🔴 Fusion / knife curve
  // -------------------------
  stroke(255, 90, 90, 220);
  beginShape();
  for (let y = -H; y <= H; y += step) {
    const membraneX = window.getSynapticMembraneX(y);
    vertex(
      membraneX + window.SYNAPSE_FUSION_PLANE_X,
      y
    );
  }
  endShape();

  pop();
};


// =====================================================
// DEBUG: AP PATH DOTS
// =====================================================

window.drawAPDebugDots = function (path) {

  const pulse = 0.5 + 0.5 * sin(frameCount * 0.2);

  push();
  blendMode(ADD);
  noStroke();

  for (const p of path) {
    fill(80, 255, 120, 120 * pulse);
    circle(p.x, p.y, 18);

    fill(160, 255, 190, 220 * pulse);
    circle(p.x, p.y, 6);
  }

  blendMode(BLEND);
  pop();
};


// =====================================================
// MEMBRANE SURFACE SAMPLER (AUTHORITATIVE)
// =====================================================
//
// Returns membrane-normal X offset at Y
// MUST match neuronShape.js synaptic face exactly
//
// =====================================================

window.getSynapticMembraneX = function (y) {

  const barHalf = 140;
  const rBar    = 80;

  // ---------------------------------------------------
  // TOP ROUNDED CORNER
  // ---------------------------------------------------
  if (y < -barHalf + rBar) {
    const dy = y + barHalf - rBar;
    return rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------------------------------------------
  // BOTTOM ROUNDED CORNER
  // ---------------------------------------------------
  if (y > barHalf - rBar) {
    const dy = y - (barHalf - rBar);
    return rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------------------------------------------
  // FLAT SYNAPTIC FACE
  // ---------------------------------------------------
  return 0;
};

const PRESYNAPTIC_UPTAKE_GROUPS = [-98, 98];
const PRESYNAPTIC_PAIR_SPACING = 6.0;

function getPresynapticUptakeChannels() {
  const preX = window.SYNAPSE_PRE_X ?? -130;
  const neuronY = window.SYNAPSE_NEURON_Y ?? 40;
  const channels = [];

  for (const baseY of PRESYNAPTIC_UPTAKE_GROUPS) {
    for (const dy of [-PRESYNAPTIC_PAIR_SPACING * 0.5, PRESYNAPTIC_PAIR_SPACING * 0.5]) {
      const localY = baseY + dy;
      const membraneOffset = window.getSynapticMembraneX?.(localY) ?? 0;
      channels.push({
        x: preX - membraneOffset + 3,
        y: neuronY + localY,
        rx: 6,
        ry: 2.4,
        angle: 0,
        groupY: baseY
      });
    }
  }

  return channels;
}

function drawPresynapticUptakeChannels() {
  const channels = getPresynapticUptakeChannels();
  const poreFill = [64, 224, 208];
  const poreStripe = [176, 255, 245];

  push();
  rectMode(CENTER);
  noStroke();

  for (const ch of channels) {
    push();
    translate(ch.x, ch.y);
    rotate(ch.angle);

    const w = ch.rx * 2.4;
    const h = ch.ry * 3.0;

    noStroke();
    fill(poreFill[0], poreFill[1], poreFill[2], 220);
    ellipse(0, 0, w, h);

    noFill();
    stroke(poreStripe[0], poreStripe[1], poreStripe[2], 240);
    strokeWeight(1.0);
    ellipse(0, 0, w * 0.9, h * 0.9);
    ellipse(0, 0, w * 0.66, h * 0.66);

    pop();
  }

  pop();
}

window.getPresynapticUptakeChannels = getPresynapticUptakeChannels;
window.drawPresynapticUptakeChannels = drawPresynapticUptakeChannels;
window.getPresynapticMitoAnchors = getPresynapticMitoAnchors;
window.getPresynapticCaChannelAnchors = getPresynapticCaChannelAnchors;
