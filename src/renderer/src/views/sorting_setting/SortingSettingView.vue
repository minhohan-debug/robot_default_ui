<template>
  <div class="sorting-setting-view">
    <div class="sorting-setting-grid">
      <div class="sorting-setting-card">
        <label>{{ t('pages.sortingSetting.title') }}</label>
        <div class="sorting-setting-table">
          <div class="sorting-setting-area glass-dialog">
            <ul class="header-row">
              <li>{{ t('pages.sortingSetting.sector') }}</li>
              <li>{{ t('pages.sortingSetting.weightLower') }}</li>
              <li>{{ t('pages.sortingSetting.weightUpper') }}</li>
            </ul>
            <ul v-for="i in 8" :key="i">
              <li>{{ i }}</li>
              <li
                class="input-cell"
                :class="{
                  'selected-input': isSelected(i - 1, 'lower'),
                  'modified-input': isModified(i - 1, 'lower'),
                  'invalid-input': displayValidationError && isInvalidSector(i - 1),
                }"
                @click="selectInput(i - 1, 'lower')"
              >
                <PInputText :model-value="weightLower[i - 1]" readonly />
              </li>
              <li
                class="input-cell"
                :class="{
                  'selected-input': isSelected(i - 1, 'upper'),
                  'modified-input': isModified(i - 1, 'upper'),
                  'invalid-input': displayValidationError && isInvalidSector(i - 1),
                }"
                @click="selectInput(i - 1, 'upper')"
              >
                <PInputText :model-value="weightUpper[i - 1]" readonly />
              </li>
            </ul>
          </div>
          <div class="sorting-setting-area glass-dialog">
            <ul class="header-row">
              <li>{{ t('pages.sortingSetting.sector') }}</li>
              <li>{{ t('pages.sortingSetting.weightLower') }}</li>
              <li>{{ t('pages.sortingSetting.weightUpper') }}</li>
            </ul>
            <ul v-for="i in 7" :key="i">
              <li>{{ i + 8 }}</li>
              <li
                class="input-cell"
                :class="{
                  'selected-input': isSelected(i + 7, 'lower'),
                  'modified-input': isModified(i + 7, 'lower'),
                  'invalid-input': displayValidationError && isInvalidSector(i + 7),
                }"
                @click="selectInput(i + 7, 'lower')"
              >
                <PInputText :model-value="weightLower[i + 7]" readonly />
              </li>
              <li
                class="input-cell"
                :class="{
                  'selected-input': isSelected(i + 7, 'upper'),
                  'modified-input': isModified(i + 7, 'upper'),
                  'invalid-input': displayValidationError && isInvalidSector(i + 7),
                }"
                @click="selectInput(i + 7, 'upper')"
              >
                <PInputText :model-value="weightUpper[i + 7]" readonly />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="sorting-setting-card">
        <label>{{ t('pages.sortingSetting.statusTitle') }}</label>
        <div class="sorting-status-area glass-dialog">
          <ul class="header-row">
            <li>{{ t('pages.sortingSetting.sector') }}</li>
            <li>{{ t('pages.sortingSetting.weightLower') }}</li>
            <li>{{ t('pages.sortingSetting.weightUpper') }}</li>
          </ul>
          <ul v-for="i in 15" :key="i">
            <li>{{ i }}</li>
            <li>{{ weightStatusLower[i - 1] }}</li>
            <li>{{ weightStatusUpper[i - 1] }}</li>
          </ul>
          <ul></ul>
        </div>
        <div class="sorting-setting-actions">
          <div class="button primary" :class="{ disabled: !hasChanges }" @click="handleSave">
            {{ t('pages.sortingSetting.save') }}
          </div>
        </div>
      </div>
    </div>

    <NumberPadPanel
      :visible="!!selected"
      v-model="numberPadValue"
      :title="numberPadTitle"
      :save-disabled="!hasChanges"
      @close="closeNumberPad"
      @save="handleSave"
      @prev="selectPrevInput"
      @next="selectNextInput"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 분류기 무게 설정 화면
 *
 * - 15개 섹터별 하한/상한 무게를 설정합니다.
 * - 좌측: 설정 입력 테이블(두 개 glass-dialog). 클릭 시 NumberPadPanel 열림.
 * - 우측: SorterSettingStatusSocket으로 실시간 수신한 현재값을 보여주는 상태 테이블.
 * - 하한 > 상한인 섹터는 invalid-input(빨간색)으로 표시, 저장 불가.
 * - NumberPadPanel로 선택 셀의 무게값을 입력하고 prev/next로 이동.
 * - registerSorterSettings API로 저장, getSorterSettings로 기존 값 로드.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirm } from 'primevue/useconfirm';
import { useErrorToast } from '@renderer/composables/useToast';
import { getSorterSettings, registerSorterSettings } from '@renderer/services/api/sorter';
import { SorterSettingStatusSocket } from '@renderer/services/websocket/sorterSettingStatus';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import NumberPadPanel from './components/NumberPadPanel.vue';
import type { SorterSetting } from '@renderer/types/sorter';

// 사용자가 수정 중인 15개 섹터 하한/상한 무게 (문자열)
const weightLower = ref<string[]>(Array.from({ length: 15 }, () => '0'));
const weightUpper = ref<string[]>(Array.from({ length: 15 }, () => '0'));

// API/저장 직전의 원본 값 (hasChanges 비교용)
const originalWeightLower = ref<string[]>([...weightLower.value]);
const originalWeightUpper = ref<string[]>([...weightUpper.value]);

// SorterSettingStatusSocket으로 수신한 실시간 현재값
const weightStatusLower = ref<string[]>(Array.from({ length: 15 }, () => '0'));
const weightStatusUpper = ref<string[]>(Array.from({ length: 15 }, () => '0'));

const sorterSettingStatusSocket = new SorterSettingStatusSocket(); // 분류 현재값 수신 소켓

const { t } = useI18n();
const confirm = useConfirm();
const { showError } = useErrorToast();

// 선택된 입력 셀 인덱스 및 종류 (lower/upper)
type Field = 'lower' | 'upper';
type Selected = { index: number; field: Field } | null;

const selected = ref<Selected>(null); // 현재 NumberPadPanel이 열려 있는 셀
const displayValidationError = ref(false); // 저장 시 하한>상한 오류 표시 여부

/** 해당 섹터의 하한 값이 상한 값보다 큰지(유효하지 않은) 확인 */
const isInvalidSector = (index: number): boolean => {
  const low = Number(weightLower.value[index]) || 0;
  const high = Number(weightUpper.value[index]) || 0;
  return low > high;
};

/** 원래 값(original)과 비교해 수정된 셀인지 확인 */
const isModified = (index: number, field: Field): boolean => {
  const target = field === 'lower' ? weightLower : weightUpper;
  const original = field === 'lower' ? originalWeightLower : originalWeightUpper;
  return target.value[index] !== original.value[index];
};

/** lower/upper 중 원본과 다른 값이 하나라도 있는지 */
const hasChanges = computed(
  () =>
    weightLower.value.some((value, index) => value !== originalWeightLower.value[index]) ||
    weightUpper.value.some((value, index) => value !== originalWeightUpper.value[index]),
);

/** (index, field)가 현재 선택된 입력 셀인지 */
const isSelected = (index: number, field: Field): boolean => {
  return selected.value?.index === index && selected.value?.field === field;
};

/** (index, field) 입력 셀 선택 */
const selectInput = (index: number, field: Field): void => {
  selected.value = { index, field };
};

/** NumberPadPanel 제목: 현재 섹터/필드 반영 (다국어) */
const numberPadTitle = computed(() => {
  if (!selected.value) return '';
  const labelKey =
    selected.value.field === 'lower' ? 'pages.sortingSetting.numberPad.lower' : 'pages.sortingSetting.numberPad.upper';
  return t('pages.sortingSetting.numberPad.title', {
    sector: selected.value.index + 1,
    label: t(labelKey),
  });
});

/**
 * NumberPadPanel v-model
 * - get: 선택된 셀의 weightLower/weightUpper 값
 * - set: 선택된 셀 값 갱신
 */
const numberPadValue = computed<string>({
  get: () => {
    if (!selected.value) return '';
    const target = selected.value.field === 'lower' ? weightLower : weightUpper;
    return target.value[selected.value.index];
  },
  set: (val: string) => {
    if (!selected.value) return;
    const target = selected.value.field === 'lower' ? weightLower : weightUpper;
    target.value[selected.value.index] = val;
  },
});

/** NumberPadPanel 닫기 (selected 해제) */
const closeNumberPad = (): void => {
  selected.value = null;
};

/**
 * 저장 버튼 클릭: 유효성 검사 후 confirm
 * - isInvalidSector가 하나라도 있으면 displayValidationError=true, 토스트 경고
 * - 유효하면 저장 confirm → saveSorterSettings
 */
const handleSave = (): void => {
  const hasInvalid = Array.from({ length: 15 }, (_, i) => i).some(isInvalidSector);
  displayValidationError.value = hasInvalid;
  if (hasInvalid) {
    showError('warn', t('pages.sortingSetting.messages.inputErrorDetail'));
    return;
  }
  confirm.require({
    message: t('pages.sortingSetting.messages.saveConfirm'),
    acceptLabel: t('common.save'),
    rejectLabel: t('common.cancel'),
    accept: () => {
      void saveSorterSettings();
    },
  });
};

/**
 * 분류 설정 API 저장
 * - 15개 섹터를 {sector, high, low} payload로 변환
 * - registerSorterSettings 호출
 * - 성공 시 original값 갱신, 선택 해제
 */
const saveSorterSettings = async (): Promise<void> => {
  try {
    const payload = {
      sector_info: Array.from({ length: 15 }, (_, i) => ({
        sector: i + 1,
        high: Number(weightUpper.value[i]) || 0,
        low: Number(weightLower.value[i]) || 0,
      })),
    };
    await registerSorterSettings(payload);
    selected.value = null;
    originalWeightLower.value = [...weightLower.value];
    originalWeightUpper.value = [...weightUpper.value];
    showError('success', t('pages.sortingSetting.messages.saveSuccessDetail'));
  } catch {
    showError('warn', t('pages.sortingSetting.messages.saveFailedDetail'));
  }
};

/** 선택된 (index, field)를 0~29 평탄 인덱스로 변환 (prev/next 이동용) */
const getSelectedFlatIndex = (): number => {
  if (!selected.value) return 0;
  return selected.value.index * 2 + (selected.value.field === 'upper' ? 1 : 0);
};

/** 평탄 인덱스 → (index, field) 선택 상태 복원 (prev/next 이동용) */
const setSelectedFromFlatIndex = (flatIndex: number): void => {
  const index = Math.floor(flatIndex / 2);
  const field = flatIndex % 2 === 0 ? 'lower' : 'upper';
  selected.value = { index, field };
};

/** NumberPadPanel prev: 이전 입력 셀 선택 (0번 이하 제한) */
const selectPrevInput = (): void => {
  if (!selected.value) return;
  setSelectedFromFlatIndex(Math.max(0, getSelectedFlatIndex() - 1));
};

/** NumberPadPanel next: 다음 입력 셀 선택 (29번 이상 제한) */
const selectNextInput = (): void => {
  if (!selected.value) return;
  setSelectedFromFlatIndex(Math.min(15 * 2 - 1, getSelectedFlatIndex() + 1));
};

/**
 * getSorterSettings API로 현재 분류 설정 로드
 * - weightLower/weightUpper와 original을 모두 갱신
 */
const loadSorterSettings = async (): Promise<void> => {
  try {
    const response = await getSorterSettings();
    const settings = response.data;
    if (!settings) return;
    settings.forEach((item) => {
      const index = item.sector - 1;
      if (index < 0 || index >= 15) return;
      weightLower.value[index] = String(item.low ?? 0);
      weightUpper.value[index] = String(item.high ?? 0);
    });
    originalWeightLower.value = [...weightLower.value];
    originalWeightUpper.value = [...weightUpper.value];
  } catch {
    /* ignored */
  }
};

/**
 * SorterSettingStatusSocket 실시간 메시지 핸들러
 * - 섹터별 low/high를 weightStatusLower/Upper에 반영
 */
const handleSorterSettingMessage = (settings: SorterSetting[]): void => {
  settings.forEach((item) => {
    const index = item.sector - 1;
    if (index < 0 || index >= 15) return;
    weightStatusLower.value[index] = String(item.low ?? 0);
    weightStatusUpper.value[index] = String(item.high ?? 0);
  });
};

/**
 * 문서 전체 클릭 핸들러
 * - NumberPadPanel과 input-cell 외부 클릭 시 selected 해제
 */
const handleDocumentClick = (event: MouseEvent): void => {
  if (!selected.value) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (target.closest('.number-pad-panel') || target.closest('.input-cell')) return;
  selected.value = null;
};

/**
 * 마운트 시 설정 로드 및 WebSocket/이벤트 등록
 * - loadSorterSettings 호출
 * - SorterSettingStatusSocket 연결
 * - onMessage: 실시간 분류 현재값 반영
 * - onClose: scheduleReconnect
 * - document click 리스너 등록
 */
onMounted(() => {
  void loadSorterSettings();
  sorterSettingStatusSocket.connect().catch(() => {});
  WebSocketService.onMessage((id, data) => {
    if (id === SorterSettingStatusSocket.ID) {
      handleSorterSettingMessage(SorterSettingStatusSocket.parseData(data));
    }
  });
  WebSocketService.onClose((id) => {
    if (id === SorterSettingStatusSocket.ID) {
      sorterSettingStatusSocket.scheduleReconnect(() => {});
    }
  });
  document.addEventListener('click', handleDocumentClick);
});

/**
 * 언마운트 시 이벤트/소켓 정리
 * - document click 해제, offListeners, sorterSettingStatusSocket destroy
 */
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  WebSocketService.offListeners();
  void sorterSettingStatusSocket.destroy();
});
</script>

<style scoped lang="scss">
.sorting-setting-view {
  padding: 10rem 2rem 2rem 2rem;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  font-size: 18px;
}
.sorting-setting-grid {
  flex: 3;
  display: flex;
  flex-direction: row;
  gap: 2rem;
}

.sorting-setting-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sorting-setting-grid > .sorting-setting-card:first-child {
  flex: 2;
}
.sorting-setting-grid > .sorting-setting-card:last-child {
  flex: 1;
}

.sorting-setting-table {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}
.sorting-setting-card > label {
  color: var(--text-title);
}

.sorting-setting-area {
  flex: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.sorting-setting-area ul {
  display: flex;
  flex-direction: row;
  height: 100px;
  border-bottom: 1px solid var(--color-gray-200);
}
.sorting-setting-area ul li {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  cursor: pointer;
}
.sorting-setting-area ul:first-child {
  height: 50px;
}
.sorting-setting-area ul li:first-child {
  flex: 1;
}
.sorting-setting-area ul li:not(:first-child) {
  flex: 2;
}
.sorting-setting-area ul li.selected-input :deep(.p-inputtext) {
  background-color: var(--color-primary-50) !important;
  border-color: var(--color-primary, #3b82f6) !important;
}
.sorting-setting-area ul li.modified-input :deep(.p-inputtext) {
  background-color: var(--color-accent-300) !important;
}
.sorting-setting-area ul li.invalid-input :deep(.p-inputtext) {
  background-color: var(--color-error-200) !important;
}

.sorting-status-area {
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}
.sorting-status-area ul {
  display: flex;
  flex-direction: row;
  height: 50px;
  border-bottom: 1px solid var(--color-gray-200);
}
.sorting-status-area ul li {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.sorting-status-area ul li:first-child {
  flex: 1;
}
.sorting-status-area ul li:not(:first-child) {
  flex: 2;
}

.sorting-setting-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
}
.sorting-setting-actions > .button {
  width: 15rem;
}

.sorting-setting-view .header-row {
  font-weight: 500;
}
</style>
