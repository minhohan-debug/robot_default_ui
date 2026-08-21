<template>
  <!--
    통계 메뉴 컨테이너
    - 중앙 RouterView를 통해 탭별 통계 콘텐츠를 fade 전환으로 출력
    - 하단 탭 메뉴: 작업 현황, 작업 이력, 로봇별 작업 이력, (관리자)로봇별 오류 이력
    - 현재 탭에 따라 좌우로 이동하는 인디케이터 효과
  -->
  <div class="statistics-view">
    <div class="content-area">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="String(route.name)" />
        </Transition>
      </RouterView>
    </div>
    <div class="glass-dialog tab-field">
      <div class="tab-indicator" :style="{ transform: `translateX(${selectedIndex * 100}%)` }" />
      <div
        class="tab-item"
        :class="{ selected: route.name === 'TaskStatistics' }"
        @click="navigate('/main/statistics/task-status')"
      >
        {{ t('pages.statistics.taskStatus') }}
      </div>
      <div
        class="tab-item"
        :class="{ selected: route.name === 'TaskHistories' }"
        @click="navigate('/main/statistics/task-histories')"
      >
        {{ t('pages.statistics.taskHistories') }}
      </div>
      <div
        class="tab-item"
        :class="{ selected: route.name === 'RobotTaskHistories' }"
        @click="navigate('/main/statistics/robot-task-histories')"
      >
        {{ t('pages.statistics.robotTaskHistories') }}
      </div>
      <template v-if="isAdmin">
        <div
          class="tab-item"
          :class="{ selected: route.name === 'RobotErrorHistories' }"
          @click="navigate('/main/statistics/robot-error-histories')"
        >
          {{ t('pages.statistics.robotErrorHistories') }}
        </div>
      </template>
    </div>
    <div class="logo-image"><img src="@renderer/assets/images/logo.png" alt="logo" /></div>
  </div>
</template>

<script setup lang="ts">
/**
 * 통계 메뉴 컨테이너
 *
 * - /main/statistics 하위 라우트를 담는 쉘(shell) 뷰입니다.
 * - 하단 탭 메뉴를 클릭하면 /main/statistics/* 경로로 이동합니다.
 * - 탭 순서는 TaskStatistics → TaskHistories → RobotTaskHistories이며,
 *   관리자(isAdmin)인 경우 마지막에 RobotErrorHistories가 추가됩니다.
 * - route.name을 기준으로 현재 선택된 탭 인덱스를 계산하고,
 *   translateX를 이용해 슬라이딩 인디케이터를 표시합니다.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useAdmin } from '@renderer/composables/useAdmin';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const { isAdmin } = useAdmin();

/** 현재 사용자 권한에 따른 탭 표시 순서 (관리자일 때만 오류 이력 탭 추가) */
const tabOrder = computed(() => {
  const order = ['TaskStatistics', 'TaskHistories', 'RobotTaskHistories'];
  if (isAdmin) {
    order.push('RobotErrorHistories');
  }
  return order;
});

/** 현재 라우트 이름에 해당하는 탭 인덱스 (인디케이터 이동용) */
const selectedIndex = computed(() => {
  const idx = tabOrder.value.indexOf(route.name as string);
  return idx >= 0 ? idx : 0;
});

/** 클릭된 탭에 해당하는 /main/statistics/* 경로로 라우터 이동 */
const navigate = (path: string): void => {
  router.push(path);
};
</script>


.statistics-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.content-area {
  position: absolute;
  inset: 0;
  padding-bottom: 9rem;
  overflow: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.tab-field {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  height: 5rem;
  display: flex;
  flex-direction: row;
  z-index: 10;
}

.tab-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 14rem;
  height: 100%;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-gray-50), transparent 50%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.tab-item {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 14rem;
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

.logo-image {
  position: absolute;
  bottom: 3rem;
  right: 2rem;
}
.logo-image img {
  width: 100px;
  opacity: 0.3;
}

