<template>
  <!--
    메인 레이아웃 화면
    - 중앙 RouterView: /main/* 하위 라우트를 fade 전환으로 출력
    - 좌측 상단 메뉴: task-status, statistics, robot-setting, sorting-setting (관리자만 일부)
    - 좌측 메뉴 아래 이동하는 인디케이터로 현재 탭 시각화
    - 상단 중앙: 1초마다 갱신되는 실시간 시계
    - 우측 상단: 앱 설정(테마/언어/로그아웃) 다이얼로그 오픈 버튼
  -->
  <div class="main-wrapper">
    <WaveBackground />
    <div class="content-area">
      <RouterView v-slot="{ Component }">
        <Transition name="fade">
          <component :is="Component" :key="String(topRouteName)" />
        </Transition>
      </RouterView>
    </div>
    <div class="clock-field">{{ currentTime }}</div>
    <div class="glass-dialog menu-field">
      <div class="menu-indicator" :style="{ transform: `translateX(${selectedIndex * 100}%)` }" />
      <div class="menu-item" :class="{ selected: route.name === 'TaskStatus' }" @click="navigate('/main/task-status')">
        {{ t('pages.main.menu.robotStatus') }}
      </div>
      <div class="menu-item" :class="{ selected: topRouteName === 'Statistics' }" @click="navigate('/main/statistics')">
        {{ t('pages.main.menu.statistics') }}
      </div>
      <template v-if="isAdmin">
        <div
          class="menu-item"
          :class="{ selected: route.name === 'RobotSetting' }"
          @click="navigate('/main/robot-setting')"
        >
          {{ t('pages.main.menu.robotSetting') }}
        </div>
        <div
          class="menu-item"
          :class="{ selected: route.name === 'SortingSetting' }"
          @click="navigate('/main/sorting-setting')"
        >
          {{ t('pages.main.menu.sortingSetting') }}
        </div>
      </template>
    </div>
    <div class="glass-dialog app-setting-field" @click="showSetting = true">
      <div>{{ t('pages.main.menu.appSetting') }}</div>
    </div>
    <SettingDialogView v-model:visible="showSetting" />
  </div>
</template>

<script setup lang="ts">
/**
 * 메인 레이아웃 화면
 *
 * - /main 하위 라우트의 공통 레이아웃을 담당합니다.
 * - 좌측 상단에 탭 메뉴를 배치하고 현재 탭에 따라 인디케이터를 이동시킵니다.
 * - 관리자(isAdmin)가 아닐 경우 설정/통계 등 일부 메뉴가 노출되지 않습니다.
 * - 상단 중앙에는 1초마다 업데이트되는 시계를 표시합니다.
 * - 우측 상단 설정 버튼 클릭 시 SettingDialogView를 엽니다.
 * - 중앙은 RouterView로 하위 탭 콘텐츠를 전환합니다.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useAdmin } from '@renderer/composables/useAdmin';
import SettingDialogView from '@renderer/views/main/dialog/SettingDialogView.vue';
import WaveBackground from '@renderer/components/WaveBackground.vue';

// 메뉴 항목의 표시 순서; 인덱스로 인디케이터 위치를 계산합니다
const MENU_ORDER = ['TaskStatus', 'Statistics', 'RobotSetting', 'SortingSetting'];

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { isAdmin } = useAdmin();
const showSetting = ref(false);
/** 현재 라우트의 최상위 메뉴 이름(중첩 라우트 시 2번째 매칭 사용, 아니면 현재 라우트 이름) */
const topRouteName = computed(() => route.matched[1]?.name ?? route.name);
/** topRouteName이 MENU_ORDER에서 몇 번째인지 (인디케이터 이동용) */
const selectedIndex = computed(() => MENU_ORDER.indexOf(topRouteName.value as string));

/**
 * 메뉴 클릭 시 지정된 하위 경로로 라우터 이동
 * @param path - 이동할 /main/* 하위 경로
 */
const navigate = (path: string): void => {
  router.push(path);
};

/**
 * Date 객체를 'YYYY-MM-DD HH:MM:SS' 형식의 문자열로 변환합니다.
 * @param d - 변환할 Date
 * @returns '2026-08-19 09:24:00' 형태의 문자열
 */
const formatDateTime = (d: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const currentTime = ref(formatDateTime(new Date())); // 현재 시각 문자열
let timer: ReturnType<typeof setInterval>; // 시계 인터벌 타이머 참조

/** 마운트 시 1초마다 시계 갱신 */
onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = formatDateTime(new Date());
  }, 1000);
});
/** 언마운트 시 인터벌 타이머 정리 (메모리 누수 방지) */
onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped lang="scss">
// ==========================================
// 전체 레이아웃: 화면 전체를 채우는 래퍼
// ==========================================

.main-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: var(--bg-surface);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.content-area {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

// ==========================================
// 상단 UI: 시계, 메뉴, 설정 버튼
// ==========================================

.clock-field {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  height: 5rem;
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-button);
  pointer-events: none;
  z-index: 10;
}

.menu-field {
  position: absolute;
  top: 2rem;
  left: 2rem;
  height: 5rem;
  display: flex;
  flex-direction: row;
  z-index: 10;
}

.menu-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 10rem;
  height: 100%;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-gray-50), transparent 50%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.menu-item {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 10rem;
  font-size: 20px;
  border-radius: 8px;
  color: color-mix(in srgb, var(--text-button), transparent 50%);
  transition: color 0.3s ease;
  z-index: 1;
  cursor: pointer;

  &.selected {
    color: color-mix(in srgb, var(--text-button), transparent 10%);
  }
}

.app-setting-field {
  position: absolute;
  top: 2rem;
  right: 2rem;
  height: 5rem;
  display: flex;
  flex-direction: row;
  z-index: 10;

  div {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 10rem;
    font-size: 20px;
    border-radius: 8px;
    color: color-mix(in srgb, var(--text-button), transparent 10%);
    transition: color 0.3s ease;
    z-index: 1;
    cursor: pointer;
  }
}

// ==========================================
// 페이지 전환 애니메이션: fade in/out
// ==========================================

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
