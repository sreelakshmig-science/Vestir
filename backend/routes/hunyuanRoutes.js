// backend/routes/hunyuanRoutes.js
// Proxy between Expo web frontend and local Hunyuan3D-2 Gradio server.
// Uses official @gradio/client for reliable uploads, predictions, and asset extraction.

const express = require('express');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();
const HUNYUAN_BASE = process.env.HUNYUAN_URL || 'http://127.0.0.1:8080';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

let gradioClient = null;

async function getClient() {
  if (!gradioClient) {
    const { Client } = await import('@gradio/client');
    gradioClient = await Client.connect(HUNYUAN_BASE);
  }
  return gradioClient;
}

/** GET /api/hunyuan/status — Check if Hunyuan3D Gradio server is reachable */
router.get('/api/hunyuan/status', async (_req, res) => {
  try {
    const client = await getClient();
    res.json({ ok: true, base: HUNYUAN_BASE });
  } catch (err) {
    gradioClient = null;
    res.status(503).json({ ok: false, error: err.message, base: HUNYUAN_BASE });
  }
});

/**
 * POST /api/hunyuan/generate — Generate a 3D garment GLB from an image.
 * Expects: multipart/form-data with field `image`
 * Returns: model/gltf-binary
 */
router.post('/api/hunyuan/generate', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Missing "image" field in multipart body.' });
  }

  try {
    console.log(`[hunyuan] Connecting to Gradio at ${HUNYUAN_BASE}…`);
    const client = await getClient();

    const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype || 'image/png' });

    console.log(`[hunyuan] ▶ Sending generation job to Hunyuan3D (/generation_all)…`);
    const result = await client.predict('/generation_all', [
      '',          // Text prompt (empty for pure image-to-3D)
      imageBlob,   // Input garment image
      null,        // Front
      null,        // Back
      null,        // Left
      null,        // Right
      5,           // Inference steps (Turbo default: 5)
      5,           // Guidance scale (default: 5)
      1234,        // Seed
      256,         // Octree resolution (default: 256)
      false,       // Remove background (already removed on client)
      8000,        // Number of chunks (default: 8000)
      true,        // Randomize seed
    ]);

    console.log(`[hunyuan]  Generation finished! Finding generated .glb model…`);
    const data = result.data || [];

    let glbPathOrUrl = null;
    // 1. Look for textured_mesh.glb first
    for (const item of data) {
      if (!item) continue;
      const val = item.value || item;
      const p = val.path || val.url || (typeof val === 'string' ? val : '');
      if (typeof p === 'string' && p.includes('textured_mesh.glb')) {
        glbPathOrUrl = p;
        break;
      }
    }
    // 2. Otherwise look for any .glb
    if (!glbPathOrUrl) {
      for (const item of data) {
        if (!item) continue;
        const val = item.value || item;
        const p = val.path || val.url || (typeof val === 'string' ? val : '');
        if (typeof p === 'string' && p.endsWith('.glb')) {
          glbPathOrUrl = p;
          break;
        }
      }
    }

    if (!glbPathOrUrl) {
      throw new Error('No 3D model found in Hunyuan3D output: ' + JSON.stringify(data));
    }

    console.log(`[hunyuan] Loading GLB from ${glbPathOrUrl}…`);
    let glbBuffer;
    if (typeof glbPathOrUrl === 'string' && fs.existsSync(glbPathOrUrl)) {
      glbBuffer = fs.readFileSync(glbPathOrUrl);
    } else {
      const fetchUrl = glbPathOrUrl.startsWith('http')
        ? glbPathOrUrl
        : `${HUNYUAN_BASE}/file=${encodeURIComponent(glbPathOrUrl)}`;
      const fileResp = await fetch(fetchUrl);
      if (!fileResp.ok) throw new Error(`Could not download GLB from server: ${fileResp.status}`);
      glbBuffer = Buffer.from(await fileResp.arrayBuffer());
    }

    console.log(`[hunyuan]  Returning GLB model (${Math.round(glbBuffer.length / 1024)} KB)`);
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', 'attachment; filename="garment.glb"');
    res.send(glbBuffer);
  } catch (err) {
    console.error('[hunyuan]  Generation failed:', err.message);
    let userMsg = err.message;
    if (err.message.includes('CUDA out of memory') || err.message.includes('out of memory')) {
      userMsg = 'GPU Out of Memory: Hunyuan3D-2 requires at least 4-6GB of free VRAM. Please close other GPU-heavy apps, restart the Hunyuan3D window to clear cached memory, or use the "Upload garment model (.glb)" option.';
    }
    if (!res.headersSent) res.status(500).json({ error: userMsg });
  }
});

module.exports = router;
