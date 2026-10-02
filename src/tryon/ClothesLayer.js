import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { makeRig, aimBone, CHAINS } from "./Retarget";
import { buildSkinnedTee } from "./SkinnedTee";

const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// If turning your body makes the garment rotate the wrong way, flip this to -1.
const Z_SIGN = 1;
const POSE_SMOOTHING_SECONDS = 0.1;
const LOST_POSE_GRACE_MS = 150;

// Garment space: 1 unit = shoulder width, origin = shoulder midpoint, +Y up, +Z toward camera.
function disposeTree(o) {
  const materials = new Set();
  const textures = new Set();
  o.traverse((n) => {
    n.geometry?.dispose();
    const meshMaterials = Array.isArray(n.material) ? n.material : [n.material];
    meshMaterials.forEach((material) => {
      if (!material) return;
      materials.add(material);
      Object.values(material).forEach((value) => value?.isTexture && textures.add(value));
    });
  });
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

function clipToFront(root, plane) {
  const clonedMaterials = new Map();
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;

    const addClip = (material) => {
      if (!material) return material;
      let clipped = clonedMaterials.get(material);
      if (!clipped) {
        clipped = material.clone();
        clipped.clippingPlanes = [...(material.clippingPlanes ?? []), plane];
        clipped.needsUpdate = true;
        clonedMaterials.set(material, clipped);
      }
      return clipped;
    };

    object.material = Array.isArray(object.material)
      ? object.material.map(addClip)
      : addClip(object.material);
  });
}

export class ClothesLayer {
  constructor(vw, vh) {
    this.vw = vw; this.vh = vh;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, vw, vh, 0, 0.1, 4000);
    this.camera.position.z = 2000;
    this.frontPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.frontNormal = new THREE.Vector3(0, 0, 1);
    this.frontOrigin = new THREE.Vector3();
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(vw / 2, vh, 1500);
    this.scene.add(key);

    this.torso = new THREE.Group();   // follows shoulders (position / rotation / scale)
    this.holder = new THREE.Group();  // user offsets
    this.torso.add(this.holder);
    this.torso.visible = false;
    this.scene.add(this.torso);

    this.adj = { s: 1, y: 0, z: 0 };
    this.key = "";
    this.sm = null;
    this.garment = null;
    this.rig = null;
  }

  async init(fileset, PoseLandmarker) {
    const opts = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    try { this.landmarker = await PoseLandmarker.createFromOptions(fileset, opts("GPU")); }
    catch { this.landmarker = await PoseLandmarker.createFromOptions(fileset, opts("CPU")); }
  }

  clearGarment() {
    if (this.garment) { this.holder.remove(this.garment); disposeTree(this.garment); }
    this.garment = null; this.rig = null;
  }

  attach(obj, rig) { this.garment = obj; this.rig = rig; this.holder.add(obj); }

  buildTee(color) { const t = buildSkinnedTee(color); this.attach(t, makeRig(t)); }

  loadGlb(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(url, (gltf) => {
        if (this.key !== "glb:" + url) {
          disposeTree(gltf.scene);
          resolve();
          return;
        }

        try {
          const obj = gltf.scene;
          obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
          obj.updateMatrixWorld(true);
          const rig = makeRig(obj);
          const wrap = new THREE.Group();
          wrap.add(obj);
          const { lUpperArm: L, rUpperArm: R } = rig.map;
          if (L && R) {
            // Skinned garment: origin = shoulder midpoint, scale so shoulder-joint distance = 1
            const a = L.getWorldPosition(new THREE.Vector3()), b = R.getWorldPosition(new THREE.Vector3());
            const shoulderWidth = a.distanceTo(b);
            if (!Number.isFinite(shoulderWidth) || shoulderWidth < 1e-6) {
              throw new Error("The GLB has invalid shoulder bones and cannot be fitted.");
            }
            const scale = 1 / shoulderWidth;
            const shoulderMidpoint = a.add(b).multiplyScalar(0.5);
            wrap.scale.setScalar(scale);
            wrap.position.copy(shoulderMidpoint).multiplyScalar(-scale);
            this.attach(wrap, rig);
          } else {
            // No humanoid arm bones found: fall back to a rigid garment (width = 1.5 shoulder widths)
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
            if (!Number.isFinite(size.x) || size.x < 1e-6) {
              throw new Error("The GLB is empty or has no usable garment mesh.");
            }
            const scale = 1.5 / size.x;
            wrap.scale.setScalar(scale);
            wrap.position.set(-c.x * scale, 0.1 - box.max.y * scale, -c.z * scale);
            console.warn("No humanoid arm bones found in GLB - using rigid placement.");
            this.attach(wrap, null);
          }
          clipToFront(obj, this.frontPlane);
          resolve();
        } catch (error) {
          disposeTree(gltf.scene);
          reject(error);
        }
      }, undefined, (error) => {
        if (this.key !== "glb:" + url) {
          resolve();
          return;
        }
        this.key = "";
        reject(new Error(`Could not load the .glb model: ${error?.message || "invalid or unsupported file"}`));
      });
    });
  }

  // spec: {kind:"tee", color} | {kind:"glb", url}
  setGarment(spec, adj) {
    this.adj = adj;
    const key = spec.kind === "glb" ? "glb:" + spec.url : "tee:" + spec.color;
    if (key === this.key) return this.loadingGarment;

    this.key = key;
    this.clearGarment();
    if (spec.kind !== "glb") {
      this.loadingGarment = Promise.resolve(this.buildTee(spec.color));
      return this.loadingGarment;
    }

    const loading = this.loadGlb(spec.url);
    this.loadingGarment = loading.finally(() => {
      if (this.loadingGarment === wrappedLoading) this.loadingGarment = null;
    });
    const wrappedLoading = this.loadingGarment;
    return wrappedLoading;
  }

  update(video, ts) {
    const res = this.landmarker.detectForVideo(video, ts);
    const lm = res.landmarks?.[0], wl = res.worldLandmarks?.[0];
    const vis = (i) => lm?.[i]?.visibility ?? 0;
    if (!lm || !wl || vis(11) < 0.5 || vis(12) < 0.5) {
      if (!this.sm || ts - this.sm.lastSeen > LOST_POSE_GRACE_MS) {
        this.torso.visible = false;
        this.sm = null;
      }
      return;
    }

    const px = (l) => new THREE.Vector3(l.x * this.vw, (1 - l.y) * this.vh, 0);
    const w3 = (l) => new THREE.Vector3(l.x, -l.y, -l.z * Z_SIGN); // metres, y up, z toward camera
    const A = px(lm[12]), B = px(lm[11]);

    // Root (torso) orientation from 3D world landmarks
    const xAxis = w3(wl[11]).sub(w3(wl[12])).normalize();
    let up;
    if (vis(23) > 0.5 && vis(24) > 0.5) {
      const sM = w3(wl[11]).add(w3(wl[12])).multiplyScalar(0.5);
      const hM = w3(wl[23]).add(w3(wl[24])).multiplyScalar(0.5);
      up = sM.sub(hM).normalize();
    } else {
      up = new THREE.Vector3(-xAxis.y, xAxis.x, 0).normalize(); // hips off-screen: roll only
    }
    const zAxis = new THREE.Vector3().crossVectors(xAxis, up).normalize();
    up = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, up, zAxis));

    const fx = Math.min(1, Math.max(0.4, Math.hypot(xAxis.x, xAxis.y)));
    const scale = A.distanceTo(B) / fx;
    const pos = A.clone().add(B).multiplyScalar(0.5);
    let smoothing = 1;
    if (!this.sm) this.sm = { pos, q, scale, ts, lastSeen: ts };
    else {
      const dt = Math.min(0.1, Math.max(1 / 120, (ts - this.sm.ts) / 1000));
      smoothing = 1 - Math.exp(-dt / POSE_SMOOTHING_SECONDS);
      this.sm.pos.lerp(pos, smoothing);
      this.sm.q.slerp(q, smoothing);
      this.sm.scale += (scale - this.sm.scale) * smoothing;
      this.sm.ts = ts;
      this.sm.lastSeen = ts;
    }

    const { adj } = this;
    this.torso.position.copy(this.sm.pos);
    this.torso.quaternion.copy(this.sm.q);
    this.torso.scale.setScalar(this.sm.scale);
    this.holder.position.set(0, adj.y, adj.z);
    this.holder.scale.setScalar(adj.s);
    this.torso.visible = true;
    this.torso.updateMatrixWorld(true);

    this.torso.getWorldPosition(this.frontOrigin);
    this.frontPlane.setFromNormalAndCoplanarPoint(this.frontNormal, this.frontOrigin);

    // Skinned garment: aim every limb bone at the matching MediaPipe limb direction
    if (this.rig) {
      const { map } = this.rig;
      for (const [a, b, from, to] of CHAINS) {
        const bone = map[a];
        const child = map[b] ?? bone?.children.find((c) => c.isBone);
        if (!bone || !child) continue;
        const dir = vis(from) > 0.5 && vis(to) > 0.5
          ? w3(wl[to]).sub(w3(wl[from])).normalize()
          : up.clone().negate();                      // not visible: let the limb hang down
        aimBone(this.rig, bone, child, dir, smoothing);
      }
    }
  }

  dispose() {
    this.landmarker?.close();
    this.clearGarment();
  }
}
