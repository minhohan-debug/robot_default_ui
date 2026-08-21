<template>
  <PDialog
    v-model:visible="localVisible"
    :header="t('pages.robotDetail.remoteControlConfirmTitle')"
    :style="{ width: '30vw' }"
    class="glass-dialog"
    :modal="false"
    :closable="false"
    :maximizable="false"
  >
    <div class="confirm-popup-content">
      <div class="confirm-message">
        {{ t('pages.robotDetail.remoteControlConfirmMessage', { command: selectedCommand?.command ?? '' }) }}
      </div>
      <div v-if="selectedCommand?.extra_usable" class="confirm-field">
        <label>{{ t('pages.robotDetail.remoteControlExtraCommandLabel') }}</label>
        <PInputText v-model="localExtraCommand" placeholder="추가 명령어를 입력하세요" maxlength="20" />
      </div>
      <div class="confirm-actions">
        <div class="button gray" @click="handleCancel">취소</div>
        <div class="button primary" @click="handleSend">전송</div>
      </div>
    </div>
  </PDialog>
</template>

<script setup lang="ts">
/**
 * 원격 제어 전송 확인 다이얼로그
 *
 * - extra_command 지원 명령어일 경우 추가 입력 제공
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PDialog from 'primevue/dialog';
import PInputText from 'primevue/inputtext';
import type { RobotCommand } from '@renderer/types/robot';

const { t } = useI18n();

const props = defineProps<{
  visible?: boolean;
  selectedCommand?: RobotCommand;
  extraCommand?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:extraCommand', value: string): void;
  (e: 'send'): void;
  (e: 'cancel'): void;
}>();

/** 추가 명령어 v-model */
const localExtraCommand = computed({
  get: () => props.extraCommand ?? '',
  set: (value: string) => emit('update:extraCommand', value),
});

/** 다이얼로그 표시 v-model */
const localVisible = computed({
  get: () => props.visible ?? false,
  set: (value: boolean) => emit('update:visible', value),
});

/** 취소 클릭 */
const handleCancel = (): void => {
  localVisible.value = false;
  emit('cancel');
};

/** 전송 클릭 */
const handleSend = (): void => {
  emit('send');
  localVisible.value = false;
};
</script>

<style scoped lang="scss">
.confirm-popup-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
.confirm-message {
  color: var(--text-title);
  font-size: 18px;
  text-align: center;
}
.confirm-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.confirm-field label {
  color: var(--text-label);
  font-size: 16px;
}
.confirm-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
