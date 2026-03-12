// =====================================================
// SOMA IONS — Na⁺ INFLUX / K⁺ EFFLUX
// =====================================================
console.log("🧠 somaIons loaded");

// -----------------------------------------------------
// GLOBAL ECS CONTAINER (RELOAD-SAFE)
// -----------------------------------------------------
window.ecsIons = window.ecsIons || {};
ecsIons.NaFlux = ecsIons.NaFlux || [];
ecsIons.KFlux  = ecsIons.KFlux  || [];

// -----------------------------------------------------
// Na⁺ INFLUX (SOMA DEPOLARIZATION)
// -----------------------------------------------------
const NA_FLUX_SPEED    = 1.6;
const NA_FLUX_LIFETIME = 80;
const NA_SPAWN_RADIUS  = 140;

// -----------------------------------------------------
// K⁺ EFFLUX (REPOLARIZATION)
// -----------------------------------------------------
const K_FLUX_SPEED     = 2.2;
const K_FLUX_LIFETIME  = 160;
const K_SPAWN_RADIUS   = 28;

// -----------------------------------------------------
// DAMPING
// -----------------------------------------------------
const ION_VEL_DECAY    = 0.965;

// =====================================================
// 🔧 INITIALIZATION (CALLED FROM main.js)
// =====================================================
function initSomaIons() {
  ecsIons.NaFlux.length = 0;
  ecsIons.KFlux.length  = 0;
}

// =====================================================
// 🧠 SOMA TRIGGERS
// =====================================================
function triggerNaInfluxNeuron1() {

  for (let i = 0; i < 14; i++) {
    ecsIons.NaFlux.push({
      x: random(-NA_SPAWN_RADIUS, NA_SPAWN_RADIUS),
      y: random(-NA_SPAWN_RADIUS, NA_SPAWN_RADIUS),
      life: NA_FLUX_LIFETIME
    });
  }
}

function triggerKEffluxNeuron1() {

  for (let i = 0; i < 16; i++) {
    const a = random(TWO_PI);

    ecsIons.KFlux.push({
      x: random(-K_SPAWN_RADIUS, K_SPAWN_RADIUS),
      y: random(-K_SPAWN_RADIUS, K_SPAWN_RADIUS),
      vx: cos(a) * K_FLUX_SPEED,
      vy: sin(a) * K_FLUX_SPEED,
      life: K_FLUX_LIFETIME
    });
  }
}

// =====================================================
// DRAW
// =====================================================
function drawSomaIons() {
  push();
  textAlign(CENTER, CENTER);
  noStroke();

  // ------------------------------
  // Na⁺ influx (toward soma center)
  // ------------------------------
  fill(getColor("sodium", 120));

  ecsIons.NaFlux = ecsIons.NaFlux.filter(p => {
    p.life--;

    const d = Math.hypot(p.x, p.y) || 1;
    p.x += (-p.x / d) * NA_FLUX_SPEED;
    p.y += (-p.y / d) * NA_FLUX_SPEED;

    text("Na⁺", p.x, p.y);
    return p.life > 0;
  });

  // ------------------------------
  // K⁺ efflux (radial outward)
  // ------------------------------
  ecsIons.KFlux = ecsIons.KFlux.filter(p => {
    p.life--;

    p.x += p.vx;
    p.y += p.vy;

    p.vx *= ION_VEL_DECAY;
    p.vy *= ION_VEL_DECAY;

    fill(
      getColor(
        "potassium",
        map(p.life, 0, K_FLUX_LIFETIME, 0, 180)
      )
    );

    text("K⁺", p.x, p.y);
    return p.life > 0;
  });

  pop();
}

// =====================================================
// EXPORTS
// =====================================================
window.initSomaIons            = initSomaIons;
window.triggerNaInfluxNeuron1 = triggerNaInfluxNeuron1;
window.triggerKEffluxNeuron1  = triggerKEffluxNeuron1;
window.drawSomaIons           = drawSomaIons;
