console.log("♻️ vesicleRecycling loaded — ENDOCYTOSIS (FUSION-PLANE ANCHORED)");

// =====================================================
// VESICLE RECYCLING — BIOLOGICAL ENDOCYTOSIS
// =====================================================
//
// ✔ Patch → bud → pinch (membrane deformation)
// ✔ Buds anchored at FUSION PLANE
// ✔ Vesicle detaches ONLY at final pinch
// ✔ No vesicle continuity after fusion
//
// ARCHITECTURAL RULES (ENFORCED):
// • NO vesicle geometry until DETACH
// • NO flatten / clipX during budding
// • ALL positions membrane-relative
//
// =====================================================


// -----------------------------------------------------
// ENDOCYTOSIS SEEDS (MEMBRANE-OWNED)
// -----------------------------------------------------
window.endocytosisSeeds = window.endocytosisSeeds || [];


// -----------------------------------------------------
// SPAWN ENDOCYTOSIS SEED (FUSION-LOCKED)
// -----------------------------------------------------
window.spawnEndocytosisSeed = function (_x, y) {

  if (frameCount % 30 === 0) {
    console.log("♻️ spawnEndocytosisSeed at y =", y);
  }

  window.endocytosisSeeds.push({
    y,
    timer: 0,
    stage: "PATCH",

    radius: 0.5,
    offset: 0,
    neck: 0,
    alpha: 120
  });
};


// -----------------------------------------------------
// UPDATE RECYCLING — AUTHORITATIVE STATE MACHINE
// -----------------------------------------------------
function updateVesicleRecycling() {

  const seeds    = window.endocytosisSeeds;
  const vesicles = window.synapseVesicles || [];

  const MAX_VES = window.SYNAPSE_MAX_VESICLES;
  const R       = window.SYNAPSE_VESICLE_RADIUS;
  const BACK_X  = window.SYNAPSE_BACK_OFFSET_X;

  // ===================================================
  // ENDOCYTOSIS STATE MACHINE
  // ===================================================
  for (let i = seeds.length - 1; i >= 0; i--) {

    const e = seeds[i];
    e.timer++;

    // ---------------- PATCH ----------------
    if (e.stage === "PATCH") {

      const t = constrain(e.timer / 80, 0, 1);
      e.radius = lerp(0.5, 2.5, t);
      e.offset = lerp(0.0, 1.2, t);
      e.alpha  = lerp(110, 150, t);

      if (e.timer >= 80) {
        e.stage = "BUD";
        e.timer = 0;
        console.log("♻️ endocytosis → BUD at y =", e.y);
      }
    }

    // ---------------- BUD ----------------
    else if (e.stage === "BUD") {

      const t = constrain(e.timer / 150, 0, 1);
      e.offset = lerp(1.2, R * 1.1, t);
      e.radius = lerp(2.5, R, t);
      e.neck   = lerp(0, 6, t);
      e.alpha  = lerp(150, 230, t);

      if (e.timer >= 150) {
        e.stage = "PINCH";
        e.timer = 0;
        console.log("♻️ endocytosis → PINCH at y =", e.y);
      }
    }

    // ---------------- PINCH ----------------
    else if (e.stage === "PINCH") {

      const t = constrain(e.timer / 110, 0, 1);
      e.neck   = lerp(6, 0, t);
      e.offset = lerp(R * 1.1, R * 1.4, t);
      e.radius = lerp(R, R * 0.9, t);

      if (e.timer >= 110) {

        if (vesicles.length < MAX_VES) {

          const membraneX =
            window.getSynapticMembraneX?.(e.y) ?? 0;

          // 🔑 CANONICAL VESICLE CREATION
          vesicles.push({
          x: membraneX + window.SYNAPSE_FUSION_PLANE_X + e.offset,
          y: e.y,
        
          // 🧬 gentle post-pinch motion only
          vx: random(-0.003, 0.003),
          vy: random(-0.003, 0.003),
        
          radius: R,
        
          state: "DETACHED_FLOAT",
          detachTimer: 0,
        
          recycleBias: true,
          recycleCooldown: 120,
        
          primedH: false,
          primedATP: false,
          nts: [],
        
          flatten: 0,
          clipX: undefined
        });

          console.log("♻️ vesicle DETACHED at y =", e.y);
        }

        seeds.splice(i, 1);
      }
    }
  }

  // ===================================================
// DETACHED_FLOAT — slow cytosolic drift
// ===================================================
for (const v of vesicles) {

  if (v.state !== "DETACHED_FLOAT") continue;

  v.detachTimer++;

  // Brownian drift only
  v.vx += random(-0.0015, 0.0015);
  v.vy += random(-0.0015, 0.0015);

  v.vx *= 0.96;
  v.vy *= 0.96;

  v.x += v.vx;
  v.y += v.vy;

  // After clear separation, begin recycling travel
  if (v.detachTimer > 120) {
    v.state = "RECYCLED_TRAVEL";
    v.vx *= 0.4;
    v.vy *= 0.4;
  }
}

  // ===================================================
  // RECYCLED_TRAVEL → RESERVE POOL (MEMBRANE-RELATIVE)
  // ===================================================
  for (const v of vesicles) {

    if (v.state !== "RECYCLED_TRAVEL") continue;

    const membraneX =
      window.getSynapticMembraneX?.(v.y) ?? 0;
    
    const RESERVE_TARGET_X =
      membraneX + BACK_X + 20;
    
    const dx = RESERVE_TARGET_X - v.x;
    
    v.vx += dx * 0.010;
    v.vx *= 0.92;
    v.vy *= 0.94;
    
    v.x += v.vx;
    v.y += v.vy;
    
    if (dx > -6) {
      v.state = "EMPTY";
      v.recycleBias = false;
      v.vx *= 0.3;
      v.vy *= 0.3;
    }

  }
}


// -----------------------------------------------------
// DRAW ENDOCYTOSIS — TRUE MEMBRANE BUDDING
// -----------------------------------------------------
function drawVesicleRecycling() {

  if (!window.endocytosisSeeds.length) return;

  push();

  for (const e of window.endocytosisSeeds) {

    const membraneX =
      window.getSynapticMembraneX?.(e.y) ?? 0;

    const baseX =
      membraneX + window.SYNAPSE_FUSION_PLANE_X;

    const budX = baseX + e.offset;

    // Membrane overlap cue
    noStroke();
    fill(245, 225, 140, e.alpha * 0.45);
    ellipse(
      baseX + e.offset * 0.25,
      e.y,
      e.radius * 1.6
    );

    // Neck
    if (e.stage === "PINCH" && e.neck > 0) {
      noFill();
      stroke(245, 225, 140, e.alpha);
      strokeWeight(2);
      circle(
        baseX + e.offset * 0.35,
        e.y,
        max(1, e.neck * 2)
      );
    }

    // Bud body
    noStroke();
    fill(245, 225, 140, e.alpha);
    ellipse(budX, e.y, e.radius * 2);
  }

  pop();
}


// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.updateVesicleRecycling = updateVesicleRecycling;
window.drawVesicleRecycling  = drawVesicleRecycling;
