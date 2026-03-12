console.log("🧬 psdReceptors loaded — tetrameric glutamate receptors");

// =====================================================
// POSTSYNAPTIC GLUTAMATE RECEPTORS (LIGHTWEIGHT 2D)
// =====================================================

// Ionotropic set (existing design) treated as AMPA/NMDA-like receptors.
const receptors = [];
const scaffoldAmpaReceptors = [];
const gpcrReceptors = [];
const receptorNaParticles = [];
let postNaInfluxActivePrev = false;

const RECEPTOR_BINDING_RADIUS = 1;
// Flat postsynaptic face only (exclude rounded corners).
const RECEPTOR_Y_MIN = -56;
const RECEPTOR_Y_MAX = 56;
const RECEPTOR_SPACING_MIN = 26;
const RECEPTOR_SPACING_MAX = 34;

const AMPA_NT_SITE = { x: -8, y: 0 };
const NMDA_NT_SITE = { x: -8, y: -0.9 };
const NMDA_GLY_SITE = { x: -6.8, y: 3.6 };
const BIND_CAPTURE_RADIUS = 3.0;
const BIND_CAPTURE_PROB = 0.28;
const BIND_HOLD_FRAMES = 212;
const NMDA_GLY_BIND_CHANCE = 0.22;
const NA_FADE_STEP = 0.64;

const RECEPTOR_BLUE = "rgba(138, 214, 255, 0.96)";
const RECEPTOR_BLUE_BRIGHT = "rgba(184, 235, 255, 0.98)";
const GPCR_BLUE = "rgba(120, 190, 255, 0.95)";
const GPCR_LOOP = "rgba(196, 226, 255, 0.92)";
const GPCR_PROTEIN = "rgba(232, 178, 96, 0.95)";
const GPCR_LIGAND_LOCAL_X = 11;
const GPCR_LIGAND_LOCAL_Y = -7;
const GPCR_BIND_CAPTURE_RADIUS = BIND_CAPTURE_RADIUS;
const GPCR_BIND_CAPTURE_PROB = 0.3;
const GPCR_BIND_HOLD_FRAMES = 450;
const GPCR_GDP_SHOW_FRAMES = 60;
const GPCR_GTP_EXCHANGE_FRAMES = 70;
const GPCR_DRIFT_FRAMES = 90;
const GPCR_NA_COOLDOWN = 18;
const GPCR_NA_DELAY = 16;
const GPCR_GTP_FADE_RATE = 0.08;
const GPCR_GTP_DISPLAY_FRAMES = 180; // ~3s at 60 FPS
const PSD95_STEM = "rgba(244, 241, 232, 0.72)";
const PSD95_BRANCH = "rgba(236, 232, 222, 0.64)";
const PSD95_NODE = "rgba(255, 252, 244, 0.86)";
const PSD95_MESH = "rgba(226, 223, 214, 0.52)";
const PLASTICITY_FPS = 60;
const LTP_STIM_THRESHOLD = 3;
const LTD_QUIET_FRAMES = 30 * PLASTICITY_FPS; // 30 s

window.SHOW_RECEPTOR_DEBUG = false;

window.scaffoldAmpaPlasticity = {
  stimulationCount: 0,
  lastStimFrame: -Infinity,
  targetMembrane: false,
  move01: 0
};

function getPlasticityFrameNow() {
  return typeof frameCount === "number" ? frameCount : 0;
}

function getScaffoldAmpaLayout() {
  const railB = 38;
  const railC = 56;
  const yMin = -118;
  const yMax = 118;
  const scaffoldX = (railB + railC) * 0.5;
  return [
    { scaffoldX, y: yMin + 18 },
    { scaffoldX, y: yMax - 18 }
  ];
}

function getFaceAmpaTargets() {
  const scaffoldLayout = getScaffoldAmpaLayout();
  const faceGap = 6.0;
  const gpcrGap = 10.0;

  let targetYs = scaffoldLayout.map(p => p.y);
  if (gpcrReceptors.length) {
    const ionYs = gpcrReceptors
      .map(r => getGpcrGeometry(r).ionWorld.y)
      .sort((a, b) => a - b);
    targetYs = [ionYs[0] - gpcrGap, ionYs[ionYs.length - 1] + gpcrGap];
  }

  return targetYs.map(y => {
    const frame = getPostMembraneFrame(y);
    return {
      x: frame.membraneX - frame.normalX * faceGap,
      y: y - frame.normalY * faceGap
    };
  });
}

function notePostSynapticVesicleRelease() {
  // LTP is now driven by stimulation count, not vesicle-release count.
}

function notePostSynapticStimulation() {
  const demo = window.synapseLtpLtdDemo;
  if (!demo?.enabled || demo.phase !== "ltp") return;

  const state = window.scaffoldAmpaPlasticity;
  state.lastStimFrame = getPlasticityFrameNow();
  if (!state.targetMembrane) {
    state.stimulationCount = (state.stimulationCount || 0) + 1;
  }
  if ((state.stimulationCount || 0) >= LTP_STIM_THRESHOLD) {
    state.targetMembrane = true;
  }
}

function updateScaffoldAmpaPlasticity() {
  const state = window.scaffoldAmpaPlasticity;
  const now = getPlasticityFrameNow();

  if (
    state.targetMembrane &&
    Number.isFinite(state.lastStimFrame) &&
    now - state.lastStimFrame >= LTD_QUIET_FRAMES
  ) {
    state.targetMembrane = false;
    state.stimulationCount = 0;
  }

  const target = state.targetMembrane ? 1 : 0;
  const ease = state.targetMembrane ? 0.018 : 0.008;
  state.move01 = lerp(state.move01 || 0, target, ease);
}

function forceScaffoldAmpaLTD() {
  const state = window.scaffoldAmpaPlasticity;
  if (!state) return;
  state.targetMembrane = false;
  state.stimulationCount = 0;
  state.lastStimFrame = getPlasticityFrameNow();
}

function buildReceptors() {
  receptors.length = 0;
  scaffoldAmpaReceptors.length = 0;
  gpcrReceptors.length = 0;

  const ampaYs = [-27, -9, 9, 27];
  for (let id = 0; id < ampaYs.length; id++) {
    const kind = id % 2 === 0 ? "ampa" : "nmda"; // AMPA, NMDA, AMPA, NMDA
    receptors.push({
      id,
      kind,
      // Receptor midpoint sits on the membrane face line x=0.
      x: 0,
      y: ampaYs[id],
      bound: kind === "nmda" ? [false, false] : [false],
      state: "closed",
      boundTimer: 0,
      glyTimer: 0,
      glyPending: 0,
      openEase: 0,
      widenPulse: 0,
      influxTriggered: false,
      influxBudget: 0,
      influxCooldown: 0,
      influxDelay: 0,
      influxSerial: 0
    });
  }

  const scaffoldAnchors = getScaffoldAmpaLayout();
  for (let sid = 0; sid < scaffoldAnchors.length; sid++) {
    const a = scaffoldAnchors[sid];
    scaffoldAmpaReceptors.push({
      id: `s${sid}`,
      kind: "ampa_scaffold",
      x: a.scaffoldX,
      y: a.y,
      bound: [false],
      state: "closed",
      boundTimer: 0,
      glyTimer: 0,
      glyPending: 0,
      openEase: 0,
      widenPulse: 0,
      influxTriggered: false,
      influxBudget: 0,
      influxCooldown: 0,
      influxDelay: 0,
      influxSerial: 0
    });
  }

  // Two metabotropic receptors interleaved between AMPA/NMDA receptors.
  const gpcrYs = [-55, 55];
  for (let gid = 0; gid < gpcrYs.length; gid++) {
  gpcrReceptors.push({
    id: gid,
    x: 0,
    y: gpcrYs[gid],
    bound: false,
    boundTimer: 0,
    gProteinNucleotide: "",
    phase: "idle",
    phaseTimer: 0,
    gDrift01: 0,
    gdpEase: 0,
    gtpEase: 0,
    gtpTimer: 0,
    gtpLatched: false,
    gtpShown: false,
    channelOpenEase: 0,
    influxBudget: 0,
    influxCooldown: 0,
    influxDelay: 0,
    influxSerial: 0
  });
  }
}

function ensureReceptors() {
  if (!receptors.length) buildReceptors();
}

function countBound(receptor) {
  return receptor.bound.reduce((n, v) => n + (v ? 1 : 0), 0);
}

function updateScaffoldAmpaPositions() {
  const plasticityState = window.scaffoldAmpaPlasticity;
  const scaffoldAnchors = getScaffoldAmpaLayout();
  const faceTargets = getFaceAmpaTargets();

  for (let i = 0; i < scaffoldAmpaReceptors.length; i++) {
    const r = scaffoldAmpaReceptors[i];
    const anchor = scaffoldAnchors[i] || scaffoldAnchors[scaffoldAnchors.length - 1];
    const target = faceTargets[i] || faceTargets[faceTargets.length - 1] || {
      x: anchor.scaffoldX,
      y: anchor.y
    };
    r.x = lerp(anchor.scaffoldX, target.x, plasticityState.move01 || 0);
    r.y = lerp(anchor.y, target.y, plasticityState.move01 || 0);
  }
}

function updatePSDReceptors() {
  ensureReceptors();
  updateScaffoldAmpaPlasticity();
  updateScaffoldAmpaPositions();

  const nts = window.synapticNTs || [];
  const preX = window.SYNAPSE_PRE_X || 0;
  const postX = window.SYNAPSE_POST_X || 0;
  const glycineSignal = nts.length > 0;
  let ionInfluxPending = false;

  const allIonotropicReceptors = receptors.concat(scaffoldAmpaReceptors);
  for (const receptor of allIonotropicReceptors) {
    receptor.boundTimer = max(0, (receptor.boundTimer || 0) - 1);
    receptor.glyTimer = max(0, (receptor.glyTimer || 0) - 1);
    receptor.bound[0] = receptor.boundTimer > 0;
    const isNmda = receptor.kind === "nmda";
    if (isNmda) {
      receptor.bound[1] = receptor.glyTimer > 0;
    }
    receptor.widenPulse = max(0, (receptor.widenPulse || 0) - 0.08);

    // A subset of NTs bind and are consumed at the binding site.
    if (!receptor.bound[0]) {
      const site = isNmda ? NMDA_NT_SITE : AMPA_NT_SITE;
      const sx = postX + receptor.x + site.x;
      const sy = receptor.y + site.y;

      for (let i = nts.length - 1; i >= 0; i--) {
        const nt = nts[i];
        const nx = preX + nt.x;
        const ny = nt.y;

        if (
          dist(nx, ny, sx, sy) < BIND_CAPTURE_RADIUS &&
          random() < BIND_CAPTURE_PROB
        ) {
          receptor.boundTimer = BIND_HOLD_FRAMES + floor(random(-12, 18));
          receptor.bound[0] = true;
          receptor.influxTriggered = false;
          if (isNmda) {
            receptor.glyTimer = 0;
            receptor.glyPending = 16 + floor(random(0, 20));
          }
          receptor.widenPulse = 1;
          nts.splice(i, 1);
          break;
        }
      }
    }

    if (isNmda) {
      if (receptor.bound[0] && !receptor.bound[1] && glycineSignal) {
        receptor.glyPending = max(0, (receptor.glyPending || 0) - 1);
        if (receptor.glyPending <= 0 && random() < NMDA_GLY_BIND_CHANCE) {
          receptor.glyTimer = max(120, receptor.boundTimer - 30);
          receptor.bound[1] = true;
        }
      }
      if (!receptor.bound[0]) {
        receptor.glyTimer = 0;
        receptor.glyPending = 0;
        receptor.bound[1] = false;
      }
    }

    const wasOpen = receptor.state === "open";
    const openNow = isNmda
      ? (receptor.bound[0] && receptor.bound[1])
      : receptor.bound[0];
    receptor.state = openNow ? "open" : "closed";
    const targetOpen = openNow ? 1 : 0;
    receptor.openEase = lerp(receptor.openEase || 0, targetOpen, 0.4);

    // Expand once, then pass multiple Na+ ions through the pore.
    if (!wasOpen && receptor.state === "open" && !receptor.influxTriggered) {
      receptor.influxBudget = floor(random(3, 6));
      receptor.influxCooldown = 8;
      receptor.influxDelay = 10;
      receptor.influxSerial = 0;
      receptor.influxTriggered = true;
      window.triggerPostSynapticEPSPTrace?.(isNmda ? "nmda" : "ampa");
    }

    if (receptor.state !== "open") {
      receptor.influxBudget = 0;
      receptor.influxCooldown = 0;
      receptor.influxDelay = 0;
    } else if (receptor.influxBudget > 0) {
      ionInfluxPending = true;
      if (receptor.influxDelay > 0) {
        receptor.influxDelay -= 1;
      } else {
        receptor.influxCooldown -= 1;
        if (receptor.influxCooldown <= 0) {
          if (!isPoreLaneOccupied(receptor) && !hasPendingNaPoreEntry()) {
            spawnNaBurst(receptor, 1);
            receptor.influxBudget -= 1;
          }
          receptor.influxCooldown = 8;
        }
      }
    }
  }

  const gpcrInfluxPending = updateMetabotropicReceptors(nts, preX, postX);
  updateReceptorNaParticles();

  // Treat Na+ as actively influxing while channels are still emitting OR ions are still
  // crossing membrane (not yet enteredCell). Trigger one reverse wave when influx ends.
  const particleInfluxPending = receptorNaParticles.some(p => !p.enteredCell);
  const postNaInfluxActive = ionInfluxPending || gpcrInfluxPending || particleInfluxPending;
  if (postNaInfluxActivePrev && !postNaInfluxActive) {
    window.triggerPostNaReverseWave?.();
  }
  postNaInfluxActivePrev = postNaInfluxActive;
}

function updateMetabotropicReceptors(nts, preX, postX) {
  let gpcrInfluxPending = false;
  for (const r of gpcrReceptors) {
    if (typeof r.gdpEase !== "number") r.gdpEase = 0;
    if (typeof r.gtpEase !== "number") r.gtpEase = 0;
    if (typeof r.gtpTimer !== "number") r.gtpTimer = 0;
    if (typeof r.gtpLatched !== "boolean") r.gtpLatched = false;
    if (typeof r.gtpShown !== "boolean") r.gtpShown = false;
    r.boundTimer = max(0, (r.boundTimer || 0) - 1);
    r.phaseTimer = max(0, (r.phaseTimer || 0) - 1);
    r.gtpTimer = max(0, (r.gtpTimer || 0) - 1);
    r.bound = (r.boundTimer || 0) > 0;

    if (!r.bound) {
      const site = getGpcrLigandSiteWorld(r, postX);
      const siteX = site.x;
      const siteY = site.y;
      for (let i = nts.length - 1; i >= 0; i--) {
        const nt = nts[i];
        const nx = preX + nt.x;
        const ny = nt.y;
        if (
          dist(nx, ny, siteX, siteY) < GPCR_BIND_CAPTURE_RADIUS &&
          random() < GPCR_BIND_CAPTURE_PROB
        ) {
          r.boundTimer = GPCR_BIND_HOLD_FRAMES + floor(random(-20, 30));
          r.bound = true;
          r.phase = "gdp";
          r.phaseTimer = GPCR_GDP_SHOW_FRAMES;
          r.gProteinNucleotide = "GDP";
          r.gdpEase = 0;
          r.gtpEase = 0;
          r.gtpTimer = 0;
          r.gtpLatched = false;
          r.gtpShown = false;
          r.gDrift01 = 0;
          r.channelOpenEase = 0;
          r.influxBudget = 0;
          r.influxCooldown = 0;
          r.influxDelay = 0;
          r.influxSerial = 0;
          nts.splice(i, 1);
          break;
        }
      }
    }

    if (!r.bound) {
      r.phase = "idle";
      r.gProteinNucleotide = "";
      r.gdpEase = lerp(r.gdpEase || 0, 0, 0.14);
      r.gtpEase = lerp(r.gtpEase || 0, 0, 0.14);
      r.gtpTimer = 0;
      r.gtpLatched = false;
      r.gtpShown = false;
      r.gDrift01 = lerp(r.gDrift01 || 0, 0, 0.12);
      r.channelOpenEase = lerp(r.channelOpenEase || 0, 0, 0.12);
      r.influxBudget = 0;
      r.influxCooldown = 0;
      r.influxDelay = 0;
      continue;
    }

    let gtpTarget = 0;
    let gdpTarget = 0;

    if (r.phase === "gdp") {
      r.gProteinNucleotide = "GDP";
      gdpTarget = 1;
      if (r.phaseTimer <= 0) {
        r.phase = "exchange";
        r.phaseTimer = GPCR_GTP_EXCHANGE_FRAMES;
      }
    } else if (r.phase === "exchange") {
      const t = 1 - (r.phaseTimer / GPCR_GTP_EXCHANGE_FRAMES);
      const exchangeGtp01 = constrain((t - 0.25) / 0.75, 0, 1);
      r.gProteinNucleotide = t > 0.55 ? "GTP" : "GDP";
      gtpTarget = exchangeGtp01;
      gdpTarget = 1 - exchangeGtp01;
      if (r.phaseTimer <= 0) {
        r.phase = "drift";
        r.phaseTimer = GPCR_DRIFT_FRAMES;
        r.gProteinNucleotide = "GTP";
      }
    } else if (r.phase === "drift") {
      const t = 1 - (r.phaseTimer / GPCR_DRIFT_FRAMES);
      r.gDrift01 = constrain(t, 0, 1);
      gtpTarget = 1;
      if (r.phaseTimer <= 0) {
        r.phase = "open";
        r.influxBudget = floor(random(4, 8));
        r.influxCooldown = GPCR_NA_COOLDOWN;
        r.influxDelay = GPCR_NA_DELAY;
        r.influxSerial = 0;
        window.triggerPostSynapticEPSPTrace?.("gpcr");
      }
    } else if (r.phase === "open") {
      r.gDrift01 = 1;
      r.channelOpenEase = lerp(r.channelOpenEase || 0, 1, 0.12);
      gtpTarget = 1;

      if (r.influxBudget > 0) {
        gpcrInfluxPending = true;
        if (r.influxDelay > 0) {
          r.influxDelay -= 1;
        } else {
          r.influxCooldown -= 1;
          if (r.influxCooldown <= 0) {
            if (!isGpcrPoreLaneOccupied(r)) {
              spawnGpcrNaBurst(r, 1);
              r.influxBudget -= 1;
            }
            r.influxCooldown = GPCR_NA_COOLDOWN;
          }
        }
      }
    }

    if (r.phase !== "open") {
      r.channelOpenEase = lerp(r.channelOpenEase || 0, 0, 0.08);
    }

    // Show GTP for a short window, then let it fade even if receptor stays active.
    if (r.gProteinNucleotide === "GTP") {
      if (!r.gtpLatched) {
        r.gtpTimer = GPCR_GTP_DISPLAY_FRAMES;
        r.gtpLatched = true;
        r.gtpShown = true;
      }
    } else {
      r.gtpLatched = false;
    }

    if (r.phase !== "exchange") {
      const gtpVisible = (r.gtpTimer || 0) > 0;
      gtpTarget = gtpVisible ? 1 : 0;
      gdpTarget = r.bound && !r.gtpShown ? 1 : 0;
    }

    if (!r.bound) {
      gtpTarget = 0;
      gdpTarget = 0;
    }
    r.gdpEase = lerp(r.gdpEase || 0, gdpTarget, GPCR_GTP_FADE_RATE);
    r.gtpEase = lerp(r.gtpEase || 0, gtpTarget, GPCR_GTP_FADE_RATE);
  }
  return gpcrInfluxPending;
}

function rotateLocalPoint(dx, dy, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: dx * c - dy * s,
    y: dx * s + dy * c
  };
}

function getGpcrCTerminalSide(r) {
  // Bottom GPCR swaps terminal sides per request.
  return r.id === 1 ? -1 : 1;
}

function getPostMembraneFrame(y) {
  const sample = typeof window.getPostSynapticMembraneX === "function"
    ? window.getPostSynapticMembraneX
    : null;

  const membraneX = sample ? sample(y) : 0;
  const y1 = y - 1.2;
  const y2 = y + 1.2;
  const x1 = sample ? sample(y1) : membraneX;
  const x2 = sample ? sample(y2) : membraneX;
  const dxdy = (x2 - x1) / (y2 - y1);

  let tx = dxdy;
  let ty = 1;
  const tMag = Math.hypot(tx, ty) || 1;
  tx /= tMag;
  ty /= tMag;

  let nx = ty;
  let ny = -tx;
  if (nx < 0) {
    nx *= -1;
    ny *= -1;
  }

  return {
    membraneX,
    tangentX: tx,
    tangentY: ty,
    normalX: nx,
    normalY: ny,
    normalAngle: Math.atan2(ny, nx)
  };
}

function getGpcrGeometry(r) {
  const frame = getPostMembraneFrame(r.y);
  const x = frame.membraneX + r.x;
  const y = r.y;
  const cSide = getGpcrCTerminalSide(r);
  const nSide = -cSide;
  const rotation = frame.normalAngle - Math.PI * 0.5;
  const ligandLocal = { x: nSide * GPCR_LIGAND_LOCAL_X, y: GPCR_LIGAND_LOCAL_Y };
  const ligandDelta = rotateLocalPoint(ligandLocal.x, ligandLocal.y, rotation);
  const effectorLocal = { x: cSide * 30, y: 6 };
  const effectorDelta = rotateLocalPoint(effectorLocal.x, effectorLocal.y, rotation);
  const ionLocal = { x: cSide * 43, y: 0 };
  const ionDelta = rotateLocalPoint(ionLocal.x, ionLocal.y, rotation);

  return {
    x,
    y,
    cSide,
    nSide,
    rotation,
    frame,
    ligandLocal,
    ligandWorld: { x: x + ligandDelta.x, y: y + ligandDelta.y },
    effectorLocal,
    effectorWorld: { x: x + effectorDelta.x, y: y + effectorDelta.y },
    ionLocal,
    ionWorld: { x: x + ionDelta.x, y: y + ionDelta.y }
  };
}

function getGpcrLigandSiteWorld(r, postX) {
  const g = getGpcrGeometry(r);
  return {
    x: postX + g.ligandWorld.x,
    y: g.ligandWorld.y
  };
}

function isPoreLaneOccupied(receptor) {
  for (const p of receptorNaParticles) {
    if (p.enteredCell) continue;
    if (Math.abs(p.x - receptor.x) < 2.4 && Math.abs(p.y - receptor.y) < 1.6) {
      return true;
    }
  }
  return false;
}

function hasPendingNaPoreEntry() {
  for (const p of receptorNaParticles) {
    if (p.kind !== "gpcr" && !p.enteredCell) return true;
  }
  return false;
}

function spawnNaBurst(receptor, count) {
  const laneOffsets = [-1.2, 0, 1.2];
  for (let i = 0; i < count; i++) {
    const lane = laneOffsets[receptor.influxSerial % laneOffsets.length];
    receptor.influxSerial += 1;
    receptorNaParticles.push({
      x: receptor.x - 0.6,
      y: receptor.y + lane,
      vx: random(0.14, 0.19),
      vy: lane * 0.014,
      alpha: 230,
      life: 412,
      kind: "ampa",
      enteredCell: false,
      poreBoost: random(0.016, 0.024)
    });
  }
}

function isGpcrPoreLaneOccupied(receptor) {
  const g = getGpcrGeometry(receptor);
  for (const p of receptorNaParticles) {
    if (p.kind !== "gpcr" || p.enteredCell) continue;
    if (dist(p.x, p.y, g.ionWorld.x, g.ionWorld.y) < 2.8) return true;
  }
  return false;
}

function spawnGpcrNaBurst(receptor, count) {
  const g = getGpcrGeometry(receptor);
  const laneOffsets = [-0.8, 0, 0.8];
  for (let i = 0; i < count; i++) {
    const lane = laneOffsets[receptor.influxSerial % laneOffsets.length];
    receptor.influxSerial += 1;
    receptorNaParticles.push({
      x: g.ionWorld.x + g.frame.tangentX * lane,
      y: g.ionWorld.y + g.frame.tangentY * lane,
      vx: g.frame.normalX * random(0.08, 0.11) + g.frame.tangentX * lane * 0.0015,
      vy: g.frame.normalY * random(0.08, 0.11) + g.frame.tangentY * lane * 0.0015,
      nx: g.frame.normalX,
      ny: g.frame.normalY,
      tx: g.frame.tangentX,
      ty: g.frame.tangentY,
      alpha: 228,
      life: 470,
      kind: "gpcr",
      enteredCell: false,
      travel: 0,
      poreBoost: random(0.006, 0.011)
    });
  }
}

function updateReceptorNaParticles() {
  for (let i = receptorNaParticles.length - 1; i >= 0; i--) {
    const p = receptorNaParticles[i];

    if (p.kind === "gpcr") {
      if (!p.enteredCell) {
        p.vx += (p.nx || 1) * p.poreBoost;
        p.vy += (p.ny || 0) * p.poreBoost;
      }

      p.travel = (p.travel || 0) + Math.hypot(p.vx, p.vy);
      if (!p.enteredCell && p.travel > 3.2) {
        p.enteredCell = true;
        const fan = random(-0.06, 0.06);
        p.vx += (p.tx || 0) * fan;
        p.vy += (p.ty || 0) * fan;
      }

      if (p.enteredCell) {
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.vx += random(-0.004, 0.004);
        p.vy += random(-0.004, 0.004);
      }

      p.x += p.vx;
      p.y += p.vy;
    } else {
      // Once ions pass through the AMPA/NMDA pore into intracellular space, fan out.
      if (!p.enteredCell && p.x >= 2.0) {
        p.enteredCell = true;
        p.vy += random(-0.06, 0.06);
      }

      // Vacuum-like pore pull into intracellular space.
      if (!p.enteredCell) {
        p.vx += p.poreBoost;
      }

      if (p.enteredCell) {
        p.vx *= 0.992;
        p.vy += random(-0.01, 0.01);
      }

      p.vy *= 0.98;
      p.x += p.vx;
      p.y += p.vy;
    }

    p.alpha -= NA_FADE_STEP;
    p.life -= 1;

    if (p.alpha <= 0 || p.life <= 0 || Math.abs(p.x) > 210 || Math.abs(p.y) > 210) {
      receptorNaParticles.splice(i, 1);
    }
  }
}

function drawIntertwinedHelix(ctx, x, y, openEase = 0) {
  const length = 12 + openEase * 3;
  const amp = 2.8 + openEase * 1.9;
  const freq = 0.42;

  const phases = [0, PI * 0.5, PI, PI * 1.5];

  for (let s = 0; s < phases.length; s++) {
    ctx.beginPath();
    for (let i = 0; i <= length; i += 1) {
      const px = x - length * 0.5 + i;
      const py = y + Math.sin(i * freq + phases[s]) * amp;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = openEase > 0.45 ? RECEPTOR_BLUE_BRIGHT : RECEPTOR_BLUE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // subtle outline to suggest a bundled finger-trap tube
  ctx.strokeStyle = openEase > 0.45 ? RECEPTOR_BLUE_BRIGHT : RECEPTOR_BLUE;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(x, y, 8 + openEase * 1.4, 5 + openEase * 1.0, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawIntertwinedHelixCore(ctx, x, y, openEase = 0) {
  const length = 12 + openEase * 3;
  const amp = 2.8 + openEase * 1.9;
  const freq = 0.42;
  const phases = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

  for (let s = 0; s < phases.length; s++) {
    ctx.beginPath();
    for (let i = 0; i <= length; i += 1) {
      const px = x - length * 0.5 + i;
      const py = y + Math.sin(i * freq + phases[s]) * amp;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = RECEPTOR_BLUE_BRIGHT;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function drawIntertwinedHelixCoreRotated(ctx, x, y, rotation, openEase = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  drawIntertwinedHelixCore(ctx, 0, 0, openEase);
  ctx.restore();
}

function drawGpcrHelix(ctx, x, y, h, phase = 0) {
  ctx.beginPath();
  for (let i = 0; i <= h; i += 2) {
    const px = x + Math.sin(i * 0.34 + phase) * 0.95;
    const py = y + i - h * 0.5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawMiniFingerTrapCore(ctx, x, y, length = 6, amp = 1.3) {
  const freq = 0.65;
  const phases = [0, PI * 0.5, PI, PI * 1.5];

  for (const ph of phases) {
    ctx.beginPath();
    for (let i = 0; i <= length; i += 1) {
      const px = x + Math.sin(i * freq + ph) * amp;
      const py = y - length * 0.5 + i;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

function drawRoundedLoop(ctx, x0, x1, yBase, depth, outwardSign) {
  const xm = (x0 + x1) * 0.5;
  ctx.beginPath();
  ctx.moveTo(x0, yBase);
  ctx.quadraticCurveTo(xm, yBase + depth * outwardSign, x1, yBase);
  ctx.stroke();
}

function renderMetabotropicReceptor(ctx, r) {
  const g = getGpcrGeometry(r);
  const x = g.x;
  const y = g.y;
  const cSide = g.cSide;
  const nSide = g.nSide;
  const ligandLocal = g.ligandLocal;
  const helixX = [-13.5, -9, -4.5, 0, 4.5, 9, 13.5];
  const topY = y - 4;
  const bottomY = y + 4;
  const coreLen = 10;
  const coreAmp = 1.45;
  const nLabelX = x + nSide * (r.id === 1 ? 18 : 13);
  const nLabelY = y + (r.id === 1 ? -13 : -10);
  const ionChannelOpenEase = (r.channelOpenEase || 0) * 0.62;
  const ionChannelX = x + g.ionLocal.x;
  const ionChannelY = y + g.ionLocal.y;
  const effectorX = ionChannelX - cSide * 7.8;
  const membraneInsideY = y + 6.0;
  const sideTilt = (r.id === 0 ? 1 : -1) * (Math.PI / 12); // +/-15 deg

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(g.rotation);
  ctx.translate(-x, -y);
  // 7 transmembrane mini-spiral cores (AMPA-style strands, squeezed down)
  ctx.strokeStyle = GPCR_BLUE;
  ctx.lineWidth = 0.85;
  for (let i = 0; i < helixX.length; i++) {
    drawMiniFingerTrapCore(ctx, x + helixX[i], y, coreLen, coreAmp);
  }

  // Thin polar-end connectors outside and inside membrane.
  ctx.beginPath();
  ctx.moveTo(x + helixX[0], y - 6);
  ctx.lineTo(x + helixX[helixX.length - 1], y - 6);
  ctx.moveTo(x + helixX[0], y + 6);
  ctx.lineTo(x + helixX[helixX.length - 1], y + 6);
  ctx.stroke();

  // 3 extracellular loops + N-terminus (outside)
  ctx.strokeStyle = GPCR_LOOP;
  ctx.lineWidth = 0.95;
  drawRoundedLoop(ctx, x + helixX[0], x + helixX[1], y - 6, 3.5, -1);
  drawRoundedLoop(ctx, x + helixX[2], x + helixX[3], y - 6, 3.5, -1);
  drawRoundedLoop(ctx, x + helixX[4], x + helixX[5], y - 6, 3.5, -1);

  ctx.fillStyle = "rgba(240, 248, 255, 0.95)";
  ctx.font = "8px sans-serif";
  ctx.fillText("N", nLabelX, nLabelY);

  // 3 intracellular loops + C-terminus (inside)
  drawRoundedLoop(ctx, x + helixX[1], x + helixX[2], y + 6, 3.5, +1);
  drawRoundedLoop(ctx, x + helixX[3], x + helixX[4], y + 6, 3.5, +1);
  drawRoundedLoop(ctx, x + helixX[5], x + helixX[6], y + 6, 3.5, +1);
  ctx.fillText("C", x + cSide * 11, y + 13);

  // Short intracellular connector from one helix to G-protein on C-terminus side.
  ctx.beginPath();
  ctx.moveTo(x + cSide * 4, bottomY);
  ctx.lineTo(x + cSide * 9, y + 4);
  ctx.stroke();

  // Heterotrimeric G-protein (alpha/beta/gamma) near C-terminus on intracellular side.
  const gtpEase = constrain(r.gtpEase || 0, 0, 1);
  const gBaseR = 2.8;
  const gLargeR = gBaseR * (4 / 3); // reduced by one-third from 2x size
  const gDrift = constrain(r.gDrift01 || 0, 0, 1);
  const movingX = lerp(x + cSide * 16, x + g.effectorLocal.x - cSide * 3.2, gDrift);
  const movingY = lerp(y + 8.5, y + g.effectorLocal.y + 0.6, gDrift);

  ctx.fillStyle = GPCR_PROTEIN;
  ctx.beginPath();
  ctx.arc(x + cSide * 12, y + 4, gBaseR, 0, TWO_PI); // alpha (near C)
  ctx.fill();
  ctx.beginPath();
  ctx.arc(movingX, movingY, gLargeR, 0, TWO_PI); // beta drifts toward effector
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + cSide * 10, y + 9.5, gBaseR, 0, TWO_PI); // gamma
  ctx.fill();

  if (gtpEase > 0.01) {
    ctx.fillStyle = `rgba(246, 198, 116, ${0.98 * gtpEase})`;
    ctx.beginPath();
    ctx.arc(x + cSide * 12, y + 4, gBaseR, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(movingX, movingY, gLargeR, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + cSide * 10, y + 9.5, gBaseR, 0, TWO_PI);
    ctx.fill();
  }

  const gdpEase = constrain(r.gdpEase || 0, 0, 1);
  if (gdpEase > 0.01 || gtpEase > 0.01) {
    ctx.font = "7px sans-serif";
    const gdpAlpha = 0.92 * gdpEase;
    const gtpAlpha = 0.98 * gtpEase;
    if (gdpAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 238, 173, ${gdpAlpha})`;
      ctx.fillText("GDP", x + cSide * 18, y + 12.2);
    }
    if (gtpAlpha > 0.01) {
      ctx.fillStyle = `rgba(146, 255, 174, ${gtpAlpha})`;
      ctx.fillText("GTP", x + cSide * 18, y + 12.2);
    }
  }

  // Effector + side channel stay GPCR-lateral by drawing in GPCR-local frame.
  ctx.save();
  ctx.translate(effectorX, membraneInsideY);
  ctx.fillStyle = "rgba(170, 214, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(0, 0, 4.4, 0, Math.PI);
  ctx.fill();
  ctx.restore();

  drawIntertwinedHelixCoreRotated(
    ctx,
    ionChannelX,
    ionChannelY,
    Math.PI * 0.5 + sideTilt,
    ionChannelOpenEase
  );

  // extracellular ligand site hint
  ctx.fillStyle = r.bound ? "rgba(184,92,255,0.95)" : "white";
  ctx.beginPath();
  ctx.arc(x + ligandLocal.x, y + ligandLocal.y, 1.0, 0, TWO_PI);
  ctx.fill();

  if (window.SHOW_RECEPTOR_DEBUG) {
    ctx.fillStyle = "rgba(255, 244, 196, 0.95)";
    ctx.font = "9px monospace";
    ctx.fillText(`mGluR${r.id} ${r.gProteinNucleotide}`, x + 22, y - 8);
  }

  ctx.restore();
}

function renderReceptor(ctx, receptor) {
  const poreOpen = receptor.state === "open";
  const centerX = receptor.x;
  const centerY = receptor.y;

  ctx.save();

  // ---------------- INTERTWINED SIDEWAYS "FINGER-TRAP" BUNDLE ----------------
  drawIntertwinedHelix(
    ctx,
    centerX,
    centerY,
    receptor.openEase || 0
  );

  // Primary glutamate binding site (circle).
  const ntSite = receptor.kind === "nmda" ? NMDA_NT_SITE : AMPA_NT_SITE;
  const sx = centerX + ntSite.x;
  const sy = centerY + ntSite.y;

  const boundAlpha = receptor.bound[0]
    ? constrain((receptor.boundTimer || 0) / BIND_HOLD_FRAMES, 0, 1)
    : 1;
  ctx.fillStyle = receptor.bound[0]
    ? `rgba(184, 92, 255, ${boundAlpha})`
    : "white";
  ctx.beginPath();
  ctx.arc(sx, sy, RECEPTOR_BINDING_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // NMDA glycine co-agonist site (triangle), white -> orange when bound.
  if (receptor.kind === "nmda") {
    const gx = centerX + NMDA_GLY_SITE.x;
    const gy = centerY + NMDA_GLY_SITE.y;
    const triR = RECEPTOR_BINDING_RADIUS * 1.7;
    ctx.fillStyle = receptor.bound[1] ? "orange" : "white";
    ctx.beginPath();
    ctx.moveTo(gx, gy - triR);
    ctx.lineTo(gx - triR * 0.86, gy + triR * 0.58);
    ctx.lineTo(gx + triR * 0.86, gy + triR * 0.58);
    ctx.closePath();
    ctx.fill();
  }

  // Side-facing channel indication (toward presynapse), no top-down pore.
  ctx.strokeStyle = poreOpen ? RECEPTOR_BLUE_BRIGHT : RECEPTOR_BLUE;
  ctx.lineWidth = poreOpen ? 2.8 : 2.0;
  ctx.beginPath();
  ctx.moveTo(centerX - 2, centerY);
  ctx.lineTo(centerX + 2, centerY);
  ctx.stroke();

  if (window.SHOW_RECEPTOR_DEBUG) {
    ctx.fillStyle = "rgba(255, 244, 196, 0.95)";
    ctx.font = "10px monospace";
    ctx.fillText(
      `R${receptor.id} b:${countBound(receptor)} ${receptor.state}`,
      centerX + 14,
      centerY - 12
    );
  }

  ctx.restore();
}

function drawPSD95Scaffolding(ctx) {
  // Draw on intracellular side (+X), away from synaptic face x=0.
  if (!receptors.length && !gpcrReceptors.length) return;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const railA = 20;
  const railB = 38;
  const railC = 56;
  const yMin = -118;
  const yMax = 118;

  // Backbone rails spanning the PSD zone in the postsynaptic head interior.
  ctx.strokeStyle = PSD95_MESH;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(railA, yMin);
  ctx.lineTo(railA, yMax);
  ctx.moveTo(railB, yMin);
  ctx.lineTo(railB, yMax);
  ctx.moveTo(railC, yMin + 8);
  ctx.lineTo(railC, yMax - 8);
  ctx.stroke();

  // Cross-links between rails for lattice-like scaffold feel.
  ctx.strokeStyle = PSD95_BRANCH;
  ctx.lineWidth = 1.2;
  for (let y = yMin + 12; y <= yMax - 12; y += 22) {
    ctx.beginPath();
    ctx.moveTo(railA, y);
    ctx.lineTo(railB, y + ((y / 12) % 2 === 0 ? 2 : -2));
    ctx.lineTo(railC, y + ((y / 12) % 2 === 0 ? -2 : 2));
    ctx.stroke();
  }

  // Sparse scaffold nodes without membrane-face receptor connectors.
  ctx.fillStyle = PSD95_NODE;
  for (let y = yMin + 18; y <= yMax - 18; y += 28) {
    ctx.beginPath();
    ctx.arc(railA, y, 1.6, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(railB, y + 2, 1.5, 0, TWO_PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(railC, y - 2, 1.7, 0, TWO_PI);
    ctx.fill();
  }

  // AMPA receptors can translocate from scaffold to postsynaptic face (LTP)
  // and return to scaffold after inactivity (LTD-like).
  const scaffoldAnchors = getScaffoldAmpaLayout();
  for (let i = 0; i < scaffoldAnchors.length; i++) {
    const anchor = scaffoldAnchors[i];
    const r = scaffoldAmpaReceptors[i];
    if (!r) continue;

    // Keep scaffold anchor fixed while AMPA receptors move independently.
    ctx.strokeStyle = PSD95_STEM;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(railB + 1.5, anchor.y);
    ctx.lineTo(anchor.scaffoldX - 2.2, anchor.y);
    ctx.moveTo(anchor.scaffoldX + 2.2, anchor.y);
    ctx.lineTo(railC - 1.5, anchor.y);
    ctx.stroke();

    const x = r.x;
    const y = r.y;

    drawIntertwinedHelix(ctx, x, y, r.openEase || 0);
    ctx.strokeStyle = RECEPTOR_BLUE_BRIGHT;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(x - 1.7, y);
    ctx.lineTo(x + 1.7, y);
    ctx.stroke();

    const boundAlpha = r.bound?.[0]
      ? constrain((r.boundTimer || 0) / BIND_HOLD_FRAMES, 0, 1)
      : 1;
    ctx.fillStyle = r.bound?.[0]
      ? `rgba(184, 92, 255, ${boundAlpha})`
      : "white";
    ctx.beginPath();
    ctx.arc(x - 7.5, y, RECEPTOR_BINDING_RADIUS, 0, TWO_PI);
    ctx.fill();
  }

  ctx.restore();
}

function drawPSDReceptors() {
  ensureReceptors();
  const ctx = drawingContext;

  try {
    drawPSD95Scaffolding(ctx);

    for (const receptor of receptors) {
      renderReceptor(ctx, receptor);
    }
    for (const gpcr of gpcrReceptors) {
      renderMetabotropicReceptor(ctx, gpcr);
    }

    // Na+ enters postsynaptic intracellular side (+X) then fades.
    ctx.font = "10px sans-serif";
    const sodium = window.COLORS?.sodium || [255, 215, 0];
    for (const p of receptorNaParticles) {
      ctx.fillStyle = `rgba(${sodium[0]}, ${sodium[1]}, ${sodium[2]}, ${p.alpha / 255})`;
      ctx.fillText("Na⁺", p.x, p.y);
    }
  } catch (err) {
    console.error("PSD receptor render error:", err);
  }
}

function getPostsynapticReceptorAnchors(kind = "all") {
  ensureReceptors();
  const postX = window.SYNAPSE_POST_X ?? 130;
  const neuronY = window.SYNAPSE_NEURON_Y ?? 40;
  const anchors = [];

  for (const receptor of receptors) {
    if (kind !== "all" && receptor.kind !== kind) continue;
    anchors.push({
      id: receptor.id,
      kind: receptor.kind,
      x: postX + receptor.x,
      y: neuronY + receptor.y
    });
  }

  if (kind === "all" || kind === "gpcr") {
    for (const gpcr of gpcrReceptors) {
      const geometry = getGpcrGeometry(gpcr);
      anchors.push({
        id: `gpcr-${gpcr.id}`,
        kind: "gpcr",
        x: postX + geometry.x,
        y: neuronY + geometry.y,
        effectorX: postX + geometry.effectorWorld.x,
        effectorY: neuronY + geometry.effectorWorld.y,
        ionX: postX + geometry.ionWorld.x,
        ionY: neuronY + geometry.ionWorld.y
      });
    }
  }

  return anchors;
}

window.updatePSDReceptors = updatePSDReceptors;
window.drawPSDReceptors = drawPSDReceptors;
window.renderReceptor = renderReceptor;
window.notePostSynapticVesicleRelease = notePostSynapticVesicleRelease;
window.notePostSynapticStimulation = notePostSynapticStimulation;
window.notePostSynapticStimulus = notePostSynapticStimulation;
window.forceScaffoldAmpaLTD = forceScaffoldAmpaLTD;
window.getPostsynapticReceptorAnchors = getPostsynapticReceptorAnchors;
