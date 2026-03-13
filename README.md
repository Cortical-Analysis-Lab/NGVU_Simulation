# [Neuro-glial-vascular Unit (NGVU) Simulation](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

An interactive, publicly accessible neuroscience simulator for exploring how neural signaling, synaptic activity, glial regulation, and vascular responses interact within a simplified neurovascular unit.

[Launch the simulator](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

The NGVU Simulation runs directly in the browser through GitHub Pages. No installation, setup, or local configuration is required. Open the link above, load the simulator, and begin exploring the visualization.

## Overview

The simulator is designed for education, exploration, and visual explanation of neuroscience concepts. It brings multiple biological processes into one interactive environment so users can see how they influence one another over time.

The simulation models processes such as:

- neuronal electrical activity
- synaptic transmission
- neurotransmitter diffusion
- ion movement
- astrocyte interactions
- vascular and hemodynamic responses
- metabolic waste buildup and clearance

Rather than presenting these systems in isolation, the simulator shows how electrical, chemical, glial, and vascular dynamics connect inside a single neuro-glial-vascular unit.

## Using the Simulator

To use the simulator:

1. Open the title link at the top of this document or the launch link above.
2. Wait for the page to load in your browser.
3. Interact with the visualization and switch between the available simulation views.

The simulator runs entirely in the browser, allowing users to explore the model without downloading software or preparing a local environment.

## Interactive Concepts Included

- excitatory and inhibitory synaptic integration at the soma
- action-potential initiation and propagation in unmyelinated and myelinated axons
- astrocyte support at synapses and around local neural activity
- arterial delivery of metabolic support molecules such as oxygen and glucose
- venous clearance of metabolic waste products
- waste accumulation around the soma when clearance is paused
- recovery of normal firing after clearance waves reduce local waste burden

## Views

### Neuron View

This view focuses on neural signaling and membrane-level activity. It helps users follow how synaptic inputs shape neuronal behavior and how that activity connects to surrounding support systems.

In the current overview scene, each completed firing cycle can generate local metabolic byproducts around the soma, including `CO2` and `H+`. The `Clearance` toggle controls whether those waste products are swept toward the vein in repeating clearance waves or allowed to accumulate locally. When waste buildup becomes high enough, the neuron becomes harder to stimulate and may require repeated grouped EPSP input before it can fire again.

### Synapse View

This view highlights local signaling at the synaptic scale, including transmitter release, diffusion, receptor activity, and nearby astrocyte involvement.

### Cortical Column View

This view provides a larger-scale context for the simulation and supports exploration of how local signaling fits into a broader cortical setting.

## What This Repository Contains

This repository contains the files required to run the public web simulator:

- `index.html` - main entry point for the simulator
- `css/` - styles for the interface
- `js/` - simulation logic and rendering code
- `wasm/` - WebAssembly modules used for performance
- `README.md` - project overview and usage
- `LICENSE` - open source license

## Intended Audience

The simulator is designed for:

- neuroscience students
- educators teaching neural signaling
- researchers demonstrating neurovascular coupling
- anyone interested in interactive neuroscience visualization

## License

This project is distributed under the license included in this repository. See [LICENSE](/workspaces/Neural_Signal_Simulation/LICENSE).
