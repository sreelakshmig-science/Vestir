const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs';

let visionPromise;

export function loadVisionTasks() {
  if (!visionPromise) {
    // MediaPipe's worker imports are unsupported by Metro's static transform.
    const importBrowserModule = new Function('url', 'return import(url)');
    visionPromise = importBrowserModule(VISION_URL).catch((error) => {
      visionPromise = null;
      throw error;
    });
  }
  return visionPromise;
}
