<template>
  <div class="remote-control-panel">
    <div class="panel-title">{{ t('pages.robotDetail.remoteControlHistoryTitle') }}</div>
    <DateTimeSearchPanel
      v-model:date="localDate"
      v-model:start-time="localStartTime"
      v-model:end-time="localEndTime"
      @search="emit('search')"
    />
    <div class="history-list">
      <PDataTable
        :value="history"
        data-key="remote_id"
        scrollable
        scroll-height="flex"
        :empty-message="t('pages.robotDetail.remoteControlHistoryEmpty')"
        row-hover
      >
        <PColumn
          field="command"
          :header="t('pages.robotDetail.remoteControlHistoryCommandColumn')"
          style="width: 15%"
          headerStyle="width: 15%"
        />
        <PColumn
          field="extra_data"
          :header="t('pages.robotDetail.remoteControlHistoryExtraDataColumn')"
          style="width: 20%"
          headerStyle="width: 20%"
        />
        <PColumn
          field="description"
          :header="t('pages.robotDetail.remoteControlHistoryDescriptionColumn')"
          style="width: 40%"
          headerStyle="width: 40%"
        />
        <PColumn
          field="created_at"
          :header="t('pages.robotDetail.remoteControlHistoryCreatedAtColumn')"
          style="width: 25%"
          headerStyle="width: 25%"
        />
      </PDataTable>
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
/**
 * 원격 제어 이력 조회 패널
 *
 * - DateTimeSearchPanel로 기간 조회
 * - 전송된 원격 제어 이력 테이블
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PDataTable from 'primevue/datatable';
import PColumn from 'primevue/column';
import DateTimeSearchPanel from '@renderer/components/common/DateTimeSearchPanel.vue';
import type { RemoteControlHistoryItem } from '@renderer/types/robot';

const props = defineProps<{
  history: RemoteControlHistoryItem[];
  date: string;
  startTime: string;
  endTime: string;
}>();

const emit = defineEmits<{
  (e: 'update:date', value: string): void;
  (e: 'update:startTime', value: string): void;
  (e: 'update:endTime', value: string): void;
  (e: 'search'): void;
}>();

const { t } = useI18n();

/** date v-model */
const localDate = computed({
  get: () => props.date,
  set: (value: string) => emit('update:date', value),
});

/** 시작 시간 v-model */
const localStartTime = computed({
  get: () => props.startTime,
  set: (value: string) => emit('update:startTime', value),
});

/** 종료 시간 v-model */
const localEndTime = computed({
  get: () => props.endTime,
  set: (value: string) => emit('update:endTime', value),
});
</script>

<style scoped lang="scss">
.remote-control-panel {
  flex: 2;
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
.history-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
