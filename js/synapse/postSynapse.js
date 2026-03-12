console.log("🟡 postSynapse loaded — GEOMETRY AUTHORITY");

const POST_WAVE_SPEED = 0.026;
const POST_WAVE_SLOW_EXPONENT = 1.45;
const POST_WAVE_TRAIL_WINDOW = 0.13;
const POST_WAVE_TRAIL_STEP = 0.008;
const POST_WAVE_SHAFT_BACK_X = 340;

window.postNaWave = window.postNaWave || {
  active: false,
  progress: 0,
  pending: false
};

function triggerPostNaReverseWave() {
  const s = window.postNaWave;
  if (!s.active) {
    s.active = true;
    s.progress = 0;
    s.pending = false;
  } else {
    s.pending = true;
  }
}

function updatePostNaReverseWave() {
  const s = window.postNaWave;
  if (!s.active) return;

  s.progress += POST_WAVE_SPEED;
  if (s.progress >= 1) {
    if (s.pending) {
      s.progress = 0;
      s.pending = false;
    } else {
      s.active = false;
      s.progress = 0;
    }
  }
}

function getPostWaveTrackProgress(progress) {
  return pow(constrain(progress, 0, 1), POST_WAVE_SLOW_EXPONENT);
}

function samplePostWaveTrackForward(lane, tIn) {
  const t = constrain(tIn, 0, 1);
  const s = window.NEURON_GEOMETRY_SCALE || 1;
  const stemHalf = 40 * s;
  const barHalf = 140 * s;
  const rBar = 80 * s;
  const xShaftBack = POST_WAVE_SHAFT_BACK_X * s;
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

function samplePostWaveTrackReverse(lane, tIn) {
  return samplePostWaveTrackForward(lane, 1 - constrain(tIn, 0, 1));
}

function drawPostNaReverseWave(progress) {
  const tCenter = getPostWaveTrackProgress(progress);
  const poses = {
    top: samplePostWaveTrackReverse("top", tCenter),
    bottom: samplePostWaveTrackReverse("bottom", tCenter)
  };
  const pulse = 0.55 + 0.45 * sin(frameCount * 0.38);

  push();
  blendMode(ADD);
  noFill();
  strokeWeight(8.2);
  stroke(122, 214, 255, 210 * pulse);

  for (const lane of ["top", "bottom"]) {
    beginShape();
    for (
      let dt = -POST_WAVE_TRAIL_WINDOW;
      dt <= POST_WAVE_TRAIL_WINDOW;
      dt += POST_WAVE_TRAIL_STEP
    ) {
      const pt = samplePostWaveTrackReverse(lane, tCenter + dt);
      vertex(pt.x, pt.y);
    }
    endShape();

    const head = lane === "top" ? poses.top : poses.bottom;
    strokeWeight(3.1);
    stroke(210, 242, 255, 228 * pulse);
    point(head.x, head.y);

    noStroke();
    fill(180, 232, 255, 232 * pulse);
    circle(head.x, head.y, 20);
    fill(138, 214, 255, 246 * pulse);
    circle(head.x, head.y, 11);

    noFill();
    strokeWeight(8.2);
    stroke(122, 214, 255, 210 * pulse);
  }

  blendMode(BLEND);
  pop();
}

// =====================================================
// POSTSYNAPTIC NEURON — GEOMETRY ONLY
// =====================================================
//
// 🔒 HARD CONTRACT (LOCKED):
// • Owns postsynaptic membrane GEOMETRY
// • Exposes membrane sampler (local geometry space)
// • Draws neuron body + PSD
// • Provides debug visualization ONLY
//
// 🚫 THIS FILE MUST NOT:
// • Apply NT constraints
// • Define stop planes
// • Modify NT motion
// • Perform physics
//
// NT confinement is owned by cleftGeometry.js
//
// =====================================================


// -----------------------------------------------------
// DRAW — POSTSYNAPTIC NEURON (LOCAL SPACE)
// -----------------------------------------------------
//
// Coordinate system:
// • Local to SynapseView
// • +X faces AWAY from cleft
// • −X faces INTO cleft
//
function drawPostSynapse() {

  push();

  // Faces synaptic cleft (LEFT)
  scale(+1, 1);

  // Authoritative neuron geometry
  drawTNeuronShape(+1, "post");

  // Postsynaptic density (visual only)
  drawPSDReceptors();
  updatePostNaReverseWave();
  if (window.postNaWave?.active) {
    drawPostNaReverseWave(window.postNaWave.progress ?? 0);
  }

  pop();
}


// =====================================================
// 🔑 POSTSYNAPTIC MEMBRANE SAMPLER (GEOMETRY ONLY)
// =====================================================
//
// MUST match neuronShape.js EXACTLY
//
// Returns:
// • membrane-normal X at given local Y
//
// Used by:
// • cleftGeometry.js (boundary construction)
// • Debug visualization
//
window.getPostSynapticMembraneX = function (y) {

  const barHalf = 140;
  const rBar    = 80;

  // ---------------- Top rounded corner ----------------
  if (y < -barHalf + rBar) {
    const dy = y + barHalf - rBar;
    return rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------- Bottom rounded corner ----------------
  if (y > barHalf - rBar) {
    const dy = y - (barHalf - rBar);
    return rBar - Math.sqrt(
      Math.max(0, rBar * rBar - dy * dy)
    );
  }

  // ---------------- Flat synaptic face ----------------
  return 0;
};


// =====================================================
// 🔵 DEBUG DRAW — POSTSYNAPTIC MEMBRANE (GEOMETRY)
// =====================================================
//
// • Cyan dashed curve
// • Visual reference ONLY
// • NOT a constraint
//
function drawPostSynapseBoundaryDebug() {

  if (!window.SHOW_SYNAPSE_DEBUG) return;
  if (typeof window.getPostSynapticMembraneX !== "function") return;

  const H    = 140;
  const step = 4;

  push();
  stroke(80, 220, 255, 200);
  strokeWeight(2);
  noFill();

  drawingContext.setLineDash([6, 6]);

  beginShape();
  for (let y = -H; y <= H; y += step) {
    vertex(
      window.getPostSynapticMembraneX(y),
      y
    );
  }
  endShape();

  drawingContext.setLineDash([]);
  pop();
}


// -----------------------------------------------------
// 🔒 SANITY CHECK — CONTRACT LOCK
// -----------------------------------------------------
if (window.DEBUG_SYNapseContracts) {
  console.log("🔒 postSynapse contract: GEOMETRY ONLY (cleft-ready)");
}


// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.drawPostSynapse = drawPostSynapse;
window.drawPostSynapseBoundaryDebug = drawPostSynapseBoundaryDebug;
window.triggerPostNaReverseWave = triggerPostNaReverseWave;
