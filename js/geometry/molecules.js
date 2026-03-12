// =====================================================
// EDUCATIONAL MOLECULES (ARTERY -> NEURAL ENVIRONMENT)
// =====================================================
console.log("molecule system loaded");

const MOLECULE_SPEED = 0.25;
const MOLECULE_RADIUS = 10;
const RELEASE_INTERVAL = 15;
const MAX_ACTIVE_MOLECULES = 180;

window.DEBUG_RENDER = window.DEBUG_RENDER || false;
window.showMoleculeLabels = true;
window.educationalMoleculesEnabled = false;

const moleculePool = [];
const activeMolecules = [];

let releaseCounter = 0;
let moleculeId = 0;

const MOLECULE_TYPES = [
  { type: "O2", color: [116, 229, 255] },
  { type: "Glu", color: [255, 193, 120] },
  { type: "ATP", color: [182, 255, 186] }
];

function initMolecules() {
  activeMolecules.length = 0;
  moleculePool.length = 0;
  releaseCounter = 0;
  moleculeId = 0;
}

function createNewMolecule() {
  return {
    id: 0,
    type: "O2",
    color: [255, 255, 255],
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: MOLECULE_RADIUS,
    life: 0,
    alpha: 255
  };
}

function obtainMolecule() {
  return moleculePool.pop() || createNewMolecule();
}

function recycleMolecule(index) {
  const molecule = activeMolecules[index];
  if (!molecule) return;

  activeMolecules[index] = activeMolecules[activeMolecules.length - 1];
  activeMolecules.pop();
  moleculePool.push(molecule);
}

function pickMoleculeType() {
  return MOLECULE_TYPES[floor(random(MOLECULE_TYPES.length))];
}

function spawnMolecule() {
  if (activeMolecules.length >= MAX_ACTIVE_MOLECULES) return;
  if (typeof getArteryEmissionPoint !== "function") return;

  const source = getArteryEmissionPoint();
  if (!source) return;

  const spec = pickMoleculeType();
  const molecule = obtainMolecule();

  molecule.id = moleculeId++;
  molecule.type = spec.type;
  molecule.color = spec.color;
  molecule.radius = MOLECULE_RADIUS;

  molecule.x = source.x + random(-4, 4);
  molecule.y = source.y + random(-6, 6);

  molecule.vx = random(MOLECULE_SPEED * 0.85, MOLECULE_SPEED * 1.15);
  molecule.vy = random(-0.08, 0.08);

  molecule.life = 0;
  molecule.alpha = 255;

  activeMolecules.push(molecule);
}

function updateMolecules() {
  if (!window.educationalMoleculesEnabled) return;

  const wf = window.WORLD_FRAME || { width: 1400, height: 900 };
  const worldLeft = -wf.width * 0.5;
  const worldRight = wf.width * 0.5;
  const worldTop = -wf.height * 0.5;
  const worldBottom = wf.height * 0.5;
  const dtScale = (state?.dt || 16.67) / 16.67;

  releaseCounter += 1;
  if (releaseCounter >= RELEASE_INTERVAL) {
    spawnMolecule();
    releaseCounter = 0;
  }

  for (let i = activeMolecules.length - 1; i >= 0; i--) {
    const molecule = activeMolecules[i];
    molecule.life += 1;

    molecule.vy += random(-0.007, 0.007);
    molecule.vy *= 0.98;

    molecule.x += molecule.vx * dtScale;
    molecule.y += molecule.vy * dtScale;

    const outOfBounds =
      molecule.x > worldRight + 40 ||
      molecule.y < worldTop - 40 ||
      molecule.y > worldBottom + 40;

    if (outOfBounds) {
      recycleMolecule(i);
    }
  }
}

function drawMolecules() {
  if (!window.educationalMoleculesEnabled) return;

  push();
  noStroke();

  for (const molecule of activeMolecules) {
    fill(
      molecule.color[0],
      molecule.color[1],
      molecule.color[2],
      molecule.alpha
    );
    circle(molecule.x, molecule.y, molecule.radius * 2);

    if (window.showMoleculeLabels) {
      fill(240, 240, 240, 235);
      textSize(12);
      textAlign(LEFT, BOTTOM);
      text(molecule.type, molecule.x + 6, molecule.y - 6);
    }
  }

  pop();
}

function getMoleculeStats() {
  return {
    active: activeMolecules.length,
    pooled: moleculePool.length,
    releaseInterval: RELEASE_INTERVAL,
    speed: MOLECULE_SPEED,
    radius: MOLECULE_RADIUS
  };
}

window.initMolecules = initMolecules;
window.updateMolecules = updateMolecules;
window.drawMolecules = drawMolecules;
window.getMoleculeStats = getMoleculeStats;
