// src/tryon/hunyuanClient.js
//
// Browser-side client for the Hunyuan3D generation pipeline.
// Calls the Express proxy on :3000, never talks to the Gradio server directly.

// Change this if your backend runs on a different port.
const API_BASE = 'http://localhost:3000';

/**
 * Check whether the Express backend (and through it, Hunyuan3D) is reachable.
 * Safe to call frequently – times out in 4 seconds.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function checkHunyuanStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/hunyuan/status`, {
      signal: AbortSignal.timeout(4_000),
    });
    const data = await res.json();
    return { ok: data.ok === true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Generate a 3D garment GLB from an image Blob.
 *
 * 1. Posts the image to /api/hunyuan/generate (multipart).
 * 2. The Express backend uploads to Gradio, queues generation, streams SSE,
 *    downloads the resulting GLB and pipes it back.
 * 3. Returns an Object URL (blob:…) pointing to the GLB that can be fed
 *    directly into ClothesLayer.setGarment({ kind:'glb', url }).
 *
 * Generation typically takes 1–5 minutes depending on your GPU.
 *
 * @param {Blob} imageBlob - PNG/JPEG image, ideally already background-removed.
 * @param {(message: string) => void} [onProgress] - called with status strings.
 * @returns {Promise<string>} Object URL for the generated GLB.
 */
export async function generateGarmentGlb(imageBlob, onProgress = () => {}) {
  onProgress('Sending image to Hunyuan3D…');

  const form = new FormData();
  form.append('image', imageBlob, 'garment.png');

  let res;
  try {
    res = await fetch(`${API_BASE}/api/hunyuan/generate`, {
      method: 'POST',
      body: form,
      // 10-minute timeout – Hunyuan3D generation can be slow on CPU.
      signal: AbortSignal.timeout(10 * 60 * 1000),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error(
        'Generation timed out after 10 minutes. ' +
        'Try again or check the Hunyuan3D server for errors.',
      );
    }
    throw new Error(
      `Could not reach the backend. Is the Express server running on port 3000? (${err.message})`,
    );
  }

  if (!res.ok) {
    let msg = `Generation failed (HTTP ${res.status})`;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }

  onProgress('Downloading 3D model…');
  const buf = await res.arrayBuffer();

  const glbBlob = new Blob([buf], { type: 'model/gltf-binary' });
  return URL.createObjectURL(glbBlob);
}
