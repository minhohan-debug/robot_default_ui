<template>
  <div class="remote-control-panel">
    <div class="panel-title">{{ t('pages.robotDetail.remoteControlCommandListTitle') }}</div>
    <div class="command-list">
      <div
        v-for="cmd in commands"
        :key="cmd.command_id"
        class="command-item"
        :class="{ active: selectedCommandId === cmd.command_id }"
        @click="select(cmd.command_id)"
      >
        <div class="command-name">{{ cmd.command }}</div>
        <div class="command-desc">{{ cmd.description }}</div>
      </div>
    </div>
    <div class="button primary" :class="{ disabled: !selectedCommandId }" @click="handleSend">
      {{ t('pages.robotDetail.remoteControlSend') }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 원격 제어 명령어 선택 리스트
 */
import type { RobotCommand } from '@renderer/types/robot';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  commands: RobotCommand[];
  selectedCommandId?: number | null;
}>();

const emit = defineEmits<{
  (e: 'update:selectedCommandId', value: number | null): void;
  (e: 'send'): void;
}>();

/** 명령어 선택 */
const select = (id: number): void => {
  emit('update:selectedCommandId', id);
};

/** 상위로 전송 이벤트 emit */
const handleSend = (): void => {
  emit('send');
};
</script>

<style scoped lang="scss">
.remote-control-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
}
.panel-title {
  color: var(--text-title);
  font-size: 18px;
  font-weight: 500;
}
.command-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.command-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex: 0 0 80px;
  height: 80px;
  box-sizing: border-box;
  gap: 0.25rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg-input), transparent 70%);
  color: var(--text-button);
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover,
  &.active {
    background: color-mix(in srgb, var(--color-gray-200), transparent 50%);
  }
}
.command-name {
  font-size: 18px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.command-desc {
  font-size: 18px;
  color: var(--text-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.button.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
</style>
