# [Interactive Virtual NGVU Lab](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

A browser-based virtual neuroscience laboratory for exploring how neural signaling, synaptic activity, glial regulation, metabolism, and vascular responses interact within the neuro-glial-vascular unit (NGVU).

[Launch the Interactive Virtual NGVU Lab](https://cortical-analysis-lab.github.io/NGVU_Simulation/)

The lab runs directly in the browser through GitHub Pages. No installation, setup, or local configuration is required. Open the link above and choose an experimental workspace from the homepage.

## Virtual Lab Overview

The Interactive Virtual NGVU Lab supports education, guided investigation, and visual explanation of neuro-glial-vascular physiology. Its three experimental workspaces provide complementary recording scales: membrane-level neuronal signaling, local synaptic transmission, and cortical tissue-scale neural, glial, and vascular activity.

Experiments run on a simplified educational model that includes processes such as:

- neuronal electrical activity, ion movement, and action-potential propagation
- synaptic vesicle release, neurotransmitter diffusion, receptor signaling, and reuptake
- astrocyte interactions at synapses and around local neural activity
- cortical layer organization with neurons, astrocytes, microglia, and microvascular structure
- vascular delivery of metabolic support molecules such as oxygen and glucose
- blood-brain barrier, endothelial, and pericyte features along vessel paths
- metabolic waste buildup, clearance, and pathology-associated disruption

Rather than presenting these systems in isolation, the virtual lab separates them into focused workspaces while showing how electrical, chemical, glial, metabolic, and vascular dynamics connect across the NGVU.

## Working in the Virtual Lab

To begin an investigation:

1. Open the title link or the launch link above.
2. Choose the `Neuron`, `Synapse`, or `Cortical Column` workspace for the recording scale you want to investigate.
3. Start `Guided Tutorial` for a guided introduction to the workspace and its physiology.
4. Apply experimental manipulations through `Blockables`, `Pathologies`, display filters, or the `LTP/LTD` demonstration where available.
5. Use virtual electrodes, plots, trace histories, measurements, and exports to observe and document the response.
6. Open the collapsible `Instructions` tab for workspace-specific controls and component notes.

The lab runs entirely in the browser. Tools change by workspace: `Blockables` manipulates neuron and synapse mechanisms, `Pathologies` and `Display` filters apply to the cortical column, and the Synapse workspace includes an `LTP/LTD` demonstration.

## Virtual Lab Tools

- **Stimulation:** Use `Fire AP`, synaptic activity controls, and guided demonstrations to initiate modeled neural events.
- **Virtual electrodes:** Place cellular or extracellular recording electrodes to sample activity at selected locations.
- **Plots and trace histories:** Examine membrane-voltage, postsynaptic, and local field potential recordings across repeated trials.
- **A/B measurements:** Select two plot coordinates to compare amplitude and time differences within a recorded trace.
- **Experimental manipulations:** Apply channel, receptor, transporter, metabolic, clearance, plasticity, and pathology conditions through `Blockables`, `LTP/LTD`, and `Pathologies`.
- **Trace export:** Select recorded traces and export plots, markers, coordinate calculations, and active manipulation labels to PDF.

## Experimental Workspaces

### Neuron View

This view focuses on neural signaling and membrane-level activity. It helps users follow how synaptic inputs shape neuronal behavior and how that activity connects to surrounding support systems.

Interactive concepts in this view include:

- excitatory and inhibitory synaptic integration at the soma and action-potential thresholding
- unmyelinated and myelinated axonal propagation, including saltatory conduction when myelin is enabled
- sodium and potassium movement during soma depolarization, potassium recovery, and axonal signaling
- arterial delivery of metabolic support molecules such as oxygen and glucose
- metabolic waste buildup, venous clearance, and recovery of normal firing after waste burden is reduced

When myelin is enabled, the axon displays myelin sheaths, nodes of Ranvier, and an oligodendrocyte maintaining the sheaths to illustrate the glial support cell responsible for myelination.

The `Trace Readout` button beneath the membrane-voltage plot opens a Neuron-specific, scrollable history. Action potentials are stored automatically once they reach the center of the rolling Vm display. EPSP and IPSP arrivals are instead grouped into five-second PSP activity recordings. Saved plots support two-point inspection and preserve the Blockables active during capture. Users can select individual traces and export a PDF containing an image of each selected title, plot, marker, and coordinate calculation.

The `Electrode` toggle enables a virtual cellular electrode in Neuron View. The pointer becomes a translucent white recording circle. Every electrode placement starts the same primary-neuron activity chain as `Fire AP`; it does not directly stimulate the selected structure. Placement determines whether the trace represents somatic, dendritic, axonal, extracellular, or astrocytic activity. Electrode plots support two-point inspection, preserve active Blockables, and provide the same selected-trace PDF export. Automatic Trace Readout capture is paused while Electrode mode is active.

In Neuron View, each completed firing cycle can generate local metabolic byproducts around the soma, including `CO2` and `H+`. The `Clearance` toggle controls whether those waste products are swept toward the vein in repeating clearance waves or allowed to accumulate locally. When waste buildup becomes high enough, the neuron becomes harder to stimulate and may require repeated grouped EPSP input before it can fire again.

The `Blockables` menu in Neuron View includes:

- `Na+ channels` - blocks soma sodium influx so no soma action potential is generated and the paired K+ efflux does not occur
- `K+ channels` - blocks K+ efflux and normal neural repolarization; Vm briefly plateaus at the AP peak and then declines slowly through Na+/K+ pump-mediated recovery. `Fire AP` remains usable during the prolonged decay while the Na+ gradient can support another spike. Repeated spikes consume that gradient and produce progressively smaller peaks until pump recovery restores firing capacity.
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

The `Trace Readout` button beneath the postsynaptic plot opens a separate Synapse-specific history. Postsynaptic responses are collected into five-second synaptic-activity recordings rather than generating one saved trace per response. Saved plots support two-point inspection, active-Blockables labels, and selected-trace PDF export.

The `Blockables` menu in Synapse View includes:

- `AMPA` - blocks AMPA receptor signaling and suppresses the fast postsynaptic excitatory response
- `Reuptake` - blocks neurotransmitter uptake so transmitter remains in the cleft longer
- `Na+` - blocks postsynaptic sodium channel activity and Na+ entry through active receptors
- `Ca2+` - blocks presynaptic calcium entry needed for vesicle release
- `SNARE` - blocks SNARE-dependent vesicle fusion at the active zone

The `LTP/LTD` toggle runs an automatic plasticity demonstration for comparing activity-dependent changes in synaptic strength.

### Cortical Column View

The cortical column view shows a layered cortical tissue model with neurons, astrocytes, microglia, a branching microvascular network, BBB/endothelial structures, traveling vascular molecules, action-potential activity, and metabolic waste clearance.

In Cortical Column View, the `Electrode` toggle enables local field potential recording. Clicking anywhere inside the column places the electrode and begins a five-second trace, including clicks over vascular or BBB graphics because the measurement is based on nearby AP propagation rather than the selected structure. A temporary circle shows the 0.115 mm pickup radius. Traveling action potentials contribute according to their distance within that radius, so electrode placement can produce a single deflection or a compound trace from several nearby signals. New traces are added to the top of the same scrollable history. The pop-out closes when switching views or toggling the function, and unchecking the toggle exits placement mode.

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

The Interactive Virtual NGVU Lab is designed for:

- neuroscience students using guided tutorials to explore modeled physiology
- educators teaching neural signaling, synaptic physiology, and neurovascular coupling
- researchers and science communicators demonstrating NGVU concepts
- independent learners interested in interactive neuroscience investigation

## License

This project is distributed under the license included in this repository. See [LICENSE](/workspaces/Neural_Signal_Simulation/LICENSE).

© Shaun James — Cortical Analysis Lab

The Interactive Virtual NGVU Lab is an educational investigation and visualization environment developed by the Cortical Analysis Lab. Its experiments use a simplified model intended to make relationships across neuronal, glial, metabolic, and vascular physiology visible and testable.
