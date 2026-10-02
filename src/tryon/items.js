import * as THREE from "three";

// Offsets are in MediaPipe canonical-face units (~1 unit = 1 cm), origin = middle of the head.
export const DEFAULTS = {
  glasses: { y: 3.0, z: 5.5 },
  hat: { y: 7.5, z: -0.5 },
};

export function buildItem(type, color = "#111111") {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.35 });

  if (type === "glasses") {
    const ring = new THREE.TorusGeometry(2.1, 0.2, 16, 48);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x223344, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    });
    for (const s of [-1, 1]) {
      const frame = new THREE.Mesh(ring, mat);
      frame.position.x = s * 3.2;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(2.1, 32), lensMat);
      lens.position.x = s * 3.2;
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 9), mat);
      temple.position.set(s * 5.4, 0.3, -4.5);
      g.add(frame, lens, temple);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.25), mat);
    bridge.position.y = 0.6;
    g.add(bridge);
  }

  if (type === "hat") {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 5, 40), mat);
    crown.position.y = 2.5;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 0.4, 48), mat);
    g.add(crown, brim);
  }
  return g;
}

export function disposeItem(obj) {
  obj.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose?.();
  });
}
