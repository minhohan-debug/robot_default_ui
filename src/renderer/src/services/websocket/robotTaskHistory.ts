/**
 * 로봇별 작업 이력 WebSocket
 *
 * - `/v1/robot/task/history` 엔드포인트에서 특정 기간의 로봇 작업 내역을 수신
 */
import type { TaskHistoryItem } from '@renderer/types/task';
import { API_ENDPOINTS } from '@renderer/config/api';
import { BaseRobotHistorySocket } from './baseRobotHistory';

export class RobotTaskHistorySocket extends BaseRobotHistorySocket<TaskHistoryItem> {
  static readonly ID = 'robotTaskHistory';

  constructor() {
    super(RobotTaskHistorySocket.ID, API_ENDPOINTS.robotTaskHistory);
  }

  /**
   * 수신 데이터를 로봇별 작업 이력 맵으로 파싱합니다.
   * BaseRobotHistorySocket.parseRobotData()를 그대로 사용합니다.
   */
}
