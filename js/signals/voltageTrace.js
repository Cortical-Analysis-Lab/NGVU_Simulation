// =====================================================
// VOLTAGE TRACE — LIVE SOMA Vm (BIOLOGICAL STYLE)
// =====================================================
console.log("voltageTrace loaded");

// -----------------------------------------------------
// Configuration
// -----------------------------------------------------
const VM_TRACE_LENGTH = 220;
const VM_MIN = -80;
const VM_MAX = 45;
const POST_VM_REST = -68;
const POST_VM_SOFT_THRESHOLD = -50;

// -----------------------------------------------------
// Internal buffer
// -----------------------------------------------------
const vmTrace = [];
const postVmTrace = [];
let postVm = POST_VM_REST;
let postVmDrive = 0;

// -----------------------------------------------------
// Update buffer
// -----------------------------------------------------
function updateVoltageTrace() {
  if (typeof soma === "undefined") return;

  // Trace uses the same physiological Vm state that drives AP logic.
  vmTrace.push(soma.Vm);
  if (vmTrace.length > VM_TRACE_LENGTH) {
    vmTrace.shift();
  }
}

function triggerPostSynapticEPSPTrace(kind = "ampa") {
  const driveStep = kind === "nmda"
    ? 6.2
    : (kind === "gpcr" ? 5.4 : 4.8);
  postVmDrive = constrain(postVmDrive + driveStep, 0, 34);
}

function updatePostSynapticVoltageTrace() {
  postVmDrive *= 0.9;
  postVm = lerp(postVm, POST_VM_REST, 0.055);
  postVm += postVmDrive * 0.18;

  // Keep this synapse-level trace subthreshold by design.
  const epspCap = POST_VM_SOFT_THRESHOLD - 0.6;
  if (postVm > epspCap) {
    postVm = epspCap;
  }

  postVmTrace.push(postVm);
  if (postVmTrace.length > VM_TRACE_LENGTH) {
    postVmTrace.shift();
  }
}

// -----------------------------------------------------
// Draw trace (world-space, near soma)
// -----------------------------------------------------
function drawVoltageTrace() {

  if (vmTrace.length < 2) return;

  push();
  drawTracePanel(vmTrace, {
    x0: neuron.somaRadius * 0.6,
    y0: neuron.somaRadius + 50,
    traceWidth: 200,
    traceHeight: 85,
    thresholdValue: soma.threshold,
    thresholdLabel: "threshold",
    panelLabel: "Membrane potential (Vm)"
  });

  pop();
}

function drawTracePanel(trace, config = {}) {
  if (!Array.isArray(trace) || trace.length < 2) return;

  const x0 = config.x0 ?? 0;
  const y0 = config.y0 ?? 0;
  const traceWidth = config.traceWidth ?? 200;
  const traceHeight = config.traceHeight ?? 85;
  const thresholdValue = config.thresholdValue ?? soma.threshold;
  const thresholdLabel = config.thresholdLabel ?? "threshold";
  const panelLabel = config.panelLabel ?? "Membrane potential (Vm)";
  const tickTextSize = config.tickTextSize ?? 9;
  const thresholdTextSize = config.thresholdTextSize ?? 9;
  const labelTextSize = config.labelTextSize ?? 11;

  stroke(180, 120);
  strokeWeight(1);
  line(x0, y0, x0, y0 + traceHeight);

  const ticks = [-70, -55, 0, 40];
  noStroke();
  fill(180);
  textSize(tickTextSize);
  textAlign(RIGHT, CENTER);
  ticks.forEach(v => {
    const y = map(v, VM_MIN, VM_MAX, y0 + traceHeight, y0);
    text(v, x0 - 4, y);
  });

  push();
  translate(x0 - 22, y0 + traceHeight / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("mV", 0, 0);
  pop();

  const yThresh = map(
    thresholdValue,
    VM_MIN,
    VM_MAX,
    y0 + traceHeight,
    y0
  );
  stroke(255);
  strokeWeight(1);
  line(x0, yThresh, x0 + traceWidth, yThresh);

  noStroke();
  fill(255);
  textSize(thresholdTextSize);
  textAlign(LEFT, CENTER);
  text(thresholdLabel, x0 + traceWidth + 4, yThresh);

  noFill();
  stroke(90, 170, 255);
  strokeWeight(2.5);
  strokeJoin(ROUND);
  strokeCap(ROUND);
  beginShape();
  for (let i = 0; i < trace.length; i++) {
    const x = map(i, 0, VM_TRACE_LENGTH - 1, x0, x0 + traceWidth);
    const y = map(trace[i], VM_MIN, VM_MAX, y0 + traceHeight, y0);
    vertex(x, y);
  }
  endShape();

  noStroke();
  fill(200);
  textSize(labelTextSize);
  textAlign(LEFT, TOP);
  text(panelLabel, x0, y0 + traceHeight + 6);
}

function drawSynapsePostVoltageTrace() {
  push();
  drawTracePanel(postVmTrace, {
    x0: 300,
    y0: -122,
    traceWidth: 95,
    traceHeight: 43,
    thresholdValue: POST_VM_SOFT_THRESHOLD,
    thresholdLabel: "AP threshold",
    panelLabel: "Postsynaptic Vm (EPSP only)",
    tickTextSize: 7,
    thresholdTextSize: 6,
    labelTextSize: 8
  });
  pop();
}

window.updatePostSynapticVoltageTrace = updatePostSynapticVoltageTrace;
window.drawSynapsePostVoltageTrace = drawSynapsePostVoltageTrace;
window.triggerPostSynapticEPSPTrace = triggerPostSynapticEPSPTrace;
