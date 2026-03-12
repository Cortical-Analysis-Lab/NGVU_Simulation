console.log("🫧 NTmotion loaded — MOTION & CLEFT CONSTRAINT AUTHORITY");

// =====================================================
// NEUROTRANSMITTER MOTION — FORCE & INTEGRATION ONLY
// =====================================================
//
// RESPONSIBILITIES:
// ✔ Brownian motion
// ✔ Directed advection toward postsynapse
// ✔ Drag
// ✔ OPTIONAL elastic confinement to synaptic cleft
//
// HARD RULES:
// • NEVER draw NTs
// • NEVER spawn NTs
// • NEVER define geometry
// • NEVER fade alpha
// • NEVER clamp position directly
//
// ALL CONSTRAINT GEOMETRY IS OWNED BY:
// → cleftGeometry.js
//
// =====================================================


// -----------------------------------------------------
// 🔧 MOTION TUNING (PHYSICS ONLY)
// -----------------------------------------------------

// Mean forward drift (toward postsynapse)
const NT_ADVECT_X = 0.0055;

// Brownian noise
const NT_BROWNIAN = 0.006;

// Coherent micro-currents to mimic fluid-like spreading
const NT_MICRO_CURRENT = 0.0038;
const NT_SWIRL_JITTER = 0.018;

// Diffusion grows over lifetime so packets disperse in-cleft
const NT_AGE_DIFFUSION = 0.0;

// Global drag
const NT_DRAG = 1.0;

// Safety clamp
const NT_MAX_SPEED = 0.6;


// -----------------------------------------------------
// 🔧 CLEFT CONSTRAINT RESPONSE (ELASTIC)
// -----------------------------------------------------

// Spring strength pulling NT back into cleft
const CLEFT_WALL_K = 0.12;

// Tangential damping when contacting cleft wall
const CLEFT_TANGENTIAL_DAMPING = 0.88;

// Bounce restitution against membranes (0..1)
const MEMBRANE_RESTITUTION = 0.82;


// -----------------------------------------------------
// 🔍 DETECT WHETHER CLEFT PHYSICS IS ACTIVE
// -----------------------------------------------------
//
// If cleftGeometry is in DEBUG mode, these functions
// are pass-through stubs and confinement must be skipped.
//
function cleftPhysicsEnabled() {

  if (
    typeof window.isInsideSynapticCleft !== "function" ||
    typeof window.projectToSynapticCleft !== "function"
  ) {
    return false;
  }

  // Heuristic: debug stubs always return true
  // We test with an impossible point
  return window.isInsideSynapticCleft(1e9, 1e9) === false;
}

function toSynapseSpace(x, y) {
  const preX = window.PRE_X ?? -130;
  const neuronY = window.NEURON_Y ?? 40;
  return {
    x: x + preX,
    y: y + neuronY
  };
}

function fromSynapseSpace(x, y) {
  const preX = window.PRE_X ?? -130;
  const neuronY = window.NEURON_Y ?? 40;
  return {
    x: x - preX,
    y: y - neuronY
  };
}

function getPostMembraneLocalX(yLocalPre) {
  const worldY = yLocalPre + (window.SYNAPSE_NEURON_Y ?? 40);
  const postLocalY = worldY - (window.SYNAPSE_NEURON_Y ?? 40);
  const membraneLocalPostX =
    typeof window.getPostSynapticMembraneX === "function"
      ? window.getPostSynapticMembraneX(postLocalY)
      : 0;
  const membraneWorldX = (window.SYNAPSE_POST_X ?? 130) + membraneLocalPostX;
  return membraneWorldX - (window.SYNAPSE_PRE_X ?? -130);
}

function applyAstrocyteConstraintLocal(p, prevYLocal) {
  if (typeof window.applyAstrocyteConstraint !== "function") return;

  // Astrocyte geometry sampler is defined in synapse-world space.
  // NTs are simulated in pre-terminal local space, so map into world
  // for constraint evaluation and map back afterwards.
  const worldP = toSynapseSpace(p.x, p.y);
  worldP.vx = p.vx;
  worldP.vy = p.vy;

  const prevWorldY = prevYLocal + (window.NEURON_Y ?? 40);
  window.applyAstrocyteConstraint(worldP, prevWorldY);

  const localP = fromSynapseSpace(worldP.x, worldP.y);
  p.x = localP.x;
  p.y = localP.y;
  p.vx = worldP.vx;
  p.vy = worldP.vy;
}

function tryVacuumUptakeForReboundedNT(p) {
  if (!p.rebounded || p.absorbedBy) return;
  p.vacuuming = false;

  const world = toSynapseSpace(p.x, p.y);
  const preChannels = window.getPresynapticUptakeChannels?.() || [];
  const astroChannels = window.getAstrocyteUptakeChannels?.() || [];
  const neuronY = window.SYNAPSE_NEURON_Y ?? 40;
  const preFirst = world.x < ((window.SYNAPSE_PRE_X ?? -130) + (window.SYNAPSE_POST_X ?? 130)) * 0.5;
  const astroActive = world.y < neuronY - 8;
  const channels = [
    ...preChannels.map(c => ({ ...c, kind: "pre" })),
    ...(astroActive ? astroChannels.map(c => ({ ...c, kind: "astro" })) : [])
  ];
  if (!channels.length) return;

  let best = null;
  let bestD = Infinity;

  for (const ch of channels) {
    const d = dist(world.x, world.y, ch.x, ch.y);
    if (d < bestD) {
      bestD = d;
      best = ch;
    }
  }

  if (!best || bestD > 22) return;

  const dx = best.x - world.x;
  const dy = best.y - world.y;
  const d = Math.hypot(dx, dy) || 1;
  const baseSuction =
    best.kind === "pre" ? map(bestD, 0, 22, 0.09, 0.012, true)
    : map(bestD, 0, 22, 0.068, 0.01, true);
  const suction = preFirst && best.kind === "astro" ? baseSuction * 0.55 : baseSuction;
  p.vacuuming = true;

  p.vx += (dx / d) * suction;
  p.vy += (dy / d) * suction;

  const uptakeProb = best.kind === "pre" ? 0.70 : 0.52;
  if (bestD < 3.4 && random() < uptakeProb) {
    p.absorbedBy = best.kind;
    p.rebounded = false;
    p.vacuuming = false;

    // Keep particle alive long enough to visibly enter intracellular space.
    p.maxLife = 170;
    p.life = 170;

    if (best.kind === "pre") {
      // Presynaptic intracellular direction is leftward.
      p.vx = -random(0.10, 0.16);
      p.vy = random(-0.02, 0.02);
    } else {
      // Astrocyte intracellular direction is upward.
      p.vx = random(-0.02, 0.02);
      p.vy = -random(0.10, 0.16);
    }
  }
}


// -----------------------------------------------------
// MAIN UPDATE — FORCE + INTEGRATION ONLY
// -----------------------------------------------------
//
// Expects NT objects of shape:
//   { x, y, vx, vy }
//
// -----------------------------------------------------
window.updateNTMotion = function (nts) {

  if (!Array.isArray(nts) || nts.length === 0) return;

  const useCleftConstraint = cleftPhysicsEnabled();

  for (const p of nts) {
    if (p.absorbedBy) {
      p.vacuuming = false;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      continue;
    }

    const prevY = p.y;
    const releaseRamp = Number.isFinite(p.releaseRamp) ? p.releaseRamp : 0;
    const releaseDirX = Number.isFinite(p.releaseDirX) ? p.releaseDirX : 1;
    const ramp01 = constrain(releaseRamp / 14, 0, 1);

    if (!Number.isFinite(p._swirlTheta)) {
      p._swirlTheta = random(TWO_PI);
      p._swirlOmega = random(-0.05, 0.05);
    }

    // ---------------------------------------------
    // 1️⃣ Apply free-space forces
    // ---------------------------------------------
    p.vx += NT_ADVECT_X;
    p.vx += random(-NT_BROWNIAN, NT_BROWNIAN) * (1 - 0.65 * ramp01);
    p.vy += random(-NT_BROWNIAN, NT_BROWNIAN) * (1 - 0.65 * ramp01);

    p._swirlOmega += random(-NT_SWIRL_JITTER, NT_SWIRL_JITTER);
    p._swirlOmega = constrain(p._swirlOmega, -0.14, 0.14);
    p._swirlTheta += p._swirlOmega;

    p.vx += cos(p._swirlTheta) * NT_MICRO_CURRENT * (1 - 0.55 * ramp01);
    p.vy += sin(p._swirlTheta) * NT_MICRO_CURRENT * 1.35 * (1 - 0.55 * ramp01);

    // Early fusion pore phase: push outward and suppress recoil into vesicle.
    if (releaseRamp > 0) {
      p.vx += releaseDirX * (0.014 * ramp01 + 0.006);

      const along = p.vx * releaseDirX;
      if (along < 0) {
        p.vx *= 0.25;
      }

      p.vy *= (1 - 0.35 * ramp01);
      p.releaseRamp = releaseRamp - 1;
    }

    const lifeSpan = Number.isFinite(p.maxLife) ? p.maxLife : null;
    const lifeNow = Number.isFinite(p.life) ? p.life : null;
    if (lifeSpan && lifeNow !== null && lifeSpan > 0) {
      const age01 = constrain(1 - lifeNow / lifeSpan, 0, 1);
      const ageKick = NT_AGE_DIFFUSION * age01;
      p.vx += random(-ageKick, ageKick);
      p.vy += random(-ageKick * 1.45, ageKick * 1.45);
    }


    // ---------------------------------------------
    // 2️⃣ Predict next position
    // ---------------------------------------------
    let nx = p.x + p.vx;
    let ny = p.y + p.vy;

    // ---------------------------------------------
    // 2.5️⃣ Early vesicle interior containment
    // ---------------------------------------------
    const vesicleContain = Number.isFinite(p.vesicleContain)
      ? p.vesicleContain
      : 0;
    if (
      vesicleContain > 0 &&
      Number.isFinite(p.vesicleX) &&
      Number.isFinite(p.vesicleY)
    ) {
      const r = Number.isFinite(p.vesicleR) ? Math.max(1.5, p.vesicleR) : 7.5;
      const dxV = nx - p.vesicleX;
      const dyV = ny - p.vesicleY;
      const dV = Math.hypot(dxV, dyV);

      if (dV > r) {
        const ux = dxV / (dV || 1);
        const uy = dyV / (dV || 1);

        // Keep point inside vesicle lumen boundary.
        nx = p.vesicleX + ux * r;
        ny = p.vesicleY + uy * r;
        p.x = nx;
        p.y = ny;

        // Reflect outward component so it visually bounces off vesicle wall.
        const vOut = p.vx * ux + p.vy * uy;
        if (vOut > 0) {
          p.vx -= (1 + 0.7) * vOut * ux;
          p.vy -= (1 + 0.7) * vOut * uy;
        }
        p.vx *= 0.92;
        p.vy *= 0.92;
      }

      p.vesicleContain = vesicleContain - 1;
    }


    // ---------------------------------------------
    // 3️⃣ OPTIONAL cleft confinement
    // ---------------------------------------------
    const cleftDelay = Number.isFinite(p.cleftDelay) ? p.cleftDelay : 0;
    if (cleftDelay > 0) {
      p.cleftDelay = cleftDelay - 1;
    }

    if (useCleftConstraint && cleftDelay <= 0) {
      const nextWorld = toSynapseSpace(nx, ny);
      const inside = window.isInsideSynapticCleft(
        nextWorld.x,
        nextWorld.y
      );
      if (inside) {
        // no-op
      } else {
        const projectedWorld = window.projectToSynapticCleft(
          nextWorld.x,
          nextWorld.y
        );
        const projected = fromSynapseSpace(
          projectedWorld.x,
          projectedWorld.y
        );

        const dx = projected.x - nx;
        const dy = projected.y - ny;
        const pen = Math.hypot(dx, dy);

        // Elastic normal response
        p.vx += dx * CLEFT_WALL_K;
        p.vy += dy * CLEFT_WALL_K;

        // Reflect outward normal component to create visible membrane bounce.
        if (pen > 1e-6) {
          const nxIn = dx / pen;
          const nyIn = dy / pen;
          const vN = p.vx * nxIn + p.vy * nyIn;

          if (vN < 0) {
            p.vx -= (1 + MEMBRANE_RESTITUTION) * vN * nxIn;
            p.vy -= (1 + MEMBRANE_RESTITUTION) * vN * nyIn;
          }
        }

        // Tangential damping
        p.vx *= CLEFT_TANGENTIAL_DAMPING;
        p.vy *= CLEFT_TANGENTIAL_DAMPING;
      }
    }

    // ---------------------------------------------
    // 3.5️⃣ Astrocyte membrane response (bounce)
    // ---------------------------------------------
    applyAstrocyteConstraintLocal(p, prevY);


    // ---------------------------------------------
    // 4️⃣ Drag
    // ---------------------------------------------
    p.vx *= NT_DRAG;
    p.vy *= NT_DRAG;


    // ---------------------------------------------
    // 5️⃣ Safety speed clamp
    // ---------------------------------------------
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > NT_MAX_SPEED) {
      const k = NT_MAX_SPEED / speed;
      p.vx *= k;
      p.vy *= k;
    }


    // ---------------------------------------------
    // 6️⃣ Integrate (ONLY place position changes)
    // ---------------------------------------------
    const preIntegrateY = p.y;
    p.x += p.vx;
    p.y += p.vy;

    // Unbound NTs reaching postsynaptic membrane rebound into cleft.
    if (!p.boundToReceptor) {
      const postMembraneX = getPostMembraneLocalX(p.y);
      if (p.x >= postMembraneX - 1.0 && p.vx > 0) {
        p.x = postMembraneX - 1.0;
        p.vx = -Math.max(Math.abs(p.vx), 0.14);
        p.vy += random(-0.018, 0.018);
        p.rebounded = true;
        p.returnArcDir = p.returnArcDir ?? (random() < 0.5 ? -1 : 1);
        p.returnArcPhase = random(TWO_PI);
      }
    }

    // Rebounded NTs sweep back across and around the cleft.
    if (p.rebounded) {
      p.vx -= 0.0062;
      p.vy += sin((frameCount * 0.08) + (p.returnArcPhase || 0)) * 0.0045;

      tryVacuumUptakeForReboundedNT(p);
    }

    // Final positional lock so rendered NT boundary matches astrocyte membrane.
    applyAstrocyteConstraintLocal(p, preIntegrateY);
  }
};


// -----------------------------------------------------
// 🟠 DEBUG DRAW — DELEGATED
// -----------------------------------------------------
window.drawNTConstraintDebug = function () {

  if (!window.SHOW_SYNAPSE_DEBUG) return;

  window.drawSynapticCleftDebug?.();
};


// -----------------------------------------------------
// 🔒 CONTRACT ASSERTION
// -----------------------------------------------------
if (window.DEBUG_SYNapseContracts) {
  console.log("🔒 NTmotion contract: FORCE + INTEGRATION ONLY");
}
