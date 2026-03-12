// =====================================================
// SOMA MEMBRANE POTENTIAL + ACTION POTENTIAL MODEL
// =====================================================
console.log("🧠 soma loaded");

// -----------------------------------------------------
// 🧠 TEACHING / TIMING KNOBS (AXON ONLY)
// -----------------------------------------------------

// These NO LONGER affect Vm shape
const AP_DELAY_FRAMES       = 18;
const INVISIBLE_AP_OFFSET  = 14; // < AP_DELAY_FRAMES

// -----------------------------------------------------
// ACTION POTENTIAL PHASES (Vm ONLY)
// -----------------------------------------------------
const AP = {
  NONE: 0,
  UPSTROKE: 1,
  PEAK: 2,
  REPOLARIZE: 3,
  AHP: 4
};

// -----------------------------------------------------
// BIOPHYSICALLY INSPIRED PARAMETERS (Vm SHAPE)
// -----------------------------------------------------
const AP_PARAMS = {
  upstrokeRate: 5.8,       // base Na⁺ activation (accelerates post-threshold)
  peakHold: 8,             // wider rounded top
  repolRate: 4.8,          // K⁺ dominated decay
  ahpTarget: -78,
  ahpRate: 0.10,           // slower recovery
  refractoryFrames: 25
};

// -----------------------------------------------------
// SOMA STATE
// -----------------------------------------------------
const soma = {
  Vm: -65,
  VmDisplay: -65,
  rest: -65,
  threshold: -50,
  depolDrive: 0,           // pooled subthreshold depolarizing drive

  apState: AP.NONE,
  apTimer: 0,
  refractory: 0,

  // 🔑 TIMING (NO Vm EFFECT)
  delayCounter: 0,
  invisibleAPFired: false,
  visibleAPReleased: false,

  // One-shot K⁺ efflux gate per AP cycle
  kEffluxTriggered: false
};

// -----------------------------------------------------
// PSP ARRIVAL AT SOMA
// -----------------------------------------------------
function addEPSPToSoma(amplitude, type, sourceNeuron = 1) {

  if (type !== "exc" && sourceNeuron === 3) return;

  // Synapse radius UI spans ~6..30; preserve dynamic range across full slider.
  const normalized = constrain((amplitude - 6) / 24, 0, 1);
  const sizeScale = 0.50 + 3.40 * pow(normalized, 1.35);
  let deltaV;

  if (type === "exc") {
    // Stronger nonlinear scaling so larger synapses produce larger PSP impact.
    deltaV = (4 + 38 * pow(normalized, 2.0)) * sizeScale;
    if (normalized > 0.80) {
      deltaV += 28 * pow((normalized - 0.80) / 0.20, 1.25);
    }
  } else {
    deltaV = -(4 + 24 * pow(normalized, 1.3)) * sizeScale;
  }

  // Split PSP effect into:
  // 1) small immediate Vm shift
  // 2) brief depolarizing drive that ramps Vm toward threshold
  const immediateFrac = 0.10 + 0.08 * normalized;
  const immediateDelta = deltaV * immediateFrac;
  const driveDelta = deltaV - immediateDelta;

  if (
    type === "exc" &&
    soma.apState === AP.NONE &&
    soma.refractory <= 0
  ) {
    // Force a visible pre-threshold ramp: do not jump across threshold instantly.
    const preThresholdCeil = soma.threshold - 1.2;
    const nextVm = soma.Vm + immediateDelta;
    if (nextVm > preThresholdCeil) {
      const applied = preThresholdCeil - soma.Vm;
      soma.Vm += max(0, applied);
      soma.depolDrive += driveDelta + max(0, immediateDelta - max(0, applied));
    } else {
      soma.Vm = nextVm;
      soma.depolDrive += driveDelta;
    }
  } else {
    soma.Vm += immediateDelta;
    soma.depolDrive += driveDelta;
  }
}

// -----------------------------------------------------
// SOMA UPDATE (Vm + AXON TIMING DECOUPLED)
// -----------------------------------------------------
function updateSoma() {

  // ===================================================
  // AXON TIMING (INDEPENDENT OF Vm SHAPE)
  // ===================================================
  if (soma.delayCounter > 0) {
    soma.delayCounter++;

    if (
      !soma.invisibleAPFired &&
      soma.delayCounter >= INVISIBLE_AP_OFFSET
    ) {
      spawnInvisibleAxonAP?.();
      soma.invisibleAPFired = true;
    }

    if (
      !soma.visibleAPReleased &&
      soma.delayCounter >= AP_DELAY_FRAMES
    ) {
      spawnAxonSpike?.();
      soma.visibleAPReleased = true;
    }
  }

  // ===================================================
  // Vm PHYSIOLOGY
  // ===================================================
  switch (soma.apState) {

    // -------------------------------
    // REST / SUBTHRESHOLD
    // -------------------------------
    case AP.NONE:

      if (soma.refractory > 0) {
        soma.refractory--;
        soma.depolDrive *= 0.90;
        soma.Vm = lerp(soma.Vm, soma.rest, 0.18);
        break;
      }

      // Brief, gradual PSP-driven ramp toward threshold.
      if (soma.depolDrive > 0) {
        const toThresh = max(0, soma.threshold - soma.Vm);
        const thresholdEase = map(toThresh, 0, 20, 0.35, 1.0, true);
        const driveCap = map(
          soma.depolDrive,
          0, 90,
          0.5, 3.2,
          true
        );
        const rampStep = min(
          soma.depolDrive * 0.16,
          driveCap * thresholdEase
        );
        soma.Vm += rampStep;
        soma.depolDrive = max(0, soma.depolDrive - rampStep * 0.86);
      } else if (soma.depolDrive < 0) {
        const hyperStep = max(soma.depolDrive * 0.24, -2.8);
        soma.Vm += hyperStep;
        soma.depolDrive = min(0, soma.depolDrive - hyperStep * 0.82);
      } else {
        soma.depolDrive *= 0.94;
      }

      if (soma.Vm >= soma.threshold) {

        // 🔑 START AP IMMEDIATELY
        soma.apState = AP.UPSTROKE;

        // 🔑 START AXON DELAYS (NO Vm HOLD)
        soma.delayCounter = 1;
        soma.invisibleAPFired = false;
        soma.visibleAPReleased = false;
        soma.kEffluxTriggered = false;

        triggerNaInfluxNeuron1?.();
      }
      else {
        soma.Vm = lerp(soma.Vm, soma.rest, 0.035);
      }
      break;

    // -------------------------------
    // FAST DEPOLARIZATION
    // -------------------------------
    case AP.UPSTROKE:

      // Rapid post-threshold acceleration (Na-like positive feedback).
      const upstrokePhase = constrain(
        (soma.Vm - soma.threshold) / (40 - soma.threshold),
        0,
        1
      );
      const rapidGain = 1 + 2.0 * upstrokePhase * upstrokePhase;
      soma.Vm += AP_PARAMS.upstrokeRate * rapidGain;

      if (soma.Vm >= 40) {
        soma.Vm = 40;
        soma.apState = AP.PEAK;
        soma.apTimer = AP_PARAMS.peakHold;

        window.neuron1Fired = true;
        window.lastNeuron1SpikeTime = state.time;

        logEvent?.(
          "neural",
          "Action potential generated at the soma",
          "soma"
        );
      }
      break;

    // -------------------------------
    // ROUNDED PEAK
    // -------------------------------
    case AP.PEAK:

      // Gentle dome-shaped top before repolarization.
      const tPeak = map(
        soma.apTimer,
        AP_PARAMS.peakHold,
        0,
        0,
        1,
        true
      );
      const rounded = tPeak * tPeak;
      soma.Vm = lerp(40, 34, rounded);

      soma.apTimer--;
      if (soma.apTimer <= 0) {
        soma.apState = AP.REPOLARIZE;

        // K⁺ efflux follows Na⁺ influx as repolarization begins.
        if (!soma.kEffluxTriggered) {
          triggerKEffluxNeuron1?.();
          soma.kEffluxTriggered = true;
        }
      }
      break;

    // -------------------------------
    // REPOLARIZATION
    // -------------------------------
    case AP.REPOLARIZE:

      soma.Vm -= AP_PARAMS.repolRate;

      if (soma.Vm <= soma.rest) {
        soma.apState = AP.AHP;
      }
      break;

    // -------------------------------
    // AFTER-HYPERPOLARIZATION
    // -------------------------------
    case AP.AHP:

      soma.Vm = lerp(soma.Vm, AP_PARAMS.ahpTarget, AP_PARAMS.ahpRate);

      if (abs(soma.Vm - AP_PARAMS.ahpTarget) < 0.5) {
        soma.apState = AP.NONE;
        soma.refractory = AP_PARAMS.refractoryFrames;
        soma.kEffluxTriggered = false;
      }
      break;
  }

  // ---------------------------------------------------
  // DISPLAY SMOOTHING ONLY (VISUAL)
  // ---------------------------------------------------
  soma.VmDisplay = lerp(soma.VmDisplay, soma.Vm, 0.25);
}

// =====================================================
// EXPORTS
// =====================================================
window.updateSoma     = updateSoma;
window.addEPSPToSoma = addEPSPToSoma;
