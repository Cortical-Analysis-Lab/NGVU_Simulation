// =====================================================
// EVENT LOG — METABOLIC SUMMARY (MULTI-LINE POPUP)
// =====================================================
console.log("🧾 eventLog.js loaded (metabolic summary, 3–5 lines)");

// -----------------------------------------------------
// Configuration
// -----------------------------------------------------
const MAX_SUMMARY_LINES = 5;    // visible lines
const DECAY_RATE = 0.985;

// -----------------------------------------------------
// Semantic colors
// -----------------------------------------------------
const EVENT_COLORS = {
  low:      "#b0b0b0", // baseline
  neural:   "#ffd966", // elevated neural demand
  vascular: "#ff6f6f", // increased vascular supply
  glial:    "#b58cff"  // astrocytic coordination
};

// -----------------------------------------------------
// Window state (visibility only)
// -----------------------------------------------------
let isLogOpen = false;

// -----------------------------------------------------
// Internal metabolic accumulators
// -----------------------------------------------------
const metabolicState = {
  neuralDemand: 0,
  vascularSupply: 0,
  glialActivity: 0
};

// -----------------------------------------------------
// Rolling summary buffer (DISPLAYED CONTENT)
// -----------------------------------------------------
const summaryLog = [];

// -----------------------------------------------------
// Public: accumulate low-level events ONLY
// -----------------------------------------------------
function logEvent(type) {
  switch (type) {
    case "neural":
      metabolicState.neuralDemand += 1;
      break;

    case "vascular":
      metabolicState.vascularSupply += 1;
      break;

    case "glial":
      metabolicState.glialActivity += 1;
      break;
  }
}

// -----------------------------------------------------
// Internal: decay toward baseline
// -----------------------------------------------------
function decayMetabolicState() {
  metabolicState.neuralDemand   *= DECAY_RATE;
  metabolicState.vascularSupply *= DECAY_RATE;
  metabolicState.glialActivity  *= DECAY_RATE;
}

// -----------------------------------------------------
// Internal: generate ONE meaningful sentence
// -----------------------------------------------------
function generateMetabolicSummary() {
  const n = metabolicState.neuralDemand;
  const v = metabolicState.vascularSupply;
  const g = metabolicState.glialActivity;

  if (n < 0.3 && v < 0.3 && g < 0.3) {
    return { text: "Baseline metabolic activity", color: EVENT_COLORS.low };
  }

  if (n > 1.5 && v < n * 0.7) {
    return { text: "Elevated neural metabolic demand", color: EVENT_COLORS.neural };
  }

  if (v > n && v > 1.0) {
    return { text: "Neurovascular coupling increasing metabolic supply", color: EVENT_COLORS.vascular };
  }

  if (g > 0.8) {
    return { text: "Astrocytes coordinating metabolic support", color: EVENT_COLORS.glial };
  }

  return {
    text: "Metabolic activity adapting to neural demand",
    color: EVENT_COLORS.neural
  };
}

// -----------------------------------------------------
// Public: draw MULTI-LINE summary popup
// -----------------------------------------------------
function drawEventLog() {
  const container = document.getElementById("event-log");
  if (!container) return;

  // Visibility is controlled HERE (not by logging)
  if (!isLogOpen) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");

  // Update metabolic state
  decayMetabolicState();
  const summary = generateMetabolicSummary();

  // Prevent duplicate consecutive lines
  const last = summaryLog[summaryLog.length - 1];
  if (!last || last.text !== summary.text) {
    summaryLog.push(summary);

    if (summaryLog.length > MAX_SUMMARY_LINES) {
      summaryLog.shift();
    }
  }

  // Render popup content
  container.innerHTML = `
    <div class="event-window">
      <div class="event-title">Metabolic Status</div>
      ${summaryLog.map(s => `
        <div class="event-line" style="color:${s.color}">
          • ${s.text}
        </div>
      `).join("")}
    </div>
  `;

  container.scrollTop = container.scrollHeight;
}

// -----------------------------------------------------
// Public: toggle popup window (called from main.js)
// -----------------------------------------------------
function setEventLogOpen(open) {
  isLogOpen = open;
}

// -----------------------------------------------------
// Optional: highlight overlay renderer (SAFE)
// -----------------------------------------------------
function drawHighlightOverlay() {
  if (typeof state === "undefined") return;

  push();
  noFill();
  strokeWeight(3);

  if (window.highlightSomaUntil > state.time) {
    stroke("#ffd966");
    ellipse(0, 0, 110, 110);
  }

  pop();
}

// -----------------------------------------------------
// Public API (SINGLE SOURCE OF TRUTH)
// -----------------------------------------------------
window.logEvent         = logEvent;
window.drawEventLog     = drawEventLog;
window.setEventLogOpen  = setEventLogOpen;
window.drawHighlightOverlay = drawHighlightOverlay;
