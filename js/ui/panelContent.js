// =====================================================
// MODE-DEPENDENT PANEL CONTENT
// =====================================================
console.log("📘 panelContent.js loaded");

// -----------------------------------------------------
// Public API
// -----------------------------------------------------
window.updateUIPanelContent = updateUIPanelContent;

// -----------------------------------------------------
// Main dispatcher
// -----------------------------------------------------
function updateUIPanelContent(modeOverride) {
  const mode =
    modeOverride ||
    (typeof state !== "undefined" ? state.mode : "overview");

  updateInstructionsPanel(mode);
}

// =====================================================
// INSTRUCTIONS PANEL
// =====================================================
function updateInstructionsPanel(mode) {
  const el = document.getElementById("instructions-content");
  if (!el) return;
  const mobileTouchUI = !!window.mobileTouchUI;

  switch (mode) {

    // =================================================
    // OVERVIEW MODE
    // =================================================
    case "overview":
      el.innerHTML = mobileTouchUI ? `
        <h2>Neuron Simulator</h2>

        <p><strong>Touch device mode</strong></p>
        <ul>
          <li>This device uses a guided-tutorial-first interface</li>
          <li>Use <b>Guided Tutorial</b> to walk through neuron signaling step by step</li>
          <li>Desktop-only hover, keyboard, and synapse editing controls are hidden on touch devices</li>
        </ul>

        <hr />

        <p><strong>Synapse types</strong></p>
        <ul>
          <li><span class="exc">Green</span> = excitatory (EPSP)</li>
          <li><span class="inh">Red</span> = inhibitory (IPSP)</li>
        </ul>
      ` : `
        <h2>Neuron Simulator</h2>

        <p><strong>View controls</strong></p>
        <ul>
          <li>Use <b>Myelin</b> to switch between unmyelinated and myelinated axon conduction</li>
          <li>Use <b>Guided Tutorial</b> for a step-by-step walkthrough of the neuron view</li>
        </ul>

        <hr />

        <p><strong>Synapse types</strong></p>
        <ul>
          <li><span class="exc">Green</span> = excitatory (EPSP)</li>
          <li><span class="inh">Red</span> = inhibitory (IPSP)</li>
        </ul>

        <hr />

        <p><b>Single synapse controls</b></p>
        <ul>
          <li>Hover over a synapse to reveal controls</li>
          <li>➕ / ➖ adjust synaptic strength</li>
          <li>Click a synapse to release neurotransmitter</li>
        </ul>

        <hr />

        <p><b>Group firing</b></p>
        <ul>
          <li>Hold <b>Control</b> and click synapses to select them</li>
          <li>Selected synapses are highlighted</li>
          <li>Press <b>Space</b> to fire all selected synapses together</li>
        </ul>
      `;
      break;

    // =================================================
    // BRAIN VIEW (ION MODE KEY)
    // =================================================
    case "ion":
      el.innerHTML = `
        <h2>Cortical Column</h2>

        <p>
          This view is being built as a dedicated cortical column scene.
        </p>

        <ul>
          <li>The column-scale environment will live in its own renderer</li>
          <li>Neurons, glia, and vasculature will be staged at mesoscopic scale</li>
          <li>The current screen is a construction placeholder</li>
        </ul>

        <p class="hint">
          Return to Neuron or Synapse view while this scene is under development.
        </p>
      `;
      break;

    // =================================================
    // SYNAPSE VIEW
    // =================================================
    case "synapse":
      el.innerHTML = mobileTouchUI ? `
        <h2>Synapse View</h2>

        <p>
          This touch-device mode is optimized for the guided synapse walkthrough.
        </p>

        <ul>
          <li>Use <b>Guided Tutorial</b> to step through vesicle loading, release, receptors, astrocytes, reuptake, and metabolic support</li>
          <li>Desktop-only manual stimulation and plasticity controls are hidden on touch devices</li>
          <li>Switch between views using the top menu as needed</li>
        </ul>
      ` : `
        <h2>Synapse View</h2>

        <p>
          This view focuses on presynaptic release, cleft diffusion, postsynaptic receptor signaling, and astrocyte participation at a tripartite synapse.
        </p>

        <p><strong>View controls</strong></p>
        <ul>
          <li>Use <b>Guided Tutorial</b> for a step-by-step walkthrough of synaptic transmission</li>
          <li>Use <b>LTP/LTD</b> to run the automatic plasticity demonstration</li>
          <li>Press <b>Space</b> to manually trigger terminal activity</li>
        </ul>

        <hr />

        <p><strong>What to look for</strong></p>
        <ul>
          <li>Vesicles load, dock, and fuse at the presynaptic active zone</li>
          <li>Neurotransmitter diffuses through the cleft toward receptors and uptake sites</li>
          <li>AMPA, NMDA, and GPCR pathways show distinct postsynaptic effects</li>
          <li>Astrocytes participate through receptor signaling, Ca2+ release, and reuptake</li>
        </ul>

        <p class="hint">
          The guided tutorial is the clearest way to follow vesicle loading, Ca2+ entry, receptor activation, reuptake, and metabolic support in sequence.
        </p>
      `;
      break;
  }
}
