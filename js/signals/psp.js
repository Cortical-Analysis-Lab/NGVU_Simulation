// =====================================================
// POSTSYNAPTIC POTENTIAL (EPSP / IPSP) MODEL
// =====================================================
console.log("psp loaded");

// -----------------------------------------------------
// Active postsynaptic potentials (global PSP engine)
// -----------------------------------------------------
const epsps  = [];   // neuron 1 + neuron 3 PSPs
const epsps2 = [];   // neuron 2 EPSPs (visual only for now)

function clonePath(path) {
  if (!Array.isArray(path) || path.length < 2) return null;
  return path.map(p => ({ x: p.x, y: p.y }));
}

function buildFallbackPathToSoma(synapse) {
  if (!neuron?.dendrites?.length) return null;

  let bestBranch = null;
  let bestDist = Infinity;

  for (const branch of neuron.dendrites) {
    if (!Array.isArray(branch) || branch.length < 2) continue;
    const tip = branch[branch.length - 1];
    const d = dist(synapse.x, synapse.y, tip.x, tip.y);
    if (d < bestDist) {
      bestDist = d;
      bestBranch = branch;
    }
  }

  if (!bestBranch) return null;

  const path = [];
  for (let i = bestBranch.length - 1; i >= 0; i--) {
    path.push({ x: bestBranch[i].x, y: bestBranch[i].y });
  }
  path.push({ x: 0, y: 0 });
  return path;
}

function buildPathMetrics(path) {
  if (!Array.isArray(path) || path.length < 2) return null;

  const cumulative = [0];
  let total = 0;

  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    total += dist(a.x, a.y, b.x, b.y);
    cumulative.push(total);
  }

  if (total <= 0) return null;
  return { cumulative, total };
}

function samplePathAt(path, metrics, u) {
  if (!path || !metrics) return null;

  const target = constrain(u, 0, 1) * metrics.total;
  const cum = metrics.cumulative;

  let seg = 1;
  while (seg < cum.length && cum[seg] < target) seg++;
  seg = constrain(seg, 1, path.length - 1);

  const d0 = cum[seg - 1];
  const d1 = cum[seg];
  const span = max(1e-6, d1 - d0);
  const t = constrain((target - d0) / span, 0, 1);

  const p0 = path[seg - 1];
  const p1 = path[seg];
  return {
    x: lerp(p0.x, p1.x, t),
    y: lerp(p0.y, p1.y, t)
  };
}

// -----------------------------------------------------
// Spawn a PSP from a synapse (generic, neuron 1 legacy)
// -----------------------------------------------------
function spawnEPSP(synapse) {
  const path =
    clonePath(synapse.path) ||
    buildFallbackPathToSoma(synapse);

  if (!path) return;
  const metrics = buildPathMetrics(path);
  if (!metrics) return;

  synapse.path = path;

  epsps.push({
    synapseId: synapse.id,
    path,
    pathMetrics: metrics,

    progress: 0,                    // 0 → synapse, 1 → soma
    amplitude: synapse.radius,
    baseAmplitude: synapse.radius,

    speed: 0.012,
    decay: 0.995,
    type: synapse.type              // "exc" or "inh"
  });
}

// -----------------------------------------------------
// Spawn EPSP on neuron 2 dendrite
// -----------------------------------------------------
function spawnNeuron2EPSP(postSynapse) {

  if (!neuron2 || !neuron2.dendrites.length) return;

  const path = [...neuron2.dendrites[0]].reverse();
  const metrics = buildPathMetrics(path);
  if (!metrics) return;

  epsps2.push({
    path,
    pathMetrics: metrics,
    progress: 0,
    amplitude: 40,
    baseAmplitude: 40,
    speed: 0.01,
    decay: 0.992,
    type: "exc"
  });
}

// -----------------------------------------------------
// Spawn IPSP on neuron 3 dendrite
// -----------------------------------------------------
function spawnNeuron3IPSP(postSynapse) {

  if (!neuron3 || !neuron3.dendrites.length) return;

  const path = [...neuron3.dendrites[0]].reverse();
  const metrics = buildPathMetrics(path);
  if (!metrics) return;

  epsps.push({
    synapseId: "neuron3",
    path,
    pathMetrics: metrics,

    progress: 0,
    amplitude: 25,
    baseAmplitude: 25,

    speed: 0.010,
    decay: 0.994,
    type: "inh"
  });
}

// -----------------------------------------------------
// Update PSP propagation + decay (GLOBAL)
// -----------------------------------------------------
function updateEPSPs() {

  for (let i = epsps.length - 1; i >= 0; i--) {
    const e = epsps[i];

    if (!Array.isArray(e.path) || e.path.length < 2) {
      epsps.splice(i, 1);
      continue;
    }
    if (!e.pathMetrics) {
      e.pathMetrics = buildPathMetrics(e.path);
      if (!e.pathMetrics) {
        epsps.splice(i, 1);
        continue;
      }
    }

    e.progress += e.speed;
    e.amplitude *= e.decay;

    // --------------------------------------------------
    // PSP fades before reaching soma
    // --------------------------------------------------
    if (e.amplitude < 0.6) {

      if (
        !state.paused &&
        typeof logEvent === "function"
      ) {
        logEvent(
          "system",
          "Postsynaptic potential decayed before reaching the soma",
          "dendrite"
        );
      }

      epsps.splice(i, 1);
      continue;
    }

    // --------------------------------------------------
    // PSP reaches soma
    // --------------------------------------------------
    if (e.progress >= 1) {

      const sourceNeuron =
        e.synapseId === "neuron3" ? 3 : 1;

      // -------------------------------
      // Electrical effect on soma
      // -------------------------------
      addEPSPToSoma(e.baseAmplitude, e.type, sourceNeuron);

      // -------------------------------
      // Ion dynamics (Neuron 1 ONLY)
      // -------------------------------
      if (sourceNeuron === 1) {

        // EPSP → Na⁺ influx
        if (
          e.type === "exc" &&
          typeof triggerNaInfluxNeuron1 === "function"
        ) {
          triggerNaInfluxNeuron1();
        }

        // IPSP → K⁺ efflux
        if (
          e.type === "inh" &&
          typeof triggerKEffluxNeuron1 === "function"
        ) {
          triggerKEffluxNeuron1();
        }
      }

      // -------------------------------
      // Logging
      // -------------------------------
      if (
        !state.paused &&
        typeof logEvent === "function"
      ) {
        logEvent(
          "neural",
          e.type === "exc"
            ? "Excitatory postsynaptic potential reached the soma"
            : "Inhibitory postsynaptic potential reached the soma",
          "soma"
        );
      }

      epsps.splice(i, 1);
    }
  }
}

// -----------------------------------------------------
// Update neuron 2 EPSPs (visual only)
// -----------------------------------------------------
function updateNeuron2EPSPs() {

  for (let i = epsps2.length - 1; i >= 0; i--) {
    const e = epsps2[i];

    e.progress += e.speed;
    e.amplitude *= e.decay;

    if (e.amplitude < 0.6) {
      epsps2.splice(i, 1);
      continue;
    }

    if (e.progress >= 1) {
      epsps2.splice(i, 1);
    }
  }
}

// -----------------------------------------------------
// Draw PSPs along dendritic paths (GLOBAL)
// -----------------------------------------------------
function drawEPSPs() {

  epsps.forEach(e => {
    if (!e.path || e.path.length < 2) return;
    if (!e.pathMetrics) return;

    const p = samplePathAt(e.path, e.pathMetrics, e.progress);
    if (!p) return;
    const x = p.x;
    const y = p.y;

    const strength =
      map(e.amplitude, 6, 30, 0.65, 1.45, true);
    const w =
      map(e.baseAmplitude, 6, 30, 5, 18) * strength;

    const c =
      e.type === "exc"
        ? getColor("epsp")
        : getColor("ipsp");

    push();
    stroke(c);
    strokeWeight(w);
    point(x, y);
    pop();
  });
}

// -----------------------------------------------------
// Draw neuron 2 EPSPs
// -----------------------------------------------------
function drawNeuron2EPSPs() {

  epsps2.forEach(e => {
    if (!e.pathMetrics) return;
    const p = samplePathAt(e.path, e.pathMetrics, e.progress);
    if (!p) return;
    const x = p.x;
    const y = p.y;

    const w = map(e.amplitude, 4, 12, 5, 11, true);

    push();
    stroke(getColor("epsp"));
    strokeWeight(w);
    point(x, y);
    pop();
  });
}
