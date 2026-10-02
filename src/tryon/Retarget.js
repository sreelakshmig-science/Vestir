import * as THREE from "three";

// ---- Bone discovery: matches Mixamo / Ready Player Me / Blender-style humanoid names ----
const BASES = {
  UpperArm: ["arm", "upperarm"], LowerArm: ["forearm", "lowerarm"], Hand: ["hand"],
  UpLeg: ["upleg", "upperleg", "thigh"], Leg: ["leg", "lowerleg", "calf", "shin"], Foot: ["foot"],
};
const KEYS = [];
for (const [side, p] of [["left", "l"], ["right", "r"]])
  for (const [b, syn] of Object.entries(BASES))
    KEYS.push({
      key: p + b,
      names: syn.flatMap((s) => [side + s, s + side, p + s, s + p]),
    });
const norm = (n) => n.toLowerCase().replace(/^mixamorig/, "").replace(/[^a-z]/g, "");

export function findBones(root) {
  const map = {};
  root.traverse((o) => {
    if (!o.isBone) return;
    const n = norm(o.name);
    for (const k of KEYS) if (!map[k.key] && k.names.includes(n)) map[k.key] = o;
  });
  return map;
}

// [bone, child bone, MediaPipe landmark at bone, landmark at child]
// MediaPipe 11/13/15 = subject's LEFT arm, which sits on +X for a model facing +Z.
export const CHAINS = [
  ["lUpperArm", "lLowerArm", 11, 13], ["lLowerArm", "lHand", 13, 15],
  ["rUpperArm", "rLowerArm", 12, 14], ["rLowerArm", "rHand", 14, 16],
  ["lUpLeg", "lLeg", 23, 25], ["lLeg", "lFoot", 25, 27],
  ["rUpLeg", "rLeg", 24, 26], ["rLeg", "rFoot", 26, 28],
];

export function makeRig(root) {
  const map = findBones(root);
  const rest = new Map();
  root.traverse((o) => o.isBone && rest.set(o, o.quaternion.clone()));
  return { map, rest, smooth: new Map() };
}

const v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const qd = new THREE.Quaternion(), qw = new THREE.Quaternion(), qp = new THREE.Quaternion();

// Rotate `bone` (from its rest pose) so the direction bone -> child points along `target` (world space).
// Works for any rest pose (T-pose, A-pose...) because it only uses world-space directions.
export function aimBone(rig, bone, child, target, smoothing = 0.5) {
  bone.quaternion.copy(rig.rest.get(bone));
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(true, false);
  const cur = child.getWorldPosition(v1).sub(bone.getWorldPosition(v2)).normalize();
  qd.setFromUnitVectors(cur, target);
  bone.getWorldQuaternion(qw).premultiply(qd);
  bone.parent.getWorldQuaternion(qp);
  const local = qp.invert().multiply(qw);
  let s = rig.smooth.get(bone);
  if (!s) rig.smooth.set(bone, (s = local.clone())); else s.slerp(local, smoothing);
  bone.quaternion.copy(s);
  bone.updateMatrixWorld(true);
}
