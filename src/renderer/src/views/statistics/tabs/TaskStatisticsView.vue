<template>
  <div class="task-statistics-view">
    <div>
      <div class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.weeklyByDay') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart1" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
      <div class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.weeklyByRobot') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart2" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
      <div v-if="isAdmin" class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.weeklyErrorCountByRobot') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart5" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
    </div>
    <div>
      <div class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.dailyByRobot') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart3" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
      <div class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.dailyUtilization') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart4" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
      <div v-if="isAdmin" class="glass-dialog chart-card">
        <div>
          <label>{{ t('pages.statistics.charts.dailyErrorCountByRobot') }}</label>
        </div>
        <div class="chart-wrap">
          <div ref="chart6" class="chart-area"></div>
          <div v-if="loading" class="chart-loading"><i class="pi pi-spin pi-spinner" /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 작업 통계 탭 화면
 *
 * - ECharts로 주간/일별 작업량, 가동률, 오류 수량 통계 시각화
 * - RobotStatisticsSocket, RobotErrorStatisticsSocket 실시간 데이터 수신
 * - 언어/테마 변경 시 차트 재초기화
 */
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAdmin } from '@renderer/composables/useAdmin';
import * as echarts from 'echarts';
import { getRobotList } from '@renderer/services/api/robot';
import { RobotStatisticsSocket } from '@renderer/services/websocket/robotStatistics';
import { RobotErrorStatisticsSocket } from '@renderer/services/websocket/robotErrorStatistics';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import type { Robot, RobotStatistics, RobotErrorStatistics } from '@renderer/types/robot';

const { t, locale } = useI18n();
const { isAdmin } = useAdmin();

const loading = ref(true); // 차트/로봇 데이터 로딩 상태
const robotList = ref<Robot[]>([]); // API 조회한 로봇 목록
const lastStatistics = ref<RobotStatistics | null>(null); // 마지막 작업 통계 데이터
const lastErrorStatistics = ref<RobotErrorStatistics | null>(null); // 마지막 오류 통계 데이터
const socket = new RobotStatisticsSocket(); // 작업/가동 통계 WebSocket
const errorSocket = new RobotErrorStatisticsSocket(); // 오류 통계 WebSocket (관리자용)

// 6개 차트 DOM 참조
const chart1 = ref<HTMLElement | null>(null);
const chart2 = ref<HTMLElement | null>(null);
const chart3 = ref<HTMLElement | null>(null);
const chart4 = ref<HTMLElement | null>(null);
const chart5 = ref<HTMLElement | null>(null);
const chart6 = ref<HTMLElement | null>(null);

/**
 * :root에 정의된 CSS 변수값을 실시간으로 읽어옵니다.
 * - 테마/다크모드 변경 시 echarts에 적용하기 위해 사용합니다.
 */
const getColor = (variable: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

/**
 * echarts 공통 옵션 생성
 * - 배경 투명, tooltip 스타일, 축/그리드 색상을 CSS 변수와 연동
 */
const makeBaseOption = (): echarts.EChartsOption => ({
  backgroundColor: 'transparent',
  grid: { top: 16, bottom: 36, left: 48, right: 16, containLabel: false },
  tooltip: {
    trigger: 'axis',
    backgroundColor: getColor('--bg-dialog-non-glass'),
    borderColor: 'transparent',
    textStyle: { color: getColor('--text-button') },
  },
  xAxis: {
    type: 'category',
    axisLine: { lineStyle: { color: getColor('--bg-surface') } },
    axisLabel: { color: getColor('--text-button'), fontSize: 15 },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    axisLine: { show: false },
    axisLabel: { color: getColor('--text-button'), fontSize: 15 },
    splitLine: { lineStyle: { color: getColor('--text-title'), type: 'dashed', opacity: 0.3 } },
  },
});

type ChartKey =
  | 'weeklyByDay'
  | 'weeklyByRobot'
  | 'weeklyErrorCountByRobot'
  | 'dailyByRobot'
  | 'dailyUtilization'
  | 'dailyErrorCountByRobot';
const instances = new Map<ChartKey, echarts.ECharts>();

/**
 * 지정 차트에 부분 옵션 적용
 * - echarts 인스턴스를 찾아 setOption으로만 갱신(merge)
 */
const updateChart = (key: ChartKey, option: echarts.EChartsOption): void => {
  instances.get(key)?.setOption(option, false);
};

defineExpose({ updateChart });

/**
 * 6개 차트 DOM을 초기화하고 echarts 인스턴스를 instances 맵에 저장
 * - weeklyByDay: 요일별 작업량
 * - weeklyByRobot: 로봇별 요일별 작업량(가로 누적)
 * - dailyByRobot: 오늘 로봇별 작업량
 * - dailyUtilization: 오늘 로봇별 가동률
 * - weeklyErrorCountByRobot: (관리자) 요일별 로봇별 오류
 * - dailyErrorCountByRobot: (관리자) 오늘 로봇별 오류
 */
const initCharts = (): void => {
  const days = [
    t('pages.statistics.charts.days.mon'),
    t('pages.statistics.charts.days.tue'),
    t('pages.statistics.charts.days.wed'),
    t('pages.statistics.charts.days.thu'),
    t('pages.statistics.charts.days.fri'),
    t('pages.statistics.charts.days.sat'),
    t('pages.statistics.charts.days.sun'),
  ];
  const names = robotList.value.length
    ? robotList.value.map((r) => t('pages.taskStatus.robot.robot_id', { id: r.robot_id }))
    : [1, 2, 3, 4, 5].map((id) => t('pages.taskStatus.robot.robot_id', { id }));
  const base = makeBaseOption();
  const labelStyle = { show: true, position: 'top' as const, color: getColor('--text-button'), fontSize: 15 };

  const charts = [
    {
      key: 'weeklyByDay' as const,
      el: chart1.value,
      option: {
        ...base,
        xAxis: { ...base.xAxis, data: days },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: { color: getColor('--color-primary-500'), borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40,
            label: labelStyle,
          },
        ],
      },
    },
    {
      key: 'weeklyByRobot' as const,
      el: chart2.value,
      option: {
        backgroundColor: 'transparent',
        grid: { top: 32, bottom: 8, left: 8, right: 64, containLabel: true },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: getColor('--bg-dialog-non-glass'),
          borderColor: 'transparent',
          textStyle: { color: getColor('--text-button') },
        },
        legend: {
          top: 4,
          textStyle: { color: getColor('--text-button'), fontSize: 13 },
          itemWidth: 12,
          itemHeight: 12,
        },
        xAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: getColor('--text-button'), fontSize: 13 },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: getColor('--text-title'), type: 'dashed', opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: getColor('--text-button'), fontSize: 15 },
          axisLine: { lineStyle: { color: getColor('--bg-surface') } },
          splitLine: { show: false },
        },
        series: [],
      },
    },
    {
      key: 'dailyByRobot' as const,
      el: chart3.value,
      option: {
        ...base,
        xAxis: { ...base.xAxis, data: names },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: { color: getColor('--color-success-400'), borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40,
            label: labelStyle,
          },
        ],
      },
    },
    {
      key: 'dailyUtilization' as const,
      el: chart4.value,
      option: {
        ...base,
        xAxis: { ...base.xAxis, data: names },
        yAxis: { ...base.yAxis, max: 100 },
        series: [
          {
            type: 'bar',
            data: [],
            showBackground: true,
            itemStyle: { color: getColor('--color-accent-500'), borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40,
            label: { ...labelStyle, formatter: '{c}%' },
          },
        ],
      },
    },
    {
      key: 'weeklyErrorCountByRobot' as const,
      el: chart5.value,
      option: {
        backgroundColor: 'transparent',
        grid: { top: 32, bottom: 8, left: 8, right: 64, containLabel: true },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: getColor('--bg-dialog-non-glass'),
          borderColor: 'transparent',
          textStyle: { color: getColor('--text-button') },
        },
        legend: {
          top: 4,
          textStyle: { color: getColor('--text-button'), fontSize: 13 },
          itemWidth: 12,
          itemHeight: 12,
        },
        xAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: getColor('--text-button'), fontSize: 13 },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: getColor('--text-title'), type: 'dashed', opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: getColor('--text-button'), fontSize: 15 },
          axisLine: { lineStyle: { color: getColor('--bg-surface') } },
          splitLine: { show: false },
        },
        series: [],
      },
    },
    {
      key: 'dailyErrorCountByRobot' as const,
      el: chart6.value,
      option: {
        ...base,
        xAxis: { ...base.xAxis, data: names },
        series: [
          {
            type: 'bar',
            data: [],
            itemStyle: { color: getColor('--color-error-400'), borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 40,
            label: labelStyle,
          },
        ],
      },
    },
  ];

  instances.clear();
  for (const { key, el, option } of charts) {
    if (!el) continue;
    const instance = echarts.init(el);
    instance.setOption(option);
    instances.set(key, instance);
  }
};

/** 숫자/문자형 로봇 ID를 "로봇 X" 다국어 라벨로 변환 */
const getRobotLabel = (id: number | string): string => t('pages.taskStatus.robot.robot_id', { id: Number(id) });

/**
 * 작업/가동 통계 데이터를 받아 4개 차트(weeklyByDay, weeklyByRobot, dailyByRobot, dailyUtilization) 업데이트
 * - robotList가 있으면 해당 ID 기준, 없으면 stats 데이터 기준, 없으면 기본 1~5 사용
 * - weeklyByRobot은 stack + 우측 total label로 일주일 합계 표시
 */
const updateCharts = (stats: RobotStatistics): void => {
  const days = [
    t('pages.statistics.charts.days.mon'),
    t('pages.statistics.charts.days.tue'),
    t('pages.statistics.charts.days.wed'),
    t('pages.statistics.charts.days.thu'),
    t('pages.statistics.charts.days.fri'),
    t('pages.statistics.charts.days.sat'),
    t('pages.statistics.charts.days.sun'),
  ];

  let robotKeys = robotList.value.length
    ? robotList.value.map((r) => String(r.robot_id))
    : Object.keys(stats.weekly_average).sort((a, b) => Number(a) - Number(b));
  if (robotKeys.length === 0) robotKeys = ['1', '2', '3', '4', '5'];
  const names = robotKeys.map((id) => getRobotLabel(id));
  const weeklyKeys = [...robotKeys].reverse();
  const weeklyNames = weeklyKeys.map((id) => getRobotLabel(id));
  updateChart('weeklyByDay', {
    xAxis: { data: days },
    series: [
      {
        data: days.map((_, i) => stats.weekly_task[i] ?? 0),
        itemStyle: { color: getColor('--color-primary-500'), borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        label: { show: true, position: 'top' as const, color: getColor('--text-button'), fontSize: 15 },
      },
    ],
  });

  const dayColors = [
    '--color-primary-100',
    '--color-primary-200',
    '--color-primary-300',
    '--color-primary-400',
    '--color-primary-500',
    '--color-primary-600',
    '--color-primary-700',
  ];
  const weeklySeries: echarts.SeriesOption[] = dayColors.map((colorVar, dayIndex) => ({
    name: days[dayIndex],
    type: 'bar' as const,
    stack: 'total',
    data: weeklyKeys.map((rid) => stats.weekly_average[rid]?.[dayIndex] ?? 0),
    itemStyle: { color: getColor(colorVar) },
    label: {
      show: true,
      color: '#fff',
      fontSize: 12,
      formatter: (params: { value: unknown }) => {
        const v = Number(params.value);
        return v ? String(v) : '';
      },
    },
  }));
  const totals = weeklyKeys.map((rid) => (stats.weekly_average[rid] ?? []).reduce((sum, v) => sum + v, 0));
  weeklySeries.push({
    name: t('pages.statistics.charts.total'),
    type: 'bar' as const,
    stack: 'total',
    data: weeklyKeys.map(() => 0),
    itemStyle: { color: 'transparent' },
    label: {
      show: true,
      position: 'right' as const,
      formatter: (params: { dataIndex: number }) => {
        const total = totals[params.dataIndex];
        return total ? total.toString() : '';
      },
      color: getColor('--text-button'),
      fontSize: 15,
    },
  });
  updateChart('weeklyByRobot', { yAxis: { data: weeklyNames, inverse: true }, series: weeklySeries });

  updateChart('dailyByRobot', {
    xAxis: { data: names },
    series: [
      {
        data: robotKeys.map((rid) => stats.daily_task[rid] ?? 0),
        itemStyle: { color: getColor('--color-success-400'), borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        label: { show: true, position: 'top' as const, color: getColor('--text-button'), fontSize: 15 },
      },
    ],
  });

  updateChart('dailyUtilization', {
    xAxis: { data: names },
    series: [
      {
        data: robotKeys.map((rid) => stats.daily_utilization[rid] ?? 0),
        showBackground: true,
        itemStyle: { color: getColor('--color-accent-500'), borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        label: {
          show: true,
          position: 'top' as const,
          color: getColor('--text-button'),
          fontSize: 15,
          formatter: '{c}%',
        },
      },
    ],
  });
};

/**
 * 오류 통계 데이터를 받아 2개 차트(weeklyErrorCountByRobot, dailyErrorCountByRobot) 업데이트
 * - 관리자(isAdmin)인 경우에만 errorSocket이 연결되어 데이터 수신
 */
const updateErrorCharts = (stats: RobotErrorStatistics): void => {
  const days = [
    t('pages.statistics.charts.days.mon'),
    t('pages.statistics.charts.days.tue'),
    t('pages.statistics.charts.days.wed'),
    t('pages.statistics.charts.days.thu'),
    t('pages.statistics.charts.days.fri'),
    t('pages.statistics.charts.days.sat'),
    t('pages.statistics.charts.days.sun'),
  ];

  let errorRobotKeys = Object.keys(stats.weekly_error ?? stats.daily_error ?? {}).sort((a, b) => Number(a) - Number(b));
  if (errorRobotKeys.length === 0) errorRobotKeys = ['1', '2', '3', '4', '5'];
  const errorNames = errorRobotKeys.map((id) => getRobotLabel(id));
  const weeklyErrorKeys = [...errorRobotKeys].reverse();
  const weeklyErrorNames = weeklyErrorKeys.map((id) => getRobotLabel(id));

  const errorDayColors = [
    '--color-error-200',
    '--color-error-300',
    '--color-error-400',
    '--color-error-500',
    '--color-error-600',
    '--color-error-700',
    '--color-error-800',
  ];
  const weeklyErrorSeries: echarts.SeriesOption[] = errorDayColors.map((colorVar, dayIndex) => ({
    name: days[dayIndex],
    type: 'bar' as const,
    stack: 'total',
    data: weeklyErrorKeys.map((rid) => stats.weekly_error?.[rid]?.[dayIndex] ?? 0),
    itemStyle: { color: getColor(colorVar) },
    label: {
      show: true,
      color: '#fff',
      fontSize: 12,
      formatter: (params: { value: unknown }) => {
        const v = Number(params.value);
        return v ? String(v) : '';
      },
    },
  }));
  const errorTotals = weeklyErrorKeys.map((rid) => (stats.weekly_error?.[rid] ?? []).reduce((sum, v) => sum + v, 0));
  weeklyErrorSeries.push({
    name: t('pages.statistics.charts.total'),
    type: 'bar' as const,
    stack: 'total',
    data: weeklyErrorKeys.map(() => 0),
    itemStyle: { color: 'transparent' },
    label: {
      show: true,
      position: 'right' as const,
      formatter: (params: { dataIndex: number }) => {
        const total = errorTotals[params.dataIndex];
        return total ? total.toString() : '';
      },
      color: getColor('--text-button'),
      fontSize: 15,
    },
  });
  updateChart('weeklyErrorCountByRobot', {
    yAxis: { data: weeklyErrorNames, inverse: true },
    series: weeklyErrorSeries,
  });

  const dailyErrorData = errorRobotKeys.map((rid) => stats.daily_error?.[rid] ?? 0);
  const dailyErrorMax = Math.max(...dailyErrorData, 1) + 1;
  updateChart('dailyErrorCountByRobot', {
    xAxis: { data: errorNames },
    yAxis: { max: dailyErrorMax },
    series: [
      {
        type: 'bar',
        data: dailyErrorData,
        itemStyle: { color: getColor('--color-error-400'), borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        label: { show: true, position: 'top' as const, color: getColor('--text-button'), fontSize: 15 },
      },
    ],
  });
};

/**
 * WebSocket 글로벌 리스너 등록
 * - socket(RobotStatisticsSocket): 작업/가동 통계 → updateCharts
 * - errorSocket(RobotErrorStatisticsSocket): 오류 통계 → updateErrorCharts
 * - close/error: loading=false
 */
const registerWsListeners = (): void => {
  WebSocketService.onMessage((id, data) => {
    if (id === socket.id) {
      try {
        const stats = socket.parseData(data);
        lastStatistics.value = stats;
        updateCharts(stats);
      } catch {
        // 파싱 실패 시 무시
      } finally {
        loading.value = false;
      }
    } else if (id === errorSocket.id) {
      try {
        const errStats = errorSocket.parseData(data);
        lastErrorStatistics.value = errStats;
        updateErrorCharts(errStats);
      } catch {
        // 파싱 실패 시 무시
      } finally {
        loading.value = false;
      }
    }
  });

  WebSocketService.onClose((id) => {
    if (id === socket.id || id === errorSocket.id) {
      loading.value = false;
    }
  });

  WebSocketService.onError(() => {
    loading.value = false;
  });
};

/** 브라우저 resize 시 모든 echarts 인스턴스 리사이즈 */
const handleResize = (): void => instances.forEach((c) => c.resize());

/**
 * 언어/테마 변경 시 차트 재생성
 * - 기존 인스턴스 dispose 후 initCharts
 * - 마지막으로 받은 통계 데이터가 있으면 다시 업데이트
 */
const reinitCharts = (): void => {
  instances.forEach((c) => c.dispose());
  instances.clear();
  initCharts();
  if (lastStatistics.value) updateCharts(lastStatistics.value);
  if (lastErrorStatistics.value) updateErrorCharts(lastErrorStatistics.value);
};

// data-theme 속성 변경 감시를 위한 MutationObserver (테마 전환 시 차트 재생성)
let themeObserver: MutationObserver | null = null;

/** i18n locale 변경 시 차트 재생성 (라벨 언어 변경 대응) */
watch(locale, () => reinitCharts());

/**
 * 마운트 시 로봇 목록 조회, 차트 초기화, WebSocket 연결
 * - getRobotList로 로봇 목록 조회 (실패 시 기본 1~5호기 사용)
 * - initCharts로 6개 차트 DOM 초기화
 * - resize/themeObserver 등록
 * - socket 연결, 관리자면 errorSocket도 연결
 */
onMounted(async () => {
  try {
    const data = await getRobotList();
    if (data?.data) robotList.value = data.data;
  } catch {
    // 실패 시 기본 1~5호기 사용
  }
  initCharts();
  registerWsListeners();
  window.addEventListener('resize', handleResize);
  themeObserver = new MutationObserver(() => reinitCharts());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  loading.value = true;
  await socket.connect();
  if (isAdmin) await errorSocket.connect();
});

/**
 * 언마운트 시 WebSocket, 차트, 이벤트, MutationObserver 정리
 * - offListeners, 소켓 disconnect, echarts dispose, resize/observer 해제
 */
onUnmounted(() => {
  WebSocketService.offListeners();
  socket.disconnect();
  errorSocket.disconnect();
  instances.forEach((c) => c.dispose());
  instances.clear();
  window.removeEventListener('resize', handleResize);
  themeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.task-statistics-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 10rem;
  padding-left: 2rem;
  padding-right: 2rem;
  gap: 1rem;
}

.task-statistics-view > div {
  display: flex;
  flex-direction: row;
  flex: 1;
  gap: 1rem;
}

.task-statistics-view > div > div {
  flex: 1;
}

.chart-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 1rem;
  gap: 1rem;
}
.chart-card label {
  font-size: 18px;
  color: var(--text-title);
}

.chart-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.chart-area {
  width: 100%;
  height: 100%;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--text-title);
  pointer-events: none;
}
</style>
