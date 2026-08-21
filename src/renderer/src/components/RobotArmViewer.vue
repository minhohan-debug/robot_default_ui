<template>
  <div class="robot-arm-viewer">
    <canvas ref="canvasRef" class="robot-arm-canvas" />
    <div v-if="isLoading" class="viewer-status viewer-loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="viewer-status viewer-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * HCR-14 로봇팔 3D 뷰어 컴포넌트
 *
 * - Three.js + URDF-Loader를 사용하여 URDF 모델을 렌더링합니다.
 * - 부모 컴포넌트에서 applyJointAngles()를 호출하여 관절 각도를 갱신합니다.
 * - 모델 경로는 Vite asset import로 처리됩니다.
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import URDFLoader, { type URDFRobot } from 'urdf-loader';

import urdfUrl from '@renderer/assets/3d-model/HCR-14/urdf/HCR-14.urdf?url';
import baseLinkStl from '@renderer/assets/3d-model/HCR-14/meshes/base_link.STL?url';
import link1Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_1.STL?url';
import link2Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_2.STL?url';
import link3Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_3.STL?url';
import link4Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_4.STL?url';
import link5Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_5.STL?url';
import link6Stl from '@renderer/assets/3d-model/HCR-14/meshes/link_6.STL?url';

export interface JointAngles {
  joint_1: number;
  joint_2: number;
  joint_3: number;
  joint_4: number;
  joint_5: number;
  joint_6: number;
}

const { t } = useI18n();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// URDF mesh 파일명 → Vite import된 URL 매핑
const MESH_MAP: Record<string, string> = {
  'base_link.STL': baseLinkStl,
  'link_1.STL': link1Stl,
  'link_2.STL': link2Stl,
  'link_3.STL': link3Stl,
  'link_4.STL': link4Stl,
  'link_5.STL': link5Stl,
  'link_6.STL': link6Stl,
};

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let robot: URDFRobot | null = null;
let animationId: number | null = null;
// Three.js 및 URDF 객체 참조
let resizeObserver: ResizeObserver | null = null;
// 목표/현재 관절 각도(radian)
const targetAngles: Record<string, number> = {};
const currentAngles: Record<string, number> = {};
const DEG2RAD = Math.PI / 180; // 도 → 라디안 변환
const LERP_FACTOR = 0.25; // 관절 보간 계수
const LERP_THRESHOLD = 0.00005; // 보간 종료 임계값
let needsRender = true; // OrbitControls 변경 시 다시 그리기 플래그

/**
 * 부모에서 호출하는 관절 각도 적용
 * @param angles - degree 단위 6축 관절 각도
 */
const applyJointAngles = (angles: JointAngles): void => {
  if (!robot) return;
  for (let i = 1; i <= 6; i++) {
    const key = `joint_${i}`;
    targetAngles[key] = angles[key as keyof JointAngles] * DEG2RAD;
  }
};

/** Three.js 장면, 카메라, 조명, URDF 로봇을 초기화합니다 */
const initScene = (): void => {
  isLoading.value = true;
  error.value = null;
  const canvas = canvasRef.value;
  if (!canvas) return;

  const width = canvas.clientWidth || canvas.offsetWidth || 400;
  const height = canvas.clientHeight || canvas.offsetHeight || 400;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = false;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100);
  camera.position.set(2.0, 1.2, 1.5);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-3, 5, -3);
  scene.add(fillLight);

  const grid = new THREE.GridHelper(6, 12, 0x888888, 0x555555);
  grid.position.y = 0;
  scene.add(grid);

  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.5;
  controls.maxDistance = 8;
  controls.update();
  controls.addEventListener('change', () => {
    needsRender = true;
  });

  const stlLoader = new STLLoader();

  const loader = new URDFLoader();
  const loaderWithMeshCb = loader as unknown as {
    loadMeshCb: (
      path: string,
      manager: THREE.LoadingManager,
      material: THREE.Material,
      onComplete: (obj: THREE.Object3D | null, err?: Error) => void,
    ) => void;
  };
  loaderWithMeshCb.loadMeshCb = (
    path: string,
    _manager: THREE.LoadingManager,
    material: THREE.Material,
    onComplete: (obj: THREE.Object3D | null, err?: Error) => void,
  ): void => {
    const filename = path.split('/').pop() ?? '';
    const url = MESH_MAP[filename];
    if (!url) {
      onComplete(new THREE.Object3D());
      return;
    }
    stlLoader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals();
        const mat = (material as THREE.MeshPhongMaterial).clone?.() ?? material;
        (mat as THREE.MeshPhongMaterial).specular = new THREE.Color(0x444444);
        (mat as THREE.MeshPhongMaterial).shininess = 60;
        const mesh = new THREE.Mesh(geometry, mat);
        onComplete(mesh);
      },
      undefined,
      (err) => {
        console.error('[RobotArmViewer] Mesh load failed:', err);
        onComplete(null, err instanceof Error ? err : new Error(String(err)));
        error.value = t('pages.robotDetail.robotArmMeshLoadFailed');
      },
    );
  };

  loader.load(
    urdfUrl,
    (loadedRobot: URDFRobot) => {
      robot = loadedRobot;
      // URDF는 Z-up 규약 사용, THREE.js는 Y-up이므로 회전 보정
      robot.rotation.x = -Math.PI / 2;
      scene!.add(robot);
      isLoading.value = false;
    },
    undefined,
    (loadErr: unknown) => {
      console.error('[RobotArmViewer] URDF load failed:', loadErr);
      error.value = t('pages.robotDetail.robotArmModelLoadFailed');
      isLoading.value = false;
    },
  );

  resizeObserver = new ResizeObserver(() => {
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth || canvas.offsetWidth;
    const h = canvas.clientHeight || canvas.offsetHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
  });
  resizeObserver.observe(canvas.parentElement ?? canvas);

  const animate = (): void => {
    animationId = requestAnimationFrame(animate);
    let moving = false;
    if (robot) {
      for (let i = 1; i <= 6; i++) {
        const key = `joint_${i}`;
        const target = targetAngles[key] ?? 0;
        const current = currentAngles[key] ?? 0;
        const diff = target - current;
        if (Math.abs(diff) > LERP_THRESHOLD) {
          currentAngles[key] = current + diff * LERP_FACTOR;
          robot.joints[key]?.setJointValue(currentAngles[key]);
          moving = true;
        }
      }
    }
    controls?.update();
    if (moving || needsRender) {
      renderer?.render(scene!, camera!);
      needsRender = false;
    }
  };
  animate();
};

// 부모에서 applyJointAngles()를 호출할 수 있도록 expose
defineExpose({ applyJointAngles });

onMounted(() => {
  initScene();
});

onUnmounted(() => {
  // 애니메이션 및 리소스 정리
  if (animationId !== null) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();
  robot = null;
  scene = null;
  camera = null;
  renderer = null;
  controls = null;
});
</script>

<style scoped>
.robot-arm-viewer {
  position: relative;
  width: 100%;
  height: 100%;
}
.robot-arm-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.viewer-status {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-title);
  font-size: 18px;
  pointer-events: none;
}
.viewer-loading {
  background: rgba(0, 0, 0, 0.4);
}
.viewer-error {
  background: rgba(80, 0, 0, 0.5);
  color: #ffcccc;
}
</style>
