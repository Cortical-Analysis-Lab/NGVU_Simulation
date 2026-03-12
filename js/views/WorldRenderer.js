// =====================================================
// OVERVIEW WORLD RENDER PIPELINE (LAYERED)
// =====================================================
console.log("world renderer loaded");

function renderBackgroundLayer() {
  drawBackgroundIons();
  drawSomaIons();
  drawAxonIons();

  if (window.myelinEnabled) {
    drawNodeIons();
  }
}

function renderVasculatureLayer() {
  drawArtery();
}

function renderMoleculesLayer() {
  if (!window.educationalMoleculesEnabled) return;
  drawMolecules();
}

function renderNeuronsLayer() {
  drawOverview(state);
}

function renderReceptorsLayer() {
  if (typeof drawOverviewReceptors === "function") {
    drawOverviewReceptors();
  }
}

function renderLabelsLayer() {
  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const left = -wf.width * 0.5;
  const top = -wf.height * 0.5;

  push();
  fill(215, 226, 241, 215);
  noStroke();
  textSize(13);
  textAlign(LEFT, TOP);
  text("Artery -> Molecule Flow -> Neural Environment", left + 18, top + 18);
  pop();
}

function renderDebugLayer() {
  if (!window.DEBUG_RENDER) return;

  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const stats = typeof getMoleculeStats === "function"
    ? getMoleculeStats()
    : { active: 0, pooled: 0 };

  push();
  noFill();
  stroke(255, 210, 90, 220);
  strokeWeight(2);

  if (typeof getArteryEmissionPoint === "function") {
    const emission = getArteryEmissionPoint();
    if (emission) {
      circle(emission.x, emission.y, 36);
      line(emission.x - 18, emission.y, emission.x + 18, emission.y);
    }
  }

  stroke(120, 255, 160, 220);
  circle(neuron.x, neuron.y, neuron.somaRadius * 2.6);
  circle(neuron2.soma.x, neuron2.soma.y, neuron2.somaRadius * 2.6);
  circle(neuron3.soma.x, neuron3.soma.y, neuron3.somaRadius * 2.6);

  noStroke();
  fill(255, 245, 198, 230);
  textSize(12);
  textAlign(LEFT, TOP);
  text(
    `DEBUG active molecules: ${stats.active} | pooled: ${stats.pooled}`,
    -wf.width * 0.5 + 20,
    wf.height * 0.5 - 42
  );
  pop();
}

const renderLayers = [
  renderBackgroundLayer,
  renderVasculatureLayer,
  renderNeuronsLayer,
  renderReceptorsLayer,
  renderMoleculesLayer,
  renderLabelsLayer
];

function renderWorld(ctx) {
  for (const layer of renderLayers) {
    layer(ctx);
  }
  renderDebugLayer(ctx);
}

window.renderWorld = renderWorld;
