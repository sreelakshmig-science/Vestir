import * as THREE from "three";
import { ClothesLayer } from "./ClothesLayer";
import { buildItem, disposeItem, DEFAULTS } from "./items";
import { loadVisionTasks } from "./loadVisionTasks";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export class TryOnEngine {
  constructor(box, video) {
    this.box = box;
    this.video = video;
    this.anchor = new THREE.Object3D(); // follows the head
    this.anchor.visible = false;
    this.item = null;
    this.seen = false;
    this.lastTime = -1;
    this.running = false;
    this.mode = "face";
    this.p = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3();
    this.m = new THREE.Matrix4();
  }

  async start() {
    // 1. Camera
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    this.video.srcObject = this.stream;
    await this.video.play();
    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    this.box.style.aspectRatio = `${vw} / ${vh}`;

    // 2. MediaPipe Face Landmarker (returns a 4x4 head pose matrix)
    this.vision = await loadVisionTasks();
    const fileset = await this.vision.FilesetResolver.forVisionTasks(WASM);
    this.fileset = fileset; this.vw = vw; this.vh = vh;
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFacialTransformationMatrixes: true,
    });
    try {
      this.landmarker = await this.vision.FaceLandmarker.createFromOptions(fileset, opts("GPU"));
    } catch {
      this.landmarker = await this.vision.FaceLandmarker.createFromOptions(fileset, opts("CPU"));
    }

    // 3. Three.js. FOV 63 matches MediaPipe's face-geometry virtual camera.
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.localClippingEnabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(this.renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    this.box.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(63, vw / vh, 1, 10000);
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(0, 20, 40);
    this.scene.add(key, this.anchor);

    this.ro = new ResizeObserver(() => {
      this.renderer.setSize(this.box.clientWidth, this.box.clientHeight, false);
    });
    this.ro.observe(this.box);
    this.renderer.setSize(this.box.clientWidth, this.box.clientHeight, false);

    this.running = true;
    this.loop();
  }

  setItem(type, color, adj = { y: 0, z: 0, s: 1 }) {
    if (this.item) {
      this.anchor.remove(this.item);
      disposeItem(this.item);
      this.item = null;
    }
    if (type === "none") return;
    const d = DEFAULTS[type];
    this.item = buildItem(type, color);
    this.item.position.set(0, d.y + adj.y, d.z + adj.z);
    this.item.scale.setScalar(adj.s);
    this.anchor.add(this.item);
  }

  ensureClothes() {
    this.clothesReady ??= (async () => {
      const c = new ClothesLayer(this.vw, this.vh);
      await c.init(this.fileset, this.vision.PoseLandmarker);
      this.clothes = c;
    })();
    return this.clothesReady;
  }

  async setMode(mode) {
    if (mode === "clothes") await this.ensureClothes();
    this.mode = mode;
  }

  async setGarment(spec, adj) {
    await this.ensureClothes();
    return this.clothes.setGarment(spec, adj);
  }

  loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const v = this.video;
    if (this.mode === "clothes" && this.clothes) {
      if (v.readyState >= 2 && v.currentTime !== this.lastTime) {
        this.lastTime = v.currentTime;
        this.clothes.update(v, performance.now());
      }
      this.renderer.render(this.clothes.scene, this.clothes.camera);
      return;
    }
    if (v.readyState >= 2 && v.currentTime !== this.lastTime) {
      this.lastTime = v.currentTime;
      const res = this.landmarker.detectForVideo(v, performance.now());
      const data = res.facialTransformationMatrixes?.[0]?.data;
      if (data) {
        this.m.fromArray(data).decompose(this.p, this.q, this.s);
        if (!this.seen) {
          this.anchor.position.copy(this.p);
          this.anchor.quaternion.copy(this.q);
          this.anchor.scale.copy(this.s);
          this.seen = true;
        } else {
          // low-pass filter to reduce jitter
          this.anchor.position.lerp(this.p, 0.6);
          this.anchor.quaternion.slerp(this.q, 0.6);
          this.anchor.scale.lerp(this.s, 0.6);
        }
        this.anchor.visible = true;
      } else {
        this.anchor.visible = false;
        this.seen = false;
      }
    }
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.running = false;
    this.ro?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.landmarker?.close();
    this.clothes?.dispose();
    if (this.item) disposeItem(this.item);
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
