import * as THREE from "three";

// Procedural SKINNED t-shirt. Units: 1 = shoulder width, origin = shoulder midpoint, rest pose = T-pose.
// Bone names follow the Mixamo convention so the same retargeter drives it and your own GLBs.
const clamp = (t) => Math.min(1, Math.max(0, t));

export function buildSkinnedTee(color) {
  const bone = (name, x, y, z, parent) => {
    const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent?.add(b); return b;
  };
  const hips = bone("Hips", 0, -1.3, 0);
  const spine = bone("Spine", 0, 1.3, 0, hips);
  const arm = (s, side) => {
    const u = bone(side + "Arm", s * 0.5, 0, 0, spine);
    const l = bone(side + "ForeArm", s * 0.65, 0, 0, u);
    const h = bone(side + "Hand", s * 0.65, 0, 0, l);
    return [u, l, h];
  };
  const bones = [hips, spine, ...arm(1, "Left"), ...arm(-1, "Right")]; // idx: Left upper arm = 2, Right = 5
  const root = new THREE.Group();
  root.add(hips);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  const skin = (geo, fn) => {
    const p = geo.attributes.position, n = p.count;
    const idx = new Uint16Array(n * 4), w = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const [armIdx, wa] = fn(p.getX(i), p.getY(i));
      idx.set([1, armIdx, 0, 0], i * 4);
      w.set([1 - wa, wa, 0, 0], i * 4);
    }
    geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(idx, 4));
    geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(w, 4));
  };
  // torso: shoulder/armpit vertices blend toward the nearer upper-arm bone
  const torsoW = (x, y) => [x >= 0 ? 2 : 5, 0.6 * clamp((Math.abs(x) - 0.3) / 0.25) * clamp((y + 0.7) / 0.4)];
  const sleeveW = (x) => [x >= 0 ? 2 : 5, 0.5 + 0.5 * clamp((Math.abs(x) - 0.5) / 0.3)];

  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, side: THREE.DoubleSide });
  const meshes = [];

  const body = new THREE.CylinderGeometry(0.55, 0.6, 1.5, 32, 8, true);
  body.scale(1, 1, 0.55); body.translate(0, -0.8, 0); skin(body, torsoW); meshes.push(body);

  const yoke = new THREE.SphereGeometry(0.55, 32, 12, 0, Math.PI * 2, 0.5, Math.PI / 2 - 0.5);
  yoke.scale(1, 0.3, 0.55); yoke.translate(0, -0.05, 0); skin(yoke, torsoW); meshes.push(yoke);

  for (const s of [1, -1]) {
    const sl = new THREE.CylinderGeometry(0.2, 0.25, 0.45, 24, 6, true);
    sl.rotateZ(-s * Math.PI / 2); sl.translate(s * 0.725, 0, 0);
    skin(sl, sleeveW); meshes.push(sl);
  }

  for (const geo of meshes) {
    const m = new THREE.SkinnedMesh(geo, mat);
    m.frustumCulled = false;
    root.add(m);
    m.bind(skeleton, m.matrixWorld);
  }
  return root;
}
