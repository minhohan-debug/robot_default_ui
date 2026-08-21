<template>
  <div class="task-status-view">
    <div class="connected-info-section">
      <div>
        <div>{{ t('pages.taskStatus.safety.connectionStatus') }}</div>
        <div>
          <span :class="safetyConnected ? 'success' : 'error'">{{
            safetyConnected ? t('pages.taskStatus.safety.connected') : t('pages.taskStatus.safety.disconnected')
          }}</span>
        </div>
      </div>
      <div>
        <div>{{ t('pages.taskStatus.sorting.connectionStatus') }}</div>
        <div>
          <span :class="sortingDisconnected ? 'error' : 'success'">{{
            sortingDisconnected ? t('pages.taskStatus.sorting.disconnected') : t('pages.taskStatus.sorting.connected')
          }}</span>
        </div>
      </div>
    </div>

    <!-- RA-009: 로봇 상태 -->
    <div class="robots-section">
      <div v-if="robotsLoading || robotsReconnecting || robotsDisconnected" class="section-loading">
        <div>
          <span v-if="robotsLoading">{{ t('common.connecting') }}</span>
          <span v-else-if="robotsReconnecting">{{ t('common.reconnecting') }}</span>
          <div v-else-if="robotsDisconnected">
            <span>{{ t('pages.taskStatus.robot.disconnected') }}</span>
            <div class="button accent" @click="reconnectRobots">{{ t('common.reconnect') }}</div>
          </div>
        </div>
      </div>
      <div v-else class="robot-grid">
        <div
          v-for="robot in robots"
          :key="robot.robot_id"
          class="robot-card glass-dialog"
          @click="router.push({ path: '/robot-detail', query: { id: robot.robot_id } })"
        >
          <div v-if="sortingLoading || sortingReconnecting" class="sorter-field">
            <div class="sorter-loading">
              <span v-if="sortingLoading">{{ t('common.connecting') }}</span>
              <span v-else-if="sortingReconnecting">{{ t('common.reconnecting') }}</span>
            </div>
          </div>
          <div v-else class="sorter-field">
            <div class="sorter-item">
              <div>{{ (robot.robot_id - 1) * 3 + 3 }}</div>
              <div>{{ formatNumber(getSectorCount((robot.robot_id - 1) * 3 + 3)) }}</div>
            </div>
            <div class="sorter-item">
              <div>{{ (robot.robot_id - 1) * 3 + 2 }}</div>
              <div>{{ formatNumber(getSectorCount((robot.robot_id - 1) * 3 + 2)) }}</div>
            </div>
            <div class="sorter-item">
              <div>{{ (robot.robot_id - 1) * 3 + 1 }}</div>
              <div>{{ formatNumber(getSectorCount((robot.robot_id - 1) * 3 + 1)) }}</div>
            </div>
          </div>
          <div class="robot-header">
            <div class="robot-id">{{ t('pages.taskStatus.robot.robot_id', { id: robot.robot_id }) }}</div>
            <div class="robot-status" :class="statusClass(getStatus(robot.robot_id))">
              {{ statusLabel(getStatus(robot.robot_id)) }}
            </div>
          </div>
          <div class="robot-info">
            <div class="info-row">
              <span class="info-label">{{ t('pages.taskStatus.robot.sector') }}</span>
              <span class="info-value">{{ getStatus(robot.robot_id)?.current_sector ?? '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('pages.taskStatus.robot.progress') }}</span>
              <span class="info-value">
                {{ getStatus(robot.robot_id)?.progress != null ? `${getStatus(robot.robot_id)?.progress}%` : '-' }}
              </span>
            </div>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" :style="{ width: `${getStatus(robot.robot_id)?.progress ?? 0}%` }" />
          </div>
        </div>
      </div>
    </div>

    <!-- RA-034: 작업 진행 정보 -->
    <div class="task-section">
      <div v-if="taskLoading || taskReconnecting || taskDisconnected" class="section-loading">
        <div>
          <span v-if="taskLoading">{{ t('common.connecting') }}</span>
          <span v-else-if="taskReconnecting">{{ t('common.reconnecting') }}</span>
          <div v-else-if="taskDisconnected">
            <span>{{ t('pages.taskStatus.task.disconnected') }}</span>
            <div class="button accent" @click="reconnectTask">{{ t('common.reconnect') }}</div>
          </div>
        </div>
      </div>
      <div v-else class="task-grid-wrapper" :style="{ '--slot-w': taskSlotWidth + 'px' }">
        <!-- 기존 카드들: 왼쪽으로 슬라이드 아웃 -->
        <div v-if="isTaskTransitioning" class="robot-grid task-grid-exit">
          <div
            v-for="(slot, idx) in outgoingQueue.slice(0, robots.length)"
            :key="'ex-' + idx"
            class="robot-card glass-dialog"
            style="position: relative; overflow: hidden"
          >
            <div v-if="slot.task_id" class="task-id-header">{{ slot.task_id }}</div>
            <div v-if="!slot.task_id" class="task-idle-overlay">{{ t('pages.taskStatus.task.idle') }}</div>
            <div v-if="slot.task_id && slot.state === 0" class="task-waiting-badge">
              {{
                t('pages.taskStatus.task.waiting', { picked: slot.picked_count ?? 0, target: slot.target_count ?? 0 })
              }}
            </div>
            <div class="robot-info">
              <div class="info-row">
                <span class="info-label">{{ t('pages.taskStatus.task.target') }}</span>
                <span v-if="slot.task_id" class="info-value">{{ slot.target_count }}</span>
                <span v-else class="info-value">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ t('pages.taskStatus.task.done') }}</span>
                <span v-if="slot.task_id" class="info-value">{{ slot.picked_count }}</span>
                <span v-else class="info-value">-</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('pages.taskStatus.task.progress') }}</span>
              <span v-if="slot.task_id" class="info-value">{{ slot.progress_rate }}%</span>
              <span v-else class="info-value">0%</span>
            </div>
            <div class="progress-bar-track">
              <div class="task-progress-bar-fill" :style="{ width: `${slot.task_id ? slot.progress_rate : 0}%` }" />
            </div>
          </div>
        </div>
        <!-- 새 카드들: 오른쪽에서 슬라이드 인 -->
        <div ref="taskGridRef" class="robot-grid" :class="isTaskTransitioning ? 'task-grid-enter' : ''">
          <div
            v-for="(slot, idx) in taskQueue.slice(0, robots.length)"
            :key="idx"
            class="robot-card glass-dialog"
            style="position: relative; overflow: hidden"
          >
            <div v-if="slot.task_id" class="task-id-header">{{ slot.task_id }}</div>
            <div v-if="!slot.task_id" class="task-idle-overlay">{{ t('pages.taskStatus.task.idle') }}</div>
            <div v-if="slot.task_id && slot.state === 0" class="task-waiting-badge">
              {{
                t('pages.taskStatus.task.waiting', { picked: slot.picked_count ?? 0, target: slot.target_count ?? 0 })
              }}
            </div>
            <div class="robot-info">
              <div class="info-row">
                <span class="info-label">{{ t('pages.taskStatus.task.target') }}</span>
                <span v-if="slot.task_id" class="info-value">{{ slot.target_count }}</span>
                <span v-else class="info-value">-</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ t('pages.taskStatus.task.done') }}</span>
                <span v-if="slot.task_id" class="info-value">{{ slot.picked_count }}</span>
                <span v-else class="info-value">-</span>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">{{ t('pages.taskStatus.task.progress') }}</span>
              <span v-if="slot.task_id" class="info-value">{{ slot.progress_rate }}%</span>
              <span v-else class="info-value">0%</span>
            </div>
            <div class="progress-bar-track">
              <div class="task-progress-bar-fill" :style="{ width: `${slot.task_id ? slot.progress_rate : 0}%` }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RA-010: 작업 버튼 -->
    <div class="task-button-section">
      <div>
        <div class="button error" @click="handleStopTask">{{ t('pages.taskStatus.task.stop') }}</div>
      </div>
      <div><img src="@renderer/assets/images/logo.png" alt="logo" /></div>
      <div>
        <div class="button success" @click="handleStartTask">{{ t('pages.taskStatus.task.start') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 작업 현황 화면 (TaskStatusView)
 *
 * - RA-009: 전체 로봇 상태 및 진행 정보 조회
 * - RA-034: 작업 진행 정보 실시간 수신
 * - RA-010: 작업 시작/종료 원격 제어
 * - 로봇 상태, 작업 진행, 선별기 상태, WebSocket 재연결 처리
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';
import axios from 'axios';
import { RobotStatusSocket } from '@renderer/services/websocket/robotStatus';
import { TaskStatusSocket } from '@renderer/services/websocket/taskStatus';
import { SorterStatusSocket } from '@renderer/services/websocket/sorterStatus';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import { getRobotList } from '@renderer/services/api/robot';
import { getRobotCommands, requestRobotControl } from '@renderer/services/api/command';
import { refreshAccessToken } from '@renderer/services/auth/tokenRefresh';
import { useErrorToast } from '@renderer/composables/useToast';
import { ERROR_CODES } from '@renderer/constants/errorCodes';
import router from '@renderer/router';
import type { Robot } from '@renderer/types/robot';
import type { RobotStatus } from '@renderer/types/robot';
import type { TaskProgress } from '@renderer/types/task';
import type { SorterStatus } from '@renderer/types/sorter';

const { t } = useI18n();
const confirm = useConfirm();
const { showError } = useErrorToast();

// ==========================================
// 1. 반응형 상태 (Reactive State)
// ==========================================

const robots = ref<Robot[]>([]);
const robotStatus = ref<RobotStatus[]>([]);
const sorterStatus = ref<SorterStatus | null>(null);
const robotsLoading = ref(true);
const taskLoading = ref(true);
const sortingLoading = ref(true);
const robotsDisconnected = ref(false);
const taskDisconnected = ref(false);
const robotsReconnecting = ref(false);
const taskReconnecting = ref(false);
const sortingDisconnected = ref(true);
const sortingReconnecting = ref(false);
const safetyConnected = ref(false);

// ==========================================
// 작업 큐 (컨베이어 벨트)
// 길이: robots.length + 1 (로봇 수 + 진입 슬롯)
// 인덱스 0 = 가장 오른쪽(벨트 입구), 인덱스 N = 가장 왼쪽(완료 슬롯)
// 화면 표시: 인덱스 0 ~ robots.length-1 (마지막 인덱스 제외)
// ==========================================
interface TaskSlot {
  task_id: string | null;
  state: number | null;
  target_count: number | undefined;
  picked_count: number | undefined;
  progress_rate: number | undefined;
}
const taskQueue = ref<TaskSlot[]>([]);
const taskMap = ref<Map<string, TaskProgress>>(new Map());

const outgoingQueue = ref<TaskSlot[]>([]); // 이전 프레임 작업 슬롯 (exit 애니메이션용)
const isTaskTransitioning = ref(false); // 슬라이드 전환 중 여부
let isTaskAnimating = false; // 애니메이션 중복 실행 방지 플래그
const taskGridRef = ref<HTMLElement | null>(null); // 현재 task-grid DOM 참조
const taskSlotWidth = ref(0); // 한 슬롯의 좌우 간격(translateX에 사용)

/** 작업 슬롯 너비 측정 (슬라이드 애니메이션에 사용) */
const measureTaskSlot = (): void => {
  const el = taskGridRef.value;
  if (!el) return;
  const cards = el.querySelectorAll<HTMLElement>('.robot-card');
  if (cards.length >= 2) {
    taskSlotWidth.value = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  } else if (cards.length === 1) {
    taskSlotWidth.value = cards[0].getBoundingClientRect().width;
  }
};

/** 비어 있는 작업 슬롯 생성 */
const emptySlot = (): TaskSlot => ({
  task_id: null,
  state: null,
  target_count: undefined,
  picked_count: undefined,
  progress_rate: undefined,
});

/**
 * 작업 큐를 현재 로봇 수만큼 빈 슬롯으로 초기화
 * - 로봇 목록 변경 시 큐 길이를 다시 맞춥니다.
 */
const initTaskQueue = (): void => {
  taskQueue.value = Array.from({ length: robots.value.length }, () => emptySlot());
};

/**
 * 작업 슬롯 좌/우 슬라이드 애니메이션 실행
 * - 현재 슬롯을 outgoingQueue에 복사하여 exit 상태로 만들고,
 * - afterUpdate로 taskQueue를 갱신한 후 420ms간 enter/exit CSS 클래스를 적용합니다.
 */
const triggerSlideAnimation = (afterUpdate: () => void): void => {
  if (isTaskAnimating) return;
  isTaskAnimating = true;
  measureTaskSlot();
  outgoingQueue.value = taskQueue.value.map((s) => ({ ...s }));
  afterUpdate();
  isTaskTransitioning.value = true;
  setTimeout(() => {
    isTaskTransitioning.value = false;
    isTaskAnimating = false;
  }, 420);
};

// ==========================================
// 1-1. 재연결 시 토큰 갱신 상태 (RA-002)
// ==========================================
let isActive = false; // 컴포넌트 마운트 상태 (재연결/토큰 갱신 제어)
const authErrorById = new Map<string, string>(); // WebSocket별 401/403 발생 시점 기록
let wsTokenRefreshPromise: Promise<string | null> | null = null; // 중복 토큰 갱신 방지

/** WebSocket 메시지에 401/403 인증 오류 코드가 포함되어 있는지 확인 */
const isAuthError = (msg: string): boolean => /\b(401|403)\b/.test(msg);

/**
 * WebSocket 재연결을 위한 토큰 갱신
 * - 이미 진행 중인 갱신이 있으면 해당 Promise를 공유합니다.
 * - isActive가 false면 즉시 null을 반환해 불필요한 갱신을 막습니다.
 */
const refreshAccessTokenForWs = async (): Promise<string | null> => {
  if (!isActive) return null;
  if (wsTokenRefreshPromise) return wsTokenRefreshPromise;

  wsTokenRefreshPromise = refreshAccessToken().finally(() => {
    wsTokenRefreshPromise = null;
  });

  return wsTokenRefreshPromise;
};

/**
 * 401/403 오류 발생 시 토큰 갱신 후 해당 WebSocket 재연결
 * - 갱신 성공: 즉시 connect() 호출 후 disconnected/reconnecting 상태 해제
 * - 갱신 실패: scheduleReconnect로 재시도 타이머 등록
 */
const refreshTokenAndReconnect = async (
  socket: RobotStatusSocket | TaskStatusSocket | SorterStatusSocket,
  id: string,
): Promise<void> => {
  if (!isActive) return;

  const newToken = await refreshAccessTokenForWs();
  if (!isActive) return;

  if (newToken) {
    try {
      await socket.connect();
      if (id === RobotStatusSocket.ID) {
        robotsDisconnected.value = false;
        robotsReconnecting.value = false;
      } else if (id === TaskStatusSocket.ID) {
        taskDisconnected.value = false;
        taskReconnecting.value = false;
      } else if (id === SorterStatusSocket.ID) {
        sortingDisconnected.value = false;
        sortingReconnecting.value = false;
      }
    } catch {
      // 연결 실패 시 close/error 핸들러가 다음 재연결 처리
    }
  } else {
    socket.scheduleReconnect(() => {
      if (id === RobotStatusSocket.ID) robotsReconnecting.value = true;
      else if (id === TaskStatusSocket.ID) taskReconnecting.value = true;
      else if (id === SorterStatusSocket.ID) sortingReconnecting.value = true;
    });
  }
};

// ==========================================
// 2. 서비스 인스턴스
// ==========================================

/**
 * 지정한 원격 제어 명령어를 모든 연결된 로봇에 전송합니다.
 * @param command - 명령어 문자열 (START / STOP 등)
 * @param successMessage - 성공 시 토스트 메시지
 */
const sendCommand = async (command: string, successMessage: string): Promise<void> => {
  if (robots.value.length === 0) {
    showError('warn', t('pages.taskStatus.task.remoteControlNoRobot'));
    return;
  }
  try {
    const response = await getRobotCommands();
    const commands = response.data ?? [];
    const target = commands.find((item) => item.command === command);
    if (!target) {
      showError('warn', t('pages.taskStatus.task.commandNotFound'));
      return;
    }
    const robotIds = robots.value.map((robot) => robot.robot_id);
    await requestRobotControl({
      robot_id: robotIds,
      command_id: target.command_id,
      extra_command: null,
    });
    showError('success', successMessage);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as
        | { detail?: { err_code?: string; message?: string }; err_code?: string }
        | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      const message = responseData?.detail?.message ?? error.message;
      if (errCode === ERROR_CODES.NO_PERMISSION) {
        showError('warn', t('common.error.noPermission'));
        return;
      }
      if (errCode === ERROR_CODES.VALIDATION_FAILED) {
        showError('warn', t('pages.taskStatus.task.invalidInput'));
        return;
      }
      showError('error', message);
    } else {
      showError('error', t('common.error.networkError'));
    }
  }
};

/** 작업 시작 명령을 확인 다이얼로그로 띄우고 전송 */
const handleStartTask = (): void => {
  confirm.require({
    message: t('pages.taskStatus.task.confirmStart'),
    acceptClass: 'success',
    acceptLabel: t('pages.taskStatus.task.startLabel'),
    accept: () => {
      void sendCommand('START', t('pages.taskStatus.task.startRequested'));
    },
  });
};

/** 작업 종료 명령을 확인 다이얼로그로 띄우고 전송 */
const handleStopTask = (): void => {
  confirm.require({
    message: t('pages.taskStatus.task.confirmStop'),
    acceptClass: 'error',
    acceptLabel: t('pages.taskStatus.task.stopLabel'),
    accept: () => {
      void sendCommand('STOP', t('pages.taskStatus.task.stopRequested'));
    },
  });
};

const robotSocket = new RobotStatusSocket(); // 로봇 상태 WebSocket
const taskSocket = new TaskStatusSocket(); // 작업 진행 WebSocket
const sorterSocket = new SorterStatusSocket(); // 선별기 상태 WebSocket

let robotsReconnectTimer: ReturnType<typeof setTimeout> | null = null; // 로봇 수동 재연결 타이머
let taskReconnectTimer: ReturnType<typeof setTimeout> | null = null; // 작업 수동 재연결 타이머

/** 로봇 상태 WebSocket 수동 재연결 (1.5초 딜레이) */
const reconnectRobots = (): void => {
  robotsDisconnected.value = false;
  robotsReconnecting.value = true;
  if (robotsReconnectTimer) clearTimeout(robotsReconnectTimer);
  robotsReconnectTimer = setTimeout(() => {
    robotsReconnectTimer = null;
    handleRobotList();
    void robotSocket.connect();
  }, 1500);
};

/** 작업 진행 WebSocket 수동 재연결 (1.5초 딜레이) */
const reconnectTask = (): void => {
  taskDisconnected.value = false;
  taskReconnecting.value = true;
  if (taskReconnectTimer) clearTimeout(taskReconnectTimer);
  taskReconnectTimer = setTimeout(() => {
    taskReconnectTimer = null;
    handleRobotList();
    void taskSocket.connect();
  }, 1500);
};

// ==========================================
// 3. 유틸리티
// ==========================================

/** robotId로 robotStatus 배열에서 상태 객체 조회 */
const getStatus = (robotId: number): RobotStatus | undefined => robotStatus.value.find((s) => s.robot_id === robotId);

/** 선별기 상태에서 sector 번호에 해당하는 배출 수량을 조회 (없으면 0) */
const getSectorCount = (sector: number): number => sorterStatus.value?.sector_info?.[String(sector)] ?? 0;

/**
 * 로봇 상태 메시지 처리
 * - 수신된 전체 로봇 상태 배열을 순회하며 기존 항목은 병합, 새 항목은 추가합니다.
 * @param incoming - 수신된 RobotStatus 배열
 */
const handleRobotMessage = (incoming: RobotStatus[]): void => {
  incoming.forEach((robot) => {
    const existing = robotStatus.value.find((r) => r.robot_id === robot.robot_id);
    if (existing) Object.assign(existing, robot);
    else robotStatus.value.push(robot);
  });
};

/** 숫자를 한국어 locale 문자열로 포맷 (NaN/null 시 0 반환) */
const formatNumber = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '0';
  return value.toLocaleString('ko-KR');
};

/** 로봇 상태(state/connected)에 따라 화면에 표시할 라벨 반환 */
const statusLabel = (status: RobotStatus | undefined): string => {
  if (!status || !status.connected) return t('pages.taskStatus.robot.status.disconnected');
  if (status.state === null) return t('pages.taskStatus.robot.status.noInfo');
  if (status.state === 0) return t('pages.taskStatus.robot.status.idle');
  if (status.state === 1) return t('pages.taskStatus.robot.status.running');
  if (status.state === 2) return t('pages.taskStatus.robot.status.paused');
  if (status.state === 3) return t('pages.taskStatus.robot.status.stopped');
  if (status.state === 4) return t('pages.taskStatus.robot.status.emergency');
  return '-';
};

/** 로봇 상태에 따라 CSS 클래스명 반환 (색상 연결용) */
const statusClass = (status: RobotStatus | undefined): string => {
  if (!status || !status.connected) return 'status-disconnected';
  if (status.state === null) return 'status-idle';
  if (status.state === 1) return 'status-running';
  if (status.state === 2) return 'status-paused';
  return 'status-idle';
};

// ==========================================
// 4. WebSocket 이벤트 핸들러
// ==========================================

/**
 * 작업 진행 메시지 처리
 * - 수신된 작업 목록을 큐에 매핑합니다.
 * - taskListChanged가 true면 이전/신규 큐를 교체하며 슬라이드 애니메이션을 실행합니다.
 * - taskMap에 task_id별 최신 progress를 캐싱합니다.
 * @param incoming - 수신된 TaskProgress 배열
 */
const handleTaskMessage = (incoming: TaskProgress[]): void => {
  const len = robots.value.length;
  if (len === 0 || taskQueue.value.length !== len) return;

  const nextQueue: TaskSlot[] = Array.from({ length: len }, () => emptySlot());
  for (let i = 0; i < incoming.length && i < len; i++) {
    const task = incoming[i];
    if (!task?.task_id) continue;
    taskMap.value.set(task.task_id, task);
    nextQueue[i] = {
      task_id: task.task_id,
      state: null,
      target_count: task.target_count,
      picked_count: task.picked_count,
      progress_rate: task.progress_rate,
    };
  }

  const taskListChanged = nextQueue.some((slot, i) => slot.task_id !== taskQueue.value[i].task_id);

  if (taskListChanged) {
    triggerSlideAnimation(() => {
      taskQueue.value = nextQueue;
    });
  } else {
    taskQueue.value = nextQueue;
  }
};

/**
 * 선별기 상태 메시지 처리
 * - sorterStatus에 전체 상태 저장
 * - connected=false면 분리(disconnected) 처리
 */
const handleSorterMessage = (status: SorterStatus): void => {
  sorterStatus.value = status;
  sortingDisconnected.value = !status.connected;
};

// ==========================================
// 5. 연결 라이프사이클
// ==========================================

/**
 * WebSocket 연결 및 글로벌 이벤트 핸들러 등록
 * - onOpen: 연결 성공 시 loading/reconnecting/disconnected 상태 해제
 * - onMessage: 소켓 ID별 메시지 파싱 후 핸들러에 위임
 * - onError: 인증 오류(401/403) 발생 시 authErrorById에 기록
 * - onClose: 일반 close 시 재연결, 인증 오류 시 토큰 갱신 후 재연결
 * - 마지막으로 세 소켓을 connect() 합니다.
 */
const connect = async (): Promise<void> => {
  WebSocketService.onOpen((id) => {
    authErrorById.delete(id);
    if (id === RobotStatusSocket.ID) {
      robotsLoading.value = false;
      robotsDisconnected.value = false;
      robotsReconnecting.value = false;
    }
    if (id === TaskStatusSocket.ID) {
      taskLoading.value = false;
      taskDisconnected.value = false;
      taskReconnecting.value = false;
    }
    if (id === SorterStatusSocket.ID) {
      sortingLoading.value = false;
      sortingDisconnected.value = false;
      sortingReconnecting.value = false;
    }
  });

  WebSocketService.onMessage((id, data) => {
    try {
      if (id === RobotStatusSocket.ID) {
        robotsDisconnected.value = false;
        robotsReconnecting.value = false;
        handleRobotMessage(RobotStatusSocket.parseData(data));
      } else if (id === TaskStatusSocket.ID) {
        taskDisconnected.value = false;
        taskReconnecting.value = false;
        handleTaskMessage(TaskStatusSocket.parseData(data));
      } else if (id === SorterStatusSocket.ID) {
        sortingLoading.value = false;
        sortingReconnecting.value = false;

        const parsed = SorterStatusSocket.parseData(data);

        handleSorterMessage(parsed);
      }
    } catch {
      if (id === RobotStatusSocket.ID) robotsLoading.value = false;
      if (id === TaskStatusSocket.ID) taskLoading.value = false;
    }
  });

  WebSocketService.onError((id, msg) => {
    if (id === RobotStatusSocket.ID) robotsLoading.value = false;
    else if (id === TaskStatusSocket.ID) taskLoading.value = false;
    else if (id === SorterStatusSocket.ID) sortingLoading.value = false;

    if (isAuthError(msg)) {
      authErrorById.set(id, msg);
    }
  });

  WebSocketService.onClose((id) => {
    if (id === RobotStatusSocket.ID) {
      if (robotsReconnecting.value) {
        robotsReconnecting.value = false;
        robotsDisconnected.value = true;
        return;
      }
      robotsDisconnected.value = true;
      if (authErrorById.has(id)) {
        authErrorById.delete(id);
        void refreshTokenAndReconnect(robotSocket, id);
      } else {
        robotSocket.scheduleReconnect(() => {
          robotsReconnecting.value = true;
        });
      }
    } else if (id === TaskStatusSocket.ID) {
      if (taskReconnecting.value) {
        taskReconnecting.value = false;
        taskDisconnected.value = true;
        return;
      }
      taskDisconnected.value = true;
      if (authErrorById.has(id)) {
        authErrorById.delete(id);
        void refreshTokenAndReconnect(taskSocket, id);
      } else {
        taskSocket.scheduleReconnect(() => {
          taskReconnecting.value = true;
        });
      }
    } else if (id === SorterStatusSocket.ID) {
      if (sortingReconnecting.value) {
        sortingReconnecting.value = false;
        sortingDisconnected.value = true;
        return;
      }
      sortingDisconnected.value = true;
      if (authErrorById.has(id)) {
        authErrorById.delete(id);
        void refreshTokenAndReconnect(sorterSocket, id);
      } else {
        sorterSocket.scheduleReconnect(() => {
          sortingReconnecting.value = true;
        });
      }
    }
  });

  await robotSocket.connect();
  await taskSocket.connect();
  await sorterSocket.connect();
};

/**
 * WebSocket 연결 정리
 * - offListeners로 글로벌 리스너 해제
 * - 수동 재연결 타이머 클리어
 * - 세 소켓 인스턴스 destroy
 */
const disconnect = async (): Promise<void> => {
  WebSocketService.offListeners();
  if (robotsReconnectTimer) {
    clearTimeout(robotsReconnectTimer);
    robotsReconnectTimer = null;
  }
  if (taskReconnectTimer) {
    clearTimeout(taskReconnectTimer);
    taskReconnectTimer = null;
  }
  await robotSocket.destroy();
  await taskSocket.destroy();
  await sorterSocket.destroy();
};

// ==========================================
// 5. 로봇 리스트 조회 핸들러
// ==========================================
/**
 * 전체 로봇 리스트 API 조회
 * - 로봇 목록을 받아오면 robots에 저장하고 작업 큐를 초기화(initTaskQueue)합니다.
 * - 인증/권한/네트워크 오류에 따라 토스트 메시지를 표시합니다.
 */
const handleRobotList = async (): Promise<void> => {
  try {
    const data = await getRobotList();
    if (data?.data) {
      robots.value = data.data;
      initTaskQueue();
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
      const errCode = responseData?.detail?.err_code ?? responseData?.err_code;
      const AUTH_ERROR_CODES = [
        ERROR_CODES.AUTH_HEADER_MISSING,
        ERROR_CODES.ACCESS_TOKEN_EXPIRED,
        ERROR_CODES.ACCESS_TOKEN_INVALID,
        ERROR_CODES.TOKEN_IP_MISMATCH,
        ERROR_CODES.SESSION_BLOCKED,
      ] as string[];
      if (errCode && AUTH_ERROR_CODES.includes(errCode)) {
        return;
      }
      if (errCode === ERROR_CODES.NO_PERMISSION) {
        showError('warn', t('common.error.noPermission'));
      } else if (responseData?.detail || responseData?.err_code) {
        showError('error', t('common.error.serverError'));
      } else {
        showError('error', t('common.error.networkError'));
      }
    } else {
      showError('error', t('common.error.networkError'));
    }
  } finally {
    robotsLoading.value = false;
    taskLoading.value = false;
  }
};

/**
 * 마운트 시 WebSocket 연결, 로봇 리스트 조회
 * - isActive=true로 재연결/토큰 갱신 활성화
 * - 세 소켓 connect 및 로봇 목록 API 호출
 */
onMounted(() => {
  isActive = true;
  robotsLoading.value = true;
  taskLoading.value = true;
  sortingLoading.value = true;
  connect();
  handleRobotList();
});

/**
 * 언마운트 시 플래그 해제 및 WebSocket/타이머 정리
 * - isActive=false로 비동기 재연결 중단
 * - disconnect()로 리스너 및 소켓 정리
 */
onUnmounted(() => {
  isActive = false;
  disconnect();
});
</script>

<style scoped lang="scss">
// ==========================================
// 레이아웃
// ==========================================

.task-status-view {
  position: relative;
  width: 100%;
  height: 100%;
}

.robots-section {
  position: absolute;
  top: 30rem;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  width: 100%;
}

.sorting-section {
  position: absolute;
  top: 13rem;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 2rem;
}

.task-section {
  position: absolute;
  top: 12rem;
  left: 0;
  right: 0;
}

// ==========================================
// 로딩 / 연결 끊김
// ==========================================

.section-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 1.5rem 2rem;
  z-index: 10;

  > div {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 24px;

    > div {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      width: 30rem;
    }
  }
}

.robots-section .section-loading {
  min-height: 310px;
}
.task-section .section-loading {
  min-height: 279px;
}
.sorting-section .section-loading {
  min-height: 101px;
  padding: 0 2rem;

  > div > div {
    flex-direction: row;
    width: 50rem;

    .button {
      width: 30rem;
    }
  }
}

// ==========================================
// 로봇 그리드
// ==========================================

.robot-grid {
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
  padding: 2rem;
}

.robot-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.5rem 2rem;
  min-width: 22rem;
}

.robot-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.robot-id {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-button);
}

.robot-status {
  font-size: 20px;
  font-weight: 600;
  padding: 0.3rem 1rem;
  border-radius: 999px;
  width: fit-content;

  &.status-running {
    background-color: color-mix(in srgb, var(--color-primary-400), transparent 80%);
    color: var(--color-primary-500);
  }
  &.status-paused {
    background-color: color-mix(in srgb, #f59e0b, transparent 80%);
    color: #f59e0b;
  }
  &.status-idle {
    background-color: color-mix(in srgb, var(--color-gray-400), transparent 80%);
    color: var(--color-gray-500);
  }
  &.status-disconnected {
    background-color: color-mix(in srgb, #ef4444, transparent 80%);
    color: #ef4444;
  }
}

.robot-detail-button {
  margin-top: 1rem;
}

// ==========================================
// 공통 정보 행
// ==========================================

.robot-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}

.info-label {
  font-size: 20px;
  color: color-mix(in srgb, var(--text-button), transparent 40%);
}

.info-value {
  font-size: 20px;
  color: var(--text-button);
}

// ==========================================
// 프로그레스 바
// ==========================================

.progress-bar-track {
  height: 15px;
  border-radius: 999px;
  background-color: color-mix(in srgb, var(--color-gray-400), transparent 70%);
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background-color: var(--color-primary-400);
  transition: width 0.4s ease;
}

.task-progress-bar-fill {
  height: 100%;
  border-radius: 999px;
  background-color: var(--color-accent-500);
  transition: width 0.4s ease;
}

.task-grid-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.task-grid-exit {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  animation: gridSlideExit 0.4s ease-in-out forwards;
}

.task-grid-enter {
  animation: gridSlideEnter 0.4s ease-in-out forwards;
}

@keyframes gridSlideExit {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-1 * var(--slot-w, 24rem)));
  }
}

@keyframes gridSlideEnter {
  from {
    transform: translateX(var(--slot-w, 24rem));
  }
  to {
    transform: translateX(0);
  }
}

.task-id-header {
  position: absolute;
  top: 0.6rem;
  left: 0.8rem;
  padding: 0.15rem 0.55rem;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.35);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  pointer-events: none;
  z-index: 2;
}

.task-idle-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  border-radius: inherit;
  z-index: 5;
  pointer-events: none;
}

.task-waiting-badge {
  position: absolute;
  top: 0.6rem;
  right: 0.8rem;
  padding: 0.15rem 0.55rem;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.15);
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  pointer-events: none;
  z-index: 2;
}

// ==========================================
// 선별기 그리드
// ==========================================
.sorter-field {
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 85px;
  border-bottom: 1px solid var(--color-gray-50);
}
.sorter-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  gap: 1rem;
  padding-bottom: 1rem;
}
.sorter-item:not(:last-child) {
  border-right: 1px solid var(--color-gray-50);
}
.sorter-item > div:first-child {
  font-size: 20px;
  color: color-mix(in srgb, var(--text-button), transparent 50%);
}
.sorter-item > div:last-child {
  font-size: 24px;
  color: var(--text-button);
}
.sorter-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1rem 0;
  font-size: 18px;
  color: color-mix(in srgb, var(--text-button), transparent 40%);
}

// ==========================================
// 확인 팝업
// ==========================================

.task-confirm-content {
  padding: 2rem 2rem 1rem;
  font-size: 22px;
  color: var(--text-button);
  text-align: center;
}

// ==========================================
// 작업 버튼
// ==========================================

.task-button-section {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 0 2rem;

  > div {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    box-sizing: border-box;

    &:first-child {
      padding-right: 15rem;
    }
    &:last-child {
      padding-left: 15rem;
    }

    > img {
      width: 100px;
      opacity: 0.3;
    }
  }
}

.connected-info-section {
  position: absolute;
  top: 2rem;
  right: 13rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  font-size: 16px;
}
.connected-info-section > div {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.connected-info-section > div > div:first-child {
  display: flex;
  justify-content: start;
  width: 220px;
}
.connected-info-section > div > div:last-child {
  display: flex;
  justify-content: end;
  width: 80px;
}
</style>
