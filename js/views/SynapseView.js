console.log("🔬 SynapseView loaded — SCREEN-FRAMED, CLIPPED (FIXED)");

// =====================================================
// SYNAPSE VIEW — ORCHESTRATOR (FIXED-RATIO, CLIPPED)
// =====================================================
//
// ✔ Independent view (NOT overview zoom)
// ✔ Fixed aspect ratio
// ✔ Uniform scaling across screen sizes
// ✔ HARD viewport clipping (Canvas-native)
//
// RESPONSIBILITIES:
// • Calls update functions in correct order
// • Draws geometry in correct visual order
// • Owns NO physics
// • Owns NO constraints
//
// NT confinement lives in:
// → cleftGeometry.js
// → NTmotion.js
//
// =====================================================


// =====================================================
// 🔑 SYNAPSE DESIGN FRAME (AUTHORITATIVE)
// =====================================================
const SYNAPSE_FRAME = {
  width:  900,
  height: 500
};

// <1 crops top/bottom by using a shorter design-height for fitting.
const SYNAPSE_VERTICAL_CROP = 0.82;


// =====================================================
// RESPONSIVE SCALE
// =====================================================
// >1 zooms in (content appears closer), <1 zooms out.
const SYNAPSE_VIEWPORT_PADDING = 1.12;


// =====================================================
// WORLD ANCHORS (LOCAL TO SYNAPSE VIEW)
// =====================================================
const PRE_X    = -130;
const POST_X   = +130;
const NEURON_Y = 40;
window.SYNAPSE_PRE_X = PRE_X;
window.SYNAPSE_POST_X = POST_X;
window.SYNAPSE_NEURON_Y = NEURON_Y;


// =====================================================
// USER INPUT — INTENT ONLY
// =====================================================
let spaceWasDown = false;

function handleSynapseInput() {
  if (window.mobileTouchUI) {
    spaceWasDown = false;
    return;
  }
  const spaceDown = keyIsDown(32);
  if (spaceDown && !spaceWasDown) {
    window.triggerTerminalAP?.({ releaseMode: "all" });
  }
  spaceWasDown = spaceDown;
}

window.synapseGuidedTutorial = window.synapseGuidedTutorial || {
  enabled: false,
  running: false,
  step: 0,
  stepStartTime: 0,
  lastActionTime: -9999,
  pulse: 0,
  title: "",
  body: "",
  overlayTitle: "",
  overlaySubtitle: "",
  phase: "",
  prevPlasticityDemoEnabled: false
};

function setSynapseTutorialStep(step) {
  const tutorial = window.synapseGuidedTutorial;
  tutorial.step = step;
  tutorial.stepStartTime = state.time;
  tutorial.lastActionTime = -9999;
  tutorial.phase = "";

  if (step === 0) {
    tutorial.title = "Synapse Guided Tutorial";
    tutorial.body = "This synapse view introduces the two cellular sides of the cleft and the direction of signaling between them.";
    tutorial.overlayTitle = "TRIPARTITE SYNAPSE";
    tutorial.overlaySubtitle = "Presynaptic and postsynaptic compartments face each other across the cleft";
  } else if (step === 1) {
    tutorial.title = "Vesicle Loading";
    tutorial.body = "Vesicles are biochemically prepared before release. Proton gradients and ATP-dependent processes support neurotransmitter loading and vesicle readiness in the presynaptic terminal.";
    tutorial.overlayTitle = "STEP 1: VESICLE LOADING";
    tutorial.overlaySubtitle = "ATP-supported loading and vesicle acidification prepare the releasable pool";
  } else if (step === 2) {
    tutorial.title = "Loaded Vesicles";
    tutorial.body = "These loaded vesicles occupy the membrane-adjacent pool and are available for rapid recruitment to release sites.";
    tutorial.overlayTitle = "STEP 2: LOADED VESICLES";
    tutorial.overlaySubtitle = "Loaded vesicles form the immediately releasable supply near the membrane";
  } else if (step === 3) {
    tutorial.title = "Ca2+ Channel Opening";
    tutorial.body = "Arrival of the presynaptic action potential opens voltage-gated Ca2+ channels, and Ca2+ influx provides the trigger for exocytotic release.";
    tutorial.overlayTitle = "STEP 3: Ca2+ ENTRY";
    tutorial.overlaySubtitle = "Presynaptic depolarization opens Ca2+ channels at the active zone";
  } else if (step === 4) {
    tutorial.title = "Docking and Fusion";
    tutorial.body = "Docked vesicles align with release sites. SNARE proteins zipper vesicle and plasma membranes together, driving fusion pore formation.";
    tutorial.overlayTitle = "STEP 4: SNARE FUSION";
    tutorial.overlaySubtitle = "SNARE-mediated membrane zippering promotes vesicle fusion";
  } else if (step === 5) {
    tutorial.title = "Neurotransmitter Release";
    tutorial.body = "After fusion pore formation, neurotransmitter is released into the cleft and begins diffusing toward receptors and uptake sites.";
    tutorial.overlayTitle = "STEP 5: NT RELEASE";
    tutorial.overlaySubtitle = "Released transmitter spreads through the synaptic cleft";
  } else if (step === 6) {
    tutorial.title = "AMPA Receptor Binding";
    tutorial.body = "AMPA-type receptors bind transmitter and rapidly produce a depolarizing postsynaptic response through cation influx.";
    tutorial.overlayTitle = "STEP 6: AMPA";
    tutorial.overlaySubtitle = "AMPA receptors mediate fast excitatory synaptic current";
  } else if (step === 7) {
    tutorial.title = "NMDA Receptor Binding";
    tutorial.body = "NMDA-type receptors require transmitter plus glycine co-agonism in this model and contribute a slower, coincidence-sensitive postsynaptic signal.";
    tutorial.overlayTitle = "STEP 7: NMDA + GLYCINE";
    tutorial.overlaySubtitle = "NMDA receptors integrate glutamate binding with glycine co-agonism";
  } else if (step === 8) {
    tutorial.title = "Metabotropic Signaling";
    tutorial.body = "GPCR activation engages heterotrimeric G-proteins and slower downstream signaling pathways, including channel modulation.";
    tutorial.overlayTitle = "STEP 8: GPCR";
    tutorial.overlaySubtitle = "Metabotropic receptors signal through G-proteins and slower ionic effects";
  } else if (step === 9) {
    tutorial.title = "Astrocyte GPCR and Ca2+ Release";
    tutorial.body = "Neurotransmitter can also activate astrocytic GPCRs, leading to intracellular signaling and release of stored Ca2+ from the astrocyte.";
    tutorial.overlayTitle = "STEP 9: ASTROCYTE SIGNAL";
    tutorial.overlaySubtitle = "Astrocytic GPCR activation recruits intracellular Ca2+ signaling";
  } else if (step === 10) {
    tutorial.title = "Neurotransmitter Reuptake";
    tutorial.body = "Transporters on both the astrocyte and presynaptic membrane clear transmitter from the cleft, shaping signal duration and recycling resources.";
    tutorial.overlayTitle = "STEP 10: REUPTAKE";
    tutorial.overlaySubtitle = "Astrocytic and neuronal uptake terminate and recycle transmitter";
  } else if (step === 11) {
    tutorial.title = "Mitochondrial Support";
    tutorial.body = "Presynaptic mitochondria provide energetic support and show ATP and H+ handling that underpins sustained synaptic function.";
    tutorial.overlayTitle = "STEP 11: MITOCHONDRIA";
    tutorial.overlaySubtitle = "Mitochondria support synaptic work through ATP-linked metabolism";
  } else if (step === 12) {
    tutorial.title = "Microtubule Transport";
    tutorial.body = "Microtubule-based transport supports movement of proteins and material between the axonal shaft and synaptic terminal.";
    tutorial.overlayTitle = "STEP 12: MICROTUBULES";
    tutorial.overlaySubtitle = "Axonal transport delivers and removes synaptic material";
  } else if (step === 13) {
    tutorial.title = "Now You Try";
    tutorial.body = "Trigger terminal activity, watch vesicle release, follow transmitter spread, and compare receptor and astrocyte responses under different stimulation patterns.";
    tutorial.overlayTitle = "EXPLORE THE SYNAPSE";
    tutorial.overlaySubtitle = "Probe release, binding, uptake, and plasticity dynamics";
  }
}

function startSynapseGuidedTutorial() {
  const tutorial = window.synapseGuidedTutorial;
  tutorial.enabled = true;
  tutorial.running = true;
  tutorial.pulse = 0;
  tutorial.prevPlasticityDemoEnabled = !!window.synapseLtpLtdDemo?.enabled;
  setSynapseTutorialStep(0);
  window.syncGuidedTutorialToggle?.();
}

function stopSynapseGuidedTutorial() {
  const tutorial = window.synapseGuidedTutorial;
  tutorial.enabled = false;
  tutorial.running = false;
  tutorial.title = "";
  tutorial.body = "";
  tutorial.overlayTitle = "";
  tutorial.overlaySubtitle = "";
  tutorial.prevPlasticityDemoEnabled = false;
  window.syncGuidedTutorialToggle?.();
}

function advanceSynapseTutorialStep() {
  const tutorial = window.synapseGuidedTutorial;
  const next = tutorial.step >= 13 ? 13 : tutorial.step + 1;
  setSynapseTutorialStep(next);
}

function updateSynapseGuidedTutorial() {
  const tutorial = window.synapseGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;

  tutorial.pulse += 0.12;
  const elapsed = state.time - tutorial.stepStartTime;
  const ntCount = window.synapticNTs?.length || 0;
  const loadedCount = getLoadedVesicleCount();
  const vesicles = window.synapseVesicles || [];
  const dockingCount = vesicles.filter(v => v?.state === "DOCKING" || v?.state === "FUSING").length;
  const preCaCount = window.preCaInflux?.particles?.length || 0;
  const uptakePreCount = window.getPresynapticUptakeChannels?.().length || 0;
  const uptakeAstroCount = window.getAstrocyteUptakeChannels?.().length || 0;
  const mitoParticleCount = window.preMitoPump?.particles?.length || 0;
  const transportCount =
    (window.synapticMaterialTransport?.pre?.particles?.length || 0) +
    (window.synapticMaterialTransport?.post?.particles?.length || 0);

  if (tutorial.step === 0) {
    if (elapsed > 3600) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 1) {
    tutorial.body = `Vesicle loading prepares the releasable pool. In this model, vesicle readiness is framed as ATP-supported loading with H+ gradient-dependent preparation. Loaded vesicles available: ${loadedCount}.`;
    if (elapsed > 10500) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 2) {
    tutorial.body = `These loaded vesicles are positioned near the membrane and are available for rapid recruitment to release sites. Loaded vesicles visible: ${loadedCount}.`;
    if (elapsed > 8200) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 3) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2800) {
      window.triggerTerminalAP?.({ releaseMode: "single" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `Voltage-gated Ca2+ channels open with presynaptic depolarization. Entering Ca2+ provides the key trigger for exocytosis. Visible Ca2+ particles: ${preCaCount}.`;
    if (elapsed > 10000) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 4) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2500) {
      window.triggerTerminalAP?.({ releaseMode: "single" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `Docking and fusion are occurring at the active zone. SNARE proteins bring vesicle and plasma membranes into tight apposition to promote fusion. Vesicles docking/fusing now: ${dockingCount}.`;
    if (elapsed > 10000) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 5) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2500) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `Neurotransmitter is being released into the cleft and spreading toward the postsynaptic membrane and astrocyte-facing boundaries. Active NT particles: ${ntCount}.`;
    if (elapsed > 9500) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 6) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2600) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `AMPA receptors bind released transmitter and mediate the fast excitatory postsynaptic response through rapid cation influx. Active NT particles: ${ntCount}.`;
    if (elapsed > 9000) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 7) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2600) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `NMDA receptors are highlighted here with glycine co-agonism. In this model they represent a slower, coincidence-sensitive component of postsynaptic signaling. Active NT particles: ${ntCount}.`;
    if (elapsed > 9500) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 8) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2600) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `Postsynaptic GPCRs engage heterotrimeric G-proteins and slower downstream signaling, including channel modulation and second-messenger effects.`;
    if (elapsed > 9500) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 9) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2600) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = "Astrocytic GPCR activation can trigger intracellular signaling that culminates in release of stored Ca2+ from the astrocyte.";
    if (elapsed > 10500) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 10) {
    if (!window.terminalAP?.active && state.time - tutorial.lastActionTime > 2600) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      tutorial.lastActionTime = state.time;
    }
    tutorial.body = `Reuptake is highlighted on both sides of the cleft. Presynaptic uptake sites: ${uptakePreCount}. Astrocytic uptake sites: ${uptakeAstroCount}.`;
    if (elapsed > 10000) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 11) {
    tutorial.body = `Presynaptic mitochondria are highlighted here along with ATP and H+ activity that supports sustained synaptic work. Visible ATP/H+ particles: ${mitoParticleCount}.`;
    if (elapsed > 9000) advanceSynapseTutorialStep();
    return;
  }

  if (tutorial.step === 12) {
    tutorial.body = `Microtubule bundles support transport of material and proteins between shaft and terminal. Visible transport particles: ${transportCount}.`;
    if (elapsed > 9500) advanceSynapseTutorialStep();
    return;
  }
}

function drawSynapseTutorialPulseCircle(x, y, r, col = [255, 225, 135, 220]) {
  noFill();
  stroke(col[0], col[1], col[2], col[3]);
  strokeWeight(2.2 / max(SYNAPSE_VIEWPORT_PADDING, 0.001));
  circle(x, y, r);
}

function drawSynapseTutorialPulseRect(x, y, w, h, radius = 18, col = [255, 225, 135, 220]) {
  noFill();
  stroke(col[0], col[1], col[2], col[3]);
  strokeWeight(2.2 / max(SYNAPSE_VIEWPORT_PADDING, 0.001));
  rectMode(CENTER);
  rect(x, y, w, h, radius);
  rectMode(CORNER);
}

function getSynapseTutorialPoint(side, x, y) {
  if (side === "pre") {
    return {
      x: PRE_X - x,
      y: NEURON_Y - y
    };
  }

  return {
    x: POST_X + x,
    y: NEURON_Y + y
  };
}

function drawSynapseTutorialTag(x, y, label, col = [255, 240, 190, 230]) {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  textSize(12);
  noStroke();
  fill(12, 16, 26, 220);
  rect(x, y, max(78, label.length * 7.2), 24, 8);
  fill(col[0], col[1], col[2], col[3]);
  text(label, x, y + 0.5);
  pop();
}

function drawSynapseTutorialOverlay() {
  const tutorial = window.synapseGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;

  if (tutorial.step === 0) {
    push();
    stroke(255, 230, 150, 230);
    strokeWeight(5);
    line(-24, NEURON_Y - 6, -92, NEURON_Y - 6);
    line(-92, NEURON_Y - 6, -74, NEURON_Y - 18);
    line(-92, NEURON_Y - 6, -74, NEURON_Y + 6);
    line(24, NEURON_Y - 6, 92, NEURON_Y - 6);
    line(92, NEURON_Y - 6, 74, NEURON_Y - 18);
    line(92, NEURON_Y - 6, 74, NEURON_Y + 6);
    noStroke();
    fill(255, 240, 190, 230);
    textAlign(CENTER, TOP);
    textSize(13);
    text("Presynapse", -58, NEURON_Y + 8);
    text("Postsynapse", 58, NEURON_Y + 8);
    pop();
  }

  if (tutorial.step === 1) {
    const reserve = window.getReservePoolRect?.();
    if (reserve) {
      const cx = PRE_X - (reserve.xMin + reserve.xMax) * 0.5;
      const cy = NEURON_Y - (reserve.yMin + reserve.yMax) * 0.5;
      drawSynapseTutorialPulseRect(
        cx,
        cy,
        reserve.xMax - reserve.xMin + 18,
        reserve.yMax - reserve.yMin + 24,
        20,
        [120, 255, 170, 220]
      );
      drawSynapseTutorialTag(cx, cy - 44, "Loading Pool", [120, 255, 170, 230]);
    }
  }

  if (tutorial.step === 2) {
    const vesicles = (window.synapseVesicles || []).filter(v => v?.state === "LOADED");
    vesicles.forEach(v => {
      const p = getSynapseTutorialPoint("pre", v.x, v.y);
      drawSynapseTutorialPulseCircle(p.x, p.y, (v.radius || 10) * 2.2, [255, 208, 120, 220]);
    });
    const loadedPool = window.getLoadedPoolRect?.();
    if (loadedPool) {
      const cx = PRE_X - (loadedPool.xMin + loadedPool.xMax) * 0.5;
      const cy = NEURON_Y - (loadedPool.yMin + loadedPool.yMax) * 0.5;
      drawSynapseTutorialTag(cx, cy, "Loaded Vesicles", [255, 208, 120, 230]);
    }
  }

  if (tutorial.step === 3) {
    const channelAnchors = window.getPresynapticCaChannelAnchors?.() || [];
    channelAnchors.forEach(anchor => {
      drawSynapseTutorialPulseRect(anchor.x, anchor.y, 42, 34, 14, [255, 170, 90, 220]);
    });
    if (channelAnchors[0] && channelAnchors[1]) {
      const labelX = (channelAnchors[0].x + channelAnchors[1].x) * 0.5 - 20;
      const labelY = min(channelAnchors[0].y, channelAnchors[1].y) - 28;
      drawSynapseTutorialTag(labelX, labelY, "Ca2+ Channels", [255, 170, 90, 230]);
    }
  }

  if (tutorial.step === 4) {
    const fusion = getSynapseTutorialPoint("pre", 10, 0);
    drawSynapseTutorialPulseRect(fusion.x, fusion.y, 92, 300, 20, [255, 210, 120, 220]);
    drawSynapseTutorialTag(fusion.x, fusion.y - 170, "Docking + SNARE Fusion", [255, 210, 120, 230]);
  }

  if (tutorial.step === 5) {
    push();
    textAlign(CENTER, CENTER);
    textSize(16);
    noStroke();
    fill(160, 230, 255, 235);
    text("Cleft", 0, NEURON_Y);
    pop();
  }

  if (tutorial.step === 6) {
    const ampaReceptors = window.getPostsynapticReceptorAnchors?.("ampa") || [];
    ampaReceptors.forEach(r => {
      drawSynapseTutorialPulseCircle(r.x, r.y, 28, [255, 210, 120, 220]);
    });
    if (ampaReceptors[0]) {
      drawSynapseTutorialTag(POST_X + 20, NEURON_Y - 88, "AMPA Receptors", [255, 210, 120, 230]);
    }
  }

  if (tutorial.step === 7) {
    const nmdaReceptors = window.getPostsynapticReceptorAnchors?.("nmda") || [];
    nmdaReceptors.forEach(r => {
      drawSynapseTutorialPulseCircle(r.x, r.y, 28, [135, 225, 255, 220]);
    });
    if (nmdaReceptors[0]) {
      drawSynapseTutorialTag(POST_X + 20, NEURON_Y - 96, "NMDA Receptors", [135, 225, 255, 230]);
    }
  }

  if (tutorial.step === 8) {
    const gpcrReceptors = window.getPostsynapticReceptorAnchors?.("gpcr") || [];
    gpcrReceptors.forEach(r => {
      const xs = [r.x];
      const ys = [r.y];
      if (Number.isFinite(r.effectorX) && Number.isFinite(r.effectorY)) {
        xs.push(r.effectorX);
        ys.push(r.effectorY);
      }
      if (Number.isFinite(r.ionX) && Number.isFinite(r.ionY)) {
        xs.push(r.ionX);
        ys.push(r.ionY);
      }
      const minX = Math.min(...xs) - 18;
      const maxX = Math.max(...xs) + 18;
      const minY = Math.min(...ys) - 18;
      const maxY = Math.max(...ys) + 18;
      drawSynapseTutorialPulseRect(
        (minX + maxX) * 0.5,
        (minY + maxY) * 0.5,
        maxX - minX,
        maxY - minY,
        16,
        [205, 170, 255, 220]
      );
    });
    drawSynapseTutorialTag(POST_X + 42, NEURON_Y - 108, "G-Protein Coupled Receptor Complex", [205, 170, 255, 230]);
  }

  if (tutorial.step === 9) {
    const astroGpcrs = window.getAstrocyteGpcrs?.() || [];
    astroGpcrs.forEach(r => {
      drawSynapseTutorialPulseCircle(r.x, r.y, 18, [205, 170, 255, 220]);
      drawSynapseTutorialTag(
        r.x,
        r.y + (r.id === 0 ? -28 : 28),
        "Astrocyte GPCR",
        [205, 170, 255, 230]
      );
    });
    const store = window.getAstrocyteCaStoreRectWorld?.();
    if (store) {
      drawSynapseTutorialPulseRect(
        store.x,
        store.y,
        store.w,
        store.h,
        14,
        [255, 170, 225, 220]
      );
      drawSynapseTutorialTag(store.x, store.y + (store.h * 0.5 + 18), "Stored Ca2+", [255, 170, 225, 230]);
    }
  }

  if (tutorial.step === 10) {
    const preChannels = window.getPresynapticUptakeChannels?.() || [];
    const astroChannels = window.getAstrocyteUptakeChannels?.() || [];
    const preGroups = new Map();
    preChannels.forEach(ch => {
      const key = `${ch.groupY}`;
      const entry = preGroups.get(key) || { x: 0, y: 0, count: 0 };
      entry.x += ch.x;
      entry.y += ch.y;
      entry.count += 1;
      preGroups.set(key, entry);
    });
    preGroups.forEach(group => {
      const x = group.x / group.count;
      const y = group.y / group.count;
      drawSynapseTutorialPulseCircle(x, y, 22, [120, 255, 200, 220]);
      push();
      noStroke();
      fill(120, 255, 200, 235);
      textAlign(CENTER, BOTTOM);
      textSize(10);
      text("NT reuptake", x, y - 18);
      pop();
    });

    const astroGroups = new Map();
    astroChannels.forEach(ch => {
      const key = `${ch.groupX}`;
      const entry = astroGroups.get(key) || { x: 0, y: 0, count: 0 };
      entry.x += ch.x;
      entry.y += ch.y;
      entry.count += 1;
      astroGroups.set(key, entry);
    });
    astroGroups.forEach(group => {
      const x = group.x / group.count;
      const y = group.y / group.count;
      drawSynapseTutorialPulseCircle(x, y, 22, [205, 170, 255, 220]);
      push();
      noStroke();
      fill(205, 170, 255, 235);
      textAlign(CENTER, BOTTOM);
      textSize(10);
      text("NT reuptake", x, y - 18);
      pop();
    });
  }

  if (tutorial.step === 11) {
    const anchors = window.getPresynapticMitoAnchors?.() || [];
    anchors.forEach((anchor, index) => {
      const p = getSynapseTutorialPoint("pre", anchor.x, anchor.y);
      drawSynapseTutorialPulseRect(p.x, p.y, 56, 88, 18, [255, 170, 120, 220]);
      drawSynapseTutorialTag(
        p.x,
        p.y + 58,
        "Mitochondria",
        [255, 170, 120, 230]
      );
    });
  }

  if (tutorial.step === 12) {
    drawSynapseTutorialPulseRect(PRE_X - 248, NEURON_Y, 164, 72, 24, [150, 225, 255, 220]);
    drawSynapseTutorialPulseRect(POST_X + 248, NEURON_Y, 164, 72, 24, [150, 225, 255, 220]);
    drawSynapseTutorialTag(PRE_X - 248, NEURON_Y - 56, "Transport Microtubules", [150, 225, 255, 230]);
    drawSynapseTutorialTag(POST_X + 248, NEURON_Y - 56, "Transport Microtubules", [150, 225, 255, 230]);
  }
}

function drawSynapseTutorialHUD(viewX, viewY, viewW) {
  const tutorial = window.synapseGuidedTutorial;
  if (!tutorial?.enabled || !tutorial.running) return;

  push();
  resetMatrix();
  noStroke();

  const hudX = max(16, viewX + 10);
  const hudY = max(78, viewY + 10);
  const hudW = min(560, viewW - 20);
  const hudH = 88;

  fill(12, 16, 26, 220);
  rect(hudX, hudY, hudW, hudH, 10);
  fill(255, 236, 174);
  textAlign(LEFT, TOP);
  textSize(13);
  text(`Tutorial: ${tutorial.title}`, hudX + 12, hudY + 10);
  fill(218, 226, 240);
  textSize(12);
  text(tutorial.body, hudX + 12, hudY + 32, hudW - 24, hudH - 18);

  const overlayX = constrain(viewX + 28, 20, width - 420);
  const overlayY = max(viewY + 220, 220);
  fill(255, 255, 255, 230);
  textSize(30);
  text(tutorial.overlayTitle || "TRIPARTITE SYNAPSE", overlayX, overlayY);
  fill(255, 255, 255, 188);
  textSize(16);
  text(tutorial.overlaySubtitle || "", overlayX, overlayY + 36, min(520, viewW - 30), 80);
  pop();
}


// =====================================================
// LTP/LTD AUTO-DEMO CONTROLLER
// =====================================================
window.synapseLtpLtdDemo = window.synapseLtpLtdDemo || {
  enabled: false,
  phase: "idle", // idle | ltp | ltd_wait | ltd
  completedCycles: 0,
  maxCycles: 10,
  pendingStimulations: 0,
  lastLoadedCount: 0,
  ltdStartFrame: -Infinity
};

function getLoadedVesicleCount() {
  const vesicles = window.synapseVesicles || [];
  let loaded = 0;
  for (const v of vesicles) {
    if (v?.state === "LOADED") loaded += 1;
  }
  return loaded;
}

function updateLtpLtdButtonUI() {
  const btn = document.getElementById("ltpLtdBtn");
  if (!btn) return;

  const demo = window.synapseLtpLtdDemo;
  const now = typeof frameCount === "number" ? frameCount : 0;
  const ltdHighlightActive =
    demo?.phase === "ltd" &&
    Number.isFinite(demo.ltdStartFrame) &&
    now - demo.ltdStartFrame <= 10 * 60;

  btn.classList.remove("running", "phase-ltp", "phase-ltd");

  if (!demo?.enabled) {
    btn.title = "Run automatic LTP/LTD demo";
    return;
  }

  btn.classList.add("running");
  if (demo.phase === "ltp") btn.classList.add("phase-ltp");
  if (ltdHighlightActive) btn.classList.add("phase-ltd");
  btn.title = "Auto LTP/LTD demo running";
}

function toggleLtpLtdDemo() {
  const demo = window.synapseLtpLtdDemo;
  if (!demo) return;

  if (demo.enabled) {
    demo.enabled = false;
    demo.phase = "idle";
    demo.completedCycles = 0;
    demo.pendingStimulations = 0;
    demo.lastLoadedCount = getLoadedVesicleCount();
    demo.ltdStartFrame = -Infinity;
    updateLtpLtdButtonUI();
    return;
  }

  const initialLoaded = getLoadedVesicleCount();
  demo.enabled = true;
  demo.phase = "ltp";
  demo.completedCycles = 0;
  demo.pendingStimulations = initialLoaded > 0 ? 1 : 0;
  demo.lastLoadedCount = initialLoaded;
  demo.ltdStartFrame = -Infinity;
  updateLtpLtdButtonUI();
}

function updateLtpLtdAutoStimulation() {
  const demo = window.synapseLtpLtdDemo;
  if (!demo?.enabled) return;

  if (demo.phase === "ltp") {
    const loadedCount = getLoadedVesicleCount();

    const loadDelta = max(0, loadedCount - demo.lastLoadedCount);
    demo.lastLoadedCount = loadedCount;
    if (loadDelta > 0) {
      demo.pendingStimulations += loadDelta;
    }

    if (
      demo.pendingStimulations > 0 &&
      loadedCount >= 1 &&
      !window.terminalAP?.active
    ) {
      window.triggerTerminalAP?.({ releaseMode: "all" });
      demo.pendingStimulations -= 1;
      demo.completedCycles += 1;

      if (demo.completedCycles >= demo.maxCycles) {
        demo.phase = "ltd_wait";
        demo.pendingStimulations = 0;
      }
      updateLtpLtdButtonUI();
    }
    return;
  }

  if (demo.phase === "ltd_wait") {
    const plasticity = window.scaffoldAmpaPlasticity;
    if (plasticity?.targetMembrane === false) {
      demo.phase = "ltd";
      demo.ltdStartFrame = typeof frameCount === "number" ? frameCount : 0;
      updateLtpLtdButtonUI();
    }
    return;
  }

  if (demo.phase === "ltd") {
    const plasticity = window.scaffoldAmpaPlasticity;
    const returnedToScaffold =
      !!plasticity &&
      plasticity.targetMembrane === false &&
      (plasticity.move01 || 0) < 0.05;

    if (returnedToScaffold) {
      demo.enabled = false;
      demo.phase = "idle";
      demo.completedCycles = 0;
      demo.pendingStimulations = 0;
      demo.lastLoadedCount = getLoadedVesicleCount();
      demo.ltdStartFrame = -Infinity;
      updateLtpLtdButtonUI();
    }
  }
}

window.toggleLtpLtdDemo = toggleLtpLtdDemo;
window.updateLtpLtdButtonUI = updateLtpLtdButtonUI;


// =====================================================
// ENSURE VESICLE POOL EXISTS (ONE-TIME)
// =====================================================
function ensureVesiclePoolInitialized() {

  if (!Array.isArray(window.synapseVesicles)) {
    window.synapseVesicles = [];
    console.warn("🧪 synapseVesicles initialized");
  }

  const maxVes = window.SYNAPSE_MAX_VESICLES ?? 7;

  if (window.synapseVesicles.length === 0) {
    for (let i = 0; i < maxVes; i++) {
      window.requestNewEmptyVesicle?.();
    }
    console.log("🧪 reserve pool seeded:", window.synapseVesicles.length);
  }
}


// =====================================================
// MAIN VIEW ENTRY — CALLED FROM main.js
// =====================================================
function drawSynapseView() {
  updateLtpLtdButtonUI();

  push();
  resetMatrix();

  // ---------------------------------------------------
  // 🔒 FIXED-RATIO VIEWPORT CALCULATION
  // ---------------------------------------------------
  const fitFrameHeight = SYNAPSE_FRAME.height * SYNAPSE_VERTICAL_CROP;
  const sx = width  / SYNAPSE_FRAME.width;
  const sy = height / fitFrameHeight;
  const fitScale = min(sx, sy) * SYNAPSE_VIEWPORT_PADDING;

  const viewW = SYNAPSE_FRAME.width  * fitScale;
  const viewH = SYNAPSE_FRAME.height * fitScale;

  const viewX = (width  - viewW) / 2;
  const viewY = (height - viewH) / 2;

  // ---------------------------------------------------
  // 🔒 HARD CLIP (CANVAS-NATIVE)
  // ---------------------------------------------------
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(viewX, viewY, viewW, viewH);
  drawingContext.clip();

  // ---------------------------------------------------
  // CENTER + SCALE SYNAPSE WORLD
  // ---------------------------------------------------
  translate(viewX + viewW / 2, viewY + viewH / 2);
  scale(fitScale);


  // ===================================================
  // INPUT + ELECTRICAL
  // ===================================================
  handleSynapseInput();
  window.updateVoltageWave?.();

  ensureVesiclePoolInitialized();


  // ===================================================
  // UPDATE ORDER — PHYSICS FIRST, GEOMETRY LATER
  // ===================================================
  window.updateVesicleLoading?.();
  window.updateVesicleMotion?.();
  window.updateVesiclePools?.();
  window.updateVesicleRelease?.();
  window.updateVesicleRecycling?.();

  // NT emission + lifetime
  window.updateSynapticBurst?.();
  window.updateAstrocyteGpcrs?.();
  window.updatePSDReceptors?.();
  window.updatePostSynapticVoltageTrace?.();
  updateLtpLtdAutoStimulation();
  updateSynapseGuidedTutorial();


  strokeWeight(6);
  strokeJoin(ROUND);
  strokeCap(ROUND);


  // ===================================================
  // BACKGROUND GEOMETRY (NO NTs YET)
  // ===================================================

  // Astrocyte tissue mass (pure fill)
  window.drawAstrocyteSynapse?.();

  // 🔑 Astrocyte membrane (visual == physics)
  window.drawAstrocyteMembrane?.();
  window.drawAstrocyteUptakeChannels?.();
  window.drawAstrocyteGpcrs?.();
  window.drawAstrocyteMembraneWave?.();

  // Debug overlays (optional)
  if (window.SHOW_SYNAPSE_DEBUG) {
    window.drawAstrocyteBoundaryDebug?.();
    window.drawAstrocytePhysicsBoundaryDebug?.();
  }

      
  // ===================================================
  // 🔴 CLEFT CONSTRAINT DEBUG (PHYSICS TRUTH)
  // ===================================================
  if (window.SHOW_SYNAPSE_DEBUG) {
    window.drawSynapticCleftDebug?.();
  }





  // ===================================================
  // PRESYNAPTIC TERMINAL
  // ===================================================
  push();
  translate(PRE_X, NEURON_Y);

  if (
    typeof calibratePath === "function" &&
    typeof updateTerminalAP === "function" &&
    window.PRESYNAPTIC_AP_PATH
  ) {
    updateTerminalAP(
      calibratePath(window.PRESYNAPTIC_AP_PATH)
    );
  }

  window.drawPreSynapse?.();

  pop();


  // ===================================================
  // POSTSYNAPTIC TERMINAL
  // ===================================================
  push();
  translate(POST_X, NEURON_Y);

  window.drawPostSynapse?.();
  window.drawPostSynapseBoundaryDebug?.(); // cyan geometry reference

  pop();

  // Presynaptic membrane uptake channels (hotdog-bun pores)
  window.drawPresynapticUptakeChannels?.();

  // NTs render after neurons/receptors so binding structures stay visible.
  push();
  translate(PRE_X, NEURON_Y);
  window.drawSynapticBurst?.();
  pop();

  window.drawSynapsePostVoltageTrace?.();
  drawSynapseTutorialOverlay();


  // ---------------------------------------------------
  // RESTORE CLIP + STATE
  // ---------------------------------------------------
  drawingContext.restore();
  drawSynapseTutorialHUD(viewX, viewY, viewW);
  pop();
}


// =====================================================
// EXPORT
// =====================================================
window.drawSynapseView = drawSynapseView;
window.startSynapseGuidedTutorial = startSynapseGuidedTutorial;
window.stopSynapseGuidedTutorial = stopSynapseGuidedTutorial;
