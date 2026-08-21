/**
 * 실시간 상태 모니터링용 WebSocket 기본 클래스
 *
 * - 연결이 끊기면 일정 시간 후 재연결을 시도합니다.
 * - destroy() 호출 시 재연결 및 리스너를 정리합니다.
 */
import { WS_BASE_URL } from '@renderer/config/api';
import { WebSocketService } from './webSocketService';
import { getAccessToken } from '@renderer/composables/useAuth';

export class StatusSocket {
  private readonly socketId: string; // WebSocket 식별자
  private readonly endpoint: string; // 연결 엔드포인트
  private readonly reconnectDelay: number; // 재연결 지연(ms)
  private destroyed = false; // destroy() 호출 여부
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null; // 재연결 타이머

  /**
   * @param id - WebSocket 식별자
   * @param endpoint - 연결 엔드포인트
   * @param reconnectDelay - 재연결 지연 시간
   */
  constructor(id: string, endpoint: string, reconnectDelay = 5000) {
    this.socketId = id;
    this.endpoint = endpoint;
    this.reconnectDelay = reconnectDelay;
  }

  /** WebSocket 식별자 */
  get id(): string {
    return this.socketId;
  }

  /** 인증 헤더 */
  private get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
  }

  /** WebSocket 연결 */
  async connect(): Promise<void> {
    await WebSocketService.connect(this.socketId, `${WS_BASE_URL}${this.endpoint}`, this.authHeaders);
  }

  /**
   * 재연결을 예약합니다.
   * @param onReconnecting - 재연결 중 콜백
   */
  scheduleReconnect(onReconnecting: () => void): void {
    if (this.destroyed) return;
    onReconnecting();
    this.reconnectTimer = setTimeout(async () => {
      if (this.destroyed) return;
      this.reconnectTimer = null;
      await this.connect();
    }, this.reconnectDelay);
  }

  /** 재연결 및 연결을 모두 정리하고 폐기합니다 */
  async destroy(): Promise<void> {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await WebSocketService.disconnect(this.socketId);
  }
}
