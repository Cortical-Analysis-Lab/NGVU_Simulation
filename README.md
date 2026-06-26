# [Neuro-glial-vascular Unit (NGVU) Simulation](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

An interactive, publicly accessible neuroscience simulator for exploring how neural signaling, synaptic activity, glial regulation, and vascular responses interact within a simplified neurovascular unit.

[Launch the simulator](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

The NGVU Simulation runs directly in the browser through GitHub Pages. No installation, setup, or local configuration is required. Open the link above, load the homepage, and choose a simulation view.

## Overview

The simulator is designed for education, exploration, and visual explanation of neuro-glial-vascular physiology. It opens on a homepage that guides users into three interactive simulation views: membrane-level neural signaling, synaptic transmission, and cortical tissue-scale vascular context.

Across those views, the simulation models processes such as:

- neuronal electrical activity, ion movement, and action-potential propagation
- synaptic vesicle release, neurotransmitter diffusion, receptor signaling, and reuptake
- astrocyte interactions at synapses and around local neural activity
- cortical layer organization with neurons, astrocytes, microglia, and microvascular structure
- vascular delivery of metabolic support molecules such as oxygen and glucose
- blood-brain barrier, endothelial, and pericyte features along vessel paths
- metabolic waste buildup, clearance, and pathology-associated disruption

Rather than presenting these systems in isolation, the simulator separates them into focused views while showing how electrical, chemical, glial, and vascular dynamics connect across the neuro-glial-vascular unit.

## Using the Simulator

To use the simulator:

1. Open the title link at the top of this document or the launch link above.
2. Use the homepage to choose `Neuron View`, `Synapse View`, or `Cortical Column View`.
3. In a new view, start with `Guided Tutorial` if you want a step-by-step introduction before using the interactive controls.
4. Use the view buttons or `View` menu to move between `Home`, `Cortical Column`, `Neuron`, and `Synapse`.
5. Open the collapsible `Instructions` tab inside each simulation view for view-specific controls and component notes.

The simulator runs entirely in the browser, allowing users to explore the model without downloading software or preparing a local environment. Controls change by view: `Blockables` appears for neuron and synapse mechanisms, `Pathologies` and `Display` filters apply to the cortical column, and the synapse view includes an `LTP/LTD` demonstration.

## Views

### Neuron View

This view focuses on neural signaling and membrane-level activity. It helps users follow how synaptic inputs shape neuronal behavior and how that activity connects to surrounding support systems.

Interactive concepts in this view include:

- excitatory and inhibitory synaptic integration at the soma and action-potential thresholding
- unmyelinated and myelinated axonal propagation, including saltatory conduction when myelin is enabled
- sodium and potassium movement during soma depolarization, potassium recovery, and axonal signaling
- arterial delivery of metabolic support molecules such as oxygen and glucose
- metabolic waste buildup, venous clearance, and recovery of normal firing after waste burden is reduced

When myelin is enabled, the axon displays myelin sheaths, nodes of Ranvier, and an oligodendrocyte maintaining the sheaths to illustrate the glial support cell responsible for myelination.

In Neuron View, each completed firing cycle can generate local metabolic byproducts around the soma, including `CO2` and `H+`. The `Clearance` toggle controls whether those waste products are swept toward the vein in repeating clearance waves or allowed to accumulate locally. When waste buildup becomes high enough, the neuron becomes harder to stimulate and may require repeated grouped EPSP input before it can fire again.

The `Blockables` menu in Neuron View includes:

- `Na+` - blocks soma sodium influx so no soma action potential is generated and the paired K+ efflux does not occur
- `ECS Ions` - reduces visible extracellular and fluxing Na+/K+ ions to about one third and makes larger excitatory input necessary to depolarize the soma and fire an action potential
- `O2` - reduces oxygen delivery from the artery and limits sustained action-potential generation after the first few spikes
- `Glucose` - reduces glucose delivery from the artery and limits sustained action-potential generation after the first few spikes
- `Clearance` - disables metabolic waste clearance so waste accumulates near the soma

### Synapse View

This view highlights local signaling at the synaptic scale, including transmitter release, diffusion, receptor activity, and nearby astrocyte involvement.

Interactive concepts in this view include:

- presynaptic action-potential arrival and calcium-dependent vesicle release
- neurotransmitter diffusion through the synaptic cleft
- AMPA, NMDA, and GPCR receptor signaling at the postsynaptic membrane
- neurotransmitter reuptake by neuronal and astrocytic transport mechanisms
- vesicle loading, docking, fusion, recycling, and metabolic support
- astrocyte Ca2+-dependent gliotransmitter release and neuron-glia feedback

The astrocyte elements show a tripartite synapse model: astrocytes do not only clear transmitter from the cleft, but can also sense nearby activity and feed back onto neurons through Ca2+-dependent gliotransmission.

The `Blockables` menu in Synapse View includes:

- `AMPA` - blocks AMPA receptor signaling and suppresses the fast postsynaptic excitatory response
- `Reuptake` - blocks neurotransmitter uptake so transmitter remains in the cleft longer
- `Na+` - blocks postsynaptic sodium channel activity and Na+ entry through active receptors
- `Ca2+` - blocks presynaptic calcium entry needed for vesicle release
- `SNARE` - blocks SNARE-dependent vesicle fusion at the active zone

The `LTP/LTD` toggle runs an automatic plasticity demonstration for comparing activity-dependent changes in synaptic strength.

### Cortical Column View

The cortical column view shows a layered cortical tissue model with neurons, astrocytes, microglia, a branching microvascular network, BBB/endothelial structures, traveling vascular molecules, action-potential activity, and metabolic waste clearance.

Interactive concepts in this view include:

- cortical depth organization with layer-associated neural and glial populations
- vascular branching from pial vessels into descending branches and capillary beds
- blood-brain barrier and pericyte details along the visible vessel envelope
- vascular delivery of oxygen and glucose through the microvascular network
- metabolic waste generation, clearance waves, and venous removal
- pathology-driven changes to neural activity, blood flow, clearance, BBB spacing, and microglial response

The `Pathologies` menu in Cortical Column View includes:

- `Insomnia` - slows and weakens metabolic waste clearance so waste burden builds over time. As waste accumulates, additional microglia appear incrementally in a capped, distributed pattern rather than clustering around every waste particle.
- `Epilepsy` - initiates a seizure-like event from a random neuron. A green action potential starts the event, followed by a circular shockwave that activates reached neurons and astrocytes. While the wave travels, blood flow slows, vascular molecule generation is reduced, waste clearance pauses, and vascular efflux increases where the wave reaches vessels. After the wave completes, microglia migrate inward and disperse through the cortical field while emitting shimmering inflammatory rings.
- `Stroke` - generates a red/yellow rock-like occlusion that travels through the main vessel and lodges near the middle capillary bed. Once lodged, it blocks molecule flow, action-potential propagation, and metabolic clearance in the affected pathway. When the pathology is unchecked, the occlusion breaks into slower fragments that drift out through the vascular network. After lodging, microglia move toward the affected capillary bed and reside around it.
- `Aging` - reduces neuron density, reduces capillary branching, increases BBB spacing gaps, increases microglia, reduces green action-potential activity, and reduces vascular molecule generation. Molecules continue to follow the remaining visible vascular paths, and all microglia shimmer to indicate inflammatory signaling.

Pathology-added or pathology-mobilized microglia emit small, bright shimmering rings representing neuroinflammatory molecule release.

The `Display` control can isolate cortical column content by showing all structures or focusing on neurons, glia, or vasculature.

## Intended Audience

The simulator is designed for:

- neuroscience students
- educators teaching neural signaling
- researchers demonstrating neurovascular coupling
- anyone interested in interactive neuroscience visualization

## License

This project is distributed under the license included in this repository. See [LICENSE](/workspaces/Neural_Signal_Simulation/LICENSE).

© Shaun James — Cortical Analysis Lab

The NGVU Simulation is an educational and research visualization tool developed by the Cortical Analysis Lab.
