/**
 * 작업 내역 API 서비스
 */
import { apiClient } from '@renderer/services/api/index';
import { API_ENDPOINTS } from '@renderer/config/api';
import type { TaskHistoryResponse, TaskHistoryDetailResponse } from '@renderer/types/task';

/** RA-017: 기간별 전체 로봇 작업 내역을 조회합니다 */
export const getRobotTaskHistories = (params: {
  start_datetime: string;
  end_datetime: string;
}): Promise<TaskHistoryResponse> =>
  apiClient.get<TaskHistoryResponse>(API_ENDPOINTS.robotTaskHistory, { params }).then((res) => res.data);

/** RA-017: 작업 ID로 상세 내역을 조회합니다 */
export const getTaskHistoryDetail = (taskId: string): Promise<TaskHistoryDetailResponse> =>
  apiClient.get<TaskHistoryDetailResponse>(`${API_ENDPOINTS.taskDetail}/${taskId}`).then((res) => res.data);
