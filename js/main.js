console.log("✅ main.js loaded");

// =====================================================
// GLOBAL SIMULATION STATE
// =====================================================
const state = {
  time: 0,
  dt: 16.67,
  paused: false,
  mode: "overview",          
  transition: null           // null | toSynapse | toIon | toOverviewFade | toOverviewZoom
};
// =====================================================
// 🔒 AUTHORITATIVE WORLD FRAME (NEVER CHANGES)
// =====================================================
window.WORLD_FRAME = {
  width:  1400,
  height: 900
};

// -----------------------------------------------------
// Global Toggles
// -----------------------------------------------------
window.myelinEnabled  = false;
window.loggingEnabled = false;
window.mobileTouchUI = false;

// -----------------------------------------------------
// SAFE LOGGING WRAPPER
// -----------------------------------------------------
function safeLog(type, message = null, target = null) {
  if (typeof logEvent === "function") logEvent(type, message, target);
}

// =====================================================
// CAMERA STATE (WORLD SPACE ONLY)
// =====================================================
const camera = {
  x: 0, y: 0, zoom: 1,

  startX: 0, startY: 0, startZoom: 1,
  targetX: 0, targetY: 0, targetZoom: 1,

  t: 0,
  duration: 120
};

const tutorial = {
  enabled: false,
  running: false,
  step: 0,
  stepStartTime: 0,
  lastActionTime: -9999,
  singleSynapse: null,
  groupSynapses: [],
  inhibitorySynapses: [],
  mixedSynapses: [],
  originalRadii: new Map(),
  title: "",
  body: "",
  overlayTitle: "",
  overlaySubtitle: "",
  prevMyelinEnabled: false,
  lastSizeFireTime: -9999,
  controlClick: null,
  sizeDemoPhase: "",
  sizeDemoClicks: 0,
  sizeDemoRadius: null,
  pulse: 0
};

// =====================================================
// 🔒 LOCKED SYNAPSE FOCUS
// =====================================================
window.synapseFocus = {
  x: 272.08,
  y: -0.42,
  releaseProb: 0.9,
  diffusionDelay: 10
};

// =====================================================
// EASING FUNCTION
// =====================================================
function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function detectMobileTouchUI() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const touchPoints = navigator.maxTouchPoints || 0;
  const narrowViewport = min(window.innerWidth || width || 0, window.innerHeight || height || 0) <= 1024;
  return coarsePointer || (touchPoints > 0 && narrowViewport);
}

function syncInputProfile() {
  window.mobileTouchUI = detectMobileTouchUI();
  document.body.classList.toggle("mobile-touch-ui", !!window.mobileTouchUI);
  if (typeof updateUIPanelContent === "function") {
    updateUIPanelContent(state?.mode);
  }
}

// =====================================================
// BEGIN TRANSITION
// =====================================================
function beginTransition(targetMode) {

  camera.startX = camera.x;
  camera.startY = camera.y;
  camera.startZoom = camera.zoom;
  camera.t = 0;

  // ----------------------------
  // OVERVIEW → SYNAPSE
  // ----------------------------
  if (targetMode === "synapse") {
    camera.targetX = synapseFocus.x;
    camera.targetY = synapseFocus.y;
    camera.targetZoom = 5.0;
    camera.duration = 120;
    state.transition = "toSynapse";
    safeLog("system", "Zooming into synapse…");
    return;
  }

  // ----------------------------
  // OVERVIEW → BRAIN
  // ----------------------------
  if (targetMode === "ion") {
    camera.targetX = 0;
    camera.targetY = 0;
    camera.targetZoom = 0.68;
    camera.duration = 120;
    state.transition = "toIon";
    safeLog("system", "Zooming out to brain view…");
    return;
  }

  // ----------------------------
  // SYNAPSE → OVERVIEW (FADE ONLY)
  // ----------------------------
  if (targetMode === "overview") {
    camera.targetX = camera.x;       // stay zoomed in
    camera.targetY = camera.y;
    camera.targetZoom = camera.zoom;
    camera.duration = 90;
    state.transition = "toOverviewFade";
    safeLog("system", "Returning to overview…");
  }
}

// =====================================================
// MODE SWITCHING
// =====================================================
function setMode(mode) {
  if (mode === "synapse") return beginTransition("synapse");
  if (mode === "ion") return beginTransition("ion");
  if (mode === "overview") return beginTransition("overview");

  state.mode = mode;
  camera.targetZoom = 2.5;
  updateOverviewUI();
  if (typeof updateUIPanelContent === "function") {
    updateUIPanelContent(mode);
  }
}

// =====================================================
// P5 SETUP
// =====================================================
let canvas;

function setup() {

  console.log(
    "axon path length:",
    neuron?.axon?.path?.length
  );

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  frameRate(60);
  syncInputProfile();

  // ---------------------------------------------------
  // GEOMETRY / BIOLOGY INITIALIZATION
  // ---------------------------------------------------
  initSynapses();
  initAxonPath(neuron);
  initArtery();
  if (typeof initMolecules === "function") {
    initMolecules();
  }

  const geom = generateMyelinGeometry(neuron.axon.path);
  neuron.axon.nodes   = geom.nodes;
  neuron.axon.sheaths = geom.sheaths; // 🔑 THIS WAS MISSING


  initNeuron2();
  initNeuron3();
  initAstrocyte();

  // ===================================================
  // 🧂 EXTRACELLULAR IONS (MUST COME AFTER GEOMETRY)
  // ===================================================
  initBackgroundIons();
  initSomaIons();
  initAxonIons();

  if (typeof initNodeIons === "function") {
  initNodeIons();
  }


  // ---------------------------------------------------
  // INITIAL MODE
  // ---------------------------------------------------
  state.mode = "overview";

  // ---------------------------------------------------
  // UI CONTROLS
  // ---------------------------------------------------
  const pauseBtn = document.getElementById("pauseBtn");
  if (pauseBtn) pauseBtn.onclick = togglePause;

  const ltpLtdBtn = document.getElementById("ltpLtdBtn");
  if (ltpLtdBtn) {
    ltpLtdBtn.addEventListener("click", () => {
      window.toggleLtpLtdDemo?.();
    });
    window.updateLtpLtdButtonUI?.();
  }

  const myelinToggle = document.getElementById("myelinToggle");
  if (myelinToggle) {
    myelinToggle.checked = window.myelinEnabled;
    myelinToggle.addEventListener("change", () => {
      window.myelinEnabled = myelinToggle.checked;
    });
  }

  const tutorialToggle = document.getElementById("tutorialToggle");
  if (tutorialToggle) {
    tutorialToggle.checked = false;
    tutorialToggle.addEventListener("change", () => {
      if (tutorialToggle.checked) {
        if (state.mode === "synapse") {
          stopGuidedTutorial();
          window.startSynapseGuidedTutorial?.();
        } else {
          window.stopSynapseGuidedTutorial?.();
          startGuidedTutorial();
        }
      } else if (state.mode === "synapse") {
        window.stopSynapseGuidedTutorial?.();
      } else {
        stopGuidedTutorial();
      }
      syncGuidedTutorialToggle();
    });
  }

  if (typeof setEventLogOpen === "function") {
    setEventLogOpen(false);
  }

  // ---------------------------------------------------
  // UI SYNC
  // ---------------------------------------------------
  updateOverviewUI();
  if (typeof updateUIPanelContent === "function") {
    updateUIPanelContent(state.mode);
  }
}

function updateWorld() {
  state.time += state.dt;

  updateHemodynamics();
  updateBloodContents();
  updateSupplyWaves();
  updatePressureWaves();

  updateSynapseHover();
  updateGuidedTutorial();
  updateEPSPs();
  updateSoma();
  updateVoltageTrace();

  if (window.myelinEnabled) updateMyelinAPs();
  else updateAxonSpikes();

  updateTerminalDots();
  updateVesicles();
  updateNeuron2EPSPs();
  updateSynapticCoupling();

  if (typeof updateMolecules === "function") {
    updateMolecules();
  }
}

// =====================================================
// MAIN LOOP
// =====================================================
function draw() {
  background(15, 17, 21);
  const transitioning = state.transition !== null;

  if (!state.paused && !transitioning) {
    updateWorld();
  }

  // ---------------------------------------------------
  // CAMERA TRANSITION
  // ---------------------------------------------------
  if (transitioning) {

    camera.t++;
    const u = constrain(camera.t / camera.duration, 0, 1);
    const e = easeInOut(u);

    camera.x = lerp(camera.startX, camera.targetX, e);
    camera.y = lerp(camera.startY, camera.targetY, e);
    camera.zoom = lerp(camera.startZoom, camera.targetZoom, e);

    if (u >= 1) {

      // ▶ Enter synapse
      if (state.transition === "toSynapse") {
        state.mode = "synapse";
        state.transition = null;
      }

      // ▶ Enter brain view
      else if (state.transition === "toIon") {
        state.mode = "ion";
        state.transition = null;
      }

      // ▶ Fade complete → switch to overview, begin zoom-out
      else if (state.transition === "toOverviewFade") {
        state.mode = "overview";

        camera.startX = camera.x;
        camera.startY = camera.y;
        camera.startZoom = camera.zoom;

        camera.targetX = 0;
        camera.targetY = 0;
        camera.targetZoom = 1.0;
        camera.duration = 240; // half speed
        camera.t = 0;

        state.transition = "toOverviewZoom";
      }

      // ▶ Zoom-out complete
      else if (state.transition === "toOverviewZoom") {
        state.transition = null;
      }

      updateOverviewUI();
      if (typeof updateUIPanelContent === "function") {
        updateUIPanelContent(state.mode);
      }
    }
  }

  push();

  // -----------------------------------------------------
  // WORLD → SCREEN (LETTERBOXED, LOCKED)
  // -----------------------------------------------------
  const wf = window.WORLD_FRAME;
  
  const sx = width  / wf.width;
  const sy = height / wf.height;
  const worldScale = min(sx, sy);
  
  // center world
  translate(width / 2, height / 2);
  scale(worldScale);
  
  // -----------------------------------------------------
  // CAMERA (WORLD SPACE ONLY)
  // -----------------------------------------------------
  scale(camera.zoom);
  translate(-camera.x, -camera.y);

  const useWorldClip = state.mode === "overview";
  if (useWorldClip) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(-wf.width / 2, -wf.height / 2, wf.width, wf.height);
    drawingContext.clip();
  }

  // ---------------------------------------------------
  // DRAW MODES
  // ---------------------------------------------------
  if (state.mode === "overview") renderWorld(drawingContext);
  if (state.mode === "ion")      drawIonView(state);
  if (state.mode === "synapse")  drawSynapseView(state);
  if (state.mode === "overview") drawGuidedTutorialWorldOverlay();

  if (useWorldClip) {
    drawingContext.restore();
    drawWorldFrameBorder();
  }

  pop();

  // ---------------------------------------------------
  // FADE OVERLAY
  // ---------------------------------------------------
  if (transitioning && state.mode !== "synapse") {
    const u = constrain(camera.t / camera.duration, 0, 1);
    let alpha = 0;

    if (state.transition === "toSynapse") {
      alpha = map(u, 0.3, 1.0, 0, 220, true);
    }
    else if (state.transition === "toOverviewFade") {
      alpha = map(u, 0.0, 1.0, 0, 220);
    }
    else if (state.transition === "toOverviewZoom") {
      alpha = map(u, 0.0, 0.4, 220, 0, true);
    }

    noStroke();
    fill(0, alpha);
    rect(0, 0, width, height);
  }

  drawTimeReadout();
  drawGuidedTutorialHUD();
  if (typeof drawEventLog === "function") drawEventLog();
}

// =====================================================
// UI HELPERS
// =====================================================
function drawTimeReadout() {
  fill(220);
  noStroke();
  textSize(14);
  textAlign(RIGHT, TOP);
  text(`t = ${state.time.toFixed(0)} ms`, width - 20, 20);
}

function togglePause() {
  state.paused = !state.paused;
}

function togglePanel(id) {
  const panel = document.getElementById(id);
  if (panel) panel.classList.toggle("open");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  syncInputProfile();
  initArtery();
  if (typeof initMolecules === "function") {
    initMolecules();
  }
}

function updateOverviewUI() {
  const visible = state.mode === "overview";
  const synapseVisible = state.mode === "synapse";
  const mobileTouchUI = !!window.mobileTouchUI;
  const tutorialEligible = visible || synapseVisible;
  const myelinUI = document.getElementById("myelinToggleContainer");
  const tutorialUI = document.getElementById("tutorialToggleContainer");
  const plasticityDock = document.getElementById("plasticity-dock");
  const ltpLtdBtn = document.getElementById("ltpLtdBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const eventLog = document.getElementById("event-log");

  if (myelinUI) myelinUI.style.display = (!mobileTouchUI && visible) ? "flex" : "none";
  if (tutorialUI) tutorialUI.style.display = tutorialEligible ? "flex" : "none";
  if (plasticityDock) plasticityDock.style.display = (!mobileTouchUI && synapseVisible) ? "flex" : "none";
  if (ltpLtdBtn) ltpLtdBtn.style.display = (!mobileTouchUI && synapseVisible) ? "inline-flex" : "none";
  if (pauseBtn) pauseBtn.style.display = mobileTouchUI ? "none" : "inline-flex";
  if (eventLog) eventLog.style.display = mobileTouchUI ? "none" : "";
  syncGuidedTutorialToggle();
}

function syncGuidedTutorialToggle() {
  const tutorialToggle = document.getElementById("tutorialToggle");
  if (!tutorialToggle) return;

  if (state.mode === "overview") {
    tutorialToggle.checked = !!(tutorial.enabled && tutorial.running);
    return;
  }

  if (state.mode === "synapse") {
    tutorialToggle.checked = !!window.synapseGuidedTutorial?.enabled;
    return;
  }

  tutorialToggle.checked = false;
}

window.syncGuidedTutorialToggle = syncGuidedTutorialToggle;

function drawWorldFrameBorder() {
  const wf = window.WORLD_FRAME;
  if (!wf) return;

  push();
  rectMode(CENTER);
  noFill();
  stroke(155, 175, 210, 185);
  strokeWeight(2 / max(camera.zoom, 0.001));
  rect(0, 0, wf.width, wf.height, 14);
  pop();
}

function clearSynapseSelection() {
  if (!neuron?.synapses) return;
  neuron.synapses.forEach(s => {
    s.selected = false;
    s.hovered = false;
  });
}

function restoreTutorialRadii() {
  if (!neuron?.synapses || tutorial.originalRadii.size === 0) return;
  neuron.synapses.forEach(s => {
    if (tutorial.originalRadii.has(s.id)) {
      s.radius = tutorial.originalRadii.get(s.id);
    }
  });
}

function pickTutorialTargets() {
  const syns = Array.isArray(neuron?.synapses) ? neuron.synapses : [];
  const excit = syns.filter(s => s.type !== "inh");
  const inhib = syns.filter(s => s.type === "inh");
  const pool = excit.length ? excit : syns;
  if (!pool.length) {
    return {
      single: null,
      group: [],
      inhibitoryGroup: [],
      mixedGroup: []
    };
  }

  let single = pool[0];
  let bestScore = Infinity;
  pool.forEach(s => {
    const score = dist(s.x, s.y, 0, 0) + random(-6, 6);
    if (score < bestScore) {
      bestScore = score;
      single = s;
    }
  });

  const group = [...pool]
    .sort((a, b) => dist(a.x, a.y, 0, 0) - dist(b.x, b.y, 0, 0))
    .slice(0, min(6, pool.length));

  const inhibitoryGroup = [...inhib]
    .sort((a, b) => dist(a.x, a.y, 0, 0) - dist(b.x, b.y, 0, 0))
    .slice(0, min(4, inhib.length));

  const mixedGroup = [
    ...group.slice(0, min(4, group.length)),
    ...inhibitoryGroup.slice(0, min(3, inhibitoryGroup.length))
  ];

  return { single, group, inhibitoryGroup, mixedGroup };
}

function setTutorialStep(step) {
  tutorial.step = step;
  tutorial.stepStartTime = state.time;
  tutorial.lastActionTime = -9999;

  if (step === 0) {
    tutorial.title = "Guided Tutorial";
    tutorial.body = "This primary neuron is the central integrative cell in the scene, linking synaptic input, spike generation, downstream signaling, and recruitment of surrounding support systems.";
    tutorial.overlayTitle = "PRIMARY NEURON";
    tutorial.overlaySubtitle = "Core integrator linking synapses, axon signaling, and local support responses";
  } else if (step === 1) {
    tutorial.title = "Single EPSP Effect";
    tutorial.body = "A single excitatory synapse generates depolarizing EPSPs. Increasing synaptic size in this model increases postsynaptic effect size, while decreasing it reduces the somatic Vm deflection.";
    tutorial.overlayTitle = "STEP 1: SINGLE EPSP";
    tutorial.overlaySubtitle = "Single excitatory input, then larger and smaller synaptic drive";
  } else if (step === 2) {
    tutorial.title = "Inhibitory (IPSP) Effects";
    tutorial.body = "Inhibitory synapses generate hyperpolarizing or shunting IPSPs that reduce the probability that somatic membrane voltage will reach spike threshold.";
    tutorial.overlayTitle = "STEP 2: IPSP EFFECT";
    tutorial.overlaySubtitle = "Inhibitory conductance suppresses depolarization toward threshold";
  } else if (step === 3) {
    tutorial.title = "Excitatory + Inhibitory Group Effect";
    tutorial.body = "Excitatory and inhibitory synaptic populations are integrated together at the soma, and the net membrane voltage depends on their timing, number, and relative strength.";
    tutorial.overlayTitle = "STEP 3: E/I BALANCE";
    tutorial.overlaySubtitle = "Somatic Vm reflects the balance of excitation and inhibition";
  } else if (step === 4) {
    tutorial.title = "Grouped EPSP Summation";
    tutorial.body = "Multiple excitatory inputs arrive close enough in time to summate, producing a larger depolarization at the soma than any one synapse could produce alone.";
    tutorial.overlayTitle = "STEP 4: GROUPED EPSPs";
    tutorial.overlaySubtitle = "Temporal and spatial summation increase somatic depolarization";
  } else if (step === 5) {
    tutorial.title = "Soma Vm and Axon Hillock";
    tutorial.body = "Summated synaptic current depolarizes the soma and axon initial segment until threshold is crossed, triggering an all-or-none action potential.";
    tutorial.overlayTitle = "STEP 5: AP INITIATION";
    tutorial.overlaySubtitle = "Spike initiation occurs at the axon initial segment";
  } else if (step === 6) {
    tutorial.title = "Unmyelinated Axonal Na+ Flux";
    tutorial.body = "In the unmyelinated segment, regenerative membrane depolarization progresses continuously along the axon, with Na+ entry accompanying spike propagation.";
    tutorial.overlayTitle = "STEP 6: AXON ION FLUX";
    tutorial.overlaySubtitle = "Continuous conduction spreads depolarization along the full membrane";
  } else if (step === 7) {
    tutorial.title = "Myelinated Axon Conduction";
    tutorial.body = "In the myelinated segment, current spreads rapidly beneath the myelin sheath and the action potential is regenerated mainly at nodes of Ranvier, producing faster saltatory conduction.";
    tutorial.overlayTitle = "STEP 7: MYELINATED AP";
    tutorial.overlaySubtitle = "Saltatory conduction regenerates spikes at nodes of Ranvier";
  } else if (step === 8) {
    tutorial.title = "Downstream Excitatory and Inhibitory Effects";
    tutorial.body = "The primary neuron drives downstream targets differently: neuron 2 shows an excitatory postsynaptic response, while neuron 3 shows an inhibitory postsynaptic response.";
    tutorial.overlayTitle = "STEP 8: NEURONS 2 AND 3";
    tutorial.overlaySubtitle = "Distinct downstream targets can receive excitatory or inhibitory signaling";
  } else if (step === 9) {
    tutorial.title = "Synaptic Astrocyte Support";
    tutorial.body = "Perisynaptic astrocytic processes sense local activity and help stabilize the extracellular environment through transmitter handling, ion buffering, and support of the tripartite synapse.";
    tutorial.overlayTitle = "STEP 9: ASTROCYTE";
    tutorial.overlaySubtitle = "Astrocytes support synapses by buffering ions and regulating transmitter clearance";
  } else if (step === 10) {
    tutorial.title = "Arterial Support Response";
    tutorial.body = "Neural activity recruits metabolic support, and blood-borne substrates such as oxygen and glucose move from the vascular compartment toward active tissue.";
    tutorial.overlayTitle = "STEP 10: ARTERY";
    tutorial.overlaySubtitle = "Delivered oxygen and glucose support the active circuit";
  } else if (step === 11) {
    tutorial.title = "Now you try!";
    tutorial.body = "Use the controls to vary synaptic strength, excitation-inhibition balance, spike generation, and support-system responses, then compare how each changes the simulation state.";
    tutorial.overlayTitle = "NOW YOU TRY!";
    tutorial.overlaySubtitle = "Explore synaptic integration, spike propagation, and neurovascular support";
  }
}

function startGuidedTutorial() {
  tutorial.enabled = true;
  tutorial.running = true;
  tutorial.pulse = 0;
  tutorial.lastSizeFireTime = -9999;
  tutorial.controlClick = null;
  tutorial.sizeDemoPhase = "";
  tutorial.sizeDemoClicks = 0;
  tutorial.sizeDemoRadius = null;
  tutorial.prevMyelinEnabled = !!window.myelinEnabled;

  if (state.mode !== "overview") setMode("overview");
  state.paused = false;

  const targets = pickTutorialTargets();
  tutorial.singleSynapse = targets.single;
  tutorial.groupSynapses = targets.group;
  tutorial.inhibitorySynapses = targets.inhibitoryGroup || [];
  tutorial.mixedSynapses = targets.mixedGroup || [];
  tutorial.originalRadii.clear();

  neuron?.synapses?.forEach(s => tutorial.originalRadii.set(s.id, s.radius));
  clearSynapseSelection();
  setTutorialStep(0);
}

function stopGuidedTutorial() {
  tutorial.enabled = false;
  tutorial.running = false;
  tutorial.title = "";
  tutorial.body = "";
  restoreTutorialRadii();
  clearSynapseSelection();
  tutorial.singleSynapse = null;
  tutorial.groupSynapses = [];
  tutorial.inhibitorySynapses = [];
  tutorial.mixedSynapses = [];
  tutorial.controlClick = null;
  tutorial.sizeDemoPhase = "";
  tutorial.sizeDemoClicks = 0;
  tutorial.sizeDemoRadius = null;
  window.myelinEnabled = tutorial.prevMyelinEnabled;
}

function advanceTutorialStep() {
  const next = tutorial.step >= 11 ? 11 : tutorial.step + 1;
  setTutorialStep(next);
}

function applySingleSynapseTutorial(elapsed) {
  const s = tutorial.singleSynapse;
  if (!s) return;
  const r0 = tutorial.originalRadii.get(s.id) ?? s.radius;
  s.selected = true;
  s.radius = constrain(r0 + 1.4 + sin(elapsed * 0.0046) * 0.8, 6, 30);

  if (state.time - tutorial.lastActionTime > 1900) {
    spawnEPSP(s);
    tutorial.lastActionTime = state.time;
  }
}

function applySynapseVmScalingTutorial(elapsed) {
  const s = tutorial.singleSynapse;
  if (!s) return;

  const r0 = tutorial.originalRadii.get(s.id) ?? s.radius;
  if (tutorial.sizeDemoRadius == null) {
    tutorial.sizeDemoRadius = r0;
  }
  let impactLabel = "baseline";

  if (elapsed < 3200) {
    tutorial.sizeDemoPhase = "baseline";
    tutorial.sizeDemoClicks = 0;
  } else if (elapsed < 7200) {
    if (tutorial.sizeDemoPhase !== "grow") {
      tutorial.sizeDemoPhase = "grow";
      tutorial.sizeDemoClicks = 0;
    }

    if (tutorial.sizeDemoClicks < 3 && state.time - tutorial.lastActionTime > 700) {
      const proxy = { radius: tutorial.sizeDemoRadius };
      increaseSynapseRadius?.(proxy);
      tutorial.sizeDemoRadius = proxy.radius;
      tutorial.controlClick = { target: "plus", startedAt: state.time };
      tutorial.lastActionTime = state.time;
      tutorial.sizeDemoClicks += 1;
    }
    impactLabel = "increased";
  } else if (elapsed < 12600) {
    if (tutorial.sizeDemoPhase !== "shrink") {
      tutorial.sizeDemoPhase = "shrink";
      tutorial.sizeDemoClicks = 0;
    }

    if (tutorial.sizeDemoClicks < 5 && state.time - tutorial.lastActionTime > 620) {
      const proxy = { radius: tutorial.sizeDemoRadius };
      decreaseSynapseRadius?.(proxy);
      tutorial.sizeDemoRadius = proxy.radius;
      tutorial.controlClick = { target: "minus", startedAt: state.time };
      tutorial.lastActionTime = state.time;
      tutorial.sizeDemoClicks += 1;
    }
    impactLabel = "reduced";
  } else {
    tutorial.sizeDemoPhase = "recover";
    tutorial.sizeDemoRadius = lerp(tutorial.sizeDemoRadius, r0, 0.14);
  }

  s.radius = tutorial.sizeDemoRadius;
  s.selected = true;
  s.hovered = true;

  if (state.time - tutorial.lastSizeFireTime > 2100) {
    spawnEPSP(s);
    tutorial.lastSizeFireTime = state.time;
  }

  const impact =
    impactLabel === "reduced" ? "smaller synapse, smaller Vm change" :
    impactLabel === "increased" ? "larger synapse, larger Vm change" :
    "baseline synapse size and Vm change";

  const plusCount =
    tutorial.sizeDemoPhase === "grow" ? tutorial.sizeDemoClicks :
    tutorial.sizeDemoPhase === "shrink" || tutorial.sizeDemoPhase === "recover" ? 3 : 0;
  const minusCount =
    tutorial.sizeDemoPhase === "shrink" ? tutorial.sizeDemoClicks :
    tutorial.sizeDemoPhase === "recover" ? 5 : 0;

  tutorial.body = `Synapse radius: ${s.radius.toFixed(1)}. In this model, synaptic size scales excitatory effect strength: ${impact}. Demo clicks: +${plusCount} / -${minusCount}. Soma Vm: ${soma.VmDisplay.toFixed(1)} mV`;
}

function applySynapseGroupTutorial(group, elapsed, {
  fireInterval = 1100,
  baseGrowth = 1.0,
  highlight = true,
  animateRadius = true
} = {}) {
  if (!group.length) return;

  group.forEach((s, idx) => {
    const r0 = tutorial.originalRadii.get(s.id) ?? s.radius;
    s.selected = highlight;
    s.radius = animateRadius
      ? constrain(
          r0 + baseGrowth + idx * 0.35 + sin(elapsed * 0.005 + idx * 0.6) * 0.5,
          6,
          30
        )
      : constrain(r0 + baseGrowth + idx * 0.35, 6, 30);
  });

  if (state.time - tutorial.lastActionTime > fireInterval) {
    group.forEach(s => spawnEPSP(s));
    tutorial.lastActionTime = state.time;
  }
}

function updateGuidedTutorial() {
  if (!tutorial.running || !tutorial.enabled) return;
  if (state.mode !== "overview") return;
  if (!neuron?.synapses?.length) return;

  tutorial.pulse += 0.12;
  clearSynapseSelection();
  restoreTutorialRadii();

  const elapsed = state.time - tutorial.stepStartTime;

  if (tutorial.step === 0) {
    if (elapsed > 4000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 1) {
    applySynapseVmScalingTutorial(elapsed);
    if (elapsed > 14000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 2) {
    applySynapseGroupTutorial(tutorial.inhibitorySynapses || [], elapsed, {
      fireInterval: 1800,
      baseGrowth: 0.9
    });
    tutorial.body = `IPSP phase active. Inhibitory input is reducing net depolarization at the soma. Soma Vm: ${soma.VmDisplay.toFixed(1)} mV`;
    if (elapsed > 14000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 3) {
    applySynapseGroupTutorial(tutorial.mixedSynapses || [], elapsed, {
      fireInterval: 1700,
      baseGrowth: 1.0,
      highlight: false
    });
    tutorial.body = `Excitatory and inhibitory inputs are active together, and the soma reflects their net integration. Soma Vm: ${soma.VmDisplay.toFixed(1)} mV`;
    if (elapsed > 15000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 4) {
    applySynapseGroupTutorial(tutorial.groupSynapses || [], elapsed, {
      fireInterval: 1650,
      baseGrowth: 1.25
    });
    tutorial.body = `Grouped excitatory inputs are summating across time and inputs, driving the soma closer to spike threshold. Soma Vm: ${soma.VmDisplay.toFixed(1)} mV`;
    if (elapsed > 15000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 5) {
    applySynapseGroupTutorial(tutorial.groupSynapses || [], elapsed, {
      fireInterval: 2200,
      baseGrowth: 1.35,
      highlight: false,
      animateRadius: false
    });
    tutorial.body = `Somatic depolarization has reached spike threshold at the axon initial segment. Soma Vm: ${soma.VmDisplay.toFixed(1)} mV`;
    if (elapsed > 13000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 6) {
    window.myelinEnabled = false;

    if (state.time - tutorial.lastActionTime > 3200) {
      spawnAxonSpike?.();
      spawnInvisibleAxonAP?.();
      triggerNaInfluxNeuron1?.();
      tutorial.lastActionTime = state.time;
    }

    tutorial.body = "Unmyelinated propagation is active here, so depolarization and Na+ entry progress continuously along the axonal membrane.";

    if (elapsed > 15000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 7) {
    window.myelinEnabled = true;
    if (state.time - tutorial.lastActionTime > 2600) {
      spawnAxonSpike?.();
      tutorial.lastActionTime = state.time;
    }

    tutorial.body = "Myelin is enabled here, so current spreads farther between regenerating nodes and conduction is faster than in the unmyelinated segment.";
    if (elapsed > 12000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 8) {
    if (state.time - tutorial.lastActionTime > 2400) {
      if (typeof spawnNeuron2EPSP === "function" && neuron2?.synapses?.[0]) {
        spawnNeuron2EPSP(neuron2.synapses[0]);
      }
      if (typeof spawnNeuron3IPSP === "function" && neuron3?.synapses?.[0]) {
        spawnNeuron3IPSP(neuron3.synapses[0]);
      }
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = "Neuron 2 is showing an excitatory postsynaptic response, while neuron 3 is showing an inhibitory postsynaptic response with opposite effect on membrane voltage.";
    if (elapsed > 12000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 9) {
    if (state.time - tutorial.lastActionTime > 2200) {
      triggerAstrocyteBorderGlow?.();
      triggerAstrocyteResponse?.();
      tutorial.lastActionTime = state.time;
    }
    if (elapsed > 11000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 10) {
    if (state.time - tutorial.lastActionTime > 2300) {
      triggerAstrocyteBorderGlow?.();
      triggerAstrocyteResponse?.();
      tutorial.lastActionTime = state.time;
    }
    if (elapsed > 12000) advanceTutorialStep();
    return;
  }

  if (tutorial.step === 11) {
    window.myelinEnabled = tutorial.prevMyelinEnabled;
    tutorial.running = true;
  }
}

function drawNeuronSupportOverlay(neuronRef, synapseRef, colors) {
  if (synapseRef) {
    drawPulseCircle(synapseRef.x, synapseRef.y, (synapseRef.radius || 8) * 3.1, colors.synapse);
  }

  if (neuronRef?.soma) {
    drawPulseCircle(neuronRef.soma.x, neuronRef.soma.y, neuronRef.somaRadius * 2.55, colors.soma);
  }
}

function drawPulseCircle(x, y, r, col = [255, 230, 120, 220]) {
  const p = 1 + 0.16 * sin(tutorial.pulse);
  noFill();
  stroke(col[0], col[1], col[2], col[3]);
  strokeWeight(2 / max(camera.zoom, 0.001));
  circle(x, y, r * p);
}

function drawPulseRect(x, y, w, h, radius = 14, col = [255, 230, 120, 220]) {
  const p = 1 + 0.06 * sin(tutorial.pulse);
  noFill();
  stroke(col[0], col[1], col[2], col[3]);
  strokeWeight(2 / max(camera.zoom, 0.001));
  rectMode(CENTER);
  rect(x, y, w * p, h * p, radius);
  rectMode(CORNER);
}

function drawTutorialControlClick(s) {
  if (!s?.hovered || !tutorial.controlClick) return;

  const age = state.time - tutorial.controlClick.startedAt;
  if (age > 420) return;

  const isPlus = tutorial.controlClick.target === "plus";
  const cx = s.x;
  const cy = isPlus ? s.y - s.radius - 18 : s.y + s.radius + 18;
  const press = age < 180;

  push();
  noStroke();
  fill(255, 220, 120, press ? 220 : 120);
  ellipse(cx, cy, press ? 24 : 30, press ? 24 : 30);
  pop();
}

function getTutorialStep5PulseTarget() {
  const hillockX = neuron.somaRadius + neuron.hillock.length * 0.58;

  if (
    typeof window.currentAxonAPPhase === "number" &&
    typeof getAxonPoint === "function"
  ) {
    const p = getAxonPoint(constrain(window.currentAxonAPPhase, 0, 1));
    return { x: p.x, y: p.y };
  }

  if (soma.delayCounter > 0 && !soma.visibleAPReleased) {
    return { x: hillockX, y: 0 };
  }

  return { x: hillockX, y: 0 };
}

function drawGuidedTutorialWorldOverlay() {
  if (!tutorial.running || !tutorial.enabled || state.mode !== "overview") return;

  push();
  if (tutorial.step === 0) {
    drawPulseCircle(0, 0, neuron.somaRadius * 2.95, [255, 208, 120, 200]);
  }

  if (tutorial.step === 1) {
    const s = tutorial.singleSynapse;
    if (s) {
      drawPulseCircle(s.x, s.y, s.radius * 3.5, [255, 220, 125, 220]);
      drawTutorialControlClick(s);
    }
  }

  if (tutorial.step === 2) {
    (tutorial.inhibitorySynapses || []).forEach((s, i) => {
      drawPulseCircle(s.x, s.y, s.radius * (2.4 + i * 0.14), [120, 185, 255, 210]);
    });
  }

  if (tutorial.step === 3) {
    const justFired = state.time - tutorial.lastActionTime < 520;
    if (justFired) {
      (tutorial.mixedSynapses || []).forEach((s, i) => {
        const color = s.type === "inh"
          ? [120, 185, 255, 200]
          : [255, 210, 115, 200];
        drawPulseCircle(s.x, s.y, s.radius * (2.2 + i * 0.12), color);
      });
    }
  }

  if (tutorial.step === 4) {
    (tutorial.groupSynapses || []).forEach((s, i) => {
      drawPulseCircle(s.x, s.y, s.radius * (2.6 + i * 0.15), [255, 210, 115, 210]);
    });
  }

  if (tutorial.step === 5) {
    const pulseTarget = getTutorialStep5PulseTarget();
    drawPulseCircle(pulseTarget.x, pulseTarget.y, 32, [255, 120, 90, 230]);
  }

  if (tutorial.step === 6) {
    if (Array.isArray(neuron?.axon?.path) && neuron.axon.path.length) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      neuron.axon.path.forEach(p => {
        minX = min(minX, p.x);
        maxX = max(maxX, p.x);
        minY = min(minY, p.y);
        maxY = max(maxY, p.y);
      });

      const paddingX = 26;
      const paddingY = 22;
      drawPulseRect(
        (minX + maxX) * 0.5,
        (minY + maxY) * 0.5,
        (maxX - minX) + paddingX * 2,
        (maxY - minY) + paddingY * 2,
        18,
        [120, 205, 255, 230]
      );
    }
  }

  if (tutorial.step === 7) {
    if (Array.isArray(neuron?.axon?.path) && neuron.axon.path.length) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      neuron.axon.path.forEach(p => {
        minX = min(minX, p.x);
        maxX = max(maxX, p.x);
        minY = min(minY, p.y);
        maxY = max(maxY, p.y);
      });

      drawPulseRect(
        (minX + maxX) * 0.5,
        (minY + maxY) * 0.5,
        (maxX - minX) + 56,
        (maxY - minY) + 42,
        20,
        [255, 215, 120, 220]
      );
    }
  }

  if (tutorial.step === 8) {
    drawNeuronSupportOverlay(
      neuron2,
      neuron2?.synapses?.[0],
      {
        synapse: [255, 210, 115, 220],
        soma: [255, 210, 115, 180]
      }
    );
    drawNeuronSupportOverlay(
      neuron3,
      neuron3?.synapses?.[0],
      {
        synapse: [120, 185, 255, 230],
        soma: [120, 185, 255, 185]
      }
    );
  }

  if (tutorial.step === 9) {
    if (astrocyte?.x != null && astrocyte?.y != null) {
      drawPulseCircle(astrocyte.x, astrocyte.y, 40, [205, 170, 255, 205]);
    }
    if (astrocyte?.endfeet?.length) {
      astrocyte.endfeet.forEach(pt => drawPulseCircle(pt.x, pt.y, 28, [185, 145, 255, 230]));
    }
  }

  if (tutorial.step === 10) {
    const deliveryFocus = typeof getBloodDeliveryFocus === "function"
      ? getBloodDeliveryFocus()
      : null;
    if (deliveryFocus) {
      drawPulseCircle(deliveryFocus.x, deliveryFocus.y, 42, [120, 235, 255, 230]);
    }
  }

  if (tutorial.step === 11) {
    drawPulseCircle(0, 0, neuron.somaRadius * 2.1, [255, 255, 255, 180]);
  }
  pop();
}

function getScreenPointFromWorld(wx, wy) {
  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const worldScale = min(width / wf.width, height / wf.height) || 1;
  return {
    x: width / 2 + ((wx - camera.x) * camera.zoom) * worldScale,
    y: height / 2 + ((wy - camera.y) * camera.zoom) * worldScale
  };
}

function drawGuidedTutorialHUD() {
  if (!tutorial.running || !tutorial.enabled || state.mode !== "overview") return;

  const x = 16;
  const y = 78;
  const w = min(560, width - 32);
  const h = 88;

  push();
  noStroke();
  fill(12, 16, 26, 220);
  rect(x, y, w, h, 10);
  fill(255, 236, 174);
  textAlign(LEFT, TOP);
  textSize(13);
  text(`Tutorial: ${tutorial.title}`, x + 12, y + 10);
  fill(218, 226, 240);
  textSize(12);
  text(tutorial.body, x + 12, y + 32, w - 24, h - 18);

  // Large primary-neuron overlay above the primary neuron.
  const somaScreen = getScreenPointFromWorld(0, 0);
  const maxW = min(540, width - 40);
  const ox = constrain(somaScreen.x - maxW * 0.45, 20, width - maxW - 20);
  const oy = constrain(somaScreen.y - 360, 6, max(6, height * 0.16));
  fill(255, 255, 255, 230);
  textAlign(LEFT, TOP);
  textSize(36);
  text(tutorial.overlayTitle || "PRIMARY NEURON", ox, oy);
  fill(255, 255, 255, 188);
  textSize(18);
  text(tutorial.overlaySubtitle || "", ox, oy + 44, maxW, 120);
  pop();
}
