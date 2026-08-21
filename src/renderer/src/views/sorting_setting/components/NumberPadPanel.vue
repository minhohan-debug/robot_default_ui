<template>
  <div class="number-pad-overlay" :class="{ active: visible }" @click.self="emit('close')">
    <div class="number-pad-panel" @click.stop>
      <div class="number-pad-title">{{ title }}</div>
      <div class="number-pad-preview-row">
        <div class="number-pad-arrow" @click="emit('prev')">
          <i class="pi pi-chevron-left number-pad-arrow-icon"></i>
        </div>
        <div class="number-pad-preview">{{ modelValue }}</div>
        <div class="number-pad-arrow" @click="emit('next')">
          <i class="pi pi-chevron-right number-pad-arrow-icon"></i>
        </div>
      </div>
      <div class="number-pad-field">
        <ul>
          <li @click="handleKey('1')">1</li>
          <li @click="handleKey('2')">2</li>
          <li @click="handleKey('3')">3</li>
        </ul>
        <ul>
          <li @click="handleKey('4')">4</li>
          <li @click="handleKey('5')">5</li>
          <li @click="handleKey('6')">6</li>
        </ul>
        <ul>
          <li @click="handleKey('7')">7</li>
          <li @click="handleKey('8')">8</li>
          <li @click="handleKey('9')">9</li>
        </ul>
        <ul>
          <li @click="handleKey('C')">C</li>
          <li @click="handleKey('0')">0</li>
          <li @click="handleKey('backspace')"><i class="pi pi-arrow-left"></i></li>
        </ul>
      </div>
      <div class="number-pad-actions">
        <div class="button gray" @click="emit('close')">{{ t('common.close') }}</div>
        <div class="button primary" :class="{ disabled: saveDisabled }" @click="emit('save')">
          {{ t('common.save') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 숫자 입력 패널 (0~999)
 *
 * - SortingSettingView에서 무게 입력에 사용
 * - 0~9, C(전체 클리어), 백스페이스 입력 지원
 * - 최소 0, 최대 999까지 3자리 숫자로 제한 (clampNumericInput)
 * - 좌/우 화살표로 이전/다음 셀 이동, 저장/닫기 이벤트 emit
 * - visible 상태에 따라 overlay 슬라이드 애니메이션
 */
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  title: string;
  visible: boolean;
  saveDisabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
}>();

const modelValue = defineModel<string>({ default: '' });

const { t } = useI18n();
const isFirstInput = ref(true); // 새 셀 선택 또는 C 입력 후 첫 입력 여부
const MIN_VALUE = 0; // 최소값
const MAX_VALUE = 999; // 최대값 (3자리)

/** title(선택 셀)이 바뀌면 첫 입력 플래그 초기화 */
watch(
  () => props.title,
  () => {
    isFirstInput.value = true;
  },
);

/**
 * 0~999 범위로 숫자 문자열 제한
 * - 숫자가 아니면 0
 * - MIN/MAX 범위로 clamp
 */
const clampNumericInput = (value: string): string => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return '0';
  return String(Math.min(Math.max(parsed, MIN_VALUE), MAX_VALUE));
};

/**
 * 키패드 입력 처리
 * - 'C': 0으로 초기화, isFirstInput=true
 * - 'backspace': 마지막 한 글자 삭제
 * - 숫자: 첫 입력/현재 0이면 교체, 아니면 추가
 * - 모든 결과는 clampNumericInput으로 0~999 제한
 */
const handleKey = (key: string): void => {
  if (key === 'C') {
    modelValue.value = '0';
    isFirstInput.value = true;
    return;
  }

  if (key === 'backspace') {
    modelValue.value = clampNumericInput(modelValue.value.slice(0, -1));
    isFirstInput.value = false;
    return;
  }

  const current = modelValue.value;
  const next = isFirstInput.value || current === '0' ? key : current + key;
  modelValue.value = clampNumericInput(next);
  isFirstInput.value = false;
};
</script>

<style scoped lang="scss">
.number-pad-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 2rem;
}
.number-pad-overlay.active {
  opacity: 1;
  pointer-events: none;
}

.number-pad-panel {
  pointer-events: auto;
  width: 32rem;
  max-height: calc(100% - 4rem);
  background: var(--bg-dialog);
  border-radius: 8px;
  padding: 2rem;
  margin-top: 8rem;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  box-shadow: 0 4px 34px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(24px) saturate(160%);
}
.number-pad-overlay.active .number-pad-panel {
  transform: translateX(0);
}

.number-pad-title {
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 1rem;
  text-align: center;
}

.number-pad-preview-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.number-pad-preview {
  display: flex;
  justify-content: center;
  flex: 1;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-button);
  padding: 1rem;
  background: var(--bg-surface);
  border-radius: 4px;
  letter-spacing: 2px;
}

.number-pad-arrow {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 65px;
  background: color-mix(in srgb, var(--color-gray-200) 40%, transparent);
  border-radius: 8px;
}
.number-pad-arrow-icon {
  font-size: 20px;
  color: var(--text-button);
}

.number-pad-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
.number-pad-actions > .button {
  flex: 1;
  height: 60px;
}

.number-pad-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.number-pad-field ul {
  display: flex;
  gap: 1rem;
}
.number-pad-field ul li {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 5rem;
  color: var(--text-button, #111827);
  background-color: color-mix(in srgb, var(--bg-input, #e5e7eb), transparent 65%) !important;
  border-radius: 4px;
  font-size: 24px;
  transition: background-color 0.2s ease;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  &:active {
    background-color: color-mix(in srgb, var(--bg-input, #e5e7eb), transparent 30%) !important;
  }
}
.number-pad-field ul li i {
  font-size: 20px;
}
</style>
