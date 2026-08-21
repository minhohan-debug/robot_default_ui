<template>
  <!-- 배경 웨이브 SVG: 관리자 모드 시 회색, 일반 사용자 시 주요 색상 적용 -->
  <svg class="wave-background" :class="{ admin: isAdmin }" viewBox="0 0 2880 500" preserveAspectRatio="none">
    <defs>
      <linearGradient id="wave-grad-1" x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-500);stop-opacity:0.35'
              : 'stop-color:var(--color-primary-500);stop-opacity:0.35'
          "
        />
        <stop
          offset="100%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-700);stop-opacity:0.05'
              : 'stop-color:var(--color-primary-700);stop-opacity:0.05'
          "
        />
      </linearGradient>
      <linearGradient id="wave-grad-2" x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-400);stop-opacity:0.45'
              : 'stop-color:var(--color-primary-400);stop-opacity:0.45'
          "
        />
        <stop
          offset="100%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-600);stop-opacity:0.1'
              : 'stop-color:var(--color-primary-600);stop-opacity:0.1'
          "
        />
      </linearGradient>
      <linearGradient id="wave-grad-3" x1="0" y1="0" x2="0" y2="1">
        <stop
          offset="0%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-300);stop-opacity:0.55'
              : 'stop-color:var(--color-primary-300);stop-opacity:0.55'
          "
        />
        <stop
          offset="100%"
          :style="
            isAdmin
              ? 'stop-color:var(--color-gray-500);stop-opacity:0.15'
              : 'stop-color:var(--color-primary-500);stop-opacity:0.15'
          "
        />
      </linearGradient>
      <filter id="wave-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    <path
      class="wave wave-back"
      fill="url(#wave-grad-1)"
      filter="url(#wave-blur)"
      d="M0,140 Q360,60 720,140 T1440,140 T2160,140 T2880,140 L2880,500 L0,500 Z"
    />
    <path
      class="wave wave-mid"
      fill="url(#wave-grad-2)"
      filter="url(#wave-blur)"
      d="M0,180 Q360,100 720,180 T1440,180 T2160,180 T2880,180 L2880,500 L0,500 Z"
    />
    <path
      class="wave wave-front"
      fill="url(#wave-grad-3)"
      d="M0,220 Q360,160 720,220 T1440,220 T2160,220 T2880,220 L2880,500 L0,500 Z"
    />
  </svg>
</template>

<script setup lang="ts">
/**
 * 배경 웨이브 SVG 컴포넌트
 *
 * - 로그인/메인 화면 하단에 그라데이션 물결 배경을 렌더링합니다.
 * - isAdmin prop이 없으면 현재 사용자 권한에 따라 색상이 결정됩니다.
 */
import { computed } from 'vue';
import { useAuth } from '@renderer/composables/useAuth';

// isAdmin prop이 우선, 없으면 인증 상태 기준
const props = defineProps<{ isAdmin?: boolean }>();
const { isAdmin: authIsAdmin } = useAuth();
const isAdmin = computed(() => props.isAdmin ?? authIsAdmin.value);
</script>

<style scoped lang="scss">
.wave-background {
  position: absolute;
  bottom: -100px;
  left: 0;
  width: 200%;
  height: 45%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.35;
}

.wave {
  stroke: none;
}

.wave-back {
  animation: waveMove 16s linear infinite;
}

.wave-mid {
  animation: waveMove 12s linear infinite reverse;
}

.wave-front {
  animation: waveMove 8s linear infinite;
}

@keyframes waveMove {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
