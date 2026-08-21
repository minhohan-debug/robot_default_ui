<template>
  <div class="robot-error-histories-view">
    <DateTimeSearchPanel
      v-model:date="searchDate"
      v-model:start-time="searchStartTime"
      v-model:end-time="searchEndTime"
      @search="fetchHistories"
    />
    <div class="chart-field" :style="{ gridTemplateColumns: `repeat(${robotList.length || 1}, minmax(0, 1fr))` }">
      <div v-for="robot in robotList" :key="robot.robot_id" class="glass-dialog chart-card">
        <div class="chart-title">{{ t('pages.taskStatus.robot.robot_id', { id: robot.robot_id }) }}</div>
        <div class="chart-content">
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
          <PDataTable
            v-else
            :value="errorMap[robot.robot_id] ?? []"
            data-key="uid"
            scrollable
            scroll-height="flex"
            :empty-message="t('pages.robotErrorHistories.noData')"
            row-hover
            :row-class="rowClass"
          >
            <PColumn field="occurred_at" :header="t('pages.robotErrorHistories.columns.occurredAt')">
              <template #body="{ data }">{{ data.occurred_at?.split(' ')[1] ?? data.occurred_at }}</template>
            </PColumn>
            <PColumn field="code" :header="t('pages.robotErrorHistories.columns.code')" />
            <PColumn field="message" :header="t('pages.robotErrorHistories.columns.message')">
              <template #body="{ data }">
                <span class="message-text" :title="data.message">{{ data.message }}</span>
              </template>
            </PColumn>
          </PDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 로봇별 오류 이력 탭 화면 (관리자 전용)
 *
 * - StatisticsView에서 isAdmin일 때만 노출되는 탭입니다.
 * - 로봇별로 발생한 오류 이력 테이블을 가로로 배치합니다.
 * - ErrorHistorySocket을 통해 실시간 오류 데이터를 수신합니다.
 * - useRobotHistoryList로 robot_id별 오류 관리, 중복 제거, new-row 하이라이트 처리
 * - occurred_at은 시간만 추출하여 표시, code와 message 필드 노출
 */
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdmin } from '@renderer/composables/useAdmin';
import { getRobotList } from '@renderer/services/api/robot';
import { ErrorHistorySocket } from '@renderer/services/websocket/errorHistory';
import { useDateTimeSearch } from '@renderer/composables/useDateTimeSearch';
import { useRobotHistoryList } from '@renderer/composables/useRobotHistoryList';
import DateTimeSearchPanel from '@renderer/components/common/DateTimeSearchPanel.vue';
import type { Robot, RobotErrorHistoryItem } from '@renderer/types/robot';

const { t } = useI18n();
const { isAdmin } = useAdmin();

const { searchDate, searchStartTime, searchEndTime, toDatetimeParam } = useDateTimeSearch();
const errorHistorySocket = new ErrorHistorySocket(); // 로봇별 오류 이력 수신 WebSocket
const {
  loading,
  historyMap: errorMap, // robot_id별 오류 이력 맵 (useRobotHistoryList)
  fetchHistories: fetchList,
  rowClass,
} = useRobotHistoryList<RobotErrorHistoryItem>(
  errorHistorySocket,
  // robotId-occurred_at-code-message 조합으로 고유 uid 생성
  (rid, item) => `${rid}-${item.occurred_at}-${item.code}-${item.message}`,
);

const robotList = ref<Robot[]>([]); // 상단 API에서 받아온 로봇 목록

/**
 * 관리자 권한 확인 후 로봇별 오류 이력 실시간 조회
 * - isAdmin이 아니면 조회하지 않음
 * - useRobotHistoryList.fetchHistories에 기간 파라미터 전달
 */
const fetchHistories = async (): Promise<void> => {
  if (!isAdmin) return;
  const start = toDatetimeParam(searchDate.value, searchStartTime.value);
  const end = toDatetimeParam(searchDate.value, searchEndTime.value);
  await fetchList(start, end);
};

/**
 * 마운트 시 로봇 목록 조회 후 오류 이력 조회
 * - getRobotList 실패 시 기본 1~5 로봇 placeholder를 채웁니다.
 */
onMounted(async () => {
  try {
    const data = await getRobotList();
    if (data?.data) robotList.value = data.data;
  } catch {
    robotList.value = [1, 2, 3, 4, 5].map((id) => ({ robot_id: id, description: '' }));
  }
  await fetchHistories();
});
</script>

<style scoped lang="scss">
.robot-error-histories-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 10rem;
  padding-left: 2rem;
  padding-right: 2rem;
  gap: 1rem;
}
.chart-field {
  display: grid;
  flex: 1;
  gap: 1rem;
  min-height: 0;
  overflow-x: auto;
}

.chart-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  font-size: 18px;
  min-height: 0;
  min-width: 0;
}
.chart-title {
  color: var(--text-title);
  font-size: 18px;
}

@keyframes new-row-slide-in {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
:deep(.new-row > td) {
  animation: new-row-slide-in 0.4s ease-out both;
}

.chart-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-title);
}
.chart-loading i {
  font-size: 2rem;
}
.message-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  max-width: 180px;
}
:deep(.p-datatable-thead > tr > th) {
  white-space: nowrap;
}
</style>
