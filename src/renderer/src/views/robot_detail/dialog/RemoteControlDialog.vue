<template>
  <PDialog
    :visible="visible"
    :header="t('pages.robotDetail.remoteControl')"
    :style="{
      width: '69.5vw',
      height: '98vh',
      marginRight: '2rem !important',
    }"
    position="right"
    class="glass-dialog"
    :closable="false"
    :maximizable="false"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="remote-control-content">
      <RemoteCommandList v-model:selected-command-id="selectedCommandId" :commands="commands" @send="handleSend" />
      <RemoteControlHistoryPanel
        v-model:date="searchDate"
        v-model:start-time="searchStartTime"
        v-model:end-time="searchEndTime"
        :history="history"
        @search="startHistorySocket"
      >
        <template #footer>
          <div class="remote-control-footer">
            <div class="button gray" @click="emit('update:visible', false)">{{ t('common.close') }}</div>
          </div>
        </template>
      </RemoteControlHistoryPanel>
    </div>
  </PDialog>

  <RemoteControlConfirmDialog
    v-model:visible="isConfirmPopupOpen"
    v-model:extra-command="confirmExtraCommand"
    :selected-command="selectedCommand"
    @send="handleConfirmSend"
    @cancel="isConfirmPopupOpen = false"
  />
</template>

<script setup lang="ts">
/**
 * 원격 제어 다이얼로그
 *
 * - 로봇 명령어 선택 및 전송
 * - RemoteControlHistorySocket으로 이력 실시간 조회
 * - extra_command 추가 입력 확인
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateTimeSearch } from '@renderer/composables/useDateTimeSearch';
import PDialog from 'primevue/dialog';
import RemoteCommandList from './RemoteCommandList.vue';
import RemoteControlHistoryPanel from './RemoteControlHistoryPanel.vue';
import RemoteControlConfirmDialog from './RemoteControlConfirmDialog.vue';
import { getRobotCommands, sendRobotControlRequest } from '@renderer/services/api/robot';
import { RemoteControlHistorySocket } from '@renderer/services/websocket/remoteControlHistory';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import { useErrorToast } from '@renderer/composables/useToast';
import type { RobotCommand, RemoteControlHistoryItem } from '@renderer/types/robot';

const props = defineProps<{
  visible?: boolean;
  robotId?: number;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const { t } = useI18n();
const { showError } = useErrorToast();
const { searchDate, searchStartTime, searchEndTime, toDatetimeParam } = useDateTimeSearch();

const commands = ref<RobotCommand[]>([]);
const selectedCommandId = ref<number | null>(null);
const history = ref<RemoteControlHistoryItem[]>([]);
const socket = ref<RemoteControlHistorySocket | null>(null);
const isConfirmPopupOpen = ref(false);
const confirmExtraCommand = ref('');

/** 현재 선택된 명령어 객체 */
const selectedCommand = computed<RobotCommand | undefined>(() =>
  commands.value.find((cmd) => cmd.command_id === selectedCommandId.value),
);

/** 사용 가능한 로봇 명령어 목록 조회 */
const loadCommands = async (): Promise<void> => {
  try {
    const response = await getRobotCommands();
    commands.value = response.data ?? [];
  } catch {
    showError('error', t('pages.robotDetail.remoteControlCommandLoadFailed'));
  }
};

/** 선택된 로봇/기간으로 원격 제어 이력 WebSocket 연결 */
const startHistorySocket = async (): Promise<void> => {
  if (!props.robotId) return;
  await stopHistorySocket();
  const s = new RemoteControlHistorySocket(props.robotId);
  socket.value = s;
  const start = toDatetimeParam(searchDate.value, searchStartTime.value);
  const end = toDatetimeParam(searchDate.value, searchEndTime.value);
  await s.connect(start, end);
};

/** 원격 제어 이력 WebSocket 연결 종료 */
const stopHistorySocket = async (): Promise<void> => {
  if (socket.value) {
    await socket.value.disconnect();
    socket.value = null;
  }
};

/** WebSocket 메시지 수신: 이력 갱신 */
const handleWsMessage = (id: string, data: string): void => {
  if (socket.value && id === socket.value.id) {
    history.value = socket.value.parseData(data);
  }
};

onMounted(() => {
  WebSocketService.onMessage(handleWsMessage);
  if (props.visible) {
    void loadCommands();
    void startHistorySocket();
  }
});

onUnmounted(async () => {
  WebSocketService.offMessage(handleWsMessage);
  await stopHistorySocket();
});

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      void loadCommands();
      void startHistorySocket();
    } else {
      void stopHistorySocket();
    }
  },
);

watch(
  () => props.robotId,
  () => {
    if (props.visible) {
      void startHistorySocket();
    }
  },
);

/** 명령어 전송 버튼: 추가 파라미터 확인 팝업 */
const handleSend = (): void => {
  if (!selectedCommandId.value) return;
  confirmExtraCommand.value = '';
  isConfirmPopupOpen.value = true;
};

/** 확인 팝업에서 최종 원격 제어 API 요청 */
const handleConfirmSend = async (): Promise<void> => {
  if (!props.robotId || !selectedCommand.value) return;
  try {
    await sendRobotControlRequest({
      robot_id: [props.robotId],
      command_id: selectedCommand.value.command_id,
      extra_command: selectedCommand.value.extra_usable ? confirmExtraCommand.value || null : null,
    });
    showError('success', t('pages.robotDetail.remoteControlSendSuccess'));
    isConfirmPopupOpen.value = false;
  } catch {
    showError('warn', t('pages.robotDetail.remoteControlSendFailed'));
  }
};
</script>

<style scoped lang="scss">
.remote-control-content {
  display: flex;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}
.remote-control-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}
.remote-control-footer .button {
  width: 12rem;
}

:deep(.p-dialog-content) {
  padding-bottom: 0;
}
</style>
