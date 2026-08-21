/** 선별기 실시간 상태 */
export interface SorterStatus {
  connected: boolean;
  total_qty: number | null;
  total_weight: number | null;
  excepted_qty: number | null;
  excepted_weight: number | null;
  sector_info: Record<string, number>;
}

/** 선별기 배출구 설정 */
export interface SorterSetting {
  sector: number;
  high: number;
  low: number;
}
