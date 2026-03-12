console.log("🧬 vesicleGeometry loaded — PRODUCTION (OPAQUE + CLEAN)");

// =====================================================
// VESICLE GEOMETRY & RENDERING (READ-ONLY)
// =====================================================
//
// FINAL RULES (LOCKED):
// • Vesicle drawn as rigid circle (no scaling)
// • Vesicle erases directionally via clipX
// • Alpha fades ONLY as secondary cue
// • NTs always render purple & visible
// • Geometry NEVER hides vesicles unless FUSING
//
// =====================================================


// -----------------------------------------------------
// COLORS
// -----------------------------------------------------
function vesicleBorderColor() {
  return color(245, 225, 140);
}

// More opaque interior
function vesicleFillColor(alpha = 160) {
  return color(245, 225, 140, alpha);
}

// Always-purple NTs
function ntFillColor(alpha = 255) {
  return color(185, 120, 255, alpha);
}

function protonColor() {
  return color(255, 90, 90);
}

function atpColor(alpha = 255) {
  return color(120, 200, 255, alpha);
}

const SNARE_RED = [245, 78, 78];
const SNARE_ORANGE = [255, 164, 72];
const SNARE_PURPLE = [182, 118, 255];

function getSnareStationsForDraw() {
  if (typeof window.getSnareDockStations === "function") {
    return window.getSnareDockStations();
  }
  return [];
}

function drawSnareCoilAlongX(x0, y0, colorRgb, alpha = 220, len = 10, amp = 1.2, phase = 0, dir = 1) {
  noFill();
  stroke(colorRgb[0], colorRgb[1], colorRgb[2], alpha);
  strokeWeight(1.5);
  beginShape();
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const xx = x0 + dir * t * len;
    const yy = y0 + sin(t * TWO_PI * 2 + phase) * amp;
    vertex(xx, yy);
  }
  endShape();
}

function drawSnareIntertwine(x0, y0, x1, y1, colorRgb, alpha = 210, phase = 0) {
  noFill();
  stroke(colorRgb[0], colorRgb[1], colorRgb[2], alpha);
  strokeWeight(1.35);
  beginShape();
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = lerp(x0, x1, t);
    const y = lerp(y0, y1, t) + sin(t * TWO_PI * 3 + phase) * 1.2;
    vertex(x, y);
  }
  endShape();
}

function drawSnareDockingSystem() {
  const vesicles = window.synapseVesicles || [];
  if (!vesicles.length) return;
  const stations = getSnareStationsForDraw();
  if (!stations.length) return;

  const r = window.SYNAPSE_VESICLE_RADIUS || 10;
  for (const v of vesicles) {
    if (!v.releaseBias) continue;
    if (!(v.state === "DOCKING" || v.state === "FUSING")) continue;

    const f = v.state === "FUSING" ? constrain(v.flatten ?? 0, 0, 1) : 0;
    const coilFade = v.state === "FUSING" ? constrain(1 - f, 0, 1) : 1;
    if (coilFade <= 0.02) continue;

    const stationIdx = Number.isFinite(v.snareStationIndex) ? v.snareStationIndex : -1;
    const station = stations.find(s => s.id === stationIdx);
    if (!station) continue;

    const fuseEase = constrain(f / 0.5, 0, 1);
    const phase = frameCount * 0.12;
    const anchorX = Number.isFinite(station.anchorX) ? station.anchorX : station.x;
    const membraneBaseX = anchorX + 0.8;
    for (const side of [-1, 1]) {
      const y = (Number.isFinite(v.snareStationY) ? v.snareStationY : v.y) + side * 5.8;
      const membraneInsideX = (window.getSynapticMembraneX?.(y) ?? 0) + 1.2;
      const stationRedY = y - 1.25;
      const stationOrangeY = y + 1.25;
      const stationBaseX = max(membraneBaseX, membraneInsideX);
      const membraneTipX = stationBaseX + 8.8;

      // Docking station: red/orange pair per side, protruding from membrane.
      const stationAlpha = 220 * coilFade;
      drawSnareCoilAlongX(stationBaseX, stationRedY, SNARE_RED, stationAlpha, 8.8, 1.0, phase + side * 0.55, +1);
      drawSnareCoilAlongX(
        stationBaseX,
        stationOrangeY,
        SNARE_ORANGE,
        stationAlpha,
        8.8,
        1.0,
        phase + 0.95 + side * 0.55,
        +1
      );

      // Vesicle: one purple coil per side, protruding toward membrane.
      const dyLocal = y - v.y;
      const radialSq = r * r - dyLocal * dyLocal;
      if (radialSq <= 0) continue;
      const vesicleSurfaceX = v.x - sqrt(radialSq);
      const desiredVesLen = 8.2;
      const vesicleTipX = max(membraneInsideX, vesicleSurfaceX - desiredVesLen);
      const vesicleLen = max(0, vesicleSurfaceX - vesicleTipX);
      const vAlpha = 215 * (1 - fuseEase * 0.82) * coilFade;
      if (vesicleLen > 0.6) {
        drawSnareCoilAlongX(
          vesicleSurfaceX,
          y,
          SNARE_PURPLE,
          vAlpha,
          vesicleLen,
          1.2,
          phase + 1.9 + side * 0.45,
          -1
        );
      }
      noStroke();
      fill(SNARE_PURPLE[0], SNARE_PURPLE[1], SNARE_PURPLE[2], vAlpha);
      circle(vesicleSurfaceX, y, 2.2);

      if (v.state === "FUSING" && vesicleLen > 0.1) {
        drawSnareIntertwine(
          membraneTipX,
          stationRedY,
          vesicleTipX,
          y - 0.55,
          SNARE_RED,
          225 * (1 - fuseEase) * coilFade,
          phase
        );
        drawSnareIntertwine(
          membraneTipX,
          stationOrangeY,
          vesicleTipX,
          y + 0.55,
          SNARE_ORANGE,
          225 * (1 - fuseEase) * coilFade,
          phase + 0.75
        );
      }
    }
  }
}


// -----------------------------------------------------
// MAIN DRAW ENTRY
// -----------------------------------------------------
function drawSynapseVesicleGeometry() {
  push();
  drawVesicleMembranes();
  drawSnareDockingSystem();
  drawVesicleContents();
  drawPrimingParticles();
  pop();
}


// -----------------------------------------------------
// VESICLE MEMBRANES — SAFE, STATE-GATED ERASE
// -----------------------------------------------------
function drawVesicleMembranes() {

  const vesicles = window.synapseVesicles || [];
  if (!vesicles.length) return;

  const r       = window.SYNAPSE_VESICLE_RADIUS;
  const strokeW = window.SYNAPSE_VESICLE_STROKE;

  for (const v of vesicles) {

    if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) continue;

    // ---------------------------------------------
    // Determine fusion state safely
    // ---------------------------------------------
    const isFusing = v.state === "FUSING";
    const flatten  = isFusing ? (v.flatten ?? 0) : 0;

    // Hard erase ONLY during fusion
    if (isFusing && flatten >= 1) continue;

    push();
    translate(v.x, v.y);

    // ---------------------------------------------
    // Directional clip ONLY during fusion
    // ---------------------------------------------
    if (isFusing && Number.isFinite(v.clipX)) {

      const localClipX = v.clipX - v.x;

      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(
        localClipX,
        -r * 2,
        r * 4,
        r * 4
      );
      drawingContext.clip();
    }

    const fade = isFusing ? constrain(1 - flatten, 0, 1) : 1;

    stroke(vesicleBorderColor());
    strokeWeight(strokeW);
    fill(vesicleFillColor(160 * fade));

    ellipse(0, 0, r * 2);

    if (isFusing && Number.isFinite(v.clipX)) {
      drawingContext.restore();
    }

    pop();
  }
}


// -----------------------------------------------------
// NEUROTRANSMITTER CONTENTS — ALWAYS VISIBLE
// -----------------------------------------------------
function drawVesicleContents() {

  const vesicles = window.synapseVesicles || [];
  if (!vesicles.length) return;

  const r = window.SYNAPSE_VESICLE_RADIUS;

  for (const v of vesicles) {

    if (!Array.isArray(v.nts) || !v.nts.length) continue;

    const isFusing = v.state === "FUSING";
    const flatten  = isFusing ? (v.flatten ?? 0) : 0;

    if (isFusing && flatten >= 1) continue;

    push();
    translate(v.x, v.y);

    if (isFusing && Number.isFinite(v.clipX)) {

      const localClipX = v.clipX - v.x;

      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(
        localClipX,
        -r * 2,
        r * 4,
        r * 4
      );
      drawingContext.clip();
    }

    fill(ntFillColor(255));
    noStroke();

    for (const p of v.nts) {
      circle(p.x, p.y, 3);
    }

    if (isFusing && Number.isFinite(v.clipX)) {
      drawingContext.restore();
    }

    pop();
  }
}


// -----------------------------------------------------
// PRIMING PARTICLES (UNCHANGED)
// -----------------------------------------------------
function drawPrimingParticles() {

  const ALLOWED = new Set(["PRIMING", "PRIMED", "LOADING"]);

  fill(protonColor());
  textSize(12);
  textAlign(CENTER, CENTER);

  for (const h of window.synapseH || []) {
    if (!h.target || !ALLOWED.has(h.target.state)) continue;
    push();
    translate(h.x, h.y);
    rotate(-PI);
    text("H⁺", 0, 0);
    pop();
  }

  textSize(10);

  for (const a of window.synapseATP || []) {
    if (!a.target || !ALLOWED.has(a.target.state)) continue;
    fill(atpColor(a.alpha ?? 255));
    push();
    translate(a.x, a.y);
    rotate(-PI);
    text(a.state === "ATP" ? "ATP" : "ADP + Pi", 0, 0);
    pop();
  }
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------
window.drawSynapseVesicleGeometry = drawSynapseVesicleGeometry;
