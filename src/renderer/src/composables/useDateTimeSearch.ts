/**
 * 검색용 날짜/시간 상태를 생성하는 컴포저블
 *
 * 기본값은 현재 시각 기준으로 ±minutesOffset 범위를 설정합니다.
 */
import { ref } from 'vue';
import type { Ref } from 'vue';

// Date를 'YYYY/MM/DD' 형식의 문자열로 변환합니다
const toLocalDateString = (d: Date): string =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
// Date를 'HH:MM' 형식의 문자열로 변환합니다
const toHHMM = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * useDateTimeSearch 반환 타입
 */
export interface UseDateTimeSearchReturn {
  searchDate: Ref<string>; // 검색 기준 날짜 (YYYY/MM/DD)
  searchStartTime: Ref<string>; // 검색 시작 시간 (HH:MM)
  searchEndTime: Ref<string>; // 검색 종료 시간 (HH:MM)
  toDatetimeParam: (date: string, time: string) => string; // API 요청용 시간 문자열 변환 함수
}

/**
 * 검색 기본값을 생성합니다.
 * @param minutesOffset - 현재 시각 기준 시작/종료 오차(분), 기본 10분
 * @returns {UseDateTimeSearchReturn} 날짜/시간 상태 및 변환 함수
 */
export function useDateTimeSearch(minutesOffset = 10): UseDateTimeSearchReturn {
  const now = new Date();
  const searchDate = ref(toLocalDateString(now));
  const searchStartTime = ref(toHHMM(new Date(now.getTime() - minutesOffset * 60 * 1000)));
  const searchEndTime = ref(toHHMM(new Date(now.getTime() + minutesOffset * 60 * 1000)));

  // 'YYYY/MM/DD' + 'HH:MM' → 'YYYYMMDDHHMMSS' API 파라미터 형식으로 변환
  const toDatetimeParam = (date: string, time: string): string =>
    `${date.replace(/\//g, '')}${time.replace(':', '')}00`;

  return { searchDate, searchStartTime, searchEndTime, toDatetimeParam };
}
