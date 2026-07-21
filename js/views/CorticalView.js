console.log("cortical view loaded");

const CORTICAL_COLUMN_FRAME = {
  width: 1180,
  height: 920
};

const CORTICAL_COLUMN_SCALE = 0.88;
const CORTICAL_VIEWPORT_MARGIN = 24;
const CORTICAL_LABEL_GUTTER_MIN = 104;
const CORTICAL_LABEL_GUTTER_MAX = 170;
const CORTICAL_VASCULATURE_BOUNDS = {
  left: -510,
  right: 510,
  top: -220,
  bottom: 382
};
const CORTICAL_VIEW_BOUNDS = {
  left: -540,
  right: 520,
  top: -214,
  bottom: 374
};
const CORTICAL_LAYER_BANDS = [
  { label: "Layer 1", top: -132, bottom: -56, tint: [54, 74, 102, 88] },
  { label: "Layer 2", top: -56, bottom: 26, tint: [48, 68, 94, 82] },
  { label: "Layer 3", top: 26, bottom: 124, tint: [42, 62, 86, 76] },
  { label: "Layer 4", top: 124, bottom: 242, tint: [36, 56, 80, 72] },
  { label: "Layer 5", top: 242, bottom: 374, tint: [32, 50, 72, 68] }
];
const CORTICAL_NEURON_COUNTS = [0, 52, 60, 60, 68];
const CORTICAL_FLOW_TYPES = [
  { type: "RED", color: [236, 88, 88], radius: 1.3 },
  { type: "GREEN", color: [154, 244, 142], radius: 1.2 },
  { type: "BLUE", color: [160, 220, 255], radius: 1.15 }
];
const CORTICAL_FLOW_RELEASE_INTERVAL = 1;
const CORTICAL_FLOW_RELEASE_BATCH = 18;
const CORTICAL_FLOW_MAX_ACTIVE = 1280;
const CORTICAL_FLOW_TARGET_PER_ROUTE = 36;
const CORTICAL_INSOMNIA_MOLECULE_MULTIPLIER = 0.5;
const CORTICAL_INSOMNIA_MICROGLIA_MAX_ADDITIONAL = 18;
const CORTICAL_FLOW_PULSE_FREQ = 0.003;
const CORTICAL_FLOW_PULSE_GAIN = 0.95;
const CORTICAL_FLOW_WAVE_GAIN = 0.45;
const CORTICAL_FLOW_SPEED_SCALE = 0.55;
const CORTICAL_AP_SPEED_SCALE = 0.45;
const CORTICAL_INSOMNIA_AP_MIN_MULTIPLIER = 0.28;
const CORTICAL_INSOMNIA_AP_MAX_MULTIPLIER = 0.85;
const CORTICAL_AP_COLUMN_COUNT = 12;
const CORTICAL_METABOLIC_WASTE_SCALE = 0.255;
const CORTICAL_METABOLIC_WASTE_MAX_ACTIVE = 900;
const CORTICAL_WASTE_CLEARANCE_WAVE_MS = 40000;
const CORTICAL_INSOMNIA_WASTE_CLEARANCE_WAVE_MS = 120000;
const CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH = 110;
const CORTICAL_WASTE_CLEARANCE_PICKUP_PROBABILITY = 0.5;
const CORTICAL_EPILEPSY_WAVE_SPEED = 0.072;
const CORTICAL_EPILEPSY_WAVE_THICKNESS = 32;
const CORTICAL_EPILEPSY_SUPPRESSION_MS = 30000;
const CORTICAL_EPILEPSY_REPEAT_DELAY_MS = 3200;
const CORTICAL_EPILEPSY_FLOW_SPEED_MULTIPLIER = 0.42;
const CORTICAL_EPILEPSY_MOLECULE_MULTIPLIER = 0.5;
const CORTICAL_EPILEPSY_VASCULAR_EFFLUX_PROBABILITY = 0.052;
const CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT = 24;
const CORTICAL_MICROGLIA_INFLAMMATORY_RING_MS = 1400;
const CORTICAL_STROKE_BED_CENTER_Y = 124;
const CORTICAL_STROKE_AP_SUPPRESSION_RADIUS = 64;
const CORTICAL_STROKE_OCCLUSION_RADIUS = 10;
const CORTICAL_STROKE_OCCLUSION_TRAVEL_MS = 5200;
const CORTICAL_STROKE_WASTE_BLOCK_HALF_HEIGHT = 44;
const CORTICAL_STROKE_FRAGMENT_COUNT = 9;
const CORTICAL_STROKE_FRAGMENT_LIFE_MS = 6200;
const CORTICAL_STROKE_RECRUITED_MICROGLIA_COUNT = 14;
const CORTICAL_STROKE_MICROGLIA_ARRIVAL_RADIUS = 9;
const CORTICAL_AGING_NEURON_COUNT_DIVISOR = 1.75;
const CORTICAL_AGING_MICROGLIA_MULTIPLIER = 2;
const CORTICAL_AGING_BBB_GAP_MULTIPLIER = 3;
const CORTICAL_AGING_AP_OCCURRENCE_MULTIPLIER = 0.42;
const CORTICAL_AGING_AP_ACTIVE_MULTIPLIER = 0.5;
const CORTICAL_AGING_MOLECULE_GENERATION_MULTIPLIER = 0.5;
const CORTICAL_MICROVASCULAR_DATA_VERSION = 52;

let corticalNeuronLayout = null;
let corticalAstrocyteLayout = null;
let corticalMicrogliaLayout = null;
let corticalCrNeuronLayout = null;
let corticalSgNeuronLayout = null;
let corticalFusiformNeuronLayout = null;
let corticalInhibitoryNeuronLayout = null;
let corticalInhibitoryType2NeuronLayout = null;
let corticalSignalNodeLayout = null;
let corticalInhibitorySignalCellLayout = null;
let corticalActivationRouteBank = null;
let corticalActivationRouteCatalog = null;
let corticalMicrovascularFlowData = null;
const corticalMicrovascularFlowDataCache = new Map();
let corticalStaticSceneCache = null;
let corticalMetabolicWasteParticles = [];
let corticalNeuronIdCounter = 0;
let corticalAgingCacheState = null;
let corticalInsomniaMicrogliaLayout = null;

const CORTICAL_WARMUP_INITIAL_ETA_MS = 18000;
window.corticalViewReadiness = window.corticalViewReadiness || {
  started: false,
  ready: false,
  failed: false,
  completed: 0,
  total: 0,
  startedAt: 0,
  estimatedReadyAt: 0,
  currentTask: "Waiting to start"
};

function publishCorticalViewReadiness() {
  window.dispatchEvent?.(new CustomEvent("cortical-readiness-change", {
    detail: { ...window.corticalViewReadiness }
  }));
}

function getCorticalViewReadiness() {
  const readiness = window.corticalViewReadiness;
  const now = performance.now();
  return {
    ...readiness,
    progress: readiness.total > 0 ? readiness.completed / readiness.total : 0,
    etaSeconds: readiness.ready
      ? 0
      : max(1, ceil((readiness.estimatedReadyAt - now) / 1000))
  };
}

window.corticalGuidedTutorial = window.corticalGuidedTutorial || {
  enabled: false,
  running: false,
  completionVisible: false,
  step: 0,
  stepStartTime: 0,
  pulse: 0,
  title: "",
  body: "",
  prevDisplayMode: "all",
  wasteSeededForStep: -1,
  wasteGenerationIndex: 0,
  wasteRemovalStarted: false,
  wasteVascularDisplayStarted: false
};

const CORTICAL_TUTORIAL_LAST_STEP = 6;
const CORTICAL_TUTORIAL_STEP_MS = 9000;
const CORTICAL_TUTORIAL_WASTE_GENERATION_MS = 4200;
const CORTICAL_TUTORIAL_WASTE_REMOVAL_DELAY_MS = 5200;
const CORTICAL_TUTORIAL_WASTE_VASCULAR_SWITCH_MS = 7600;
const CORTICAL_TUTORIAL_WASTE_STEP_MS = 20000;
const CORTICAL_TUTORIAL_WASTE_CARRIED_SPEED_SCALE = 0.42;
const CORTICAL_TUTORIAL_WASTE_VASCULAR_SPEED_SCALE = 0.48;

function getCorticalViewState() {
  if (!window.corticalViewState) {
    window.corticalViewState = {
      time: 0,
      dt: 16.67,
      zoom: 1,
      offset: { x: 0, y: 0 },
      offsetInitialized: false
    };
  }

  return window.corticalViewState;
}

function resetCorticalViewTransform() {
  const corticalState = getCorticalViewState();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  corticalState.zoom = 1;
  corticalState.offset = {
    x: -((CORTICAL_VIEW_BOUNDS.left + CORTICAL_VIEW_BOUNDS.right) * 0.5) * baseScale,
    y: -((CORTICAL_VIEW_BOUNDS.top + CORTICAL_VIEW_BOUNDS.bottom) * 0.5) * baseScale
  };
  corticalState.offsetInitialized = true;
}

function setCorticalTutorialStep(step) {
  const tutorial = window.corticalGuidedTutorial;
  tutorial.step = constrain(step, 0, CORTICAL_TUTORIAL_LAST_STEP);
  tutorial.stepStartTime = getCorticalViewState().time;
  tutorial.completionVisible = false;

  if (tutorial.step === 0) {
    tutorial.title = "Cortical Column Guided Tutorial";
    tutorial.body = "This view places neural activity inside layered cortical tissue, with glia, microvasculature, BBB structures, molecular flow, and waste clearance in the same scene.";
  } else if (tutorial.step === 1) {
    tutorial.title = "Cortical Layers";
    tutorial.body = "The column is organized by depth bands, moving from superficial Layer 1 through deeper cortical layers. Each band provides spatial context for the cells and vessels drawn inside it.";
  } else if (tutorial.step === 2) {
    tutorial.title = "Neural Populations";
    tutorial.body = "Neuron display includes pyramidal, Cajal-Retzius, stellate granular, fusiform, and inhibitory neuron types. Traveling green dots are excitatory signals; traveling red dots are inhibitory signals.";
  } else if (tutorial.step === 3) {
    tutorial.title = "Glial Support";
    tutorial.body = "Glia display includes astrocytes and microglia. Astrocytes respond near local activity, and microglia surveil the tissue field while emitting inflammatory rings in pathology states.";
  } else if (tutorial.step === 4) {
    tutorial.title = "Vessels, BBB, and Flow";
    tutorial.body = "Vasculature display shows pial vessels, descending branches, capillary beds, endothelial cells, pericytes, and moving vascular particles that represent molecular flow through the network.";
  } else if (tutorial.step === 5) {
    tutorial.title = "Waste Clearance";
    tutorial.body = "Waste bundles appear around neural signal nodes in the neuron display. The clearance wave picks them up first, then the tutorial switches to the vascular display as waste enters vessels and is carried away.";
  } else {
    tutorial.title = "Now You Try";
    tutorial.body = "Use Display to isolate neurons, glia, or vasculature, then compare how neural signals, glial response, vascular flow, BBB structure, and waste clearance relate across the column.";
  }

  if (tutorial.step !== 5 && tutorial.wasteSeededForStep !== -1) {
    tutorial.wasteSeededForStep = -1;
    tutorial.wasteGenerationIndex = 0;
    tutorial.wasteRemovalStarted = false;
    tutorial.wasteVascularDisplayStarted = false;
    clearCorticalTutorialWaste();
  }

  applyCorticalTutorialDisplayForStep(tutorial.step);
  if (tutorial.step === 5) {
    initCorticalTutorialWasteClearance(tutorial.step);
  }
}

function applyCorticalTutorialDisplayForStep(step) {
  const displayMode =
    step === 2 ? "neurons" :
    step === 3 ? "glia" :
    step === 4 ? "vasculature" :
    step === 5 ? "neurons" :
    "all";

  if (typeof window.setCorticalDisplayMode === "function") {
    window.setCorticalDisplayMode(displayMode);
  } else {
    window.corticalDisplayMode = displayMode;
  }
}

function startCorticalGuidedTutorial() {
  const tutorial = window.corticalGuidedTutorial;
  tutorial.enabled = true;
  tutorial.running = true;
  tutorial.completionVisible = false;
  tutorial.pulse = 0;
  tutorial.wasteSeededForStep = -1;
  tutorial.wasteGenerationIndex = 0;
  tutorial.wasteRemovalStarted = false;
  tutorial.wasteVascularDisplayStarted = false;
  tutorial.prevDisplayMode = getCorticalDisplayMode();
  if (typeof window.setCorticalDisplayMode === "function") {
    window.setCorticalDisplayMode("all");
  } else {
    window.corticalDisplayMode = "all";
  }
  setCorticalTutorialStep(0);
  window.syncGuidedTutorialToggle?.();
}

function restoreCorticalTutorialDisplayMode() {
  const tutorial = window.corticalGuidedTutorial;
  const previousMode = tutorial.prevDisplayMode || "all";
  if (typeof window.setCorticalDisplayMode === "function") {
    window.setCorticalDisplayMode(previousMode);
  } else {
    window.corticalDisplayMode = previousMode;
  }
}

function stopCorticalGuidedTutorial() {
  const tutorial = window.corticalGuidedTutorial;
  const shouldRestoreDisplay = tutorial.enabled || tutorial.running || tutorial.completionVisible;
  tutorial.enabled = false;
  tutorial.running = false;
  tutorial.completionVisible = false;
  tutorial.title = "";
  tutorial.body = "";
  tutorial.wasteSeededForStep = -1;
  tutorial.wasteGenerationIndex = 0;
  tutorial.wasteRemovalStarted = false;
  tutorial.wasteVascularDisplayStarted = false;
  clearCorticalTutorialWaste();
  if (shouldRestoreDisplay) restoreCorticalTutorialDisplayMode();
  window.syncGuidedTutorialToggle?.();
}

function completeCorticalGuidedTutorial() {
  const tutorial = window.corticalGuidedTutorial;
  tutorial.enabled = false;
  tutorial.running = false;
  tutorial.completionVisible = false;
  tutorial.wasteSeededForStep = -1;
  tutorial.wasteGenerationIndex = 0;
  tutorial.wasteRemovalStarted = false;
  tutorial.wasteVascularDisplayStarted = false;
  tutorial.title = "";
  tutorial.body = "";
  clearCorticalTutorialWaste();
  restoreCorticalTutorialDisplayMode();
  window.syncGuidedTutorialToggle?.();
}

function dismissCorticalTutorialCompletionMessage() {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial?.completionVisible) return false;
  tutorial.completionVisible = false;
  tutorial.title = "";
  tutorial.body = "";
  return true;
}

function advanceCorticalTutorialStep() {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;
  if (tutorial.step >= CORTICAL_TUTORIAL_LAST_STEP) {
    completeCorticalGuidedTutorial();
    return;
  }
  const next = tutorial.step >= CORTICAL_TUTORIAL_LAST_STEP
    ? CORTICAL_TUTORIAL_LAST_STEP
    : tutorial.step + 1;
  setCorticalTutorialStep(next);
}

function retreatCorticalTutorialStep() {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;
  setCorticalTutorialStep(tutorial.step <= 0 ? 0 : tutorial.step - 1);
}

function updateCorticalGuidedTutorial() {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;
  tutorial.pulse += 0.12;
  const elapsed = getCorticalViewState().time - tutorial.stepStartTime;
  if (tutorial.step === 5) {
    updateCorticalTutorialWasteClearanceDemo(elapsed);
  }
  const stepDuration = tutorial.step === 5
    ? CORTICAL_TUTORIAL_WASTE_STEP_MS
    : CORTICAL_TUTORIAL_STEP_MS;
  if (elapsed > stepDuration) {
    if (tutorial.step >= CORTICAL_TUTORIAL_LAST_STEP) {
      completeCorticalGuidedTutorial();
    } else {
      advanceCorticalTutorialStep();
    }
  }
}

function clearCorticalTutorialWaste() {
  corticalMetabolicWasteParticles = corticalMetabolicWasteParticles.filter((waste) => !waste.tutorialWaste);
}

function initCorticalTutorialWasteClearance(stepId) {
  const tutorial = window.corticalGuidedTutorial;
  if (tutorial.wasteSeededForStep === stepId) return;
  tutorial.wasteSeededForStep = stepId;
  tutorial.wasteGenerationIndex = 0;
  tutorial.wasteRemovalStarted = false;
  tutorial.wasteVascularDisplayStarted = false;
  clearCorticalTutorialWaste();
}

function createCorticalTutorialWasteBundleForNode(node, index, now) {
  const bundleTypes = [
    { type: "waste", label: "", color: [184, 146, 102], offsetX: -2.2, offsetY: 1.4 },
    { type: "co2", label: "CO2", color: [200, 224, 244], offsetX: 2.4, offsetY: -1.8 },
    { type: "proton", label: "H+", color: [255, 224, 120], offsetX: 2.6, offsetY: 2.2 }
  ];
  const angle = (index * 2.399963229728653) % TWO_PI;
  const radius = (7 + (index % 5) * 2) * CORTICAL_METABOLIC_WASTE_SCALE;

  return bundleTypes.map((config, bundlePartIndex) => ({
    ...config,
    x: node.x + cos(angle) * radius + config.offsetX * CORTICAL_METABOLIC_WASTE_SCALE,
    y: node.y + sin(angle) * radius + config.offsetY * CORTICAL_METABOLIC_WASTE_SCALE,
    vx: random(-0.05, 0.05) * CORTICAL_METABOLIC_WASTE_SCALE,
    vy: random(-0.05, 0.05) * CORTICAL_METABOLIC_WASTE_SCALE,
    bornAt: now + index * 2 + bundlePartIndex * 4,
    state: "ecs",
    routeIndex: -1,
    routeProgress: 0,
    spin: angle + bundlePartIndex * 0.48,
    spinSpeed: 0.02 + ((index + bundlePartIndex) % 5) * 0.004,
    alpha: 222,
    tutorialWaste: true,
    tutorialNodeIndex: index,
    tutorialBundleId: `tutorial-waste-${index}`
  }));
}

function updateCorticalTutorialWasteClearanceDemo(elapsed) {
  const tutorial = window.corticalGuidedTutorial;
  const nodes = getCorticalNeuralSignalNodes();
  if (!nodes.length) return;

  const now = getCorticalViewState().time;
  const targetCount = constrain(
    floor(map(elapsed, 0, CORTICAL_TUTORIAL_WASTE_GENERATION_MS, 1, nodes.length + 1, true)),
    0,
    nodes.length
  );

  while (tutorial.wasteGenerationIndex < targetCount) {
    const index = tutorial.wasteGenerationIndex;
    const node = nodes[index];
    corticalMetabolicWasteParticles.push(...createCorticalTutorialWasteBundleForNode(node, index, now));
    tutorial.wasteGenerationIndex += 1;
  }

  if (!tutorial.wasteRemovalStarted && elapsed >= CORTICAL_TUTORIAL_WASTE_REMOVAL_DELAY_MS) {
    tutorial.wasteRemovalStarted = true;
    corticalMetabolicWasteParticles.forEach((waste, index) => {
      if (!waste.tutorialWaste) return;
      waste.state = "carried";
      waste.vx = (0.62 + (index % 4) * 0.09) * CORTICAL_TUTORIAL_WASTE_CARRIED_SPEED_SCALE;
      waste.vy = ((index % 7) - 3) * 0.02 * CORTICAL_TUTORIAL_WASTE_CARRIED_SPEED_SCALE;
      waste.clearanceSelected = true;
    });
  }

  if (
    tutorial.wasteRemovalStarted &&
    !tutorial.wasteVascularDisplayStarted &&
    elapsed >= CORTICAL_TUTORIAL_WASTE_VASCULAR_SWITCH_MS
  ) {
    tutorial.wasteVascularDisplayStarted = true;
    if (typeof window.setCorticalDisplayMode === "function") {
      window.setCorticalDisplayMode("vasculature");
    } else {
      window.corticalDisplayMode = "vasculature";
    }
  }

  if (corticalMetabolicWasteParticles.length > CORTICAL_METABOLIC_WASTE_MAX_ACTIVE) {
    corticalMetabolicWasteParticles.splice(
      0,
      corticalMetabolicWasteParticles.length - CORTICAL_METABOLIC_WASTE_MAX_ACTIVE
    );
  }

  updateCorticalMetabolicWaste();
}

function createCorticalRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function corticalRand(rng, minValue = 0, maxValue = 1) {
  return lerp(minValue, maxValue, rng());
}

function isCorticalInsomniaEnabled() {
  return window.corticalInsomniaEnabled === true;
}

function isCorticalEpilepsyEnabled() {
  return window.corticalEpilepsyEnabled === true;
}

function isCorticalStrokeEnabled() {
  return window.corticalStrokeEnabled === true;
}

function isCorticalAgingEnabled() {
  return window.corticalAgingEnabled === true;
}

function getCorticalAgingNeuronCount(baseCount) {
  return isCorticalAgingEnabled()
    ? max(1, round(baseCount / CORTICAL_AGING_NEURON_COUNT_DIVISOR))
    : baseCount;
}

function getCorticalAgingMicrogliaCount(baseCount) {
  return isCorticalAgingEnabled()
    ? max(1, round(baseCount * CORTICAL_AGING_MICROGLIA_MULTIPLIER))
    : baseCount;
}

function getCorticalAgingBbbGapMultiplier() {
  return isCorticalAgingEnabled() ? CORTICAL_AGING_BBB_GAP_MULTIPLIER : 1;
}

function getCorticalAgingApOccurrenceMultiplier() {
  return isCorticalAgingEnabled() ? CORTICAL_AGING_AP_OCCURRENCE_MULTIPLIER : 1;
}

function getCorticalAgingApActiveLimit() {
  return isCorticalAgingEnabled()
    ? max(1, round(16 * CORTICAL_AGING_AP_ACTIVE_MULTIPLIER))
    : 16;
}

function getCorticalStrokeState() {
  if (!window.corticalStrokeState) {
    window.corticalStrokeState = {
      enabledLastFrame: false,
      startTime: 0,
      lastTravelProgress: 0,
      fragments: [],
      recruitedMicroglia: []
    };
  }
  if (!window.corticalStrokeState.fragments) window.corticalStrokeState.fragments = [];
  if (!window.corticalStrokeState.recruitedMicroglia) window.corticalStrokeState.recruitedMicroglia = [];
  return window.corticalStrokeState;
}

function updateCorticalStrokeState(now) {
  const strokeState = getCorticalStrokeState();
  const wasEnabled = strokeState.enabledLastFrame;
  const wasLodged = (strokeState.lastTravelProgress || 0) >= 1;
  if (!isCorticalStrokeEnabled()) {
    if (wasEnabled && wasLodged) {
      spawnCorticalStrokeFragments(now);
    }
    strokeState.enabledLastFrame = false;
    strokeState.startTime = now;
    strokeState.lastTravelProgress = 0;
    strokeState.recruitedMicroglia = [];
    updateCorticalStrokeFragments(now);
    return;
  }
  if (!strokeState.enabledLastFrame) {
    strokeState.enabledLastFrame = true;
    strokeState.startTime = now;
    strokeState.fragments = [];
    strokeState.recruitedMicroglia = [];
  }
  strokeState.lastTravelProgress = getCorticalStrokeTravelProgress();
  if (isCorticalStrokeOcclusionLodged()) {
    updateCorticalStrokeRecruitedMicroglia(strokeState, now);
  } else {
    strokeState.recruitedMicroglia = [];
  }
  updateCorticalStrokeFragments(now);
}

function getCorticalStrokeTravelProgress() {
  if (!isCorticalStrokeEnabled()) return 0;
  const strokeState = getCorticalStrokeState();
  const now = getCorticalViewState().time;
  return constrain((now - strokeState.startTime) / CORTICAL_STROKE_OCCLUSION_TRAVEL_MS, 0, 1);
}

function isCorticalStrokeOcclusionLodged() {
  return isCorticalStrokeEnabled() && getCorticalStrokeTravelProgress() >= 1;
}

function getCorticalStrokeMicrogliaTargets() {
  const centerX = -36;
  const centerY = CORTICAL_STROKE_BED_CENTER_Y;
  return Array.from({ length: CORTICAL_STROKE_RECRUITED_MICROGLIA_COUNT }, (_, index) => {
    const angle = -PI + (TWO_PI * index) / CORTICAL_STROKE_RECRUITED_MICROGLIA_COUNT;
    const radiusX = 116 + (index % 3) * 18;
    const radiusY = 43 + (index % 4) * 7;
    return {
      x: centerX + cos(angle) * radiusX,
      y: centerY + sin(angle) * radiusY,
      angle
    };
  });
}

function seedCorticalStrokeRecruitedMicroglia(strokeState, now) {
  const targets = getCorticalStrokeMicrogliaTargets();
  strokeState.recruitedMicroglia = targets.map((target, index) => {
    const fromLeft = index % 2 === 0;
    const startX = fromLeft
      ? corticalRand(Math.random, CORTICAL_VIEW_BOUNDS.left - 34, CORTICAL_VIEW_BOUNDS.left + 58)
      : corticalRand(Math.random, CORTICAL_VIEW_BOUNDS.right - 64, CORTICAL_VIEW_BOUNDS.right + 26);
    const startY = corticalRand(
      Math.random,
      CORTICAL_LAYER_BANDS[1].top + 6,
      CORTICAL_LAYER_BANDS[4].bottom - 20
    );
    return {
      x: startX,
      y: startY,
      targetX: target.x,
      targetY: target.y,
      settled: false,
      recruitedStrokeMicroglia: true,
      scale: random(0.105, 0.132),
      rotation: target.angle + random(-0.5, 0.5),
      phase: random(TWO_PI),
      speed: random(0.018, 0.032),
      bornAt: now,
      settleWanderPhase: random(TWO_PI)
    };
  });
}

function updateCorticalStrokeRecruitedMicroglia(strokeState, now) {
  if (!strokeState.recruitedMicroglia?.length) {
    seedCorticalStrokeRecruitedMicroglia(strokeState, now);
  }
  const dtScale = (getCorticalViewState().dt || 16.67) / 16.67;
  strokeState.recruitedMicroglia.forEach((cell, index) => {
    const dx = cell.targetX - cell.x;
    const dy = cell.targetY - cell.y;
    const distanceToTarget = sqrt(dx * dx + dy * dy);
    if (distanceToTarget > CORTICAL_STROKE_MICROGLIA_ARRIVAL_RADIUS) {
      const easing = min(distanceToTarget, cell.speed * 38 * dtScale) / max(0.0001, distanceToTarget);
      cell.x += dx * easing;
      cell.y += dy * easing;
      cell.rotation = lerp(cell.rotation || 0, atan2(dy, dx), 0.035 * dtScale);
      cell.settled = false;
      return;
    }

    cell.settled = true;
    const wander = now * 0.001 + cell.settleWanderPhase + index * 0.3;
    cell.x = lerp(cell.x, cell.targetX + cos(wander) * 2.6, 0.035 * dtScale);
    cell.y = lerp(cell.y, cell.targetY + sin(wander * 0.8) * 1.8, 0.035 * dtScale);
    cell.rotation = lerp(cell.rotation || 0, cell.rotation + sin(wander) * 0.015, 0.08 * dtScale);
  });
}

function spawnCorticalStrokeFragments(now) {
  const strokeState = getCorticalStrokeState();
  const outflowPath = getCorticalStrokeFragmentOutflowPath(true);
  if (!outflowPath.length) return;
  const targetPoint = samplePathAtFraction(outflowPath, 0);

  strokeState.fragments = Array.from({ length: CORTICAL_STROKE_FRAGMENT_COUNT }, (_, index) => ({
    routePath: outflowPath,
    progress: constrain(random(-0.015, 0.035), 0, 1),
    speed: random(0.0011, 0.0022),
    lane: random(-1, 1),
    spin: random(TWO_PI),
    spinRate: random(-0.03, 0.03),
    radius: random(2.2, 4.4),
    alpha: 245,
    bornAt: now,
    x: targetPoint.x + random(-4, 4),
    y: targetPoint.y + random(-4, 4),
    color: random() < 0.45 ? [255, 205, 72] : [178, 42, 38]
  }));
}

function updateCorticalStrokeFragments(now) {
  const strokeState = getCorticalStrokeState();
  if (!strokeState.fragments?.length) return;
  const dtScale = (getCorticalViewState().dt || 16.67) / 16.67;
  strokeState.fragments = strokeState.fragments.filter((fragment) => {
    const age = now - fragment.bornAt;
    if (age > CORTICAL_STROKE_FRAGMENT_LIFE_MS || fragment.alpha <= 0) return false;
    fragment.progress = min(1.1, fragment.progress + fragment.speed * dtScale);
    fragment.spin += fragment.spinRate * dtScale;
    fragment.alpha = 245 * constrain(1 - age / CORTICAL_STROKE_FRAGMENT_LIFE_MS, 0, 1);

    if (fragment.progress <= 1 && fragment.routePath?.length > 1) {
      const center = samplePathAtFraction(fragment.routePath, fragment.progress);
      const ahead = samplePathAtFraction(fragment.routePath, min(1, fragment.progress + 0.018));
      const behind = samplePathAtFraction(fragment.routePath, max(0, fragment.progress - 0.018));
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const len = max(0.0001, sqrt(dx * dx + dy * dy));
      const nx = -dy / len;
      const ny = dx / len;
      fragment.x = center.x + nx * fragment.lane * 4.2;
      fragment.y = center.y + ny * fragment.lane * 4.2;
    } else {
      fragment.x += random(0.2, 0.65) * dtScale;
      fragment.y += random(-0.18, 0.18) * dtScale;
    }
    return true;
  });
}

function getCorticalWasteBurdenFraction() {
  const unclearedWasteCount = corticalMetabolicWasteParticles.filter((waste) => waste.state !== "vascular").length;
  return constrain(unclearedWasteCount / 360, 0, 1);
}

function getCorticalInsomniaApMultiplier() {
  if (!isCorticalInsomniaEnabled()) return 1;
  const burden = getCorticalWasteBurdenFraction();
  return lerp(CORTICAL_INSOMNIA_AP_MAX_MULTIPLIER, CORTICAL_INSOMNIA_AP_MIN_MULTIPLIER, burden);
}

function getCorticalInsomniaGenerationIntervalMultiplier() {
  if (!isCorticalInsomniaEnabled()) return 1;
  const burden = getCorticalWasteBurdenFraction();
  return lerp(1.2, 3.6, burden);
}

function getCorticalInsomniaMicrogliaTargetCount() {
  if (!isCorticalInsomniaEnabled()) return 0;
  const burden = getCorticalWasteBurdenFraction();
  if (burden < 0.04) return 0;
  return constrain(
    floor(pow(burden, 0.82) * CORTICAL_INSOMNIA_MICROGLIA_MAX_ADDITIONAL),
    0,
    CORTICAL_INSOMNIA_MICROGLIA_MAX_ADDITIONAL
  );
}

function getCorticalApSpeedScale() {
  return CORTICAL_AP_SPEED_SCALE * getCorticalInsomniaApMultiplier();
}

function getCorticalApGenerationIntervalMultiplier() {
  return getCorticalInsomniaGenerationIntervalMultiplier() / getCorticalAgingApOccurrenceMultiplier();
}

function getCorticalWasteClearanceWaveMs() {
  return isCorticalInsomniaEnabled()
    ? CORTICAL_INSOMNIA_WASTE_CLEARANCE_WAVE_MS
    : CORTICAL_WASTE_CLEARANCE_WAVE_MS;
}

function getCorticalMoleculeGenerationMultiplier() {
  let multiplier = isCorticalInsomniaEnabled() ? CORTICAL_INSOMNIA_MOLECULE_MULTIPLIER : 1;
  if (isCorticalAgingEnabled()) {
    multiplier *= CORTICAL_AGING_MOLECULE_GENERATION_MULTIPLIER;
  }
  if (isCorticalEpilepsyWaveTraveling()) {
    multiplier *= CORTICAL_EPILEPSY_MOLECULE_MULTIPLIER;
  }
  return multiplier;
}

function getCorticalFlowSpeedMultiplier() {
  return isCorticalEpilepsyWaveTraveling() ? CORTICAL_EPILEPSY_FLOW_SPEED_MULTIPLIER : 1;
}

function isCorticalEpilepsyWaveTraveling() {
  const activationState = window.corticalNeuronActivationState;
  if (!activationState?.epilepsyWaves?.length) return false;
  const now = getCorticalViewState().time;
  return activationState.epilepsyWaves.some((wave) => getCorticalEpilepsyWaveRadius(wave, now) <= wave.maxRadius);
}

function isCorticalStrokeRoute(route) {
  return isCorticalStrokeOcclusionLodged() && abs((route?.bedCenterY || 0) - CORTICAL_STROKE_BED_CENTER_Y) <= 1;
}

function getCorticalStrokeRouteSamples() {
  if (!isCorticalStrokeOcclusionLodged()) return [];
  const vascularData = ensureCorticalMicrovascularFlowData();
  return (vascularData.routes || [])
    .filter((route) => isCorticalStrokeRoute(route))
    .flatMap((route) => route.flowSamples?.length ? route.flowSamples : buildCorticalFlowRouteSamples(route, 6));
}

function getCorticalStrokeDistanceSq(point) {
  if (!point || !isCorticalStrokeEnabled()) return Infinity;
  const samples = getCorticalStrokeRouteSamples();
  let bestDistanceSq = Infinity;
  for (let i = 0; i < samples.length; i += 2) {
    const sample = samples[i];
    const dx = point.x - sample.x;
    const dy = point.y - sample.y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < bestDistanceSq) bestDistanceSq = distanceSq;
  }
  return bestDistanceSq;
}

function isCorticalPointStrokeSuppressed(point) {
  return getCorticalStrokeDistanceSq(point) <= CORTICAL_STROKE_AP_SUPPRESSION_RADIUS * CORTICAL_STROKE_AP_SUPPRESSION_RADIUS;
}

function isCorticalStrokeWasteClearanceBlocked(point) {
  if (!point || !isCorticalStrokeOcclusionLodged()) return false;
  return abs(point.y - CORTICAL_STROKE_BED_CENTER_Y) <= CORTICAL_STROKE_WASTE_BLOCK_HALF_HEIGHT;
}

function getCorticalStrokeOcclusionPoint() {
  if (!isCorticalStrokeEnabled()) return null;
  const travelPath = getCorticalStrokeOcclusionTravelPath();
  if (!travelPath.length) return null;
  const point = samplePathAtFraction(travelPath, getCorticalStrokeTravelProgress());
  const lodgedNudge = getCorticalStrokeTravelProgress() >= 1 ? -8 : 0;
  return {
    x: point.x + lodgedNudge,
    y: point.y
  };
}

function getCorticalStrokeOcclusionTargetPoint() {
  if (!isCorticalStrokeEnabled()) return null;
  const travelPath = getCorticalStrokeOcclusionTravelPath();
  if (!travelPath.length) return null;
  return travelPath[travelPath.length - 1];
}

function getCorticalStrokeOcclusionTravelPath(allowDisabled = false) {
  if (!allowDisabled && !isCorticalStrokeEnabled()) return [];
  const routeInfo = getCorticalStrokeOcclusionRouteInfo(allowDisabled);
  if (!routeInfo) return [];
  return routeInfo.samples.slice(0, routeInfo.index + 1);
}

function getCorticalStrokeFragmentOutflowPath(allowDisabled = false) {
  if (!allowDisabled && !isCorticalStrokeEnabled()) return [];
  const routeInfo = getCorticalStrokeOcclusionRouteInfo(allowDisabled);
  if (!routeInfo) return [];
  return routeInfo.samples.slice(routeInfo.index);
}

function getCorticalStrokeOcclusionRouteInfo(allowDisabled = false) {
  if (!allowDisabled && !isCorticalStrokeEnabled()) return null;
  const vascularData = ensureCorticalMicrovascularFlowData();
  let bestRoute = null;
  let bestIndex = -1;
  let bestScore = Infinity;
  (vascularData.routes || []).forEach((route) => {
    if (abs((route?.bedCenterY || 0) - CORTICAL_STROKE_BED_CENTER_Y) > 1) return;
    const samples = route.flowSamples?.length ? route.flowSamples : buildCorticalFlowRouteSamples(route, 6);
    const bedTopY = CORTICAL_STROKE_BED_CENTER_Y - (route.bedBand || 34);
    samples.forEach((point, index) => {
      if (point.y < bedTopY - 12 || point.y > bedTopY + 10) return;
      const score =
        index * 1.35 +
        abs(point.y - bedTopY) * 8 +
        max(0, point.x + 24) * 0.08;
      if (score >= bestScore) return;
      bestScore = score;
      bestRoute = samples;
      bestIndex = index;
    });
  });
  if (!bestRoute || bestIndex < 1) return null;
  return {
    samples: bestRoute,
    index: bestIndex
  };
}

function getCorticalFlowReleaseBatch() {
  return max(1, round(CORTICAL_FLOW_RELEASE_BATCH * getCorticalMoleculeGenerationMultiplier()));
}

function getCorticalFlowMaxActive() {
  return max(1, round(CORTICAL_FLOW_MAX_ACTIVE * getCorticalMoleculeGenerationMultiplier()));
}

function getCorticalFlowTargetPerRoute() {
  return max(1, round(CORTICAL_FLOW_TARGET_PER_ROUTE * getCorticalMoleculeGenerationMultiplier()));
}

let corticalColumnPlaceholderImage = null;

function ensureCorticalColumnPlaceholderImage() {
  if (corticalColumnPlaceholderImage) return corticalColumnPlaceholderImage;

  const g = createGraphics(420, 260);
  g.clear();
  g.noStroke();

  for (let y = 0; y < g.height; y++) {
    const t = y / max(1, g.height - 1);
    const r = lerp(26, 14, t);
    const gg = lerp(36, 18, t);
    const b = lerp(54, 24, t);
    g.fill(r, gg, b, 255);
    g.rect(0, y, g.width, 1);
  }

  g.push();
  g.translate(g.width * 0.5, g.height * 0.54);
  g.rectMode(CENTER);

  g.noStroke();
  g.fill(24, 28, 38, 220);
  g.rect(0, 0, 352, 184, 28);

  g.fill(255, 194, 74, 240);
  g.rect(0, 70, 292, 24, 10);
  g.fill(34, 38, 48, 255);
  for (let i = -118; i <= 118; i += 34) {
    g.quad(i - 10, 58, i + 4, 58, i + 18, 82, i + 4, 82);
  }

  g.fill(242, 174, 86, 245);
  g.triangle(-108, 62, -76, -48, -44, 62);
  g.triangle(108, 62, 76, -48, 44, 62);

  g.fill(250, 224, 146, 255);
  g.ellipse(-76, -6, 18, 18);
  g.ellipse(76, -6, 18, 18);

  g.fill(236, 242, 248, 245);
  g.textAlign(CENTER, CENTER);
  g.textStyle(BOLD);
  g.textSize(26);
  g.text("UNDER", 0, -80);
  g.text("CONSTRUCTION", 0, -46);

  g.textSize(13);
  g.textStyle(NORMAL);
  g.fill(182, 198, 214, 240);
  g.text("Cortical column scene in progress", 0, 104);

  g.pop();

  corticalColumnPlaceholderImage = g;
  return corticalColumnPlaceholderImage;
}

function updateCorticalView() {
  const corticalState = getCorticalViewState();
  corticalState.time += corticalState.dt;
  corticalState.zoom = constrain(corticalState.zoom, 1, 3.5);
  if (!corticalState.offsetInitialized) {
    resetCorticalViewTransform();
  }
  updateCorticalAgingSensitiveCaches();
  updateCorticalStrokeState(corticalState.time);
  updateCorticalMoleculeFlow();
  updateCorticalNeuronActivation();
  updateCorticalGuidedTutorial();
}

function updateCorticalAgingSensitiveCaches() {
  const agingEnabled = isCorticalAgingEnabled();
  if (corticalAgingCacheState === agingEnabled) return;
  corticalAgingCacheState = agingEnabled;

  corticalNeuronLayout = null;
  corticalAstrocyteLayout = null;
  corticalMicrogliaLayout = null;
  corticalInsomniaMicrogliaLayout = null;
  corticalCrNeuronLayout = null;
  corticalSgNeuronLayout = null;
  corticalFusiformNeuronLayout = null;
  corticalInhibitoryNeuronLayout = null;
  corticalInhibitoryType2NeuronLayout = null;
  corticalSignalNodeLayout = null;
  corticalInhibitorySignalCellLayout = null;
  corticalActivationRouteBank = null;
  corticalActivationRouteCatalog = null;
  corticalMicrovascularFlowData = null;
  corticalStaticSceneCache = null;
  corticalMetabolicWasteParticles = [];
  if (window.corticalMoleculeFlowState) {
    window.corticalMoleculeFlowState.particles = [];
    window.corticalMoleculeFlowState.escapeParticles = [];
    window.corticalMoleculeFlowState.routeCount = 0;
    window.corticalMoleculeFlowState.spawnCounter = 0;
  }
}

function zoomCorticalCanvasAtScreenPoint(screenX, screenY, zoomFactor) {
  const corticalState = getCorticalViewState();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  const currentScale = baseScale * corticalState.zoom;
  const before = {
    x: (screenX - viewport.centerX - corticalState.offset.x) / currentScale,
    y: (screenY - viewport.centerY - corticalState.offset.y) / currentScale
  };
  const nextZoom = constrain(corticalState.zoom * zoomFactor, 1, 3.5);
  const nextScale = baseScale * nextZoom;
  const nextOffset = {
    x: screenX - viewport.centerX - before.x * nextScale,
    y: screenY - viewport.centerY - before.y * nextScale
  };

  if (nextZoom <= 1.0001) {
    resetCorticalViewTransform();
    return;
  }

  corticalState.zoom = nextZoom;
  corticalState.offset = constrainCorticalOffset(
    nextOffset,
    nextScale,
    viewport.viewportWidth,
    viewport.viewportHeight
  );
}

function corticalScreenToWorld(screenX, screenY) {
  const corticalState = getCorticalViewState();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  const fitScale = baseScale * corticalState.zoom;
  if (fitScale <= 0) return null;
  return {
    x: (screenX - viewport.centerX - corticalState.offset.x) / fitScale,
    y: (screenY - viewport.centerY - corticalState.offset.y) / fitScale
  };
}

function corticalWorldToScreen(point) {
  if (!point) return null;
  const corticalState = getCorticalViewState();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  const fitScale = baseScale * corticalState.zoom;
  return {
    x: viewport.centerX + corticalState.offset.x + point.x * fitScale,
    y: viewport.centerY + corticalState.offset.y + point.y * fitScale
  };
}

function drawCorticalView() {
  const corticalState = getCorticalViewState();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  const fitScale = baseScale * corticalState.zoom;
  const displayMode = getCorticalDisplayMode();
  const showNeurons = displayMode === "all" || displayMode === "neurons";
  const showGlia = displayMode === "all" || displayMode === "glia";
  const showVasculature = displayMode === "all" || displayMode === "vasculature";

  push();
  resetMatrix();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(viewport.x, viewport.y, viewport.viewportWidth, viewport.viewportHeight);
  drawingContext.clip();

  const staticCache = ensureCorticalStaticSceneCache({
    viewport,
    baseScale,
    fitScale,
    offset: corticalState.offset,
    displayMode,
    showNeurons,
    showGlia,
    showVasculature
  });
  if (staticCache?.image) {
    imageMode(CORNER);
    image(staticCache.image, viewport.x, viewport.y, viewport.viewportWidth, viewport.viewportHeight);
  }

  translate(viewport.centerX + corticalState.offset.x, viewport.centerY + corticalState.offset.y);
  scale(fitScale);
  drawCorticalAnimatedSceneContent(showNeurons, showGlia, showVasculature);
  drawingContext.restore();

  drawCorticalViewportBorder(viewport);
  drawCorticalLayerBandLabels(viewport, fitScale, corticalState.offset);
  drawCorticalGuidedTutorialOverlay(viewport, fitScale, corticalState.offset);
  pop();
}

function ensureCorticalStaticSceneCache(options) {
  const { viewport, baseScale, fitScale, offset, displayMode, showNeurons, showGlia, showVasculature } = options;
  const cacheKey = [
    CORTICAL_MICROVASCULAR_DATA_VERSION,
    isCorticalAgingEnabled() ? "aging" : "baseline",
    displayMode,
    round(viewport.x),
    round(viewport.y),
    round(viewport.viewportWidth),
    round(viewport.viewportHeight),
    round((offset?.x || 0) * 10),
    round((offset?.y || 0) * 10),
    round(fitScale * 1000)
  ].join(":");

  if (corticalStaticSceneCache?.key === cacheKey && corticalStaticSceneCache.image) {
    return corticalStaticSceneCache;
  }

  push();
  translate(viewport.centerX + offset.x, viewport.centerY + offset.y);
  scale(fitScale);
  drawCorticalStaticSceneContent(showNeurons, showGlia, showVasculature, baseScale);
  pop();

  corticalStaticSceneCache = {
    key: cacheKey,
    image: get(
      floor(viewport.x),
      floor(viewport.y),
      ceil(viewport.viewportWidth),
      ceil(viewport.viewportHeight)
    )
  };

  return corticalStaticSceneCache;
}

function drawCorticalStaticSceneContent(showNeurons, showGlia, showVasculature, baseScale) {
  drawCorticalColumnBackdrop();
  drawCorticalLayerBandBackgrounds();
  drawCorticalPiaMaterLayer();
  if (showNeurons) {
    beginCorticalPiaTissueClip();
    drawCorticalCajalRetziusCells();
    drawCorticalFusiformNeurons();
    drawCorticalInhibitoryNeurons();
    drawCorticalInhibitoryType2Neurons();
    drawCorticalStellateGranularNeurons();
    drawCorticalNeuronClusters("behind", false, false);
    endCorticalPiaTissueClip();
  }
  if (showGlia) {
    drawCorticalAstrocyteField(false);
  }
  if (showVasculature) {
    drawCorticalMicrovascularNetworkStatic(baseScale);
  }
  if (showNeurons) {
    beginCorticalPiaTissueClip();
    drawCorticalNeuronClusters("front", false, false);
    endCorticalPiaTissueClip();
  }
}

function drawCorticalAnimatedSceneContent(showNeurons, showGlia, showVasculature) {
  const activationSnapshot = showNeurons || showGlia ? getCorticalNeuronActivationSnapshot() : null;
  const showTutorialWaste = shouldDrawCorticalTutorialWaste();
  if (showNeurons || showTutorialWaste) {
    updateCorticalMetabolicWaste();
    drawCorticalMetabolicWaste();
  }
  if (showNeurons) {
    drawCorticalActivationRouteDebugOverlay();
    drawCorticalNeuronActivationEffect(activationSnapshot);
  }
  if (showGlia) {
    drawCorticalAstrocyteActivationGlow(activationSnapshot);
    drawCorticalSurveillantMicroglia();
  }
  if (showVasculature) {
    drawCorticalMoleculeFlow();
    drawCorticalStrokeOcclusionOverlay();
  }
}

function getCorticalDisplayMode() {
  const mode = window.corticalDisplayMode || "all";
  return ["all", "neurons", "glia", "vasculature"].includes(mode) ? mode : "all";
}

function shouldDrawCorticalTutorialWaste() {
  const tutorial = window.corticalGuidedTutorial;
  return !!(tutorial?.running && tutorial.step === 5 && corticalMetabolicWasteParticles.some((waste) => waste.tutorialWaste));
}

function shouldHighlightCorticalTutorialWasteBundles() {
  const tutorial = window.corticalGuidedTutorial;
  return !!(tutorial?.running && tutorial.step === 5);
}

function getCorticalBbbUnitOptions(overrides = {}) {
  const compactScaleX = getCorticalResponsiveScreenValue(0.72, 0.86, 1);
  const compactScaleY = getCorticalResponsiveScreenValue(0.48, 0.72, 1);
  return {
    scaleFactor: 1 / 2.5,
    rotation: 0,
    astrocyteSide: 1,
    ...overrides,
    scaleX: (overrides.scaleX ?? 1) * compactScaleX,
    scaleY: (overrides.scaleY ?? 1) * compactScaleY
  };
}

function getCorticalBbbUnitMetrics() {
  const inwardOffset = -18;
  const wallPath = [
    { x: -32, y: -93 },
    { x: -34, y: -38 },
    { x: -32, y: 21 },
    { x: -34, y: 93 }
  ];

  function sampleLocalFrame(t) {
    const segCount = wallPath.length - 1;
    const u = constrain(t, 0, 1) * segCount;
    const index = min(segCount - 1, floor(u));
    const localT = constrain(u - index, 0, 1);
    const a = wallPath[index];
    const b = wallPath[index + 1];
    const px = lerp(a.x, b.x, localT);
    const py = lerp(a.y, b.y, localT);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = max(0.0001, sqrt(dx * dx + dy * dy));
    return {
      x: px,
      y: py,
      tx: dx / len,
      ty: dy / len,
      nx: -dy / len,
      ny: dx / len,
      angle: atan2(dy, dx)
    };
  }

  const referenceFrame = sampleLocalFrame(0.48);
  return {
    inwardOffset,
    wallPath,
    endothelialAnchorX: referenceFrame.x + referenceFrame.nx * inwardOffset,
    endothelialAnchorY: referenceFrame.y + referenceFrame.ny * inwardOffset,
    endothelialAnchorAngle: referenceFrame.angle,
    anchorNormalX: referenceFrame.nx,
    anchorNormalY: referenceFrame.ny
  };
}

function drawAnchoredCorticalBbbUnit(anchorX, anchorY, tangentAngle, options = {}) {
  const { endothelialAnchorX, endothelialAnchorY, endothelialAnchorAngle } = getCorticalBbbUnitMetrics();
  const scaleFactor = options.scaleFactor ?? 1;
  const rotation = tangentAngle - endothelialAnchorAngle + (options.rotationOffset || 0);
  const scaledAnchorX = endothelialAnchorX * scaleFactor;
  const scaledAnchorY = endothelialAnchorY * scaleFactor;
  const cosR = cos(rotation);
  const sinR = sin(rotation);
  const rotatedAnchorX = scaledAnchorX * cosR - scaledAnchorY * sinR;
  const rotatedAnchorY = scaledAnchorX * sinR + scaledAnchorY * cosR;

  drawCorticalBbbUnit(
    anchorX - rotatedAnchorX,
    anchorY - rotatedAnchorY,
    {
      ...options,
      scaleFactor,
      rotation
    }
  );
}

function getCorticalResponsiveScreenScale(mobileScale = 1, tabletScale = 1) {
  return getCorticalResponsiveScreenValue(mobileScale, tabletScale, 1);
}

function getCorticalResponsiveScreenValue(mobileValue = 1, tabletValue = 1, desktopValue = 1) {
  const smallestViewportEdge = min(width || 0, height || 0);
  const largestViewportEdge = max(width || 0, height || 0);
  if (smallestViewportEdge <= 520) return mobileValue;
  if (smallestViewportEdge <= 900 && largestViewportEdge <= 1180) return tabletValue;
  return desktopValue;
}

function getCorticalViewportMetrics() {
  const margin = min(CORTICAL_VIEWPORT_MARGIN, max(14, min(width, height) * 0.03));
  const labelScale = getCorticalResponsiveScreenScale(0.72, 0.84);
  const labelGutter = constrain(
    width * 0.12,
    CORTICAL_LABEL_GUTTER_MIN * labelScale,
    CORTICAL_LABEL_GUTTER_MAX * labelScale
  );
  const viewportX = margin + labelGutter;
  const viewportY = margin;
  const viewportWidth = max(220, width - viewportX - margin);
  const viewportHeight = max(220, height - margin * 2);

  return {
    x: viewportX,
    y: viewportY,
    viewportWidth,
    viewportHeight,
    centerX: viewportX + viewportWidth * 0.5,
    centerY: viewportY + viewportHeight * 0.5,
    labelX: max(margin + labelGutter - 18 * labelScale, 86 * labelScale),
    labelScale
  };
}

function drawCorticalViewportBorder(viewport) {
  push();
  resetMatrix();
  rectMode(CORNER);
  noFill();
  stroke(155, 175, 210, 185);
  strokeWeight(2);
  rect(viewport.x, viewport.y, viewport.viewportWidth, viewport.viewportHeight, 14);
  pop();
}

function drawCorticalBbbStandaloneInset(viewport) {
  const panelW = constrain(viewport.viewportWidth * 0.22, 220, 280);
  const panelH = constrain(viewport.viewportHeight * 0.42, 240, 320);
  const panelX = viewport.x + viewport.viewportWidth - panelW - 18;
  const panelY = viewport.y + 18;
  push();
  resetMatrix();
  rectMode(CORNER);
  noStroke();
  fill(14, 18, 24, 218);
  rect(panelX, panelY, panelW, panelH, 18);
  fill(255, 214, 120, 228);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(14);
  text("ARTERY BBB CHECK", panelX + 16, panelY + 14);
  fill(184, 196, 212, 220);
  textStyle(NORMAL);
  textSize(11);
  text("Standalone static artery-side structure", panelX + 16, panelY + 34);

  drawCorticalBbbUnit(
    panelX + panelW * 0.32 + 34,
    panelY + panelH * 0.54,
    getCorticalBbbUnitOptions()
  );

  pop();
}

function drawCorticalBbbUnit(x, y, options = {}) {
  const scaleFactor = options.scaleFactor ?? 1;
  const rotation = options.rotation ?? 0;
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  const endothelialAngleDelta = options.endothelialAngleDelta ?? 0;
  const astrocyteSide = options.astrocyteSide ?? 1;
  const omitTopEndothelial = options.omitTopEndothelial ?? false;
  const omitTopPericyte = options.omitTopPericyte ?? false;
  const { inwardOffset, wallPath } = getCorticalBbbUnitMetrics();
  const somaOffset = 74;
  const pericyteOffset = -6;
  const endfootOffset = 4;
  const mirroredGap = 2;
  const mirroredPericyteSpread = [5, 0.5, 0.5, 3.5];
  const mirroredPericyteTangentShift = [-18, -1, 0.5, 8];
  const mirroredEndfootGap = 5;
  const endotheliumColor = typeof getColor === "function" ? getColor("endothelium", 235) : color(245, 190, 130, 235);
  const pericyteColor = typeof getColor === "function" ? getColor("pericyte", 230) : color(220, 180, 140, 230);
  const astrocyteColor = typeof getColor === "function" ? getColor("astrocyte", 238) : color(200, 170, 230, 238);
  const transporterColor = typeof getColor === "function" ? getColor("glucose", 245) : color(120, 220, 120, 245);
  const aqpColor = typeof getColor === "function" ? getColor("water", 245) : color(160, 210, 255, 245);
  function sampleLocalFrame(t) {
    const segCount = wallPath.length - 1;
    const u = constrain(t, 0, 1) * segCount;
    const index = min(segCount - 1, floor(u));
    const localT = constrain(u - index, 0, 1);
    const a = wallPath[index];
    const b = wallPath[index + 1];
    const px = lerp(a.x, b.x, localT);
    const py = lerp(a.y, b.y, localT);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = max(0.0001, sqrt(dx * dx + dy * dy));
    return {
      x: px,
      y: py,
      tx: dx / len,
      ty: dy / len,
      nx: -dy / len,
      ny: dx / len,
      angle: atan2(dy, dx)
    };
  }

  function sideOffset(baseOffset) {
    if (astrocyteSide >= 0) return baseOffset;
    return inwardOffset * 2 - baseOffset - mirroredGap;
  }

  function mirroredPericyteOffset(index) {
    let offset = sideOffset(pericyteOffset);
    if (astrocyteSide < 0) offset -= mirroredPericyteSpread[index] || 0;
    return offset;
  }

  function mirroredEndfootOffset() {
    let offset = sideOffset(endfootOffset);
    if (astrocyteSide < 0) offset -= mirroredEndfootGap;
    return offset;
  }

  push();
  translate(x, y);
  rotate(rotation);
  scale(scaleFactor * scaleX, scaleFactor * scaleY);

  const somaFrame = sampleLocalFrame(0.48);
  const somaOffsetValue = sideOffset(somaOffset);
  const somaX = somaFrame.x + somaFrame.nx * somaOffsetValue;
  const somaY = somaFrame.y + somaFrame.ny * somaOffsetValue + 4;

  const endothelialTs = omitTopEndothelial
    ? [0.08, 0.28, 0.48, 0.68, 0.84, 0.97]
    : [0.03, 0.08, 0.28, 0.48, 0.68, 0.84, 0.97];
  endothelialTs.forEach((t) => {
    const frame = sampleLocalFrame(t);
    const cx = frame.x + frame.nx * inwardOffset;
    const cy = frame.y + frame.ny * inwardOffset;
    const endothelialAngle = frame.angle + endothelialAngleDelta;
    const endothelialTx = cos(endothelialAngle);
    const endothelialTy = sin(endothelialAngle);
    push();
    stroke(endotheliumColor);
    strokeWeight(4.2);
    strokeCap(ROUND);
    line(
      cx - endothelialTx * 13.5,
      cy - endothelialTy * 13.5,
      cx + endothelialTx * 13.5,
      cy + endothelialTy * 13.5
    );
    pop();

    push();
    noStroke();
    fill(transporterColor);
    translate(cx, cy);
    rotate(endothelialAngle);
    rectMode(CENTER);
    rect(0, 0, 10, 5, 2);
    pop();
  });

  const pericyteTs = omitTopPericyte
    ? [0.29, 0.61, 0.81]
    : [0.09, 0.29, 0.61, 0.81];
  pericyteTs.forEach((t, index) => {
    const frame = sampleLocalFrame(t);
    const pericyteOffsetValue = mirroredPericyteOffset(index);
    const tangentShift = astrocyteSide < 0 ? (mirroredPericyteTangentShift[index] || 0) : 0;
    push();
    noStroke();
    fill(pericyteColor);
    translate(
      frame.x + frame.nx * pericyteOffsetValue + frame.tx * tangentShift,
      frame.y + frame.ny * pericyteOffsetValue + frame.ty * tangentShift
    );
    rotate(frame.angle);
    if (astrocyteSide < 0) rotate(PI);
    ellipse(0, 0, 50, 14);
    pop();
  });

  push();
  noStroke();
  fill(astrocyteColor);
  ellipse(somaX, somaY, 28, 28);
  pop();

  [0.19, 0.45, 0.71].forEach((t) => {
    const frame = sampleLocalFrame(t);
    const endfootOffsetValue = mirroredEndfootOffset();
    const footX = frame.x + frame.nx * endfootOffsetValue;
    const footY = frame.y + frame.ny * endfootOffsetValue;

    push();
    stroke(astrocyteColor);
    strokeWeight(4);
    line(somaX, somaY, footX, footY);
    pop();

    push();
    noStroke();
    fill(astrocyteColor);
    translate(footX, footY);
    rotate(frame.angle);
    scale(astrocyteSide, 1);
    ellipse(0, 0, 46, 11);
    fill(aqpColor);
    circle(-6, 0, 4);
    circle(0, 0, 4);
    circle(6, 0, 4);
    pop();
  });

  pop();
}

function getCorticalBaseScale(viewportWidth, viewportHeight) {
  const vascularWidth = CORTICAL_VIEW_BOUNDS.right - CORTICAL_VIEW_BOUNDS.left;
  const vascularHeight = CORTICAL_VIEW_BOUNDS.bottom - CORTICAL_VIEW_BOUNDS.top;
  return min(viewportWidth / vascularWidth, viewportHeight / vascularHeight) * CORTICAL_COLUMN_SCALE;
}

function getCorticalBbbResponsiveScaleFactor(baseScale = 1) {
  const baseUnitScale = (1 / 7.5) / max(baseScale, 0.0001);
  return baseUnitScale * getCorticalResponsiveScreenScale(0.24, 0.62);
}

function constrainCorticalOffset(offset, sceneScale, viewportWidth, viewportHeight) {
  const halfW = viewportWidth * 0.5;
  const halfH = viewportHeight * 0.5;
  const contentWidth = (CORTICAL_VIEW_BOUNDS.right - CORTICAL_VIEW_BOUNDS.left) * sceneScale;
  const contentHeight = (CORTICAL_VIEW_BOUNDS.bottom - CORTICAL_VIEW_BOUNDS.top) * sceneScale;

  const minOffsetX = halfW - CORTICAL_VIEW_BOUNDS.right * sceneScale;
  const maxOffsetX = -halfW - CORTICAL_VIEW_BOUNDS.left * sceneScale;
  const minOffsetY = halfH - CORTICAL_VIEW_BOUNDS.bottom * sceneScale;
  const maxOffsetY = -halfH - CORTICAL_VIEW_BOUNDS.top * sceneScale;

  return {
    x: contentWidth <= viewportWidth
      ? offset.x
      : constrain(offset.x, min(minOffsetX, maxOffsetX), max(minOffsetX, maxOffsetX)),
    y: contentHeight <= viewportHeight
      ? offset.y
      : constrain(offset.y, min(minOffsetY, maxOffsetY), max(minOffsetY, maxOffsetY))
  };
}

function drawCorticalColumnBackdrop() {
  push();
  rectMode(CENTER);
  noStroke();

  const ctx = drawingContext;
  const gradient = ctx.createLinearGradient(
    0,
    -CORTICAL_COLUMN_FRAME.height * 0.5,
    0,
    CORTICAL_COLUMN_FRAME.height * 0.5
  );
  gradient.addColorStop(0, "rgb(19, 27, 39)");
  gradient.addColorStop(0.54, "rgb(13, 20, 31)");
  gradient.addColorStop(1, "rgb(10, 16, 25)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(
    -CORTICAL_COLUMN_FRAME.width * 0.5,
    -CORTICAL_COLUMN_FRAME.height * 0.5,
    CORTICAL_COLUMN_FRAME.width,
    CORTICAL_COLUMN_FRAME.height,
    28
  );
  ctx.fill();
  pop();
}

function getCorticalPiaSurfaceY(x) {
  const baselineY = -160;
  const microTexture = sin((x + 18) * 0.047) * 0.8 + sin((x - 63) * 0.083) * 0.45;
  const indentations = [
    { x: -482, depth: 9, width: 10 },
    { x: -421, depth: 15, width: 8 },
    { x: -356, depth: 7, width: 13 },
    { x: -288, depth: 12, width: 9 },
    { x: -229, depth: 8, width: 11 },
    { x: -162, depth: 17, width: 7 },
    { x: -96, depth: 10, width: 10 },
    { x: -28, depth: 6, width: 14 },
    { x: 47, depth: 13, width: 8 },
    { x: 119, depth: 9, width: 12 },
    { x: 184, depth: 16, width: 7 },
    { x: 252, depth: 8, width: 11 },
    { x: 327, depth: 14, width: 9 },
    { x: 397, depth: 7, width: 13 },
    { x: 468, depth: 11, width: 8 }
  ];
  const notchDepth = indentations.reduce((sum, indentation) => {
    const dx = (x - indentation.x) / indentation.width;
    return sum + indentation.depth * Math.exp(-dx * dx);
  }, 0);
  return baselineY + microTexture + notchDepth;
}

function drawCorticalPiaMaterLayer() {
  const left = CORTICAL_VIEW_BOUNDS.left - 18;
  const right = CORTICAL_VIEW_BOUNDS.right + 18;
  const bottom = CORTICAL_LAYER_BANDS[0].top + 6;
  const step = 10;
  const points = [];

  for (let x = left; x <= right + 0.1; x += step) {
    points.push({ x, y: getCorticalPiaSurfaceY(x) });
  }
  if (points[points.length - 1]?.x < right) {
    points.push({ x: right, y: getCorticalPiaSurfaceY(right) });
  }

  push();
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const previous = points[i - 1];
    const point = points[i];
    ctx.quadraticCurveTo(
      previous.x,
      previous.y,
      (previous.x + point.x) * 0.5,
      (previous.y + point.y) * 0.5
    );
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.lineTo(right, bottom);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, -194, 0, bottom);
  gradient.addColorStop(0, "rgba(238, 169, 182, 0.18)");
  gradient.addColorStop(0.62, "rgba(196, 116, 144, 0.1)");
  gradient.addColorStop(1, "rgba(130, 74, 112, 0.03)");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.clip();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  for (let layer = 0; layer < 2; layer++) {
    const inset = 4 + layer * 5;
    stroke(244, 180, 194, 18 - layer * 5);
    strokeWeight(0.8);
    beginShape();
    points.forEach((point) => {
      vertex(point.x, point.y + inset);
    });
    endShape();
  }

  const indentationMarks = [
    { x: -482, lean: -0.2, length: 11 },
    { x: -421, lean: 0.1, length: 17 },
    { x: -356, lean: 0.35, length: 9 },
    { x: -288, lean: -0.25, length: 14 },
    { x: -229, lean: 0.22, length: 10 },
    { x: -162, lean: -0.06, length: 19 },
    { x: -96, lean: 0.28, length: 12 },
    { x: -28, lean: -0.36, length: 8 },
    { x: 47, lean: 0.08, length: 15 },
    { x: 119, lean: -0.28, length: 11 },
    { x: 184, lean: 0.12, length: 18 },
    { x: 252, lean: 0.32, length: 10 },
    { x: 327, lean: -0.16, length: 16 },
    { x: 397, lean: 0.25, length: 9 },
    { x: 468, lean: -0.12, length: 13 }
  ];
  indentationMarks.forEach((mark) => {
    const y = getCorticalPiaSurfaceY(mark.x);
    stroke(255, 205, 213, 30);
    strokeWeight(0.9);
    line(mark.x, y - 1, mark.x + mark.lean * mark.length, min(bottom - 2, y + mark.length));
    stroke(72, 28, 54, 26);
    strokeWeight(0.75);
    line(mark.x + 2, y + 1, mark.x + 2 + mark.lean * mark.length, min(bottom - 1, y + mark.length + 3));
  });
  ctx.restore();

  noFill();
  stroke(255, 202, 210, 42);
  strokeWeight(1.4);
  beginShape();
  points.forEach((point) => vertex(point.x, point.y));
  endShape();

  stroke(107, 52, 84, 30);
  strokeWeight(0.8);
  beginShape();
  points.forEach((point) => vertex(point.x, point.y + 7));
  endShape();

  drawCorticalArachnoidTrabeculae();
  pop();
}

function beginCorticalPiaTissueClip() {
  const left = CORTICAL_VIEW_BOUNDS.left - 44;
  const right = CORTICAL_VIEW_BOUNDS.right + 44;
  const bottom = CORTICAL_VIEW_BOUNDS.bottom + 80;
  const step = 10;
  const ctx = drawingContext;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(left, getCorticalPiaSurfaceY(left) + 2);
  for (let x = left; x <= right + 0.1; x += step) {
    ctx.lineTo(x, getCorticalPiaSurfaceY(x) + 2);
  }
  ctx.lineTo(right, getCorticalPiaSurfaceY(right) + 2);
  ctx.lineTo(right, bottom);
  ctx.closePath();
  ctx.clip();
}

function endCorticalPiaTissueClip() {
  drawingContext.restore();
}

function drawCorticalArachnoidTrabeculae() {
  const spreadRootXs = [
    -526, -478, -430, -382, -334, -286, -238, -190,
    -142, -94, -46, 2, 50, 98, 146, 194,
    242, 290, 338, 386, 434, 482, 522
  ];
  const trabeculae = [
    {
      rootX: -488,
      topY: -218,
      joints: [
        { x: -494, y: -204 },
        { x: -483, y: -190 },
        { x: -489, y: -176 }
      ],
      branches: [
        { from: 1, dx: -22, dy: -10, bend: -5, split: 0.52 },
        { from: 2, dx: 18, dy: -8, bend: 4, split: 0.62 }
      ]
    },
    {
      rootX: -450,
      topY: -226,
      joints: [
        { x: -438, y: -211 },
        { x: -459, y: -199 },
        { x: -446, y: -184 }
      ],
      branches: [
        { from: 0, dx: 18, dy: 8, bend: 5, split: 0.48 },
        { from: 2, dx: -14, dy: -9, bend: -3, split: 0.52 }
      ]
    },
    {
      rootX: -392,
      topY: -232,
      joints: [
        { x: -382, y: -215 },
        { x: -405, y: -198 },
        { x: -392, y: -181 }
      ],
      branches: [
        { from: 0, dx: 26, dy: 9, bend: 8, split: 0.45 },
        { from: 1, dx: -18, dy: 13, bend: -6, split: 0.7 },
        { from: 1, dx: 16, dy: -11, bend: 3, split: 0.5 }
      ]
    },
    {
      rootX: -334,
      topY: -219,
      joints: [
        { x: -345, y: -207 },
        { x: -328, y: -193 },
        { x: -338, y: -181 }
      ],
      branches: [
        { from: 1, dx: -25, dy: 4, bend: -6, split: 0.58 },
        { from: 1, dx: 15, dy: -11, bend: 3, split: 0.46 }
      ]
    },
    {
      rootX: -274,
      topY: -213,
      joints: [
        { x: -263, y: -202 },
        { x: -280, y: -189 },
        { x: -272, y: -174 }
      ],
      branches: [
        { from: 1, dx: 24, dy: -5, bend: 4, split: 0.58 }
      ]
    },
    {
      rootX: -218,
      topY: -230,
      joints: [
        { x: -204, y: -216 },
        { x: -226, y: -201 },
        { x: -212, y: -188 },
        { x: -221, y: -176 }
      ],
      branches: [
        { from: 0, dx: 20, dy: -8, bend: 5, split: 0.44 },
        { from: 2, dx: -18, dy: 10, bend: -4, split: 0.64 }
      ]
    },
    {
      rootX: -146,
      topY: -226,
      joints: [
        { x: -154, y: -211 },
        { x: -139, y: -198 },
        { x: -162, y: -184 }
      ],
      branches: [
        { from: 0, dx: -21, dy: 8, bend: -5, split: 0.5 },
        { from: 1, dx: 27, dy: 10, bend: 7, split: 0.66 },
        { from: 2, dx: 14, dy: -9, bend: 4, split: 0.4 }
      ]
    },
    {
      rootX: -92,
      topY: -210,
      joints: [
        { x: -105, y: -199 },
        { x: -84, y: -188 },
        { x: -96, y: -176 }
      ],
      branches: [
        { from: 0, dx: -14, dy: 9, bend: -3, split: 0.54 },
        { from: 1, dx: 19, dy: -7, bend: 5, split: 0.5 }
      ]
    },
    {
      rootX: -38,
      topY: -218,
      joints: [
        { x: -25, y: -205 },
        { x: -48, y: -193 },
        { x: -31, y: -178 }
      ],
      branches: [
        { from: 0, dx: 20, dy: 7, bend: 5, split: 0.55 },
        { from: 1, dx: -16, dy: -10, bend: -3, split: 0.48 }
      ]
    },
    {
      rootX: 22,
      topY: -227,
      joints: [
        { x: 11, y: -213 },
        { x: 31, y: -199 },
        { x: 17, y: -184 }
      ],
      branches: [
        { from: 0, dx: -21, dy: 7, bend: -5, split: 0.5 },
        { from: 1, dx: 17, dy: 11, bend: 4, split: 0.62 },
        { from: 2, dx: 12, dy: -8, bend: 3, split: 0.44 }
      ]
    },
    {
      rootX: 82,
      topY: -234,
      joints: [
        { x: 72, y: -217 },
        { x: 99, y: -205 },
        { x: 87, y: -187 },
        { x: 95, y: -174 }
      ],
      branches: [
        { from: 1, dx: -29, dy: 8, bend: -7, split: 0.52 },
        { from: 1, dx: 18, dy: -13, bend: 5, split: 0.42 },
        { from: 2, dx: 24, dy: 11, bend: 6, split: 0.62 }
      ]
    },
    {
      rootX: 142,
      topY: -212,
      joints: [
        { x: 153, y: -201 },
        { x: 134, y: -190 },
        { x: 148, y: -177 }
      ],
      branches: [
        { from: 1, dx: -17, dy: -8, bend: -4, split: 0.46 },
        { from: 1, dx: 21, dy: 7, bend: 5, split: 0.58 }
      ]
    },
    {
      rootX: 206,
      topY: -216,
      joints: [
        { x: 218, y: -203 },
        { x: 198, y: -191 },
        { x: 209, y: -178 }
      ],
      branches: [
        { from: 0, dx: 17, dy: 12, bend: 6, split: 0.58 },
        { from: 1, dx: -23, dy: 5, bend: -5, split: 0.5 }
      ]
    },
    {
      rootX: 266,
      topY: -231,
      joints: [
        { x: 251, y: -216 },
        { x: 275, y: -202 },
        { x: 260, y: -188 },
        { x: 271, y: -176 }
      ],
      branches: [
        { from: 0, dx: -18, dy: -8, bend: -4, split: 0.44 },
        { from: 1, dx: 26, dy: 8, bend: 7, split: 0.56 },
        { from: 2, dx: -16, dy: 10, bend: -3, split: 0.63 }
      ]
    },
    {
      rootX: 332,
      topY: -229,
      joints: [
        { x: 318, y: -214 },
        { x: 343, y: -199 },
        { x: 326, y: -184 }
      ],
      branches: [
        { from: 0, dx: -24, dy: 10, bend: -6, split: 0.45 },
        { from: 1, dx: 25, dy: -6, bend: 4, split: 0.55 },
        { from: 2, dx: 16, dy: 11, bend: 5, split: 0.62 }
      ]
    },
    {
      rootX: 386,
      topY: -214,
      joints: [
        { x: 374, y: -202 },
        { x: 395, y: -191 },
        { x: 382, y: -179 }
      ],
      branches: [
        { from: 0, dx: 18, dy: -7, bend: 5, split: 0.48 },
        { from: 1, dx: -22, dy: 8, bend: -5, split: 0.58 }
      ]
    },
    {
      rootX: 455,
      topY: -221,
      joints: [
        { x: 466, y: -208 },
        { x: 448, y: -194 },
        { x: 461, y: -178 }
      ],
      branches: [
        { from: 1, dx: -20, dy: -8, bend: -4, split: 0.48 },
        { from: 1, dx: 18, dy: 12, bend: 5, split: 0.64 }
      ]
    },
    {
      rootX: -512,
      topY: -205,
      joints: [
        { x: -503, y: -195 },
        { x: -518, y: -185 }
      ],
      branches: [
        { from: 0, dx: 13, dy: 7, bend: 4, split: 0.6 }
      ]
    },
    {
      rootX: -252,
      topY: -241,
      joints: [
        { x: -239, y: -222 },
        { x: -260, y: -210 },
        { x: -246, y: -194 },
        { x: -256, y: -179 }
      ],
      branches: [
        { from: 0, dx: 24, dy: 6, bend: 7, split: 0.5 },
        { from: 2, dx: -19, dy: -7, bend: -5, split: 0.44 },
        { from: 3, dx: 14, dy: 9, bend: 3, split: 0.62 }
      ]
    },
    {
      rootX: -36,
      topY: -238,
      joints: [
        { x: -52, y: -220 },
        { x: -27, y: -208 },
        { x: -44, y: -193 },
        { x: -31, y: -179 }
      ],
      branches: [
        { from: 1, dx: -28, dy: 6, bend: -8, split: 0.5 },
        { from: 2, dx: 24, dy: -10, bend: 5, split: 0.44 },
        { from: 3, dx: 15, dy: 8, bend: 4, split: 0.6 }
      ]
    },
    {
      rootX: 166,
      topY: -243,
      joints: [
        { x: 178, y: -225 },
        { x: 158, y: -210 },
        { x: 174, y: -196 },
        { x: 164, y: -181 }
      ],
      branches: [
        { from: 0, dx: -18, dy: 9, bend: -5, split: 0.55 },
        { from: 1, dx: 27, dy: -7, bend: 7, split: 0.46 },
        { from: 2, dx: -16, dy: 11, bend: -4, split: 0.64 }
      ]
    },
    {
      rootX: 432,
      topY: -237,
      joints: [
        { x: 421, y: -220 },
        { x: 440, y: -207 },
        { x: 427, y: -191 },
        { x: 438, y: -178 }
      ],
      branches: [
        { from: 1, dx: -25, dy: 4, bend: -7, split: 0.52 },
        { from: 1, dx: 21, dy: -10, bend: 5, split: 0.44 },
        { from: 2, dx: 16, dy: 10, bend: 4, split: 0.61 }
      ]
    },
    {
      rootX: 506,
      topY: -207,
      joints: [
        { x: 497, y: -196 },
        { x: 512, y: -184 }
      ],
      branches: [
        { from: 0, dx: -14, dy: 9, bend: -4, split: 0.56 }
      ]
    }
  ];

  const ctx = drawingContext;
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  trabeculae.forEach((strand, strandIndex) => {
    const rootX = spreadRootXs[strandIndex] ?? strand.rootX;
    const xOffset = rootX - strand.rootX;
    const topLift = 24 + (strandIndex % 4) * 6 + (strandIndex % 7 === 0 ? 8 : 0);
    const piaY = getCorticalPiaSurfaceY(rootX);
    const mainPoints = [{ x: rootX, y: strand.topY - topLift }]
      .concat(strand.joints.map((point, jointIndex) => ({
        x: point.x + xOffset,
        y: point.y - topLift * (1 - (jointIndex + 1) / (strand.joints.length + 1)) * 0.72
      })))
      .concat([{ x: rootX + (strandIndex % 2 === 0 ? 3 : -4), y: piaY - 1 }]);

    stroke(236, 207, 214, 38);
    strokeWeight(strandIndex % 3 === 1 ? 1.15 : 0.85);
    beginShape();
    mainPoints.forEach((point) => curveVertex(point.x, point.y));
    endShape();

    stroke(116, 76, 96, 24);
    strokeWeight(0.55);
    beginShape();
    mainPoints.forEach((point) => curveVertex(point.x + 1.4, point.y + 0.8));
    endShape();

    strand.branches.forEach((branch, branchIndex) => {
      const anchor = mainPoints[constrain(branch.from + 1, 0, mainPoints.length - 1)];
      const tip = {
        x: anchor.x + branch.dx,
        y: constrain(anchor.y + branch.dy, mainPoints[0].y + 4, piaY - 3)
      };
      const control = {
        x: lerp(anchor.x, tip.x, branch.split) + branch.bend,
        y: lerp(anchor.y, tip.y, branch.split) - 4 + branchIndex * 2
      };
      stroke(236, 207, 214, 28);
      strokeWeight(0.72);
      drawingContext.beginPath();
      drawingContext.moveTo(anchor.x, anchor.y);
      drawingContext.quadraticCurveTo(control.x, control.y, tip.x, tip.y);
      drawingContext.stroke();

      if ((strandIndex + branchIndex) % 2 === 0) {
        const webTip = {
          x: tip.x + branch.dx * 0.28,
          y: constrain(tip.y + abs(branch.dy) * 0.35 + 5, mainPoints[0].y + 6, piaY - 2)
        };
        stroke(236, 207, 214, 18);
        strokeWeight(0.5);
        line(tip.x, tip.y, webTip.x, webTip.y);
      }
    });
  });
}

function drawCorticalColumnPlaceholder() {
  const img = ensureCorticalColumnPlaceholderImage();

  push();
  imageMode(CENTER);
  image(img, 0, -18, 420, 260);

  textAlign(CENTER, CENTER);
  noStroke();

  fill(255, 214, 120);
  textStyle(BOLD);
  textSize(34);
  text("CORTICAL COLUMN", 0, -214);

  fill(244, 246, 250);
  textSize(52);
  text("Under Construction", 0, 160);
  pop();
}

function drawCorticalLayerBandBackgrounds() {
  return;
}

function drawCorticalLayerBandLabels(viewport, fitScale, offset) {
  push();
  resetMatrix();
  textAlign(RIGHT, CENTER);
  noStroke();
  const labelScale = viewport.labelScale || getCorticalResponsiveScreenScale(0.72, 0.84);
  const viewLeft = viewport.centerX + offset.x + fitScale * CORTICAL_VIEW_BOUNDS.left;
  const labelX = max(54 * labelScale, min(viewport.labelX, viewLeft - 18 * labelScale));

  CORTICAL_LAYER_BANDS.forEach((layer) => {
    const centerY = (layer.top + layer.bottom) * 0.5;
    const screenY = viewport.centerY + offset.y + fitScale * centerY;

    fill(242, 246, 250, 224);
    textStyle(BOLD);
    textSize(16 * labelScale);
    text(layer.label.toUpperCase(), labelX, screenY - 8 * labelScale);

    fill(184, 196, 212, 196);
    textStyle(NORMAL);
    textSize(11 * labelScale);
    text("cortical layer band", labelX, screenY + 10 * labelScale);
  });

  pop();
}

function corticalTutorialWorldToScreen(point, viewport, fitScale, offset) {
  return {
    x: viewport.centerX + offset.x + fitScale * point.x,
    y: viewport.centerY + offset.y + fitScale * point.y
  };
}

function drawCorticalTutorialWorldRect(viewport, fitScale, offset, bounds, col = [255, 225, 135, 230]) {
  const tutorial = window.corticalGuidedTutorial;
  const topLeft = corticalTutorialWorldToScreen({ x: bounds.left, y: bounds.top }, viewport, fitScale, offset);
  const bottomRight = corticalTutorialWorldToScreen({ x: bounds.right, y: bounds.bottom }, viewport, fitScale, offset);
  const pulse = 0.5 + 0.5 * sin((tutorial?.pulse || 0) * 1.4);
  const pad = 8 + pulse * 8;
  const x = min(topLeft.x, bottomRight.x) - pad;
  const y = min(topLeft.y, bottomRight.y) - pad;
  const w = abs(bottomRight.x - topLeft.x) + pad * 2;
  const h = abs(bottomRight.y - topLeft.y) + pad * 2;

  noFill();
  stroke(col[0], col[1], col[2], col[3]);
  strokeWeight(2.5 + pulse * 1.5);
  rect(x, y, w, h, 16);
}

function shouldShowCorticalTutorialKeyboardHint() {
  return typeof window.shouldShowTutorialKeyboardHint === "function"
    ? window.shouldShowTutorialKeyboardHint()
    : !window.mobileTouchUI && !window.touchInputUI;
}

function drawCorticalTutorialHighlight(viewport, fitScale, offset) {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial) return;

  if (tutorial.step === 0) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, CORTICAL_VIEW_BOUNDS, [255, 225, 135, 230]);
  } else if (tutorial.step === 1) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, {
      left: CORTICAL_VIEW_BOUNDS.left,
      right: CORTICAL_VIEW_BOUNDS.right,
      top: CORTICAL_LAYER_BANDS[0].top,
      bottom: CORTICAL_LAYER_BANDS[CORTICAL_LAYER_BANDS.length - 1].bottom
    }, [150, 225, 255, 230]);
  } else if (tutorial.step === 2) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, {
      left: CORTICAL_VIEW_BOUNDS.left + 42,
      right: CORTICAL_VIEW_BOUNDS.right - 42,
      top: CORTICAL_LAYER_BANDS[1].top,
      bottom: CORTICAL_VIEW_BOUNDS.bottom - 10
    }, [160, 255, 170, 230]);
  } else if (tutorial.step === 3) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, {
      left: CORTICAL_VIEW_BOUNDS.left + 32,
      right: CORTICAL_VIEW_BOUNDS.right - 32,
      top: CORTICAL_VIEW_BOUNDS.top + 34,
      bottom: CORTICAL_VIEW_BOUNDS.bottom - 28
    }, [210, 170, 255, 230]);
  } else if (tutorial.step === 4) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, CORTICAL_VASCULATURE_BOUNDS, [120, 235, 255, 235]);
  } else if (tutorial.step === 5) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, {
      left: CORTICAL_VIEW_BOUNDS.left + 24,
      right: CORTICAL_VIEW_BOUNDS.right - 24,
      top: CORTICAL_VIEW_BOUNDS.top + 70,
      bottom: CORTICAL_VIEW_BOUNDS.bottom - 24
    }, [255, 198, 120, 235]);
  } else if (tutorial.step === 6) {
    drawCorticalTutorialWorldRect(viewport, fitScale, offset, CORTICAL_VIEW_BOUNDS, [255, 225, 135, 230]);
  }
}

function drawCorticalTutorialPanel(viewport) {
  const tutorial = window.corticalGuidedTutorial;
  const panelW = min(620, viewport.viewportWidth - 40);
  const panelH = shouldShowCorticalTutorialKeyboardHint() ? 176 : 154;
  const panelX = viewport.centerX - panelW * 0.5;
  const panelY = min(viewport.y + viewport.viewportHeight - panelH - 20, height - panelH - 18);

  noStroke();
  fill(8, 12, 18, 218);
  rect(panelX, panelY, panelW, panelH, 12);

  fill(255, 255, 255, 246);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(22);
  text(tutorial?.title || "Cortical Column Guided Tutorial", panelX + 22, panelY + 18, panelW - 44, 30);

  fill(232, 238, 246, 228);
  textSize(14);
  text(tutorial?.body || "", panelX + 22, panelY + 56, panelW - 44, 82);

  const stepText = `Step ${min((tutorial?.step || 0) + 1, CORTICAL_TUTORIAL_LAST_STEP + 1)} / ${CORTICAL_TUTORIAL_LAST_STEP + 1}`;
  fill(186, 202, 222, 220);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text(stepText, panelX + 22, panelY + panelH - 16);

  if (shouldShowCorticalTutorialKeyboardHint()) {
    fill(255, 255, 255, 210);
    textAlign(CENTER, BOTTOM);
    text("Left / Right Arrow: previous / next step", panelX, panelY + panelH - 16, panelW, 18);
  }
}

function drawCorticalGuidedTutorialOverlay(viewport, fitScale, offset) {
  const tutorial = window.corticalGuidedTutorial;
  if (!tutorial || (!tutorial.running && !tutorial.completionVisible)) return;

  push();
  resetMatrix();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(viewport.x, viewport.y, viewport.viewportWidth, viewport.viewportHeight);
  drawingContext.clip();
  drawCorticalTutorialHighlight(viewport, fitScale, offset);
  drawCorticalTutorialPanel(viewport);
  drawingContext.restore();
  pop();
}

function getCorticalNeuronLayout() {
  if (!corticalNeuronLayout) {
    corticalNeuronLayout = buildCorticalNeuronLayout();
  }
  return corticalNeuronLayout;
}

function getCorticalAstrocyteLayout() {
  if (!corticalAstrocyteLayout) {
    corticalAstrocyteLayout = buildCorticalAstrocyteLayout();
  }
  return corticalAstrocyteLayout;
}

function getCorticalMicrogliaLayout() {
  if (!corticalMicrogliaLayout) {
    corticalMicrogliaLayout = buildCorticalMicrogliaLayout();
  }
  return corticalMicrogliaLayout;
}

function getCorticalInsomniaMicrogliaLayout() {
  if (!corticalInsomniaMicrogliaLayout) {
    corticalInsomniaMicrogliaLayout = buildCorticalInsomniaMicrogliaLayout();
  }
  return corticalInsomniaMicrogliaLayout;
}

function getCorticalCrNeuronLayout() {
  if (!corticalCrNeuronLayout) {
    corticalCrNeuronLayout = buildCorticalCrNeuronLayout();
  }
  return corticalCrNeuronLayout;
}

function getCorticalSgNeuronLayout() {
  if (!corticalSgNeuronLayout) {
    corticalSgNeuronLayout = buildCorticalSgNeuronLayout();
  }
  return corticalSgNeuronLayout;
}

function getCorticalFusiformNeuronLayout() {
  if (!corticalFusiformNeuronLayout) {
    corticalFusiformNeuronLayout = buildCorticalFusiformNeuronLayout();
  }
  return corticalFusiformNeuronLayout;
}

function getCorticalInhibitoryNeuronLayout() {
  if (!corticalInhibitoryNeuronLayout) {
    corticalInhibitoryNeuronLayout = buildCorticalInhibitoryNeuronLayout();
  }
  return corticalInhibitoryNeuronLayout;
}

function getCorticalInhibitoryType2NeuronLayout() {
  if (!corticalInhibitoryType2NeuronLayout) {
    corticalInhibitoryType2NeuronLayout = buildCorticalInhibitoryType2NeuronLayout();
  }
  return corticalInhibitoryType2NeuronLayout;
}

function warmCorticalViewInBackground() {
  if (window.corticalViewWarmupStarted) return;
  window.corticalViewWarmupStarted = true;

  // Establish pathology-sensitive cache state before building anything. Without
  // this, the first Cortical update treats the baseline state as a change and
  // discards every cache that was just prepared.
  updateCorticalAgingSensitiveCaches();

  const warmupTasks = [
    ["pyramidal neurons", getCorticalNeuronLayout],
    ["Cajal-Retzius neurons", getCorticalCrNeuronLayout],
    ["stellate neurons", getCorticalSgNeuronLayout],
    ["fusiform neurons", getCorticalFusiformNeuronLayout],
    ["inhibitory neurons", getCorticalInhibitoryNeuronLayout],
    ["secondary inhibitory neurons", getCorticalInhibitoryType2NeuronLayout],
    ["astrocytes", getCorticalAstrocyteLayout],
    ["microglia", getCorticalMicrogliaLayout],
    ["vascular geometry", ensureCorticalMicrovascularFlowData],
    ["signal nodes", getCorticalNeuralSignalNodes],
    ["activation routes", getCorticalActivationRouteCatalog],
    ["inhibitory signal routes", getCorticalInhibitorySignalCells],
    ["vascular render assets", warmCorticalVascularRenderAssets],
    ["static cortical scene", warmCorticalStaticSceneRender]
  ];

  const readiness = window.corticalViewReadiness;
  readiness.started = true;
  readiness.ready = false;
  readiness.failed = false;
  readiness.completed = 0;
  readiness.total = warmupTasks.length;
  readiness.startedAt = performance.now();
  readiness.estimatedReadyAt = readiness.startedAt + CORTICAL_WARMUP_INITIAL_ETA_MS;
  readiness.currentTask = warmupTasks[0][0];
  publishCorticalViewReadiness();

  function runNextWarmupTask() {
    const task = warmupTasks.shift();
    if (!task) return;
    const [taskName, runTask] = task;
    readiness.currentTask = taskName;
    publishCorticalViewReadiness();

    try {
      runTask();
    } catch (error) {
      readiness.failed = true;
      readiness.currentTask = "Preparation failed";
      console.error("Cortical view preparation failed", error);
      publishCorticalViewReadiness();
      return;
    }

    readiness.completed += 1;
    const elapsed = performance.now() - readiness.startedAt;
    const averageTaskMs = elapsed / max(1, readiness.completed);
    readiness.estimatedReadyAt = performance.now() + averageTaskMs * warmupTasks.length;

    if (warmupTasks.length) {
      readiness.currentTask = warmupTasks[0][0];
      publishCorticalViewReadiness();
      scheduleNextWarmupTask();
    } else {
      window.corticalViewWarmed = true;
      readiness.ready = true;
      readiness.currentTask = "Ready";
      readiness.estimatedReadyAt = performance.now();
      publishCorticalViewReadiness();
    }
  }

  function scheduleNextWarmupTask() {
    window.setTimeout(runNextWarmupTask, 16);
  }

  scheduleNextWarmupTask();
}

function warmCorticalVascularRenderAssets() {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const preview = vascularData?.outlinePreview;
  if (!preview || typeof document === "undefined") return;

  ensureCorticalContinuousNetworkCanvas(
    vascularData.mergedSegments,
    preview,
    color(228, 76, 76),
    color(146, 92, 198),
    color(74, 142, 236),
    color(18, 22, 30),
    26
  );
}

function warmCorticalStaticSceneRender() {
  if (typeof width === "undefined" || typeof height === "undefined") return;
  const previousFrame = typeof get === "function"
    ? get(0, 0, width, height)
    : null;
  const corticalState = getCorticalViewState();
  if (!corticalState.offsetInitialized) resetCorticalViewTransform();
  const viewport = getCorticalViewportMetrics();
  const baseScale = getCorticalBaseScale(viewport.viewportWidth, viewport.viewportHeight);
  const fitScale = baseScale * corticalState.zoom;
  const displayMode = getCorticalDisplayMode();

  ensureCorticalStaticSceneCache({
    viewport,
    baseScale,
    fitScale,
    offset: corticalState.offset,
    displayMode,
    showNeurons: displayMode === "all" || displayMode === "neurons",
    showGlia: displayMode === "all" || displayMode === "glia",
    showVasculature: displayMode === "all" || displayMode === "vasculature"
  });

  // Static cache construction draws through p5's main renderer. Restore the
  // currently visible view before the browser paints this frame.
  if (previousFrame) {
    push();
    resetMatrix();
    imageMode(CORNER);
    image(previousFrame, 0, 0, width, height);
    pop();
  }
}

function buildCorticalInhibitoryType2NeuronLayout() {
  const rng = createCorticalRng(52709);
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 58;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 58;
  const targetBands = [
    { layerName: "Layer 2", top: CORTICAL_LAYER_BANDS[1].top + 10, bottom: CORTICAL_LAYER_BANDS[1].bottom - 10 },
    { layerName: "Layer 3", top: CORTICAL_LAYER_BANDS[2].top + 12, bottom: CORTICAL_LAYER_BANDS[2].bottom - 12 },
    { layerName: "Layer 5", top: CORTICAL_LAYER_BANDS[4].top + 14, bottom: 300 },
    { layerName: "Layer 6", top: 312, bottom: CORTICAL_VIEW_BOUNDS.bottom - 18 }
  ];
  const cells = [];
  const columns = getCorticalActivationColumns();

  function overlapsVasculature(candidate) {
    return vascularAvoidancePoints.some((point) => {
      const dx = candidate.x - point.x;
      const dy = candidate.y - point.y;
      const radius = point.radius + 7;
      return dx * dx + dy * dy < radius * radius;
    });
  }

  function tooCloseToExistingType2(candidate) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < 34 * 34;
    });
  }

  targetBands.forEach((band, bandIndex) => {
    columns.forEach((column, columnIndex) => {
      let accepted = null;
      const baseY = corticalRand(rng, band.top + 8, band.bottom - 8);

      for (let attempt = 0; attempt < 84 && !accepted; attempt++) {
        const relaxedAttempt = attempt > 52;
        const xInset = min(16, column.width * 0.18);
        const candidate = {
          x: constrain(
            corticalRand(rng, column.minX + xInset, column.maxX - xInset),
            minX,
            maxX
          ),
          y: constrain(
            baseY + corticalRand(rng, -14 - attempt * 0.1, 14 + attempt * 0.1),
            band.top,
            band.bottom
          ),
          scale: corticalRand(rng, 0.34, 0.42),
          alpha: corticalRand(rng, 206, 236),
          phase: corticalRand(rng, -0.28, 0.28),
          flip: rng() < 0.5 ? -1 : 1,
          layerName: band.layerName
        };
        if (!relaxedAttempt && overlapsVasculature(candidate)) continue;
        if (tooCloseToExistingType2(candidate) && attempt < 64) continue;
        accepted = candidate;
      }
      if (accepted) cells.push(accepted);
    });
  });

  return cells;
}

function buildCorticalInhibitoryNeuronLayout() {
  const rng = createCorticalRng(41873);
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 58;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 58;
  const targetBands = [
    { layerName: "Layer 2", top: CORTICAL_LAYER_BANDS[1].top + 10, bottom: CORTICAL_LAYER_BANDS[1].bottom - 10, count: 12 },
    { layerName: "Layer 3", top: CORTICAL_LAYER_BANDS[2].top + 12, bottom: CORTICAL_LAYER_BANDS[2].bottom - 12, count: 14 },
    { layerName: "Layer 5", top: CORTICAL_LAYER_BANDS[4].top + 14, bottom: 300, count: 14 },
    { layerName: "Layer 6", top: 312, bottom: CORTICAL_VIEW_BOUNDS.bottom - 18, count: 12 }
  ];
  const cells = [];

  function overlapsVasculature(candidate) {
    return vascularAvoidancePoints.some((point) => {
      const dx = candidate.x - point.x;
      const dy = candidate.y - point.y;
      const radius = point.radius + 7;
      return dx * dx + dy * dy < radius * radius;
    });
  }

  function tooCloseToExistingInhibitory(candidate) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < 38 * 38;
    });
  }

  targetBands.forEach((band) => {
    const binCount = min(band.count, 8);
    const binOrder = Array.from({ length: band.count }, (_, index) => index % binCount).sort(() => rng() - 0.5);

    for (let index = 0; index < band.count; index++) {
      let accepted = null;
      for (let attempt = 0; attempt < 112 && !accepted; attempt++) {
        const binIndex = binOrder[index];
        const binLeft = lerp(minX, maxX, binIndex / binCount);
        const binRight = lerp(minX, maxX, (binIndex + 1) / binCount);
        const horizontalInset = 8;
        const yBandFraction = ((index * 3 + floor(rng() * 3)) % max(3, ceil(band.count / binCount) + 1)) / max(1, ceil(band.count / binCount) + 1);
        const yAnchor = lerp(band.top, band.bottom, constrain(yBandFraction + corticalRand(rng, -0.16, 0.16), 0.08, 0.92));
        const candidate = {
          x: corticalRand(rng, binLeft + horizontalInset, binRight - horizontalInset),
          y: constrain(yAnchor + corticalRand(rng, -8, 8), band.top, band.bottom),
          scale: corticalRand(rng, 0.32, 0.4),
          alpha: corticalRand(rng, 212, 242),
          phase: corticalRand(rng, -0.26, 0.26),
          layerName: band.layerName
        };
        if (overlapsVasculature(candidate)) continue;
        if (tooCloseToExistingInhibitory(candidate) && attempt < 72) continue;
        accepted = candidate;
      }
      if (accepted) cells.push(accepted);
    }
  });

  [
    { x: 314, y: 54, layerName: "Layer 3", scale: 0.36, phase: -0.1 },
    { x: 422, y: 92, layerName: "Layer 3", scale: 0.34, phase: 0.16 },
    { x: 328, y: 258, layerName: "Layer 5", scale: 0.35, phase: -0.18 },
    { x: 430, y: 286, layerName: "Layer 5", scale: 0.37, phase: 0.12 },
    { x: 318, y: 326, layerName: "Layer 6", scale: 0.34, phase: 0.08 },
    { x: 430, y: 348, layerName: "Layer 6", scale: 0.36, phase: -0.14 }
  ].forEach((fillCell) => {
    cells.push({
      x: constrain(fillCell.x, minX, maxX),
      y: constrain(fillCell.y, CORTICAL_VIEW_BOUNDS.top + 18, CORTICAL_VIEW_BOUNDS.bottom - 18),
      scale: fillCell.scale,
      alpha: 234,
      phase: fillCell.phase,
      layerName: fillCell.layerName
    });
  });

  return cells;
}

function buildCorticalFusiformNeuronLayout() {
  const rng = createCorticalRng(31991);
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 64;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 64;
  const targetBands = [
    {
      layerName: "Layer 3",
      top: CORTICAL_LAYER_BANDS[2].top + 14,
      bottom: CORTICAL_LAYER_BANDS[2].bottom - 14,
      dendriteTargetY: (CORTICAL_LAYER_BANDS[1].top + CORTICAL_LAYER_BANDS[1].bottom) * 0.5,
      axonTargetY: (CORTICAL_LAYER_BANDS[3].top + CORTICAL_LAYER_BANDS[3].bottom) * 0.5,
      count: 7
    },
    {
      layerName: "Layer 6",
      top: 304,
      bottom: CORTICAL_VIEW_BOUNDS.bottom - 18,
      dendriteTargetY: 274,
      axonTargetY: CORTICAL_VIEW_BOUNDS.bottom + 16,
      count: 7
    }
  ];
  const cells = [];

  function overlapsVasculature(candidate) {
    const scaleValue = candidate.scale || 0.42;
    const samplePoints = candidate.relaxedVascularAvoidance
      ? [{ x: candidate.x, y: candidate.y, radius: 8 }]
      : [
          { x: candidate.x, y: candidate.y, radius: 8 },
          { x: candidate.x, y: candidate.dendriteTargetY, radius: 5 },
          { x: candidate.x, y: candidate.axonTargetY, radius: 5 }
        ];

    return samplePoints.some((sample) => {
      return vascularAvoidancePoints.some((point) => {
        const dx = sample.x - point.x;
        const dy = sample.y - point.y;
        const radius = point.radius + sample.radius + 4 * scaleValue;
        return dx * dx + dy * dy < radius * radius;
      });
    });
  }

  function tooCloseToExistingFusiform(candidate) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < 54 * 54;
    });
  }

  targetBands.forEach((band) => {
    const binCount = 7;
    const binOrder = Array.from({ length: band.count }, (_, index) => index % binCount).sort(() => rng() - 0.5);

    for (let index = 0; index < band.count; index++) {
      let accepted = null;
      for (let attempt = 0; attempt < 96 && !accepted; attempt++) {
        const binIndex = binOrder[index];
        const binLeft = lerp(minX, maxX, binIndex / binCount);
        const binRight = lerp(minX, maxX, (binIndex + 1) / binCount);
        const candidate = {
          x: corticalRand(rng, binLeft + 9, binRight - 9),
          y: corticalRand(rng, band.top, band.bottom),
          scale: corticalRand(rng, 0.34, 0.43),
          alpha: corticalRand(rng, 202, 232),
          dendriteTargetY: band.dendriteTargetY + corticalRand(rng, -8, 8),
          axonTargetY: band.axonTargetY + corticalRand(rng, -10, 10),
          phase: corticalRand(rng, -0.26, 0.26),
          layerName: band.layerName,
          relaxedVascularAvoidance: attempt > 48
        };
        if (overlapsVasculature(candidate)) continue;
        if (tooCloseToExistingFusiform(candidate) && attempt < 36) continue;
        accepted = candidate;
      }
      if (accepted) cells.push(accepted);
    }
  });

  return cells;
}

function buildCorticalSgNeuronLayout() {
  const rng = createCorticalRng(28411);
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 54;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 54;
  const targetBands = [
    { layerName: "Layer 2", top: CORTICAL_LAYER_BANDS[1].top + 12, bottom: CORTICAL_LAYER_BANDS[1].bottom - 10, count: 18 },
    { layerName: "Layer 4", top: CORTICAL_LAYER_BANDS[3].top + 14, bottom: CORTICAL_LAYER_BANDS[3].bottom - 14, count: 20 },
    { layerName: "Layer 6", top: 296, bottom: CORTICAL_VIEW_BOUNDS.bottom - 14, count: 18 }
  ];
  const cells = [];

  function overlapsVasculature(candidate) {
    const scaleValue = candidate.scale || 0.45;
    const samplePoints = candidate.relaxedVascularAvoidance
      ? [{ x: candidate.x, y: candidate.y, radius: 7 }]
      : [
          { x: candidate.x, y: candidate.y, radius: 8 },
          { x: candidate.x - 38 * scaleValue, y: candidate.y - 10 * scaleValue, radius: 5 },
          { x: candidate.x + 38 * scaleValue, y: candidate.y - 8 * scaleValue, radius: 5 },
          { x: candidate.x - 42 * scaleValue, y: candidate.y + 18 * scaleValue, radius: 5 },
          { x: candidate.x + 42 * scaleValue, y: candidate.y + 18 * scaleValue, radius: 5 },
          { x: candidate.x + 6 * scaleValue, y: candidate.y + 62 * scaleValue, radius: 5 }
        ];

    return samplePoints.some((sample) => {
      return vascularAvoidancePoints.some((point) => {
        const dx = sample.x - point.x;
        const dy = sample.y - point.y;
        const radius = point.radius + sample.radius + 5;
        return dx * dx + dy * dy < radius * radius;
      });
    });
  }

  function tooCloseToExistingSg(candidate) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      const spacing = candidate.layerName === "Layer 4" && cell.layerName === "Layer 4" ? 34 : 26;
      return dx * dx + dy * dy < spacing * spacing;
    });
  }

  targetBands.forEach((band) => {
    const binCount = 8;
    const binOrder = Array.from({ length: band.count }, (_, cellIndex) => cellIndex % binCount).sort(() => rng() - 0.5);

    for (let cellIndex = 0; cellIndex < band.count; cellIndex++) {
      let accepted = null;

      for (let attempt = 0; attempt < 156 && !accepted; attempt++) {
        const binIndex = binOrder[cellIndex];
        const binLeft = lerp(minX, maxX, binIndex / binCount);
        const binRight = lerp(minX, maxX, (binIndex + 1) / binCount);
        const inset = 7;
        const candidate = {
          x: corticalRand(rng, binLeft + inset, binRight - inset),
          y: corticalRand(rng, band.top, band.bottom),
          scale: corticalRand(rng, 0.38, 0.48),
          alpha: corticalRand(rng, 198, 232),
          layerName: band.layerName,
          phase: corticalRand(rng, -0.22, 0.22),
          relaxedVascularAvoidance: attempt > 112
        };
        if (overlapsVasculature(candidate)) continue;
        if (tooCloseToExistingSg(candidate) && attempt < 96) continue;
        accepted = candidate;
      }

      if (accepted) cells.push(accepted);
    }
  });

  spreadLayerFourRightStellateCells(cells, rng, minX, maxX, {
    overlapsVasculature,
    tooCloseToExistingSg
  });

  cells.push({
    x: constrain(corticalRand(rng, 426, 486), minX, maxX),
    y: constrain(corticalRand(rng, 292, CORTICAL_VIEW_BOUNDS.bottom - 20), 252, CORTICAL_VIEW_BOUNDS.bottom - 18),
    scale: corticalRand(rng, 0.39, 0.44),
    alpha: 224,
    layerName: "Layer 6",
    phase: corticalRand(rng, -0.16, 0.16),
    relaxedVascularAvoidance: true
  });

  return cells;
}

function spreadLayerFourRightStellateCells(cells, rng, minX, maxX, validators) {
  const columns = getCorticalActivationColumns().slice(5);
  const layer = CORTICAL_LAYER_BANDS[3];
  const targetCount = max(0, columns.length - 2);
  const selectedColumns = columns
    .map((column) => ({ column, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, targetCount)
    .map((entry) => entry.column);
  let acceptedCount = 0;
  let attempts = 0;

  while (acceptedCount < targetCount && attempts < targetCount * 100) {
    attempts++;
    const column = selectedColumns[acceptedCount % selectedColumns.length];
    const inset = min(10, column.width * 0.14);
    const yBand = acceptedCount % 3;
    const yTop = lerp(layer.top + 12, layer.bottom - 36, yBand / 3);
    const yBottom = lerp(layer.top + 38, layer.bottom - 12, (yBand + 1) / 3);
    const candidate = {
      x: constrain(corticalRand(rng, column.minX + inset, column.maxX - inset), minX, maxX),
      y: constrain(corticalRand(rng, yTop, yBottom), layer.top + 10, layer.bottom - 10),
      scale: corticalRand(rng, 0.38, 0.45),
      alpha: 224,
      layerName: "Layer 4",
      phase: corticalRand(rng, -0.22, 0.22),
      relaxedVascularAvoidance: true
    };

    if (attempts < targetCount * 48 && validators.overlapsVasculature(candidate)) continue;
    if (validators.tooCloseToExistingSg(candidate) && attempts < targetCount * 72) continue;
    cells.push(candidate);
    acceptedCount++;
  }
}

function buildCorticalCrNeuronLayout() {
  const rng = createCorticalRng(18377);
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const layer = CORTICAL_LAYER_BANDS[0];
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 58;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 58;
  const usableTop = layer.top + 14;
  const usableBottom = layer.bottom - 16;
  const count = 13;
  const cells = [];
  const clusterCount = 5;
  const clusters = Array.from({ length: clusterCount }, (_, index) => ({
    x: lerp(minX, maxX, (index + corticalRand(rng, 0.16, 0.84)) / clusterCount),
    y: corticalRand(rng, usableTop, usableBottom),
    spreadX: corticalRand(rng, 46, 104),
    spreadY: corticalRand(rng, 8, max(14, (usableBottom - usableTop) * 0.4)),
    pull: corticalRand(rng, 0.56, 0.86)
  })).sort(() => rng() - 0.5);

  function overlapsVasculature(candidate) {
    const scaleValue = candidate.scale || 0.3;
    const samplePoints = [
      { x: candidate.x, y: candidate.y, radius: 9 },
      { x: candidate.x - 72 * scaleValue, y: candidate.y - 4 * scaleValue, radius: 5 },
      { x: candidate.x - 138 * scaleValue, y: candidate.y, radius: 4 },
      { x: candidate.x + 72 * scaleValue, y: candidate.y + 4 * scaleValue, radius: 5 },
      { x: candidate.x + 138 * scaleValue, y: candidate.y, radius: 4 },
      { x: candidate.x, y: candidate.y + 24 * scaleValue, radius: 5 },
      { x: candidate.x - candidate.flip * 3 * scaleValue, y: candidate.y + 54 * scaleValue, radius: 5 }
    ];

    return samplePoints.some((sample) => {
      return vascularAvoidancePoints.some((point) => {
        const dx = sample.x - point.x;
        const dy = sample.y - point.y;
        const radius = point.radius + sample.radius + 5;
        return dx * dx + dy * dy < radius * radius;
      });
    });
  }

  function tooCloseToExistingCr(candidate) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < 36 * 36;
    });
  }

  for (let cellIndex = 0; cellIndex < count; cellIndex++) {
    let accepted = null;

    for (let attempt = 0; attempt < 28 && !accepted; attempt++) {
      const cluster = clusters[(cellIndex + attempt + floor(rng() * clusters.length)) % clusters.length];
      const broadX = corticalRand(rng, minX, maxX);
      const broadY = corticalRand(rng, usableTop, usableBottom);
      const candidate = {
        x: constrain(lerp(broadX, cluster.x + corticalRand(rng, -cluster.spreadX, cluster.spreadX), cluster.pull), minX, maxX),
        y: constrain(lerp(broadY, cluster.y + corticalRand(rng, -cluster.spreadY, cluster.spreadY), cluster.pull), usableTop, usableBottom),
        scale: corticalRand(rng, 0.26, 0.34),
        flip: rng() < 0.5 ? -1 : 1,
        alpha: corticalRand(rng, 205, 238),
        branchPhase: corticalRand(rng, -0.35, 0.35)
      };
      if (overlapsVasculature(candidate)) continue;
      if (tooCloseToExistingCr(candidate)) continue;
      accepted = candidate;
    }

    for (let attempt = 0; attempt < 80 && !accepted; attempt++) {
      const cluster = clusters[(cellIndex + attempt) % clusters.length];
      const candidate = {
        x: corticalRand(rng, minX, maxX),
        y: constrain(cluster.y + corticalRand(rng, -cluster.spreadY * 1.4, cluster.spreadY * 1.4), usableTop, usableBottom),
        scale: corticalRand(rng, 0.26, 0.32),
        flip: rng() < 0.5 ? -1 : 1,
        alpha: corticalRand(rng, 196, 224),
        branchPhase: corticalRand(rng, -0.28, 0.28)
      };
      if (overlapsVasculature(candidate)) continue;
      if (tooCloseToExistingCr(candidate)) continue;
      accepted = candidate;
    }

    if (accepted) cells.push(accepted);
  }

  return cells;
}

function buildCorticalNeuronLayout() {
  const rng = createCorticalRng(74251);
  const neurons = [];
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  corticalNeuronIdCounter = 0;
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 28;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 28;

  function getNeuronVasculaturePadding(candidate, point, padding = 3) {
    // Clear a wider halo on the left half so neurons do not visually sit on top of the left vasculature.
    if (candidate.x < 0 && point.x < 0) {
      return point.x < -120 ? padding + 14 : padding + 11;
    }
    return padding;
  }

  function overlapsVasculature(candidate, padding = 3) {
    return vascularAvoidancePoints.some((point) => {
      const dx = candidate.x - point.x;
      const dy = candidate.y - point.y;
      const radius = point.radius + getNeuronVasculaturePadding(candidate, point, padding);
      return dx * dx + dy * dy < radius * radius;
    });
  }

  function overlapsBottomLeftCapillaryJunction(candidate) {
    // Clear the dense neuron cluster that can sit on the lower-left branch-to-bed handoff.
    const primaryDx = candidate.x + 500;
    const primaryDy = candidate.y - 258;
    const insidePrimaryEllipse =
      (primaryDx * primaryDx) / (92 * 92) + (primaryDy * primaryDy) / (58 * 58) < 1;

    const tailDx = candidate.x + 448;
    const tailDy = candidate.y - 292;
    const insideTailEllipse =
      (tailDx * tailDx) / (72 * 72) + (tailDy * tailDy) / (40 * 40) < 1;

    return insidePrimaryEllipse || insideTailEllipse;
  }

  function isTooCloseToNeurons(candidate, existingNeurons) {
    return existingNeurons.some((other) => {
      const dx = candidate.x - other.x;
      const dy = candidate.y - other.y;
      if (dx * dx + dy * dy < 12.5 * 12.5) return true;
      if (other.layerIndex !== candidate.layerIndex) return false;
      return abs(candidate.x - other.x) < 7 && abs(candidate.y - other.y) < 5;
    });
  }

  function generateCandidate(layer, layerIndex, bandHeight) {
    const usableTop = layer.top + 12;
    const usableBottom = layer.bottom - 12;
    const rowBias = rng();
    const clusteredY =
      rowBias < 0.28
        ? lerp(usableTop, usableBottom, corticalRand(rng, 0.08, 0.32))
        : rowBias > 0.74
          ? lerp(usableTop, usableBottom, corticalRand(rng, 0.68, 0.92))
          : corticalRand(rng, usableTop, usableBottom);
    return {
      layerIndex,
      x: corticalRand(rng, minX, maxX),
      y: constrain(clusteredY + corticalRand(rng, -bandHeight * 0.1, bandHeight * 0.1), usableTop, usableBottom),
      scale: corticalRand(rng, 0.74, 1.2),
      flip: rng() < 0.5 ? -1 : 1,
      alpha: corticalRand(rng, 172, 216)
    };
  }

  CORTICAL_LAYER_BANDS.forEach((layer, layerIndex) => {
    const targetCount = getCorticalAgingNeuronCount(CORTICAL_NEURON_COUNTS[layerIndex] || 5);
    const bandHeight = layer.bottom - layer.top;
    const layerNeurons = [];

    let attempts = 0;
    while (layerNeurons.length < targetCount && attempts < targetCount * 42) {
      attempts++;
      const candidate = generateCandidate(layer, layerIndex, bandHeight);
      if (overlapsBottomLeftCapillaryJunction(candidate)) continue;
      if (isTooCloseToNeurons(candidate, neurons) || isTooCloseToNeurons(candidate, layerNeurons)) continue;

      layerNeurons.push(candidate);
    }

    relaxCorticalLayerNeurons(layerNeurons, layer, minX, maxX);
    layerNeurons
      .filter((candidate) => !overlapsBottomLeftCapillaryJunction(candidate))
      .forEach((candidate) => {
        candidate.behindVasculature = overlapsVasculature(candidate, 2);
        candidate.neuronId = `cortical-neuron-${corticalNeuronIdCounter++}`;
        candidate.dendriteExtensions = buildCorticalDendriteExtensions(candidate, rng);
        candidate.axonExtensions = buildCorticalAxonExtensions(candidate, rng);
        neurons.push(candidate);
      });
  });

  addCorticalEdgeColumnGapPyramidalNeurons(neurons, rng, minX, maxX, {
    overlapsVasculature,
    overlapsBottomLeftCapillaryJunction,
    isTooCloseToNeurons
  });
  addCorticalUpwardRouteSupportNeurons(neurons, rng, minX, maxX, {
    overlapsVasculature,
    overlapsBottomLeftCapillaryJunction,
    isTooCloseToNeurons
  });
  addCorticalBottomRightUpwardRouteAnchors(neurons, rng, minX, maxX, {
    overlapsVasculature,
    overlapsBottomLeftCapillaryJunction,
    isTooCloseToNeurons
  });
  assignCorticalInvertedApRouteNeurons(neurons, rng);
  corticalAstrocyteLayout = null;
  corticalMicrogliaLayout = null;
  return neurons;
}

function addCorticalEdgeColumnGapPyramidalNeurons(neurons, rng, minX, maxX, validators) {
  const columns = getCorticalActivationColumns();
  const edgeColumns = [columns[0], columns[columns.length - 1]].filter(Boolean);
  const gapBands = [
    { layerIndex: 3, top: CORTICAL_LAYER_BANDS[3].top + 30, bottom: CORTICAL_LAYER_BANDS[3].bottom - 8, count: 3 },
    { layerIndex: 4, top: CORTICAL_LAYER_BANDS[4].top + 12, bottom: min(326, CORTICAL_LAYER_BANDS[4].bottom - 20), count: 3 }
  ];

  edgeColumns.forEach((column, columnSideIndex) => {
    gapBands.forEach((band, bandIndex) => {
      const bandTargetCount = getCorticalAgingNeuronCount(band.count);
      let acceptedCount = 0;
      let attempts = 0;

      while (acceptedCount < bandTargetCount && attempts < bandTargetCount * 96) {
        attempts++;
        const xInset = min(18, column.width * 0.22);
        const candidate = {
          layerIndex: band.layerIndex,
          x: constrain(
            corticalRand(rng, column.minX + xInset, column.maxX - xInset),
            minX,
            maxX
          ),
          y: constrain(
            corticalRand(rng, band.top, band.bottom) + corticalRand(rng, -9, 9),
            band.top,
            band.bottom
          ),
          scale: corticalRand(rng, 0.76, 1.06),
          flip: rng() < 0.5 ? -1 : 1,
          alpha: corticalRand(rng, 182, 218),
          edgeColumnGapNeuron: true,
          forceInvertedApRoute: (acceptedCount + bandIndex + columnSideIndex) % 2 === 0,
          forceDownwardApRoute: (acceptedCount + bandIndex + columnSideIndex) % 2 !== 0
        };

        if (validators.overlapsBottomLeftCapillaryJunction(candidate)) continue;
        if (attempts < bandTargetCount * 52 && validators.overlapsVasculature(candidate, 1)) continue;
        if (validators.isTooCloseToNeurons(candidate, neurons) && attempts < bandTargetCount * 72) continue;

        candidate.behindVasculature = validators.overlapsVasculature(candidate, 2);
        candidate.neuronId = `cortical-neuron-${corticalNeuronIdCounter++}`;
        candidate.dendriteExtensions = buildCorticalDendriteExtensions(candidate, rng);
        candidate.axonExtensions = buildCorticalAxonExtensions(candidate, rng);
        neurons.push(candidate);
        acceptedCount++;
      }
    });
  });
}

function addCorticalUpwardRouteSupportNeurons(neurons, rng, minX, maxX, validators) {
  const columns = getCorticalActivationColumns();
  const supportBands = [
    { layerIndex: 4, top: CORTICAL_LAYER_BANDS[4].top + 24, bottom: CORTICAL_LAYER_BANDS[4].bottom - 16 },
    { layerIndex: 3, top: CORTICAL_LAYER_BANDS[3].top + 18, bottom: CORTICAL_LAYER_BANDS[3].bottom - 14 },
    { layerIndex: 2, top: CORTICAL_LAYER_BANDS[2].top + 12, bottom: CORTICAL_LAYER_BANDS[2].bottom - 14 }
  ];

  columns.forEach((column, columnIndex) => {
    const baseTargetPerColumn = columnIndex >= 2 && columnIndex <= 10 ? 5 : 4;
    const targetPerColumn = getCorticalAgingNeuronCount(baseTargetPerColumn);
    const existingUpwardEligible = neurons.filter((neuron) => (
      !neuron.isInhibitory &&
      !neuron.forceDownwardApRoute &&
      neuron.layerIndex > 0 &&
      neuron.x >= column.minX - 10 &&
      neuron.x <= column.maxX + 10
    ));
    let needed = max(0, targetPerColumn - existingUpwardEligible.length);
    let attempts = 0;

    while (needed > 0 && attempts < targetPerColumn * 110) {
      attempts++;
      const band = supportBands[(targetPerColumn - needed + attempts + columnIndex) % supportBands.length];
      const xInset = min(14, column.width * 0.18);
      const candidate = {
        layerIndex: band.layerIndex,
        x: constrain(
          corticalRand(rng, column.minX + xInset, column.maxX - xInset),
          minX,
          maxX
        ),
        y: constrain(
          corticalRand(rng, band.top, band.bottom) + corticalRand(rng, -8, 8),
          band.top,
          band.bottom
        ),
        scale: corticalRand(rng, 0.72, 1.04),
        flip: rng() < 0.5 ? -1 : 1,
        alpha: corticalRand(rng, 174, 212),
        forceInvertedApRoute: true,
        upwardRouteSupportNeuron: true
      };

      if (validators.overlapsBottomLeftCapillaryJunction(candidate)) continue;
      if (attempts < targetPerColumn * 54 && validators.overlapsVasculature(candidate, 1)) continue;
      if (validators.isTooCloseToNeurons(candidate, neurons) && attempts < targetPerColumn * 78) continue;

      candidate.behindVasculature = validators.overlapsVasculature(candidate, 2);
      candidate.neuronId = `cortical-neuron-${corticalNeuronIdCounter++}`;
      candidate.dendriteExtensions = buildCorticalDendriteExtensions(candidate, rng);
      candidate.axonExtensions = buildCorticalAxonExtensions(candidate, rng);
      neurons.push(candidate);
      needed--;
    }
  });
}

function addCorticalBottomRightUpwardRouteAnchors(neurons, rng, minX, maxX, validators) {
  const columns = getCorticalActivationColumns();
  const layer = CORTICAL_LAYER_BANDS[4];

  columns.slice(3, 6).forEach((column, columnOffset) => {
    const targetCount = getCorticalAgingNeuronCount(1);
    const verticalSlots = [0.66 + columnOffset * 0.09 + corticalRand(rng, -0.06, 0.07)];
    addCorticalBottomUpwardRouteAnchorsForColumn({
      column,
      targetCount,
      verticalSlots,
      neurons,
      rng,
      minX,
      maxX,
      layer,
      validators
    });
  });

  columns.slice(6).forEach((column, columnOffset) => {
    const targetCount = getCorticalAgingNeuronCount(columnOffset % 2 === 0 ? 2 : 1);
    const verticalSlots = targetCount === 2
      ? [0.12 + rng() * 0.08, 0.82 + rng() * 0.08]
      : [0.32 + rng() * 0.36];
    addCorticalBottomUpwardRouteAnchorsForColumn({
      column,
      targetCount,
      verticalSlots,
      neurons,
      rng,
      minX,
      maxX,
      layer,
      validators
    });
  });
}

function addCorticalBottomUpwardRouteAnchorsForColumn(options) {
  const { column, targetCount, verticalSlots, neurons, rng, minX, maxX, layer, validators } = options;
    let acceptedCount = 0;
    let attempts = 0;

    while (acceptedCount < targetCount && attempts < targetCount * 96) {
      attempts++;
      const xInset = min(7, column.width * 0.1);
      const slot = verticalSlots[acceptedCount] ?? rng();
      const columnBandTop = layer.top + 24;
      const columnBandBottom = layer.bottom - 14;
      const candidate = {
        layerIndex: 4,
        x: constrain(
          lerp(
            column.minX + xInset,
            column.maxX - xInset,
            constrain((acceptedCount % 2 === 0 ? 0.24 : 0.74) + corticalRand(rng, -0.18, 0.18), 0.08, 0.92)
          ),
          minX,
          maxX
        ),
        y: constrain(
          lerp(columnBandTop, columnBandBottom, slot) + corticalRand(rng, -8, 8),
          layer.top + 20,
          layer.bottom - 10
        ),
        scale: corticalRand(rng, 0.74, 1.02),
        flip: rng() < 0.5 ? -1 : 1,
        alpha: corticalRand(rng, 178, 216),
        forceInvertedApRoute: true,
        bottomUpwardRouteAnchor: true
      };

      if (validators.overlapsBottomLeftCapillaryJunction(candidate)) continue;
      if (attempts < targetCount * 46 && validators.overlapsVasculature(candidate, 1)) continue;
      if (validators.isTooCloseToNeurons(candidate, neurons) && attempts < targetCount * 68) continue;

      candidate.behindVasculature = validators.overlapsVasculature(candidate, 2);
      candidate.neuronId = `cortical-neuron-${corticalNeuronIdCounter++}`;
      candidate.dendriteExtensions = buildCorticalDendriteExtensions(candidate, rng);
      candidate.axonExtensions = buildCorticalAxonExtensions(candidate, rng);
      neurons.push(candidate);
      acceptedCount++;
    }
}

function assignCorticalInvertedApRouteNeurons(neurons, rng) {
  const columns = getCorticalActivationColumns();
  neurons.forEach((neuron) => {
    neuron.invertedApRoute = Boolean(neuron.forceInvertedApRoute);
  });

  columns.forEach((column, columnIndex) => {
    const candidates = neurons
      .filter((neuron) => neuron.layerIndex > 0)
      .filter((neuron) => !neuron.forceDownwardApRoute)
      .filter((neuron) => neuron.x >= column.minX - 16 && neuron.x <= column.maxX + 16)
      .sort((a, b) => {
        const aDepthScore = abs(a.y - lerp(CORTICAL_LAYER_BANDS[4].top, CORTICAL_LAYER_BANDS[2].bottom, 0.5)) * 0.16;
        const bDepthScore = abs(b.y - lerp(CORTICAL_LAYER_BANDS[4].top, CORTICAL_LAYER_BANDS[2].bottom, 0.5)) * 0.16;
        const aScore = abs(a.x - column.centerX) * 0.36 + aDepthScore + corticalRand(rng, 0, 38);
        const bScore = abs(b.x - column.centerX) * 0.36 + bDepthScore + corticalRand(rng, 0, 38);
        return aScore - bScore;
      });
    const bandTargets = [
      { top: CORTICAL_LAYER_BANDS[4].top, bottom: CORTICAL_LAYER_BANDS[4].bottom },
      { top: CORTICAL_LAYER_BANDS[3].top, bottom: CORTICAL_LAYER_BANDS[3].bottom },
      { top: CORTICAL_LAYER_BANDS[2].top, bottom: CORTICAL_LAYER_BANDS[2].bottom },
      { top: CORTICAL_LAYER_BANDS[1].top, bottom: CORTICAL_LAYER_BANDS[1].bottom }
    ];
    const selected = new Set();
    bandTargets.forEach((band) => {
      const bandCandidate = candidates.find((neuron) => (
        !selected.has(neuron.neuronId) &&
        neuron.y >= band.top - 8 &&
        neuron.y <= band.bottom + 8
      ));
      if (bandCandidate) selected.add(bandCandidate.neuronId);
    });

    const targetCount = columnIndex >= 2 && columnIndex <= 10 ? 6 : 5;
    candidates.forEach((neuron) => {
      if (selected.size >= targetCount) return;
      selected.add(neuron.neuronId);
    });

    candidates.forEach((neuron) => {
      if (!selected.has(neuron.neuronId)) return;
      neuron.invertedApRoute = true;
    });
  });
}

function buildCorticalAstrocyteLayout() {
  const rng = createCorticalRng(92837);
  const neurons = getCorticalNeuronLayout();
  const vascularData = ensureCorticalMicrovascularFlowData();
  const vascularAvoidancePoints = getCorticalVascularAvoidancePoints(vascularData.outlinePreview);
  const astrocytes = [];
  const minX = -CORTICAL_COLUMN_FRAME.width * 0.5 + 32;
  const maxX = CORTICAL_COLUMN_FRAME.width * 0.5 - 32;

  function buildAstrocyteArms(armRng, minLength = 4.2, maxLength = 7.2) {
    const armCount = 4 + floor(armRng() * 2);
    return Array.from({ length: armCount }, (_, armIndex) => {
      const angle = (TWO_PI * armIndex) / armCount + corticalRand(armRng, -0.42, 0.42);
      return {
        angle,
        length: corticalRand(armRng, minLength, maxLength),
        bend: corticalRand(armRng, 0.22, 0.42) * (armRng() < 0.5 ? -1 : 1),
        endfootW: corticalRand(armRng, 2.1, 2.8),
        endfootH: corticalRand(armRng, 1.3, 1.8)
      };
    });
  }

  CORTICAL_LAYER_BANDS.forEach((layer, layerIndex) => {
    const targetCount = max(8, floor((CORTICAL_NEURON_COUNTS[layerIndex] || 8) * 0.62));
    const layerTop = layer.top + 18;
    const layerBottom = layer.bottom - 18;
    const layerWidth = maxX - minX;
    const layerHeight = max(1, layerBottom - layerTop);
    const columns = max(3, ceil(sqrt(targetCount * (layerWidth / layerHeight) * 0.65)));
    const rows = max(2, ceil(targetCount / columns));
    const slots = [];
    let attempts = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        slots.push({ row, col, sortKey: rng() });
      }
    }
    slots.sort((a, b) => a.sortKey - b.sortKey);

    function buildAstrocyteCandidate(slot) {
      const cellLeft = lerp(minX, maxX, slot.col / columns);
      const cellRight = lerp(minX, maxX, (slot.col + 1) / columns);
      const cellTop = lerp(layerTop, layerBottom, slot.row / rows);
      const cellBottom = lerp(layerTop, layerBottom, (slot.row + 1) / rows);
      const cellCenterX = (cellLeft + cellRight) * 0.5;
      const cellCenterY = (cellTop + cellBottom) * 0.5;
      const jitterX = max(3, (cellRight - cellLeft) * 0.32);
      const jitterY = max(3, (cellBottom - cellTop) * 0.32);
      return {
        layerIndex,
        x: constrain(cellCenterX + corticalRand(rng, -jitterX, jitterX), cellLeft + 6, cellRight - 6),
        y: constrain(cellCenterY + corticalRand(rng, -jitterY, jitterY), cellTop + 5, cellBottom - 5),
        radius: corticalRand(rng, 2.1, 3.0),
        alpha: corticalRand(rng, 126, 168),
        nucleusAlpha: corticalRand(rng, 150, 196)
      };
    }

    function hasCrowdedAstrocyteNeighborhood(candidate) {
      let nearCount = 0;
      return astrocytes.some((astro) => {
        const dx = candidate.x - astro.x;
        const dy = candidate.y - astro.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < 22 * 22) return true;
        if (distanceSq < 58 * 58) nearCount++;
        return nearCount > 1;
      });
    }

    while (astrocytes.filter((astro) => astro.layerIndex === layerIndex).length < targetCount && attempts < targetCount * 60) {
      attempts++;
      const slot = slots[(attempts - 1) % slots.length];
      const candidate = buildAstrocyteCandidate(slot);

      const tooCloseToNeuron = neurons.some((neuron) => {
        const dx = candidate.x - neuron.x;
        const dy = candidate.y - neuron.y;
        return dx * dx + dy * dy < 16 * 16;
      });
      if (tooCloseToNeuron) continue;

      const overlapsVasculature = vascularAvoidancePoints.some((point) => {
        const dx = candidate.x - point.x;
        const dy = candidate.y - point.y;
        const astrocyteFootprintRadius = candidate.radius + 16;
        const radius = point.radius + astrocyteFootprintRadius;
        return dx * dx + dy * dy < radius * radius;
      });
      if (overlapsVasculature) continue;

      const tooCloseToAstrocyte = astrocytes.some((astro) => {
        const dx = candidate.x - astro.x;
        const dy = candidate.y - astro.y;
        return dx * dx + dy * dy < 22 * 22;
      });
      if (tooCloseToAstrocyte) continue;
      if (hasCrowdedAstrocyteNeighborhood(candidate)) continue;

      candidate.arms = buildAstrocyteArms(rng);

      astrocytes.push(candidate);
    }
  });

  const gapFillRng = createCorticalRng(61843);
  const gapFillRegions = [
    { minX: 250, maxX: 505, minY: -42, maxY: 356, count: 34, avoidVasculature: true },
    { minX: -285, maxX: 285, minY: 86, maxY: 166, count: 24, avoidVasculature: false },
    { minX: -455, maxX: 455, minY: 226, maxY: 326, count: 38, avoidVasculature: false }
  ];

  function getAstrocyteLayerIndex(y) {
    const index = CORTICAL_LAYER_BANDS.findIndex((layer) => y >= layer.top && y <= layer.bottom);
    return index >= 0 ? index : CORTICAL_LAYER_BANDS.length - 1;
  }

  function supplementalOverlapsNeuron(candidate) {
    return neurons.some((neuron) => {
      const dx = candidate.x - neuron.x;
      const dy = candidate.y - neuron.y;
      return dx * dx + dy * dy < 13 * 13;
    });
  }

  function supplementalOverlapsVasculature(candidate) {
    return vascularAvoidancePoints.some((point) => {
      const dx = candidate.x - point.x;
      const dy = candidate.y - point.y;
      const radius = point.radius + candidate.radius + 11;
      return dx * dx + dy * dy < radius * radius;
    });
  }

  function supplementalTooCloseToAstrocyte(candidate) {
    return astrocytes.some((astro) => {
      const dx = candidate.x - astro.x;
      const dy = candidate.y - astro.y;
      return dx * dx + dy * dy < 18 * 18;
    });
  }

  gapFillRegions.forEach((region) => {
    let acceptedCount = 0;
    let attempts = 0;

    while (acceptedCount < region.count && attempts < region.count * 80) {
      attempts++;
      const candidate = {
        layerIndex: getAstrocyteLayerIndex(corticalRand(gapFillRng, region.minY, region.maxY)),
        x: corticalRand(gapFillRng, region.minX, region.maxX),
        y: corticalRand(gapFillRng, region.minY, region.maxY),
        radius: corticalRand(gapFillRng, 2.0, 2.8),
        alpha: corticalRand(gapFillRng, 118, 158),
        nucleusAlpha: corticalRand(gapFillRng, 140, 184)
      };
      candidate.layerIndex = getAstrocyteLayerIndex(candidate.y);

      if (supplementalOverlapsNeuron(candidate)) continue;
      if (region.avoidVasculature !== false && supplementalOverlapsVasculature(candidate)) continue;
      if (supplementalTooCloseToAstrocyte(candidate)) continue;

      candidate.arms = buildAstrocyteArms(gapFillRng, 3.8, 6.8);
      astrocytes.push(candidate);
      acceptedCount++;
    }
  });

  return astrocytes;
}

function buildCorticalMicrogliaLayout() {
  const rng = createCorticalRng(77131);
  const astrocytes = getCorticalAstrocyteLayout();
  const neurons = getCorticalNeuronLayout();
  const targetCount = getCorticalAgingMicrogliaCount(max(1, floor(astrocytes.length * 0.25)));
  const microglia = [];
  const minX = CORTICAL_VIEW_BOUNDS.left + 46;
  const maxX = CORTICAL_VIEW_BOUNDS.right - 46;
  const minY = CORTICAL_LAYER_BANDS[0].top + 10;
  const maxY = CORTICAL_VIEW_BOUNDS.bottom - 28;

  function tooCloseToNeuron(candidate) {
    return neurons.some((neuron) => {
      const dx = candidate.x - neuron.x;
      const dy = candidate.y - neuron.y;
      return dx * dx + dy * dy < 15 * 15;
    });
  }

  function tooCloseToMicroglia(candidate, spacing = 34) {
    return microglia.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < spacing * spacing;
    });
  }

  const totalLayerHeight = CORTICAL_LAYER_BANDS.reduce((sum, layer) => sum + max(1, layer.bottom - layer.top), 0);
  const layerQuotas = CORTICAL_LAYER_BANDS.map((layer, index) => {
    const exact = targetCount * (max(1, layer.bottom - layer.top) / totalLayerHeight);
    return {
      index,
      count: floor(exact),
      remainder: exact - floor(exact)
    };
  });
  let assignedCount = layerQuotas.reduce((sum, layer) => sum + layer.count, 0);
  layerQuotas
    .slice()
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((layer) => {
      if (assignedCount < targetCount) {
        layerQuotas[layer.index].count++;
        assignedCount++;
      }
    });

  layerQuotas.forEach(({ index, count }) => {
    const layer = CORTICAL_LAYER_BANDS[index] || CORTICAL_LAYER_BANDS[1];
    let acceptedCount = 0;
    let attempts = 0;

    while (acceptedCount < count && attempts < count * 120) {
      attempts++;
      const sliceWidth = (maxX - minX) / max(1, count);
      const sliceCenter = minX + sliceWidth * (acceptedCount + 0.5);
      const candidate = {
        x: constrain(sliceCenter + corticalRand(rng, -sliceWidth * 0.36, sliceWidth * 0.36), minX, maxX),
        y: constrain(corticalRand(rng, layer.top + 10, layer.bottom - 10), minY, maxY),
        scale: corticalRand(rng, 0.098, 0.129),
        rotation: corticalRand(rng, -PI, PI),
        phase: corticalRand(rng, 0, TWO_PI)
      };

      const relaxedSpacing = attempts > count * 64 ? 27 : 34;
      if (tooCloseToNeuron(candidate)) continue;
      if (tooCloseToMicroglia(candidate, relaxedSpacing)) continue;
      microglia.push(candidate);
      acceptedCount++;
    }
  });

  return microglia;
}

function buildCorticalInsomniaMicrogliaLayout() {
  const rng = createCorticalRng(44791);
  const baseMicroglia = getCorticalMicrogliaLayout();
  const neurons = getCorticalNeuronLayout();
  const supplemental = [];
  const minX = CORTICAL_VIEW_BOUNDS.left + 58;
  const maxX = CORTICAL_VIEW_BOUNDS.right - 58;
  const zones = 6;
  const targetCount = CORTICAL_INSOMNIA_MICROGLIA_MAX_ADDITIONAL;

  function tooCloseToMicroglia(candidate, cells, spacing = 44) {
    return cells.some((cell) => {
      const dx = candidate.x - cell.x;
      const dy = candidate.y - cell.y;
      return dx * dx + dy * dy < spacing * spacing;
    });
  }

  function tooCloseToNeuron(candidate) {
    return neurons.some((neuron) => {
      const dx = candidate.x - neuron.x;
      const dy = candidate.y - neuron.y;
      return dx * dx + dy * dy < 13 * 13;
    });
  }

  for (let index = 0; index < targetCount; index++) {
    const layerIndex = (index * 2 + floor(index / zones)) % CORTICAL_LAYER_BANDS.length;
    const layer = CORTICAL_LAYER_BANDS[layerIndex] || CORTICAL_LAYER_BANDS[2];
    const zoneIndex = index % zones;
    const zoneWidth = (maxX - minX) / zones;
    const zoneLeft = minX + zoneWidth * zoneIndex;
    const zoneRight = zoneLeft + zoneWidth;
    let accepted = null;
    let attempts = 0;

    while (!accepted && attempts < 80) {
      attempts++;
      const candidate = {
        x: corticalRand(rng, zoneLeft + 14, zoneRight - 14),
        y: corticalRand(rng, layer.top + 16, layer.bottom - 16),
        scale: corticalRand(rng, 0.104, 0.128),
        rotation: corticalRand(rng, -PI, PI),
        phase: corticalRand(rng, 0, TWO_PI),
        insomniaSupplementalMicroglia: true
      };

      const relaxedSpacing = attempts > 48 ? 36 : 44;
      if (tooCloseToNeuron(candidate)) continue;
      if (tooCloseToMicroglia(candidate, baseMicroglia, relaxedSpacing)) continue;
      if (tooCloseToMicroglia(candidate, supplemental, relaxedSpacing)) continue;
      accepted = candidate;
    }

    if (accepted) supplemental.push(accepted);
  }

  return supplemental;
}

function getCorticalVascularAvoidancePoints(outlinePreview) {
  if (!outlinePreview?.fillPixels?.length) return [];
  if (outlinePreview.avoidancePoints) return outlinePreview.avoidancePoints;

  const worldScaleX = outlinePreview.worldWidth / max(1, outlinePreview.width);
  const worldScaleY = outlinePreview.worldHeight / max(1, outlinePreview.height);
  const coarseBuckets = new Set();
  const avoidancePoints = [];

  outlinePreview.fillPixels.forEach((pixel) => {
    const worldX = CORTICAL_VASCULATURE_BOUNDS.left + pixel.x * worldScaleX;
    const worldY = CORTICAL_VASCULATURE_BOUNDS.top + pixel.y * worldScaleY;
    const leftSide = worldX < 0;
    const bucketSize = leftSide ? 4 : 6;
    const bucketX = floor(pixel.x / bucketSize);
    const bucketY = floor(pixel.y / bucketSize);
    const key = `${leftSide ? "L" : "R"}:${bucketX}:${bucketY}`;
    if (coarseBuckets.has(key)) return;
    coarseBuckets.add(key);
    avoidancePoints.push({
      x: worldX,
      y: worldY,
      radius: leftSide ? 13.5 : 11
    });
  });

  outlinePreview.avoidancePoints = avoidancePoints;
  return avoidancePoints;
}

function getCorticalNeuronActivationState() {
  if (!window.corticalNeuronActivationState) {
    window.corticalNeuronActivationState = {
      active: [],
      nextTriggerTime: (60 + Math.random() * 84) / CORTICAL_AP_SPEED_SCALE,
      nextDirection: "down",
      nextColumnIndex: 0,
      inhibitoryResponseUntil: new Map(),
      spontaneousInhibitoryFirings: [],
      nextSpontaneousInhibitoryFireByKey: new Map(),
      metabolicWasteApCounter: 0,
      epilepsyWaves: [],
      epilepsyRecruitedMicroglia: [],
      nextEpilepsyWaveTime: 0,
      epilepsyEnabledLastFrame: false,
      epilepsyAutoDisableTime: Infinity
    };
  }
  return window.corticalNeuronActivationState;
}

function updateCorticalNeuronActivation() {
  const corticalState = getCorticalViewState();
  const activationState = getCorticalNeuronActivationState();
  const now = corticalState.time;

  activationState.active = (activationState.active || []).filter((activation) => now <= activation.endTime);
  updateCorticalEpilepsyWaveState(activationState, now);

  if (now >= activationState.nextTriggerTime) {
    if (activationState.active.length < getCorticalAgingApActiveLimit()) {
      const reservedRouteKeys = getReservedCorticalActivationRouteKeys(activationState.active);
      let triggeredActivation = false;
      for (let attempt = 0; attempt < 4; attempt++) {
        const activation = buildRandomCorticalNeuronActivation(now, reservedRouteKeys);
        if (!activation?.complete || !activation?.edges?.length) continue;
        activationState.active.push(activation);
        triggeredActivation = true;
        break;
      }
      if (!triggeredActivation) {
        activationState.nextColumnIndex = floor(Math.random() * CORTICAL_AP_COLUMN_COUNT);
      }
    }
    activationState.nextTriggerTime = now + ((72 + Math.random() * 108) * getCorticalApGenerationIntervalMultiplier()) / CORTICAL_AP_SPEED_SCALE;
  }
}

function resetCorticalEpilepsyWaveState(activationState, now) {
  activationState.epilepsyWaves = [];
  activationState.epilepsyRecruitedMicroglia = [];
  activationState.nextEpilepsyWaveTime = now;
  activationState.epilepsyEnabledLastFrame = false;
  activationState.epilepsyAutoDisableTime = Infinity;
}

function getCorticalEpilepsyWaveMaxRadius(source) {
  if (!source) return 0;
  const corners = [
    { x: CORTICAL_VIEW_BOUNDS.left, y: CORTICAL_VIEW_BOUNDS.top },
    { x: CORTICAL_VIEW_BOUNDS.right, y: CORTICAL_VIEW_BOUNDS.top },
    { x: CORTICAL_VIEW_BOUNDS.left, y: CORTICAL_VIEW_BOUNDS.bottom },
    { x: CORTICAL_VIEW_BOUNDS.right, y: CORTICAL_VIEW_BOUNDS.bottom }
  ];
  return max(...corners.map((corner) => dist(source.x, source.y, corner.x, corner.y))) + 80;
}

function chooseCorticalEpilepsySourceNeuron() {
  const candidates = getCorticalNeuralSignalNodes().filter((node) => (
    node &&
    node.x >= CORTICAL_VIEW_BOUNDS.left &&
    node.x <= CORTICAL_VIEW_BOUNDS.right &&
    node.y >= CORTICAL_VIEW_BOUNDS.top &&
    node.y <= CORTICAL_VIEW_BOUNDS.bottom
  ));
  if (!candidates.length) return null;
  return candidates[floor(Math.random() * candidates.length)];
}

function spawnCorticalEpilepsyWave(activationState, now) {
  const source = chooseCorticalEpilepsySourceNeuron();
  if (!source) return;
  activationState.epilepsyWaves.push({
    source,
    startTime: now,
    maxRadius: getCorticalEpilepsyWaveMaxRadius(source),
    firedNeuronIds: new Set(),
    recruitedMicroglia: []
  });
}

function getCorticalEpilepsyMicrogliaEdgeStart(angle, offset = 30) {
  const cx = (CORTICAL_VIEW_BOUNDS.left + CORTICAL_VIEW_BOUNDS.right) * 0.5;
  const cy = (CORTICAL_VIEW_BOUNDS.top + CORTICAL_VIEW_BOUNDS.bottom) * 0.5;
  const dx = cos(angle);
  const dy = sin(angle);
  const xEdge = dx < 0 ? CORTICAL_VIEW_BOUNDS.left - offset : CORTICAL_VIEW_BOUNDS.right + offset;
  const yAtX = cy + ((xEdge - cx) / max(0.001, dx)) * dy;
  if (yAtX >= CORTICAL_VIEW_BOUNDS.top - offset && yAtX <= CORTICAL_VIEW_BOUNDS.bottom + offset) {
    return { x: xEdge, y: yAtX };
  }
  const yEdge = dy < 0 ? CORTICAL_VIEW_BOUNDS.top - offset : CORTICAL_VIEW_BOUNDS.bottom + offset;
  const xAtY = cx + ((yEdge - cy) / max(0.001, dy)) * dx;
  return { x: xAtY, y: yEdge };
}

function spawnCorticalEpilepsyRecruitedMicroglia(wave, now, index) {
  const angle = (TWO_PI * index) / CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT + random(-0.18, 0.18);
  const start = getCorticalEpilepsyMicrogliaEdgeStart(angle, 42 + random(0, 26));
  const depthBand = 0.26 + ((index * 7) % CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT) / CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT * 0.52;
  const fieldX = lerp(
    CORTICAL_VIEW_BOUNDS.left + 72,
    CORTICAL_VIEW_BOUNDS.right - 72,
    ((index * 5 + 2) % CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT) / max(1, CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT - 1)
  );
  const fieldY = lerp(
    CORTICAL_VIEW_BOUNDS.top + 52,
    CORTICAL_VIEW_BOUNDS.bottom - 52,
    ((index * 11 + 3) % CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT) / max(1, CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT - 1)
  );
  return {
    x: start.x,
    y: start.y,
    entryX: start.x,
    entryY: start.y,
    fieldTargetX: fieldX,
    fieldTargetY: fieldY,
    depthBand,
    angle,
    epilepsyWaveStartTime: wave.startTime,
    epilepsyRecruitedMicroglia: true,
    scale: random(0.108, 0.135),
    rotation: angle + PI + random(-0.42, 0.42),
    phase: random(TWO_PI),
    speed: random(0.021, 0.038),
    bornAt: now,
    settleWanderPhase: random(TWO_PI)
  };
}

function updateCorticalEpilepsyRecruitedMicroglia(activationState, now) {
  if (!activationState.epilepsyWaves?.length) {
    activationState.epilepsyRecruitedMicroglia = [];
    return;
  }

  const wave = activationState.epilepsyWaves[activationState.epilepsyWaves.length - 1];
  if (!wave.recruitedMicroglia) wave.recruitedMicroglia = [];
  const radius = getCorticalEpilepsyWaveRadius(wave, now);
  if (radius < wave.maxRadius) {
    activationState.epilepsyRecruitedMicroglia = [];
    return;
  }

  if (!wave.microgliaRecruitmentStartTime) {
    wave.microgliaRecruitmentStartTime = now;
  }
  const recruitmentElapsed = now - wave.microgliaRecruitmentStartTime;
  const waveProgress = constrain(recruitmentElapsed / 4200, 0, 1);
  const targetCount = min(
    CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT,
    floor(lerp(3, CORTICAL_EPILEPSY_RECRUITED_MICROGLIA_COUNT, waveProgress))
  );
  while (wave.recruitedMicroglia.length < targetCount) {
    wave.recruitedMicroglia.push(
      spawnCorticalEpilepsyRecruitedMicroglia(wave, now, wave.recruitedMicroglia.length)
    );
  }

  const dtScale = (getCorticalViewState().dt || 16.67) / 16.67;
  wave.recruitedMicroglia.forEach((cell, index) => {
    const penetration = lerp(cell.depthBand || 0.46, min(0.84, (cell.depthBand || 0.46) + 0.22), waveProgress);
    const lateralAngle = cell.angle + HALF_PI;
    const lateralOffset = ((index % 7) - 3) * 18;
    const radialX = lerp(cell.entryX ?? cell.x, wave.source.x, penetration);
    const radialY = lerp(cell.entryY ?? cell.y, wave.source.y, penetration);
    const fieldBlend = 0.52 + (index % 3) * 0.09;
    const targetX = constrain(
      lerp(radialX, cell.fieldTargetX ?? radialX, fieldBlend) + cos(lateralAngle) * lateralOffset,
      CORTICAL_VIEW_BOUNDS.left + 48,
      CORTICAL_VIEW_BOUNDS.right - 48
    );
    const targetY = constrain(
      lerp(radialY, cell.fieldTargetY ?? radialY, fieldBlend) + sin(lateralAngle) * lateralOffset,
      CORTICAL_VIEW_BOUNDS.top + 42,
      CORTICAL_VIEW_BOUNDS.bottom - 42
    );
    const dx = targetX - cell.x;
    const dy = targetY - cell.y;
    const distanceToTarget = sqrt(dx * dx + dy * dy);
    const step = min(distanceToTarget, cell.speed * 58 * dtScale);
    if (distanceToTarget > 0.001) {
      cell.x += (dx / distanceToTarget) * step;
      cell.y += (dy / distanceToTarget) * step;
      cell.rotation = lerp(cell.rotation || 0, atan2(dy, dx), 0.035 * dtScale);
    }
    cell.targetX = targetX;
    cell.targetY = targetY;
    cell.settled = distanceToTarget < 12;
  });
  activationState.epilepsyRecruitedMicroglia = wave.recruitedMicroglia;
}

function updateCorticalEpilepsyWaveState(activationState, now) {
  if (!activationState.epilepsyWaves) activationState.epilepsyWaves = [];
  if (!isCorticalEpilepsyEnabled()) {
    if (activationState.epilepsyEnabledLastFrame || activationState.epilepsyWaves.length) {
      resetCorticalEpilepsyWaveState(activationState, now);
    }
    return;
  }

  if (!activationState.epilepsyEnabledLastFrame) {
    activationState.nextEpilepsyWaveTime = now;
    activationState.epilepsyEnabledLastFrame = true;
    activationState.epilepsyAutoDisableTime = now + CORTICAL_EPILEPSY_SUPPRESSION_MS;
  }

  activationState.epilepsyWaves = activationState.epilepsyWaves.filter((wave) => {
    const waveAge = now - wave.startTime;
    return waveAge <= (wave.maxRadius / CORTICAL_EPILEPSY_WAVE_SPEED) + CORTICAL_EPILEPSY_SUPPRESSION_MS;
  });

  if (!activationState.epilepsyWaves.length && now >= (activationState.nextEpilepsyWaveTime || 0)) {
    spawnCorticalEpilepsyWave(activationState, now);
  }

  if (now >= (activationState.epilepsyAutoDisableTime || Infinity)) {
    window.corticalEpilepsyEnabled = false;
    const epilepsyToggle = typeof document !== "undefined"
      ? document.getElementById("corticalEpilepsyToggle")
      : null;
    if (epilepsyToggle) epilepsyToggle.checked = false;
    resetCorticalEpilepsyWaveState(activationState, now);
    return;
  }

  const activeWave = activationState.epilepsyWaves[activationState.epilepsyWaves.length - 1];
  if (activeWave) {
    const waveTravelMs = activeWave.maxRadius / CORTICAL_EPILEPSY_WAVE_SPEED;
    activationState.nextEpilepsyWaveTime = activeWave.startTime + waveTravelMs + CORTICAL_EPILEPSY_SUPPRESSION_MS + CORTICAL_EPILEPSY_REPEAT_DELAY_MS;
  }
  updateCorticalEpilepsyRecruitedMicroglia(activationState, now);
}

function getReservedCorticalActivationRouteKeys(activations) {
  const reservedRouteKeys = new Set();
  (activations || []).forEach((activation) => {
    (activation.routeKeys || []).forEach((key) => reservedRouteKeys.add(key));
  });
  return reservedRouteKeys;
}

function getCorticalInhibitoryActivationKey(cell) {
  return `${cell.type}:${round(cell.x)}:${round(cell.y)}`;
}

function getCorticalSignalLayerIndex(y) {
  const bandIndex = CORTICAL_LAYER_BANDS.findIndex((band) => y >= band.top && y <= band.bottom);
  if (bandIndex >= 0) return bandIndex;
  if (y < CORTICAL_LAYER_BANDS[0].top) return 0;
  return CORTICAL_LAYER_BANDS.length;
}

function createCorticalSignalNode(cell, type, index, overrides = {}) {
  const layerIndex = overrides.layerIndex ?? getCorticalSignalLayerIndex(cell.y);
  const bin = floor((cell.x + CORTICAL_COLUMN_FRAME.width * 0.5) / 54);
  return {
    ...cell,
    ...overrides,
    type,
    neuronId: overrides.neuronId ?? `${type}-${index}`,
    layerIndex,
    routeKeys: [bin - 1, bin, bin + 1].map((routeBin) => `${layerIndex}:${routeBin}`),
    isInhibitory: type === "inhibitory" || type === "inhibitory-type-2"
  };
}

function getCorticalNeuralSignalNodes() {
  if (corticalSignalNodeLayout) return corticalSignalNodeLayout;
  corticalSignalNodeLayout = [
    ...getCorticalNeuronLayout().map((neuron, index) => createCorticalSignalNode(neuron, "pyramidal", index, {
      neuronId: neuron.neuronId,
      layerIndex: neuron.layerIndex,
      isInhibitory: false
    })),
    ...getCorticalCrNeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "cr", index, { layerIndex: 0 })),
    ...getCorticalSgNeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "sg", index)),
    ...getCorticalFusiformNeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "fusiform", index)),
    ...getCorticalInhibitoryNeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "inhibitory", index)),
    ...getCorticalInhibitoryType2NeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "inhibitory-type-2", index))
  ];
  return corticalSignalNodeLayout;
}

function getCorticalActivationColumns() {
  const inset = 0;
  const left = CORTICAL_VIEW_BOUNDS.left + inset;
  const right = CORTICAL_VIEW_BOUNDS.right - inset;
  const columnWidth = (right - left) / CORTICAL_AP_COLUMN_COUNT;
  return Array.from({ length: CORTICAL_AP_COLUMN_COUNT }, (_, index) => ({
    name: `column-${index + 1}`,
    columnIndex: index,
    minX: left + columnWidth * index,
    maxX: left + columnWidth * (index + 1),
    centerX: left + columnWidth * (index + 0.5),
    width: columnWidth
  }));
}

function getCorticalActivationRouteBank() {
  if (corticalActivationRouteBank) return corticalActivationRouteBank;
  corticalActivationRouteBank = buildCorticalEndpointActivationRouteBank();
  return corticalActivationRouteBank;
}

function buildCorticalEndpointActivationRouteBank() {
  const nodes = getCorticalNeuralSignalNodes();
  const rng = createCorticalRng(91427);
  const columns = getCorticalActivationColumns();
  const routes = [];

  columns.forEach((column) => {
    const columnNodes = nodes.filter((node) => node.x >= column.minX - 22 && node.x <= column.maxX + 22);
    const upwardNodes = nodes.filter((node) => (
      node.invertedApRoute &&
      !node.isInhibitory &&
      node.x >= column.minX - column.width * 0.72 &&
      node.x <= column.maxX + column.width * 0.72
    ));
    for (let routeIndex = 0; routeIndex < 12; routeIndex++) {
      const downRoute = buildCorticalEndpointActivationRoute(columnNodes, column, rng, routeIndex, "down");
      const upRoute = buildCorticalEndpointActivationRoute(upwardNodes, column, rng, routeIndex, "up");
      if (downRoute?.edges?.length) routes.push(downRoute);
      if (upRoute?.edges?.length) routes.push(upRoute);
    }
  });

  return routes;
}

function getCorticalPrimaryEndpointTargets(node) {
  const endpoints = getCorticalActivationEndpointTargets(node);
  return {
    dendrite: endpoints.dendrites[0] || { x: node.x, y: node.y },
    axon: endpoints.axons[0] || { x: node.x, y: node.y }
  };
}

function buildCorticalEndpointActivationRoute(columnNodes, column, rng, routeIndex = 0, direction = "down") {
  const isUp = direction === "up";
  const nodesWithEndpoints = columnNodes
    .map((node) => ({
      node,
      endpoints: getCorticalPrimaryEndpointTargets(node)
    }))
    .filter((entry) => entry.endpoints.dendrite && entry.endpoints.axon)
    .sort((a, b) => isUp ? b.node.y - a.node.y : a.node.y - b.node.y);

  if (nodesWithEndpoints.length < 2) return null;

  const startCandidates = nodesWithEndpoints
    .filter((entry) => isUp
      ? entry.node.y >= CORTICAL_LAYER_BANDS[3].top - 18
      : entry.node.y <= CORTICAL_LAYER_BANDS[1].bottom + 34)
    .sort((a, b) => {
      const aScore = abs(a.node.x - column.centerX) * 0.58 + (isUp ? -a.node.y * 0.34 : a.node.y * 0.18);
      const bScore = abs(b.node.x - column.centerX) * 0.58 + (isUp ? -b.node.y * 0.34 : b.node.y * 0.18);
      return aScore - bScore;
    });
  const rootEntry = startCandidates[routeIndex % max(1, startCandidates.length)] || nodesWithEndpoints[0];
  if (!rootEntry) return null;

  const edges = [];
  const propagationOrder = [];
  const usedIds = new Set();
  let current = rootEntry;
  let currentTime = 0;

  function addEdge(from, to, duration, kind = "excitatory") {
    const startTime = currentTime;
    const endTime = startTime + duration;
    edges.push({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      startTime,
      endTime,
      kind
    });
    currentTime = endTime + 18 + rng() * 18;
  }

  function addTimedEdge(from, to, startTime, duration, kind = "excitatory") {
    edges.push({
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      startTime,
      endTime: startTime + duration,
      kind
    });
  }

  function getEndpointTravelDuration(from, to, durationScale = 1) {
    return constrain(dist(from.x, from.y, to.x, to.y) * durationScale, 92, 242);
  }

  for (let hopIndex = 0; hopIndex < 7 && current; hopIndex++) {
    const { node, endpoints } = current;
    if (usedIds.has(node.neuronId)) break;
    usedIds.add(node.neuronId);

    addEdge(
      endpoints.dendrite,
      node,
      68,
      isUp ? "upward-dendrite-to-soma" : (node.isInhibitory ? "inhibitory-dendrite-to-soma" : "dendrite-to-soma")
    );
    propagationOrder.push({ neuron: node, time: currentTime });
    addEdge(
      node,
      endpoints.axon,
      node.isInhibitory ? 320 : 84,
      isUp ? "upward-soma-to-axon" : (node.isInhibitory ? "inhibitory-soma-to-axon" : "soma-to-axon")
    );

    const downstream = nodesWithEndpoints
      .filter((entry) => !usedIds.has(entry.node.neuronId))
      .map((entry) => {
        const targetDendrite = entry.endpoints.dendrite;
        const forwardDistance = isUp ? endpoints.axon.y - targetDendrite.y : targetDendrite.y - endpoints.axon.y;
        if (forwardDistance < 20 || forwardDistance > (isUp ? 126 : 142)) return null;
        const lateralDistance = abs(targetDendrite.x - endpoints.axon.x);
        if (lateralDistance > column.width * (isUp ? 1.12 : 0.95)) return null;
        return {
          entry,
          score:
            lateralDistance * (isUp ? 0.95 : 1.1) +
            abs(forwardDistance - (isUp ? 74 : 72)) * 0.76 +
            abs(entry.node.x - column.centerX) * (isUp ? 0.18 : 0.22) +
            rng() * (isUp ? 26 : 24)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score);

    if (!downstream.length) break;

    if (rng() < (isUp ? 0.78 : 0.38) && downstream.length > 1) {
      const cascadeCandidates = nodesWithEndpoints
        .filter((entry) => !usedIds.has(entry.node.neuronId))
        .map((entry) => {
          const targetDendrite = entry.endpoints.dendrite;
          const forwardDistance = isUp ? endpoints.axon.y - targetDendrite.y : targetDendrite.y - endpoints.axon.y;
          if (forwardDistance < 18 || forwardDistance > (isUp ? 132 : 146)) return null;
          const lateralDistance = abs(targetDendrite.x - endpoints.axon.x);
          const minimumCrossColumnDistance = column.width * (isUp ? 0.62 : 0.48);
          const maximumCrossColumnDistance = column.width * (isUp ? 2.45 : 1.72);
          if (lateralDistance < minimumCrossColumnDistance || lateralDistance > maximumCrossColumnDistance) return null;
          return {
            entry,
            score:
              -lateralDistance * (isUp ? 1.15 : 0.8) +
              abs(forwardDistance - (isUp ? 78 : 74)) * 0.62 +
              rng() * (isUp ? 34 : 38)
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score);
      const cascadePool = cascadeCandidates.length > 1 ? cascadeCandidates : downstream.slice(1);
      const cascadeLimit = isUp ? min(5, cascadePool.length) : min(3, cascadePool.length);
      cascadePool.slice(0, cascadeLimit).forEach((cascade, cascadeIndex) => {
        const cascadeStart = currentTime + 18 + cascadeIndex * 34;
        const cascadeTarget = cascade.entry.endpoints.dendrite;
        const crossColumnDuration = getEndpointTravelDuration(
          endpoints.axon,
          cascadeTarget,
          isUp ? 1.34 : 1.24
        );
        const somaStart = cascadeStart + crossColumnDuration + 18 + cascadeIndex * 6;
        const axonStart = somaStart + (isUp ? 74 : 62) + 16 + cascadeIndex * 4;
        const cascadeKind = isUp ? "upward-axon-cascade-dendrite" : "axon-cascade-dendrite";
        addTimedEdge(
          endpoints.axon,
          cascadeTarget,
          cascadeStart,
          crossColumnDuration,
          cascadeKind
        );
        addTimedEdge(
          cascadeTarget,
          cascade.entry.node,
          somaStart,
          isUp ? 74 : 62,
          isUp ? "upward-cascade-dendrite-to-soma" : "cascade-dendrite-to-soma"
        );
        addTimedEdge(
          cascade.entry.node,
          cascade.entry.endpoints.axon,
          axonStart,
          isUp ? 88 : 76,
          isUp ? "upward-cascade-soma-to-axon" : "cascade-soma-to-axon"
        );
        propagationOrder.push({ neuron: cascade.entry.node, time: somaStart + 38 });
      });
    }

    const next = downstream[0].entry;
    addEdge(
      endpoints.axon,
      next.endpoints.dendrite,
      getEndpointTravelDuration(endpoints.axon, next.endpoints.dendrite, isUp ? 1.28 : 1.18),
      isUp ? "upward-axon-to-dendrite" : "axon-to-dendrite"
    );
    current = next;
  }

  if (edges.length < 3) return null;

  const routeEndTime = max(currentTime, ...edges.map((edge) => edge.endTime || 0));

  return {
    duration: routeEndTime + 260,
    segmentDuration: 170,
    lingerDuration: 70,
    direction,
    complete: true,
    reachedActivationEdge: false,
    typeCount: 1,
    types: [isUp ? "upward-endpoint-route" : "endpoint-route"],
    columnIndex: column.columnIndex,
    zoneIndex: column.columnIndex,
    zoneName: column.name,
    routeKeys: [`endpoint:${column.columnIndex}`],
    neuronsById: new Map(nodesWithEndpoints.map((entry) => [entry.node.neuronId, entry.node])),
    propagationOrder,
    edges
  };
}

function getCorticalActivationRouteCatalog() {
  if (corticalActivationRouteCatalog) return corticalActivationRouteCatalog;
  const routes = getCorticalActivationRouteBank();
  const columns = Array.from({ length: CORTICAL_AP_COLUMN_COUNT }, () => ({
    up: [],
    down: []
  }));

  routes.forEach((route) => {
    const columnIndex = constrain(route.columnIndex ?? 0, 0, columns.length - 1);
    if (route.direction === "up") {
      columns[columnIndex].up.push(route);
    } else if (route.direction === "down") {
      columns[columnIndex].down.push(route);
    }
  });

  corticalActivationRouteCatalog = { routes, columns };
  return corticalActivationRouteCatalog;
}

function instantiateCorticalActivationRoute(template, startTime) {
  const apSpeedScale = getCorticalApSpeedScale();
  return {
    startTime,
    endTime: startTime + template.duration / apSpeedScale,
    apSpeedScale,
    segmentDuration: template.segmentDuration,
    lingerDuration: template.lingerDuration,
    direction: template.direction,
    columnIndex: template.columnIndex,
    zoneIndex: template.zoneIndex,
    zoneName: template.zoneName,
    complete: template.complete,
    routeKeys: template.routeKeys,
    neuronsById: template.neuronsById,
    propagationOrder: template.propagationOrder,
    edges: template.edges,
    triggeredInhibitoryKeys: new Set(),
    inhibitoryResponses: [],
    metabolicWasteNeuronIds: new Set()
  };
}

function chooseCorticalActivationColumnIndex(direction) {
  if (direction !== "up") return floor(Math.random() * CORTICAL_AP_COLUMN_COUNT);

  const weights = [
    0.22, 0.38, 0.98, 1.48, 1.68, 1.56,
    1.42, 1.34, 1.24, 1.1, 0.94, 0.78
  ];
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let pick = Math.random() * totalWeight;
  for (let index = 0; index < weights.length; index++) {
    pick -= weights[index];
    if (pick <= 0) return index;
  }
  return floor(CORTICAL_AP_COLUMN_COUNT * 0.5);
}

function buildRandomCorticalNeuronActivation(startTime, reservedRouteKeys = new Set(), preferredDirection = null, preferredColumnIndex = null) {
  const { routes, columns } = getCorticalActivationRouteCatalog();
  if (!routes.length) return null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const direction = preferredDirection || (Math.random() < 0.42 ? "up" : "down");
    const columnIndex = preferredColumnIndex ?? chooseCorticalActivationColumnIndex(direction);
    const exactPool = columns[columnIndex]?.[direction] || [];
    const routePool = exactPool.length
      ? exactPool
      : columns
          .flatMap((column) => column[direction] || []);
    if (!routePool.length) continue;
    const template = routePool[floor(Math.random() * routePool.length)];
    if ((template.routeKeys || []).some((key) => reservedRouteKeys.has(key)) && Math.random() < 0.62) continue;
    return instantiateCorticalActivationRoute(template, startTime);
  }

  return null;
}

function spawnCorticalMetabolicWasteBurst(node, now) {
  if (!node) return;
  const wasteTypes = [
    { type: "waste", label: "", color: [184, 146, 102] },
    { type: "co2", label: "CO2", color: [200, 224, 244] },
    { type: "proton", label: "H+", color: [255, 224, 120] }
  ];

  wasteTypes.forEach((config, index) => {
    const angle = random(TWO_PI);
    const radius = random(7, 15) * CORTICAL_METABOLIC_WASTE_SCALE;
    corticalMetabolicWasteParticles.push({
      ...config,
      x: node.x + cos(angle) * radius,
      y: node.y + sin(angle) * radius,
      vx: random(-0.12, 0.12) * CORTICAL_METABOLIC_WASTE_SCALE,
      vy: random(-0.12, 0.12) * CORTICAL_METABOLIC_WASTE_SCALE,
      bornAt: now + index * 12,
      state: "ecs",
      routeIndex: -1,
      routeProgress: 0,
      spin: random(TWO_PI),
      spinSpeed: random(-0.03, 0.03),
      alpha: 205
    });
  });

  if (corticalMetabolicWasteParticles.length > CORTICAL_METABOLIC_WASTE_MAX_ACTIVE) {
    corticalMetabolicWasteParticles.splice(
      0,
      corticalMetabolicWasteParticles.length - CORTICAL_METABOLIC_WASTE_MAX_ACTIVE
    );
  }
}

function updateCorticalMetabolicWaste() {
  const corticalState = getCorticalViewState();
  const now = corticalState.time;
  const dtScale = (corticalState.dt || 16.67) / 16.67;
  const waveMs = getCorticalWasteClearanceWaveMs();
  const waveId = floor(now / waveMs);
  const waveProgress = (now % waveMs) / waveMs;
  const waveX = lerp(
    CORTICAL_VIEW_BOUNDS.left - CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH,
    CORTICAL_VIEW_BOUNDS.right + CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH,
    waveProgress
  );

  for (let i = corticalMetabolicWasteParticles.length - 1; i >= 0; i--) {
    const waste = corticalMetabolicWasteParticles[i];
    if (waste.x > CORTICAL_VIEW_BOUNDS.right + 72 || waste.y < CORTICAL_VIEW_BOUNDS.top - 72 || waste.y > CORTICAL_VIEW_BOUNDS.bottom + 72) {
      corticalMetabolicWasteParticles.splice(i, 1);
      continue;
    }

    waste.spin = (waste.spin || 0) + (waste.spinSpeed || 0) * dtScale;

    if (waste.state === "vascular") {
      const vascularData = ensureCorticalMicrovascularFlowData();
      if (isCorticalStrokeRoute(vascularData.routes?.[waste.routeIndex])) {
        waste.state = "ecs";
        waste.routeIndex = -1;
        waste.routeProgress = 0;
        waste.vx = random(-0.035, 0.035);
        waste.vy = random(-0.035, 0.035);
        continue;
      }
      moveCorticalWasteThroughVascularRoute(
        waste,
        dtScale * (waste.tutorialWaste ? CORTICAL_TUTORIAL_WASTE_VASCULAR_SPEED_SCALE : 1)
      );
      continue;
    }

    const waveDistance = abs(waste.x - waveX);
    const waveActive = waveDistance <= CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH * 0.5;
    const strokeClearanceBlocked = isCorticalStrokeWasteClearanceBlocked(waste);
    if (strokeClearanceBlocked && waste.state === "carried") {
      waste.state = "ecs";
    }
    let selectedForClearance =
      !strokeClearanceBlocked &&
      !isCorticalEpilepsyEnabled() &&
      (waveActive || waste.state === "carried");
    if (selectedForClearance && waveActive && waste.state !== "carried") {
      if (waste.clearanceWaveId !== waveId) {
        waste.clearanceWaveId = waveId;
        waste.clearanceSelected = random() < CORTICAL_WASTE_CLEARANCE_PICKUP_PROBABILITY;
      }
      selectedForClearance = waste.clearanceSelected === true;
    }
    if (selectedForClearance && isCorticalInsomniaEnabled() && waste.state !== "carried") {
      if (waste.insomniaClearanceWaveId !== waveId) {
        waste.insomniaClearanceWaveId = waveId;
        waste.insomniaClearanceSelected = random() < 0.5;
      }
      selectedForClearance = waste.insomniaClearanceSelected === true;
    }

    if (selectedForClearance) {
      const target = findNearestCorticalWasteVascularTarget(waste, waveActive ? 42 : 30);
      if (target) {
        waste.state = "vascular";
        waste.routeIndex = target.routeIndex;
        waste.routeProgress = target.progress;
        waste.x = lerp(waste.x, target.point.x, 0.42);
        waste.y = lerp(waste.y, target.point.y, 0.42);
        moveCorticalWasteThroughVascularRoute(
          waste,
          dtScale * (waste.tutorialWaste ? CORTICAL_TUTORIAL_WASTE_VASCULAR_SPEED_SCALE : 1)
        );
        continue;
      }

      waste.state = "carried";
      waste.vx = max(
        waste.vx || 0,
        (0.62 + random(0.06, 0.22)) * (waste.tutorialWaste ? CORTICAL_TUTORIAL_WASTE_CARRIED_SPEED_SCALE : 1)
      );
      waste.vy = (waste.vy || 0) * 0.72 + random(-0.035, 0.035);
    } else {
      waste.vx += random(-0.022, 0.022) * CORTICAL_METABOLIC_WASTE_SCALE * dtScale;
      waste.vy += random(-0.022, 0.022) * CORTICAL_METABOLIC_WASTE_SCALE * dtScale;
      waste.vx *= 0.94;
      waste.vy *= 0.94;
    }

    waste.x += waste.vx * dtScale;
    waste.y += waste.vy * dtScale;
  }
}

function getCorticalWasteClearanceWaveX() {
  const now = getCorticalViewState().time;
  const waveMs = getCorticalWasteClearanceWaveMs();
  const waveProgress = (now % waveMs) / waveMs;
  return lerp(
    CORTICAL_VIEW_BOUNDS.left - CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH,
    CORTICAL_VIEW_BOUNDS.right + CORTICAL_WASTE_CLEARANCE_WAVE_WIDTH,
    waveProgress
  );
}

function findNearestCorticalWasteVascularTarget(waste, captureRadius = 42) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  let bestTarget = null;
  let bestDistanceSq = captureRadius * captureRadius;

  (vascularData.routes || []).forEach((route, routeIndex) => {
    if (isCorticalStrokeRoute(route)) return;
    const samples = route.flowSamples?.length ? route.flowSamples : buildCorticalFlowRouteSamples(route, 6);
    if (!samples?.length) return;
    const startIndex = floor(samples.length * 0.52);
    for (let sampleIndex = startIndex; sampleIndex < samples.length; sampleIndex += 2) {
      const point = samples[sampleIndex];
      const dx = point.x - waste.x;
      const dy = point.y - waste.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq >= bestDistanceSq) continue;
      bestDistanceSq = distanceSq;
      bestTarget = {
        routeIndex,
        progress: sampleIndex / max(1, samples.length - 1),
        point
      };
    }
  });

  return bestTarget;
}

function moveCorticalWasteThroughVascularRoute(waste, dtScale) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const route = vascularData.routes?.[waste.routeIndex];
  if (!route || route.length <= 0) {
    waste.x += 0.9 * dtScale;
    return;
  }

  waste.routeProgress = min(1.08, (waste.routeProgress || 0) + (1.65 * dtScale) / max(1, route.length));
  if (waste.routeProgress <= 1) {
    const point = sampleMeasuredPathAtFraction(route, waste.routeProgress);
    waste.x = point.x;
    waste.y = point.y;
    return;
  }

  const exitPoint = sampleMeasuredPathAtFraction(route, 1);
  waste.x = exitPoint.x + (waste.routeProgress - 1) * 520;
  waste.y = exitPoint.y;
}

function drawCorticalWasteParticle(x, y, particle) {
  const scaleValue = CORTICAL_METABOLIC_WASTE_SCALE;
  push();
  translate(x, y);
  rotate(particle.spin || 0);
  noStroke();
  fill(particle.color[0], particle.color[1], particle.color[2], particle.alpha);
  circle(0, 0, 12 * scaleValue);
  circle(-4 * scaleValue, -3 * scaleValue, 7 * scaleValue);
  circle(4 * scaleValue, -2 * scaleValue, 6 * scaleValue);
  circle(-2 * scaleValue, 4 * scaleValue, 5 * scaleValue);
  circle(5 * scaleValue, 3 * scaleValue, 4 * scaleValue);

  stroke(120, 92, 58, particle.alpha * 0.58);
  strokeWeight(0.55);
  noFill();
  beginShape();
  curveVertex(-4 * scaleValue, -1 * scaleValue);
  curveVertex(-4 * scaleValue, -1 * scaleValue);
  curveVertex(-1 * scaleValue, -5 * scaleValue);
  curveVertex(2 * scaleValue, -1 * scaleValue);
  curveVertex(-2 * scaleValue, 2 * scaleValue);
  curveVertex(3 * scaleValue, 5 * scaleValue);
  curveVertex(3 * scaleValue, 5 * scaleValue);
  endShape();
  pop();
}

function drawCorticalTutorialWasteBundleHighlights() {
  if (!shouldHighlightCorticalTutorialWasteBundles()) return;

  const bundles = new Map();
  corticalMetabolicWasteParticles.forEach((waste) => {
    if (!waste.tutorialWaste || !waste.tutorialBundleId) return;
    if (!bundles.has(waste.tutorialBundleId)) {
      bundles.set(waste.tutorialBundleId, {
        x: 0,
        y: 0,
        count: 0,
        phase: (waste.tutorialNodeIndex || 0) * 0.47
      });
    }
    const bundle = bundles.get(waste.tutorialBundleId);
    bundle.x += waste.x;
    bundle.y += waste.y;
    bundle.count += 1;
  });

  if (!bundles.size) return;

  const pulse = window.corticalGuidedTutorial?.pulse || 0;
  push();
  noStroke();
  bundles.forEach((bundle) => {
    if (!bundle.count) return;
    const cx = bundle.x / bundle.count;
    const cy = bundle.y / bundle.count;
    const localPulse = 0.5 + 0.5 * sin(pulse * 0.9 + bundle.phase);
    fill(184, 146, 102, 34 + localPulse * 16);
    circle(cx, cy, 12 + localPulse * 2.5);
    fill(255, 224, 120, 18 + localPulse * 8);
    circle(cx, cy, 7 + localPulse * 2);
  });
  pop();
}

function drawCorticalMetabolicWaste() {
  if (!corticalMetabolicWasteParticles.length) return;

  push();
  drawCorticalTutorialWasteBundleHighlights();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(3.9);
  corticalMetabolicWasteParticles.forEach((waste) => {
    if (waste.type === "waste") {
      drawCorticalWasteParticle(waste.x, waste.y, waste);
      return;
    }
    noStroke();
    fill(waste.color[0], waste.color[1], waste.color[2], waste.alpha);
    text(waste.label, waste.x, waste.y);
  });
  pop();
}

function getCorticalEpilepsyWaveRadius(wave, now) {
  return max(0, (now - wave.startTime) * CORTICAL_EPILEPSY_WAVE_SPEED);
}

function getCorticalEpilepsyPointSuppressionIntensity(point, activationState, now) {
  if (!point || !isCorticalEpilepsyEnabled()) return 0;
  let intensity = 0;
  (activationState.epilepsyWaves || []).forEach((wave) => {
    const distanceFromSource = dist(point.x, point.y, wave.source.x, wave.source.y);
    const arrivalTime = wave.startTime + distanceFromSource / CORTICAL_EPILEPSY_WAVE_SPEED;
    const ageSinceArrival = now - arrivalTime;
    if (ageSinceArrival < 0 || ageSinceArrival > CORTICAL_EPILEPSY_SUPPRESSION_MS) return;
    intensity = max(intensity, 1 - ageSinceArrival / CORTICAL_EPILEPSY_SUPPRESSION_MS);
  });
  return intensity;
}

function isCorticalPointEpilepsySuppressed(point, activationState, now) {
  return getCorticalEpilepsyPointSuppressionIntensity(point, activationState, now) > 0;
}

function buildCorticalEpilepsyWaveSnapshot(activationState, now, activeEdges, lookup, astrocyteGlowCenters, astrocytes) {
  if (!isCorticalEpilepsyEnabled() || !activationState.epilepsyWaves?.length) return [];
  const nodes = getCorticalNeuralSignalNodes();
  const visibleWaves = [];

  activationState.epilepsyWaves.forEach((wave) => {
    const radius = getCorticalEpilepsyWaveRadius(wave, now);
    if (radius > wave.maxRadius + CORTICAL_EPILEPSY_WAVE_THICKNESS) return;
    visibleWaves.push({
      x: wave.source.x,
      y: wave.source.y,
      radius,
      thickness: CORTICAL_EPILEPSY_WAVE_THICKNESS,
      progress: constrain(radius / max(1, wave.maxRadius), 0, 1)
    });

    astrocytes.forEach((astrocyte) => {
      const astrocyteDistance = dist(astrocyte.x, astrocyte.y, wave.source.x, wave.source.y);
      const arrivalTime = wave.startTime + astrocyteDistance / CORTICAL_EPILEPSY_WAVE_SPEED;
      const localElapsed = now - arrivalTime;
      if (localElapsed < 0 || localElapsed > 720) return;
      astrocyteGlowCenters.push({
        x: astrocyte.x,
        y: astrocyte.y
      });
    });

    nodes.forEach((node) => {
      const neuronDistance = dist(node.x, node.y, wave.source.x, wave.source.y);
      const arrivalTime = wave.startTime + neuronDistance / CORTICAL_EPILEPSY_WAVE_SPEED;
      const localElapsed = now - arrivalTime;
      if (localElapsed < 0 || localElapsed > 520) return;
      if (!wave.firedNeuronIds.has(node.neuronId) && localElapsed >= 0) {
        wave.firedNeuronIds.add(node.neuronId);
        activationState.metabolicWasteApCounter = (activationState.metabolicWasteApCounter || 0) + 1;
        if (activationState.metabolicWasteApCounter % 5 === 0) {
          spawnCorticalMetabolicWasteBurst(node, now);
        }
      }

      const intensity = constrain(1 - abs(localElapsed - 86) / 190, 0, 1);
      if (intensity > 0) {
        lookup.set(node.neuronId, max(intensity, lookup.get(node.neuronId) || 0));
      }

      buildCorticalNeuronLocalActivationSegments(node, localElapsed, "down").forEach((segment) => {
        activeEdges.push({ ...segment, kind: "epilepsy" });
        if (findNearbyCorticalAstrocyte(segment.spark, astrocytes)) {
          astrocyteGlowCenters.push(segment.spark);
        }
      });
    });
  });

  return visibleWaves;
}

function getCorticalNeuronActivationSnapshot() {
  const activationState = getCorticalNeuronActivationState();
  const now = getCorticalViewState().time;
  if (activationState.snapshotTime === now) return activationState.snapshot || null;

  const activations = activationState.active || [];
  const lookup = new Map();
  const activeEdges = [];
  const astrocyteGlowCenters = [];
  const inhibitoryCells = getCorticalInhibitorySignalCells();
  const astrocytes = corticalAstrocyteLayout || getCorticalAstrocyteLayout();
  if (!activationState.inhibitoryResponseUntil) activationState.inhibitoryResponseUntil = new Map();
  updateCorticalSpontaneousInhibitoryFirings(activationState, inhibitoryCells, now, activeEdges);
  const epilepsyWaves = buildCorticalEpilepsyWaveSnapshot(
    activationState,
    now,
    activeEdges,
    lookup,
    astrocyteGlowCenters,
    astrocytes
  );

  if (!activations.length && !activeEdges.length && !epilepsyWaves.length) {
    activationState.snapshotTime = now;
    activationState.snapshot = null;
    return null;
  }

  activations.forEach((activation) => {
    if (!activation?.propagationOrder?.length) return;
    const elapsed = (now - activation.startTime) * (activation.apSpeedScale || getCorticalApSpeedScale());
    if (!activation.triggeredInhibitoryKeys) activation.triggeredInhibitoryKeys = new Set();
    if (!activation.inhibitoryResponses) activation.inhibitoryResponses = [];
    let inhibitionTime = Infinity;

    activation.inhibitoryResponses.forEach((response) => {
      inhibitionTime = min(inhibitionTime, response.time);
      const responseElapsed = elapsed - response.time;
      if (responseElapsed >= 0 && responseElapsed <= 430) {
        activeEdges.push(...buildCorticalInhibitoryResponseSegments(response.cell, responseElapsed));
      }
    });

    (activation.edges || []).forEach((edge) => {
      if (edge.startTime > inhibitionTime + 80) return;
      const edgeElapsed = elapsed - edge.startTime;
      const edgeDuration = max(1, edge.endTime - edge.startTime);
      if (edgeElapsed < 0 || edgeElapsed > edgeDuration + 50) return;
      const centerProgress = constrain(edgeElapsed / edgeDuration, 0, 1);
      const from = {
        x: lerp(edge.from.x, edge.to.x, max(0, centerProgress - 0.08)),
        y: lerp(edge.from.y, edge.to.y, max(0, centerProgress - 0.08))
      };
      const to = {
        x: lerp(edge.from.x, edge.to.x, min(1, centerProgress + 0.025)),
        y: lerp(edge.from.y, edge.to.y, min(1, centerProgress + 0.025))
      };
      const spark = {
        x: lerp(edge.from.x, edge.to.x, centerProgress),
        y: lerp(edge.from.y, edge.to.y, centerProgress)
      };
      if (isCorticalPointEpilepsySuppressed(spark, activationState, now)) return;
      if (isCorticalPointStrokeSuppressed(spark)) return;
      const allowInhibitoryInterception = edge.kind === "excitatory" || !edge.kind;
      const inhibitoryCell = allowInhibitoryInterception
        ? findNearbyCorticalInhibitoryCell(spark, inhibitoryCells)
        : null;
      if (inhibitoryCell) {
        const inhibitoryKey = getCorticalInhibitoryActivationKey(inhibitoryCell);
        inhibitionTime = min(inhibitionTime, edge.startTime + max(0, edgeElapsed));
        const globalResponseUntil = activationState.inhibitoryResponseUntil.get(inhibitoryKey) || -Infinity;
        if (!activation.triggeredInhibitoryKeys.has(inhibitoryKey) && now >= globalResponseUntil) {
          const responseTime = edge.startTime + max(0, edgeElapsed);
          activation.triggeredInhibitoryKeys.add(inhibitoryKey);
          activationState.inhibitoryResponseUntil.set(inhibitoryKey, now + 430 / getCorticalApSpeedScale());
          activation.inhibitoryResponses.push({ key: inhibitoryKey, cell: inhibitoryCell, time: responseTime });
          activeEdges.push(...buildCorticalInhibitoryResponseSegments(inhibitoryCell, 0));
        }
        return;
      }

      activeEdges.push({ from, to, progress: 1, spark, kind: edge.kind || "excitatory" });
      if (findNearbyCorticalAstrocyte(spark, astrocytes)) {
        astrocyteGlowCenters.push(spark);
      }
    });

    activation.propagationOrder.forEach((entry) => {
      if (entry.time > inhibitionTime + 80) return;
      if (isCorticalPointEpilepsySuppressed(entry.neuron, activationState, now)) return;
      if (isCorticalPointStrokeSuppressed(entry.neuron)) return;
      if (elapsed >= entry.time && !activation.metabolicWasteNeuronIds?.has(entry.neuron.neuronId)) {
        if (!activation.metabolicWasteNeuronIds) activation.metabolicWasteNeuronIds = new Set();
        activation.metabolicWasteNeuronIds.add(entry.neuron.neuronId);
        activationState.metabolicWasteApCounter = (activationState.metabolicWasteApCounter || 0) + 1;
        if (activationState.metabolicWasteApCounter % 3 === 0) {
          spawnCorticalMetabolicWasteBurst(entry.neuron, now);
        }
      }
      const intensity = constrain(1 - abs(elapsed - entry.time) / 170, 0, 1);
      if (intensity > 0) {
        lookup.set(entry.neuron.neuronId, max(intensity, lookup.get(entry.neuron.neuronId) || 0));
      }
    });

    /*
    Legacy per-neuron local path AP animation is disabled while endpoint-based
    purple -> soma -> axon routing is evaluated.
    activation.propagationOrder.forEach((entry) => {
      if (entry.time > inhibitionTime + 80) return;
      const localElapsed = elapsed - entry.time;
      if (localElapsed < -40 || localElapsed > 520) return;
      const localSegments = buildCorticalNeuronLocalActivationSegments(entry.neuron, localElapsed, activation.direction);
      localSegments.forEach((segment) => {
        const inhibitoryCell = findNearbyCorticalInhibitoryCell(segment.spark, inhibitoryCells);
        if (inhibitoryCell) {
          const inhibitoryKey = getCorticalInhibitoryActivationKey(inhibitoryCell);
          inhibitionTime = min(inhibitionTime, entry.time + max(0, localElapsed));
          const globalResponseUntil = activationState.inhibitoryResponseUntil.get(inhibitoryKey) || -Infinity;
          if (activation.triggeredInhibitoryKeys.has(inhibitoryKey) || now < globalResponseUntil) return;
          const responseTime = entry.time + max(0, localElapsed);
          activation.triggeredInhibitoryKeys.add(inhibitoryKey);
          activationState.inhibitoryResponseUntil.set(inhibitoryKey, now + 430 / getCorticalApSpeedScale());
          activation.inhibitoryResponses.push({ key: inhibitoryKey, cell: inhibitoryCell, time: responseTime });
          activeEdges.push(...buildCorticalInhibitoryResponseSegments(inhibitoryCell, 0));
          return;
        }

        activeEdges.push({ ...segment, kind: "excitatory" });
        if (findNearbyCorticalAstrocyte(segment.spark, astrocytes)) {
          astrocyteGlowCenters.push(segment.spark);
        }
      });
    });
    */
  });

  activeEdges.forEach((edge) => {
    if (!edge?.spark || !findNearbyCorticalAstrocyte(edge.spark, astrocytes)) return;
    astrocyteGlowCenters.push(edge.spark);
  });

  if (!lookup.size && !activeEdges.length && !epilepsyWaves.length) {
    activationState.snapshotTime = now;
    activationState.snapshot = null;
    return null;
  }

  activationState.snapshotTime = now;
  activationState.snapshot = {
    lookup,
    activeEdges,
    astrocyteGlowCenters,
    epilepsyWaves
  };
  return activationState.snapshot;
}

function buildCorticalNeuronLocalActivationSegments(neuron, localElapsed, direction = "down") {
  const paths = getCorticalNeuronSignalPaths(neuron).slice(0, 2);
  const activeSegments = [];
  const pathDuration = 250;

  paths.forEach((path, pathIndex) => {
    const pathElapsed = localElapsed - pathIndex * 38;
    if (pathElapsed < 0 || pathElapsed > pathDuration + 60) return;
    const centerProgress = constrain(pathElapsed / pathDuration, 0, 1);
    const travelProgress = direction === "up" ? 1 - centerProgress : centerProgress;
    const fromFraction = direction === "up"
      ? min(1, travelProgress + 0.11)
      : max(0, travelProgress - 0.11);
    const toFraction = direction === "up"
      ? max(0, travelProgress - 0.025)
      : min(1, travelProgress + 0.025);
    const from = samplePathAtFraction(path, fromFraction);
    const to = samplePathAtFraction(path, toFraction);
    const spark = samplePathAtFraction(path, travelProgress);
    activeSegments.push({
      from,
      to,
      progress: 1,
      spark,
      kind: "excitatory"
    });
  });

  return activeSegments;
}

function getCorticalInhibitorySignalCells() {
  if (corticalInhibitorySignalCellLayout) return corticalInhibitorySignalCellLayout;
  const typeOneCells = getCorticalInhibitoryNeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "inhibitory", index));
  const typeTwoCells = getCorticalInhibitoryType2NeuronLayout().map((cell, index) => createCorticalSignalNode(cell, "inhibitory-type-2", index));
  corticalInhibitorySignalCellLayout = [...typeOneCells, ...typeTwoCells];
  return corticalInhibitorySignalCellLayout;
}

function findNearbyCorticalInhibitoryCell(point, inhibitoryCells) {
  if (!point || !inhibitoryCells?.length) return null;
  let nearest = null;
  let nearestDistanceSq = Infinity;
  inhibitoryCells.forEach((cell) => {
    const dx = point.x - cell.x;
    const dy = point.y - cell.y;
    const distanceSq = dx * dx + dy * dy;
    const threshold = cell.type === "inhibitory-type-2" ? 16 : 14;
    if (distanceSq < threshold * threshold && distanceSq < nearestDistanceSq) {
      nearest = cell;
      nearestDistanceSq = distanceSq;
    }
  });
  return nearest;
}

function findNearbyCorticalAstrocyte(point, astrocytes) {
  if (!point || !astrocytes?.length) return null;
  return astrocytes.find((astrocyte) => {
    const dx = point.x - astrocyte.x;
    const dy = point.y - astrocyte.y;
    const radius = 18 + (astrocyte.radius || 2.5);
    return dx * dx + dy * dy < radius * radius;
  });
}

function updateCorticalSpontaneousInhibitoryFirings(activationState, inhibitoryCells, now, activeEdges) {
  if (!inhibitoryCells?.length) return;
  if (!activationState.spontaneousInhibitoryFirings) activationState.spontaneousInhibitoryFirings = [];
  if (!activationState.nextSpontaneousInhibitoryFireByKey) {
    activationState.nextSpontaneousInhibitoryFireByKey = new Map();
  }

  const nextFireByKey = activationState.nextSpontaneousInhibitoryFireByKey;
  inhibitoryCells.forEach((cell, index) => {
    const key = getCorticalInhibitoryActivationKey(cell);
    if (!nextFireByKey.has(key)) {
      nextFireByKey.set(key, now + 900 + index * 150 + Math.random() * 4200);
    }

    if (now >= nextFireByKey.get(key)) {
      activationState.spontaneousInhibitoryFirings.push({
        key,
        cell,
        startTime: now
      });
      nextFireByKey.set(key, now + 5600 + Math.random() * 9600);
    }
  });

  activationState.spontaneousInhibitoryFirings = activationState.spontaneousInhibitoryFirings.filter((firing) => {
    const localElapsed = (now - firing.startTime) * getCorticalApSpeedScale();
    if (localElapsed > 430) return false;
    if (isCorticalPointEpilepsySuppressed(firing.cell, activationState, now)) return true;
    if (isCorticalPointStrokeSuppressed(firing.cell)) return true;
    activeEdges.push(...buildCorticalInhibitoryResponseSegments(firing.cell, localElapsed));
    return true;
  });
}

function buildCorticalInhibitoryResponseSegments(cell, localElapsed) {
  const paths = getCorticalInhibitorySignalPaths(cell).slice(0, 1);
  const activeSegments = [];
  const responseElapsed = constrain(localElapsed, 0, 260);
  const pathDuration = 190;

  paths.forEach((path, pathIndex) => {
    const pathElapsed = responseElapsed - pathIndex * 38;
    if (pathElapsed < 0 || pathElapsed > pathDuration + 50) return;
    const centerProgress = constrain(pathElapsed / pathDuration, 0, 1);
    const from = samplePathAtFraction(path, max(0, centerProgress - 0.14));
    const to = samplePathAtFraction(path, min(1, centerProgress + 0.035));
    const spark = samplePathAtFraction(path, centerProgress);
    activeSegments.push({
      from,
      to,
      progress: 1,
      spark,
      kind: "inhibitory"
    });
  });

  return activeSegments;
}

function getCorticalCrSignalPaths(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.3;
  const flip = cell.flip || 1;
  const phase = cell.branchPhase || 0;
  return [
    [
      { x: x - 142 * scaleValue, y: y + 5 * scaleValue },
      { x: x - 98 * scaleValue, y: y - phase * 6 * scaleValue },
      { x: x - 52 * scaleValue, y: y - 4 * scaleValue },
      { x: x - 10 * scaleValue, y },
      { x, y },
      { x: x + 10 * scaleValue, y },
      { x: x + 52 * scaleValue, y: y + 3 * scaleValue },
      { x: x + 100 * scaleValue, y: y + phase * 5 * scaleValue },
      { x: x + 146 * scaleValue, y: y - 5 * scaleValue }
    ],
    [
      { x, y: y + 1.6 },
      { x: x + flip * 2 * scaleValue, y: y + 18 * scaleValue },
      { x: x - flip * 3 * scaleValue, y: y + 40 * scaleValue },
      { x: x + flip * 1.5 * scaleValue, y: y + 72 * scaleValue }
    ]
  ];
}

function getCorticalFusiformSignalPaths(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.38;
  const phase = cell.phase || 0;
  const dendriteTipY = lerp(y, cell.dendriteTargetY, 0.5);
  const axonTipY = lerp(y, cell.axonTargetY, 0.5);
  const dendriticTrunk = [
    { x, y: y - 7 * scaleValue },
    { x: x - 5 * scaleValue, y: lerp(y, dendriteTipY, 0.3) },
    { x: x + 4 * scaleValue, y: lerp(y, dendriteTipY, 0.56) },
    { x: x - 3 * scaleValue, y: lerp(y, dendriteTipY, 0.82) },
    { x: x + phase * 8 * scaleValue, y: dendriteTipY }
  ];
  const axonalTrunk = [
    { x: x + 1.2 * scaleValue, y: y + 8 * scaleValue },
    { x: x + 6 * scaleValue, y: lerp(y, axonTipY, 0.3) },
    { x: x - 3 * scaleValue, y: lerp(y, axonTipY, 0.56) },
    { x: x + 5 * scaleValue, y: lerp(y, axonTipY, 0.82) },
    { x: x - phase * 7 * scaleValue, y: axonTipY }
  ];
  return [dendriticTrunk, axonalTrunk];
}

function getCorticalSgSignalPaths(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.42;
  const phase = cell.phase || 0;
  return [
    [
      { x, y },
      { x: x - 12 * scaleValue, y: y - 18 * scaleValue },
      { x: x - 31 * scaleValue, y: y - (28 + phase * 6) * scaleValue }
    ],
    [
      { x, y },
      { x: x + 10 * scaleValue, y: y - 19 * scaleValue },
      { x: x + 29 * scaleValue, y: y - (31 - phase * 5) * scaleValue }
    ],
    [
      { x, y },
      { x: x + 2 * scaleValue, y: y + 22 * scaleValue },
      { x: x - 4 * scaleValue, y: y + 48 * scaleValue }
    ],
    [
      { x: x + 1.5 * scaleValue, y: y + 6 * scaleValue },
      { x: x + 5 * scaleValue, y: y + 30 * scaleValue },
      { x: x - 2 * scaleValue, y: y + 58 * scaleValue },
      { x: x + 8 * scaleValue, y: y + 84 * scaleValue }
    ]
  ];
}

function getCorticalInhibitorySignalPaths(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.36;
  const phase = cell.phase || 0;
  const flip = cell.flip || 1;

  if (cell.type === "inhibitory-type-2") {
    return [
      [
        { x, y },
        { x: x - 18 * scaleValue, y: y - (11 + phase * 10) * scaleValue },
        { x: x - 43 * scaleValue, y: y + (8 - phase * 8) * scaleValue },
        { x: x - 84 * scaleValue, y: y + (4 + phase * 6) * scaleValue }
      ],
      [
        { x, y },
        { x: x + 19 * scaleValue, y: y + (10 - phase * 8) * scaleValue },
        { x: x + 45 * scaleValue, y: y - (7 + phase * 9) * scaleValue },
        { x: x + 88 * scaleValue, y: y - (3 - phase * 7) * scaleValue }
      ],
      [
        { x, y },
        { x: x + flip * 14 * scaleValue, y: y + (19 + phase * 5) * scaleValue },
        { x: x + flip * 34 * scaleValue, y: y + (7 - phase * 8) * scaleValue },
        { x: x + flip * 70 * scaleValue, y: y + (16 - phase * 6) * scaleValue }
      ]
    ];
  }

  return [
    [
      { x, y: y + 6 * scaleValue },
      { x: x - (1.2 + phase * 2) * scaleValue, y: y + 25 * scaleValue },
      { x: x + (2 + phase * 2) * scaleValue, y: y + 49 * scaleValue },
      { x: x - (2.5 - phase * 3) * scaleValue, y: y + 72 * scaleValue }
    ],
    [
      { x, y: y - 8 * scaleValue },
      { x: x + 1.2 * scaleValue, y: y - 24 * scaleValue },
      { x: x + 4 * scaleValue, y: y - 43 * scaleValue },
      { x: x + 7 * scaleValue, y: y - 61 * scaleValue }
    ],
    [
      { x: x - 4 * scaleValue, y: y - 8 * scaleValue },
      { x: x - 16 * scaleValue, y: y - 18 * scaleValue },
      { x: x - 31 * scaleValue, y: y - 29 * scaleValue }
    ]
  ];
}

function getCorticalNeuronSignalPaths(neuron) {
  if (neuron.type === "cr") return getCorticalCrSignalPaths(neuron);
  if (neuron.type === "sg") return getCorticalSgSignalPaths(neuron);
  if (neuron.type === "fusiform") return getCorticalFusiformSignalPaths(neuron);
  if (neuron.type === "inhibitory" || neuron.type === "inhibitory-type-2") {
    return getCorticalInhibitorySignalPaths(neuron);
  }

  const scaleValue = neuron.scale * 0.2;
  const x = neuron.x;
  const y = neuron.y;
  const flip = neuron.flip;
  const somaToAxonPath = [
    { x, y: y - 174 * scaleValue },
    { x: x - flip * 1.5 * scaleValue, y: y - 120 * scaleValue },
    { x, y: y - 72 * scaleValue },
    { x: x + flip * 1.5 * scaleValue, y: y - 34 * scaleValue },
    { x, y: y - 6 * scaleValue },
    { x, y: y + 8 * scaleValue },
    { x: x + flip * 1.5 * scaleValue, y: y + 36 * scaleValue },
    { x: x + flip * 4 * scaleValue, y: y + 72 * scaleValue },
    { x: x + flip * 8 * scaleValue, y: y + 108 * scaleValue }
  ];
  const localPaths = [somaToAxonPath];

  (neuron.dendriteExtensions || []).forEach((extension) => {
    if (extension.trunk?.length) localPaths.push(extension.trunk);
    (extension.branches || []).slice(0, 2).forEach((branch) => localPaths.push(branch));
  });

  (neuron.axonExtensions || []).forEach((extension) => {
    if (extension.trunk?.length) localPaths.push(extension.trunk);
    (extension.branches || []).forEach((branch) => localPaths.push(branch));
  });

  return localPaths
    .filter((path) => path?.length > 1)
    .map((path) => path.map((point) => transformCorticalNeuronEndpointPoint(neuron, point)));
}

function transformCorticalNeuronEndpointPoint(neuron, point) {
  if (!neuron?.invertedApRoute || !point) return point;
  return {
    x: neuron.x * 2 - point.x,
    y: neuron.y * 2 - point.y
  };
}

function shuffleCorticalArray(values, rng) {
  for (let i = values.length - 1; i > 0; i--) {
    const j = floor(rng() * (i + 1));
    const temp = values[i];
    values[i] = values[j];
    values[j] = temp;
  }
}

function relaxCorticalLayerNeurons(layerNeurons, layer, minX, maxX) {
  for (let iteration = 0; iteration < 8; iteration++) {
    for (let i = 0; i < layerNeurons.length; i++) {
      const a = layerNeurons[i];
      for (let j = i + 1; j < layerNeurons.length; j++) {
        const b = layerNeurons[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < 16 * 16) {
          const distance = sqrt(max(distanceSq, 0.0001));
          const push = (16 - distance) * 0.28;
          const nx = dx / distance;
          const ny = dy / distance;
          a.x = constrain(a.x - nx * push, minX, maxX);
          b.x = constrain(b.x + nx * push, minX, maxX);
          a.y = constrain(a.y - ny * push, layer.top + 14, layer.bottom - 14);
          b.y = constrain(b.y + ny * push, layer.top + 14, layer.bottom - 14);
        }
        if (abs(dy) < 4) {
          a.y = constrain(a.y - 2.2, layer.top + 14, layer.bottom - 14);
          b.y = constrain(b.y + 2.2, layer.top + 14, layer.bottom - 14);
        }
        if (abs(dx) < 6) {
          a.x = constrain(a.x - 3.2, minX, maxX);
          b.x = constrain(b.x + 3.2, minX, maxX);
        }
      }
    }
  }
}

function buildCorticalDendriteExtensions(neuron, rng) {
  let availableTargets = CORTICAL_LAYER_BANDS
    .map((layer, index) => ({ layer, index }))
    .filter((entry) => entry.index !== neuron.layerIndex && abs(entry.index - neuron.layerIndex) <= 2 && entry.index < neuron.layerIndex);
  const shouldReachLayerOne =
    (neuron.layerIndex === 1 && rng() < 0.72) ||
    (neuron.layerIndex === 2 && rng() < 0.48);
  if (shouldReachLayerOne) {
    const layerOneTarget = { layer: CORTICAL_LAYER_BANDS[0], index: 0 };
    availableTargets = [
      layerOneTarget,
      ...availableTargets.filter((entry) => entry.index !== 0)
    ];
  }
  const extensionCount = min(availableTargets.length, rng() < 0.55 ? 1 : 2);
  const chosenTargets =
    shouldReachLayerOne
      ? [
          availableTargets[0],
          ...availableTargets.slice(1).sort(() => rng() - 0.5).slice(0, max(0, extensionCount - 1))
        ]
      : availableTargets.sort(() => rng() - 0.5).slice(0, extensionCount);
  const scaleValue = neuron.scale * 0.2;
  const start = { x: neuron.x, y: neuron.y - 174 * scaleValue };

  return chosenTargets.map((target, index) => {
    const targetIsLayerOne = target.index === 0;
    const endX = constrain(
      neuron.x +
        corticalRand(rng, targetIsLayerOne ? -34 : -10, targetIsLayerOne ? 34 : 10) +
        index * neuron.flip * (targetIsLayerOne ? 12 : 4),
      -CORTICAL_COLUMN_FRAME.width * 0.5 + 42,
      CORTICAL_COLUMN_FRAME.width * 0.5 - 42
    );
    const endY = targetIsLayerOne
      ? corticalRand(rng, target.layer.top + 8, target.layer.bottom - 6)
      : corticalRand(rng, target.layer.top + 10, target.layer.bottom - 10);
    const trunk = [
      start,
      {
        x: neuron.x + corticalRand(rng, -3, 3),
        y: lerp(start.y, endY, 0.34)
      },
      {
        x: lerp(neuron.x, endX, 0.35) + corticalRand(rng, -4, 4),
        y: lerp(start.y, endY, 0.68)
      },
      { x: endX, y: endY }
    ];
    const extensionLength = getPathLength(trunk);
    const branchCount = constrain(
      floor(extensionLength / max(10, 24 * scaleValue)) + (target.index === 0 ? 2 : 0),
      2,
      target.index === 0 ? 8 : 6
    );
    const branches = [];

    for (let branchIndex = 0; branchIndex < branchCount; branchIndex++) {
      const fractionBase = (branchIndex + 1) / (branchCount + 1);
      const fraction = constrain(fractionBase + corticalRand(rng, -0.08, 0.08), 0.14, 0.9);
      const anchor = samplePathAtFraction(trunk, fraction);
      const nextPoint = samplePathAtFraction(trunk, min(0.98, fraction + 0.06));
      const tangentX = nextPoint.x - anchor.x;
      const tangentY = nextPoint.y - anchor.y;
      const tangentLength = max(0.0001, sqrt(tangentX * tangentX + tangentY * tangentY));
      const normalX = -tangentY / tangentLength;
      const normalY = tangentX / tangentLength;
      const side = rng() < 0.5 ? -1 : 1;
      const reach = corticalRand(rng, targetIsLayerOne ? 16 : 10, targetIsLayerOne ? 30 : 18) * scaleValue;
      const tipLift = corticalRand(rng, targetIsLayerOne ? 18 : 12, targetIsLayerOne ? 34 : 24) * scaleValue;

      branches.push([
        anchor,
        {
          x: anchor.x + normalX * side * reach * 0.65 + corticalRand(rng, -2, 2),
          y: anchor.y - tipLift * 0.58 + normalY * side * reach * 0.18 + corticalRand(rng, -2, 2)
        },
        {
          x: anchor.x + normalX * side * reach + corticalRand(rng, -3, 3),
          y: anchor.y - tipLift + normalY * side * reach * 0.22 + corticalRand(rng, -3, 3)
        }
      ]);
    }

    return {
      trunk,
      branches
    };
  });
}

function buildCorticalAxonExtensions(neuron, rng) {
  const availableTargets = CORTICAL_LAYER_BANDS
    .map((layer, index) => ({ layer, index }))
    .filter((entry) => entry.index !== neuron.layerIndex && abs(entry.index - neuron.layerIndex) <= 2 && entry.index > neuron.layerIndex);
  const extensionCount = min(availableTargets.length, rng() < 0.5 ? 1 : 2);
  const chosenTargets = availableTargets.sort(() => rng() - 0.5).slice(0, extensionCount);
  const start = { x: neuron.x, y: neuron.y + 22 * neuron.scale * 0.2 };

  return chosenTargets.map((target, index) => {
    const endX = constrain(
      neuron.x + corticalRand(rng, -48, 48) - index * neuron.flip * 10,
      -CORTICAL_COLUMN_FRAME.width * 0.5 + 40,
      CORTICAL_COLUMN_FRAME.width * 0.5 - 40
    );
    const endY = corticalRand(rng, target.layer.top + 12, target.layer.bottom - 10);
    return {
      trunk: [
        start,
        {
          x: neuron.x + corticalRand(rng, -10, 10),
          y: lerp(start.y, endY, 0.36)
        },
        {
          x: endX + corticalRand(rng, -10, 10),
          y: lerp(start.y, endY, 0.72)
        },
        { x: endX, y: endY }
      ],
      branches: [
        [
          { x: endX, y: endY },
          { x: endX + corticalRand(rng, -16, -6), y: endY + corticalRand(rng, 8, 18) }
        ],
        [
          { x: endX, y: endY },
          { x: endX + corticalRand(rng, 6, 16), y: endY + corticalRand(rng, 8, 18) }
        ]
      ]
    };
  });
}

function drawCorticalNeuronClusters(layerMode = "all", includeActivationEffects = true, includeActivationStrength = true) {
  push();
  const activationSnapshot = includeActivationStrength || includeActivationEffects
    ? getCorticalNeuronActivationSnapshot()
    : null;
  getCorticalNeuronLayout()
    .filter((neuron) => {
      if (neuron.layerIndex === 0) return false;
      if (layerMode === "behind") return Boolean(neuron.behindVasculature);
      if (layerMode === "front") return !neuron.behindVasculature;
      return true;
    })
    .forEach((neuron) => {
      drawCorticalPyramidalNeuron(
        neuron,
        includeActivationStrength ? activationSnapshot?.lookup?.get(neuron.neuronId) || 0 : 0
      );
    });
  if (includeActivationEffects) {
    drawCorticalNeuronActivationEffect(activationSnapshot);
  }
  pop();
}

function drawCorticalAstrocyteField(includeActivationEffects = true) {
  push();
  const activationSnapshot = includeActivationEffects ? getCorticalNeuronActivationSnapshot() : null;
  getCorticalAstrocyteLayout().forEach((astrocyte) => drawCorticalAstrocyte(astrocyte, activationSnapshot));
  pop();
}

function drawCorticalAstrocyteActivationGlow(activationSnapshot = null) {
  const glowCenters = activationSnapshot?.astrocyteGlowCenters || [];
  if (!glowCenters.length) return;

  push();
  drawingContext.save();
  drawingContext.globalCompositeOperation = "screen";
  getCorticalAstrocyteLayout().forEach((astrocyte) => {
    let nearestDistanceSq = Infinity;
    glowCenters.forEach((point) => {
      const dx = point.x - astrocyte.x;
      const dy = point.y - astrocyte.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < nearestDistanceSq) nearestDistanceSq = distanceSq;
    });
    if (nearestDistanceSq > 28 * 28) return;

    const distance = sqrt(nearestDistanceSq);
    const intensity = constrain(1 - distance / 28, 0, 1);
    const pulse = 0.72 + 0.28 * sin(getCorticalViewState().time * 0.012 + astrocyte.x * 0.03);

    push();
    translate(astrocyte.x, astrocyte.y);
    noFill();
    stroke(242, 216, 255, 72 * intensity * pulse);
    strokeWeight(4.2 * intensity + 0.8);
    (astrocyte.arms || []).forEach((arm) => {
      const controlX = cos(arm.angle + arm.bend) * (arm.length * 0.56);
      const controlY = sin(arm.angle + arm.bend) * (arm.length * 0.56);
      const endX = cos(arm.angle) * arm.length;
      const endY = sin(arm.angle) * arm.length;
      beginShape();
      vertex(0, 0);
      quadraticVertex(controlX, controlY, endX, endY);
      endShape();
    });

    noStroke();
    fill(230, 206, 255, 82 * intensity * pulse);
    ellipse(0, 0, astrocyte.radius * (5.4 + intensity * 1.8));
    fill(255, 250, 220, 126 * intensity * pulse);
    ellipse(0, 0, astrocyte.radius * (2.2 + intensity * 0.9));
    pop();
  });
  drawingContext.restore();
  pop();
}

function drawCorticalSurveillantMicroglia() {
  const now = getCorticalViewState().time || 0;
  getCorticalMicrogliaLayout().forEach((microglia) => drawCorticalMicrogliaCell(microglia));
  const insomniaMicrogliaCount = getCorticalInsomniaMicrogliaTargetCount();
  if (insomniaMicrogliaCount > 0) {
    getCorticalInsomniaMicrogliaLayout()
      .slice(0, insomniaMicrogliaCount)
      .forEach((microglia, index) => {
        microglia.visibleIndex = index;
        if (microglia.bornAt === undefined) {
          microglia.bornAt = now - index * 90;
        }
        drawCorticalMicrogliaCell(microglia);
      });
  }
  const activationState = window.corticalNeuronActivationState;
  if (isCorticalEpilepsyEnabled()) {
    (activationState?.epilepsyRecruitedMicroglia || []).forEach((microglia) => drawCorticalMicrogliaCell(microglia));
  }
  if (isCorticalStrokeEnabled()) {
    const strokeState = getCorticalStrokeState();
    (strokeState.recruitedMicroglia || []).forEach((microglia) => drawCorticalMicrogliaCell(microglia));
  }
}

function shouldDrawCorticalMicrogliaInflammatoryRings(microglia) {
  return Boolean(
    isCorticalAgingEnabled() ||
    microglia?.recruitedStrokeMicroglia ||
    microglia?.epilepsyRecruitedMicroglia ||
    microglia?.insomniaSupplementalMicroglia
  );
}

function drawCorticalMicrogliaInflammatoryRings(microglia, now) {
  if (!shouldDrawCorticalMicrogliaInflammatoryRings(microglia)) return;
  if (microglia.inflammatoryRingSeed === undefined) {
    microglia.inflammatoryRingSeed = -((microglia.visibleIndex || 0) * 420 + (microglia.phase || 0) * 180);
  }
  const ageSeed = microglia.bornAt ?? microglia.inflammatoryRingSeed;
  const intensity = microglia.epilepsyRecruitedMicroglia
    ? 1
    : microglia.recruitedStrokeMicroglia
      ? 0.92
      : isCorticalAgingEnabled()
        ? 0.58
        : 0.68;
  push();
  noFill();
  drawingContext.save();
  drawingContext.globalCompositeOperation = "screen";
  for (let ringIndex = 0; ringIndex < 3; ringIndex++) {
    const cycle = (((now - ageSeed) / CORTICAL_MICROGLIA_INFLAMMATORY_RING_MS) + ringIndex * 0.34 + (microglia.phase || 0) * 0.03) % 1;
    const radius = 5 + cycle * (19 + ringIndex * 3.2);
    const alphaValue = (1 - cycle) * (88 + ringIndex * 18) * intensity;
    stroke(255, 228, 132, alphaValue);
    strokeWeight(max(1.45, (3.6 - cycle * 1.35) * intensity));
    circle(microglia.x, microglia.y, radius * 2);
  }
  drawingContext.restore();
  pop();
}

function drawCorticalMicrogliaCell(microglia) {
  const corticalState = getCorticalViewState();
  drawCorticalMicrogliaInflammatoryRings(microglia, corticalState.time || 0);
  const motionMultiplier = (microglia.recruitedStrokeMicroglia && microglia.settled) || microglia.epilepsyRecruitedMicroglia ? 2 : 1;
  const pulse = sin((corticalState.time || 0) * 0.0024 * motionMultiplier + (microglia.phase || 0)) * 0.5 + 0.5;
  const baseColor = color(238, 126, 184, 255);
  const processColor = baseColor;
  const highlightColor = color(250, 166, 208, 255);
  const nucleusColor = color(184, 70, 132, 255);
  const branches = [
    { rootX: -7.2, rootY: -1.2, c1x: -14, c1y: -3, c2x: -18, c2y: -10, tipX: -23, tipY: -8, w: 13.2, lobes: [{ x: -25, y: -9, w: 9, h: 7 }] },
    { rootX: -4.2, rootY: -6.6, c1x: -6, c1y: -15, c2x: -12, c2y: -18, tipX: -11, tipY: -24, w: 14.0, lobes: [{ x: -12, y: -26, w: 10, h: 8 }, { x: -5, y: -21, w: 7, h: 5 }] },
    { rootX: 5.5, rootY: -6.0, c1x: 14, c1y: -12, c2x: 21, c2y: -9, tipX: 27, tipY: -14, w: 15.0, lobes: [{ x: 29, y: -15, w: 11, h: 8 }, { x: 22, y: -5, w: 8, h: 6 }] },
    { rootX: 8.8, rootY: 1.1, c1x: 16, c1y: 4, c2x: 20, c2y: 13, tipX: 28, tipY: 13, w: 12.4, lobes: [{ x: 30, y: 13, w: 9, h: 7 }] },
    { rootX: 1.8, rootY: 7.8, c1x: 6, c1y: 16, c2x: 3, c2y: 20, tipX: 9, tipY: 25, w: 11.6, lobes: [{ x: 10, y: 27, w: 8, h: 6 }] },
    { rootX: -7.4, rootY: 5.6, c1x: -13, c1y: 12, c2x: -18, c2y: 10, tipX: -23, tipY: 18, w: 14.4, lobes: [{ x: -25, y: 20, w: 10, h: 8 }, { x: -18, y: 12, w: 8, h: 5 }] }
  ];

  push();
  translate(microglia.x, microglia.y);
  rotate((microglia.rotation || 0) - 0.08);
  scale(microglia.scale || 0.115);

  branches.forEach((branch, index) => {
    const branchPhase = (microglia.phase || 0) + index * 1.17;
    const reachCycle = sin((corticalState.time || 0) * 0.00135 * motionMultiplier + branchPhase) * 0.5 + 0.5;
    const sweepCycle = sin((corticalState.time || 0) * 0.00215 * motionMultiplier + branchPhase * 1.31);
    const reach = 1 + reachCycle * 0.11;
    const branchLength = max(1, sqrt(branch.tipX * branch.tipX + branch.tipY * branch.tipY));
    const sweepX = (-branch.tipY / branchLength) * sweepCycle * 2.2;
    const sweepY = (branch.tipX / branchLength) * sweepCycle * 2.2;
    const tipX = branch.tipX * reach + sweepX;
    const tipY = branch.tipY * reach + sweepY;
    const c1x = branch.c1x * (1 + reachCycle * 0.035) + sweepX * 0.22;
    const c1y = branch.c1y * (1 + reachCycle * 0.035) + sweepY * 0.22;
    const c2x = branch.c2x * (1 + reachCycle * 0.07) + sweepX * 0.58;
    const c2y = branch.c2y * (1 + reachCycle * 0.07) + sweepY * 0.58;

    push();
    noFill();
    stroke(processColor);
    strokeWeight(branch.w);
    strokeCap(ROUND);
    strokeJoin(ROUND);
    beginShape();
    vertex(branch.rootX, branch.rootY);
    bezierVertex(c1x, c1y, c2x, c2y, tipX, tipY);
    endShape();

    stroke(highlightColor);
    strokeWeight(max(2.4, branch.w * 0.3));
    beginShape();
    vertex(lerp(branch.rootX, tipX, 0.58), lerp(branch.rootY, tipY, 0.58));
    bezierVertex(
      lerp(c1x, tipX, 0.52),
      lerp(c1y, tipY, 0.52),
      lerp(c2x, tipX, 0.68),
      lerp(c2y, tipY, 0.68),
      tipX,
      tipY
    );
    endShape();
    pop();

    branch.lobes.forEach((lobe) => {
      noStroke();
      fill(processColor);
      ellipse(lobe.x * reach + sweepX, lobe.y * reach + sweepY, lobe.w, lobe.h);
    });

    const contactPulse = max(0, reachCycle - 0.72) / 0.28;
    if (contactPulse > 0) {
      noStroke();
      fill(255, 210, 236, 105 * contactPulse);
      ellipse(tipX, tipY, 7.2 + contactPulse * 2.6, 7.2 + contactPulse * 2.6);
      fill(255, 244, 252, 165 * contactPulse);
      ellipse(tipX, tipY, 2.8 + contactPulse * 1.2, 2.8 + contactPulse * 1.2);
    }
  });

  noStroke();
  fill(baseColor);
  beginShape();
  vertex(-9.6, -1.6);
  bezierVertex(-9.2, -8.4, -0.6, -11.6, 7.2, -7.2);
  bezierVertex(13.8, -3.4, 12.2, 5.8, 5.2, 8.8);
  bezierVertex(-1.4, 11.6, -9.8, 7.0, -11.4, 1.1);
  bezierVertex(-11.9, -0.7, -11.2, -1.9, -9.6, -1.6);
  endShape(CLOSE);
  fill(highlightColor);
  ellipse(-2.8, -3.3, 11 + pulse * 0.8, 6.6);
  ellipse(4.6, 2.2, 7.4, 4.8);
  fill(nucleusColor);
  ellipse(1.2, -0.2, 5.8, 3.8);
  pop();
}

function drawCorticalAstrocyte(astrocyte, activationSnapshot = null) {
  const astroColor = color(196, 170, 226, 255);
  const nucleusColor = color(150, 116, 188, 255);
  const shouldGlow = Boolean((activationSnapshot?.astrocyteGlowCenters || []).some((point) => {
    const dx = point.x - astrocyte.x;
    const dy = point.y - astrocyte.y;
    return dx * dx + dy * dy < 22 * 22;
  }));

  push();
  translate(astrocyte.x, astrocyte.y);

  astrocyte.arms.forEach((arm) => {
    const controlX = cos(arm.angle + arm.bend) * (arm.length * 0.56);
    const controlY = sin(arm.angle + arm.bend) * (arm.length * 0.56);
    const endX = cos(arm.angle) * arm.length;
    const endY = sin(arm.angle) * arm.length;

    noFill();
    stroke(astroColor);
    strokeWeight(0.85);
    beginShape();
    vertex(0, 0);
    quadraticVertex(controlX, controlY, endX, endY);
    endShape();

    noStroke();
    fill(astroColor);
    push();
    translate(endX, endY);
    rotate(arm.angle);
    ellipse(0, 0, arm.endfootW, arm.endfootH);
    pop();
  });

  noStroke();
  fill(astroColor);
  ellipse(0, 0, astrocyte.radius * 2);
  if (shouldGlow) {
    noFill();
    stroke(255, 255, 255, 218);
    strokeWeight(1.4);
    ellipse(0, 0, astrocyte.radius * 2.9);
  }
  noStroke();
  fill(nucleusColor);
  ellipse(0, 0, astrocyte.radius * 0.72);
  pop();
}

function drawCorticalCajalRetziusCells() {
  getCorticalCrNeuronLayout().forEach((cell) => drawCorticalCajalRetziusCell(cell));
}

function drawCorticalCajalRetziusCell(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.5;
  const flip = cell.flip || 1;
  const phase = cell.branchPhase || 0;
  const neuronColor = color(255, 220, 120, cell.alpha || 226);
  const glowColor = color(255, 246, 190, 54);
  const nucleusColor = color(255, 245, 190, 210);
  const leftProcess = [
    { x: x - 10 * scaleValue, y },
    { x: x - 52 * scaleValue, y: y - 4 * scaleValue },
    { x: x - 98 * scaleValue, y: y - phase * 6 * scaleValue },
    { x: x - 142 * scaleValue, y: y + 5 * scaleValue }
  ];
  const rightProcess = [
    { x: x + 10 * scaleValue, y },
    { x: x + 52 * scaleValue, y: y + 3 * scaleValue },
    { x: x + 100 * scaleValue, y: y + phase * 5 * scaleValue },
    { x: x + 146 * scaleValue, y: y - 5 * scaleValue }
  ];
  const somaBottom = { x, y: y + 1.6 };
  const descendingAxon = [
    somaBottom,
    { x: x + flip * 2 * scaleValue, y: y + 18 * scaleValue },
    { x: x - flip * 3 * scaleValue, y: y + 40 * scaleValue },
    { x: x + flip * 1.5 * scaleValue, y: y + 72 * scaleValue }
  ];

  push();
  drawCorticalNeuronGlow(leftProcess, 3.2 * scaleValue, 1.2 * scaleValue, glowColor);
  drawCorticalNeuronGlow(rightProcess, 3.2 * scaleValue, 1.2 * scaleValue, glowColor);
  drawCorticalNeuronPath(leftProcess, 1.75 * scaleValue, 0.62 * scaleValue, neuronColor);
  drawCorticalNeuronPath(rightProcess, 1.75 * scaleValue, 0.62 * scaleValue, neuronColor);
  drawCorticalUniformPath(descendingAxon, 2.2 * scaleValue, neuronColor);

  [
    { weight: 0.36, points: [{ x: x - 42 * scaleValue, y: y - 4 * scaleValue }, { x: x - 62 * scaleValue, y: y - 16 * scaleValue }, { x: x - 86 * scaleValue, y: y - 18 * scaleValue }] },
    { weight: 0.36, points: [{ x: x - 82 * scaleValue, y }, { x: x - 102 * scaleValue, y: y + 13 * scaleValue }, { x: x - 124 * scaleValue, y: y + 16 * scaleValue }] },
    { weight: 0.36, points: [{ x: x + 42 * scaleValue, y: y + 3 * scaleValue }, { x: x + 62 * scaleValue, y: y - 10 * scaleValue }, { x: x + 86 * scaleValue, y: y - 12 * scaleValue }] },
    { weight: 0.36, points: [{ x: x + 88 * scaleValue, y: y - 1 * scaleValue }, { x: x + 108 * scaleValue, y: y + 12 * scaleValue }, { x: x + 132 * scaleValue, y: y + 14 * scaleValue }] },
    { weight: 1.45, points: [{ x: x - flip * 1 * scaleValue, y: y + 24 * scaleValue }, { x: x - flip * 18 * scaleValue, y: y + 34 * scaleValue }, { x: x - flip * 34 * scaleValue, y: y + 43 * scaleValue }] },
    { weight: 1.45, points: [{ x: x + flip * 1 * scaleValue, y: y + 42 * scaleValue }, { x: x + flip * 20 * scaleValue, y: y + 54 * scaleValue }, { x: x + flip * 36 * scaleValue, y: y + 63 * scaleValue }] },
    { weight: 1.28, points: [{ x: x - flip * 0.5 * scaleValue, y: y + 61 * scaleValue }, { x: x - flip * 14 * scaleValue, y: y + 72 * scaleValue }, { x: x - flip * 27 * scaleValue, y: y + 84 * scaleValue }] }
  ].forEach((branch) => drawCorticalUniformPath(branch.points, branch.weight * scaleValue, neuronColor));

  noStroke();
  fill(neuronColor);
  ellipse(x, y, 6.8, 3.2);
  fill(nucleusColor);
  ellipse(x + 0.25, y, 2.4, 1.15);
  pop();
}

function drawCorticalFusiformNeurons() {
  getCorticalFusiformNeuronLayout().forEach((cell) => drawCorticalFusiformNeuron(cell));
}

function drawCorticalFusiformNeuron(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.38;
  const phase = cell.phase || 0;
  const neuronColor = color(255, 214, 96, cell.alpha || 222);
  const glowColor = color(255, 248, 214, 66);
  const nucleusColor = color(255, 245, 190, 212);
  const dendriteTipY = lerp(y, cell.dendriteTargetY, 0.5);
  const axonTipY = lerp(y, cell.axonTargetY, 0.5);
  const dendriteMidY = lerp(y, dendriteTipY, 0.56);
  const axonMidY = lerp(y, axonTipY, 0.56);
  const dendriticTrunk = [
    { x, y: y - 7 * scaleValue },
    { x: x - 5 * scaleValue, y: lerp(y, dendriteTipY, 0.3) },
    { x: x + 4 * scaleValue, y: dendriteMidY },
    { x: x - 3 * scaleValue, y: lerp(y, dendriteTipY, 0.82) },
    { x: x + phase * 8 * scaleValue, y: dendriteTipY }
  ];
  const axonalTrunk = [
    { x: x + 1.2 * scaleValue, y: y + 8 * scaleValue },
    { x: x + 6 * scaleValue, y: lerp(y, axonTipY, 0.3) },
    { x: x - 3 * scaleValue, y: axonMidY },
    { x: x + 5 * scaleValue, y: lerp(y, axonTipY, 0.82) },
    { x: x - phase * 7 * scaleValue, y: axonTipY }
  ];
  const dendriteUpperAnchor = samplePathAtFraction(dendriticTrunk, 0.78);
  const dendriteTip = dendriticTrunk[dendriticTrunk.length - 1];
  const axonUpperAnchor = samplePathAtFraction(axonalTrunk, 0.76);
  const axonTip = axonalTrunk[axonalTrunk.length - 1];
  const dendriticBranches = [
    [dendriteUpperAnchor, { x: dendriteUpperAnchor.x - 24 * scaleValue, y: dendriteUpperAnchor.y - 13 * scaleValue }, { x: dendriteUpperAnchor.x - 48 * scaleValue, y: dendriteUpperAnchor.y - 29 * scaleValue }],
    [dendriteUpperAnchor, { x: dendriteUpperAnchor.x + 24 * scaleValue, y: dendriteUpperAnchor.y - 14 * scaleValue }, { x: dendriteUpperAnchor.x + 49 * scaleValue, y: dendriteUpperAnchor.y - 30 * scaleValue }],
    [dendriteTip, { x: dendriteTip.x - 16 * scaleValue, y: dendriteTip.y - 17 * scaleValue }, { x: dendriteTip.x - 34 * scaleValue, y: dendriteTip.y - 32 * scaleValue }],
    [dendriteTip, { x: dendriteTip.x + 18 * scaleValue, y: dendriteTip.y - 16 * scaleValue }, { x: dendriteTip.x + 37 * scaleValue, y: dendriteTip.y - 31 * scaleValue }],
    [dendriteTip, { x: dendriteTip.x - 4 * scaleValue, y: dendriteTip.y - 22 * scaleValue }, { x: dendriteTip.x - 8 * scaleValue, y: dendriteTip.y - 43 * scaleValue }]
  ];
  const axonalBranches = [
    [axonUpperAnchor, { x: axonUpperAnchor.x - 22 * scaleValue, y: axonUpperAnchor.y + 13 * scaleValue }, { x: axonUpperAnchor.x - 42 * scaleValue, y: axonUpperAnchor.y + 28 * scaleValue }],
    [axonUpperAnchor, { x: axonUpperAnchor.x + 22 * scaleValue, y: axonUpperAnchor.y + 13 * scaleValue }, { x: axonUpperAnchor.x + 43 * scaleValue, y: axonUpperAnchor.y + 28 * scaleValue }],
    [axonTip, { x: axonTip.x - 18 * scaleValue, y: axonTip.y + 16 * scaleValue }, { x: axonTip.x - 36 * scaleValue, y: axonTip.y + 31 * scaleValue }],
    [axonTip, { x: axonTip.x + 18 * scaleValue, y: axonTip.y + 16 * scaleValue }, { x: axonTip.x + 36 * scaleValue, y: axonTip.y + 31 * scaleValue }],
    [axonTip, { x: axonTip.x + 3 * scaleValue, y: axonTip.y + 21 * scaleValue }, { x: axonTip.x + 8 * scaleValue, y: axonTip.y + 41 * scaleValue }]
  ];

  push();
  drawCorticalNeuronGlow(dendriticTrunk, 6.2 * scaleValue, 3.0 * scaleValue, glowColor);
  drawCorticalNeuronGlow(axonalTrunk, 5.4 * scaleValue, 2.9 * scaleValue, glowColor);
  drawCorticalNeuronPath(dendriticTrunk, 4.15 * scaleValue, 1.95 * scaleValue, neuronColor);
  dendriticBranches.forEach((branch) => drawCorticalUniformPath(branch, 0.82 * scaleValue, neuronColor));
  drawCorticalUniformPath(axonalTrunk, 2.55 * scaleValue, neuronColor);
  axonalBranches.forEach((branch) => drawCorticalUniformPath(branch, 0.8 * scaleValue, neuronColor));

  noStroke();
  fill(neuronColor);
  push();
  translate(x, y);
  rotate(0.04 + phase * 0.04);
  ellipse(0, 0, 14.4 * scaleValue, 36.8 * scaleValue);
  fill(nucleusColor);
  ellipse(0.2 * scaleValue, 0.4 * scaleValue, 5.2 * scaleValue, 10.0 * scaleValue);
  pop();
  pop();
}

function drawCorticalInhibitoryNeurons() {
  getCorticalInhibitoryNeuronLayout().forEach((cell) => drawCorticalInhibitoryNeuron(cell));
}

function drawCorticalInhibitoryType2Neurons() {
  getCorticalInhibitoryType2NeuronLayout().forEach((cell) => drawCorticalInhibitoryType2Neuron(cell));
}

function drawCorticalInhibitoryType2Neuron(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.38;
  const phase = cell.phase || 0;
  const flip = cell.flip || 1;
  const neuronColor = color(255, 150, 64, cell.alpha || 224);
  const glowColor = color(255, 190, 110, 72);
  const nucleusColor = color(255, 218, 160, 216);
  const trunks = [
    [
      { x, y },
      { x: x - 18 * scaleValue, y: y - (11 + phase * 10) * scaleValue },
      { x: x - 43 * scaleValue, y: y + (8 - phase * 8) * scaleValue },
      { x: x - 61 * scaleValue, y: y - (13 + phase * 7) * scaleValue },
      { x: x - 84 * scaleValue, y: y + (4 + phase * 6) * scaleValue }
    ],
    [
      { x, y },
      { x: x + 19 * scaleValue, y: y + (10 - phase * 8) * scaleValue },
      { x: x + 45 * scaleValue, y: y - (7 + phase * 9) * scaleValue },
      { x: x + 63 * scaleValue, y: y + (14 - phase * 6) * scaleValue },
      { x: x + 88 * scaleValue, y: y - (3 - phase * 7) * scaleValue }
    ],
    [
      { x, y },
      { x: x + flip * 14 * scaleValue, y: y + (19 + phase * 5) * scaleValue },
      { x: x + flip * 34 * scaleValue, y: y + (7 - phase * 8) * scaleValue },
      { x: x + flip * 51 * scaleValue, y: y + (26 + phase * 7) * scaleValue },
      { x: x + flip * 70 * scaleValue, y: y + (16 - phase * 6) * scaleValue }
    ]
  ];
  const terminalBranches = [
    [
      trunks[0][2],
      { x: trunks[0][2].x - 18 * scaleValue, y: trunks[0][2].y - 13 * scaleValue },
      { x: trunks[0][2].x - 31 * scaleValue, y: trunks[0][2].y - 24 * scaleValue }
    ],
    [
      trunks[0][2],
      { x: trunks[0][2].x - 16 * scaleValue, y: trunks[0][2].y + 12 * scaleValue },
      { x: trunks[0][2].x - 29 * scaleValue, y: trunks[0][2].y + 21 * scaleValue }
    ],
    [
      trunks[1][2],
      { x: trunks[1][2].x + 18 * scaleValue, y: trunks[1][2].y - 12 * scaleValue },
      { x: trunks[1][2].x + 31 * scaleValue, y: trunks[1][2].y - 22 * scaleValue }
    ],
    [
      trunks[1][2],
      { x: trunks[1][2].x + 17 * scaleValue, y: trunks[1][2].y + 13 * scaleValue },
      { x: trunks[1][2].x + 30 * scaleValue, y: trunks[1][2].y + 23 * scaleValue }
    ],
    [
      trunks[2][2],
      { x: trunks[2][2].x + flip * 17 * scaleValue, y: trunks[2][2].y + 12 * scaleValue },
      { x: trunks[2][2].x + flip * 29 * scaleValue, y: trunks[2][2].y + 22 * scaleValue }
    ]
  ];

  push();
  trunks.forEach((path) => drawCorticalNeuronGlow(path, 4.1 * scaleValue, 1.7 * scaleValue, glowColor));
  trunks.forEach((path) => drawCorticalNeuronPath(path, 2.55 * scaleValue, 1.05 * scaleValue, neuronColor));
  terminalBranches.forEach((branch) => drawCorticalUniformPath(branch, 0.72 * scaleValue, neuronColor));

  noStroke();
  fill(neuronColor);
  ellipse(x, y, 15.3 * scaleValue, 14.1 * scaleValue);
  fill(nucleusColor);
  ellipse(x + 0.25 * scaleValue, y - 0.1 * scaleValue, 5.25 * scaleValue, 4.65 * scaleValue);
  pop();
}

function drawCorticalInhibitoryNeuron(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.36;
  const phase = cell.phase || 0;
  const neuronColor = color(255, 150, 64, cell.alpha || 232);
  const glowColor = color(255, 190, 110, 82);
  const nucleusColor = color(255, 218, 160, 218);
  const descendingDendrite = [
    { x, y: y + 6 * scaleValue },
    { x: x - (1.2 + phase * 2) * scaleValue, y: y + 25 * scaleValue },
    { x: x + (2 + phase * 2) * scaleValue, y: y + 49 * scaleValue },
    { x: x - (2.5 - phase * 3) * scaleValue, y: y + 72 * scaleValue }
  ];
  const basalLeftPath = [
    { x: x - 4 * scaleValue, y: y - 8 * scaleValue },
    { x: x - 16 * scaleValue, y: y - 18 * scaleValue },
    { x: x - 31 * scaleValue, y: y - 29 * scaleValue }
  ];
  const basalRightPath = [
    { x: x + 4 * scaleValue, y: y - 8 * scaleValue },
    { x: x + 17 * scaleValue, y: y - 18 * scaleValue },
    { x: x + 33 * scaleValue, y: y - 30 * scaleValue }
  ];
  const upwardAxon = [
    { x, y: y - 8 * scaleValue },
    { x: x + 1.2 * scaleValue, y: y - 24 * scaleValue },
    { x: x + 4 * scaleValue, y: y - 43 * scaleValue },
    { x: x + 7 * scaleValue, y: y - 61 * scaleValue }
  ];
  const dendriticBranches = [
    [
      { x: x, y: y + 29 * scaleValue },
      { x: x - 12 * scaleValue, y: y + 38 * scaleValue },
      { x: x - 23 * scaleValue, y: y + 49 * scaleValue }
    ],
    [
      { x: x + 1 * scaleValue, y: y + 49 * scaleValue },
      { x: x + 15 * scaleValue, y: y + 59 * scaleValue },
      { x: x + 26 * scaleValue, y: y + 70 * scaleValue }
    ],
    [
      { x: x - 1 * scaleValue, y: y + 62 * scaleValue },
      { x: x - 14 * scaleValue, y: y + 74 * scaleValue },
      { x: x - 24 * scaleValue, y: y + 85 * scaleValue }
    ]
  ];
  const axonalBranches = [
    [
      { x: x + 3 * scaleValue, y: y - 39 * scaleValue },
      { x: x - 10 * scaleValue, y: y - 50 * scaleValue },
      { x: x - 21 * scaleValue, y: y - 60 * scaleValue }
    ],
    [
      { x: x + 5 * scaleValue, y: y - 52 * scaleValue },
      { x: x + 17 * scaleValue, y: y - 63 * scaleValue },
      { x: x + 28 * scaleValue, y: y - 73 * scaleValue }
    ]
  ];

  push();
  drawCorticalNeuronGlow(descendingDendrite, 8.6 * scaleValue, 3.5 * scaleValue, glowColor);
  drawCorticalNeuronGlow(basalLeftPath, 5.2 * scaleValue, 2.0 * scaleValue, glowColor);
  drawCorticalNeuronGlow(basalRightPath, 5.2 * scaleValue, 2.0 * scaleValue, glowColor);
  drawCorticalNeuronGlow(upwardAxon, 4.2 * scaleValue, 2.4 * scaleValue, glowColor);
  drawCorticalNeuronPath(descendingDendrite, 6.1 * scaleValue, 2.0 * scaleValue, neuronColor);
  drawCorticalNeuronPath(basalLeftPath, 3.2 * scaleValue, 1.0 * scaleValue, neuronColor);
  drawCorticalNeuronPath(basalRightPath, 3.2 * scaleValue, 1.0 * scaleValue, neuronColor);
  drawCorticalUniformPath(upwardAxon, 1.75 * scaleValue, neuronColor);
  dendriticBranches.forEach((branch) => drawCorticalUniformPath(branch, 0.92 * scaleValue, neuronColor));
  axonalBranches.forEach((branch) => drawCorticalUniformPath(branch, 0.82 * scaleValue, neuronColor));

  noStroke();
  fill(neuronColor);
  triangle(
    x,
    y + 12 * scaleValue,
    x - 11 * scaleValue,
    y - 9 * scaleValue,
    x + 10 * scaleValue,
    y - 10 * scaleValue
  );
  fill(nucleusColor);
  ellipse(x, y - 1 * scaleValue, 5.2 * scaleValue, 7.2 * scaleValue);
  pop();
}

function drawCorticalStellateGranularNeurons() {
  getCorticalSgNeuronLayout().forEach((cell) => drawCorticalStellateGranularNeuron(cell));
}

function drawCorticalStellateGranularNeuron(cell) {
  const x = cell.x;
  const y = cell.y;
  const scaleValue = cell.scale || 0.42;
  const phase = cell.phase || 0;
  const neuronColor = color(255, 214, 96, cell.alpha || 218);
  const glowColor = color(255, 248, 214, 72);
  const nucleusColor = color(255, 245, 190, 210);
  const dendrites = [
    [
      { x, y },
      { x: x - 12 * scaleValue, y: y - 18 * scaleValue },
      { x: x - 31 * scaleValue, y: y - (28 + phase * 6) * scaleValue }
    ],
    [
      { x, y },
      { x: x + 10 * scaleValue, y: y - 19 * scaleValue },
      { x: x + 29 * scaleValue, y: y - (31 - phase * 5) * scaleValue }
    ],
    [
      { x, y },
      { x: x - 24 * scaleValue, y: y - 4 * scaleValue },
      { x: x - 47 * scaleValue, y: y - (8 + phase * 4) * scaleValue }
    ],
    [
      { x, y },
      { x: x + 24 * scaleValue, y: y - 1 * scaleValue },
      { x: x + 50 * scaleValue, y: y - (5 - phase * 4) * scaleValue }
    ],
    [
      { x, y },
      { x: x - 17 * scaleValue, y: y + 16 * scaleValue },
      { x: x - 34 * scaleValue, y: y + 31 * scaleValue }
    ],
    [
      { x, y },
      { x: x + 16 * scaleValue, y: y + 15 * scaleValue },
      { x: x + 36 * scaleValue, y: y + 29 * scaleValue }
    ],
    [
      { x, y },
      { x: x + 2 * scaleValue, y: y + 22 * scaleValue },
      { x: x - 4 * scaleValue, y: y + 48 * scaleValue }
    ]
  ];
  const shortBranches = [
    [
      { x: x - 27 * scaleValue, y: y - 24 * scaleValue },
      { x: x - 39 * scaleValue, y: y - 38 * scaleValue }
    ],
    [
      { x: x + 25 * scaleValue, y: y - 26 * scaleValue },
      { x: x + 39 * scaleValue, y: y - 39 * scaleValue }
    ],
    [
      { x: x - 32 * scaleValue, y: y - 7 * scaleValue },
      { x: x - 47 * scaleValue, y: y + 6 * scaleValue }
    ],
    [
      { x: x + 32 * scaleValue, y: y - 4 * scaleValue },
      { x: x + 48 * scaleValue, y: y + 8 * scaleValue }
    ],
    [
      { x: x - 25 * scaleValue, y: y + 25 * scaleValue },
      { x: x - 42 * scaleValue, y: y + 34 * scaleValue }
    ],
    [
      { x: x + 26 * scaleValue, y: y + 24 * scaleValue },
      { x: x + 43 * scaleValue, y: y + 34 * scaleValue }
    ],
    [
      { x: x - 15 * scaleValue, y: y - 17 * scaleValue },
      { x: x - 28 * scaleValue, y: y - 23 * scaleValue },
      { x: x - 37 * scaleValue, y: y - 33 * scaleValue }
    ],
    [
      { x: x - 23 * scaleValue, y: y - 24 * scaleValue },
      { x: x - 28 * scaleValue, y: y - 39 * scaleValue },
      { x: x - 34 * scaleValue, y: y - 50 * scaleValue }
    ],
    [
      { x: x + 14 * scaleValue, y: y - 18 * scaleValue },
      { x: x + 28 * scaleValue, y: y - 24 * scaleValue },
      { x: x + 39 * scaleValue, y: y - 34 * scaleValue }
    ],
    [
      { x: x + 22 * scaleValue, y: y - 26 * scaleValue },
      { x: x + 27 * scaleValue, y: y - 41 * scaleValue },
      { x: x + 34 * scaleValue, y: y - 52 * scaleValue }
    ],
    [
      { x: x - 22 * scaleValue, y: y - 4 * scaleValue },
      { x: x - 35 * scaleValue, y: y - 17 * scaleValue },
      { x: x - 48 * scaleValue, y: y - 24 * scaleValue }
    ],
    [
      { x: x - 35 * scaleValue, y: y - 7 * scaleValue },
      { x: x - 53 * scaleValue, y: y - 1 * scaleValue },
      { x: x - 64 * scaleValue, y: y + 7 * scaleValue }
    ],
    [
      { x: x - 41 * scaleValue, y: y - 8 * scaleValue },
      { x: x - 54 * scaleValue, y: y - 17 * scaleValue },
      { x: x - 67 * scaleValue, y: y - 20 * scaleValue }
    ],
    [
      { x: x + 22 * scaleValue, y: y - 2 * scaleValue },
      { x: x + 36 * scaleValue, y: y - 15 * scaleValue },
      { x: x + 51 * scaleValue, y: y - 22 * scaleValue }
    ],
    [
      { x: x + 37 * scaleValue, y: y - 5 * scaleValue },
      { x: x + 55 * scaleValue, y: y + 1 * scaleValue },
      { x: x + 67 * scaleValue, y: y + 8 * scaleValue }
    ],
    [
      { x: x + 43 * scaleValue, y: y - 5 * scaleValue },
      { x: x + 56 * scaleValue, y: y - 15 * scaleValue },
      { x: x + 69 * scaleValue, y: y - 19 * scaleValue }
    ],
    [
      { x: x - 16 * scaleValue, y: y + 15 * scaleValue },
      { x: x - 29 * scaleValue, y: y + 15 * scaleValue },
      { x: x - 43 * scaleValue, y: y + 12 * scaleValue }
    ],
    [
      { x: x - 25 * scaleValue, y: y + 25 * scaleValue },
      { x: x - 30 * scaleValue, y: y + 41 * scaleValue },
      { x: x - 35 * scaleValue, y: y + 53 * scaleValue }
    ],
    [
      { x: x + 16 * scaleValue, y: y + 14 * scaleValue },
      { x: x + 31 * scaleValue, y: y + 14 * scaleValue },
      { x: x + 45 * scaleValue, y: y + 12 * scaleValue }
    ],
    [
      { x: x + 27 * scaleValue, y: y + 24 * scaleValue },
      { x: x + 33 * scaleValue, y: y + 40 * scaleValue },
      { x: x + 39 * scaleValue, y: y + 52 * scaleValue }
    ],
    [
      { x: x + 1 * scaleValue, y: y + 22 * scaleValue },
      { x: x - 15 * scaleValue, y: y + 35 * scaleValue },
      { x: x - 25 * scaleValue, y: y + 48 * scaleValue }
    ],
    [
      { x: x - 3 * scaleValue, y: y + 37 * scaleValue },
      { x: x + 12 * scaleValue, y: y + 50 * scaleValue },
      { x: x + 24 * scaleValue, y: y + 62 * scaleValue }
    ]
  ];
  const axon = [
    { x: x + 1.5 * scaleValue, y: y + 6 * scaleValue },
    { x: x + 5 * scaleValue, y: y + 30 * scaleValue },
    { x: x - 2 * scaleValue, y: y + 58 * scaleValue },
    { x: x + 8 * scaleValue, y: y + 84 * scaleValue }
  ];

  push();
  dendrites.forEach((path) => drawCorticalNeuronGlow(path, 3.6 * scaleValue, 1.4 * scaleValue, glowColor));
  drawCorticalNeuronGlow(axon, 2.8 * scaleValue, 1.8 * scaleValue, glowColor);
  dendrites.forEach((path) => drawCorticalNeuronPath(path, 2.15 * scaleValue, 0.9 * scaleValue, neuronColor));
  shortBranches.forEach((path, branchIndex) => {
    const branchWeight = branchIndex < 6 ? 0.82 : 0.62;
    drawCorticalUniformPath(path, branchWeight * scaleValue, neuronColor);
  });
  drawCorticalUniformPath(axon, 1.35 * scaleValue, neuronColor);

  noStroke();
  fill(neuronColor);
  ellipse(x, y, 9.6 * scaleValue, 8.8 * scaleValue);
  fill(nucleusColor);
  ellipse(x + 0.45 * scaleValue, y - 0.2 * scaleValue, 3.4 * scaleValue, 3.0 * scaleValue);
  pop();
}

function drawCorticalPyramidalNeuron(neuron, activationStrength = 0) {
  const neuronColor = color(255, 214, 96, neuron.alpha);
  const neuronGlowColor = color(255, 248, 214, 132);
  const activationGlowColor = color(255, 255, 255, 220 * activationStrength);
  const scaleValue = neuron.scale * 0.2;
  const somaW = 22 * scaleValue;
  const somaH = 30 * scaleValue;
  const x = neuron.x;
  const y = neuron.y;
  const flip = neuron.flip;
  if (neuron.invertedApRoute) {
    push();
    translate(x, y);
    rotate(PI);
    translate(-x, -y);
  }
  const apicalPath = [
    { x: x, y: y - 6 * scaleValue },
    { x: x + flip * 1.5 * scaleValue, y: y - 34 * scaleValue },
    { x: x, y: y - 72 * scaleValue },
    { x: x - flip * 1.5 * scaleValue, y: y - 120 * scaleValue },
    { x: x, y: y - 174 * scaleValue }
  ];
  const basalLeftPath = [
    { x: x - flip * 3 * scaleValue, y: y + 8 * scaleValue },
    { x: x - flip * 20 * scaleValue, y: y + 22 * scaleValue },
    { x: x - flip * 44 * scaleValue, y: y + 38 * scaleValue }
  ];
  const basalRightPath = [
    { x: x + flip * 4 * scaleValue, y: y + 8 * scaleValue },
    { x: x + flip * 22 * scaleValue, y: y + 24 * scaleValue },
    { x: x + flip * 46 * scaleValue, y: y + 42 * scaleValue }
  ];
  const axonPath = [
    { x: x, y: y + 8 * scaleValue },
    { x: x + flip * 1.5 * scaleValue, y: y + 36 * scaleValue },
    { x: x + flip * 4 * scaleValue, y: y + 72 * scaleValue },
    { x: x + flip * 8 * scaleValue, y: y + 108 * scaleValue }
  ];

  drawCorticalNeuronGlow(apicalPath, 11.6 * scaleValue, 4.2 * scaleValue, neuronGlowColor);
  drawCorticalNeuronGlow(basalLeftPath, 5.6 * scaleValue, 2.2 * scaleValue, neuronGlowColor);
  drawCorticalNeuronGlow(basalRightPath, 5.6 * scaleValue, 2.2 * scaleValue, neuronGlowColor);
  drawCorticalNeuronGlow(axonPath, 4.6 * scaleValue, 2.6 * scaleValue, neuronGlowColor);
  if (activationStrength > 0.02) {
    drawCorticalNeuronGlow(apicalPath, 10.8 * scaleValue * activationStrength, 4.8 * scaleValue * activationStrength, activationGlowColor);
    drawCorticalNeuronGlow(axonPath, 6.2 * scaleValue * activationStrength, 3.1 * scaleValue * activationStrength, activationGlowColor);
    noFill();
    stroke(255, 255, 255, 230 * activationStrength);
    strokeWeight(1.4 * scaleValue);
    triangle(
      x,
      y - somaH * 0.56,
      x - somaW * 0.56,
      y + somaH * 0.4,
      x + somaW * 0.5,
      y + somaH * 0.34
    );
  }
  noFill();
  stroke(255, 249, 214, 144);
  strokeWeight(1.05 * scaleValue);
  triangle(
    x,
    y - somaH * 0.56,
    x - somaW * 0.56,
    y + somaH * 0.4,
    x + somaW * 0.5,
    y + somaH * 0.34
  );

  drawCorticalNeuronPath(apicalPath, 8.2 * scaleValue, 2.4 * scaleValue, neuronColor);

  (neuron.dendriteExtensions || []).forEach((extension) => {
    drawCorticalNeuronPath(extension.trunk, 2.8 * scaleValue, 1.7 * scaleValue, neuronColor);
    extension.branches.forEach((branch) => {
      drawCorticalNeuronPath(branch, 1.2 * scaleValue, 0.6 * scaleValue, neuronColor);
    });
  });

  drawCorticalNeuronPath([
    { x: x, y: y - 54 * scaleValue },
    { x: x - flip * 16 * scaleValue, y: y - 70 * scaleValue },
    { x: x - flip * 34 * scaleValue, y: y - 94 * scaleValue }
  ], 3.6 * scaleValue, 1.1 * scaleValue, neuronColor);
  drawCorticalNeuronPath([
    { x: x, y: y - 74 * scaleValue },
    { x: x + flip * 18 * scaleValue, y: y - 92 * scaleValue },
    { x: x + flip * 40 * scaleValue, y: y - 122 * scaleValue }
  ], 3.4 * scaleValue, 1.1 * scaleValue, neuronColor);
  drawCorticalNeuronPath([
    { x: x, y: y - 174 * scaleValue },
    { x: x - flip * 10 * scaleValue, y: y - 194 * scaleValue },
    { x: x - flip * 26 * scaleValue, y: y - 220 * scaleValue }
  ], 2.1 * scaleValue, 0.8 * scaleValue, neuronColor);
  drawCorticalNeuronPath([
    { x: x, y: y - 174 * scaleValue },
    { x: x + flip * 10 * scaleValue, y: y - 194 * scaleValue },
    { x: x + flip * 28 * scaleValue, y: y - 220 * scaleValue }
  ], 2.1 * scaleValue, 0.8 * scaleValue, neuronColor);
  drawCorticalNeuronPath(basalLeftPath, 4.1 * scaleValue, 1.2 * scaleValue, neuronColor);
  drawCorticalNeuronPath(basalRightPath, 4.1 * scaleValue, 1.2 * scaleValue, neuronColor);
  const axonWeight = 2.2 * scaleValue;
  drawCorticalUniformPath(axonPath, axonWeight, neuronColor);
  drawCorticalUniformPath([
    axonPath[axonPath.length - 1],
    { x: x - flip * 10 * scaleValue, y: y + 122 * scaleValue },
    { x: x - flip * 22 * scaleValue, y: y + 138 * scaleValue }
  ], 1.45 * scaleValue, neuronColor);
  drawCorticalUniformPath([
    axonPath[axonPath.length - 1],
    { x: x + flip * 16 * scaleValue, y: y + 124 * scaleValue },
    { x: x + flip * 30 * scaleValue, y: y + 144 * scaleValue }
  ], 1.45 * scaleValue, neuronColor);
  drawCorticalUniformPath([
    axonPath[axonPath.length - 2],
    { x: x + flip * 18 * scaleValue, y: y + 96 * scaleValue },
    { x: x + flip * 28 * scaleValue, y: y + 112 * scaleValue }
  ], 1.15 * scaleValue, neuronColor);

  (neuron.axonExtensions || []).forEach((extension) => {
    drawCorticalUniformPath(extension.trunk, 1.35 * scaleValue, neuronColor);
    extension.branches.forEach((branch) => {
      drawCorticalUniformPath(branch, 0.92 * scaleValue, neuronColor);
    });
  });

  noStroke();
  fill(neuronColor);
  triangle(
    x,
    y - somaH * 0.56,
    x - somaW * 0.56,
    y + somaH * 0.4,
    x + somaW * 0.5,
    y + somaH * 0.34
  );
  if (neuron.invertedApRoute) {
    pop();
  }
}

function drawCorticalActivationRouteDebugOverlay() {
  return;
}

function drawCorticalInvertedApRouteDebugTargets() {
  const nodes = getCorticalNeuralSignalNodes();
  push();
  drawingContext.save();
  drawingContext.globalCompositeOperation = "lighter";
  noStroke();
  nodes.forEach((node) => {
    if (!node.invertedApRoute || node.isInhibitory) return;
    fill(20, 118, 255, 132);
    circle(node.x, node.y, 16);
    fill(116, 210, 255, 236);
    circle(node.x, node.y, 7);
  });
  drawingContext.restore();
  pop();
}

function drawCorticalActivationEndpointDebugTargets() {
  const nodes = getCorticalNeuralSignalNodes();
  const dendriteTargets = [];
  const axonTargets = [];
  const seenDendrites = new Set();
  const seenAxons = new Set();

  function addTarget(targets, seen, point) {
    if (!point) return;
    const key = `${round(point.x)}:${round(point.y)}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push(point);
  }

  nodes.forEach((node) => {
    const endpoints = getCorticalActivationEndpointTargets(node);
    endpoints.dendrites.forEach((point) => addTarget(dendriteTargets, seenDendrites, point));
    endpoints.axons.forEach((point) => addTarget(axonTargets, seenAxons, point));
  });

  push();
  noStroke();
  dendriteTargets.forEach((point) => {
    fill(210, 62, 255, 136);
    circle(point.x, point.y, 12);
    fill(248, 184, 255, 230);
    circle(point.x, point.y, 5);
  });

  axonTargets.forEach((point) => {
    fill(172, 255, 50, 136);
    circle(point.x, point.y, 11);
    fill(232, 255, 164, 230);
    circle(point.x, point.y, 4.5);
  });
  pop();
}

function getCorticalActivationEndpointTargets(node) {
  const dendrites = [];
  const axons = [];
  const paths = getCorticalNeuronSignalPaths(node);

  function firstPoint(path) {
    return path?.[0] || null;
  }

  function lastPoint(path) {
    return path?.[path.length - 1] || null;
  }

  if (node.type === "pyramidal" || !node.type) {
    if (paths[0]) {
      dendrites.push(firstPoint(paths[0]));
      axons.push(lastPoint(paths[0]));
    }
    (node.dendriteExtensions || []).forEach((extension) => {
      dendrites.push(transformCorticalNeuronEndpointPoint(node, lastPoint(extension.trunk)));
      (extension.branches || []).forEach((branch) => {
        dendrites.push(transformCorticalNeuronEndpointPoint(node, lastPoint(branch)));
      });
    });
    (node.axonExtensions || []).forEach((extension) => {
      axons.push(transformCorticalNeuronEndpointPoint(node, lastPoint(extension.trunk)));
      (extension.branches || []).forEach((branch) => {
        axons.push(transformCorticalNeuronEndpointPoint(node, lastPoint(branch)));
      });
    });
  } else if (node.type === "fusiform") {
    dendrites.push(lastPoint(paths[0]));
    axons.push(lastPoint(paths[1]));
  } else if (node.type === "sg") {
    dendrites.push(lastPoint(paths[0]), lastPoint(paths[1]));
    axons.push(lastPoint(paths[2]), lastPoint(paths[3]));
  } else if (node.type === "cr") {
    dendrites.push(firstPoint(paths[0]), lastPoint(paths[0]));
    axons.push(lastPoint(paths[1]));
  } else {
    paths.forEach((path, index) => {
      const target = lastPoint(path);
      if (index === 0) axons.push(target);
      else dendrites.push(target);
    });
  }

  return {
    dendrites: dendrites.filter(Boolean),
    axons: axons.filter(Boolean)
  };
}

function getNearbyCorticalDendriteEndpointTargets(origin, radius = 42) {
  if (!origin) return [];
  const radiusSq = radius * radius;
  const seen = new Set();
  const nearby = [];

  getCorticalNeuralSignalNodes().forEach((node) => {
    getCorticalActivationEndpointTargets(node).dendrites.forEach((point) => {
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      if (dx * dx + dy * dy > radiusSq) return;
      const key = `${round(point.x)}:${round(point.y)}`;
      if (seen.has(key)) return;
      seen.add(key);
      nearby.push(point);
    });
  });

  return nearby;
}

function drawCorticalActivationSomaDebugTargets() {
  const nodes = getCorticalNeuralSignalNodes();

  push();
  noStroke();
  nodes.forEach((node) => {
    fill(0, 190, 255, 120);
    circle(node.x, node.y, node.isInhibitory ? 14 : 12);
    fill(130, 238, 255, 235);
    circle(node.x, node.y, node.isInhibitory ? 6 : 5);
  });
  pop();
}

function drawCorticalActivationColumnDebugGuides() {
  const columns = getCorticalActivationColumns();
  const top = CORTICAL_VIEW_BOUNDS.top;
  const bottom = CORTICAL_VIEW_BOUNDS.bottom;

  push();
  stroke(255, 255, 255, 210);
  strokeWeight(2.4);
  noFill();

  columns.forEach((column) => {
    line(column.minX, top, column.minX, bottom);
    line(column.maxX, top, column.maxX, bottom);
    rectMode(CORNERS);
    rect(column.minX, top, column.maxX, bottom);
  });

  noStroke();
  fill(255, 255, 255, 238);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);
  columns.forEach((column) => {
    text(String(column.columnIndex + 1), column.centerX, top + 18);
  });
  pop();
}

function drawCorticalNeuronActivationEffect(snapshot) {
  if (!snapshot?.activeEdges?.length && !snapshot?.epilepsyWaves?.length && !snapshot?.mutedEndpointCenters?.length) return;

  function getApEdgeStyle(edge) {
    if (edge.kind === "epilepsy") {
      return {
        glow: color(44, 255, 112, 168),
        core: color(218, 255, 226, 252),
        spark: color(36, 255, 104, 150),
        glowWeight: 6.2,
        coreWeight: 2.1,
        sparkSize: 15
      };
    }
    if (
      edge.kind === "upward-dendrite-to-soma" ||
      edge.kind === "upward-soma-to-axon" ||
      edge.kind === "upward-axon-to-dendrite" ||
      edge.kind === "upward-axon-cascade-dendrite" ||
      edge.kind === "upward-cascade-dendrite-to-soma" ||
      edge.kind === "upward-cascade-soma-to-axon"
    ) {
      const isCascadeEdge = edge.kind === "upward-axon-cascade-dendrite" ||
        edge.kind === "upward-cascade-dendrite-to-soma" ||
        edge.kind === "upward-cascade-soma-to-axon";
      return {
        glow: color(64, 255, 128, 128),
        core: color(214, 255, 224, 246),
        spark: color(64, 255, 128, 112),
        glowWeight: isCascadeEdge ? 4.2 : 5.1,
        coreWeight: isCascadeEdge ? 1.45 : 1.82,
        sparkSize: isCascadeEdge ? 11 : 13
      };
    }
    if (edge.kind === "inhibitory-dendrite-to-soma") {
      return {
        glow: color(58, 255, 118, 104),
        core: color(210, 255, 218, 238),
        spark: color(58, 255, 118, 92),
        glowWeight: 4.9,
        coreWeight: 1.74,
        sparkSize: 13
      };
    }
    if (edge.kind === "inhibitory-soma-to-axon" || edge.kind === "inhibitory") {
      return {
        glow: color(255, 54, 42, 118),
        core: color(255, 218, 210, 240),
        spark: color(255, 44, 34, 102),
        glowWeight: 5.2,
        coreWeight: 1.86,
        sparkSize: 14
      };
    }
    return {
      glow: color(70, 255, 126, 92),
      core: color(248, 255, 252, 230),
      spark: color(70, 255, 120, 78),
      glowWeight: 4.4,
      coreWeight: 1.57,
      sparkSize: 12
    };
  }

  if (snapshot.epilepsyWaves?.length) {
    push();
    drawingContext.save();
    drawingContext.globalCompositeOperation = "screen";
    noFill();
    snapshot.epilepsyWaves.forEach((wave) => {
      const fade = constrain(1 - wave.progress * 0.72, 0.2, 1);
      noStroke();
      fill(34, 255, 104, 12 * fade);
      circle(wave.x, wave.y, wave.radius * 2);
      stroke(40, 255, 112, 130 * fade);
      strokeWeight(5.6);
      circle(wave.x, wave.y, wave.radius * 2);
      stroke(214, 255, 224, 190 * fade);
      strokeWeight(1.25);
      circle(wave.x, wave.y, max(0, wave.radius * 2 - wave.thickness * 0.34));
      stroke(72, 255, 142, 72 * fade);
      strokeWeight(1.6);
      circle(wave.x, wave.y, wave.radius * 2 + wave.thickness);
    });
    drawingContext.restore();
    pop();
  }

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  (snapshot.activeEdges || []).forEach((edge) => {
    const style = getApEdgeStyle(edge);
    stroke(style.glow);
    strokeWeight(style.glowWeight);
    line(
      edge.from.x,
      edge.from.y,
      lerp(edge.from.x, edge.to.x, edge.progress),
      lerp(edge.from.y, edge.to.y, edge.progress)
    );

    stroke(style.core);
    strokeWeight(style.coreWeight);
    line(
      edge.from.x,
      edge.from.y,
      lerp(edge.from.x, edge.to.x, edge.progress),
      lerp(edge.from.y, edge.to.y, edge.progress)
    );

    noStroke();
    fill(style.spark);
    circle(edge.spark.x, edge.spark.y, style.sparkSize);
    fill(color(250, 255, 252, 238));
    circle(edge.spark.x, edge.spark.y, 4.6);
  });
  pop();
}

function drawCorticalNeuronPath(points, startWeight, endWeight, strokeColor) {
  noFill();
  stroke(strokeColor);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  for (let i = 1; i < points.length; i++) {
    const t = (i - 1) / max(1, points.length - 2);
    strokeWeight(lerp(startWeight, endWeight, t));
    line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
}

function drawCorticalNeuronGlow(points, startWeight, endWeight, glowColor) {
  noFill();
  stroke(glowColor);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  for (let i = 1; i < points.length; i++) {
    const t = (i - 1) / max(1, points.length - 2);
    strokeWeight(lerp(startWeight, endWeight, t));
    line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
}

function drawCorticalUniformPath(points, strokeWeightValue, strokeColor) {
  noFill();
  stroke(strokeColor);
  strokeCap(ROUND);
  strokeJoin(ROUND);
  strokeWeight(strokeWeightValue);
  for (let i = 1; i < points.length; i++) {
    line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
}

function getPathLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  return total;
}

function buildCorticalPathMetrics(points) {
  const cumulativeLengths = [0];
  let totalLength = 0;

  for (let i = 1; i < points.length; i++) {
    totalLength += dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    cumulativeLengths.push(totalLength);
  }

  return {
    points,
    cumulativeLengths,
    totalLength
  };
}

function samplePathAtFraction(points, fraction) {
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y };

  const totalLength = getPathLength(points);
  const target = constrain(fraction, 0, 1) * totalLength;
  let traveled = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segmentLength = dist(a.x, a.y, b.x, b.y);
    if (traveled + segmentLength >= target) {
      const t = (target - traveled) / max(0.0001, segmentLength);
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
      };
    }
    traveled += segmentLength;
  }

  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

function sampleMeasuredPathAtFraction(path, fraction) {
  if (path?.flowSamples?.length) {
    return sampleCorticalFlowRouteAtFraction(path, fraction);
  }
  return sampleMeasuredPathAtFractionLinear(path, fraction);
}

function sampleMeasuredPathAtFractionLinear(path, fraction) {
  const points = path?.points || [];
  if (!points.length) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0].x, y: points[0].y };

  const cumulativeLengths = path.cumulativeLengths || [];
  const totalLength = path.totalLength || cumulativeLengths[cumulativeLengths.length - 1] || 0;
  const target = constrain(fraction, 0, 1) * totalLength;

  for (let i = 1; i < cumulativeLengths.length; i++) {
    if (cumulativeLengths[i] >= target) {
      const a = points[i - 1];
      const b = points[i];
      const segmentStart = cumulativeLengths[i - 1];
      const segmentLength = max(0.0001, cumulativeLengths[i] - segmentStart);
      const t = (target - segmentStart) / segmentLength;
      return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
      };
    }
  }

  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

function buildCorticalFlowRouteSamples(route, spacing = 4) {
  const sampleCount = max(2, ceil((route?.totalLength || route?.length || 0) / spacing));
  const samples = [];
  for (let i = 0; i <= sampleCount; i++) {
    samples.push(sampleMeasuredPathAtFractionLinear(route, i / sampleCount));
  }
  return samples;
}

function sampleCorticalFlowRouteAtFraction(route, fraction) {
  const samples = route?.flowSamples || [];
  if (!samples.length) return sampleMeasuredPathAtFractionLinear(route, fraction);
  if (samples.length === 1) return { x: samples[0].x, y: samples[0].y };

  const scaledIndex = constrain(fraction, 0, 1) * (samples.length - 1);
  const index = min(samples.length - 2, floor(scaledIndex));
  const t = scaledIndex - index;
  const a = samples[index];
  const b = samples[index + 1];
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  };
}

function sampleCorticalFlowRouteFrame(route, fraction) {
  const samples = route?.flowSamples || [];
  if (samples.length < 2) {
    const center = sampleMeasuredPathAtFractionLinear(route, fraction);
    const ahead = sampleMeasuredPathAtFractionLinear(route, min(1, fraction + 0.015));
    const behind = sampleMeasuredPathAtFractionLinear(route, max(0, fraction - 0.015));
    return { center, ahead, behind };
  }

  const scaledIndex = constrain(fraction, 0, 1) * (samples.length - 1);
  const index = min(samples.length - 2, floor(scaledIndex));
  const t = scaledIndex - index;
  const a = samples[index];
  const b = samples[index + 1];
  return {
    center: {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t)
    },
    ahead: samples[min(samples.length - 1, index + 2)],
    behind: samples[max(0, index - 1)]
  };
}

function drawCorticalMicrovascularNetwork(baseScale = 1) {
  drawCorticalMicrovascularNetworkStatic(baseScale);
  drawCorticalMoleculeFlow();
}

function drawCorticalMicrovascularNetworkStatic(baseScale = 1) {
  const arteryColor = color(228, 76, 76);
  const capillaryColor = color(146, 92, 198);
  const veinColor = color(74, 142, 236);
  const vesselBorderColor = color(18, 22, 30);
  const vesselWeight = 26;
  const vascularFade = 0.62;
  const vascularData = ensureCorticalMicrovascularFlowData();
  ensureCorticalFlowSeeded();

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  drawingContext.globalAlpha = vascularFade;
  const renderedContinuousNetwork = renderCorticalContinuousNetwork(
    vascularData.mergedSegments,
    vascularData.outlinePreview,
    arteryColor,
    capillaryColor,
    veinColor,
    vesselBorderColor,
    vesselWeight
  );
  if (!renderedContinuousNetwork) {
    drawMergedVascularSegments(
      vascularData.mergedSegments,
      arteryColor,
      capillaryColor,
      veinColor,
      vesselWeight,
      vesselBorderColor
    );
  }
  drawCorticalEndothelialCells(vascularData.endothelialCells);
  drawCorticalPericytes(vascularData.pericytes);
  drawCorticalPericyteEndfeet(vascularData.pericyteEndfeet);
  // if (window.showCorticalBbbDebug) {
  //   drawCorticalBbbDebugOverlay(vascularData.endothelialGuides);
  // }
  drawCorticalDescendingBranchBbbUnits(baseScale);
  drawCorticalCapillaryBedBbbUnits(baseScale);
  drawingContext.globalAlpha = 1;

  noStroke();
  fill(244, 246, 250);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(30);
  text("CORTICAL MICROVASCULAR NETWORK", 0, -272);

  pop();
}

function drawCorticalDescendingBranchBbbUnits(baseScale = 1) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const scaleFactor = getCorticalBbbResponsiveScaleFactor(baseScale);
  const bedCutoffs = (vascularData.routes || []).map((route) => ({
    centerY: route.bedCenterY,
    topY: route.bedCenterY - (route.bedBand || 34) - 6
  }));
  const branchGuides = (vascularData.endothelialGuides || []).filter((guide) => {
    const segment = guide?.segment;
    if (!segment || (segment.layer || 0) !== 3) return false;
    const points = getEndothelialGuidePoints(guide);
    if (points.length < 2) return false;
    const start = points[0];
    const end = points[points.length - 1];
    return abs(end.y - start.y) > 24;
  });

  branchGuides.forEach((guide) => {
    const points = getEndothelialGuidePoints(guide);
    const pathLength = getPathLength(points);
    if (!Number.isFinite(pathLength) || pathLength < 20) return;

    const segment = guide.segment;
    const widthScale = segment.widthScale || 1;
    const borderHalfWidth = (26 * widthScale + 3.2) * 0.5;
    const endothelialAnchorOffset = max(2.8, borderHalfWidth - 1.8);
    const spacing = 17 * getCorticalAgingBbbGapMultiplier();
    const guideMaxY = points.reduce((maxY, point) => max(maxY, point.y), -Infinity);
    const bedCutoff = bedCutoffs.find((cutoff) => {
      return guideMaxY >= cutoff.topY && abs(guideMaxY - cutoff.centerY) <= 58;
    });
    const medialStopY = bedCutoff ? bedCutoff.topY + 4 : Infinity;
    const topClearance = 28 / pathLength;
    const trimStart = max(constrain(guide.trimStart || 0, 0, 0.45), topClearance);
    const trimEnd = constrain(guide.trimEnd || 0, 0, 0.45);
    const startT = trimStart;
    const sideModes = guide.sideMode === "both" ? [-1, 1] : [guide.sideMode];
    const hasTerminalCapPlacement = sideModes.length === 1;
    const endT = hasTerminalCapPlacement ? 1 : 1 - trimEnd;
    if (endT - startT <= 0.08) return;

    const count = max(2, ceil((pathLength * (endT - startT)) / spacing));
    let terminalFrame = null;

    for (let i = 0; i <= count; i++) {
      const t = startT + (endT - startT) * (i / max(1, count));
      const center = samplePathAtFraction(points, t);
      if (center.y < -154) continue;

      const ahead = samplePathAtFraction(points, min(endT, t + 0.035));
      const behind = samplePathAtFraction(points, max(startT, t - 0.035));
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const tangentLength = sqrt(dx * dx + dy * dy);
      if (tangentLength < 0.0001) continue;

      const tangentAngle = atan2(dy, dx);
      const nx = -dy / tangentLength;
      const ny = dx / tangentLength;
      terminalFrame = {
        center,
        tx: dx / tangentLength,
        ty: dy / tangentLength,
        tangentAngle,
        index: i
      };

      sideModes.forEach((side) => {
        if (side !== -1 && side !== 1) return;
        if (hasTerminalCapPlacement && i === count) return;
        const isMedialSide = center.x < 0 ? side === -1 : side === 1;
        const anchorX = center.x + nx * endothelialAnchorOffset * side;
        const anchorY = center.y + ny * endothelialAnchorOffset * side;
        if (isMedialSide && (center.y >= medialStopY || anchorY >= medialStopY)) return;
        drawAnchoredCorticalBbbUnit(
          anchorX,
          anchorY,
          tangentAngle,
          getCorticalBbbUnitOptions({
            scaleFactor,
            astrocyteSide: side,
            omitTopEndothelial: i === 0,
            omitTopPericyte: i === 0
          })
        );
      });
    }

    if (hasTerminalCapPlacement && terminalFrame) {
      const terminalCenter = samplePathAtFraction(points, endT);
      const terminalBehind = samplePathAtFraction(points, max(startT, endT - 0.055));
      const terminalDx = terminalCenter.x - terminalBehind.x;
      const terminalDy = terminalCenter.y - terminalBehind.y;
      const terminalLength = sqrt(terminalDx * terminalDx + terminalDy * terminalDy);
      if (terminalLength < 0.0001) return;
      const terminalTx = terminalDx / terminalLength;
      const terminalTy = terminalDy / terminalLength;
      const terminalAngle = atan2(terminalDy, terminalDx);
      const isRightDescendingBranch = terminalCenter.x > 0;
      const isMiddleDescendingBranch = bedCutoff && bedCutoff.centerY >= 100 && bedCutoff.centerY < 240;
      const capEndpointNudge = bedCutoff && bedCutoff.centerY >= 240
        ? max(2, endothelialAnchorOffset * 0.28)
        : isMiddleDescendingBranch
          ? max(22, endothelialAnchorOffset * 4)
          : max(16, endothelialAnchorOffset * 3);
      const capAnchorX = terminalCenter.x + terminalTx * capEndpointNudge;
      const capAnchorY = terminalCenter.y + terminalTy * capEndpointNudge;
      const terminalSide = sideModes[0];
      const terminalNx = -terminalTy;
      const terminalNy = terminalTx;
      const lateralTailCenter = samplePathAtFraction(points, max(startT, endT - 0.018));
      drawAnchoredCorticalBbbUnit(
        lateralTailCenter.x + terminalNx * endothelialAnchorOffset * terminalSide,
        lateralTailCenter.y + terminalNy * endothelialAnchorOffset * terminalSide,
        terminalAngle,
        getCorticalBbbUnitOptions({
          scaleFactor,
          scaleX: 0.92,
          astrocyteSide: terminalSide,
          omitTopEndothelial: false,
          omitTopPericyte: false
        })
      );
      drawAnchoredCorticalBbbUnit(
        capAnchorX,
        capAnchorY,
        terminalAngle + HALF_PI + (isRightDescendingBranch ? PI : 0),
        getCorticalBbbUnitOptions({
          scaleFactor,
          scaleX: 1.14,
          astrocyteSide: -terminalSide,
          omitTopEndothelial: false,
          omitTopPericyte: false
        })
      );
    }

    if (bedCutoff && bedCutoff.centerY < 240) {
      const terminalCenter = samplePathAtFraction(points, 1);
      const terminalBehind = samplePathAtFraction(points, max(startT, 0.92));
      const terminalDx = terminalCenter.x - terminalBehind.x;
      const terminalDy = terminalCenter.y - terminalBehind.y;
      const terminalLength = sqrt(terminalDx * terminalDx + terminalDy * terminalDy);
      if (terminalLength < 0.0001) return;

      const terminalAngle = atan2(terminalDy, terminalDx);
      const terminalNx = -terminalDy / terminalLength;
      const terminalNy = terminalDx / terminalLength;
      [-1, 1].forEach((side) => {
        const terminalAnchorX = terminalCenter.x + terminalNx * endothelialAnchorOffset * side;
        const terminalAnchorY = terminalCenter.y + terminalNy * endothelialAnchorOffset * side;
        drawAnchoredCorticalBbbUnit(
          terminalAnchorX,
          terminalAnchorY,
          terminalAngle,
          getCorticalBbbUnitOptions({
            scaleFactor,
            scaleX: 0.88,
            astrocyteSide: side,
            omitTopEndothelial: false,
            omitTopPericyte: false
          })
        );
      });
      const isRightDescendingBranch = terminalCenter.x > 0;
      const isMiddleDescendingBranch = bedCutoff && bedCutoff.centerY >= 100 && bedCutoff.centerY < 240;
      const capEndpointNudge = bedCutoff && bedCutoff.centerY >= 240
        ? max(2, endothelialAnchorOffset * 0.28)
        : isMiddleDescendingBranch
          ? max(22, endothelialAnchorOffset * 4)
          : max(16, endothelialAnchorOffset * 3);
      const terminalTx = terminalDx / terminalLength;
      const terminalTy = terminalDy / terminalLength;
      const lateralSide = terminalCenter.x < 0 ? 1 : -1;
      const lateralTailNudge = max(4, capEndpointNudge - endothelialAnchorOffset * 0.45);
      drawAnchoredCorticalBbbUnit(
        terminalCenter.x + terminalTx * lateralTailNudge + terminalNx * endothelialAnchorOffset * lateralSide,
        terminalCenter.y + terminalTy * lateralTailNudge + terminalNy * endothelialAnchorOffset * lateralSide,
        terminalAngle,
        getCorticalBbbUnitOptions({
          scaleFactor,
          scaleX: 0.9,
          astrocyteSide: lateralSide,
          omitTopEndothelial: false,
          omitTopPericyte: false
        })
      );
      const capAnchorX = terminalCenter.x + terminalTx * capEndpointNudge;
      const capAnchorY = terminalCenter.y + terminalTy * capEndpointNudge;
      drawAnchoredCorticalBbbUnit(
        capAnchorX,
        capAnchorY,
        terminalAngle + HALF_PI + (isRightDescendingBranch ? PI : 0),
        getCorticalBbbUnitOptions({
          scaleFactor,
          scaleX: 1.08,
          astrocyteSide: terminalCenter.x < 0 ? -1 : 1,
          omitTopEndothelial: false,
          omitTopPericyte: false
        })
      );
    }
  });
}

function drawCorticalCapillaryBedBbbUnits(baseScale = 1) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const placements = getCorticalCapillaryBedBbbPlacements(vascularData);

  const scaleFactor = getCorticalBbbResponsiveScaleFactor(baseScale);
  const { endothelialAnchorAngle, anchorNormalX, anchorNormalY } = getCorticalBbbUnitMetrics();
  placements.forEach((placement) => {
    const rotation = placement.angle - endothelialAnchorAngle;
    const rotatedNormalX = anchorNormalX * cos(rotation) - anchorNormalY * sin(rotation);
    const rotatedNormalY = anchorNormalX * sin(rotation) + anchorNormalY * cos(rotation);
    const astrocyteSide = rotatedNormalX * (placement.outwardX || 0) + rotatedNormalY * (placement.outwardY || 0) >= 0
      ? 1
      : -1;
    const isMiddleOrBottomBed = (placement.bedCenterY || 0) >= 100;
    const isMiddleBed = (placement.bedCenterY || 0) >= 100 && (placement.bedCenterY || 0) < 240;
    const isAngledPlacement = abs(sin(placement.angle || 0)) > 0.08;
    const angledPlacementScaleBoost = getCorticalResponsiveScreenValue(1, 1.08, 1.25);
    const placementScaleFactor =
      isMiddleOrBottomBed && isAngledPlacement
        ? scaleFactor * angledPlacementScaleBoost
        : scaleFactor;
    const placementRenderOptions = placement.renderOptions || {};
    drawAnchoredCorticalBbbUnit(
      placement.x + (placement.outwardX || 0) * (placement.outwardShift || 0),
      placement.y + (placement.outwardY || 0) * (placement.outwardShift || 0),
      placement.angle,
      getCorticalBbbUnitOptions({
        scaleFactor: placementScaleFactor,
        scaleX: placementRenderOptions.scaleX ?? placement.scaleX ?? 1,
        scaleY: placementRenderOptions.scaleY ?? placement.scaleY ?? (isMiddleBed && isAngledPlacement ? 1.12 : 1),
        endothelialAngleDelta: placementRenderOptions.endothelialAngleDelta ?? 0,
        omitTopEndothelial: placementRenderOptions.omitTopEndothelial ?? false,
        omitTopPericyte: placementRenderOptions.omitTopPericyte ?? false,
        astrocyteSide
      })
    );
  });

}

function buildCorticalStrokeAccurateCapillaryBbbPlacements(vascularData) {
  if (!vascularData?.mergedSegments?.length) return [];
  if (vascularData.strokeAccurateCapillaryBbbPlacements) {
    return vascularData.strokeAccurateCapillaryBbbPlacements;
  }

  const bedSpecs = [];
  (vascularData.routes || []).forEach((route) => {
    const centerY = route?.bedCenterY;
    const band = route?.bedBand || 34;
    if (!isFinite(centerY)) return;
    if (bedSpecs.some((spec) => abs(spec.centerY - centerY) < 1)) return;
    const bandPoints = (route.points || []).filter((point) => abs(point.y - centerY) <= band);
    const centerX = bandPoints.length
      ? bandPoints.reduce((sum, point) => sum + point.x, 0) / bandPoints.length
      : 0;
    bedSpecs.push({ centerX, centerY, band });
  });
  if (!bedSpecs.length) return [];

  const accepted = [];
  function overlapsExisting(x, y, bedCenterY, radius = 6.5) {
    return accepted.some((placement) => {
      if (abs((placement.bedCenterY || 0) - bedCenterY) > 1) return false;
      return dist(placement.x, placement.y, x, y) < radius;
    });
  }

  function getBedSpecForPoints(points) {
    const midpoint = samplePathAtFraction(points, 0.5);
    let bestSpec = null;
    let bestDistance = Infinity;
    bedSpecs.forEach((spec) => {
      const pointInBand = points.some((point) => abs(point.y - spec.centerY) <= spec.band + 24);
      if (!pointInBand) return;
      const distanceFromMidline = abs(midpoint.y - spec.centerY);
      if (distanceFromMidline < bestDistance) {
        bestSpec = spec;
        bestDistance = distanceFromMidline;
      }
    });
    return bestSpec;
  }

  function addPlacement(placement, radius = 6.5) {
    if (overlapsExisting(placement.x, placement.y, placement.bedCenterY, radius)) return false;
    accepted.push(placement);
    return true;
  }

  function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq <= 0.0001) return dist(px, py, ax, ay);
    const t = constrain(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
    return dist(px, py, ax + dx * t, ay + dy * t);
  }

  function pointToPathDistance(px, py, points) {
    let nearest = Infinity;
    for (let i = 1; i < points.length; i++) {
      nearest = min(
        nearest,
        pointToSegmentDistance(
          px,
          py,
          points[i - 1].x,
          points[i - 1].y,
          points[i].x,
          points[i].y
        )
      );
    }
    return nearest;
  }

  const strokeSegments = [];
  vascularData.mergedSegments.forEach((segment, segmentIndex) => {
    const segmentLayer = segment?.layer || 0;
    if (!segment || (segmentLayer !== 1 && !(segmentLayer === 2 && (segment.widthScale || 0) <= 0.2))) return;

    const points = sampleSegmentPoints(segment, 34);
    if (points.length < 2) return;
    const pathLength = getPathLength(points);
    if (!Number.isFinite(pathLength) || pathLength < 12) return;

    const bedSpec = getBedSpecForPoints(points);
    if (!bedSpec) return;

    const widthScale = segment.widthScale || 0.14;
    strokeSegments.push({
      segment,
      segmentIndex,
      points,
      pathLength,
      bedSpec,
      strokeRadius: (26 * widthScale + 2.2) * 0.5
    });
  });

  const junctionBlockerSegments = [];
  vascularData.mergedSegments.forEach((segment, segmentIndex) => {
    const segmentLayer = segment?.layer || 0;
    if (!segment || (segmentLayer !== 2 && segmentLayer !== 3)) return;

    const points = sampleSegmentPoints(segment, 34);
    if (points.length < 2) return;
    const pathLength = getPathLength(points);
    if (!Number.isFinite(pathLength) || pathLength < 12) return;

    const bedSpec = getBedSpecForPoints(points);
    if (!bedSpec) return;
    const entersBedBand = points.some((point) => abs(point.y - bedSpec.centerY) <= bedSpec.band + 30);
    if (!entersBedBand) return;

    const widthScale = segment.widthScale || 0.16;
    junctionBlockerSegments.push({
      segment,
      segmentIndex,
      points,
      pathLength,
      bedSpec,
      strokeRadius: (26 * widthScale + 4.4) * 0.5
    });
  });

  const bedBounds = new Map();
  strokeSegments.forEach((stroke) => {
    const key = String(stroke.bedSpec.centerY);
    const bounds = bedBounds.get(key) || {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity
    };
    stroke.points.forEach((point) => {
      bounds.minX = min(bounds.minX, point.x);
      bounds.maxX = max(bounds.maxX, point.x);
      bounds.minY = min(bounds.minY, point.y);
      bounds.maxY = max(bounds.maxY, point.y);
    });
    bedBounds.set(key, bounds);
  });

  function getBlockingSegments(sourceSegmentIndex, bedCenterY) {
    return strokeSegments
      .concat(junctionBlockerSegments)
      .filter((stroke) => {
        if (stroke.segmentIndex === sourceSegmentIndex) return false;
        return abs(stroke.bedSpec.centerY - bedCenterY) <= 1;
      });
  }

  function pointTouchesBlockingStroke(point, sourceSegmentIndex, bedCenterY, padding = 2.4) {
    return getBlockingSegments(sourceSegmentIndex, bedCenterY).some((stroke) => {
      return pointToPathDistance(point.x, point.y, stroke.points) <= stroke.strokeRadius + padding;
    });
  }

  function getStrokeClearanceAlongTangent(x, y, tx, ty, sourceSegmentIndex, bedCenterY, maxDistance) {
    const step = 1.25;
    for (let distanceAlong = step; distanceAlong <= maxDistance; distanceAlong += step) {
      const px = x + tx * distanceAlong;
      const py = y + ty * distanceAlong;
      const hitsOtherStroke = getBlockingSegments(sourceSegmentIndex, bedCenterY).some((stroke) => {
        return pointToPathDistance(px, py, stroke.points) <= stroke.strokeRadius + 1.4;
      });
      if (hitsOtherStroke) return max(0, distanceAlong - step);
    }
    return maxDistance;
  }

  function bbbBodyTouchesJunctionBlocker(x, y, angle, sourceSegmentIndex, bedCenterY, preferredScaleY = 0.9) {
    if (bedCenterY < 100) return false;

    const blockers = junctionBlockerSegments.filter((stroke) => {
      if (stroke.segmentIndex === sourceSegmentIndex) return false;
      return abs(stroke.bedSpec.centerY - bedCenterY) <= 1;
    });
    if (!blockers.length) return false;

    const tx = cos(angle);
    const ty = sin(angle);
    const nx = -ty;
    const ny = tx;
    const renderScaleMultiplier = abs(sin(angle || 0)) > 0.08 ? 1.25 : 1;
    const halfLength = 93 * (1 / 7.5) * renderScaleMultiplier * preferredScaleY;
    const sampleStep = 3;

    for (let along = -halfLength; along <= halfLength; along += sampleStep) {
      for (let lateral = -2.2; lateral <= 2.2; lateral += 2.2) {
        const px = x + tx * along + nx * lateral;
        const py = y + ty * along + ny * lateral;
        const hitsJunctionBlocker = blockers.some((stroke) => {
          return pointToPathDistance(px, py, stroke.points) <= stroke.strokeRadius + 4.8;
        });
        if (hitsJunctionBlocker) return true;
      }
    }

    return false;
  }

  function getPlacementScaleY(x, y, angle, bedCenterY, sourceSegmentIndex, preferredScaleY = 0.9) {
    const tx = cos(angle);
    const ty = sin(angle);
    const renderScaleMultiplier = bedCenterY >= 100 && abs(sin(angle || 0)) > 0.08 ? 1.25 : 1;
    const bbbHalfLength = 93 * (1 / 7.5) * renderScaleMultiplier;
    const preferredHalfLength = bbbHalfLength * preferredScaleY;
    const anchorStrokePadding = bedCenterY < 100 ? 0.2 : 1.8;
    if (pointTouchesBlockingStroke({ x, y }, sourceSegmentIndex, bedCenterY, anchorStrokePadding)) return 0;
    const forwardClearance = getStrokeClearanceAlongTangent(
      x,
      y,
      tx,
      ty,
      sourceSegmentIndex,
      bedCenterY,
      preferredHalfLength
    );
    const backwardClearance = getStrokeClearanceAlongTangent(
      x,
      y,
      -tx,
      -ty,
      sourceSegmentIndex,
      bedCenterY,
      preferredHalfLength
    );
    const allowedHalfLength = min(preferredHalfLength, forwardClearance - 1.2, backwardClearance - 1.2);
    const minimumScaleY = bedCenterY < 100 ? 0.18 : 0.24;
    if (allowedHalfLength < bbbHalfLength * minimumScaleY) return 0;
    return constrain(allowedHalfLength / bbbHalfLength, minimumScaleY, preferredScaleY);
  }

  function endpointTouchesAnotherStroke(point, sourceSegmentIndex, bedCenterY) {
    return pointTouchesBlockingStroke(point, sourceSegmentIndex, bedCenterY, 3.8);
  }

  function capOverlapsTopJunction(point, anchorX, anchorY, sourceSegmentIndex, bedCenterY) {
    const bounds = bedBounds.get(String(bedCenterY));
    if (!bounds || point.y > bedCenterY + 16) return false;
    const isLateralBedEnd =
      point.x <= bounds.minX + 78 ||
      point.x >= bounds.maxX - 78 ||
      anchorX <= bounds.minX + 78 ||
      anchorX >= bounds.maxX - 78;
    if (!isLateralBedEnd) return false;

    const junctionBlockers = junctionBlockerSegments.filter((stroke) => {
      if (stroke.segmentIndex === sourceSegmentIndex) return false;
      return abs(stroke.bedSpec.centerY - bedCenterY) <= 1;
    });
    if (!junctionBlockers.length) return false;

    return (
      junctionBlockers.some((stroke) => pointToPathDistance(point.x, point.y, stroke.points) <= stroke.strokeRadius + 22) ||
      junctionBlockers.some((stroke) => pointToPathDistance(anchorX, anchorY, stroke.points) <= stroke.strokeRadius + 18)
    );
  }

  function isMiddleBedUpperLateralCap(point, anchorX, anchorY, bedCenterY) {
    if (bedCenterY < 100 || bedCenterY >= 240) return false;
    const bounds = bedBounds.get(String(bedCenterY));
    if (!bounds || point.y > bedCenterY + 24) return false;
    return (
      point.x <= bounds.minX + 92 ||
      point.x >= bounds.maxX - 92 ||
      anchorX <= bounds.minX + 92 ||
      anchorX >= bounds.maxX - 92
    );
  }

  strokeSegments.forEach((stroke) => {
    const { segment, points, pathLength, bedSpec, strokeRadius, segmentIndex } = stroke;
    const offsetDistance = max(2.8, strokeRadius + 2.2);
    const baseSpacing = bedSpec.centerY < 100 ? 6.4 : bedSpec.centerY < 240 ? 8.8 : 10.8;
    const spacing = baseSpacing * getCorticalAgingBbbGapMultiplier();
    const count = max(1, ceil(pathLength / spacing));
    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 0.5 : i / count;
      const center = samplePathAtFraction(points, t);
      if (abs(center.y - bedSpec.centerY) > bedSpec.band + 26) continue;

      const ahead = samplePathAtFraction(points, min(1, t + 0.04));
      const behind = samplePathAtFraction(points, max(0, t - 0.04));
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const tangentLength = sqrt(dx * dx + dy * dy);
      if (tangentLength < 0.0001) continue;

      const tangentAngle = atan2(dy, dx);
      const nx = -dy / tangentLength;
      const ny = dx / tangentLength;

      [-1, 1].forEach((side) => {
        const outwardX = nx * side;
        const outwardY = ny * side;
        const placementX = center.x + outwardX * offsetDistance;
        const placementY = center.y + outwardY * offsetDistance;
        const scaleY = getPlacementScaleY(
          placementX,
          placementY,
          tangentAngle,
          bedSpec.centerY,
          segmentIndex,
          0.9
        );
        if (scaleY <= 0) return;
        addPlacement({
          x: placementX,
          y: placementY,
          angle: tangentAngle,
          outwardX,
          outwardY,
          outwardShift: 0,
          bedCenterY: bedSpec.centerY,
          pathId: `stroke-${segmentIndex}-${side}`,
          sampleT: t,
          placementSpacingThreshold: bedSpec.centerY < 100 ? 3.4 : 4.8,
          scaleX: 0.84,
          scaleY
        }, bedSpec.centerY < 100 ? 3.4 : 4.8);
      });
    }

    const start = points[0];
    const end = points[points.length - 1];
    const startNext = samplePathAtFraction(points, min(1, 0.06));
    const endPrev = samplePathAtFraction(points, max(0, 0.94));
    [
      {
        point: start,
        dx: startNext.x - start.x,
        dy: startNext.y - start.y,
        direction: -1,
        id: "start"
      },
      {
        point: end,
        dx: end.x - endPrev.x,
        dy: end.y - endPrev.y,
        direction: 1,
        id: "end"
      }
    ].forEach((cap) => {
      if (abs(cap.point.y - bedSpec.centerY) > bedSpec.band + 26) return;
      if ((segment.layer || 0) === 2 && cap.point.y <= bedSpec.centerY + 18) return;
      if (endpointTouchesAnotherStroke(cap.point, segmentIndex, bedSpec.centerY)) return;
      const tangentLength = sqrt(cap.dx * cap.dx + cap.dy * cap.dy);
      if (tangentLength < 0.0001) return;
      const tx = cap.dx / tangentLength;
      const ty = cap.dy / tangentLength;
      const anchorX = cap.point.x + tx * offsetDistance * cap.direction;
      const anchorY = cap.point.y + ty * offsetDistance * cap.direction;
      const capAngle = atan2(cap.dy, cap.dx) + HALF_PI;
      if (isMiddleBedUpperLateralCap(cap.point, anchorX, anchorY, bedSpec.centerY)) return;
      if (capOverlapsTopJunction(cap.point, anchorX, anchorY, segmentIndex, bedSpec.centerY)) return;
      if (bbbBodyTouchesJunctionBlocker(anchorX, anchorY, capAngle, segmentIndex, bedSpec.centerY, 0.82)) return;
      const scaleY = getPlacementScaleY(anchorX, anchorY, capAngle, bedSpec.centerY, segmentIndex, 0.9);
      if (scaleY <= 0) return;
      addPlacement({
        x: anchorX,
        y: anchorY,
        angle: capAngle,
        outwardX: tx * cap.direction,
        outwardY: ty * cap.direction,
        outwardShift: 0,
        bedCenterY: bedSpec.centerY,
        pathId: `stroke-${segmentIndex}-${cap.id}-cap`,
        sampleT: cap.direction < 0 ? 0 : 1,
        placementSpacingThreshold: 5.8,
        scaleX: 0.88,
        scaleY
      }, 5.8);
    });
  });

  strokeSegments.forEach((stroke) => {
    const { points, pathLength, bedSpec, strokeRadius, segmentIndex } = stroke;
    if (bedSpec.centerY >= 100) return;

    const offsetDistance = max(2.2, strokeRadius + 1.2);
    const sampleFractions = pathLength < 22 ? [0.5] : [0.28, 0.62];
    sampleFractions.forEach((t) => {
      const center = samplePathAtFraction(points, t);
      if (abs(center.y - bedSpec.centerY) > bedSpec.band + 30) return;

      const ahead = samplePathAtFraction(points, min(1, t + 0.08));
      const behind = samplePathAtFraction(points, max(0, t - 0.08));
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const tangentLength = sqrt(dx * dx + dy * dy);
      if (tangentLength < 0.0001) return;

      const tangentAngle = atan2(dy, dx);
      const nx = -dy / tangentLength;
      const ny = dx / tangentLength;
      [-1, 1].forEach((side) => {
        const outwardX = nx * side;
        const outwardY = ny * side;
        const placementX = center.x + outwardX * offsetDistance;
        const placementY = center.y + outwardY * offsetDistance;
        addPlacement({
          x: placementX,
          y: placementY,
          angle: tangentAngle,
          outwardX,
          outwardY,
          outwardShift: 0,
          bedCenterY: bedSpec.centerY,
          pathId: `top-micro-${segmentIndex}-${side}`,
          sampleT: t,
          placementSpacingThreshold: 2.2,
          scaleX: 0.62,
          scaleY: 0.2
        }, 2.2);
      });
    });
  });

  vascularData.strokeAccurateCapillaryBbbPlacements = accepted;
  return accepted;
}

function getCorticalCapillaryBedBbbPlacements(vascularData) {
  return buildCorticalStrokeAccurateCapillaryBbbPlacements(vascularData);
}

function pruneOverlappingCapillaryBedPlacements(placements) {
  if (!placements?.length) return [];

  const sortedPlacements = placements.slice().sort((a, b) => {
    const priorityDelta = (b.placementPriority || 0) - (a.placementPriority || 0);
    if (priorityDelta) return priorityDelta;
    const bedDelta = (a.bedCenterY || 0) - (b.bedCenterY || 0);
    if (bedDelta) return bedDelta;
    const borderA = a.bedBorder || "";
    const borderB = b.bedBorder || "";
    if (borderA !== borderB) return borderA.localeCompare(borderB);
    return a.x - b.x || a.y - b.y;
  });

  const accepted = [];
  sortedPlacements.forEach((placement) => {
    const spacingThreshold = (placement.placementSpacingThreshold || 11.5) * getCorticalAgingBbbGapMultiplier();
    const overlapsExisting = accepted.some((existing) => {
      if (abs((existing.bedCenterY || 0) - (placement.bedCenterY || 0)) > 1) return false;
      const existingThreshold = (existing.placementSpacingThreshold || 11.5) * getCorticalAgingBbbGapMultiplier();
      const minimumSpacing = max(spacingThreshold, existingThreshold);
      return dist(existing.x, existing.y, placement.x, placement.y) < minimumSpacing;
    });
    if (!overlapsExisting) accepted.push(placement);
  });

  return accepted;
}

function placementNearDescendingBranchJunction(vascularData, x, y) {
  return placementNearDescendingBranchJunctionWithContext(vascularData, { x, y });
}

function placementNearDescendingBranchJunctionWithContext(vascularData, placement) {
  if (placement?.ignoreJunctionFilter) return false;
  const corridors = vascularData?.outlinePreview?.descendingBranchCorridors || [];
  const isTopBorderPlacement = placement?.bedBorder === "top";
  const isBottomBorderPlacement = placement?.bedBorder === "bottom";
  return corridors.some((corridor) => {
    const lateralThreshold = isTopBorderPlacement ? 18 : isBottomBorderPlacement ? 16 : 28;
    const minY = isTopBorderPlacement ? corridor.minY - 6 : isBottomBorderPlacement ? corridor.minY + 6 : corridor.minY - 12;
    const maxY = isTopBorderPlacement ? corridor.maxY + 6 : isBottomBorderPlacement ? corridor.maxY + 10 : corridor.maxY + 18;
    return abs(placement.x - corridor.x) < lateralThreshold &&
      placement.y >= minY &&
      placement.y <= maxY;
  });
}

function buildCorticalCapillaryBedSilhouettePlacements(vascularData) {
  const outlinePreview = vascularData?.outlinePreview;
  if (!outlinePreview) return [];
  if (outlinePreview.capillaryBedSilhouettePlacements) {
    return outlinePreview.capillaryBedSilhouettePlacements;
  }

  const bedSpecs = [];
  (vascularData?.routes || []).forEach((route) => {
    const centerY = route?.bedCenterY;
    const band = route?.bedBand || 34;
    if (!isFinite(centerY)) return;
    if (bedSpecs.some((spec) => abs(spec.centerY - centerY) < 1)) return;
    const bandPoints = (route.points || []).filter((point) => abs(point.y - centerY) <= band);
    const centerX = bandPoints.length
      ? bandPoints.reduce((sum, point) => sum + point.x, 0) / bandPoints.length
      : 0;
    bedSpecs.push({ centerX, centerY, band });
  });
  if (!bedSpecs.length) return [];

  const corridors = outlinePreview.descendingBranchCorridors || [];
  const contourPaths = getCorticalOutlineContourPaths(outlinePreview);
  const bedProfiles = bedSpecs.map((spec) => {
    const bandPoints = contourPaths.flatMap((path) =>
      (path || []).filter((point) => abs(point.y - spec.centerY) <= spec.band + 12)
    );
    if (!bandPoints.length) {
      return {
        ...spec,
        minX: spec.centerX - 120,
        maxX: spec.centerX + 120
      };
    }
    return {
      ...spec,
      minX: bandPoints.reduce((value, point) => min(value, point.x), Infinity),
      maxX: bandPoints.reduce((value, point) => max(value, point.x), -Infinity)
    };
  });
  const placements = [];

  function liesNearBranchJunction(x, y) {
    return corridors.some((corridor) => {
      return abs(x - corridor.x) < 22 && y >= corridor.minY - 6 && y <= corridor.maxY + 8;
    });
  }

  function getPlacementBorder(outwardX, outwardY) {
    if (abs(outwardY) >= abs(outwardX)) {
      return outwardY < 0 ? "top" : "bottom";
    }
    return outwardX < 0 ? "left" : "right";
  }

  function fillContourPlacementGaps(sourcePlacements) {
    const additions = [];
    const groupedByPath = new Map();
    sourcePlacements.forEach((placement) => {
      const key = `${placement.pathId}:${placement.bedCenterY}`;
      if (!groupedByPath.has(key)) groupedByPath.set(key, []);
      groupedByPath.get(key).push(placement);
    });

    groupedByPath.forEach((group) => {
      const ordered = group.slice().sort((a, b) => (a.sampleIndex || 0) - (b.sampleIndex || 0));
      for (let i = 1; i < ordered.length; i++) {
        const previous = ordered[i - 1];
        const current = ordered[i];
        const gapDistance = dist(previous.x, previous.y, current.x, current.y);
        if (gapDistance <= 20 || gapDistance >= 96) continue;

        const outwardX = (previous.outwardX + current.outwardX) * 0.5;
        const outwardY = (previous.outwardY + current.outwardY) * 0.5;
        const outwardLength = sqrt(outwardX * outwardX + outwardY * outwardY) || 1;
        const normalizedOutwardX = outwardX / outwardLength;
        const normalizedOutwardY = outwardY / outwardLength;
        const gapFillCount = constrain(floor(gapDistance / 20), 1, 3);
        for (let fillIndex = 1; fillIndex <= gapFillCount; fillIndex++) {
          const fillT = fillIndex / (gapFillCount + 1);
          additions.push({
            x: lerp(previous.x, current.x, fillT),
            y: lerp(previous.y, current.y, fillT),
            angle: atan2(current.y - previous.y, current.x - previous.x),
            outwardX: normalizedOutwardX,
            outwardY: normalizedOutwardY,
            outwardShift: min(previous.outwardShift || 8, current.outwardShift || 8),
            pathId: previous.pathId,
            sampleIndex: lerp(previous.sampleIndex, current.sampleIndex, fillT),
            bedCenterY: previous.bedCenterY,
            bedBorder: getPlacementBorder(normalizedOutwardX, normalizedOutwardY),
            placementPriority: -1,
            placementSpacingThreshold: 9.5
          });
        }
      }
    });

    return sourcePlacements.concat(additions);
  }

  contourPaths.forEach((path, pathIndex) => {
    if (!path || path.length < 6) return;

    const sampled = resamplePath(path, 14);
    if (sampled.length < 4) return;

    let lastPlacement = null;
    for (let i = 1; i < sampled.length - 1; i++) {
      const point = sampled[i];
      const bedSpec = bedProfiles.find((spec) => abs(point.y - spec.centerY) <= spec.band + 14);
      if (!bedSpec) continue;
      if (liesNearBranchJunction(point.x, point.y)) continue;

      const prev = sampled[i - 1];
      const next = sampled[i + 1];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const tangentLength = sqrt(dx * dx + dy * dy);
      if (tangentLength < 0.0001) continue;
      const isMostlyVertical = abs(dy) > abs(dx) * 1.35;
      const nearOuterLeftEdge = abs(point.x - bedSpec.minX) <= 24;
      const nearOuterRightEdge = abs(point.x - bedSpec.maxX) <= 24;
      const isMiddleBed = bedSpec.centerY >= 100 && bedSpec.centerY < 240;
      if (isMostlyVertical && !isMiddleBed && !nearOuterLeftEdge && !nearOuterRightEdge) continue;

      if (lastPlacement && dist(point.x, point.y, lastPlacement.x, lastPlacement.y) < 11) {
        continue;
      }

      const angle = atan2(dy, dx);
      const radialX = point.x - bedSpec.centerX;
      const radialY = point.y - bedSpec.centerY;
      const radialLength = sqrt(radialX * radialX + radialY * radialY) || 1;
      const radialOutwardX = radialX / radialLength;
      const radialOutwardY = radialY / radialLength;
      let outwardX = -dy / tangentLength;
      let outwardY = dx / tangentLength;
      if (outwardX * radialOutwardX + outwardY * radialOutwardY < 0) {
        outwardX *= -1;
        outwardY *= -1;
      }

      placements.push({
        x: point.x,
        y: point.y,
        angle,
        outwardX,
        outwardY,
        outwardShift: 8,
        pathId: `silhouette-bed-${pathIndex}`,
        sampleIndex: i,
        bedCenterY: bedSpec.centerY,
        bedBorder: getPlacementBorder(outwardX, outwardY),
        placementSpacingThreshold: 11.5
      });
      lastPlacement = point;
    }
  });

  outlinePreview.capillaryBedSilhouettePlacements = fillContourPlacementGaps(placements);
  return outlinePreview.capillaryBedSilhouettePlacements;
}


function getCorticalMoleculeFlowState() {
  if (!window.corticalMoleculeFlowState) {
    window.corticalMoleculeFlowState = {
      particles: [],
      escapeParticles: [],
      pool: [],
      spawnCounter: 0,
      routeCount: 0
    };
  }

  return window.corticalMoleculeFlowState;
}

function ensureCorticalMicrovascularFlowData() {
  const agingEnabled = isCorticalAgingEnabled();
  if (
    corticalMicrovascularFlowData &&
    corticalMicrovascularFlowData.version === CORTICAL_MICROVASCULAR_DATA_VERSION &&
    corticalMicrovascularFlowData.agingEnabled === agingEnabled
  ) {
    return corticalMicrovascularFlowData;
  }
  const cacheKey = `${CORTICAL_MICROVASCULAR_DATA_VERSION}:${agingEnabled ? "aging" : "baseline"}`;
  const cachedData = corticalMicrovascularFlowDataCache.get(cacheKey);
  if (cachedData) {
    corticalMicrovascularFlowData = cachedData;
    return corticalMicrovascularFlowData;
  }

  const topY = -190;
  const leftX = -492;
  const rightX = 492;
  const pathwayDepths = [28, 124, 272];
  const arteryMainStartX = leftX - 122;
  const arteryMainEndX = -150;
  const veinMainStartX = 150;
  const veinMainEndX = rightX + 122;
  const arteryAnchors = [-150, -310, -510];
  const veinAnchors = [150, 310, 510];
  const mergedSegments = [];
  const routes = [];
  const endothelialGuides = [];
  const capillaryBedBbbPlacements = [];

  pathwayDepths.forEach((bottomY, index) => {
    const network = createBranchNetwork(
      topY,
      bottomY,
      arteryAnchors[index],
      veinAnchors[index],
      {
        agingBranchReduction: agingEnabled,
        extendBed: index === pathwayDepths.length - 1,
        junctionGuideMode: index === 0
          ? "trim-trunk-before-hub"
          : index === 1
            ? "trim-branch-fan-before-hub"
            : "exclude-first-interface-guide"
      }
    );

    mergedSegments.push(...network.segments);
    endothelialGuides.push(...network.endothelialGuides);
    capillaryBedBbbPlacements.push(...(network.capillaryBedBbbPlacements || []));

    network.flowRoutes.forEach((routePoints, routeIndex) => {
      const points = dedupeRoutePoints([
        { x: arteryMainStartX, y: topY },
        { x: arteryAnchors[index], y: topY },
        ...routePoints,
        { x: veinAnchors[index], y: topY },
        { x: veinMainEndX, y: topY }
      ]);
      const smoothedPoints = resamplePath(points, 10);
      const pathMetrics = buildCorticalPathMetrics(smoothedPoints);
      const route = {
        id: `${index}-${routeIndex}`,
        bedCenterY: bottomY,
        bedBand: index === pathwayDepths.length - 1 ? 42 : 34,
        points: pathMetrics.points,
        cumulativeLengths: pathMetrics.cumulativeLengths,
        length: pathMetrics.totalLength,
        totalLength: pathMetrics.totalLength
      };
      route.flowSamples = buildCorticalFlowRouteSamples(route);
      routes.push(route);
    });
  });

  mergedSegments.push(
    addMainSegment({
      start: { x: arteryMainStartX, y: topY },
      end: { x: arteryMainEndX, y: topY },
      tStart: 0,
      tEnd: 0.2,
      widthScale: 1,
      curveOffset: 0,
      layer: 4
    }, endothelialGuides),
    addMainSegment({
      start: { x: veinMainStartX, y: topY },
      end: { x: veinMainEndX, y: topY },
      tStart: 0.85,
      tEnd: 1,
      widthScale: 1,
      curveOffset: 0,
      layer: 4
    }, endothelialGuides)
  );

  const outlinePreview = buildCorticalOutlinePreview(mergedSegments, 26);
  const endothelialCells = buildCorticalEndothelialCells(outlinePreview, endothelialGuides)
    .filter((cell) => cell.source !== "silhouette");

  corticalMicrovascularFlowData = {
    version: CORTICAL_MICROVASCULAR_DATA_VERSION,
    agingEnabled,
    mergedSegments,
    routes,
    endothelialGuides,
    capillaryBedBbbPlacements,
    endothelialCells,
    pericytes: buildCorticalPericytes(endothelialCells),
    pericyteEndfeet: [],
    outlinePreview
  };
  corticalMicrovascularFlowData.pericyteEndfeet =
    buildCorticalPericyteEndfeet(corticalMicrovascularFlowData.pericytes);
  corticalMicrovascularFlowDataCache.set(cacheKey, corticalMicrovascularFlowData);

  return corticalMicrovascularFlowData;
}

function addMainSegment(segment, endothelialGuides) {
  endothelialGuides.push({ segment, sideMode: "both" });
  return segment;
}

function ensureCorticalFlowSeeded() {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const flowState = getCorticalMoleculeFlowState();
  if (!vascularData.routes.length) return;

  if (flowState.routeCount !== vascularData.routes.length) {
    flowState.particles.length = 0;
    flowState.escapeParticles.length = 0;
    flowState.pool.length = 0;
    flowState.spawnCounter = 0;
    flowState.routeCount = vascularData.routes.length;
    seedCorticalFlowRoutes();
    return;
  }

  if (!flowState.particles.length) {
    seedCorticalFlowRoutes();
  }
}

function dedupeRoutePoints(points) {
  const route = [];
  points.forEach((point) => {
    if (!point) return;
    const last = route[route.length - 1];
    if (!last || dist(last.x, last.y, point.x, point.y) > 0.5) {
      route.push({ x: point.x, y: point.y });
    }
  });
  return route;
}

function resamplePath(points, spacing = 12) {
  if (!points || points.length <= 2) return points ? points.slice() : [];

  const totalLength = getPathLength(points);
  if (totalLength <= spacing) return points.slice();

  const sampled = [];
  const sampleCount = max(2, ceil(totalLength / spacing));
  for (let i = 0; i <= sampleCount; i++) {
    sampled.push(samplePathAtFraction(points, i / sampleCount));
  }

  return dedupeRoutePoints(sampled);
}

function obtainCorticalFlowParticle() {
  const flowState = getCorticalMoleculeFlowState();
  return flowState.pool.pop() || {
    routeIndex: 0,
    progress: 0,
    speed: 0,
    lane: 0,
    lanePhase: 0,
    radius: 4,
    alpha: 255,
    color: [255, 255, 255],
    type: "RED",
    converted: false
  };
}

function recycleCorticalFlowParticle(index) {
  const flowState = getCorticalMoleculeFlowState();
  const particle = flowState.particles[index];
  if (!particle) return;
  flowState.particles[index] = flowState.particles[flowState.particles.length - 1];
  flowState.particles.pop();
  flowState.pool.push(particle);
}

function reseedCorticalFlowParticle(particle, routeIndex = null, progress = null) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  if (!vascularData.routes.length) return;

  const nextRouteIndex = routeIndex ?? floor(random(vascularData.routes.length));
  const spec = CORTICAL_FLOW_TYPES[floor(random(CORTICAL_FLOW_TYPES.length))];
  particle.routeIndex = nextRouteIndex;
  particle.progress = progress ?? random();
  particle.speed = random(1.05, 1.9);
  particle.lane = random(-0.95, 0.95);
  particle.lanePhase = random(TWO_PI);
  particle.radius = spec.radius;
  particle.alpha = 236;
  particle.baseColor = spec.color.slice();
  particle.color = spec.color.slice();
  particle.type = spec.type;
  particle.converted = false;
}

function spawnCorticalFlowParticle(availableRouteIndexes = null) {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const flowState = getCorticalMoleculeFlowState();
  if (!vascularData.routes.length || flowState.particles.length >= getCorticalFlowMaxActive()) return;

  const routeIndexes = availableRouteIndexes || vascularData.routes
    .map((route, index) => ({ route, index }))
    .filter((entry) => !isCorticalStrokeRoute(entry.route))
    .map((entry) => entry.index);
  if (!routeIndexes.length) return;

  const routeIndex = routeIndexes[floor(random(routeIndexes.length))];
  const route = vascularData.routes[routeIndex];
  if (!route || route.length <= 0) return;

  const particle = obtainCorticalFlowParticle();
  reseedCorticalFlowParticle(particle, routeIndex, random(0.0, 0.03));
  flowState.particles.push(particle);
}

function spawnCorticalEscapeParticle(flowState, x, y, options = {}) {
  const color = options.color || [255, 255, 255];
  const angle = options.angle ?? random(TWO_PI);
  const speed = options.speed ?? random(1.2, 2.9);
  const vx = options.vx ?? cos(angle) * speed;
  const vy = options.vy ?? sin(angle) * speed;
  flowState.escapeParticles.push({
    x: x + random(-4, 4),
    y: y + random(-4, 4),
    vx: vx * CORTICAL_FLOW_SPEED_SCALE,
    vy: vy * CORTICAL_FLOW_SPEED_SCALE,
    alpha: options.alpha ?? 232,
    radius: options.radius ?? random(0.95, 1.6),
    color
  });
}

function getCorticalEpilepsyVascularEffluxIntensity(routePoint) {
  if (!routePoint || !isCorticalEpilepsyEnabled()) return 0;
  if (routePoint.y < CORTICAL_LAYER_BANDS[0].top + 8) return 0;
  const activationState = window.corticalNeuronActivationState;
  if (!activationState?.epilepsyWaves?.length) return 0;
  const now = getCorticalViewState().time;
  let intensity = 0;
  activationState.epilepsyWaves.forEach((wave) => {
    const radius = getCorticalEpilepsyWaveRadius(wave, now);
    if (radius > wave.maxRadius + CORTICAL_EPILEPSY_WAVE_THICKNESS) return;
    const distanceFromSource = dist(routePoint.x, routePoint.y, wave.source.x, wave.source.y);
    const frontDistance = abs(distanceFromSource - radius);
    if (frontDistance > CORTICAL_EPILEPSY_WAVE_THICKNESS * 0.72) return;
    intensity = max(intensity, 1 - frontDistance / (CORTICAL_EPILEPSY_WAVE_THICKNESS * 0.72));
  });
  return intensity;
}

function seedCorticalFlowRoutes() {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const flowState = getCorticalMoleculeFlowState();
  if (!vascularData.routes.length) return;
  const targetPerRoute = getCorticalFlowTargetPerRoute();

  vascularData.routes.forEach((route, routeIndex) => {
    if (isCorticalStrokeRoute(route)) return;
    for (let i = 0; i < targetPerRoute; i++) {
      if (flowState.particles.length >= getCorticalFlowMaxActive()) return;
      const particle = obtainCorticalFlowParticle();
      reseedCorticalFlowParticle(
        particle,
        routeIndex,
        (i + random(0.05, 0.95)) / targetPerRoute
      );
      flowState.particles.push(particle);
    }
  });
}

function updateCorticalMoleculeFlow() {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const flowState = getCorticalMoleculeFlowState();
  const corticalState = getCorticalViewState();
  const dtScale = (corticalState.dt || 16.67) / 16.67;
  const flowSpeedMultiplier = getCorticalFlowSpeedMultiplier();
  const flowTime = corticalState.time * CORTICAL_FLOW_SPEED_SCALE * flowSpeedMultiplier;
  const pulseCarrier = (sin(flowTime * CORTICAL_FLOW_PULSE_FREQ) + 1) * 0.5;
  const pulseEnvelope = pow(pulseCarrier, 3.2);

  ensureCorticalFlowSeeded();
  const maxActiveParticles = getCorticalFlowMaxActive();
  while (flowState.particles.length > maxActiveParticles) {
    recycleCorticalFlowParticle(flowState.particles.length - 1);
  }

  flowState.spawnCounter += 1;
  if (flowState.spawnCounter >= CORTICAL_FLOW_RELEASE_INTERVAL) {
    const releaseBatch = getCorticalFlowReleaseBatch();
    const availableRouteIndexes = vascularData.routes
      .map((route, index) => ({ route, index }))
      .filter((entry) => !isCorticalStrokeRoute(entry.route))
      .map((entry) => entry.index);
    for (let i = 0; i < releaseBatch; i++) {
      spawnCorticalFlowParticle(availableRouteIndexes);
    }
    flowState.spawnCounter = 0;
  }

  for (let i = flowState.particles.length - 1; i >= 0; i--) {
    const particle = flowState.particles[i];
    const route = vascularData.routes[particle.routeIndex];
    if (!route || route.length <= 0) {
      recycleCorticalFlowParticle(i);
      continue;
    }
    if (isCorticalStrokeRoute(route)) {
      particle.lanePhase += 0.004 * dtScale;
      continue;
    }

    const routePhase = particle.routeIndex * 0.73 + particle.lanePhase * 0.18;
    const routeWave = (sin(flowTime * (CORTICAL_FLOW_PULSE_FREQ * 0.7) + routePhase) + 1) * 0.5;
    const propulsion = 1 + pulseEnvelope * CORTICAL_FLOW_PULSE_GAIN + routeWave * CORTICAL_FLOW_WAVE_GAIN;

    particle.progress += (particle.speed * propulsion * CORTICAL_FLOW_SPEED_SCALE * flowSpeedMultiplier * dtScale) / route.length;
    particle.lanePhase += (0.035 + pulseEnvelope * 0.06) * CORTICAL_FLOW_SPEED_SCALE * flowSpeedMultiplier * dtScale;
    const routePoint = sampleMeasuredPathAtFraction(route, constrain(particle.progress, 0, 1));
    const insideBed = abs(routePoint.y - (route.bedCenterY || 0)) <= (route.bedBand || 34);
    const effluxMultiplier = getCorticalMoleculeGenerationMultiplier();
    const epilepsyEffluxIntensity = getCorticalEpilepsyVascularEffluxIntensity(routePoint);
    if (epilepsyEffluxIntensity > 0 && Math.random() < CORTICAL_EPILEPSY_VASCULAR_EFFLUX_PROBABILITY * epilepsyEffluxIntensity * dtScale) {
      const effluxColor = particle.type === "GREEN"
        ? [176, 255, 184]
        : particle.type === "BLUE"
          ? [162, 222, 255]
          : [255, 198, 152];
      spawnCorticalEscapeParticle(flowState, routePoint.x, routePoint.y, {
        color: effluxColor,
        vx: random(-2.2, 2.2),
        vy: random(-2.8, -0.8),
        alpha: 228,
        radius: random(1.0, 1.75)
      });
      if (Math.random() < 0.54) {
        recycleCorticalFlowParticle(i);
        continue;
      }
    }
    if (particle.type === "RED" && !particle.converted && insideBed && Math.random() < 0.013 * effluxMultiplier * dtScale) {
      particle.converted = true;
      particle.color = Math.random() < 0.5
        ? [144, 96, 214]
        : [72, 88, 170];
      spawnCorticalEscapeParticle(flowState, routePoint.x, routePoint.y);
    }
    if (particle.type === "GREEN" && insideBed && Math.random() < 0.0052 * effluxMultiplier * dtScale) {
      spawnCorticalEscapeParticle(flowState, routePoint.x, routePoint.y, {
        color: [176, 255, 184],
        vx: random(-2.2, 2.2),
        vy: random(-2.9, -1.2),
        alpha: 224,
        radius: random(1.05, 1.75)
      });
      recycleCorticalFlowParticle(i);
      continue;
    }
    if (particle.progress >= 1.02) {
      reseedCorticalFlowParticle(particle, particle.routeIndex, random(0.0, 0.025));
    }
  }

  for (let i = flowState.escapeParticles.length - 1; i >= 0; i--) {
    const particle = flowState.escapeParticles[i];
    particle.vx += random(-0.03, 0.03) * CORTICAL_FLOW_SPEED_SCALE * dtScale;
    particle.vy += random(-0.03, 0.03) * CORTICAL_FLOW_SPEED_SCALE * dtScale;
    particle.x += particle.vx * dtScale;
    particle.y += particle.vy * dtScale;
    particle.vx *= 0.992;
    particle.vy *= 0.992;
    const topLayerLimit = CORTICAL_LAYER_BANDS[0]?.top ?? -132;
    if (particle.y < topLayerLimit) {
      particle.y = topLayerLimit;
      particle.vy = abs(particle.vy) * 0.35;
    }
    particle.alpha -= 2.8 * dtScale;
    if (particle.alpha <= 0) {
      flowState.escapeParticles.splice(i, 1);
    }
  }
}

function drawCorticalMoleculeFlow() {
  const vascularData = ensureCorticalMicrovascularFlowData();
  const flowState = getCorticalMoleculeFlowState();
  if (!vascularData.routes.length || (!flowState.particles.length && !flowState.escapeParticles.length)) return;

  push();
  noStroke();

  flowState.particles.forEach((particle) => {
    const route = vascularData.routes[particle.routeIndex];
    if (!route || route.length <= 0) return;

    const routeFrame = sampleCorticalFlowRouteFrame(route, particle.progress);
    const { center, ahead, behind } = routeFrame;
    const dx = ahead.x - behind.x;
    const dy = ahead.y - behind.y;
    const tangentLength = max(0.0001, sqrt(dx * dx + dy * dy));
    const nx = -dy / tangentLength;
    const ny = dx / tangentLength;
    const laneOffset = particle.lane * 5.5 + sin(particle.lanePhase) * 1.1;
    const px = center.x + nx * laneOffset;
    const py = center.y + ny * laneOffset;

    fill(particle.color[0], particle.color[1], particle.color[2], 48);
    circle(px, py, particle.radius * 4.2);

    fill(particle.color[0], particle.color[1], particle.color[2], particle.alpha);
    circle(px, py, particle.radius * 2);
  });

  flowState.escapeParticles.forEach((particle) => {
    const color = particle.color || [255, 255, 255];
    fill(color[0], color[1], color[2], particle.alpha * 0.34);
    circle(particle.x, particle.y, particle.radius * 4.2);
    fill(color[0], color[1], color[2], particle.alpha);
    circle(particle.x, particle.y, particle.radius * 2);
  });

  pop();
}

function drawCorticalStrokeOcclusionOverlay() {
  drawCorticalStrokeFragments();
  if (!isCorticalStrokeEnabled()) return;

  const occlusion = getCorticalStrokeOcclusionPoint();
  if (!occlusion) return;

  const progress = getCorticalStrokeTravelProgress();
  const travelPath = getCorticalStrokeOcclusionTravelPath();
  const ahead = travelPath.length > 1
    ? samplePathAtFraction(travelPath, min(1, progress + 0.018))
    : { x: occlusion.x + 1, y: occlusion.y };
  const behind = travelPath.length > 1
    ? samplePathAtFraction(travelPath, max(0, progress - 0.018))
    : { x: occlusion.x - 1, y: occlusion.y };
  const travelAngle = atan2(ahead.y - behind.y, ahead.x - behind.x);
  const flowTime = (getCorticalViewState().time || 0) * 0.006;
  const flowSway = sin(flowTime + progress * 8) * (1 - progress) * 0.16;
  const flowStretch = progress < 1 ? 1 + 0.08 * sin(flowTime * 1.7) : 1;
  const flowSquash = progress < 1 ? 1 - 0.04 * sin(flowTime * 1.7) : 1;

  push();
  translate(occlusion.x, occlusion.y);
  rotate(travelAngle + flowSway);
  scale(flowStretch, flowSquash);
  noStroke();

  if (progress < 1) {
    fill(255, 244, 188, 44);
    ellipse(-13, 0, 28, 9);
    fill(255, 248, 210, 24);
    ellipse(-24, 0, 38, 6);
  }

  fill(168, 36, 36, 252);
  beginShape();
  vertex(-12.4, -2.2);
  vertex(-8.1, -9.7);
  vertex(-1.7, -12.2);
  vertex(5.4, -10.1);
  vertex(12.2, -4.7);
  vertex(9.8, 2.1);
  vertex(13.1, 7.2);
  vertex(4.2, 10.8);
  vertex(-3.9, 7.1);
  vertex(-10.7, 8.8);
  vertex(-8.4, 2.9);
  endShape(CLOSE);

  fill(218, 58, 48, 248);
  quad(-9.6, -2.8, -2.1, -10.1, 4.2, -7.7, -1.4, -1.6);
  fill(132, 24, 32, 232);
  quad(1.4, -1.3, 10.1, -4.0, 8.9, 3.8, 2.2, 8.6);
  fill(104, 18, 28, 205);
  triangle(-10.4, 3.3, -2.4, 2.1, -5.0, 8.4);
  fill(190, 42, 36, 224);
  triangle(-1.2, -1.8, 4.2, -7.7, 7.4, -1.9);

  stroke(255, 202, 64, 232);
  strokeWeight(0.7);
  noFill();
  beginShape();
  vertex(-9.4, -0.9);
  vertex(-3.2, -4.2);
  vertex(2.8, -2.1);
  vertex(9.4, -4.4);
  endShape();

  stroke(255, 226, 106, 245);
  strokeWeight(0.9);
  line(-6.5, -8.1, 0.8, -10.1);
  stroke(255, 198, 46, 225);
  strokeWeight(0.75);
  line(-8.2, 5.4, 6.8, 2.0);

  pop();
}

function drawCorticalStrokeFragments() {
  const fragments = getCorticalStrokeState().fragments || [];
  if (!fragments.length) return;

  push();
  noStroke();
  fragments.forEach((fragment) => {
    push();
    translate(fragment.x, fragment.y);
    rotate(fragment.spin);
    const col = fragment.color || [255, 255, 246];
    fill(12, 16, 22, fragment.alpha * 0.22);
    ellipse(1.5, 2, fragment.radius * 2.4, fragment.radius * 1.55);
    fill(col[0], col[1], col[2], fragment.alpha);
    beginShape();
    vertex(-fragment.radius, -fragment.radius * 0.35);
    vertex(-fragment.radius * 0.35, -fragment.radius);
    vertex(fragment.radius * 0.78, -fragment.radius * 0.62);
    vertex(fragment.radius, fragment.radius * 0.22);
    vertex(fragment.radius * 0.18, fragment.radius);
    vertex(-fragment.radius * 0.9, fragment.radius * 0.52);
    endShape(CLOSE);
    fill(255, 255, 248, fragment.alpha * 0.72);
    ellipse(-fragment.radius * 0.24, -fragment.radius * 0.28, fragment.radius * 0.9, fragment.radius * 0.55);
    pop();
  });
  pop();
}

function buildCorticalEndothelialCells(outlinePreview, endothelialGuides = []) {
  if (!endothelialGuides?.length) return [];

  const cells = [];
  const allOccupiedCenters = [];
  const descendingBranchCorridors = outlinePreview.descendingBranchCorridors || [];
  const branchBedCutoffs = [
    { centerY: 28, topY: -12 },
    { centerY: 124, topY: 84 },
    { centerY: 272, topY: 224 }
  ];

  function liesInDescendingBranchCorridor(x, y, corridorPadding = 16) {
    return descendingBranchCorridors.some((corridor) => {
      return abs(x - corridor.x) < corridorPadding && y >= corridor.minY && y <= corridor.maxY;
    });
  }

  endothelialGuides
    .filter((guide) => {
      if (!guide?.segment) return false;
      return (guide.segment.layer || 0) >= 3;
    })
    .forEach((guide, guideIndex) => {
      const points = getEndothelialGuidePoints(guide);
      if (points.length < 2) return;

      const pathLength = getPathLength(points);
      const guideMaxY = points.reduce((maxY, point) => max(maxY, point.y), -Infinity);
      const bedCutoff = branchBedCutoffs.find((cutoff) => {
        return guideMaxY >= cutoff.topY && abs(guideMaxY - cutoff.centerY) <= 58;
      });
      const medialStopY = bedCutoff ? bedCutoff.topY + 4 : Infinity;
      const widthScale = guide.segment?.widthScale || 0.2;
      const majorAxis = constrain(3.8 + widthScale * 2.8, 4.1, 5.4);
      const strokeWeightValue = 1.08;
      const spacing = max(4.4, majorAxis * 0.9 * (guide.spacingScale || 1));
      const count = max(5, ceil(pathLength / spacing));
      const halfLine = majorAxis * 0.26;
      const trimStart = constrain(guide.trimStart || 0, 0, 0.45);
      const distalTrim = 0;
      const trimEnd = constrain((guide.trimEnd || 0) + distalTrim, 0, 0.55);
      const startT = trimStart;
      const endT = 1 - trimEnd;
      const usableSpan = endT - startT;
      const sideMode = guide.sideMode === "both" ? [-1, 1] : [guide.sideMode];
      const inset = lerp(1.0, 1.85, constrain(widthScale, 0, 1));
      const offsetDistance = max(1.8, 13 * widthScale - inset + (guide.edgeShift || 0) * 1.1);
      if (usableSpan <= 0.08) return;

      for (let i = 0; i <= count; i++) {
        const t = startT + usableSpan * (count === 0 ? 0 : i / count);
        const center = samplePathAtFraction(points, t);
        const ahead = samplePathAtFraction(points, min(endT, t + 0.035));
        const behind = samplePathAtFraction(points, max(startT, t - 0.035));
        const dx = ahead.x - behind.x;
        const dy = ahead.y - behind.y;
        const tangentLength = sqrt(dx * dx + dy * dy);
        if (tangentLength < 0.0001) continue;
        const angle = atan2(dy, dx);
        const collisionRadius = max(1.35, majorAxis * 0.24);
        const nx = -dy / tangentLength;
        const ny = dx / tangentLength;

        sideMode.forEach((side) => {
          if (side !== -1 && side !== 1) return;

          const px = center.x + nx * offsetDistance * side;
          const py = center.y + ny * offsetDistance * side;
          const isMedialSide = center.x < 0 ? side === -1 : side === 1;
          if (isMedialSide && (center.y >= medialStopY || py >= medialStopY)) return;
          const overlapsExisting = allOccupiedCenters.some((occupied) => {
            const ox = occupied.x - px;
            const oy = occupied.y - py;
            const minDistance = occupied.radius + collisionRadius;
            return ox * ox + oy * oy < minDistance * minDistance;
          });
          if (overlapsExisting) return;

          cells.push({
            x1: px - cos(angle) * halfLine,
            y1: py - sin(angle) * halfLine,
            x2: px + cos(angle) * halfLine,
            y2: py + sin(angle) * halfLine,
            strokeWeight: strokeWeightValue,
            cx: px,
            cy: py,
            angle,
            nx,
            ny,
            side,
            source: "branch",
            pathId: `branch-${guideIndex}`,
            sampleT: t,
            guideLayer: guide.segment?.layer || 0,
            guidePriority: guide.priority ?? 0
          });
          allOccupiedCenters.push({ x: px, y: py, radius: collisionRadius });
        });
      }
    });

  const silhouetteOccupiedCenters = {
    "-1": [],
    "1": []
  };

  getCorticalOutlineContourPaths(outlinePreview).forEach((path, pathIndex) => {
    if (!path || path.length < 2) return;

    const pathLength = getPathLength(path);
    const majorAxis = 4.0;
    const halfLine = 1.18;
    const strokeWeightValue = 1.04;
    const spacing = 4.8;
    const offsetDistance = 2.55;
    const collisionRadius = 1.32;
    const count = max(3, ceil(pathLength / spacing));

    for (let i = 0; i <= count; i++) {
      const t = count === 0 ? 0 : i / count;
      const center = samplePathAtFraction(path, t);
      if (liesInDescendingBranchCorridor(center.x, center.y, 15)) continue;

      const ahead = samplePathAtFraction(path, min(1, t + 0.03));
      const behind = samplePathAtFraction(path, max(0, t - 0.03));
      const dx = ahead.x - behind.x;
      const dy = ahead.y - behind.y;
      const tangentLength = sqrt(dx * dx + dy * dy);
      if (tangentLength < 0.0001) continue;

      const angle = atan2(dy, dx);
      const nx = -dy / tangentLength;
      const ny = dx / tangentLength;

      [-1, 1].forEach((side) => {
        const px = center.x + nx * offsetDistance * side;
        const py = center.y + ny * offsetDistance * side;
        const sideOccupancy = silhouetteOccupiedCenters[String(side)];
        const overlapsSameSide = sideOccupancy.some((occupied) => {
          const ox = occupied.x - px;
          const oy = occupied.y - py;
          const minDistance = occupied.radius + collisionRadius;
          return ox * ox + oy * oy < minDistance * minDistance;
        });
        if (overlapsSameSide) return;

        const overlapsAnyExisting = allOccupiedCenters.some((occupied) => {
          const ox = occupied.x - px;
          const oy = occupied.y - py;
          const minDistance = occupied.radius + collisionRadius;
          return ox * ox + oy * oy < minDistance * minDistance;
        });
        if (overlapsAnyExisting) return;

        cells.push({
          x1: px - cos(angle) * halfLine,
          y1: py - sin(angle) * halfLine,
          x2: px + cos(angle) * halfLine,
          y2: py + sin(angle) * halfLine,
          strokeWeight: strokeWeightValue,
          cx: px,
          cy: py,
          angle,
          nx,
          ny,
          side,
          source: "silhouette",
          pathId: `silhouette-${pathIndex}`,
          sampleT: t
        });

        const occupiedCenter = { x: px, y: py, radius: collisionRadius };
        sideOccupancy.push(occupiedCenter);
        allOccupiedCenters.push(occupiedCenter);
      });
    }
  });

  return cells;
}

function buildCorticalPericytes(endothelialCells) {
  if (!endothelialCells?.length) return [];

  const groupedCells = new Map();
  const pericytes = [];

  endothelialCells.forEach((cell) => {
    if (
      typeof cell.cx !== "number" ||
      typeof cell.cy !== "number" ||
      typeof cell.sampleT !== "number" ||
      typeof cell.side !== "number"
    ) {
      return;
    }

    const key = `${cell.source || "unknown"}:${cell.pathId || "path"}:${cell.side}`;
    if (!groupedCells.has(key)) groupedCells.set(key, []);
    groupedCells.get(key).push(cell);
  });

  groupedCells.forEach((cellsOnPath) => {
    cellsOnPath.sort((a, b) => a.sampleT - b.sampleT);

    for (let i = 1; i < cellsOnPath.length; i++) {
      const a = cellsOnPath[i - 1];
      const b = cellsOnPath[i];
      const dx = b.cx - a.cx;
      const dy = b.cy - a.cy;
      const gap = sqrt(dx * dx + dy * dy);
      if (gap < 4.2 || gap > 9.5) continue;

      const mx = (a.cx + b.cx) * 0.5;
      const my = (a.cy + b.cy) * 0.5;
      const nx = ((a.nx + b.nx) * 0.5) * a.side;
      const ny = ((a.ny + b.ny) * 0.5) * a.side;
      const normalLength = sqrt(nx * nx + ny * ny) || 1;
      const outwardX = nx / normalLength;
      const outwardY = ny / normalLength;
      const offset = a.source === "branch" ? 2.6 : 2.2;

      pericytes.push({
        x: mx + outwardX * offset,
        y: my + outwardY * offset,
        w: a.source === "branch" ? 5.2 : 4.8,
        h: a.source === "branch" ? 1.8 : 1.65,
        angle: atan2(dy, dx),
        pathKey: key,
        sampleT: (a.sampleT + b.sampleT) * 0.5,
        outwardX,
        outwardY,
        tangentX: dx / max(0.0001, gap),
        tangentY: dy / max(0.0001, gap),
        source: a.source || "branch",
        guideLayer: a.guideLayer || 0,
        guidePriority: a.guidePriority ?? 0
      });
    }
  });

  return pericytes;
}

function buildCorticalPericyteEndfeet(pericytes) {
  if (!pericytes?.length) return [];

  return pericytes.map((pericyte, index) => {
    const outwardLength = max(0.0001, sqrt(
      (pericyte.outwardX || 0) * (pericyte.outwardX || 0) +
      (pericyte.outwardY || 0) * (pericyte.outwardY || 0)
    ));
    const normalX = (pericyte.outwardX || 0) / outwardLength;
    const normalY = (pericyte.outwardY || 0) / outwardLength;
    const tangentialShift = index % 2 === 0 ? -0.6 : 0.6;
    const tangentX = pericyte.tangentX || cos(pericyte.angle || 0);
    const tangentY = pericyte.tangentY || sin(pericyte.angle || 0);
    const outwardOffset = pericyte.h * 1.55;

    return {
      x: pericyte.x + normalX * outwardOffset + tangentX * tangentialShift,
      y: pericyte.y + normalY * outwardOffset + tangentY * tangentialShift,
      angle: pericyte.angle,
      w: pericyte.w,
      h: pericyte.h
    };
  });
}

function getEndothelialGuidePoints(guide) {
  if (guide.points) {
    return samplePolylinePoints(guide.points, 20);
  }
  if (guide.segment) {
    return sampleSegmentPoints(guide.segment, 16);
  }
  return [];
}

function getCorticalOutlineContourPaths(outlinePreview) {
  if (!outlinePreview?.outlinePixels?.length) return [];
  if (outlinePreview.contourPaths) return outlinePreview.contourPaths;

  const pixelsByKey = new Map();
  const pixelNeighbors = new Map();
  const visited = new Set();
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  const previewBounds = outlinePreview.bounds || CORTICAL_VASCULATURE_BOUNDS;
  const worldScaleX = outlinePreview.worldWidth / max(1, outlinePreview.width);
  const worldScaleY = outlinePreview.worldHeight / max(1, outlinePreview.height);

  (outlinePreview.outlinePixels || []).forEach((pixel) => {
    pixelsByKey.set(`${pixel.x},${pixel.y}`, pixel);
  });

  function getNeighbors(pixel) {
    const key = `${pixel.x},${pixel.y}`;
    if (pixelNeighbors.has(key)) return pixelNeighbors.get(key);

    const neighbors = directions
      .map(([dx, dy]) => pixelsByKey.get(`${pixel.x + dx},${pixel.y + dy}`))
      .filter(Boolean);
    pixelNeighbors.set(key, neighbors);
    return neighbors;
  }

  function pixelToWorld(pixel) {
    return {
      x: previewBounds.left + pixel.x * worldScaleX,
      y: previewBounds.top + pixel.y * worldScaleY
    };
  }

  function chooseNextPixel(current, previous) {
    const candidates = getNeighbors(current).filter((neighbor) => !visited.has(`${neighbor.x},${neighbor.y}`));
    if (!candidates.length) return null;
    if (!previous || candidates.length === 1) return candidates[0];

    const incomingX = current.x - previous.x;
    const incomingY = current.y - previous.y;
    let best = candidates[0];
    let bestScore = -Infinity;

    candidates.forEach((candidate) => {
      const dx = candidate.x - current.x;
      const dy = candidate.y - current.y;
      const score = incomingX * dx + incomingY * dy;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    return best;
  }

  function traceFrom(startPixel) {
    const chain = [];
    let previous = null;
    let current = startPixel;

    while (current) {
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) break;
      visited.add(key);
      chain.push(current);
      current = chooseNextPixel(current, previous);
      previous = chain[chain.length - 1];
    }

    return chain;
  }

  const startPixels = (outlinePreview.outlinePixels || []).slice().sort((a, b) => {
    const degreeA = getNeighbors(a).length;
    const degreeB = getNeighbors(b).length;
    if (degreeA !== degreeB) return degreeA - degreeB;
    return a.y - b.y || a.x - b.x;
  });

  const contourPaths = [];

  startPixels.forEach((pixel) => {
    const key = `${pixel.x},${pixel.y}`;
    if (visited.has(key)) return;

    const chain = traceFrom(pixel);
    if (chain.length < 4) return;

    const worldPath = resamplePath(
      chain.map(pixelToWorld),
      3.6
    );
    if (worldPath.length >= 4) {
      contourPaths.push(worldPath);
    }
  });

  outlinePreview.contourPaths = contourPaths;
  return contourPaths;
}

function drawCorticalEndothelialCells(cells) {
  if (!cells || !cells.length) return;

  const endothelialColor = typeof getColor === "function"
    ? getColor("endothelium", 220)
    : color(245, 190, 130, 220);

  push();
  noFill();
  stroke(endothelialColor);
  strokeCap(ROUND);
  cells.forEach((cell) => {
    strokeWeight(cell.strokeWeight);
    line(cell.x1, cell.y1, cell.x2, cell.y2);
  });

  pop();
}

function drawCorticalPericytes(pericytes) {
  if (!pericytes || !pericytes.length) return;

  const pericyteColor = typeof getColor === "function"
    ? getColor("pericyte", 210)
    : color(214, 152, 106, 210);

  push();
  noStroke();
  fill(pericyteColor);

  pericytes.forEach((pericyte) => {
    push();
    translate(pericyte.x, pericyte.y);
    rotate(pericyte.angle);
    ellipse(0, 0, pericyte.w, pericyte.h);
    pop();
  });

  pop();
}

function drawCorticalPericyteEndfeet(endfeet) {
  if (!endfeet || !endfeet.length) return;

  const endfootColor = color(220, 184, 250, 168);
  const endfootInnerColor = color(246, 228, 255, 122);

  push();
  endfeet.forEach((endfoot) => {
    push();
    translate(endfoot.x, endfoot.y);
    rotate(endfoot.angle);
    noStroke();
    fill(endfootColor);
    ellipse(0, 0, endfoot.w, endfoot.h);
    fill(endfootInnerColor);
    ellipse(0, 0, endfoot.w * 0.56, endfoot.h * 0.52);
    pop();
  });
  pop();
}

function drawCorticalBbbDebugOverlay(guides) {
  if (!guides || !guides.length) return;

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  textAlign(CENTER, CENTER);
  textSize(8);

  guides.forEach((guide, index) => {
    const points = getEndothelialGuidePoints(guide);
    if (!points.length) return;

    const hue = (index * 47) % 255;
    const guideColor = color(lerp(90, 255, hue / 255), lerp(220, 120, hue / 255), 110, 230);
    stroke(guideColor);
    strokeWeight((guide.priority || 0) >= 5 ? 2.6 : 1.6);

    for (let i = 1; i < points.length; i++) {
      line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
    }

    const start = points[0];
    const end = points[points.length - 1];
    noStroke();
    fill(255, 248, 180, 245);
    circle(start.x, start.y, 4.5);
    circle(end.x, end.y, 4.5);

    fill(255, 255, 255, 230);
    text(String(index), start.x, start.y - 8);
  });

  pop();
}

function buildCorticalOutlinePreview(segments, vesselWeight) {
  if (typeof document === "undefined" || !segments?.length) return null;

  const renderBounds = getCorticalRenderBounds(segments, vesselWeight);
  const boundsWidth = renderBounds.right - renderBounds.left;
  const boundsHeight = renderBounds.bottom - renderBounds.top;
  const baseScale = 1.6;
  const width = max(640, ceil(boundsWidth * baseScale));
  const height = max(420, ceil(boundsHeight * baseScale));
  const supersample = 6;
  const hiWidth = width * supersample;
  const hiHeight = height * supersample;
  const offscreen = document.createElement("canvas");
  offscreen.width = hiWidth;
  offscreen.height = hiHeight;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const scale = min(
    width / max(1, boundsWidth),
    height / max(1, boundsHeight)
  );
  const hiScale = scale * supersample;
  const offsetX = -renderBounds.left * hiScale;
  const offsetY = -renderBounds.top * hiScale;
  const detailPaths = [];
  const centerlinePaths = [];
  const branchStrokePaths = [];

  ctx.clearRect(0, 0, hiWidth, hiHeight);
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  function isDescendingTrunkSegment(segment, points) {
    if ((segment.layer || 1) < 3 || !points?.length) return false;
    const start = points[0];
    const end = points[points.length - 1];
    const dx = abs(end.x - start.x);
    const dy = abs(end.y - start.y);
    return dy > 30 && dx < 12;
  }

  const descendingBranchCorridors = [];
  segments.forEach((segment) => {
    const points = sampleSegmentPoints(segment, 24);
    if (!isDescendingTrunkSegment(segment, points)) return;
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    descendingBranchCorridors.push({
      x: xs.reduce((sum, value) => sum + value, 0) / xs.length,
      minY: min(...ys) - 6,
      maxY: max(...ys) + 52
    });
    branchStrokePaths.push({
      points: points.map((point) => ({ x: point.x, y: point.y })),
      width: constrain(segment.widthScale * 0.88, 0.6, 1.45),
      alpha: 0.62
    });
  });

  function liesInDescendingBranchCorridor(x, y, corridorPadding = 18) {
    return descendingBranchCorridors.some((corridor) => {
      return abs(x - corridor.x) < corridorPadding && y >= corridor.minY && y <= corridor.maxY;
    });
  }

  function overlapsDescendingBranchVertically(segment, points) {
    if (!points?.length || !descendingBranchCorridors.length) return false;
    return points.some((point) => liesInDescendingBranchCorridor(point.x, point.y, (segment.layer || 1) > 2 ? 9 : 14));
  }

  segments.forEach((segment) => {
    const points = sampleSegmentPoints(segment, 52);
    if (points.length < 2) return;
    const suppressLineOverlay = overlapsDescendingBranchVertically(segment, points);
    const previewWidth = constrain(
      (vesselWeight * segment.widthScale * 0.28 + 0.52) * hiScale,
      1.0,
      10.5
    );

    const pathPoints = points.map((point) => ({
      x: point.x,
      y: point.y
    }));
    if (!suppressLineOverlay) {
      centerlinePaths.push({
        points: pathPoints,
        width: constrain(segment.widthScale * 0.62, 0.36, 0.9),
        alpha: segment.widthScale > 0.25 ? 0.24 : 0.46
      });
      detailPaths.push({
        points: pathPoints,
        width: constrain(segment.widthScale * 0.84, 0.42, 1.15),
        alpha: segment.widthScale > 0.25 ? 0.3 : 0.58
      });
    }

    ctx.beginPath();
    ctx.lineWidth = previewWidth;
    ctx.moveTo(points[0].x * hiScale + offsetX, points[0].y * hiScale + offsetY);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * hiScale + offsetX, points[i].y * hiScale + offsetY);
    }
    ctx.stroke();
  });

  const imageData = ctx.getImageData(0, 0, hiWidth, hiHeight);
  const alpha = imageData.data;
  const fillPixels = [];
  const outlinePixels = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let coverage = 0;
      let edgeTouchesEmpty = false;
      const worldX = renderBounds.left + x / scale;
      const worldY = renderBounds.top + y / scale;

      if (liesInDescendingBranchCorridor(worldX, worldY, 14)) {
        continue;
      }

      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const hx = x * supersample + sx;
          const hy = y * supersample + sy;
          const index = (hy * hiWidth + hx) * 4 + 3;
          const occupied = alpha[index] > 8;
          if (occupied) {
            coverage++;
            const left = alpha[index - 4] > 8;
            const right = alpha[index + 4] > 8;
            const up = alpha[index - hiWidth * 4] > 8;
            const down = alpha[index + hiWidth * 4] > 8;
            if (!left || !right || !up || !down) {
              edgeTouchesEmpty = true;
            }
          }
        }
      }

      if (coverage <= 0) continue;
      fillPixels.push({ x, y, alpha: coverage / (supersample * supersample) });
      if (edgeTouchesEmpty) {
        outlinePixels.push({ x, y });
      }
    }
  }

  return {
    bounds: renderBounds,
    width,
    height,
    worldWidth: boundsWidth,
    worldHeight: boundsHeight,
    descendingBranchCorridors,
    fillPixels,
    outlinePixels,
    detailPaths,
    centerlinePaths,
    branchStrokePaths
  };
}

function renderCorticalOutlineOverlay(preview) {
  if (!preview) return;

  push();
  blendMode(ADD);

  const overlay = ensureCorticalOutlineOverlayCanvas(preview);
  if (overlay && drawingContext?.drawImage) {
    drawingContext.drawImage(
      overlay,
      preview.bounds?.left ?? CORTICAL_VASCULATURE_BOUNDS.left,
      preview.bounds?.top ?? CORTICAL_VASCULATURE_BOUNDS.top,
      preview.worldWidth,
      preview.worldHeight
    );
  }

  strokeCap(ROUND);
  strokeJoin(ROUND);

  if (preview.centerlinePaths?.length) {
    preview.centerlinePaths.forEach((path) => {
      if (!path.points?.length) return;
      noFill();
      stroke(104, 188, 255, floor(255 * path.alpha));
      strokeWeight(path.width);
      beginShape();
      path.points.forEach((point) => vertex(point.x, point.y));
      endShape();
    });
  }

  if (preview.detailPaths?.length) {
    preview.detailPaths.forEach((path) => {
      if (!path.points?.length) return;
      noFill();
      stroke(214, 238, 255, floor(255 * path.alpha));
      strokeWeight(path.width);
      beginShape();
      path.points.forEach((point) => vertex(point.x, point.y));
      endShape();
    });
  }

  pop();
}

function drawCorticalVasculatureGreenOutline(preview) {
  if (!preview) return;

  const contourPaths = getCorticalOutlineContourPaths(preview);

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  if (contourPaths?.length) {
    contourPaths.forEach((path) => {
      if (!path?.length) return;
      stroke(72, 255, 120, 230);
      strokeWeight(1.2);
      drawCorticalOffsetContour(path, 0);

      stroke(72, 255, 120, 210);
      strokeWeight(1.05);
      drawCorticalOffsetContour(path, 1.6);
      drawCorticalOffsetContour(path, -1.6);
    });
  }

  pop();
}

function drawCorticalSilhouetteOffsetLines(preview) {
  if (!preview) return;

  const contourPaths = getCorticalOutlineContourPaths(preview);
  if (!contourPaths?.length) return;

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  stroke(255, 152, 48, 230);
  strokeWeight(4.8);

  contourPaths.forEach((path) => {
    if (!path?.length) return;
    drawCorticalVerticalOffsetContour(path, -3.8);
    drawCorticalVerticalOffsetContour(path, 3.8);
  });

  pop();
}

function drawCorticalOffsetContour(path, offset = 0) {
  if (!path?.length) return;

  beginShape();
  path.forEach((point, index) => {
    const prev = path[max(0, index - 1)];
    const next = path[min(path.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = max(0.0001, sqrt(dx * dx + dy * dy));
    const nx = -dy / len;
    const ny = dx / len;
    vertex(point.x + nx * offset, point.y + ny * offset);
  });
  endShape();
}

function drawCorticalBalancedOffsetContour(preview, path, offset = 0, side = "outer") {
  if (!preview || !path?.length) return;

  beginShape();
  path.forEach((point, index) => {
    const prev = path[max(0, index - 1)];
    const next = path[min(path.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = max(0.0001, sqrt(dx * dx + dy * dy));
    const nx = -dy / len;
    const ny = dx / len;
    const sampleOffset = 2.2;
    const plusFilled = isCorticalPreviewFilled(preview, point.x + nx * sampleOffset, point.y + ny * sampleOffset);
    const minusFilled = isCorticalPreviewFilled(preview, point.x - nx * sampleOffset, point.y - ny * sampleOffset);

    let inwardSign = 1;
    if (plusFilled && !minusFilled) inwardSign = 1;
    else if (!plusFilled && minusFilled) inwardSign = -1;

    const signedOffset = side === "inner"
      ? offset * inwardSign
      : -offset * inwardSign;

    vertex(point.x + nx * signedOffset, point.y + ny * signedOffset);
  });
  endShape();
}

function drawCorticalVerticalOffsetContour(path, offsetY = 0) {
  if (!path?.length) return;

  beginShape();
  path.forEach((point) => {
    vertex(point.x, point.y + offsetY);
  });
  endShape();
}

function getCorticalPreviewFillLookup(preview) {
  if (preview.fillLookup) return preview.fillLookup;

  const lookup = new Set();
  (preview.fillPixels || []).forEach((pixel) => {
    lookup.add(`${pixel.x},${pixel.y}`);
  });
  preview.fillLookup = lookup;
  return lookup;
}

function isCorticalPreviewFilled(preview, worldX, worldY) {
  if (!preview?.fillPixels?.length) return false;

  const bounds = preview.bounds || CORTICAL_VASCULATURE_BOUNDS;
  const px = round((worldX - bounds.left) * (preview.width / max(1, preview.worldWidth)));
  const py = round((worldY - bounds.top) * (preview.height / max(1, preview.worldHeight)));
  return getCorticalPreviewFillLookup(preview).has(`${px},${py}`);
}

function renderCorticalContinuousNetwork(segments, preview, arteryColor, capillaryColor, veinColor, borderColor, weight) {
  if (!segments?.length || !preview || !drawingContext?.drawImage) return false;

  const surface = ensureCorticalContinuousNetworkCanvas(
    segments,
    preview,
    arteryColor,
    capillaryColor,
    veinColor,
    borderColor,
    weight
  );
  if (!surface) return false;

  drawingContext.drawImage(
    surface,
    preview.bounds?.left ?? CORTICAL_VASCULATURE_BOUNDS.left,
    preview.bounds?.top ?? CORTICAL_VASCULATURE_BOUNDS.top,
    preview.worldWidth,
    preview.worldHeight
  );

  return true;
}

function ensureCorticalOutlineOverlayCanvas(preview) {
  if (preview.overlayCanvas) return preview.overlayCanvas;

  const overlay = document.createElement("canvas");
  overlay.width = preview.width;
  overlay.height = preview.height;
  const ctx = overlay.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, overlay.width, overlay.height);

  preview.fillPixels.forEach((pixel) => {
    ctx.fillStyle = `rgba(78, 144, 214, ${0.015 + pixel.alpha * 0.045})`;
    ctx.fillRect(pixel.x, pixel.y, 1, 1);
  });

  ctx.fillStyle = "rgba(238, 248, 255, 0.28)";
  preview.outlinePixels.forEach((pixel) => {
    ctx.fillRect(pixel.x, pixel.y, 1, 1);
  });

  preview.overlayCanvas = overlay;
  return overlay;
}

function ensureCorticalContinuousNetworkCanvas(segments, preview, arteryColor, capillaryColor, veinColor, borderColor, weight) {
  if (preview.continuousNetworkCanvas) return preview.continuousNetworkCanvas;

  const surface = document.createElement("canvas");
  surface.width = preview.width;
  surface.height = preview.height;
  const ctx = surface.getContext("2d");
  if (!ctx) return null;

  const bounds = preview.bounds || CORTICAL_VASCULATURE_BOUNDS;
  const scale = preview.width / max(1, preview.worldWidth);
  const worldToCanvasX = (x) => (x - bounds.left) * scale;
  const worldToCanvasY = (y) => (y - bounds.top) * scale;

  function colorToRgbaString(col, alphaValue = 1) {
    return `rgba(${floor(red(col))}, ${floor(green(col))}, ${floor(blue(col))}, ${alphaValue})`;
  }

  function traceSegmentPath(segment, sampleCount = 28) {
    const points = sampleSegmentPoints(segment, sampleCount);
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(worldToCanvasX(points[0].x), worldToCanvasY(points[0].y));
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(worldToCanvasX(points[i].x), worldToCanvasY(points[i].y));
    }
  }

  const orderedSegments = segments.slice().sort((a, b) => {
    const layerDiff = (a.layer || 1) - (b.layer || 1);
    if (layerDiff !== 0) return layerDiff;
    return b.widthScale - a.widthScale;
  });

  ctx.clearRect(0, 0, surface.width, surface.height);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  orderedSegments.forEach((segment) => {
    traceSegmentPath(segment, 36);
    ctx.lineWidth = max(1, (weight * segment.widthScale + 3.2) * scale);
    ctx.strokeStyle = colorToRgbaString(borderColor, 1);
    ctx.stroke();
  });

  orderedSegments.forEach((segment) => {
    traceSegmentPath(segment, 36);
    const startColor = getPathColor(segment.tStart, arteryColor, capillaryColor, veinColor);
    const endColor = getPathColor(segment.tEnd, arteryColor, capillaryColor, veinColor);
    const sampled = sampleSegmentPoints(segment, 2);
    const startPoint = sampled[0] || segment.start;
    const endPoint = sampled[sampled.length - 1] || segment.end;
    const gradient = ctx.createLinearGradient(
      worldToCanvasX(startPoint.x),
      worldToCanvasY(startPoint.y),
      worldToCanvasX(endPoint.x),
      worldToCanvasY(endPoint.y)
    );
    gradient.addColorStop(0, colorToRgbaString(startColor, 1));
    gradient.addColorStop(1, colorToRgbaString(endColor, 1));
    ctx.lineWidth = max(1, (weight * segment.widthScale + 2.2) * scale);
    ctx.strokeStyle = gradient;
    ctx.stroke();
  });

  preview.continuousNetworkCanvas = surface;
  return surface;
}

function getCorticalRenderBounds(segments, vesselWeight) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  segments.forEach((segment) => {
    const points = sampleSegmentPoints(segment, 36);
    points.forEach((point) => {
      minX = min(minX, point.x);
      maxX = max(maxX, point.x);
      minY = min(minY, point.y);
      maxY = max(maxY, point.y);
    });
  });

  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return { ...CORTICAL_VASCULATURE_BOUNDS };
  }

  const padding = max(18, vesselWeight * 1.6);
  return {
    left: minX - padding,
    right: maxX + padding,
    top: minY - padding,
    bottom: maxY + padding
  };
}

function createBranchNetwork(topY, bottomY, arteryAnchorX, veinAnchorX, options = {}) {
  const segments = [];
  const flowRoutes = [];
  const endothelialGuides = [];
  const capillaryBedBbbPlacements = [];
  const skippedHorizontalSegments = new Set();
  const verticalDepth = bottomY - topY;
  const horizontalSpan = veinAnchorX - arteryAnchorX;
  const totalFlowLength = max(1, verticalDepth * 2 + horizontalSpan);
  const extendBed = Boolean(options.extendBed);
  const junctionGuideMode = options.junctionGuideMode || "default";
  const agingBranchReduction = Boolean(options.agingBranchReduction);
  const bedOvershoot = extendBed ? 34 : 10;
  const latticeStartX = arteryAnchorX - bedOvershoot;
  const latticeEndX = veinAnchorX + bedOvershoot;
  const latticeHalfHeight = constrain(horizontalSpan * 0.055, 24, 42);
  const midRailY = bottomY;
  const meshNodes = createCapillaryTemplateNodes(latticeStartX, latticeEndX, midRailY, latticeHalfHeight);
  if (extendBed) {
    const centerRowIndex = floor(meshNodes.length / 2);
    meshNodes[centerRowIndex][0].x = arteryAnchorX;
    meshNodes[centerRowIndex][meshNodes[centerRowIndex].length - 1].x = veinAnchorX;
  }
  const meshRows = meshNodes.length;
  const meshCols = meshNodes[0].length;
  const leftInterface = meshNodes.map((row) => row[0]);
  const rightInterface = meshNodes.map((row) => row[meshCols - 1]);
  const isTopBed = bottomY < 100;
  const routePatterns = agingBranchReduction ? [
    [0, 0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2, 2],
    [4, 4, 4, 4, 4, 4],
    [1, 1, 2, 2, 1, 1],
    [3, 3, 2, 2, 3, 4]
  ] : [
    [0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1],
    [2, 2, 2, 2, 2, 2],
    [3, 3, 3, 3, 3, 3],
    [4, 4, 4, 4, 4, 4],
    [0, 1, 1, 1, 1, 0],
    [1, 1, 2, 2, 1, 1],
    [2, 2, 3, 3, 2, 2],
    [2, 1, 2, 3, 3, 3],
    [3, 3, 2, 2, 3, 4]
  ];
  const routeSupportedHorizontalSegments = new Set();
  const routeSupportedDiagonalRightSegments = new Set();
  const routeSupportedDiagonalLeftSegments = new Set();
  if (agingBranchReduction) {
    routePatterns.forEach((rowPattern) => {
      for (let col = 1; col < rowPattern.length; col++) {
        const previousRow = constrain(rowPattern[col - 1], 0, meshRows - 1);
        const currentRow = constrain(rowPattern[col], 0, meshRows - 1);
        if (currentRow === previousRow) {
          routeSupportedHorizontalSegments.add(`${currentRow}:${col}`);
        } else if (currentRow === previousRow + 1) {
          routeSupportedDiagonalRightSegments.add(`${currentRow}:${col - 1}`);
        } else if (currentRow === previousRow - 1) {
          routeSupportedDiagonalLeftSegments.add(`${previousRow}:${col}`);
        }
      }
    });
  }
  const lateralPulls = [0.16, 0.12, 0.08, 0.12, 0.16];

  function flowTAtX(x) {
    return constrain((verticalDepth + (x - arteryAnchorX)) / totalFlowLength, 0, 1);
  }

  function colorTAtX(x) {
    if (x <= latticeStartX) return 0.3;
    if (x >= latticeEndX) return 0.82;
    return lerp(0.3, 0.82, (x - latticeStartX) / max(1, latticeEndX - latticeStartX));
  }

  function addSegment(startX, startY, endX, endY, tStart, tEnd, widthScale = 1, curveOffset = 0, layer = 1) {
    const segment = {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      tStart,
      tEnd,
      widthScale,
      curveOffset,
      layer
    };
    segments.push(segment);
    return segment;
  }

  function addPolylineSegment(points, tStart, tEnd, widthScale = 1, layer = 1) {
    if (!points || points.length < 2) return null;
    const segment = {
      start: { x: points[0].x, y: points[0].y },
      end: { x: points[points.length - 1].x, y: points[points.length - 1].y },
      points: points.map((point) => ({ x: point.x, y: point.y })),
      tStart,
      tEnd,
      widthScale,
      curveOffset: 0,
      layer
    };
    segments.push(segment);
    return segment;
  }

  function addContour(startNode, endNode, curveOffset = 0, guideOptions = {}) {
    const segment = addSegment(
      startNode.x,
      startNode.y,
      endNode.x,
      endNode.y,
      colorTAtX(startNode.x),
      colorTAtX(endNode.x),
      0.18,
      curveOffset,
      1
    );
    const dx = endNode.x - startNode.x;
    const dy = endNode.y - startNode.y;
    const sideMode = abs(dx) >= abs(dy)
      ? (startNode.y <= midRailY ? -1 : 1)
      : (startNode.x <= (latticeStartX + latticeEndX) * 0.5 ? -1 : 1);
    if (guideOptions.skipGuide) return;
    endothelialGuides.push({
      segment,
      points: guideOptions.points,
      sideMode,
      spacingScale: 0.84,
      edgeShift: 0.1,
      trimStart: guideOptions.trimStart || 0,
      trimEnd: guideOptions.trimEnd || 0,
      priority: guideOptions.priority ?? 6,
      collisionScale: 0.68
    });
  }

  function createNode(x, y) {
    return { x, y };
  }

  function createCollectorPoints(anchorX, interfaceNode, rowIndex, reverse = false) {
    const points = [
      createNode(anchorX, topY),
      createNode(anchorX, lerp(topY, midRailY, 0.38)),
      createNode(anchorX, lerp(topY, midRailY, 0.68)),
      createNode(anchorX, lerp(topY, interfaceNode.y, 0.9)),
      createNode(lerp(anchorX, interfaceNode.x, lateralPulls[rowIndex] || 0.12), interfaceNode.y),
      createNode(interfaceNode.x, interfaceNode.y)
    ];
    return reverse ? points.reverse() : points;
  }

  function createMeshRoute(rowPattern) {
    return rowPattern.map((rowIndex, colIndex) => {
      const node = meshNodes[constrain(rowIndex, 0, meshRows - 1)][colIndex];
      return createNode(node.x, node.y);
    });
  }

  function addCapillaryBedBoundaryPlacements(
    points,
    outwardX,
    outwardY,
    astrocyteSide,
    spacing = 42,
    trimStartCount = 1,
    trimEndCount = 1,
    metadata = {}
  ) {
    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      spacing
    );
    if (sampledPoints.length < 2) return;

    const clampedTrimStart = constrain(trimStartCount, 0, max(0, sampledPoints.length - 1));
    const clampedTrimEnd = constrain(trimEndCount, 0, max(0, sampledPoints.length - clampedTrimStart - 1));
    const usablePoints =
      sampledPoints.length > (clampedTrimStart + clampedTrimEnd)
        ? sampledPoints.slice(clampedTrimStart, sampledPoints.length - clampedTrimEnd)
        : [];
    if (!usablePoints.length) return;
    const lastUsableSourceIndex = sampledPoints.length - clampedTrimEnd - 1;
    const forceHorizontalOuterOnly = Boolean(metadata.forceHorizontalOuterOnly);
    const forceHorizontalFirstPlacement = Boolean(metadata.forceHorizontalFirstPlacement);
    const forceHorizontalLastPlacement = Boolean(metadata.forceHorizontalLastPlacement);

    usablePoints.forEach((point, index) => {
      const sourceIndex = index + clampedTrimStart;
      const prev = sampledPoints[max(0, sourceIndex - 1)];
      const next = sampledPoints[min(sampledPoints.length - 1, sourceIndex + 1)];
      const isOuterMostPlacement =
        sourceIndex === clampedTrimStart || sourceIndex === lastUsableSourceIndex;
      const isFirstPlacement = sourceIndex === clampedTrimStart;
      const isLastPlacement = sourceIndex === lastUsableSourceIndex;
      const angle =
        ((forceHorizontalOuterOnly && isOuterMostPlacement) ||
          (forceHorizontalFirstPlacement && isFirstPlacement) ||
          (forceHorizontalLastPlacement && isLastPlacement))
          ? 0
          : atan2(next.y - prev.y, next.x - prev.x);
      const isJunctionAdjacentPlacement =
        Boolean(metadata.junctionOutwardShift) && sourceIndex === lastUsableSourceIndex;
      const centerShift = isJunctionAdjacentPlacement ? (metadata.junctionCenterShift || 0) : 0;
      const verticalShift = isJunctionAdjacentPlacement ? (metadata.junctionVerticalShift || 0) : 0;
      capillaryBedBbbPlacements.push({
        x: point.x - outwardX * centerShift,
        y: point.y + verticalShift,
        angle,
        outwardX,
        outwardY,
        outwardShift:
          isJunctionAdjacentPlacement
            ? metadata.junctionOutwardShift
            : (metadata.outwardShift || 10),
        astrocyteSide,
        ...metadata
      });
    });
  }

  function addCapillaryBedBottomEndPlacements(points, totalExtraCount, metadata = {}) {
    if (!totalExtraCount || totalExtraCount < 1) return;

    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      11
    );
    if (sampledPoints.length < 6) return;

    const startIndex = 0;
    const endIndex = sampledPoints.length - 1;
    const usedIndices = new Set();
    const forceHorizontalOuterOnly = Boolean(metadata.forceHorizontalOuterOnly);

    for (let i = 0; i < totalExtraCount; i++) {
      const fromLeft = i % 2 === 0;
      const offset = floor(i / 2);
      const sourceIndex = fromLeft ? startIndex + offset : endIndex - offset;
      if (sourceIndex < 0 || sourceIndex >= sampledPoints.length) continue;
      if (usedIndices.has(sourceIndex)) continue;
      usedIndices.add(sourceIndex);

      const point = sampledPoints[sourceIndex];
      const prev = sampledPoints[max(0, sourceIndex - 1)];
      const next = sampledPoints[min(sampledPoints.length - 1, sourceIndex + 1)];
      const isOuterMostPlacement = sourceIndex === startIndex || sourceIndex === endIndex;
      capillaryBedBbbPlacements.push({
        x: point.x,
        y: point.y,
        angle:
          forceHorizontalOuterOnly && isOuterMostPlacement
            ? 0
            : atan2(next.y - prev.y, next.x - prev.x),
        outwardX: 0,
        outwardY: 1,
        outwardShift: 10,
        astrocyteSide: 1,
        ...metadata
      });
    }
  }

  function addCapillaryBedLowerSideEndPlacements(
    points,
    outwardX,
    outwardY,
    astrocyteSide,
    totalExtraCount,
    spacing = 12,
    metadata = {}
  ) {
    if (!totalExtraCount || totalExtraCount < 1) return;

    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      spacing
    );
    if (sampledPoints.length < 5) return;

    const endIndex = sampledPoints.length - 1;
    const centerShiftSequence = metadata.centerShiftSequence || [];
    const verticalShiftSequence = metadata.verticalShiftSequence || [];
    const sourceIndexOffsets = metadata.sourceIndexOffsets || [];
    const finalAdjustmentSequence = metadata.finalAdjustmentSequence || [];
    const groupRotation = metadata.groupRotation || 0;
    const placements = [];
    for (let i = 0; i < totalExtraCount; i++) {
      const sourceIndex = endIndex - (sourceIndexOffsets[i] ?? i);
      if (sourceIndex < 1 || sourceIndex >= sampledPoints.length) continue;
      const point = sampledPoints[sourceIndex];
      const prev = sampledPoints[max(0, sourceIndex - 1)];
      const next = sampledPoints[min(sampledPoints.length - 1, sourceIndex + 1)];
      const centerShift = centerShiftSequence[i] || 0;
      const verticalShift = verticalShiftSequence[i] || 0;
      const finalAdjustment = finalAdjustmentSequence[i] || {};
      if (finalAdjustment.skipPlacement) continue;
      const baseX = point.x - outwardX * centerShift;
      const baseY = point.y + verticalShift;
      const tangentAngle = atan2(next.y - prev.y, next.x - prev.x);
      placements.push({
        baseX,
        baseY,
        tangentAngle,
        finalAdjustment,
        renderOptions: finalAdjustment.renderOptions || null
      });
    }

    if (!placements.length) return;

    const groupCenterX = placements.reduce((sum, placement) => sum + placement.baseX, 0) / placements.length;
    const groupCenterY = placements.reduce((sum, placement) => sum + placement.baseY, 0) / placements.length;

    placements.forEach((placement) => {
      const localX = placement.baseX - groupCenterX;
      const localY = placement.baseY - groupCenterY;
      const rotatedLocalX = localX * cos(groupRotation) - localY * sin(groupRotation);
      const rotatedLocalY = localX * sin(groupRotation) + localY * cos(groupRotation);
      const baseAngle = placement.tangentAngle + groupRotation;
      capillaryBedBbbPlacements.push({
        x: groupCenterX + rotatedLocalX + (placement.finalAdjustment.dx || 0),
        y: groupCenterY + rotatedLocalY + (placement.finalAdjustment.dy || 0),
        angle:
          placement.finalAdjustment.angle ??
          (baseAngle + (placement.finalAdjustment.angleDelta || 0)),
        renderOptions: placement.renderOptions,
        outwardX,
        outwardY,
        outwardShift: metadata.outwardShift || 16,
        astrocyteSide,
        ignoreJunctionFilter: true,
        placementPriority: 3,
        placementSpacingThreshold: 7,
        ...metadata
      });
    });
  }

  function addCapillaryBedLowerSideGapPlacement(
    points,
    outwardX,
    outwardY,
    astrocyteSide,
    spacing = 12,
    metadata = {}
  ) {
    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      spacing
    );
    if (sampledPoints.length < 5) return;

    const endIndex = sampledPoints.length - 1;
    const pointIndex = max(1, endIndex - 2);
    const point = sampledPoints[pointIndex];
    const prev = sampledPoints[max(0, pointIndex - 1)];
    const next = sampledPoints[min(sampledPoints.length - 1, pointIndex + 1)];
    capillaryBedBbbPlacements.push({
      x: point.x,
      y: point.y,
      angle: atan2(next.y - prev.y, next.x - prev.x),
      outwardX,
      outwardY,
      outwardShift: metadata.outwardShift || 15,
      astrocyteSide,
      ignoreJunctionFilter: true,
      placementPriority: 4,
      placementSpacingThreshold: 3,
      ...metadata
    });
  }

  function addCapillaryBedJunctionGapPlacement(
    points,
    outwardX,
    outwardY,
    astrocyteSide,
    spacing = 15,
    trimStartCount = 1,
    trimEndCount = 1,
    metadata = {}
  ) {
    if (!metadata.junctionOutwardShift) return;

    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      spacing
    );
    if (sampledPoints.length < 4) return;

    const clampedTrimStart = constrain(trimStartCount, 0, max(0, sampledPoints.length - 1));
    const clampedTrimEnd = constrain(trimEndCount, 0, max(0, sampledPoints.length - clampedTrimStart - 1));
    const lastUsableSourceIndex = sampledPoints.length - clampedTrimEnd - 1;
    const previousUsableSourceIndex = lastUsableSourceIndex - 1;
    if (previousUsableSourceIndex < clampedTrimStart) return;

    const anchorPoint = sampledPoints[previousUsableSourceIndex];
    const junctionPoint = sampledPoints[lastUsableSourceIndex];
    const point = {
      x: lerp(anchorPoint.x, junctionPoint.x, 0.52),
      y: lerp(anchorPoint.y, junctionPoint.y, 0.52)
    };
    const prev = sampledPoints[max(0, previousUsableSourceIndex - 1)];
    const next = junctionPoint;
    const centerShift = (metadata.junctionCenterShift || 0) * 0.55;
    const verticalShift = (metadata.junctionVerticalShift || 0) * 0.55;
    capillaryBedBbbPlacements.push({
      x: point.x - outwardX * centerShift,
      y: point.y + verticalShift,
      angle: atan2(next.y - prev.y, next.x - prev.x),
      outwardX,
      outwardY,
      outwardShift: max(18, (metadata.junctionOutwardShift || 10) + 1),
      astrocyteSide,
      ...metadata,
      placementPriority: max(metadata.placementPriority || 0, 1),
      placementSpacingThreshold: 11
    });
  }

  function addCapillaryBedJunctionCompanionPlacement(
    points,
    outwardX,
    outwardY,
    astrocyteSide,
    spacing = 15,
    trimStartCount = 1,
    trimEndCount = 1,
    metadata = {}
  ) {
    if (!metadata.junctionOutwardShift) return;

    const sampledPoints = resamplePath(
      dedupeRoutePoints(points.map((point) => ({ x: point.x, y: point.y }))),
      spacing
    );
    if (sampledPoints.length < 4) return;

    const clampedTrimStart = constrain(trimStartCount, 0, max(0, sampledPoints.length - 1));
    const clampedTrimEnd = constrain(trimEndCount, 0, max(0, sampledPoints.length - clampedTrimStart - 1));
    const lastUsableSourceIndex = sampledPoints.length - clampedTrimEnd - 1;
    const previousUsableSourceIndex = lastUsableSourceIndex - 1;
    if (previousUsableSourceIndex < clampedTrimStart) return;

    const anchorPoint = sampledPoints[previousUsableSourceIndex];
    const junctionPoint = sampledPoints[lastUsableSourceIndex];
    const point = {
      x: lerp(anchorPoint.x, junctionPoint.x, 0.74),
      y: lerp(anchorPoint.y, junctionPoint.y, 0.74)
    };
    const prev = anchorPoint;
    const next = junctionPoint;
    const centerShift = (metadata.junctionCenterShift || 0) * 0.8;
    const verticalShift = (metadata.junctionVerticalShift || 0) * 0.8;
    capillaryBedBbbPlacements.push({
      x: point.x - outwardX * centerShift,
      y: point.y + verticalShift,
      angle: atan2(next.y - prev.y, next.x - prev.x),
      outwardX,
      outwardY,
      outwardShift: max(17, metadata.junctionOutwardShift || 10),
      astrocyteSide,
      ...metadata,
      placementPriority: max(metadata.placementPriority || 0, 1),
      placementSpacingThreshold: 10
    });
  }

  function addTaperedBlend(startNode, endNode, widthScale, direction, curveOffset = 0) {
    const startWidth = widthScale;
    const endWidth = max(0.14, widthScale * 0.92);
    const midNode = createNode(
      lerp(startNode.x, endNode.x, 0.7),
      lerp(startNode.y, endNode.y, 0.7) + curveOffset * 0.1
    );
    const lateNode = createNode(
      lerp(startNode.x, endNode.x, 0.9),
      lerp(startNode.y, endNode.y, 0.9) + curveOffset * 0.05
    );
    const startColorT = colorTAtX(startNode.x);
    const midColorT = colorTAtX(midNode.x);
    const lateColorT = colorTAtX(lateNode.x);
    const endColorT = colorTAtX(endNode.x);
    addSegment(startNode.x, startNode.y, midNode.x, midNode.y, startColorT, midColorT, startWidth, curveOffset);
    addSegment(midNode.x, midNode.y, lateNode.x, lateNode.y, midColorT, lateColorT, lerp(startWidth, endWidth, 0.45), curveOffset * 0.12);
    addSegment(lateNode.x, lateNode.y, endNode.x, endNode.y, lateColorT, endColorT, endWidth, curveOffset * 0.04);
  }

  function addBedBlend(anchorX, anchorT, interfaceNodes, direction) {
    const bottomInterfaceNode = interfaceNodes[interfaceNodes.length - 1];
    const lateralConfigs = [
      { row: 0, width: 0.18, curve: -3.5, hubY: 0.18, pull: 0.16 },
      { row: 1, width: 0.16, curve: -2.2, hubY: 0.34, pull: 0.12 },
      { row: 2, width: 0.15, curve: 0, hubY: 0.5, pull: 0.08 },
      { row: 3, width: 0.16, curve: 2.2, hubY: 0.66, pull: 0.12 },
      { row: 4, width: 0.18, curve: 3.5, hubY: 0.82, pull: 0.16 }
    ];
    const trunkMidA = createNode(anchorX, lerp(topY, midRailY, 0.38));
    const trunkMidB = createNode(anchorX, lerp(topY, midRailY, 0.68));
    const trunkMidC = createNode(anchorX, lerp(topY, bottomInterfaceNode.y, 0.9));
    const bedHub = createNode(anchorX, bottomInterfaceNode.y);
    const lowestJunctionY = lateralConfigs.reduce((maxY, config) => {
      return max(maxY, lerp(bedHub.y, midRailY, config.hubY));
    }, -Infinity);
    const trunkTip = createNode(anchorX, lowestJunctionY - 4);
    const trunkNodes = [createNode(anchorX, topY), trunkMidA, trunkMidB, trunkMidC, trunkTip];
    const trunkWidths = [1.0, 0.82, 0.62, 0.46];
    const trunkCurves = [0, 0, 0, 0];
    const trunkTs = trunkNodes.map((node) => colorTAtX(node.x));
    trunkTs[0] = anchorT;

    for (let i = 1; i < trunkNodes.length; i++) {
      const trunkSegment = addSegment(
        trunkNodes[i - 1].x,
        trunkNodes[i - 1].y,
        trunkNodes[i].x,
        trunkNodes[i].y,
        trunkTs[i - 1],
        trunkTs[i],
        trunkWidths[i - 1],
        trunkCurves[i - 1],
        3
      );
      const isTerminalBranchSegment = i === trunkNodes.length - 1;
      const sideMode = isTerminalBranchSegment
        ? (direction < 0 ? 1 : -1)
        : "both";
      endothelialGuides.push({
        segment: trunkSegment,
        sideMode,
        spacingScale: 0.96,
        edgeShift: 0.15,
        trimEnd: junctionGuideMode === "trim-trunk-before-hub" && isTerminalBranchSegment ? 0.34 : 0,
        priority: 2
      });
    }

    lateralConfigs.forEach((config) => {
      const interfaceNode = interfaceNodes[config.row];
      const lateralHub = createNode(
        anchorX,
        lerp(bedHub.y, midRailY, config.hubY)
      );
      const isLeftJunction = direction < 0;
      const entryNode = isLeftJunction
        ? meshNodes[config.row][1]
        : meshNodes[config.row][meshCols - 2];
      const blendTarget = createNode(
        lerp(lateralHub.x, interfaceNode.x, config.pull),
        lerp(lateralHub.y, interfaceNode.y, 0.72)
      );
      const interfaceLead = createNode(
        lerp(blendTarget.x, interfaceNode.x, 0.7),
        interfaceNode.y + config.curve * direction * 0.14
      );
      const entryLead = createNode(
        lerp(interfaceNode.x, entryNode.x, 0.48),
        lerp(interfaceNode.y, entryNode.y, 0.48) + config.curve * direction * 0.08
      );
      const branchSegment = addPolylineSegment(
        [lateralHub, blendTarget, interfaceLead, interfaceNode, entryLead, entryNode],
        colorTAtX(lateralHub.x),
        colorTAtX(entryNode.x),
        config.width,
        2
      );
      skippedHorizontalSegments.add(`${config.row}:${isLeftJunction ? 1 : meshCols - 1}`);

      const branchSideMode = config.row < 2 ? -1 : config.row > 2 ? 1 : (direction < 0 ? 1 : -1);
      endothelialGuides.push({
        segment: branchSegment,
        points: [lateralHub, blendTarget, interfaceLead, interfaceNode, entryLead],
        sideMode: branchSideMode,
        spacingScale: 0.74,
        edgeShift: 0.22,
        trimStart: junctionGuideMode === "trim-branch-fan-before-hub" ? 0.22 : 0.06,
        trimEnd: 0.06,
        priority: 8,
        collisionScale: 0.84
      });
    });
  }

  addBedBlend(arteryAnchorX, 0.2, leftInterface, -1);
  addBedBlend(veinAnchorX, 0.85, rightInterface, 1);

  for (let row = 0; row < meshRows; row++) {
    const nodes = meshNodes[row];
    for (let col = 1; col < nodes.length; col++) {
      if (skippedHorizontalSegments.has(`${row}:${col}`)) continue;
      const keepHorizontal = agingBranchReduction
        ? (
            routeSupportedHorizontalSegments.has(`${row}:${col}`) ||
            col === nodes.length - 1 ||
            (col === 1 && (row === 0 || row === meshRows - 1 || row === 2)) ||
            ((row + col) % 5 === 1 && col % 2 === 1)
          )
        : isTopBed && row <= 1
          ? ((row + col) % 4 !== 0 || col === nodes.length - 1) && col % 2 === 1
          : ((row + col) % 3 !== 0 || col === nodes.length - 1);
      if (keepHorizontal) {
        const segment = addSegment(
          nodes[col - 1].x,
          nodes[col - 1].y,
          nodes[col].x,
          nodes[col].y,
          colorTAtX(nodes[col - 1].x),
          colorTAtX(nodes[col].x),
          0.16,
          row < (meshRows - 1) / 2 ? -6 : 6,
          1
        );
        const isBedEndHorizontal = col === 1 || col === nodes.length - 1;
        const isTopBedEndHorizontal = row === 0 && isBedEndHorizontal;
        endothelialGuides.push({
          segment,
          sideMode: isTopBedEndHorizontal ? -1 : "both",
          spacingScale: isBedEndHorizontal ? 0.82 : 0.88,
          edgeShift: isBedEndHorizontal ? -0.18 : 0,
          priority: isBedEndHorizontal ? 4 : 0,
          collisionScale: isBedEndHorizontal ? 0.78 : 1
        });
      }
    }
  }

  for (let row = 1; row < meshRows; row++) {
    const prevRow = meshNodes[row - 1];
    const currRow = meshNodes[row];
    for (let col = 0; col < meshCols; col++) {
      if ((row + col) % 2 === 0 && (!agingBranchReduction || col === 0 || col === meshCols - 1 || (row + col) % 4 === 0)) {
        const segment = addSegment(prevRow[col].x, prevRow[col].y, currRow[col].x, currRow[col].y, colorTAtX(prevRow[col].x), colorTAtX(currRow[col].x), 0.14, 0, 1);
        const touchesBedInterface = col === 0 || col === meshCols - 1;
        if (!touchesBedInterface) {
          endothelialGuides.push({
            segment,
            sideMode: "both",
            spacingScale: 0.88,
            edgeShift: 0,
            priority: 1,
            collisionScale: 1
          });
        }
      }
      const supportsAgingRouteDiagonalRight = routeSupportedDiagonalRightSegments.has(`${row}:${col}`);
      if (col < meshCols - 1 && (!(isTopBed && row <= 2 && col % 2 === 0) || supportsAgingRouteDiagonalRight) && (!agingBranchReduction || supportsAgingRouteDiagonalRight || (row + col) % 4 === 1)) {
        const segment = addSegment(prevRow[col].x, prevRow[col].y, currRow[col + 1].x, currRow[col + 1].y, colorTAtX(prevRow[col].x), colorTAtX(currRow[col + 1].x), 0.12, -8, 1);
        const touchesBedInterface = col === 0 || col + 1 === meshCols - 1;
        if (!touchesBedInterface) {
          endothelialGuides.push({
            segment,
            sideMode: "both",
            spacingScale: 0.86,
            edgeShift: 0,
            priority: 0,
            collisionScale: 1
          });
        }
      }
      if (col > 0 && (row + col) % 2 === 1 && (!agingBranchReduction || routeSupportedDiagonalLeftSegments.has(`${row}:${col}`) || (row + col) % 4 === 3)) {
        const segment = addSegment(prevRow[col].x, prevRow[col].y, currRow[col - 1].x, currRow[col - 1].y, colorTAtX(prevRow[col].x), colorTAtX(currRow[col - 1].x), 0.12, 8, 1);
        const touchesBedInterface = col === meshCols - 1 || col - 1 === 0;
        if (!touchesBedInterface) {
          endothelialGuides.push({
            segment,
            sideMode: "both",
            spacingScale: 0.86,
            edgeShift: 0,
            priority: 0,
            collisionScale: 1
          });
        }
      }
    }
  }

  for (let col = 1; col < meshCols; col++) {
    const isJunctionEdgeHorizontal = col === 1 || col === meshCols - 1;
    addContour(
      meshNodes[0][col - 1],
      meshNodes[0][col],
      -4,
      isJunctionEdgeHorizontal
        ? {
            trimStart: col === 1 ? 0.38 : 0,
            trimEnd: col === meshCols - 1 ? 0.38 : 0,
            priority: 4
          }
        : undefined
    );
    addContour(
      meshNodes[meshRows - 1][col - 1],
      meshNodes[meshRows - 1][col],
      4,
      isJunctionEdgeHorizontal
        ? {
            trimStart: col === 1 ? 0.38 : 0,
            trimEnd: col === meshCols - 1 ? 0.38 : 0,
            priority: 4
          }
        : undefined
    );
  }
  for (let row = 1; row < meshRows; row++) {
    const isFirstInterfaceSegmentNearHandoff = row === meshRows - 1;
    addContour(
      meshNodes[row - 1][0],
      meshNodes[row][0],
      -2,
      isFirstInterfaceSegmentNearHandoff
        ? { skipGuide: true }
        : undefined
    );
    addContour(
      meshNodes[row - 1][meshCols - 1],
      meshNodes[row][meshCols - 1],
      2,
      isFirstInterfaceSegmentNearHandoff
        ? { skipGuide: true }
        : undefined
    );
  }

  addCapillaryBedBoundaryPlacements(meshNodes[0], 0, -1, -1, 16, 1, 1, {
    bedCenterY: midRailY,
    bedBorder: "top",
    placementPriority: 0
  });
  addCapillaryBedBoundaryPlacements(meshNodes[meshRows - 1], 0, 1, 1, 16, 0, 0, {
    bedCenterY: midRailY,
    bedBorder: "bottom",
    forceHorizontalOuterOnly: bottomY >= 100,
    placementPriority: 0
  });
  addCapillaryBedBottomEndPlacements(
    meshNodes[meshRows - 1],
    bottomY >= 240 ? 4 : bottomY >= 100 ? 3 : 2,
    {
      bedCenterY: midRailY,
      bedBorder: "bottom",
      forceHorizontalOuterOnly: bottomY >= 100,
      placementPriority: 2,
      placementSpacingThreshold: 14
    }
  );
  addCapillaryBedBoundaryPlacements(
    meshNodes.map((row) => row[0]),
    -1,
    0,
    -1,
    bottomY >= 100 ? 13 : 15,
    1,
    bottomY >= 100 ? 0 : 1,
    {
    bedCenterY: midRailY,
    bedBorder: "left",
    placementPriority: 0,
    junctionOutwardShift: bottomY >= 240 ? 28 : bottomY >= 100 ? 23 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
    }
  );
  if (bottomY < 100) {
    addCapillaryBedLowerSideEndPlacements(meshNodes.map((row) => row[0]), -1, 0, -1, 3, 12, {
      bedCenterY: midRailY,
      bedBorder: "left-top-lower-end",
      outwardShift: 0,
      groupRotation: -PI / 9,
      sourceIndexOffsets: [0, 2, 4],
      centerShiftSequence: [0, 0, 0],
      verticalShiftSequence: [0, 0, 0],
      finalAdjustmentSequence: [
        {
          dx: -10,
          dy: 8,
          renderOptions: {
            endothelialAngleDelta: -PI / 18
          }
        },
        {
          dx: -13,
          dy: 5,
          renderOptions: {
            endothelialAngleDelta: -PI / 18
          }
        },
        {
          dx: -10,
          dy: 3,
          skipPlacement: true
        }
      ]
    });
  }
  addCapillaryBedJunctionGapPlacement(meshNodes.map((row) => row[0]), -1, 0, -1, 15, 1, 1, {
    bedCenterY: midRailY,
    bedBorder: "left",
    placementPriority: 1,
    junctionOutwardShift: bottomY >= 240 ? 24 : bottomY >= 100 ? 20 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
  });
  addCapillaryBedJunctionCompanionPlacement(meshNodes.map((row) => row[0]), -1, 0, -1, 15, 1, 1, {
    bedCenterY: midRailY,
    bedBorder: "left",
    placementPriority: 1,
    junctionOutwardShift: bottomY >= 240 ? 24 : bottomY >= 100 ? 20 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
  });
  addCapillaryBedBoundaryPlacements(
    meshNodes.map((row) => row[meshCols - 1]),
    1,
    0,
    1,
    bottomY >= 100 ? 13 : 15,
    1,
    bottomY >= 100 ? 0 : 1,
    {
    bedCenterY: midRailY,
    bedBorder: "right",
    placementPriority: 0,
    junctionOutwardShift: bottomY >= 240 ? 28 : bottomY >= 100 ? 23 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
    }
  );
  if (bottomY < 100) {
    addCapillaryBedLowerSideEndPlacements(meshNodes.map((row) => row[meshCols - 1]), 1, 0, 1, 3, 12, {
      bedCenterY: midRailY,
      bedBorder: "right-top-lower-end",
      outwardShift: 0,
      groupRotation: PI / 9,
      sourceIndexOffsets: [0, 2, 4],
      centerShiftSequence: [0, 0, 0],
      verticalShiftSequence: [0, 0, 0],
      finalAdjustmentSequence: [
        {
          dx: 10,
          dy: 8,
          renderOptions: {
            endothelialAngleDelta: PI / 18
          }
        },
        {
          dx: 13,
          dy: 5,
          renderOptions: {
            endothelialAngleDelta: PI / 18
          }
        },
        {
          dx: 10,
          dy: 3,
          skipPlacement: true
        }
      ]
    });
  }
  addCapillaryBedJunctionGapPlacement(meshNodes.map((row) => row[meshCols - 1]), 1, 0, 1, 15, 1, 1, {
    bedCenterY: midRailY,
    bedBorder: "right",
    placementPriority: 1,
    junctionOutwardShift: bottomY >= 240 ? 24 : bottomY >= 100 ? 20 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
  });
  addCapillaryBedJunctionCompanionPlacement(meshNodes.map((row) => row[meshCols - 1]), 1, 0, 1, 15, 1, 1, {
    bedCenterY: midRailY,
    bedBorder: "right",
    placementPriority: 1,
    junctionOutwardShift: bottomY >= 240 ? 24 : bottomY >= 100 ? 20 : 0,
    junctionCenterShift: bottomY >= 100 && bottomY < 240 ? 6 : 0,
    junctionVerticalShift: bottomY >= 100 && bottomY < 240 ? 4 : 0
  });

  routePatterns.forEach((rowPattern) => {
    const leftRow = constrain(rowPattern[0], 0, meshRows - 1);
    const rightRow = constrain(rowPattern[rowPattern.length - 1], 0, meshRows - 1);
    const routePoints = dedupeRoutePoints([
      ...createCollectorPoints(arteryAnchorX, leftInterface[leftRow], leftRow, false),
      ...createMeshRoute(rowPattern),
      ...createCollectorPoints(veinAnchorX, rightInterface[rightRow], rightRow, true)
    ]);
    if (routePoints.length >= 2) {
      flowRoutes.push(routePoints);
    }
  });

  return { segments, flowRoutes, endothelialGuides, capillaryBedBbbPlacements };
}

function createCapillaryTemplateNodes(startX, endX, centerY, halfHeight) {
  const templateRows = [
    [0.08, 0.24, 0.4, 0.58, 0.76, 0.92],
    [0.04, 0.2, 0.36, 0.56, 0.76, 0.96],
    [0.02, 0.18, 0.34, 0.54, 0.78, 0.98],
    [0.04, 0.22, 0.4, 0.6, 0.8, 0.96],
    [0.08, 0.26, 0.44, 0.62, 0.8, 0.92]
  ];
  const templateHeights = [-0.92, -0.46, 0, 0.46, 0.92];

  return templateRows.map((row, rowIndex) => {
    const rowCurve = sin((rowIndex / (templateRows.length - 1)) * PI);
    return row.map((u) => {
      const arch = sin(u * PI);
      return {
        x: lerp(startX, endX, u),
        y: centerY + templateHeights[rowIndex] * halfHeight + templateHeights[rowIndex] * arch * halfHeight * 0.28 + (rowIndex - 2) * rowCurve * 2
      };
    });
  });
}

function drawBranchNetwork(network, arteryColor, capillaryColor, veinColor, weight, borderColor) {
  return;
}

function drawMergedVascularSegments(segments, arteryColor, capillaryColor, veinColor, weight, borderColor) {
  const orderedSegments = segments.slice().sort((a, b) => {
    const layerDiff = (a.layer || 1) - (b.layer || 1);
    if (layerDiff !== 0) return layerDiff;
    return b.widthScale - a.widthScale;
  });

  push();
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  orderedSegments.forEach((segment) => {
    strokeWeight(weight * segment.widthScale + 3.2);
    stroke(borderColor);
    drawCurvedSegment(segment);
  });

  orderedSegments.forEach((segment) => {
    strokeWeight(weight * segment.widthScale + 2.2);
    const colorA = getPathColor(segment.tStart, arteryColor, capillaryColor, veinColor);
    const colorB = getPathColor(segment.tEnd, arteryColor, capillaryColor, veinColor);
    stroke(lerpColor(colorA, colorB, 0.5));
    drawCurvedSegment(segment);
  });

  pop();
}

function drawCurvedSegment(segment) {
  const points = sampleSegmentPoints(segment, 14);
  for (let i = 1; i < points.length; i++) {
    line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
}

function sampleSegmentPoints(segment, steps) {
  if (segment.points && segment.points.length >= 2) {
    return samplePolylinePoints(segment.points, steps);
  }
  const midX = (segment.start.x + segment.end.x) * 0.5;
  const midY = (segment.start.y + segment.end.y) * 0.5;
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const length = max(1, sqrt(dx * dx + dy * dy));
  const nx = -dy / length;
  const ny = dx / length;
  const control = {
    x: midX + nx * segment.curveOffset,
    y: midY + ny * segment.curveOffset
  };
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: quadraticCurveValue(segment.start.x, control.x, segment.end.x, t),
      y: quadraticCurveValue(segment.start.y, control.y, segment.end.y, t)
    });
  }
  return points;
}

function samplePolylinePoints(points, steps) {
  const sampled = [];
  const spans = max(1, points.length - 1);
  const stepsPerSpan = max(2, ceil(steps / spans));

  for (let span = 1; span < points.length; span++) {
    const start = points[span - 1];
    const end = points[span];
    for (let i = 0; i <= stepsPerSpan; i++) {
      if (span > 1 && i === 0) continue;
      const t = i / stepsPerSpan;
      sampled.push({
        x: lerp(start.x, end.x, t),
        y: lerp(start.y, end.y, t)
      });
    }
  }

  return sampled;
}

function quadraticCurveValue(p0, p1, p2, t) {
  const oneMinusT = 1 - t;
  return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

function getPathColor(pathT, arteryColor, capillaryColor, veinColor) {
  if (pathT <= 0.34) return arteryColor;
  if (pathT <= 0.62) {
    return lerpColor(arteryColor, capillaryColor, map(pathT, 0.34, 0.62, 0, 1, true));
  }
  if (pathT <= 0.82) {
    return lerpColor(capillaryColor, veinColor, map(pathT, 0.62, 0.82, 0, 1, true));
  }
  return veinColor;
}

window.getCorticalViewState = getCorticalViewState;
window.getCorticalViewReadiness = getCorticalViewReadiness;
window.updateCorticalView = updateCorticalView;
window.warmCorticalViewInBackground = warmCorticalViewInBackground;
window.zoomCorticalCanvasAtScreenPoint = zoomCorticalCanvasAtScreenPoint;
window.corticalScreenToWorld = corticalScreenToWorld;
window.corticalWorldToScreen = corticalWorldToScreen;
window.getCorticalNeuronActivationSnapshot = getCorticalNeuronActivationSnapshot;
window.startCorticalGuidedTutorial = startCorticalGuidedTutorial;
window.stopCorticalGuidedTutorial = stopCorticalGuidedTutorial;
window.advanceCorticalTutorialStep = advanceCorticalTutorialStep;
window.retreatCorticalTutorialStep = retreatCorticalTutorialStep;
window.dismissCorticalTutorialCompletionMessage = dismissCorticalTutorialCompletionMessage;
