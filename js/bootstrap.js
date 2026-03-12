async function initWasm() {
  try {
    const wasmModule = await import("../wasm/ngvu_wasm.js");
    await wasmModule.default();

    window.ngvuWasm = {
      wasmBuildId: wasmModule.wasm_build_id,
      weightedSignalSum: wasmModule.weighted_signal_sum
    };

    document.body.dataset.wasmBuild = wasmModule.wasm_build_id();
  } catch (error) {
    console.warn("WASM bootstrap skipped:", error);
  }
}

initWasm();
