/**
 * 원격 제어 이력 WebSocket
 *
 * - `/v1/robot/control/{robot_id}` 엔드포인트를 통해 원격 제어 이력을 수신
 */
import { API_ENDPOINTS } from '@renderer/config/api';
import { BaseRobotHistorySocket } from './baseRobotHistory';
import type { RemoteControlHistoryItem } from '@renderer/types/robot';

export class RemoteControlHistorySocket extends BaseRobotHistorySocket<RemoteControlHistoryItem> {
  /**
   * @param robotId - 조회 대상 로봇 ID
   * @param endpoint - 기본값 외 엔드포인트
   */
  constructor(robotId: number, endpoint: string = API_ENDPOINTS.robotControlHistory) {
    super(`remoteControlHistory-${robotId}`, `${endpoint}/${robotId}`);
  }

  /**
   * 수신 데이터를 원격 제어 이력 리스트로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  parseData(data: string): RemoteControlHistoryItem[] {
    const parsed = JSON.parse(data) as { data?: RemoteControlHistoryItem[] };
    return (parsed.data ?? []) as RemoteControlHistoryItem[];
  }
}
