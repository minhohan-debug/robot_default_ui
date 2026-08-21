<template>
  <div class="date-time-search-panel">
    <div class="search-field">
      <div class="date-time-input">
        <PInputText v-model="localDate" readonly @click="openNumberPad('date')" />
      </div>
      <div class="date-time-input">
        <PInputText v-model="localStartTime" readonly @click="openNumberPad('startTime')" />
      </div>
      <span>-</span>
      <div class="date-time-input">
        <PInputText v-model="localEndTime" readonly @click="openNumberPad('endTime')" />
      </div>
      <div>
        <div class="button gray" @click="handleSearch">{{ searchLabel }}</div>
      </div>
    </div>

    <Teleport to="body">
      <div class="number-pad-overlay" :class="{ active: numberPadActive }">
        <div class="number-pad-panel">
          <div class="number-pad-title">{{ numberPadTitle }}</div>
          <div class="number-pad-preview-row">
            <div class="segment-arrow-container" @click="prevSegment">
              <i class="pi pi-chevron-left segment-arrow" />
            </div>

            <div class="number-pad-preview" :class="{ placeholder: isPlaceholder }">
              <span class="segment" :class="{ active: selectedSegmentIndex === 0 }">{{ formatSegment(0) }}</span>
              <span class="separator">{{ segmentSeparators[0] }}</span>
              <span class="segment" :class="{ active: selectedSegmentIndex === 1 }">{{ formatSegment(1) }}</span>
              <span v-if="isDateTarget" class="separator">{{ segmentSeparators[1] }}</span>
              <span v-if="isDateTarget" class="segment" :class="{ active: selectedSegmentIndex === 2 }">{{
                formatSegment(2)
              }}</span>
            </div>
            <div class="segment-arrow-container" @click="nextSegment">
              <i class="pi pi-chevron-right segment-arrow" />
            </div>
          </div>
          <div class="number-pad-field">
            <ul>
              <li @click="appendDigit('1')">1</li>
              <li @click="appendDigit('2')">2</li>
              <li @click="appendDigit('3')">3</li>
            </ul>
            <ul>
              <li @click="appendDigit('4')">4</li>
              <li @click="appendDigit('5')">5</li>
              <li @click="appendDigit('6')">6</li>
            </ul>
            <ul>
              <li @click="appendDigit('7')">7</li>
              <li @click="appendDigit('8')">8</li>
              <li @click="appendDigit('9')">9</li>
            </ul>
            <ul>
              <li @click="clearPad">C</li>
              <li @click="appendDigit('0')">0</li>
              <li @click="backspacePad"><i class="pi pi-arrow-left"></i></li>
            </ul>
          </div>
          <div class="number-pad-actions">
            <div class="button gray" @click="closeNumberPad">{{ t('common.close') }}</div>
            <div class="button primary" @click="handlePadAction">
              {{ numberPadTarget === 'endTime' ? searchLabel : t('pages.taskHistories.next') }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * 날짜/시간 검색 패널 컴포넌트
 *
 * - v-model(date, startTime, endTime)을 받아 날짜/시간 입력 및 검색 이벤트를 emit합니다.
 * - 숫자 패드를 통해 날짜/시간을 입력할 수 있습니다.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useErrorToast } from '@renderer/composables/useToast';

const { t } = useI18n();
const { showError } = useErrorToast();

const props = defineProps<{
  date: string;
  startTime: string;
  endTime: string;
  searchLabel?: string;
}>();

const emit = defineEmits<{
  (e: 'update:date', value: string): void;
  (e: 'update:startTime', value: string): void;
  (e: 'update:endTime', value: string): void;
  (e: 'search'): void;
}>();

const localDate = computed({
  get: () => props.date,
  set: (value: string) => emit('update:date', value),
});
const localStartTime = computed({
  get: () => props.startTime,
  set: (value: string) => emit('update:startTime', value),
});
const localEndTime = computed({
  get: () => props.endTime,
  set: (value: string) => emit('update:endTime', value),
});

const searchLabel = computed(() => props.searchLabel ?? t('pages.taskHistories.search'));

const numberPadActive = ref(false);
const numberPadTarget = ref<'date' | 'startTime' | 'endTime'>('date');
const isPlaceholder = ref(false);
const selectedSegmentIndex = ref(0);
const segments = ref<string[]>(['', '', '']);

const numberPadTitle = computed(() => {
  if (numberPadTarget.value === 'date') return t('pages.taskHistories.dateInput');
  if (numberPadTarget.value === 'startTime') return t('pages.taskHistories.startTimeInput');
  return t('pages.taskHistories.endTimeInput');
});

const isDateTarget = computed(() => numberPadTarget.value === 'date');

const segmentLengths = computed(() => (isDateTarget.value ? [4, 2, 2] : [2, 2]));
const segmentSeparators = computed(() => (isDateTarget.value ? ['/', '/'] : [':']));

const isSegmentPlaceholder = (): boolean => segments.value.every((s) => s === '');

const formatSegment = (index: number): string => {
  const raw = segments.value[index] || '';
  if (!raw && isSegmentPlaceholder()) {
    if (segmentLengths.value[index] === 4) return '0000';
    if (isDateTarget.value && index > 0) return '01';
    return '00';
  }
  const num = Number(raw.padStart(segmentLengths.value[index], '0'));
  if (isDateTarget.value) {
    if (index === 0) return String(clamp(num, 0, 9999)).padStart(4, '0');
    if (index === 1) return String(clamp(num, 1, 12)).padStart(2, '0');
    const y = Number(formatSegment(0));
    const m = Number(formatSegment(1));
    const lastDay = new Date(y, m, 0).getDate();
    return String(clamp(num, 1, lastDay)).padStart(2, '0');
  }
  if (index === 0) return String(clamp(num, 0, 23)).padStart(2, '0');
  return String(clamp(num, 0, 59)).padStart(2, '0');
};

const previewValue = computed(() => {
  if (isPlaceholder.value) {
    if (numberPadTarget.value === 'date') return '0000/01/01';
    return '00:00';
  }
  const parts = segments.value.map((_, i) => formatSegment(i));
  return parts.join(segmentSeparators.value[0] ?? '');
});

const syncTarget = (): void => {
  if (numberPadTarget.value === 'date') localDate.value = previewValue.value;
  else if (numberPadTarget.value === 'startTime') localStartTime.value = previewValue.value;
  else localEndTime.value = previewValue.value;
};

const parseSegments = (value: string, separator: string): string[] => {
  if (!value) return [];
  const parts = value.split(separator);
  return parts.map((p) => p || '');
};

const openNumberPad = (target: 'date' | 'startTime' | 'endTime'): void => {
  numberPadTarget.value = target;
  selectedSegmentIndex.value = 0;
  if (target === 'date') {
    segments.value = localDate.value ? parseSegments(localDate.value, '/') : ['', '', ''];
    isPlaceholder.value = !localDate.value;
  } else if (target === 'startTime') {
    segments.value = localStartTime.value ? parseSegments(localStartTime.value, ':') : ['', ''];
    isPlaceholder.value = !localStartTime.value;
  } else {
    segments.value = localEndTime.value ? parseSegments(localEndTime.value, ':') : ['', ''];
    isPlaceholder.value = !localEndTime.value;
  }
  syncTarget();
  numberPadActive.value = true;
};

const closeNumberPad = (): void => {
  numberPadActive.value = false;
  isPlaceholder.value = false;
  segments.value = ['', '', ''];
  selectedSegmentIndex.value = 0;
};

const isValidDate = (date: string): boolean => /^\d{4}\/\d{2}\/\d{2}$/.test(date);
const isValidTime = (time: string): boolean => /^\d{2}:\d{2}$/.test(time);

/** 입력값을 지정된 범위로 제한 */
const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const validateSearchParams = (): boolean => {
  if (!isValidDate(localDate.value)) {
    showError('warn', t('pages.taskHistories.invalidDate'));
    return false;
  }
  if (!isValidTime(localStartTime.value)) {
    showError('warn', t('pages.taskHistories.invalidStartTime'));
    return false;
  }
  if (!isValidTime(localEndTime.value)) {
    showError('warn', t('pages.taskHistories.invalidEndTime'));
    return false;
  }
  if (localStartTime.value >= localEndTime.value) {
    showError('warn', t('pages.taskHistories.invalidTimeRange'));
    return false;
  }
  return true;
};

const handleSearch = (): void => {
  if (!validateSearchParams()) return;
  emit('search');
};

const handlePadAction = (): void => {
  syncTarget();
  if (numberPadTarget.value === 'date') {
    openNumberPad('startTime');
  } else if (numberPadTarget.value === 'startTime') {
    openNumberPad('endTime');
  } else {
    if (!validateSearchParams()) return;
    numberPadActive.value = false;
    isPlaceholder.value = false;
    segments.value = ['', '', ''];
    selectedSegmentIndex.value = 0;
    emit('search');
  }
};

const appendDigit = (digit: string): void => {
  const idx = selectedSegmentIndex.value;
  if (isPlaceholder.value) {
    const empty = segmentLengths.value.map(() => '');
    segments.value = empty;
    isPlaceholder.value = false;
  }
  if (segments.value[idx].length === segmentLengths.value[idx]) {
    segments.value[idx] = digit;
  } else {
    segments.value[idx] += digit;
  }
  if (segments.value[idx].length === segmentLengths.value[idx] && idx < segmentLengths.value.length - 1) {
    selectedSegmentIndex.value = idx + 1;
  }
  syncTarget();
};

const clearPad = (): void => {
  segments.value[selectedSegmentIndex.value] = '';
  if (isSegmentPlaceholder()) isPlaceholder.value = true;
  syncTarget();
};

const backspacePad = (): void => {
  if (isPlaceholder.value) return;
  const idx = selectedSegmentIndex.value;
  segments.value[idx] = segments.value[idx].slice(0, -1);
  if (isSegmentPlaceholder()) isPlaceholder.value = true;
  syncTarget();
};

const prevSegment = (): void => {
  selectedSegmentIndex.value = Math.max(0, selectedSegmentIndex.value - 1);
};

const nextSegment = (): void => {
  selectedSegmentIndex.value = Math.min(segmentLengths.value.length - 1, selectedSegmentIndex.value + 1);
};

const handleDocumentClick = (event: MouseEvent): void => {
  if (!numberPadActive.value) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('.number-pad-panel') || target.closest('.date-time-input')) return;
  closeNumberPad();
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<style scoped lang="scss">
.date-time-search-panel {
  width: 100%;
}

.search-field {
  display: flex;
  flex-direction: row;
  justify-content: end;
  align-items: center;
  gap: 1rem;
  font-size: 20px;
}
.search-field > div:first-child {
  width: 10rem;
}
.search-field > div:nth-child(2),
.search-field > div:nth-child(4) {
  width: 7rem;
}
.search-field > div:nth-child(5) {
  width: 8rem;
}
.search-field > div:nth-child(5) > div {
  height: 60px;
}

.number-pad-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
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

.segment-arrow-container {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 65px;
  background: color-mix(in srgb, var(--color-gray-200) 40%, transparent);
  border-radius: 8px;
}
.segment-arrow {
  font-size: 20px;
  color: var(--text-button);
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
  &:hover {
    color: var(--text-primary);
  }
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
  gap: 0.25rem;
}
.number-pad-preview.placeholder {
  color: var(--text-button);
}
.number-pad-preview .segment {
  display: inline-block;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s ease;
  min-width: 2.5rem;
  text-align: center;
}
.number-pad-preview .segment.active {
  border-bottom-color: var(--color-gray-300);
}
.number-pad-preview .separator {
  color: var(--text-button);
  font-weight: 400;
}

.number-pad-field {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  justify-content: center;
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
  color: var(--text-button);
  background-color: color-mix(in srgb, var(--bg-input), transparent 65%);
  border-radius: 4px;
  font-size: 24px;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.15s ease,
    transform 0.05s ease;
  &:hover {
    background-color: color-mix(in srgb, var(--bg-input), transparent 45%);
  }
  &:active {
    background-color: color-mix(in srgb, var(--bg-input), transparent 30%);
    transform: scale(0.97);
  }
}
.number-pad-field ul li i {
  font-size: 20px;
}

.number-pad-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}
</style>
