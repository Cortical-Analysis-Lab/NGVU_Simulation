// =====================================================
// OVERVIEW VIEW — BIOLOGICAL, CLEAN, POLARIZED (3D)
// =====================================================
console.log("overview view loaded");

const LIGHT_DIR = { x: -0.6, y: -0.8 };

// =====================================================
// MAIN OVERVIEW
// =====================================================
function drawOverview(state) {

  drawNeuron1();
  drawNeuron2();
  drawNeuron3();
  drawAstrocyte();


  drawVoltageTrace();
  drawEPSPs();
  drawAxonSpikes();
  drawVesicles();
  drawNeuron2EPSPs();
}

// =====================================================
// ORGANIC DENDRITE RENDERER (TRUNK → BRANCH → TWIG)
// =====================================================
function drawOrganicBranch(branch, baseColor) {

  if (!branch || branch.length < 2) return;

  // ---- MAIN BODY ----
  noFill();
  stroke(baseColor);

  beginShape();

  // Duplicate first point (required for curveVertex)
  curveVertex(branch[0].x, branch[0].y);

  branch.forEach((p, i) => {
    const t = i / (branch.length - 1);
    strokeWeight(lerp(p.r * 2.6, p.r * 1.0, t));
    curveVertex(p.x, p.y);
  });

  // Duplicate last point
  const last = branch[branch.length - 1];
  curveVertex(last.x, last.y);

  endShape();

  // ---- HIGHLIGHT ----
  stroke(255, 245, 190, 140);
  beginShape();

  curveVertex(
    branch[0].x + LIGHT_DIR.x,
    branch[0].y + LIGHT_DIR.y
  );

  branch.forEach(p => {
    curveVertex(
      p.x + LIGHT_DIR.x,
      p.y + LIGHT_DIR.y
    );
  });

  curveVertex(
    last.x + LIGHT_DIR.x,
    last.y + LIGHT_DIR.y
  );

  endShape();
}

function sampleBranchSpline(branch, t) {
  if (!branch || branch.length === 0) return null;
  if (branch.length === 1) {
    return { x: branch[0].x, y: branch[0].y, r: branch[0].r || 1 };
  }
  if (branch.length === 2) {
    const a = branch[0];
    const b = branch[1];
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      r: lerp(a.r || 1, b.r || 1, t)
    };
  }

  const segCount = branch.length - 1;
  const u = constrain(t, 0, 1) * segCount;
  const i = floor(u);
  const localT = constrain(u - i, 0, 1);

  const p0 = branch[max(0, i - 1)];
  const p1 = branch[min(segCount, i)];
  const p2 = branch[min(segCount, i + 1)];
  const p3 = branch[min(segCount, i + 2)];

  return {
    x: curvePoint(p0.x, p1.x, p2.x, p3.x, localT),
    y: curvePoint(p0.y, p1.y, p2.y, p3.y, localT),
    r: lerp(p1.r || 1, p2.r || 1, localT)
  };
}

function drawConicalBranch(branch, baseColor) {
  if (!branch || branch.length < 2) return;

  const samples = max(18, (branch.length - 1) * 16);
  const baseW = max(0.85, (branch[0].r || 2) * 0.82);
  const tipW = max(0.24, ((branch[branch.length - 1].r || 1) * 0.28));
  const wiggleAmp = max(0.8, min(2.6, (branch[0].r || 1) * 0.18));
  const wigglePhase = (branch[0].x * 0.037) + (branch[0].y * 0.021);
  const wiggleFreq = 2.25 + branch.length * 0.12;

  strokeCap(ROUND);
  noFill();

  let prev = sampleBranchSpline(branch, 0);
  if (!prev) return;

  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const curr = sampleBranchSpline(branch, t);
    if (!curr) continue;

    const tA = max(0, t - 0.02);
    const tB = min(1, t + 0.02);
    const a = sampleBranchSpline(branch, tA);
    const b = sampleBranchSpline(branch, tB);

    let nx = 0;
    let ny = 0;
    if (a && b) {
      const tx = b.x - a.x;
      const ty = b.y - a.y;
      const m = max(0.0001, sqrt(tx * tx + ty * ty));
      nx = -ty / m;
      ny = tx / m;
    }

    const wiggle =
      wiggleAmp *
      (1 - t) *
      sin(t * PI * wiggleFreq + wigglePhase);

    const x1 = prev.x + nx * wiggle * 0.6;
    const y1 = prev.y + ny * wiggle * 0.6;
    const x2 = curr.x + nx * wiggle;
    const y2 = curr.y + ny * wiggle;

    const wBase = lerp(baseW, tipW, pow(t, 0.72));
    const rootBoost = 1 + 0.12 * pow(1 - t, 2.3);
    const w = wBase * rootBoost;
    // Flat pass only: no depth shading.
    stroke(baseColor);
    strokeWeight(w);
    line(x1, y1, x2, y2);

    prev = curr;
  }
}

// =====================================================
// MYELIN RENDERING (OVERVIEW ONLY)
// =====================================================
function drawMyelinSheathsFromGeometry() {
  if (!window.myelinEnabled) return;

  const sheaths = neuron?.axon?.sheaths;
  if (!sheaths || sheaths.length === 0) return;

  stroke(getColor("myelin"));
  strokeWeight(14);
  strokeCap(ROUND);
  noFill();

  sheaths.forEach(s => {
    line(s.x0, s.y0, s.x1, s.y1);
  });
}

  // =====================================================
  // AXON CORE (BACKGROUND LAYER)
  // =====================================================
  function drawAxonCore(neuron) {
    if (!neuron?.axon?.path) return;
  
    const path = neuron.axon.path;
  
    stroke(getColor("axon"));
    strokeWeight(6);
    noFill();
  
    beginShape();
    path.forEach(p => vertex(p.x, p.y));
    endShape();
  }

// =====================================================
// NEURON 1 (PRESYNAPTIC)
// =====================================================
function drawNeuron1() {
  const depol = constrain(
    map(soma.VmDisplay, soma.rest, soma.threshold, 0, 1),
    0, 1
  );

  const body = lerpColor(
    getColor("soma"),
    color(255, 245, 200),
    depol
  );

  // ---------------- DENDRITES ----------------
  neuron.dendrites.forEach(branch => {
    drawConicalBranch(branch, body);
  });

  // ---------------- SOMA ----------------
  push();

  noStroke();

  // Shadow
  fill(190, 165, 90);
  ellipse(2, 3, neuron.somaRadius * 2.3);

  // Body
  fill(body);
  ellipse(0, 0, neuron.somaRadius * 2.1);

  // Highlight
  push();
  clip(() => ellipse(0, 0, neuron.somaRadius * 2.1));
  fill(255, 255, 230, 120);
  ellipse(
    neuron.somaRadius * -0.35,
    neuron.somaRadius * -0.45,
    neuron.somaRadius * 1.3
  );
  pop();

  // Vm label
  fill(60);
  textAlign(CENTER, CENTER);
  textSize(14);
  text(`${soma.VmDisplay.toFixed(1)} mV`, 0, 2);

  pop();

  // Subtle no-line merge so soma opens smoothly into each trunk.
  push();
  noStroke();
  fill(body);
  neuron.dendrites.forEach(branch => {
    if (!branch || branch.length < 2) return;
    const p0 = branch[0];
    const p1 = branch[1];
    if (dist(p0.x, p0.y, 0, 0) > neuron.somaRadius * 1.2) return;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const m = max(0.0001, sqrt(dx * dx + dy * dy));
    const ux = dx / m;
    const uy = dy / m;
    const d = max(2.8, (p0.r || 2.2) * 1.2);

    ellipse(p0.x + ux * 0.8, p0.y + uy * 0.8, d * 1.15, d);
    ellipse(p0.x + ux * 1.7, p0.y + uy * 1.7, d * 0.92, d * 0.82);
  });
  pop();

  // ---------------- AIS (THICK NUB) ----------------
  push();
  stroke(getColor("axon"));
  strokeCap(ROUND);
  strokeWeight(10);

  const AIS_LENGTH = neuron.hillock.length * 0.25;
  const AIS_START  = neuron.somaRadius + neuron.hillock.length * 0.55;
  const AIS_END    = AIS_START + AIS_LENGTH;

  line(AIS_START, 0, AIS_END, 0);
  pop();

  // =====================================================
  // AXON LAYERING (CRITICAL ORDER)
  // =====================================================

  // 1️⃣ Axon core FIRST (background)
  drawAxonCore(neuron);

  // 2️⃣ Action potential ABOVE axon
  if (window.myelinEnabled) {
    drawMyelinAPs();
  } else {
    drawAxonSpikes();
  }

  // 3️⃣ Myelin LAST (hides AP under sheath)
  drawMyelinSheathsFromGeometry();

  // ---------------- AXON TERMINALS ----------------
  neuron.axon.terminalBranches.forEach(b => {

    stroke(getColor("axon"));
    strokeWeight(3);
    noFill();

    bezier(
      b.start.x, b.start.y,
      b.ctrl.x,  b.ctrl.y,
      b.ctrl.x,  b.ctrl.y,
      b.end.x,   b.end.y
    );

    noStroke();
    fill(getColor("terminalBouton"));
    ellipse(b.end.x, b.end.y, b.boutonRadius * 2);
  });

  // ---------------- SYNAPSES ----------------
  neuron.synapses.forEach(s => {

    const base =
      s.type === "exc"
        ? getColor("terminalBouton")
        : getColor("ipsp");

    noStroke();
    fill(base);
    ellipse(s.x, s.y, s.radius * 2);

    if (s.selected) {
      stroke(255);
      strokeWeight(2);
      noFill();
      ellipse(s.x, s.y, s.radius * 2.6);
    }

    if (s.hovered) drawSynapseControls(s);
  });
}

// =====================================================
// NEURON 2 (POSTSYNAPTIC)
// =====================================================
function drawNeuron2() {
  const body2 = getColor("soma");

  // ===================================================
  // AXON OUTPUT (DRAW FIRST — BACKGROUND)
  // ===================================================
  const ax = radians(neuron2.axon.angle);

  const axStartX =
    neuron2.soma.x + cos(ax) * neuron2.somaRadius;
  const axStartY =
    neuron2.soma.y + sin(ax) * neuron2.somaRadius;
  const shaft2 = neuron2.axon.shaft;

 // ---------------- AIS ----------------
push();
stroke(getColor("axon"));
strokeCap(ROUND);

// Slightly thicker than axon shaft
strokeWeight(8);

const AIS_LEN = neuron2.somaRadius * 0.25;

// Explicit direction vector (matches axon)
const aisDx = cos(ax);
const aisDy = sin(ax);

line(
  axStartX,
  axStartY,
  axStartX + aisDx * AIS_LEN,
  axStartY + aisDy * AIS_LEN
);
pop();


  // ---------------- AXON SHAFT ----------------
  push();
  stroke(getColor("axon"));
  strokeCap(ROUND);
  strokeWeight(6); // 🔑 thicker than dendrites (~3–4)
  noFill();

  beginShape();
  vertex(shaft2?.start?.x ?? (axStartX + cos(ax) * AIS_LEN), shaft2?.start?.y ?? (axStartY + sin(ax) * AIS_LEN));
  bezierVertex(
    shaft2?.c1?.x ?? (axStartX + 60),
    shaft2?.c1?.y ?? (axStartY + 20),
    shaft2?.c2?.x ?? (axStartX + 140),
    shaft2?.c2?.y ?? (axStartY - 30),
    shaft2?.end?.x ?? (axStartX + cos(ax) * neuron2.axon.length),
    shaft2?.end?.y ?? (axStartY + sin(ax) * neuron2.axon.length)
  );
  endShape();
  pop();

  (neuron2.axon.terminalBranches || []).forEach(b => {
    push();
    stroke(getColor("axon"));
    strokeWeight(3);
    noFill();
    bezier(
      b.start.x, b.start.y,
      b.ctrl.x, b.ctrl.y,
      b.ctrl.x, b.ctrl.y,
      b.end.x, b.end.y
    );
    noStroke();
    fill(getColor("terminalBouton"));
    ellipse(b.end.x, b.end.y, b.boutonRadius * 2);
    pop();
  });

  // ===================================================
  // DENDRITES (ABOVE AXON)
  // ===================================================
  neuron2.dendrites.forEach(branch => {
    drawConicalBranch(branch, body2);
  });

  // ===================================================
  // SOMA (TOPMOST STRUCTURE)
  // ===================================================
  push();
  noStroke();

  // Shadow
  fill(190, 165, 90);
  ellipse(
    neuron2.soma.x + 2,
    neuron2.soma.y + 3,
    neuron2.somaRadius * 2.3
  );

  // Body
  fill(body2);
  ellipse(
    neuron2.soma.x,
    neuron2.soma.y,
    neuron2.somaRadius * 2.1
  );

  // Highlight
  push();
  clip(() =>
    ellipse(
      neuron2.soma.x,
      neuron2.soma.y,
      neuron2.somaRadius * 2.1
    )
  );
  fill(255, 255, 230, 120);
  ellipse(
    neuron2.soma.x + neuron2.somaRadius * -0.35,
    neuron2.soma.y + neuron2.somaRadius * -0.45,
    neuron2.somaRadius * 1.3
  );
  pop();

  pop();

  // Subtle no-line merge so soma opens smoothly into each trunk.
  push();
  noStroke();
  fill(body2);
  neuron2.dendrites.forEach(branch => {
    if (!branch || branch.length < 2) return;
    const p0 = branch[0];
    const p1 = branch[1];
    if (dist(p0.x, p0.y, neuron2.soma.x, neuron2.soma.y) > neuron2.somaRadius * 1.2) return;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const m = max(0.0001, sqrt(dx * dx + dy * dy));
    const ux = dx / m;
    const uy = dy / m;
    const d = max(2.8, (p0.r || 2.2) * 1.2);

    ellipse(p0.x + ux * 0.8, p0.y + uy * 0.8, d * 1.15, d);
    ellipse(p0.x + ux * 1.7, p0.y + uy * 1.7, d * 0.92, d * 0.82);
  });
  pop();

  // ===================================================
  // POSTSYNAPTIC DENSITY (VISIBLE ON TOP)
  // ===================================================
  neuron2.synapses.forEach(s => {
    noStroke();
    fill(getColor("terminalBouton"));
    ellipse(s.x, s.y, s.radius * 2);
  });
}

// =====================================================
// NEURON 3 (INHIBITORY INTERNEURON)
// =====================================================
function drawNeuron3() {
  const body3 = getColor("soma");

  // ===================================================
  // AXON (DRAW FIRST — BACKGROUND)
  // ===================================================
  const axAngle = radians(-90); // straight up

  const axStartX =
    neuron3.soma.x + cos(axAngle) * neuron3.somaRadius;
  const axStartY =
    neuron3.soma.y + sin(axAngle) * neuron3.somaRadius;
  const shaft3 = neuron3.axon?.shaft;

 // ---------------- AIS ----------------
push();
stroke(getColor("axon"));
strokeCap(ROUND);

// 🔑 Narrower than neuron 2, still thicker than dendrites
strokeWeight(7);

const AIS_LEN = neuron3.somaRadius * 0.25;

// Explicit axon direction
const aisDx = cos(axAngle);
const aisDy = sin(axAngle);

line(
  axStartX,
  axStartY,
  axStartX + aisDx * AIS_LEN,
  axStartY + aisDy * AIS_LEN
);
pop();

  // ---------------- AXON SHAFT ----------------
  push();
  stroke(getColor("axon"));
  strokeCap(ROUND);
  strokeWeight(7); // 🔑 thicker than dendrites (~3–4)
  noFill();

  beginShape();
  vertex(shaft3?.start?.x ?? axStartX, shaft3?.start?.y ?? (axStartY - AIS_LEN));
  bezierVertex(
    shaft3?.c1?.x ?? (axStartX - 30),
    shaft3?.c1?.y ?? (axStartY - 80),
    shaft3?.c2?.x ?? (axStartX + 20),
    shaft3?.c2?.y ?? (axStartY - 220),
    shaft3?.end?.x ?? axStartX,
    shaft3?.end?.y ?? (axStartY - 300)
  );
  endShape();
  pop();

  (neuron3.axon?.terminalBranches || []).forEach(b => {
    push();
    stroke(getColor("axon"));
    strokeWeight(3);
    noFill();
    bezier(
      b.start.x, b.start.y,
      b.ctrl.x, b.ctrl.y,
      b.ctrl.x, b.ctrl.y,
      b.end.x, b.end.y
    );
    noStroke();
    fill(getColor("terminalBouton"));
    ellipse(b.end.x, b.end.y, b.boutonRadius * 2);
    pop();
  });

  // ===================================================
  // DENDRITES (ABOVE AXON)
  // ===================================================
  neuron3.dendrites.forEach(branch => {
    drawConicalBranch(branch, body3);
  });

  // ===================================================
  // SOMA (TOPMOST)
  // ===================================================
  push();
  noStroke();

  // Shadow
  fill(190, 165, 90);
  ellipse(
    neuron3.soma.x + 2,
    neuron3.soma.y + 3,
    neuron3.somaRadius * 2.3
  );

  // Body
  fill(body3);
  ellipse(
    neuron3.soma.x,
    neuron3.soma.y,
    neuron3.somaRadius * 2.1
  );

  // Highlight
  push();
  clip(() =>
    ellipse(
      neuron3.soma.x,
      neuron3.soma.y,
      neuron3.somaRadius * 2.1
    )
  );
  fill(255, 255, 230, 120);
  ellipse(
    neuron3.soma.x - neuron3.somaRadius * 0.35,
    neuron3.soma.y - neuron3.somaRadius * 0.45,
    neuron3.somaRadius * 1.3
  );
  pop();

  pop();

  // Subtle no-line merge so soma opens smoothly into each trunk.
  push();
  noStroke();
  fill(body3);
  neuron3.dendrites.forEach(branch => {
    if (!branch || branch.length < 2) return;
    const p0 = branch[0];
    const p1 = branch[1];
    if (dist(p0.x, p0.y, neuron3.soma.x, neuron3.soma.y) > neuron3.somaRadius * 1.2) return;

    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const m = max(0.0001, sqrt(dx * dx + dy * dy));
    const ux = dx / m;
    const uy = dy / m;
    const d = max(2.8, (p0.r || 2.2) * 1.2);

    ellipse(p0.x + ux * 0.8, p0.y + uy * 0.8, d * 1.15, d);
    ellipse(p0.x + ux * 1.7, p0.y + uy * 1.7, d * 0.92, d * 0.82);
  });
  pop();

  // ===================================================
  // POSTSYNAPTIC DENSITY (ON TOP)
  // ===================================================
  neuron3.synapses.forEach(s => {
    noStroke();
    fill(getColor("ipsp")); // red synapse, not red neuron
    ellipse(s.x, s.y, s.radius * 2);
  });
}


// =====================================================
// SYNAPSE SIZE CONTROLS
// =====================================================
function drawSynapseControls(s) {
  noStroke();

  // -------- PLUS --------
  fill(255); // white button
  ellipse(s.x, s.y - s.radius - 18, 18, 18);

  fill(0);   // black "+"
  textAlign(CENTER, CENTER);
  text("+", s.x, s.y - s.radius - 18);

  // -------- MINUS --------
  fill(255); // white button
  ellipse(s.x, s.y + s.radius + 18, 18, 18);

  fill(0);   // black "-"
  text("–", s.x, s.y + s.radius + 18);
}
