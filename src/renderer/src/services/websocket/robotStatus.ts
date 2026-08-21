/**
 * 전체 로봇 상태(robot status) WebSocket
 *
 * - `/v1/robot/status` 엔드포인트에서 로봇 연결/상태/현재 작업 정보를 수신
 */
import type { RobotStatus } from '@renderer/types/robot';
import { API_ENDPOINTS } from '@renderer/config/api';
import { StatusSocket } from './statusSocket';

export class RobotStatusSocket extends StatusSocket {
  static readonly ID = 'robotStatus';

  constructor() {
    super(RobotStatusSocket.ID, API_ENDPOINTS.robotStatus);
  }

  /**
   * 수신 데이터를 RobotStatus 배열로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): RobotStatus[] {
    const parsed = JSON.parse(data);
    return Object.entries(parsed.data as Record<string, Record<string, unknown>>).map(([robotId, raw]) => ({
      robot_id: Number(robotId), // 로봇 ID
      state: raw.state != null ? Number(raw.state) : null, // 상태 코드
      current_sector:
        raw.current_sector != null && Number(raw.current_sector) !== -1 ? Number(raw.current_sector) : null, // 현재 배출구
      progress: raw.progress != null ? Number(raw.progress) : null, // 진행률
      task_id: (raw.task_id as string) ?? null, // 현재 작업 ID
      connected: raw.connected === true || raw.connected === 'true', // 연결 여부
    }));
  }
}
