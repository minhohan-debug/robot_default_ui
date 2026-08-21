/**
 * 특정 로봇의 최근 작업 내역 WebSocket
 *
 * - `/api/v1/robot/task/recent/{robot_id}` 엔드포인트에서 limit 개수만큼 수신
 */
import type { TaskHistoryItem } from '@renderer/types/task';
import { WS_BASE_URL } from '@renderer/config/api';
import { getAccessToken } from '@renderer/composables/useAuth';
import { WebSocketService } from './webSocketService';

export class RecentTaskHistorySocket {
  static readonly ID = 'recentTaskHistory';
  private robotId: number; // 조회할 로봇 ID
  private limit: number; // 조회 개수

  /**
   * @param robotId - 조회 대상 로봇 ID
   * @param limit - 받아올 최근 항목 개수
   */
  constructor(robotId: number, limit: number) {
    this.robotId = robotId;
    this.limit = limit;
  }

  /** 인증 헤더 */
  private get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
  }

  /** WebSocket 연결 */
  async connect(): Promise<void> {
    await WebSocketService.connect(
      RecentTaskHistorySocket.ID,
      `${WS_BASE_URL}/api/v1/robot/task/recent/${this.robotId}?limit=${this.limit}`,
      this.authHeaders,
    );
  }

  /** WebSocket 연결 종료 */
  async disconnect(): Promise<void> {
    await WebSocketService.disconnect(RecentTaskHistorySocket.ID);
  }

  /** 서버에 전송할 limit 메시지 */
  getLimitMessage(): string {
    return JSON.stringify({ limit: this.limit });
  }

  /**
   * 수신 데이터를 최근 작업 내역 리스트로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): TaskHistoryItem[] {
    const parsed = JSON.parse(data);
    return (parsed.data ?? []) as TaskHistoryItem[];
  }
}
