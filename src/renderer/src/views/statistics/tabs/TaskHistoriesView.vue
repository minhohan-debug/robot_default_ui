<template>
  <div class="task-histories-view">
    <DateTimeSearchPanel
      v-model:date="searchDate"
      v-model:start-time="searchStartTime"
      v-model:end-time="searchEndTime"
      @search="fetchHistories"
    />
    <div class="content-field">
      <div class="glass-dialog list-panel">
        <div class="panel-title">{{ t('pages.taskHistories.taskList') }}</div>
        <div class="panel-content">
          <div v-if="loading" class="panel-loading"><i class="pi pi-spin pi-spinner" /></div>
          <PDataTable
            v-else
            v-model:selection="selectedTask"
            :value="historyList"
            data-key="uid"
            scrollable
            scroll-height="flex"
            :empty-message="t('pages.taskHistories.noData')"
            selection-mode="single"
            row-hover
            :row-class="rowClass"
            @row-click="onRowClick"
          >
            <PColumn field="target_count" :header="t('pages.taskHistories.columns.targetCount')" />
            <PColumn field="worked_count" :header="t('pages.taskHistories.columns.workedCount')" />
            <PColumn field="started_at" :header="t('pages.taskHistories.columns.startedAt')">
              <template #body="{ data }">{{ data.started_at?.split(' ')[1] ?? data.started_at }}</template>
            </PColumn>
            <PColumn field="ended_at" :header="t('pages.taskHistories.columns.endedAt')">
              <template #body="{ data }">{{ data.ended_at?.split(' ')[1] ?? data.ended_at }}</template>
            </PColumn>
          </PDataTable>
        </div>
      </div>

      <div class="glass-dialog detail-panel">
        <div class="panel-title">{{ t('pages.taskHistories.taskDetail') }}</div>
        <div v-if="!selectedTask" class="panel-empty">
          {{ t('pages.taskHistories.selectTask') }}
        </div>
        <div v-else-if="detailLoading" class="panel-loading"><i class="pi pi-spin pi-spinner" /></div>
        <div v-else class="panel-content">
          <PDataTable
            v-model:expanded-rows="expandedRows"
            :value="selectedTaskDetail"
            data-key="uid"
            scrollable
            scroll-height="flex"
            :empty-message="t('pages.taskHistories.noData')"
            expandable-rows
            @row-click="onDetailRowClick"
          >
            <PColumn expander style="width: 3rem" />
            <PColumn field="robot_id" :header="t('pages.taskHistories.columns.robotId')" />
            <PColumn field="executed_at" :header="t('pages.taskHistories.columns.executedAt')">
              <template #body="{ data }">{{ data.executed_at?.split(' ')[1] ?? data.executed_at }}</template>
            </PColumn>
            <PColumn field="finished_at" :header="t('pages.taskHistories.columns.finishedAt')">
              <template #body="{ data }">{{ data.finished_at?.split(' ')[1] ?? data.finished_at }}</template>
            </PColumn>
            <PColumn field="worked_sector" :header="t('pages.taskHistories.columns.workedSector')" />
            <template #expansion="{ data }">
              <div class="sector-section">
                <div class="sector-title">{{ t('pages.taskHistories.sectorDetail') }}</div>
                <PDataTable :value="data.sector_info" :empty-message="t('pages.taskHistories.noData')">
                  <PColumn field="sector" :header="t('pages.taskHistories.columns.sector')" />
                  <PColumn field="target_count" :header="t('pages.taskHistories.columns.targetCount')" />
                  <PColumn field="picked_count" :header="t('pages.taskHistories.columns.pickedCount')" />
                  <PColumn field="progress_rate" :header="t('pages.taskHistories.columns.progressRate')">
                    <template #body="{ data: rowData }">{{ rowData.progress_rate }}%</template>
                  </PColumn>
                </PDataTable>
              </div>
            </template>
          </PDataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 작업 이력 조회 탭 화면
 *
 * - 좌측: DateTimeSearchPanel로 검색 기간을 설정하고 TaskHistorySocket 실시간 수신
 * - 좌측: 작업 목록(PDataTable)을 표시; 신규 수신 행은 new-row 클래스로 하이라이트
 * - 우측: 선택된 작업의 상세 이력을 보여주며 로봇별로 expand 가능
 * - 목록의 started_at/ended_at, 상세의 executed_at/finished_at은 시간만 추출하여 노출
 * - onRowClick 시 getTaskHistoryDetail API로 상세 조회
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { TaskHistorySocket } from '@renderer/services/websocket/taskHistory';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import { getTaskHistoryDetail } from '@renderer/services/api/task';
import { useDateTimeSearch } from '@renderer/composables/useDateTimeSearch';
import DateTimeSearchPanel from '@renderer/components/common/DateTimeSearchPanel.vue';
import type { TaskHistoryItem, TaskHistorySummary } from '@renderer/types/task';

const { t } = useI18n();

const { searchDate, searchStartTime, searchEndTime, toDatetimeParam } = useDateTimeSearch();
const taskHistorySocket = new TaskHistorySocket(); // 작업 이력 실시간 조회 WebSocket

const loading = ref(false); // 목록 로딩 상태
const detailLoading = ref(false); // 상세 조회 로딩 상태
const historyList = ref<TaskHistorySummary[]>([]); // 현재까지 수신한 작업 요약 목록
const newTaskIds = ref<Set<string>>(new Set()); // 신규/갱신된 uid 집합
const selectedTask = ref<TaskHistorySummary | null>(null); // 현재 선택된 작업
const selectedTaskDetail = ref<TaskHistoryItem[]>([]); // 선택된 작업의 로봇별 상세
const expandedRows = ref<Record<string, boolean>>({}); // 상세 테이블 expand 상태

/**
 * 목록 행 클릭 핸들러
 * - 클릭된 작업을 selectedTask로 설정
 * - loadDetail()로 로봇별 상세 조회
 */
const onRowClick = async (event: { data: TaskHistorySummary }): Promise<void> => {
  selectedTask.value = event.data;
  await loadDetail(event.data.task_id);
};

/**
 * 상세 테이블 행 클릭: expand/collapse 토글
 * - expandedRows에 uid 기준으로 true/false 추가/삭제
 */
const onDetailRowClick = (event: { data: TaskHistoryItem }): void => {
  const uid = event.data.uid;
  if (!uid) return;
  const next = { ...expandedRows.value };
  if (next[uid]) {
    delete next[uid];
  } else {
    next[uid] = true;
  }
  expandedRows.value = next;
};

/**
 * 작업 ID로 상세 내역 API 조회
 * - getTaskHistoryDetail 호출
 * - 각 항목에 uid(taskId-robot_id-index)를 추가해 PDataTable data-key로 사용
 */
const loadDetail = async (taskId: string): Promise<void> => {
  detailLoading.value = true;
  expandedRows.value = {};
  try {
    const response = await getTaskHistoryDetail(taskId);
    selectedTaskDetail.value = (response.data ?? []).map((item, index) => ({
      ...item,
      uid: `${taskId}-${item.robot_id}-${index}`,
    }));
  } catch {
    selectedTaskDetail.value = [];
  } finally {
    detailLoading.value = false;
  }
};

/**
 * 목록 행에 신규 수신 하이라이트 클래스 부여
 * - newTaskIds에 포함된 uid면 'new-row' CSS 클래스 적용
 */
const rowClass = (data: TaskHistorySummary): string => (newTaskIds.value.has(data.uid ?? '') ? 'new-row' : '');

/** task_id + started_at 조합으로 목록 내 고유 uid 생성 */
const createUid = (item: TaskHistorySummary): string => `${item.task_id}-${item.started_at}`;

const isFirstMessage = ref(true); // 최초 메시지 수신 여부 플래그

/**
 * 검색 조건으로 TaskHistorySocket 연결 및 실시간 조회 시작
 * - 검색 시마다 loading=true, 목록 초기화, 소켓 끊고 다시 연결
 */
const fetchHistories = async (): Promise<void> => {
  loading.value = true;
  historyList.value = [];
  newTaskIds.value = new Set();
  selectedTask.value = null;
  selectedTaskDetail.value = [];
  isFirstMessage.value = true;
  await taskHistorySocket.disconnect();
  await taskHistorySocket.connect(
    toDatetimeParam(searchDate.value, searchStartTime.value),
    toDatetimeParam(searchDate.value, searchEndTime.value),
  );
};

/**
 * WebSocket 글로벌 리스너 등록
 * - onMessage: taskHistorySocket에 해당하는 메시지만 파싱 후 historyList 갱신
 *   - 최초 메시지: 시간 역순 정렬
 *   - 이후: 기존 task_id 갱신 또는 새 항목 추가 후 started_at 기준 정렬
 * - onClose/onError: loading=false
 */
const registerWsListeners = (): void => {
  WebSocketService.onMessage((id, data) => {
    if (id !== taskHistorySocket.id) return;
    try {
      const incoming = taskHistorySocket.parseData(data);
      const items = incoming.map((item) => ({
        ...item,
        uid: createUid(item),
      }));

      if (isFirstMessage.value) {
        historyList.value = [...items].reverse();
        isFirstMessage.value = false;
      } else {
        const existingMap = new Map(historyList.value.map((row, i) => [row.task_id, i]));
        const updatedList = [...historyList.value];

        items.forEach((item) => {
          const existingIndex = existingMap.get(item.task_id);
          const uid = createUid(item);
          if (existingIndex !== undefined) {
            updatedList[existingIndex] = { ...item, uid };
          } else {
            updatedList.push({ ...item, uid });
          }
        });

        historyList.value = updatedList.sort((a, b) => b.started_at.localeCompare(a.started_at));
      }
    } catch (error) {
      console.error('[TaskHistoriesView] WebSocket parse error:', error);
    } finally {
      loading.value = false;
    }
  });

  WebSocketService.onClose((id) => {
    if (id !== taskHistorySocket.id) return;
    loading.value = false;
  });

  WebSocketService.onError(() => {
    loading.value = false;
  });
};

/** 마운트 시 리스너 등록 및 초기 작업 이력 조회 시작 */
onMounted(async () => {
  registerWsListeners();
  await fetchHistories();
});

/** 언마운트 시 WebSocket 리스너 해제 및 소켓 연결 종료 */
onUnmounted(async () => {
  WebSocketService.offListeners();
  await taskHistorySocket.disconnect();
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
.content-field {
  display: flex;
  flex: 1;
  flex-direction: row;
  gap: 1rem;
  min-height: 0;
  overflow: hidden;
}

.list-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  flex: 1;
  font-size: 18px;
  min-height: 0;
  min-width: 0;
}
.detail-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  flex: 1;
  font-size: 18px;
  min-height: 0;
  min-width: 0;
}

.panel-title {
  color: var(--text-title);
  font-size: 18px;
}

.panel-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-title);
}
.panel-loading i {
  font-size: 2rem;
}

.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-title);
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

.detail-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-gray-50), transparent 70%);
}
.detail-label {
  color: var(--text-muted);
}
.detail-value {
  font-weight: 500;
}

.sector-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.sector-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-gray-400);
}
</style>
