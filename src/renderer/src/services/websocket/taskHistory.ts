/**
 * 작업 내역(task history) WebSocket
 *
 * - `/v1/task/history` 엔드포인트를 통해 전체 로봇의 작업 내역을 실시간 수신
 */
import type { TaskHistoryItem, TaskHistorySummary } from '@renderer/types/task';
import { API_ENDPOINTS } from '@renderer/config/api';
import { BaseRobotHistorySocket } from './baseRobotHistory';

export class TaskHistorySocket extends BaseRobotHistorySocket<TaskHistoryItem> {
  static readonly ID = 'taskHistory';

  constructor(endpoint: string = API_ENDPOINTS.taskHistory) {
    super(TaskHistorySocket.ID, endpoint);
  }

  /**
   * 수신 데이터를 작업 내역 요약 리스트로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   * @returns TaskHistorySummary 배열
   */
  parseData(data: string): TaskHistorySummary[] {
    const parsed = JSON.parse(data);
    return (parsed.data ?? []) as TaskHistorySummary[];
  }
}
