<template>
  <div class="factory-3d-background">
    <canvas ref="canvasRef" class="factory-3d-canvas" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animationId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

const beltItems: THREE.Mesh[] = [];
const robots: THREE.Group[] = [];

const createArm = (x: number, z: number): THREE.Group => {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.5, 0.3, 32),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }),
  );
  base.position.y = 0.15;
  base.castShadow = true;
  group.add(base);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.0, 16),
    new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.4 }),
  );
  post.position.y = 0.65;
  post.castShadow = true;
  group.add(post);

  const upperArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.4 }),
  );
  upperArm.position.set(0, 1.1, 0.35);
  upperArm.castShadow = true;
  group.add(upperArm);

  const foreArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.06, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xff6f00, roughness: 0.4 }),
  );
  foreArm.position.set(0, 0.95, 0.85);
  foreArm.castShadow = true;
  group.add(foreArm);

  const gripper = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.06, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x333333 }),
  );
  gripper.position.set(0, 0.85, 1.25);
  group.add(gripper);

  return group;
};

const createWorker = (x: number, z: number, ry: number): THREE.Group => {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = ry;

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.25, 0.7, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.5 }),
  );
  body.position.y = 0.6;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5 }),
  );
  head.position.y = 1.15;
  group.add(head);

  return group;
};

const createItem = (x: number, z: number): THREE.Mesh => {
  const geometry = new THREE.SphereGeometry(0.16, 12, 10);
  geometry.scale(1, 0.7, 1);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: 0xffb300, roughness: 0.3 }),
  );
  mesh.position.set(x, 0.45, z);
  mesh.castShadow = true;
  return mesh;
};

const initScene = (): void => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const width = canvas.clientWidth || 1;
  const height = canvas.clientHeight || 1;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 14, 14);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5, 12, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.width = 1024;
  dir.shadow.mapSize.height = 1024;
  scene.add(dir);

  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-5, 8, -5);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 16),
    new THREE.MeshStandardMaterial({ color: 0x2c2f36, roughness: 0.8 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(24, 24, 0x555555, 0x3a3a3a);
  grid.position.y = 0.01;
  scene.add(grid);

  const sorterBase = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.6, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7 }),
  );
  sorterBase.position.set(0, 0.3, 0.8);
  sorterBase.receiveShadow = true;
  scene.add(sorterBase);

  for (let i = 0; i < 10; i++) {
    const chute = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.05, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a }),
    );
    chute.position.set(-9 + i * 2, 0.65, 1.4);
    chute.rotation.x = -0.25;
    chute.rotation.y = -0.05 * (i % 2 === 0 ? 1 : -1);
    scene.add(chute);
  }

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.25, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x2e7d32 }),
  );
  belt.position.set(0, 0.125, -2.0);
  belt.receiveShadow = true;
  scene.add(belt);

  const beltSideL = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.35, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x1b5e20 }),
  );
  beltSideL.position.set(0, 0.25, -2.85);
  scene.add(beltSideL);

  const beltSideR = beltSideL.clone();
  beltSideR.position.set(0, 0.25, -1.15);
  scene.add(beltSideR);

  for (let i = 0; i < 18; i++) {
    const item = createItem(10 - i * 1.2, -2.0);
    beltItems.push(item);
    scene.add(item);
  }

  const robotX = [-6, -2, 2, 6];
  for (const x of robotX) {
    const arm = createArm(x, 2.6);
    robots.push(arm);
    scene.add(arm);
  }

  scene.add(createWorker(-11, -3.5, Math.PI / 2));
  scene.add(createWorker(-11, -5.0, Math.PI / 2));
  scene.add(createWorker(0, 5.5, Math.PI));

  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 2.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x5a5a5a }),
  );
  cabinet.position.set(10.5, 1.1, 4.5);
  cabinet.castShadow = true;
  scene.add(cabinet);

  resizeObserver = new ResizeObserver(() => {
    if (!renderer || !camera) return;
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(canvas.parentElement ?? canvas);

  let last = performance.now();
  const animate = (now: number): void => {
    animationId = requestAnimationFrame(animate);
    const dt = (now - last) * 0.001;
    last = now;

    for (const item of beltItems) {
      item.position.x -= 0.8 * dt;
      if (item.position.x < -12) {
        item.position.x = 12;
      }
    }

    const t = now * 0.001;
    robots.forEach((r, i) => {
      r.rotation.y = Math.sin(t * 0.5 + i) * 0.15;
      r.children[2].rotation.x = Math.sin(t + i) * 0.1;
      r.children[3].rotation.x = Math.sin(t * 1.2 + i) * 0.1;
    });

    renderer?.render(scene!, camera!);
  };
  animate(performance.now());
};

onMounted(() => {
  initScene();
});

onUnmounted(() => {
  if (animationId !== null) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  renderer?.dispose();
});
</script>

<style scoped lang="scss">
.factory-3d-background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.factory-3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
