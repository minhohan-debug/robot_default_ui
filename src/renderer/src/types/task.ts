/** 작업 내역의 배출구별 상세 정보 */
export interface TaskHistorySectorInfo {
  sector: number;
  target_count: number;
  picked_count: number;
  progress_rate: number;
}

/** 작업 내역 상세 항목 */
export interface TaskHistoryItem {
  task_id: string;
  executed_at: string;
  finished_at?: string;
  status?: boolean;
  worked_sector: number;
  sector_info: TaskHistorySectorInfo[];
  robot_id?: number;
  uid?: string;
}

/** 작업 내역 요약 항목 */
export interface TaskHistorySummary {
  task_id: string;
  target_count: number;
  worked_count: number;
  started_at: string;
  ended_at: string;
  uid?: string;
}

/** 작업 내역 상세 조회 응답 */
export interface TaskHistoryDetailResponse {
  data: TaskHistoryItem[];
  count: number;
}

/** 로봇별 작업 내역 조회 응답 */
export interface TaskHistoryResponse {
  data: Record<string, TaskHistoryItem[]>;
  count: number;
}

/** 작업 내역 목록 조회 응답 */
export interface TaskHistoryListResponse {
  data: TaskHistorySummary[];
  count: number;
}

/** 작업 진행률 실시간 항목 */
export interface TaskProgress {
  task_id: string;
  target_count: number;
  picked_count: number;
  progress_rate: number;
}
