# Neuro-glial-vascular Unit (NGVU) Simulation

An interactive browser simulation of the neuro-glial-vascular unit: the linked behavior of neurons, astrocytes, synapses, extracellular ions, and local blood supply.

This project is designed to make that coupling visible at multiple scales. Instead of showing electrical signaling, synaptic transmission, or vascular support in isolation, it places them in the same system so users can follow how neural activity, glial responses, and metabolic delivery relate to one another.

## What This Simulation Shows

- Excitatory and inhibitory synaptic input shaping membrane potential
- Action potential initiation and axonal propagation
- Optional myelinated versus unmyelinated conduction
- Tripartite synapse behavior, including astrocyte participation
- Neurotransmitter release, receptor activation, and reuptake
- Extracellular sodium and potassium context
- Neurovascular support through oxygen, glucose, and blood-borne transport

The goal is not to be a full biophysical research model. It is a teaching and visualization tool that stays grounded in physiology while remaining readable and interactive.

## Views

### Neuron View
The main systems view. This is where the simulation ties together synaptic input, somatic integration, spike generation, downstream signaling, astrocyte responses, and vascular support in one scene.

### Synapse View
A focused micro-scale view of synaptic transmission. This view highlights vesicle loading, docking and fusion, cleft diffusion, AMPA/NMDA/GPCR signaling, astrocyte signaling, reuptake, and local metabolic support.

### Cortical Column
This is currently a dedicated placeholder view for a future mesoscopic scene. It is intended to become a larger-scale cortical context built around the same NGVU framework.

## Why The NGVU Framing Matters

The simulation is built around a simple but important idea: neurons do not operate alone.

- Neurons generate electrical signals and consume energy.
- Astrocytes detect and regulate local synaptic and metabolic conditions.
- Blood vessels supply oxygen, glucose, and fluid support.

Seen together, these components form a neuro-glial-vascular unit. That framing gives users a clearer picture of why signaling, support, and transport should be understood as a connected process rather than separate topics.

## Interaction Model

On desktop:
- Neuron view supports synapse selection, single-input release, grouped firing, myelin switching, and guided tutorials.
- Synapse view supports guided tutorials and an LTP/LTD demonstration.

On phones and tablets:
- The interface shifts into a guided-tutorial-first mode.
- Desktop-only hover and keyboard interactions are hidden so the mobile experience stays readable and reliable.

## Current Emphasis

This project emphasizes:
- simple visual explanations over exhaustive parameter exposure
- physiologically meaningful sequencing
- cross-scale linkage between electrical, chemical, glial, and vascular events

That balance is where most of its value comes from. Users can follow the logic of the system without needing to decode a dense modeling interface.

## Running The Project

For local viewing:
1. Open `index.html` in a browser, or serve the directory with a static server.
2. Use the top menu to switch between `Cortical Column`, `Neuron`, and `Synapse`.

For the production-style build:
1. Install `wasm-pack`.
2. Run `npm run build`.
3. Serve the generated `dist/` directory.

The WebAssembly source stays in this private repository under `wasm/`. The public deployment workflow publishes only the generated `dist/` output.

## Project Structure

- `js/main.js`: global state, mode switching, camera, and orchestration
- `js/views/Overview.js`: neuron view rendering
- `js/views/SynapseView.js`: synapse view rendering and tutorial flow
- `js/views/IonView.js`: cortical column placeholder view
- `js/signals`: electrical and coupling logic
- `js/synapse`: synapse geometry, dynamics, and receptor systems
- `js/geometry`: neurons, astrocytes, artery, and transport geometry
- `js/ions`: extracellular and activity-linked ion visualization
- `wasm/`: private Rust source compiled to WebAssembly for deployment
- `scripts/build-site.mjs`: assembles the deployable `dist/` folder
- `.github/workflows/deploy-public.yml`: builds and deploys `dist/` to the public `NGVU_Simulation` repo

## Status

The neuron and synapse views are the core of the current experience. The cortical column view is still under construction, but the simulation already demonstrates the central NGVU idea: neural activity is inseparable from glial regulation and vascular support.
