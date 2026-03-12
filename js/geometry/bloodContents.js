// =====================================================
// BLOOD CONTENTS — HEARTBEAT FLOW + LABELED MOLECULES
// =====================================================
// ✔ Text-based molecules (HbO2, Hb, Glu, H2O, O2)
// ✔ O2 only appears after HbO2 dissociation
// ✔ Heartbeat-locked transport
// ✔ Perivascular accumulation before delivery
// ✔ AP-driven SUPPLY increase (flux, not count)
// ✔ Population conserved over time
// =====================================================

console.log("🩸 bloodContents v3.3 (vascular logging added) loaded");

// -----------------------------------------------------
// GLOBAL STORAGE (RELOAD SAFE)
// -----------------------------------------------------

window.bloodParticles = window.bloodParticles || [];
const bloodParticles = window.bloodParticles;

// -----------------------------------------------------
// PARTICLE COUNTS (INITIAL DENSITY ONLY)
// -----------------------------------------------------

const BLOOD_COUNTS = {
  rbcOxy:   26,
  rbcDeoxy: 16,
  water:    22,
  glucose:  16
};

// -----------------------------------------------------
// LANE CONSTRAINTS
// -----------------------------------------------------

const LANE_MIN = -0.55;
const LANE_MAX =  0.55;

// -----------------------------------------------------
// HEARTBEAT PARAMETERS
// -----------------------------------------------------

const HEART_RATE_BPM = 72;
const BEAT_INTERVAL = 60000 / HEART_RATE_BPM;
const FLOW_STEP     = 0.012;

let lastBeatTime = 0;

// -----------------------------------------------------
// BBB TRANSPORT PARAMETERS
// -----------------------------------------------------

const EXIT_LANE_THRESHOLD = 0.25;
const BBB_T_MIN = 0.28;
const BBB_T_MAX = 0.72;

// Baseline probabilities (educational clarity)
const AQP4_PROB_BASE  = 0.040;
const GLUT1_PROB_BASE = 0.050;
const O2_PROB_BASE    = 0.040;

// Upstream recirculation zone where deoxygenated Hb is reloaded to HbO2.
const REOXY_T_MAX      = 0.10;
const REOXY_BEAT_PROB  = 0.28;

// -----------------------------------------------------
// ACTIVITY COUPLING
// -----------------------------------------------------

const METABOLIC_BOOST_DURATION = 10000;
const METABOLIC_MULTIPLIER    = 5.0;
const SUPPLY_BIAS_MULTIPLIER  = 2.5;

let metabolicBoostUntil = 0;

// -----------------------------------------------------
// CSF / PERIVASCULAR MOTION
// -----------------------------------------------------

const CSF_DRIFT             = 0.0225;
const PERIVASCULAR_DRIFT    = 0.006;
const DELIVERY_BEATS_PER_TRIP = 4.0;
const MIN_DELIVERY_STEP     = 1.2;
const WATER_ECS_DRIFT_SPEED = 0.32;
const WATER_TO_ASTRO_SPEED  = 1.35;
const WATER_ASTRO_STOP_DIST = 118;
const WATER_ECS_WANDER      = 0.045;
const WATER_ECS_FADE_STEP   = 0.42;

const BLOOD_TEXT_SIZE_BASE      = 10;
const DELIVERY_TEXT_SIZE_LARGE  = 18;

// -----------------------------------------------------
// INITIALIZE
// -----------------------------------------------------

function initBloodContents() {
  bloodParticles.length = 0;

  if (
    typeof getArteryPoint !== "function" ||
    !Array.isArray(arteryPath) ||
    arteryPath.length === 0
  ) {
    requestAnimationFrame(initBloodContents);
    return;
  }

  function spawn(type, label, colorName, count) {
    for (let i = 0; i < count; i++) {
      const t0 = random();

      bloodParticles.push({
        type,
        label,
        color: COLORS[colorName],

        t: t0,
        tTarget: t0,
        lane: random(LANE_MIN, LANE_MAX),

        state: "intravascular",

        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        alpha: 255
      });
    }
  }

  spawn("rbcOxy",   "HbO₂", "rbcOxy",   BLOOD_COUNTS.rbcOxy);
  spawn("rbcDeoxy", "Hb",   "rbcDeoxy", BLOOD_COUNTS.rbcDeoxy);
  spawn("water",    "H₂O",  "water",    BLOOD_COUNTS.water);
  spawn("glucose",  "Glu",  "glucose",  BLOOD_COUNTS.glucose);
}

// -----------------------------------------------------
// RESPAWN — STEADY STATE CONSERVATION
// -----------------------------------------------------

function respawnIntravascular(oldParticle, forceType = null, supplyGain = 1.0) {
  let type = forceType || oldParticle.type;

  // AP-driven SUPPLY enrichment (flux, not count)
  if (supplyGain > 1.0 && !forceType) {
    const r = random();
    if (r < 0.45 * supplyGain) type = "rbcOxy";
    else if (r < 0.65 * supplyGain) type = "glucose";
  }

  let label = oldParticle.label;
  let color = oldParticle.color;

  if (type === "rbcOxy")   { label = "HbO₂"; color = COLORS.rbcOxy; }
  if (type === "rbcDeoxy") { label = "Hb";   color = COLORS.rbcDeoxy; }
  if (type === "water")    { label = "H₂O";  color = COLORS.water; }
  if (type === "glucose")  { label = "Glu";  color = COLORS.glucose; }

  bloodParticles.push({
    type,
    label,
    color,

    t: random(0.0, 0.05),
    tTarget: random(0.0, 0.05),
    lane: random(LANE_MIN, LANE_MAX),

    state: "intravascular",

    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    alpha: 255
  });
}

// -----------------------------------------------------
// UPDATE
// -----------------------------------------------------

function updateBloodContents() {
  const now = state.time;

  // ---------------- NEURAL ACTIVITY ----------------
  if (
    window.neuron1Fired ||
    (window.lastNeuron1SpikeTime &&
     now - window.lastNeuron1SpikeTime < 50)
  ) {
    metabolicBoostUntil = now + METABOLIC_BOOST_DURATION;
    window.neuron1Fired = false;
  }

  const metabolicGain =
    now < metabolicBoostUntil ? METABOLIC_MULTIPLIER : 1.0;

  const supplyGain =
    now < metabolicBoostUntil ? SUPPLY_BIAS_MULTIPLIER : 1.0;

  const AQP4_PROB  = AQP4_PROB_BASE  * metabolicGain;
  const GLUT1_PROB = GLUT1_PROB_BASE * metabolicGain;
  const O2_PROB    = O2_PROB_BASE    * metabolicGain;

  // ---------------- HEARTBEAT ----------------
  const beat = now - lastBeatTime >= BEAT_INTERVAL;
  if (beat) lastBeatTime = now;

  // ---------------- INTRAVASCULAR FLOW ----------------
  if (beat) {
    for (const p of bloodParticles) {
      if (p.state !== "intravascular") continue;

      const flowGain =
        now < metabolicBoostUntil &&
        (p.type === "rbcOxy" || p.type === "glucose")
          ? 1.6
          : 1.0;

      p.tTarget += FLOW_STEP * flowGain;

      if (p.tTarget > 1) {
        p.tTarget -= 1;
        p.t = p.tTarget;
        p.lane = random(LANE_MIN, LANE_MAX);
      }

      // Recirculation: upstream segment re-oxygenates hemoglobin so O2
      // delivery can continue over long runs.
      if (
        p.type === "rbcDeoxy" &&
        p.tTarget <= REOXY_T_MAX &&
        random() < REOXY_BEAT_PROB
      ) {
        p.type = "rbcOxy";
        p.label = "HbO₂";
        p.color = COLORS.rbcOxy;
      }
    }
  }

  for (const p of bloodParticles) {
    if (p.state === "intravascular") {
      p.t += (p.tTarget - p.t) * 0.15;
    }
  }

  // ---------------- BBB EXIT ----------------
  for (const p of bloodParticles) {
    if (p.state !== "intravascular") continue;
    if (p.t < BBB_T_MIN || p.t > BBB_T_MAX) continue;
    if (Math.abs(p.lane) < EXIT_LANE_THRESHOLD) continue;

    let allow = false;

    if (p.type === "water"   && random() < AQP4_PROB)  allow = true;
    if (p.type === "glucose" && random() < GLUT1_PROB) allow = true;

    // HbO₂ → O₂ dissociation
    if (p.type === "rbcOxy" && random() < O2_PROB) {
      p.type  = "oxygen";
      p.label = "O₂";
      p.color = COLORS.oxygen;
      allow = true;

      if (!state.paused && typeof logEvent === "function") {
        logEvent(
          "vascular",
          "Oxygen dissociated from hemoglobin at the blood–brain barrier",
          "bbb"
        );
      }
    }

    if (!allow) continue;

    const pos = getArteryPoint(p.t, p.lane);
    if (!pos) continue;

    p.state = "perivascular";
    p.x = pos.x;
    p.y = pos.y;

    const dir = p.lane > 0 ? 1 : -1;
    p.vx = dir * PERIVASCULAR_DRIFT;
    p.vy = random(-0.01, 0.01);

    // Water should visibly drift from vessel wall into ECS.
    if (p.type === "water") {
      const center = getArteryPoint(p.t, 0);
      if (center) {
        const ox = pos.x - center.x;
        const oy = pos.y - center.y;
        const olen = Math.hypot(ox, oy) || 1;
        const ux = ox / olen;
        const uy = oy / olen;

        // Stage 1: move out to just outside astrocyte endfeet.
        p.waterStopX = center.x + ux * WATER_ASTRO_STOP_DIST;
        p.waterStopY = center.y + uy * WATER_ASTRO_STOP_DIST;
        p.waterPhase = "toAstroEdge";

        p.vx = ux * WATER_ECS_DRIFT_SPEED;
        p.vy = uy * WATER_ECS_DRIFT_SPEED;
      } else {
        p.vx = dir * WATER_ECS_DRIFT_SPEED;
        p.vy = random(-0.06, 0.06);
        p.waterPhase = "fade";
      }
    }
    p.deliveryActive = false;
    p.deliveryStep = 0;

    if (!state.paused && typeof logEvent === "function") {
      logEvent(
        "vascular",
        `${p.label} exited the vessel into perivascular space`,
        "perivascular"
      );
    }
  }

  // ---------------- PERIVASCULAR → CSF / NEURON ----------------
  const somaX = 0;
  const somaY = 0;

  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const p = bloodParticles[i];
    if (p.state !== "perivascular") continue;

    // H₂O: local diffusion + fade
    if (p.type === "water") {
      if (
        p.waterPhase === "toAstroEdge" &&
        Number.isFinite(p.waterStopX) &&
        Number.isFinite(p.waterStopY)
      ) {
        const dx = p.waterStopX - p.x;
        const dy = p.waterStopY - p.y;
        const d  = Math.hypot(dx, dy) || 1;
        const step = Math.min(WATER_TO_ASTRO_SPEED, d);

        p.x += (dx / d) * step;
        p.y += (dy / d) * step;

        if (d <= 2.0) {
          p.waterPhase = "fade";
          p.vx = random(-0.08, 0.08);
          p.vy = random(-0.08, 0.08);
        }
      } else {
        // Stage 2: linger near astrocyte edge and fade away.
        p.vx += random(-WATER_ECS_WANDER, WATER_ECS_WANDER);
        p.vy += random(-WATER_ECS_WANDER, WATER_ECS_WANDER);
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= WATER_ECS_FADE_STEP;
      }

      if (p.alpha <= 0) {
        respawnIntravascular(p, "water", supplyGain);
        bloodParticles.splice(i, 1);
      }
      continue;
    }

    // O₂ / Glucose: pulse-triggered continuous delivery
    if (beat && !p.deliveryActive) {
      const dx = somaX - p.x;
      const dy = somaY - p.y;
      const d  = sqrt(dx * dx + dy * dy) || 1;

      const framesPerBeat =
        max(1, floor(BEAT_INTERVAL / (state.dt || 16.67)));

      // Launch one full trip per pulsation over multiple beats (much slower).
      const tripFrames = framesPerBeat * DELIVERY_BEATS_PER_TRIP;
      p.deliveryStep = max(MIN_DELIVERY_STEP, d / tripFrames);
      p.deliveryActive = true;
    }

    if (p.deliveryActive) {
      const dx = somaX - p.x;
      const dy = somaY - p.y;
      const d  = sqrt(dx * dx + dy * dy) || 1;

      const step = min(p.deliveryStep || MIN_DELIVERY_STEP, d);
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;

      if (d < 20) {
        if (p.type === "oxygen") {
          respawnIntravascular(p, "rbcDeoxy", supplyGain);
        } else if (p.type === "glucose") {
          respawnIntravascular(p, "glucose", supplyGain);
        }
        bloodParticles.splice(i, 1);
      }
    }
  }
}

// -----------------------------------------------------
// DRAW — TEXT LABELS
// -----------------------------------------------------

function drawBloodContents() {
  push();
  textAlign(CENTER, CENTER);
  textSize(BLOOD_TEXT_SIZE_BASE);
  noStroke();

  for (const p of bloodParticles) {
    let x, y;

    if (p.state === "intravascular") {
      const pos = getArteryPoint(p.t, p.lane);
      if (!pos) continue;
      x = pos.x;
      y = pos.y;
    } else {
      x = p.x;
      y = p.y;
    }

    const isDeliveryLabel =
      p.state === "perivascular" &&
      (p.type === "oxygen" || p.type === "glucose");

    textSize(
      isDeliveryLabel
        ? DELIVERY_TEXT_SIZE_LARGE
        : BLOOD_TEXT_SIZE_BASE
    );

    textStyle(isDeliveryLabel ? BOLD : NORMAL);
    fill(p.color[0], p.color[1], p.color[2], p.alpha);
    text(p.label, x, y);
  }

  pop();
}

function getBloodDeliveryFocus() {
  const candidates = [];

  const somaX = neuron?.somaX ?? 0;
  const somaY = neuron?.somaY ?? 0;

  for (const p of bloodParticles) {
    const isDeliveryParticle =
      p.state === "perivascular" &&
      p.deliveryActive &&
      (p.type === "oxygen" || p.type === "glucose");

    if (!isDeliveryParticle) continue;
    candidates.push(p);
  }

  if (!candidates.length) return null;

  let bestParticle = null;
  let bestScore = Infinity;

  for (const p of candidates) {
    let localNeighbors = 0;

    for (const other of candidates) {
      if (other === p) continue;
      if (dist(p.x, p.y, other.x, other.y) < 26) {
        localNeighbors += 1;
      }
    }

    const score = dist(p.x, p.y, somaX, somaY) + localNeighbors * 42;
    if (score < bestScore) {
      bestScore = score;
      bestParticle = p;
    }
  }

  return {
    x: bestParticle.x,
    y: bestParticle.y,
    label: bestParticle.label,
    type: bestParticle.type
  };
}

// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------

window.initBloodContents   = initBloodContents;
window.updateBloodContents = updateBloodContents;
window.drawBloodContents  = drawBloodContents;
window.getBloodDeliveryFocus = getBloodDeliveryFocus;
