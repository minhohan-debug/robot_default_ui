<template>
  <div class="task-histories-view">
    <DateTimeSearchPanel
      v-model:date="searchDate"
      v-model:start-time="searchStartTime"
      v-model:end-time="searchEndTime"
      @search="fetchHistories"
    />
    <div class="chart-field">
      <div v-for="robot in robotList" :key="robot.robot_id" class="glass-dialog chart-card">
        <div class="chart-title">{{ t('pages.taskStatus.robot.robot_id', { id: robot.robot_id }) }}</div>
        <div class="chart-content">
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
          <PDataTable
            v-else
            :value="historyMap[robot.robot_id] ?? []"
            data-key="uid"
            scrollable
            scroll-height="flex"
            :empty-message="t('pages.taskHistories.noData')"
            selection-mode="single"
            row-hover
            :row-class="rowClass"
            @row-click="onRowClick"
          >
            <PColumn field="executed_at" :header="t('pages.taskHistories.columns.executedAt')">
              <template #body="{ data }">{{ data.executed_at?.split(' ')[1] ?? data.executed_at }}</template>
            </PColumn>
            <PColumn field="worked_sector" :header="t('pages.taskHistories.columns.workedSector')" />
            <PColumn field="status" :header="t('pages.robotDetail.columns.status')">
              <template #body="{ data }">
                <span
                  :style="{
                    color: data.status ? 'var(--color-accent-700)' : 'var(--color-success-700)',
                    fontWeight: 500,
                  }"
                >
                  {{ data.status ? t('pages.robotDetail.status.inProgress') : t('pages.robotDetail.status.completed') }}
                </span>
              </template>
            </PColumn>
          </PDataTable>
        </div>
      </div>
    </div>

    <PPopover ref="sectorPopover">
      <div class="popover-header">{{ t('pages.taskHistories.sectorDetail') }}</div>
      <PDataTable :value="selectedSectorInfo" :empty-message="t('pages.taskHistories.noData')">
        <PColumn field="sector" :header="t('pages.taskHistories.columns.sector')" />
        <PColumn field="target_count" :header="t('pages.taskHistories.columns.targetCount')" />
        <PColumn field="picked_count" :header="t('pages.taskHistories.columns.pickedCount')" />
        <PColumn field="progress_rate" :header="t('pages.taskHistories.columns.progressRate')">
          <template #body="{ data }">{{ data.progress_rate }}%</template>
        </PColumn>
      </PDataTable>
    </PPopover>
  </div>
</template>

<script setup lang="ts">
/**
 * 로봇별 작업 이력 탭 화면
 *
 * - 로봇 목록별로 작업 이력 테이블을 가로로 배치하여 보여줍니다.
 * - TaskHistorySocket(API_ENDPOINTS.robotTaskHistory)를 통해 실시간 데이터를 수신합니다.
 * - useRobotHistoryList로 robot_id별 데이터 관리, 중복 제거, new-row 하이라이트 처리
 * - 행 클릭 시 PPopover로 sector_info(섹터별 target/picked/progress) 상세 보기
 */
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getRobotList } from '@renderer/services/api/robot';
import { TaskHistorySocket } from '@renderer/services/websocket/taskHistory';
import { API_ENDPOINTS } from '@renderer/config/api';
import { useDateTimeSearch } from '@renderer/composables/useDateTimeSearch';
import { useRobotHistoryList } from '@renderer/composables/useRobotHistoryList';
import DateTimeSearchPanel from '@renderer/components/common/DateTimeSearchPanel.vue';
import type { Robot } from '@renderer/types/robot';
import type { TaskHistoryItem, TaskHistorySectorInfo } from '@renderer/types/task';

const { t } = useI18n();

const { searchDate, searchStartTime, searchEndTime, toDatetimeParam } = useDateTimeSearch();
// /v1/robot/task/history 엔드포인트로 로봇별 작업 이력 수신
const taskHistorySocket = new TaskHistorySocket(API_ENDPOINTS.robotTaskHistory);
const {
  loading,
  historyMap,
  fetchHistories: fetchList, // useRobotHistoryList가 제공하는 실시간 조회 함수
  rowClass,
} = useRobotHistoryList<TaskHistoryItem>(
  taskHistorySocket,
  // robotId-task_id-executed_at 조합으로 중복/하이라이트 uid 생성
  (rid, item) => `${rid}-${item.task_id}-${item.executed_at}`,
);

const robotList = ref<Robot[]>([]); // 상단 API에서 받아온 로봇 목록
const sectorPopover = ref(); // PPopover ref
const selectedSectorInfo = ref<TaskHistorySectorInfo[]>([]); // 클릭된 행의 섹터 상세

/**
 * 로봇 작업 이력 행 클릭
 * - event.data.sector_info를 selectedSectorInfo에 저장
 * - PPopover toggle로 클릭 위치에 팝업 열기
 */
const onRowClick = (event: { data: TaskHistoryItem; originalEvent: Event }): void => {
  selectedSectorInfo.value = event.data.sector_info ?? [];
  sectorPopover.value?.toggle(event.originalEvent);
};

/** historyMap이 갱신되면 열려 있는 Popover 섹터 정보 초기화 */
watch(
  () => historyMap.value,
  () => {
    selectedSectorInfo.value = [];
  },
  { deep: true },
);

/**
 * 검색 기간으로 로봇별 작업 이력 실시간 조회
 * - useRobotHistoryList.fetchHistories에 기간 파라미터 전달
 */
const fetchHistories = async (): Promise<void> => {
  await fetchList(
    toDatetimeParam(searchDate.value, searchStartTime.value),
    toDatetimeParam(searchDate.value, searchEndTime.value),
  );
};

/**
 * 마운트 시 로봇 목록 조회 후 작업 이력 조회
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
.task-histories-view {
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
  display: flex;
  flex: 1;
  flex-direction: row;
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
  flex: 1;
  font-size: 18px;
  min-height: 0;
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

.popover-header {
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--text-title);
  margin-bottom: 0.75rem;
}
</style>
