<template>
  <!--
    로봇 상세 화면
    - 상단: 뒤로 가기 버튼 + 로봇 선택 드롭다운
    - 좌측: HCR-14 URDF 3D 뷰어 + 최근 실시간 작업 이력
    - 중앙: 로봇 상태 패널 (예정)
    - 우측: 날짜/시간 검색 + 기간별 작업 이력 + (관리자) 원격 제어 버튼
    - RemoteControlDialog: 관리자 원격 제어 다이얼로그
  -->
  <div class="robot-detail-wrapper">
    <div class="robot-detail-page">
      <div class="header-field">
        <div class="back-button" @click="handleBack"><i class="pi pi-chevron-left"></i></div>
        <div class="robot-select-field">
          <PSelect
            v-model="selectedRobot"
            :options="robotOptions"
            option-label="label"
            option-value="value"
            :placeholder="t('pages.robotDetail.selectRobotPlaceholder')"
          />
        </div>
      </div>

      <div class="robot-detail-content">
        <div class="detail-field">
          <div class="robot-3d-viewer">
            <RobotArmViewer ref="armViewerRef" />
          </div>
          <div class="glass-dialog recent-task-panel">
            <div class="panel-title">{{ t('pages.robotDetail.panels.realTimeTask') }}</div>
            <div class="panel-content">
              <div v-if="recentTaskLoading" class="panel-loading"><i class="pi pi-spin pi-spinner" /></div>
              <PDataTable
                v-else
                :value="recentTaskHistory"
                data-key="uid"
                scrollable
                scroll-height="flex"
                :empty-message="t('pages.robotDetail.emptyMessage')"
                class="recent-task-table"
              >
                <PColumn field="executed_at" :header="t('pages.robotDetail.columns.executedAt')">
                  <template #body="{ data }">{{ data.executed_at?.split(' ')[1] ?? data.executed_at }}</template>
                </PColumn>
                <PColumn field="worked_sector" :header="t('pages.robotDetail.columns.workedSector')" />
                <PColumn field="_target_count" :header="t('pages.robotDetail.columns.targetCount')" />
                <PColumn field="_picked_count" :header="t('pages.robotDetail.columns.pickedCount')" />
                <PColumn field="status" :header="t('pages.robotDetail.columns.status')">
                  <template #body="{ data }">
                    <span
                      :style="{
                        color: data.status ? 'var(--color-accent-700)' : 'var(--color-success-700)',
                        fontWeight: 500,
                      }"
                    >
                      {{
                        data.status ? t('pages.robotDetail.status.inProgress') : t('pages.robotDetail.status.completed')
                      }}
                    </span>
                  </template>
                </PColumn>
              </PDataTable>
            </div>
          </div>
        </div>
        <div class="detail-field">
          <div></div>
          <div class="glass-dialog robot-status-panel">
            <div class="panel-title">{{ t('pages.robotDetail.panels.robotStatus') }}</div>
            <div></div>
          </div>
        </div>
        <div class="detail-field">
          <DateTimeSearchPanel
            v-model:date="taskSearchDate"
            v-model:start-time="taskSearchStartTime"
            v-model:end-time="taskSearchEndTime"
            class="task-search"
            @search="searchRobotTaskHistories"
          />
          <div class="glass-dialog task-history-panel">
            <div class="panel-title">{{ t('pages.robotDetail.panels.taskHistory') }}</div>
            <div class="panel-content">
              <div v-if="taskHistoryLoading" class="panel-loading"><i class="pi pi-spin pi-spinner" /></div>
              <PDataTable
                v-else
                :value="robotTaskHistory"
                data-key="uid"
                scrollable
                scroll-height="flex"
                :empty-message="t('pages.robotDetail.emptyMessage')"
                class="task-history-table"
              >
                <PColumn field="executed_at" :header="t('pages.robotDetail.columns.executedAt')">
                  <template #body="{ data }">{{ data.executed_at?.split(' ')[1] ?? data.executed_at }}</template>
                </PColumn>
                <PColumn field="worked_sector" :header="t('pages.robotDetail.columns.workedSector')" />
                <PColumn field="_target_count" :header="t('pages.robotDetail.columns.targetCount')" />
                <PColumn field="_picked_count" :header="t('pages.robotDetail.columns.pickedCount')" />
                <PColumn field="status" :header="t('pages.robotDetail.columns.status')">
                  <template #body="{ data }">
                    <span
                      :style="{
                        color: data.status ? 'var(--color-accent-700)' : 'var(--color-success-700)',
                        fontWeight: 500,
                      }"
                    >
                      {{
                        data.status ? t('pages.robotDetail.status.inProgress') : t('pages.robotDetail.status.completed')
                      }}
                    </span>
                  </template>
                </PColumn>
              </PDataTable>
            </div>
          </div>
          <template v-if="isAdmin">
            <div class="remote-control-panel">
              <div class="button gray" @click="isRemoteControlDialogVisible = true">
                {{ t('pages.robotDetail.remoteControl') }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <RemoteControlDialog v-model:visible="isRemoteControlDialogVisible" :robot-id="selectedRobot ?? undefined" />
  </div>
</template>

<script setup lang="ts">
/**
 * 로봇 상세 화면
 *
 * - URL query id 또는 getRobotList 첫 번째로 선택 로봇을 결정합니다.
 * - RobotArmViewer에 HCR-14 URDF를 로드하고 RobotJointTcpSocket으로 관절 각도를 실시간 반영합니다.
 * - RecentTaskHistorySocket으로 최근 10개 작업 이력을 받아 좌측 테이블에 표시합니다.
 * - DateTimeSearchPanel으로 기간을 설정하면 RobotTaskHistorySocket으로 해당 기간 작업 이력을 조회합니다.
 * - 관리자(isAdmin)인 경우 원격 제어 다이얼로그 버튼을 노출합니다.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import RobotArmViewer from '@renderer/components/RobotArmViewer.vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import PSelect from 'primevue/select';
import PDataTable from 'primevue/datatable';
import PColumn from 'primevue/column';
import RemoteControlDialog from './dialog/RemoteControlDialog.vue';

import DateTimeSearchPanel from '@renderer/components/common/DateTimeSearchPanel.vue';
import { getRobotList } from '@renderer/services/api/robot';
import { refreshAccessToken } from '@renderer/services/auth/tokenRefresh';
import { useErrorToast } from '@renderer/composables/useToast';
import { useAdmin } from '@renderer/composables/useAdmin';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import { RobotJointTcpSocket } from '@renderer/services/websocket/robotJointTcp';
import { RecentTaskHistorySocket } from '@renderer/services/websocket/recentTaskHistory';
import { RobotTaskHistorySocket } from '@renderer/services/websocket/robotTaskHistory';
import type { Robot } from '@renderer/types/robot';
import type { TaskHistoryItem } from '@renderer/types/task';

type DisplayItem = TaskHistoryItem & { uid: string; _target_count: number; _picked_count: number };

/**
 * 화면 표시용으로 TaskHistoryItem에 uid 및 해당 작업 섹터의 수량을 추가합니다.
 * - uid: task_id-executed_at-index 조합
 * - _target_count/_picked_count: worked_sector에 해당하는 sector_info 항목 추출
 */
function enrichItem(item: TaskHistoryItem, index: number): DisplayItem {
  const sector = item.sector_info?.find((s) => s.sector == item.worked_sector);
  return {
    ...item,
    uid: `${item.task_id}-${item.executed_at}-${index}`,
    _target_count: sector?.target_count ?? 0,
    _picked_count: sector?.picked_count ?? 0,
  };
}

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { showError } = useErrorToast();

const robots = ref<Robot[]>([]); // 전체 로봇 목록
const selectedRobot = ref<number | null>(null); // 선택된 로봇 ID
const { isAdmin } = useAdmin(); // 관리자 권한
const isRemoteControlDialogVisible = ref(false); // 원격 제어 다이얼로그 가시성
const armViewerRef = ref<InstanceType<typeof RobotArmViewer>>(); // RobotArmViewer 컴포넌트 ref
const recentTaskHistory = ref<TaskHistoryItem[]>([]); // 최근 작업 이력 목록
const recentTaskLoading = ref(false); // 최근 작업 이력 로딩
let jointSocket: RobotJointTcpSocket | null = null; // 선택 로봇의 관절/TCP 소켓
let isConnectingSocket = false; // 관절 소켓 연결 중복 방지
let recentTaskSocket: RecentTaskHistorySocket | null = null; // 최근 작업 이력 소켓
const RECENT_TASK_LIMIT = 10; // 최근 작업 이력 최대 개수

const robotTaskHistory = ref<TaskHistoryItem[]>([]); // 선택 로봇의 기간별 작업 이력
const taskHistoryLoading = ref(false); // 기간별 작업 이력 로딩

let lastJointUpdateTime = 0;
const JOINT_THROTTLE_MS = 33; // 관절 업데이트 최소 간격 (약 30fps)
const jointBuffer = { joint_1: 0, joint_2: 0, joint_3: 0, joint_4: 0, joint_5: 0, joint_6: 0 };

// DateTimeSearchPanel 바인딩
const taskSearchDate = ref('');
const taskSearchStartTime = ref('');
const taskSearchEndTime = ref('');
const isFirstTaskMessage = ref(true); // 기간별 이력 최초 메시지 플래그
const robotTaskHistorySocket = new RobotTaskHistorySocket(); // 기간별 작업 이력 소켓
let isActive = false; // 마운트/언마운트 플래그
let wsTokenRefreshPromise: Promise<string | null> | null = null; // 중복 토큰 갱신 방지

/**
 * WebSocket 재연결용 access token 갱신
 * - isActive=false면 중단
 * - 진행 중인 갱신이 있으면 공유 Promise 반환
 */
const refreshAccessTokenForWs = async (): Promise<string | null> => {
  if (!isActive) return null;
  if (wsTokenRefreshPromise) return wsTokenRefreshPromise;

  wsTokenRefreshPromise = refreshAccessToken().finally(() => {
    wsTokenRefreshPromise = null;
  });

  return wsTokenRefreshPromise;
};

/** robots를 PSelect option 배열({ label, value })로 변환 */
const robotOptions = computed(() =>
  robots.value.map((robot) => ({
    label: t('pages.taskStatus.robot.robot_id', { id: robot.robot_id }),
    value: robot.robot_id,
  })),
);

/** 뒤로 가기 버튼: /main 라우트로 이동 */
const handleBack = (): void => {
  void router.push('/main');
};

/**
 * 로봇 목록 API 조회 및 선택
 * - getRobotList 성공 시 robots 저장
 * - URL query.id가 유효하면 해당 ID, 아니면 첫 로봇 자동 선택
 */
const fetchRobotList = async (): Promise<void> => {
  try {
    const data = await getRobotList();
    if (data?.data) {
      robots.value = data.data;
      const queryId = route.query.id ? Number(route.query.id) : null;
      const matched = queryId !== null && robots.value.some((robot) => robot.robot_id === queryId);
      selectedRobot.value = matched ? queryId : (robots.value[0]?.robot_id ?? null);
    }
  } catch {
    showError('error', t('pages.robotDetail.robotListLoadFailed'));
  }
};

/**
 * 선택 로봇의 Joint/TCP WebSocket 연결
 * - 동일 로봇이면 중복 연결 방지
 * - 기존 jointSocket이 있으면 destroy 후 새 인스턴스 생성
 */
const connectJointSocket = async (robotId: number): Promise<void> => {
  if (isConnectingSocket) return;
  if (jointSocket?.id === `${RobotJointTcpSocket.ID_PREFIX}_${robotId}`) return;
  isConnectingSocket = true;
  try {
    if (jointSocket) {
      await jointSocket.destroy();
      jointSocket = null;
    }
    jointSocket = new RobotJointTcpSocket(robotId);
    await jointSocket.connect();
  } finally {
    isConnectingSocket = false;
  }
};

let recentTaskTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 선택 로봇의 최근 작업 이력 WebSocket 연결
 * - 이전 소켓/타이머 정리
 * - 5초 내 메시지 없으면 로딩 해제
 */
const connectRecentTaskSocket = async (robotId: number): Promise<void> => {
  if (recentTaskSocket) {
    await recentTaskSocket.disconnect();
    recentTaskSocket = null;
  }
  if (recentTaskTimeout) {
    clearTimeout(recentTaskTimeout);
    recentTaskTimeout = null;
  }
  recentTaskLoading.value = true;
  recentTaskHistory.value = [];
  recentTaskSocket = new RecentTaskHistorySocket(robotId, RECENT_TASK_LIMIT);
  try {
    await recentTaskSocket.connect();
    recentTaskTimeout = setTimeout(() => {
      if (recentTaskLoading.value) {
        recentTaskLoading.value = false;
      }
    }, 5000);
  } catch {
    recentTaskLoading.value = false;
  }
};

/**
 * YYYY/MM/DD + HH:MM → YYYYMMDDHHMMSS 문자열 변환
 * - 소켓 쿼리 파라미터 형식에 맞춤
 */
const toDatetimeParam = (date: string, time: string): string => `${date.replace(/\//g, '')}${time.replace(':', '')}00`;

/**
 * 선택된 로봇의 기간별 작업 이력 WebSocket 연결
 * - refreshAccessTokenForWs로 토큰 갱신
 * - toDatetimeParam으로 시작/종료 시각 변환
 */
const connectRobotTaskHistory = async (): Promise<void> => {
  if (selectedRobot.value === null) return;
  const newToken = await refreshAccessTokenForWs();
  if (!newToken) {
    taskHistoryLoading.value = false;
    return;
  }
  taskHistoryLoading.value = true;
  robotTaskHistory.value = [];
  isFirstTaskMessage.value = true;
  const start = toDatetimeParam(taskSearchDate.value, taskSearchStartTime.value);
  const end = toDatetimeParam(taskSearchDate.value, taskSearchEndTime.value);
  await robotTaskHistorySocket.disconnect();
  await robotTaskHistorySocket.connect(start, end);
};

/** DateTimeSearchPanel에서 [검색] 시 호출 */
const searchRobotTaskHistories = async (): Promise<void> => {
  if (selectedRobot.value === null) return;
  await connectRobotTaskHistory();
};

/**
 * 로봇 선택 변경 시 URL, 3D, 최근/검색 이력 갱신
 * - URL query id 동기화
 * - connectJointSocket, connectRecentTaskSocket, connectRobotTaskHistory 실행
 */
watch(selectedRobot, (newRobotId) => {
  if (newRobotId !== null) {
    void router.replace({ path: '/robot-detail', query: { id: newRobotId } });
    void connectJointSocket(newRobotId);
    void connectRecentTaskSocket(newRobotId);
    void connectRobotTaskHistory();
  }
});

/**
 * 마운트 시 이벤트 리스너 등록, 기본 검색 시간 설정, 로봇 목록 조회
 * - isActive=true
 * - onOpen: RecentTaskHistorySocket 연결 시 limit 메시지 전송
 * - onMessage: RobotTaskHistorySocket, RecentTaskHistorySocket, RobotJointTcpSocket 메시지 처리
 * - onClose/onError: 로딩 해제
 * - 기본 검색 기간: 현재 기준 -30분 ~ +10분
 * - fetchRobotList()로 로봇 목록 및 선택
 */
onMounted(() => {
  isActive = true;
  WebSocketService.onOpen((id) => {
    if (id === RecentTaskHistorySocket.ID && recentTaskSocket) {
      void WebSocketService.send(RecentTaskHistorySocket.ID, recentTaskSocket.getLimitMessage());
    }
  });

  WebSocketService.onError((id) => {
    if (id === RecentTaskHistorySocket.ID) {
      recentTaskLoading.value = false;
    }
    if (id === RobotTaskHistorySocket.ID) {
      taskHistoryLoading.value = false;
    }
  });

  WebSocketService.onClose((id) => {
    if (id === RecentTaskHistorySocket.ID) {
      recentTaskLoading.value = false;
    }
    if (id === RobotTaskHistorySocket.ID) {
      taskHistoryLoading.value = false;
    }
  });

  WebSocketService.onMessage((id, data) => {
    if (id === RobotTaskHistorySocket.ID) {
      let parsed: Record<number, TaskHistoryItem[]> | null = null;
      try {
        parsed = robotTaskHistorySocket.parseRobotData(data);
      } catch (error) {
        console.error('[RobotDetailView] task history parse error:', error);
        taskHistoryLoading.value = false;
        return;
      }
      const snapshot = parsed[selectedRobot.value ?? -1] ?? [];
      nextTick(() => {
        try {
          if (isFirstTaskMessage.value) {
            robotTaskHistory.value = [...snapshot].reverse().map(enrichItem);
            isFirstTaskMessage.value = false;
          } else {
            const existingIds = new Set((robotTaskHistory.value as DisplayItem[]).map((i) => i.uid));
            const newItems = [...snapshot]
              .reverse()
              .map(enrichItem)
              .filter((i) => !existingIds.has(i.uid));
            if (newItems.length > 0) {
              robotTaskHistory.value = [...newItems, ...robotTaskHistory.value];
            }
          }
        } finally {
          taskHistoryLoading.value = false;
        }
      });
      return;
    }
    if (id === RecentTaskHistorySocket.ID) {
      let parsed2: ReturnType<typeof RecentTaskHistorySocket.parseData> | null = null;
      try {
        parsed2 = RecentTaskHistorySocket.parseData(data);
      } catch (error) {
        console.error('[RobotDetailView] recent task parse error:', error);
        recentTaskLoading.value = false;
        return;
      }
      const snapshot2 = parsed2;
      nextTick(() => {
        recentTaskHistory.value = snapshot2.map(enrichItem);
        recentTaskLoading.value = false;
      });
      return;
    }
    if (!id.startsWith(RobotJointTcpSocket.ID_PREFIX)) return;
    const now2 = Date.now();
    if (now2 - lastJointUpdateTime < JOINT_THROTTLE_MS) return;
    lastJointUpdateTime = now2;
    const parsed = RobotJointTcpSocket.parseData(data);
    if (!parsed) return;
    const { joint } = parsed;
    jointBuffer.joint_1 = joint.joint_1 ?? 0;
    jointBuffer.joint_2 = joint.joint_2 ?? 0;
    jointBuffer.joint_3 = joint.joint_3 ?? 0;
    jointBuffer.joint_4 = joint.joint_4 ?? 0;
    jointBuffer.joint_5 = joint.joint_5 ?? 0;
    jointBuffer.joint_6 = joint.joint_6 ?? 0;
    armViewerRef.value?.applyJointAngles(jointBuffer);
  });
  const now = new Date();
  const toLocalDateString = (d: Date): string =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  taskSearchDate.value = toLocalDateString(now);
  const toHHMM = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  taskSearchStartTime.value = toHHMM(new Date(now.getTime() - 30 * 60 * 1000));
  taskSearchEndTime.value = toHHMM(new Date(now.getTime() + 10 * 60 * 1000));

  void fetchRobotList();
});

/**
 * 언마운트 시 모든 WebSocket, 타이머, 리스너 정리
 * - isActive=false로 비동기 작업 중단
 * - offListeners, 소켓 disconnect/destroy, 타이머 클리어
 */
onUnmounted(async () => {
  isActive = false;
  WebSocketService.offListeners();
  if (recentTaskTimeout) {
    clearTimeout(recentTaskTimeout);
    recentTaskTimeout = null;
  }
  if (jointSocket) {
    await jointSocket.destroy();
    jointSocket = null;
  }
  if (recentTaskSocket) {
    await recentTaskSocket.disconnect();
    recentTaskSocket = null;
  }
  await robotTaskHistorySocket.disconnect();
});
</script>

<style scoped>
.robot-detail-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.robot-detail-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.header-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 2rem;
  z-index: 10;
}

.back-button {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 5rem;
  height: 5rem;
  border-radius: 8px;
  background-color: color-mix(in srgb, var(--color-gray-50), transparent 50%);
  backdrop-filter: blur(10px);
  cursor: pointer;
}
.back-button i {
  font-size: 24px;
  color: color-mix(in srgb, var(--text-button), transparent 10%);
}

.robot-select-field {
  z-index: 10;
  min-width: 20rem;
}
.robot-detail-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  padding: 2rem;
  min-height: 0;
  box-sizing: border-box;
}
.detail-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  min-width: 0;
}
.detail-field > div {
  flex: 1;
  min-height: 0;
}
.detail-field > .task-search {
  flex: 0 0 auto;
}
.detail-field:nth-child(1) {
  width: 32rem;
}
.detail-field:nth-child(2) {
  flex: 1;
}
.detail-field:nth-child(3) {
  width: 32rem;
}

.robot-3d-viewer {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.recent-task-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.recent-task-panel .panel-content,
.task-history-panel .panel-content {
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

.recent-task-table {
  font-size: 14px;
  height: 100%;
}
:deep(.recent-task-table .p-datatable-table-container) {
  height: 100%;
}

.robot-status-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.task-history-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.remote-control-panel {
  display: flex;
  flex: none !important;
  justify-content: flex-end;
}

.panel-title {
  color: var(--text-title);
  font-size: 18px;
  font-weight: 500;
}

.task-history-table {
  font-size: 14px;
  height: 100%;
}
:deep(.task-history-table .p-datatable-table-container) {
  height: 100%;
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
:deep(.new-task-row > td) {
  animation: new-row-slide-in 0.4s ease-out both;
}
</style>
