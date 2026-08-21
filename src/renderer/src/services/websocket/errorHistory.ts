/**
 * 로봇별 오류 이력 WebSocket
 *
 * - `/v1/robot/error/history` 엔드포인트를 통해 특정 기간의 오류 내역을 수신
 */
import type { RobotErrorHistoryItem } from '@renderer/types/robot';
import { API_ENDPOINTS } from '@renderer/config/api';
import { BaseRobotHistorySocket } from './baseRobotHistory';

export class ErrorHistorySocket extends BaseRobotHistorySocket<RobotErrorHistoryItem> {
  static readonly ID = 'robotErrorHistory';

  constructor() {
    super(ErrorHistorySocket.ID, API_ENDPOINTS.robotErrorHistory);
  }

  /**
   * 수신 데이터를 로봇별 오류 이력 맵으로 파싱합니다.
   * BaseRobotHistorySocket.parseRobotData()를 그대로 사용합니다.
   */
}
