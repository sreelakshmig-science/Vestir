// src/tryon/bgRemoval.js
//
// In-browser background removal powered by @imgly/background-removal.
// We intentionally avoid a regular `import '@imgly/background-removal'` at
// module level so that Metro's static analyser never tries to bundle the
// WASM/SIMD assets inside onnxruntime-web (Metro would crash on them).
// Instead we use `new Function` to perform a truly dynamic import that Metro
// cannot follow at build time – only the web JS engine resolves it at runtime.

let _module = null;

async function loadBgRemoval() {
  if (!_module) {
    // new Function prevents Metro from statically following this import chain.
    _module = await new Function('u', 'return import(u)')('@imgly/background-removal');
  }
  return _module;
}

/**
 * Remove the background from an image.
 *
 * @param {File | Blob | string} source
 *   A File/Blob object or a URL string pointing to the garment image.
 * @returns {Promise<Blob>}
 *   A transparent PNG Blob containing only the garment pixels.
 */
export async function removeBackground(source) {
  const { removeBackground: removeBg } = await loadBgRemoval();
  return removeBg(source, {
    // 'small' is fastest; swap to 'medium' for noticeably better edge quality.
    model: 'small',
    output: {
      format: 'image/png',
      quality: 1,
    },
  });
}
