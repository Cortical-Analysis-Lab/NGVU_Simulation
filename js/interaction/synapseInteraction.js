// =====================================================
// SYNAPSE INTERACTION (HOVER + SELECTION + FIRING)
// =====================================================
console.log("interaction loaded");

var hoverLock = null;

function increaseSynapseRadius(synapse) {
  if (!synapse) return;
  synapse.radius = constrain(synapse.radius + 2, 6, 30);
}

function decreaseSynapseRadius(synapse) {
  if (!synapse) return;
  synapse.radius = constrain(synapse.radius - 2, 6, 30);
}

// -----------------------------------------------------
// Convert screen → world coordinates
// -----------------------------------------------------
function getWorldPoint(x, y) {
  const rect = canvas.elt.getBoundingClientRect();

  const cx = x - rect.left;
  const cy = y - rect.top;

  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const worldScale = min(width / wf.width, height / wf.height) || 1;

  // Undo render pipeline: center -> worldScale -> camera zoom -> camera translate
  const wx =
    ((cx - width / 2) / worldScale) / camera.zoom + camera.x;
  const wy =
    ((cy - height / 2) / worldScale) / camera.zoom + camera.y;

  return { x: wx, y: wy };
}

// -----------------------------------------------------
// Hover detection
// -----------------------------------------------------
function updateSynapseHover() {
  if (window.mobileTouchUI) {
    if (Array.isArray(neuron?.synapses)) {
      neuron.synapses.forEach(s => {
        s.hovered = false;
      });
    }
    hoverLock = null;
    return;
  }
  if (!neuron || !neuron.synapses) return;

  const p = getWorldPoint(mouseX, mouseY);
  let nextHover = null;

  neuron.synapses.forEach(s => {
    const d = dist(p.x, p.y, s.x, s.y);
    const hit = d < s.radius + 22;

    if (hit) nextHover = s;
    s.hovered = hit;
  });

  hoverLock = nextHover;
  if (hoverLock) {
    hoverLock.hovered = true;
  }
}

// -----------------------------------------------------
// Mouse pressed
// -----------------------------------------------------
function mousePressed() {
  if (window.mobileTouchUI) return;
  if (!neuron || !Array.isArray(neuron.synapses)) return;
  const p = getWorldPoint(mouseX, mouseY);

  // ===================================================
    const multiSelect = keyIsDown(CONTROL) || keyIsDown(91); // Ctrl / Cmd

  neuron.synapses.forEach(s => {
    if (!s.hovered) return;

    // -----------------------------------
    // MULTI-SELECTION TOGGLE
    // -----------------------------------
    if (multiSelect) {
      s.selected = !s.selected;
      return;
    }

    // -----------------------------------
    // + / - SIZE CONTROLS
    // -----------------------------------
    const plusY = s.y - s.radius - 18;
    if (dist(p.x, p.y, s.x, plusY) < 16) {
      increaseSynapseRadius(s);
      return;
    }

    const minusY = s.y + s.radius + 18;
    if (dist(p.x, p.y, s.x, minusY) < 16) {
      decreaseSynapseRadius(s);
      return;
    }

    // -----------------------------------
    // SINGLE PSP
    // -----------------------------------
    if (dist(p.x, p.y, s.x, s.y) < s.radius) {
      spawnEPSP(s); // still valid alias
    }
  });
}

// -----------------------------------------------------
// Keyboard control
// -----------------------------------------------------
function keyPressed(evt) {
  if (window.mobileTouchUI) return true;
  // Allow browser/system shortcuts like Ctrl+Shift+R.
  if (evt?.ctrlKey || evt?.metaKey || evt?.altKey) return true;

  if (key === "d" || key === "D") {
    window.DEBUG_RENDER = !window.DEBUG_RENDER;
    return false;
  }

  if (key === "r" || key === "R") {
    window.SHOW_RECEPTOR_DEBUG = !window.SHOW_RECEPTOR_DEBUG;
    return false;
  }

  if (!neuron || !Array.isArray(neuron.synapses)) return;

  if (key === " ") {
    if (typeof state !== "undefined" && state.mode === "synapse") {
      return handleVoltageWaveKeyPressed?.(evt) || false;
    }

    evt?.preventDefault?.();
    evt?.stopPropagation?.();

    // Fire selected synapses (overview / ion modes)
    neuron.synapses.forEach(s => {
      if (s.selected) {
        spawnEPSP(s);
      }
    });

    return false;
  }

  // Clear selection
  if (keyCode === ESCAPE) {
    neuron.synapses.forEach(s => s.selected = false);
  }
}

window.increaseSynapseRadius = increaseSynapseRadius;
window.decreaseSynapseRadius = decreaseSynapseRadius;
