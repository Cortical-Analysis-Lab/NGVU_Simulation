console.log("🟣 astrocyteSynapse loaded — GEOMETRY AUTHORITY");

// =====================================================
// ASTROCYTE GEOMETRY — SINGLE SOURCE OF TRUTH
// =====================================================
//
// ✔ Geometry ONLY (NO physics)
// ✔ World-space membrane sampler
// ✔ Identical authority role to neuronShape.js
// ✔ Safe for NTs, vesicles, diffusion, uptake
//
// 🔒 HARD RULES:
// • NO motion
// • NO forces
// • NO NT logic
// • NO vesicle logic
// • NO clamping
//
// =====================================================


// =====================================================
// COLORS (VISUAL ONLY)
// =====================================================
const ASTRO_PURPLE = window.COLORS?.astrocyte ?? [185, 145, 220];


// =====================================================
// ASTROCYTE POSITION (WORLD SPACE OFFSET)
// =====================================================
const ASTRO_Y_OFFSET = -140;


// =====================================================
// ASTROCYTE EXTENT (AUTHORITATIVE DOMAIN)
// =====================================================
const ASTRO_X_MIN = -220;
const ASTRO_X_MAX =  220;


// =====================================================
// 🔑 MEMBRANE GEOMETRY (AUTHORITATIVE)
// =====================================================
//
// THIS curve is used by:
// • NT constraints
// • Visual membrane
// • Debug overlays
//
// There are NO other membrane definitions.
//
const ASTRO_MEMBRANE_BASE_Y   = 64;
const ASTRO_MEMBRANE_CURVATURE = 44;
const ASTRO_CA_STORE_BOX = { x: 0, y: -4, w: 136, h: 64 };
const ASTRO_CA_STORE_ION_OFFSETS = [
  { x: -34, y: -11 },
  { x: -7, y: 12 },
  { x: 18, y: -6 },
  { x: 39, y: 9 }
];


// =====================================================
// 🔧 DEBUG CONFIG (VISUAL ONLY)
// =====================================================
window.DEBUG_ASTROCYTE = window.DEBUG_ASTROCYTE ?? {
  enabled: false,

  // 🔴 Local membrane (visual reference)
  color: [255, 80, 80],
  alpha: 190,
  lineWeight: 2,

  // 🔵 World membrane (physics truth)
  physicsColor: [80, 160, 255],
  physicsAlpha: 220,
  physicsWeight: 2,

  sampleStep: 6
};


// =====================================================
// 🔑 ASTROCYTE MEMBRANE — LOCAL SPACE (THE ONE CURVE)
// =====================================================
//
// • LOCAL space
// • NO offsets
// • NO physics
//
function astrocyteMembraneLocalY(x) {

  if (!Number.isFinite(x)) return null;
  if (x < ASTRO_X_MIN || x > ASTRO_X_MAX) return null;

  const t = Math.abs(x) / ASTRO_X_MAX;

  return (
    ASTRO_MEMBRANE_BASE_Y -
    ASTRO_MEMBRANE_CURVATURE * (t * t)
  );
}


// =====================================================
// 🔑 ASTROCYTE MEMBRANE — WORLD SPACE SAMPLER (LOCKED)
// =====================================================
//
// 🔒 SINGLE SOURCE OF TRUTH
// All physics & NT logic must call THIS
//
window.getAstrocyteMembraneY = function (x) {

  const yLocal = astrocyteMembraneLocalY(x);
  if (yLocal === null) return null;

  return yLocal + ASTRO_Y_OFFSET;
};


// =====================================================
// 🔑 ASTROCYTE MEMBRANE — PENETRATION QUERY
// =====================================================
window.getAstrocytePenetration = function (x, y) {

  const yMem = window.getAstrocyteMembraneY(x);
  if (yMem === null) return null;

  // >0 = inside astrocyte
  return yMem - y;
};


// =====================================================
// ASTROCYTIC ENDFOOT — FILL MASS ONLY (LOCAL SPACE)
// =====================================================
//
// ❗ NOT used for constraints
// ❗ Tissue bulk only
//
function drawAstrocyteSynapse() {

  push();
  translate(0, ASTRO_Y_OFFSET);

  stroke(...ASTRO_PURPLE);
  fill(ASTRO_PURPLE[0], ASTRO_PURPLE[1], ASTRO_PURPLE[2], 45);

  beginShape();
  curveVertex(-200, -10);
  curveVertex(-220, -30);
  curveVertex(-160, -90);
  curveVertex(-60,  -120);
  curveVertex(0,    -125);
  curveVertex(60,   -120);
  curveVertex(160,  -90);
  curveVertex(220,  -30);
  curveVertex(200,   20);
  curveVertex(120,   55);
  curveVertex(0,     65);
  curveVertex(-120,  55);
  curveVertex(-200,  20);
  curveVertex(-220, -30);
  curveVertex(-200, -10);
  endShape();

  drawAstrocyteCaStoreBox();

  pop();
}

function drawAstrocyteCaStoreBox() {
  // Central intracellular Ca2+ reservoir (visual cue).
  const boxX = ASTRO_CA_STORE_BOX.x;
  const boxY = ASTRO_CA_STORE_BOX.y;
  const boxW = ASTRO_CA_STORE_BOX.w;
  const boxH = ASTRO_CA_STORE_BOX.h;

  push();
  rectMode(CENTER);
  stroke(255, 175, 72, 235);
  strokeWeight(2.0);
  fill(255, 175, 72, 75);
  rect(boxX, boxY, boxW, boxH, 10);

  noStroke();
  fill(255, 220, 165, 235);
  textAlign(CENTER, CENTER);
  textSize(12);

  for (const ion of ASTRO_CA_STORE_ION_OFFSETS) {
    text(
      "Ca2+",
      boxX + ion.x,
      boxY + ion.y
    );
  }

  pop();
}


// =====================================================
// 🟣 VISUAL MEMBRANE — EXACT PHYSICS CURVE
// =====================================================
//
// NTs touch THIS line
//
function drawAstrocyteMembrane() {
  // Intentionally hidden: keep membrane geometry authoritative for physics
  // while removing visible boundary line.
  return;
}


// =====================================================
// 🔴 DEBUG — LOCAL MEMBRANE (RED)
// =====================================================
function drawAstrocyteBoundaryDebug() {

  const D = window.DEBUG_ASTROCYTE;
  if (!D.enabled) return;

  push();
  translate(0, ASTRO_Y_OFFSET);

  stroke(...D.color, D.alpha);
  strokeWeight(D.lineWeight);
  noFill();

  beginShape();
  for (let x = ASTRO_X_MIN; x <= ASTRO_X_MAX; x += D.sampleStep) {
    vertex(x, astrocyteMembraneLocalY(x));
  }
  endShape();

  pop();
}


// =====================================================
// 🔵 DEBUG — WORLD MEMBRANE (BLUE)
// =====================================================
function drawAstrocytePhysicsBoundaryDebug() {

  const D = window.DEBUG_ASTROCYTE;
  if (!D.enabled) return;

  push();
  stroke(...D.physicsColor, D.physicsAlpha);
  strokeWeight(D.physicsWeight);
  noFill();

  beginShape();
  for (let x = ASTRO_X_MIN; x <= ASTRO_X_MAX; x += D.sampleStep) {
    vertex(x, window.getAstrocyteMembraneY(x));
  }
  endShape();

  pop();
}


// =====================================================
// EXPORTS
// =====================================================
window.drawAstrocyteSynapse              = drawAstrocyteSynapse;
window.drawAstrocyteMembrane             = drawAstrocyteMembrane;
window.drawAstrocyteBoundaryDebug        = drawAstrocyteBoundaryDebug;
window.drawAstrocytePhysicsBoundaryDebug = drawAstrocytePhysicsBoundaryDebug;

window.ASTRO_X_MIN     = ASTRO_X_MIN;
window.ASTRO_X_MAX     = ASTRO_X_MAX;
window.ASTRO_Y_OFFSET  = ASTRO_Y_OFFSET;

const ASTRO_UPTAKE_GROUP_X = [-168, -58, 52, 162];
const ASTRO_PAIR_SPACING = 6;
const ASTRO_GPCR_GROUP_X = [
  (ASTRO_UPTAKE_GROUP_X[0] + ASTRO_UPTAKE_GROUP_X[1]) * 0.5, // left between lateral+middle
  (ASTRO_UPTAKE_GROUP_X[2] + ASTRO_UPTAKE_GROUP_X[3]) * 0.5  // right between middle+lateral
];
const ASTRO_GPCR_BIND_CAPTURE_RADIUS = 3.1;
const ASTRO_GPCR_BIND_CAPTURE_PROB = 0.26;
const ASTRO_GPCR_BIND_HOLD_FRAMES = 540;
const ASTRO_GPCR_BETA_SPEED = 0.34;
const ASTRO_CA_RELEASE_COUNT = 14;
const ASTRO_CA_PARTICLE_LIFE = 150;
const ASTRO_WAVE_SPEED = 0.012;
const ASTRO_WAVE_DELAY_FRAMES = 60; // ~1s at 60 FPS

window.astrocyteGpcrState = window.astrocyteGpcrState || {
  receptors: []
};
window.astrocyteSignal = window.astrocyteSignal || {
  detached: [],
  caParticles: [],
  wave: { active: false, progress: 0, queued: 0, delayFrames: 0 }
};

function buildAstrocyteGpcrs() {
  window.astrocyteGpcrState.receptors = ASTRO_GPCR_GROUP_X.map((baseX, id) => ({
    id,
    baseX,
    x: baseX,
    y: window.getAstrocyteMembraneY?.(baseX) ?? -80,
    angle: 0,
    nx: 0,
    ny: 1,
    tx: 1,
    ty: 0,
    boundTimer: 0,
    openEase: 0
  }));
}

function ensureAstrocyteGpcrs() {
  if (!Array.isArray(window.astrocyteGpcrState?.receptors) || !window.astrocyteGpcrState.receptors.length) {
    buildAstrocyteGpcrs();
  }
}

function getAstrocyteGpcrs() {
  ensureAstrocyteGpcrs();
  const receptors = window.astrocyteGpcrState.receptors;

  for (const r of receptors) {
    const y = window.getAstrocyteMembraneY?.(r.baseX);
    const y1 = window.getAstrocyteMembraneY?.(r.baseX - 4);
    const y2 = window.getAstrocyteMembraneY?.(r.baseX + 4);
    if (!Number.isFinite(y) || !Number.isFinite(y1) || !Number.isFinite(y2)) continue;

    const slope = (y2 - y1) / 8;
    const tangent = atan2(slope, 1);
    const tx = cos(tangent);
    const ty = sin(tangent);

    // Outward normal points toward cleft/downward for astrocyte (N-terminus side).
    let nx = -ty;
    let ny = tx;
    if (ny < 0) {
      nx *= -1;
      ny *= -1;
    }

    r.x = r.baseX;
    r.y = y - 0.8;
    r.tx = tx;
    r.ty = ty;
    r.nx = nx;
    r.ny = ny;
    r.angle = atan2(ny, nx);
  }

  return receptors;
}

function getAstrocyteGpcrLigandSite(r) {
  const cSide = r.id === 1 ? -1 : 1;
  const nSide = -cSide;
  const rotation = r.angle - HALF_PI + PI;
  const ligandLocal = { x: nSide * 11, y: -7 };
  const c = cos(rotation);
  const s = sin(rotation);
  return {
    x: r.x + ligandLocal.x * c - ligandLocal.y * s,
    y: r.y + ligandLocal.x * s + ligandLocal.y * c
  };
}

function getAstrocyteCaStoreRectWorld() {
  return {
    x: ASTRO_CA_STORE_BOX.x,
    y: ASTRO_CA_STORE_BOX.y + ASTRO_Y_OFFSET,
    w: ASTRO_CA_STORE_BOX.w,
    h: ASTRO_CA_STORE_BOX.h
  };
}

function rotateLocal(dx, dy, angle) {
  const c = cos(angle);
  const s = sin(angle);
  return {
    x: dx * c - dy * s,
    y: dx * s + dy * c
  };
}

function getAstrocyteGpcrBetaWorld(r) {
  const cSide = r.id === 1 ? -1 : 1;
  const rotation = r.angle - HALF_PI + PI;
  const local = rotateLocal(cSide * 16, 8.5, rotation);
  return { x: r.x + local.x, y: r.y + local.y };
}

function getAstrocyteCaStoreBindPoint(fromX) {
  const b = getAstrocyteCaStoreRectWorld();
  const halfW = b.w * 0.5;
  const halfH = b.h * 0.5;
  const x = constrain(fromX, b.x - halfW + 12, b.x + halfW - 12);
  // Use opposite (lower) face so detached G-protein travel stays in-view.
  return { x, y: b.y + halfH - 2 };
}

function triggerAstrocyteMembraneWave() {
  const w = window.astrocyteSignal.wave;
  w.queued = (w.queued || 0) + 1;
  if (!w.active && (w.delayFrames || 0) <= 0) {
    w.delayFrames = ASTRO_WAVE_DELAY_FRAMES;
  }
}

function spawnAstrocyteCaRelease() {
  const store = getAstrocyteCaStoreRectWorld();
  triggerAstrocyteMembraneWave();
  const count = ASTRO_CA_RELEASE_COUNT;
  const cx = store.x;
  const cy = store.y;
  const halfW = store.w * 0.5 + 10;
  const halfH = store.h * 0.5 + 10;

  for (let i = 0; i < count; i++) {
    // Place Ca2+ labels around the box perimeter with a small gap.
    const theta = TWO_PI * (i / count) + random(-0.05, 0.05);
    const ux = cos(theta);
    const uy = sin(theta);
    const perimeterScale = 1 / max(Math.abs(ux) / halfW, Math.abs(uy) / halfH);
    const spawnX = cx + ux * perimeterScale;
    const spawnY = cy + uy * perimeterScale;
    const speed = random(0.018, 0.034);
    const delayFrames = i;
    window.astrocyteSignal.caParticles.push({
      x: spawnX,
      y: spawnY,
      vx: ux * speed,
      vy: uy * speed,
      ox: ux,
      oy: uy,
      life: ASTRO_CA_PARTICLE_LIFE,
      maxLife: ASTRO_CA_PARTICLE_LIFE,
      delayFrames
    });
  }
}

function updateAstrocyteSignalDynamics() {
  const signal = window.astrocyteSignal;
  const w = signal.wave;

  if (!w.active && (w.queued || 0) > 0) {
    if ((w.delayFrames || 0) > 0) {
      w.delayFrames -= 1;
    } else {
      w.active = true;
      w.progress = 0;
      w.queued -= 1;
    }
  }

  if (w.active) {
    w.progress += ASTRO_WAVE_SPEED;
    if (w.progress >= 1) {
      w.active = false;
      w.progress = 0;
      if ((w.queued || 0) > 0) {
        w.delayFrames = ASTRO_WAVE_DELAY_FRAMES;
      }
    }
  }

  for (let i = signal.detached.length - 1; i >= 0; i--) {
    const d = signal.detached[i];
    const dx = d.tx - d.x;
    const dy = d.ty - d.y;
    const distToTarget = Math.hypot(dx, dy);
    if (distToTarget < 1.6) {
      const rs = window.astrocyteGpcrState.receptors || [];
      const r = rs.find(v => v.id === d.receptorId);
      if (r) r.betaDetached = false;
      spawnAstrocyteCaRelease();
      signal.detached.splice(i, 1);
      continue;
    }
    const ux = dx / (distToTarget || 1);
    const uy = dy / (distToTarget || 1);
    d.x += ux * ASTRO_GPCR_BETA_SPEED;
    d.y += uy * ASTRO_GPCR_BETA_SPEED;
  }

  for (let i = signal.caParticles.length - 1; i >= 0; i--) {
    const p = signal.caParticles[i];
    if ((p.delayFrames || 0) > 0) {
      p.delayFrames -= 1;
      continue;
    }

    // Keep a gentle outward push so particles visibly efflux from the store.
    p.vx += (p.ox || 0) * 0.0012;
    p.vy += (p.oy || 0) * 0.0012;
    p.vx *= 0.997;
    p.vy *= 0.997;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 0.06) {
      p.vx *= 0.06 / speed;
      p.vy *= 0.06 / speed;
    }
    p.x += p.vx;
    p.y += p.vy;

    p.life -= 1;
    if (p.life <= 0) signal.caParticles.splice(i, 1);
  }
}

function drawAstrocyteCaRelease() {
  const particles = window.astrocyteSignal.caParticles || [];
  if (!particles.length) return;

  push();
  textSize(11);
  textAlign(CENTER, CENTER);
  for (const p of particles) {
    if ((p.delayFrames || 0) > 0) continue;
    const a = map(p.life, 0, p.maxLife, 0, 255, true);
    fill(255, 182, 84, a);
    text("Ca2+", p.x, p.y);
  }
  pop();
}

function drawAstrocyteDetachedBeta() {
  const detached = window.astrocyteSignal.detached || [];
  if (!detached.length) return;

  push();
  noStroke();
  fill(232, 178, 96, 240);
  for (const d of detached) {
    circle(d.x, d.y, 7.4);
  }
  pop();
}

function sampleAstroWavePoint(tIn) {
  const t = constrain(tIn, 0, 1);
  const x = lerp(ASTRO_X_MIN, ASTRO_X_MAX, t);
  const y = window.getAstrocyteMembraneY?.(x) ?? (ASTRO_Y_OFFSET + ASTRO_MEMBRANE_BASE_Y);
  return { x, y };
}

function drawAstrocyteMembraneWave() {
  const w = window.astrocyteSignal.wave;
  if (!w.active) return;

  const t = constrain(w.progress, 0, 1);
  const envelope = pow(sin(t * PI), 0.85);
  const flicker = 0.82 + 0.18 * sin(frameCount * 0.18);
  const pulse = envelope * flicker;

  push();
  blendMode(ADD);
  noFill();
  strokeWeight(8.8);
  stroke(122, 214, 255, 210 * pulse);

  // Full astrocyte membrane flash (entire outline), not only NT-facing boundary.
  translate(0, ASTRO_Y_OFFSET);
  beginShape();
  curveVertex(-200, -10);
  curveVertex(-220, -30);
  curveVertex(-160, -90);
  curveVertex(-60,  -120);
  curveVertex(0,    -125);
  curveVertex(60,   -120);
  curveVertex(160,  -90);
  curveVertex(220,  -30);
  curveVertex(200,   20);
  curveVertex(120,   55);
  curveVertex(0,     65);
  curveVertex(-120,  55);
  curveVertex(-200,  20);
  curveVertex(-220, -30);
  curveVertex(-200, -10);
  endShape();

  strokeWeight(4.2);
  stroke(210, 242, 255, 190 * pulse);
  beginShape();
  curveVertex(-200, -10);
  curveVertex(-220, -30);
  curveVertex(-160, -90);
  curveVertex(-60,  -120);
  curveVertex(0,    -125);
  curveVertex(60,   -120);
  curveVertex(160,  -90);
  curveVertex(220,  -30);
  curveVertex(200,   20);
  curveVertex(120,   55);
  curveVertex(0,     65);
  curveVertex(-120,  55);
  curveVertex(-200,  20);
  curveVertex(-220, -30);
  curveVertex(-200, -10);
  endShape();

  blendMode(BLEND);
  pop();
}

function getAstrocyteUptakeChannels() {
  const channels = [];

  for (const baseX of ASTRO_UPTAKE_GROUP_X) {
    const y = window.getAstrocyteMembraneY?.(baseX);
    const y1 = window.getAstrocyteMembraneY?.(baseX - 4);
    const y2 = window.getAstrocyteMembraneY?.(baseX + 4);

    if (!Number.isFinite(y) || !Number.isFinite(y1) || !Number.isFinite(y2)) {
      continue;
    }

    const slope = (y2 - y1) / 8;
    const tangent = atan2(slope, 1);
    const tx = cos(tangent);
    const ty = sin(tangent);
    const angle = tangent + HALF_PI; // rotate pores by 90 degrees

    for (const s of [-0.5, 0.5]) {
      channels.push({
        x: baseX + tx * ASTRO_PAIR_SPACING * s,
        y: (y - 2) + ty * ASTRO_PAIR_SPACING * s,
        rx: 6,
        ry: 2.4,
        angle,
        groupX: baseX
      });
    }
  }

  return channels;
}

function drawAstrocyteUptakeChannels() {
  const channels = getAstrocyteUptakeChannels();
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
    fill(poreFill[0], poreFill[1], poreFill[2], 225);
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

function updateAstrocyteGpcrs() {
  const nts = window.synapticNTs || [];
  const receptors = getAstrocyteGpcrs();
  updateAstrocyteSignalDynamics();

  for (const r of receptors) {
    r.boundTimer = max(0, (r.boundTimer || 0) - 1);

    if (r.boundTimer <= 0) {
      const site = getAstrocyteGpcrLigandSite(r);
      for (let i = nts.length - 1; i >= 0; i--) {
        const nt = nts[i];
        const ntWorldX = nt.x + (window.SYNAPSE_PRE_X ?? -130);
        const ntWorldY = nt.y + (window.SYNAPSE_NEURON_Y ?? 40);
        if (
          dist(ntWorldX, ntWorldY, site.x, site.y) < ASTRO_GPCR_BIND_CAPTURE_RADIUS &&
          random() < ASTRO_GPCR_BIND_CAPTURE_PROB
        ) {
          r.boundTimer = ASTRO_GPCR_BIND_HOLD_FRAMES + floor(random(-20, 30));
          if (!r.betaDetached) {
            const beta = getAstrocyteGpcrBetaWorld(r);
            const bindPt = getAstrocyteCaStoreBindPoint(beta.x);
            window.astrocyteSignal.detached.push({
              receptorId: r.id,
              x: beta.x,
              y: beta.y,
              tx: bindPt.x,
              ty: bindPt.y
            });
            r.betaDetached = true;
          }
          nts.splice(i, 1);
          break;
        }
      }
    }

    r.openEase = lerp(r.openEase || 0, r.boundTimer > 0 ? 1 : 0, 0.12);
  }
}

function drawAstrocyteGpcrs() {
  const receptors = getAstrocyteGpcrs();
  if (!receptors.length) return;

  const ctx = drawingContext;

  function drawMiniFingerTrapCore(ctx2, x, y, length = 6, amp = 1.3) {
    const freq = 0.65;
    const phases = [0, PI * 0.5, PI, PI * 1.5];
    for (const ph of phases) {
      ctx2.beginPath();
      for (let i = 0; i <= length; i += 1) {
        const px = x + Math.sin(i * freq + ph) * amp;
        const py = y - length * 0.5 + i;
        if (i === 0) ctx2.moveTo(px, py);
        else ctx2.lineTo(px, py);
      }
      ctx2.stroke();
    }
  }

  function drawRoundedLoop(ctx2, x0, x1, yBase, depth, outwardSign) {
    const xm = (x0 + x1) * 0.5;
    ctx2.beginPath();
    ctx2.moveTo(x0, yBase);
    ctx2.quadraticCurveTo(xm, yBase + depth * outwardSign, x1, yBase);
    ctx2.stroke();
  }

  function drawIntertwinedHelixCore(ctx2, x, y, openEase = 0) {
    const length = 12 + openEase * 3;
    const amp = 2.8 + openEase * 1.9;
    const freq = 0.42;
    const phases = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
    for (let s = 0; s < phases.length; s++) {
      ctx2.beginPath();
      for (let i = 0; i <= length; i += 1) {
        const px = x - length * 0.5 + i;
        const py = y + Math.sin(i * freq + phases[s]) * amp;
        if (i === 0) ctx2.moveTo(px, py);
        else ctx2.lineTo(px, py);
      }
      ctx2.strokeStyle = "rgba(184, 235, 255, 0.98)";
      ctx2.lineWidth = 1.2;
      ctx2.stroke();
    }
  }

  function drawIntertwinedHelixCoreRotated(ctx2, x, y, rotation, openEase = 0) {
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(rotation);
    drawIntertwinedHelixCore(ctx2, 0, 0, openEase);
    ctx2.restore();
  }

  for (const r of receptors) {
    const x = r.x;
    const y = r.y;
    const cSide = r.id === 1 ? -1 : 1;
    const nSide = -cSide;
    const rotation = r.angle - HALF_PI + PI;
    const helixX = [-13.5, -9, -4.5, 0, 4.5, 9, 13.5];
    const coreLen = 10;
    const coreAmp = 1.45;
    const nLabelX = x + nSide * (r.id === 1 ? 18 : 13);
    const nLabelY = y + (r.id === 1 ? -13 : -10);

    const ligandLocal = { x: nSide * 11, y: -7 };
    const c = Math.cos(rotation);
    const s = Math.sin(rotation);
    const ligandX = x + ligandLocal.x * c - ligandLocal.y * s;
    const ligandY = y + ligandLocal.x * s + ligandLocal.y * c;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.translate(-x, -y);

    ctx.strokeStyle = "rgba(120, 190, 255, 0.95)";
    ctx.lineWidth = 0.85;
    for (let i = 0; i < helixX.length; i++) {
      drawMiniFingerTrapCore(ctx, x + helixX[i], y, coreLen, coreAmp);
    }

    ctx.beginPath();
    ctx.moveTo(x + helixX[0], y - 6);
    ctx.lineTo(x + helixX[helixX.length - 1], y - 6);
    ctx.moveTo(x + helixX[0], y + 6);
    ctx.lineTo(x + helixX[helixX.length - 1], y + 6);
    ctx.stroke();

    ctx.strokeStyle = "rgba(196, 226, 255, 0.92)";
    ctx.lineWidth = 0.95;
    drawRoundedLoop(ctx, x + helixX[0], x + helixX[1], y - 6, 3.5, -1);
    drawRoundedLoop(ctx, x + helixX[2], x + helixX[3], y - 6, 3.5, -1);
    drawRoundedLoop(ctx, x + helixX[4], x + helixX[5], y - 6, 3.5, -1);

    ctx.fillStyle = "rgba(240, 248, 255, 0.95)";
    ctx.font = "8px sans-serif";
    ctx.fillText("N", nLabelX, nLabelY);

    drawRoundedLoop(ctx, x + helixX[1], x + helixX[2], y + 6, 3.5, +1);
    drawRoundedLoop(ctx, x + helixX[3], x + helixX[4], y + 6, 3.5, +1);
    drawRoundedLoop(ctx, x + helixX[5], x + helixX[6], y + 6, 3.5, +1);
    ctx.fillText("C", x + cSide * 11, y + 13);

    ctx.beginPath();
    ctx.moveTo(x + cSide * 4, y + 4);
    ctx.lineTo(x + cSide * 9, y + 4);
    ctx.stroke();

    // Heterotrimeric G-protein circles next to C-terminus.
    ctx.fillStyle = "rgba(232, 178, 96, 0.95)";
    ctx.beginPath();
    ctx.arc(x + cSide * 12, y + 4, 2.8, 0, TWO_PI); // alpha
    ctx.fill();
    if (!r.betaDetached) {
      ctx.beginPath();
      ctx.arc(x + cSide * 16, y + 8.5, 3.7, 0, TWO_PI); // beta
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + cSide * 10, y + 9.5, 2.8, 0, TWO_PI); // gamma
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = r.boundTimer > 0 ? "rgba(184,92,255,0.95)" : "white";
    ctx.beginPath();
    ctx.arc(ligandX, ligandY, 1.0, 0, TWO_PI);
    ctx.fill();
  }

  drawAstrocyteDetachedBeta();
  drawAstrocyteCaRelease();
}

window.getAstrocyteUptakeChannels = getAstrocyteUptakeChannels;
window.drawAstrocyteUptakeChannels = drawAstrocyteUptakeChannels;
window.getAstrocyteGpcrs = getAstrocyteGpcrs;
window.getAstrocyteGpcrLigandSite = getAstrocyteGpcrLigandSite;
window.getAstrocyteCaStoreRectWorld = getAstrocyteCaStoreRectWorld;
window.updateAstrocyteGpcrs = updateAstrocyteGpcrs;
window.drawAstrocyteGpcrs = drawAstrocyteGpcrs;
window.drawAstrocyteMembraneWave = drawAstrocyteMembraneWave;
