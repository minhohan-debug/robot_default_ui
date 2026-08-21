/**
 * 로봇별 작업 통계 WebSocket
 *
 * - `/v1/robot/statistics` 엔드포인트에서 주간/일별 작업 통계 수신
 */
import type { RobotStatistics } from '@renderer/types/robot';
import { API_ENDPOINTS, WS_BASE_URL } from '@renderer/config/api';
import { getAccessToken } from '@renderer/composables/useAuth';
import { WebSocketService } from './webSocketService';

export class RobotStatisticsSocket {
  static readonly ID = 'robotStatistics';

  private readonly socketId = RobotStatisticsSocket.ID; // WebSocket ID

  get id(): string {
    return this.socketId;
  }

  /** 인증 헤더 */
  private get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
  }

  /** WebSocket 연결 */
  async connect(): Promise<void> {
    const url = `${WS_BASE_URL}${API_ENDPOINTS.robotStatistics}`;
    await WebSocketService.connect(this.socketId, url, this.authHeaders);
  }

  async disconnect(): Promise<void> {
    await WebSocketService.disconnect(this.socketId);
  }

  /**
   * 수신 데이터를 로봇 통계 객체로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  parseData(data: string): RobotStatistics {
    const parsed = JSON.parse(data) as { data?: RobotStatistics };
    return (
      parsed.data ?? {
        weekly_task: [],
        weekly_average: {},
        daily_task: {},
        daily_utilization: {},
      }
    );
  }
}
