/**
 * 로봇별 이력 WebSocket 기본 클래스
 *
 * - 시간 범위 기반 WebSocket 연결/해제
 * - robot_id별로 그룹화된 데이터 파싱
 */
import { WS_BASE_URL } from '@renderer/config/api';
import { getAccessToken } from '@renderer/composables/useAuth';
import { WebSocketService } from './webSocketService';

export class BaseRobotHistorySocket<T> {
  private readonly socketId: string; // WebSocket 식별자
  private readonly defaultEndpoint: string; // 기본 API 엔드포인트

  /**
   * @param id - WebSocket 식별자
   * @param defaultEndpoint - 연결할 기본 엔드포인트
   */
  constructor(id: string, defaultEndpoint: string) {
    this.socketId = id;
    this.defaultEndpoint = defaultEndpoint;
  }

  /** WebSocket 식별자 */
  get id(): string {
    return this.socketId;
  }

  /** 인증 헤더 (access 토큰) */
  protected get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
  }

  /**
   * WebSocket을 연결합니다.
   * @param startDatetime - 조회 시작 시간
   * @param endDatetime - 조회 종료 시간
   * @param endpoint - 기본값 이외의 엔드포인트
   */
  async connect(startDatetime: string, endDatetime: string, endpoint?: string): Promise<void> {
    const url = `${WS_BASE_URL}${endpoint ?? this.defaultEndpoint}?start_datetime=${startDatetime}&end_datetime=${endDatetime}`;
    await WebSocketService.connect(this.socketId, url, this.authHeaders);
  }

  /** WebSocket 연결을 종료합니다 */
  async disconnect(): Promise<void> {
    await WebSocketService.disconnect(this.socketId);
  }

  /**
   * 수신 데이터를 robot_id별로 매핑하여 반환합니다.
   * @param data - 수신된 JSON 문자열
   * @returns robot_id가 키인 데이터 맵
   */
  parseRobotData(data: string): Record<number, T[]> {
    const parsed = JSON.parse(data) as { data?: Record<string, T[]> };
    const result: Record<number, T[]> = {};
    for (const [key, items] of Object.entries(parsed.data ?? {})) {
      result[Number(key)] = items;
    }
    return result;
  }
}
