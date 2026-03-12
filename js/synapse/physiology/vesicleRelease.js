console.log("⚡ vesicleRelease loaded — CONTINUOUS FUSION (ENDOCYTOSIS-ONLY)");

// =====================================================
// VESICLE RELEASE — SPATIALLY CONTINUOUS (AUTHORITATIVE)
// =====================================================
//
// COORDINATE MODEL (LOCKED):
// • Presynaptic local space
// • Cleft is reached by DECREASING X
// • Vesicles move LEFTWARD (−X) to fuse
//
// CORE MODEL:
// • Fusion progress = spatial overlap with fusion plane
// • NT release begins after 25% overlap
// • Geometry reacts ONLY to v.flatten
//
// CRITICAL BIOLOGICAL RULE (ENFORCED):
// • Fused vesicles NEVER re-enter pool directly
// • Recycling occurs ONLY via membrane endocytosis
//
// =====================================================


// -----------------------------------------------------
// LOCAL SPACE UN-ROTATION (POSTSYNAPTIC SPACE)
// -----------------------------------------------------
function unrotateLocal(x, y) {
  return { x: -x, y: -y };
}


// -----------------------------------------------------
// TIMING (DOCKING ONLY)
// -----------------------------------------------------
const DOCK_TIME = 195;
const RELEASE_JITTER_MIN = 0;
const RELEASE_JITTER_MAX = 18;
const SNARE_STATION_Y = [-108, -72, -36, 0, 36, 72, 108];

function getSnareDockStations() {
  return SNARE_STATION_Y.map((y, id) => {
    const membraneX = window.getSynapticMembraneX?.(y) ?? 0;
    const dockX = membraneX + window.SYNAPSE_VESICLE_STOP_X;
    return {
      id,
      y,
      membraneX,
      x: dockX,
      dockX,
      anchorX: membraneX + window.SYNAPSE_FUSION_PLANE_X
    };
  });
}

function pickDockStationIndex(v, stations, claimed, prevIdx = -1) {
  let bestIdx = -1;
  let bestScore = Infinity;

  for (const st of stations) {
    if (claimed.has(st.id)) continue;

    let score = Math.abs((v.y ?? 0) - st.y);
    if (prevIdx >= 0) {
      const d = Math.abs(st.id - prevIdx);
      if (d === 1) score -= 20;     // prefer adjacent station
      else if (d > 1) score += d * 8;
    }

    if (score < bestScore) {
      bestScore = score;
      bestIdx = st.id;
    }
  }

  return bestIdx;
}


// -----------------------------------------------------
// APPROACH FORCE (CURVED DOCKING PLANE)
// -----------------------------------------------------
function applyDockingForce(v) {

  const targetY =
    Number.isFinite(v.snareStationY)
      ? v.snareStationY
      : v.y + (v.dockBiasY ?? 0);

  const membraneX =
    window.getSynapticMembraneX?.(targetY) ?? 0;

  const targetX =
    membraneX +
    window.SYNAPSE_VESICLE_STOP_X +
    (v.dockBiasX ?? 0);

  const dx = targetX - v.x;
  const dist = Math.abs(dx);

  const strength = map(dist, 0, 40, 0.0012, 0.008, true);
  const pull = constrain(dx * strength, -0.11, 0.11);
  const dy = targetY - v.y;
  const yStrength = map(Math.abs(dy), 0, 60, 0.0015, 0.009, true);
  const yPull = constrain(dy * yStrength, -0.08, 0.08);

  v.vx += pull;
  v.vy += yPull;

  v.x += v.vx;
  v.y += v.vy;

  v.vx *= 0.8;
  v.vy *= 0.92;
}


// -----------------------------------------------------
// AP TRIGGER
// -----------------------------------------------------
function triggerVesicleReleaseFromAP(releaseMode = "all") {

  const vesicles = window.synapseVesicles || [];

  const ready = vesicles.filter(v =>
    v.state === "LOADED" &&
    !v.releaseBias &&
    !v.recycleBias
  );
  ready.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  if (!ready.length) return;

  const stations = getSnareDockStations();
  const claimed = new Set();
  let prevStationIdx = -1;
  const selected = releaseMode === "single" ? ready.slice(0, 1) : ready;

  for (const v of selected) {
    const stationIdx = pickDockStationIndex(v, stations, claimed, prevStationIdx);
    if (stationIdx < 0) continue;
    const station = stations[stationIdx];
    claimed.add(stationIdx);
    prevStationIdx = stationIdx;

    v.releaseBias = true;
    v.recycleBias = false;

    v.owner = "RELEASE";
    v.ownerFrame = frameCount;

    v.dockBiasX = random(-1.2, 1.2);
    v.dockBiasY = 0;
    v.snareStationIndex = stationIdx;
    v.snareStationY = station.y;
    v.snareStationX = station.x;

    v.state = "DOCKING";
    v.timer = -Math.floor(
      random(RELEASE_JITTER_MIN, RELEASE_JITTER_MAX)
    );

    // 🔑 ONLY geometry-facing scalar
    v.flatten = 0;

    // 🔒 release-local flags
    v.__ntStarted   = false;
    v.__mergeLocked = false;

    // 🔑 ensure clean start
    delete v.clipX;

    v.vy *= 0.3;
  }
}


// -----------------------------------------------------
// MAIN UPDATE
// -----------------------------------------------------
function updateVesicleRelease() {

  const vesicles = window.synapseVesicles || [];
  const r = window.SYNAPSE_VESICLE_RADIUS;

  for (let i = vesicles.length - 1; i >= 0; i--) {

    const v = vesicles[i];
    if (!v.releaseBias) continue;

    // =================================================
    // DOCKING
    // =================================================
    if (v.state === "DOCKING") {

      if (v.timer < 0) {
        v.timer++;
        continue;
      }

      applyDockingForce(v);

      if (++v.timer >= DOCK_TIME) {
        v.state = "FUSING";
        v.timer = 0;
      }
    }

    // =================================================
    // FUSING — MOVE TOWARD CLEFT (−X)
    // =================================================
    else if (v.state === "FUSING") {

      // -----------------------------------------------
      // FORWARD MOTION (LEFTWARD)
      // -----------------------------------------------
      v.vx += -0.012;
      if (Number.isFinite(v.snareStationY)) {
        const dy = v.snareStationY - v.y;
        v.vy += constrain(dy * 0.01, -0.08, 0.08);
      }
      v.x  += v.vx;
      v.y  += v.vy;

      v.vx *= 0.92;
      v.vy *= 0.97;

      // -----------------------------------------------
      // CURVED MEMBRANE + FUSION PLANE
      // -----------------------------------------------
      const membraneX =
        window.getSynapticMembraneX?.(v.y) ?? 0;

      const knifeX =
        membraneX + window.SYNAPSE_FUSION_PLANE_X;

      // 🔑 clip ONLY while fusing
      v.clipX = knifeX;

      // -----------------------------------------------
      // EDGE-BASED FUSION PROGRESS (−X)
      // -----------------------------------------------
      const leftEdge = v.x - r;
      const fusionDepth =
        (knifeX - leftEdge) / (2 * r);

      const f = constrain(fusionDepth, 0, 1);
      v.flatten = f;

      // -----------------------------------------------
      // NT RELEASE STARTS AT 25%
      // -----------------------------------------------
      if (f >= 0.25 && !v.__ntStarted) {

        v.__ntStarted = true;
        window.notePostSynapticVesicleRelease?.();

        const p = unrotateLocal(v.x, v.y);

        window.dispatchEvent(new CustomEvent("synapticRelease", {
          detail: {
            x: p.x,
            y: p.y,
            membraneX: p.x,
            normalX: +1,
            strength: 0.5
          }
        }));
      }

      // -----------------------------------------------
      // CONTINUOUS RELEASE WHILE CROSSING
      // -----------------------------------------------
      if (v.__ntStarted && frameCount % 12 === 0 && f < 0.95) {

        const p = unrotateLocal(
          v.x + random(-2, 2),
          v.y + random(-2, 2)
        );

        window.dispatchEvent(new CustomEvent("synapticRelease", {
          detail: {
            x: p.x,
            y: p.y,
            membraneX: p.x,
            normalX: +1,
            strength: 0.4
          }
        }));
      }

      // -----------------------------------------------
      // FULL FUSION → MEMBRANE ENDOCYTOSIS ONLY
      // -----------------------------------------------
      if (f >= 1 && !v.__mergeLocked) {

        v.__mergeLocked = true;
        v.flatten = 1;

        delete v.clipX;
        v.nts = [];

        // 🔑 seed budding EXACTLY at fusion plane
        spawnEndocytosisSeed?.(
          membraneX + window.SYNAPSE_FUSION_PLANE_X,
          v.y
        );

        // 🔥 vesicle ceases to exist after fusion
        vesicles.splice(i, 1);
      }
    }
  }
}


// -----------------------------------------------------
// EXPORTS
// -----------------------------------------------------
window.updateVesicleRelease = updateVesicleRelease;
window.triggerVesicleReleaseFromAP = triggerVesicleReleaseFromAP;
window.getSnareDockStations = getSnareDockStations;
