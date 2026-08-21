/**
 * 선별기 실시간 상태 WebSocket
 *
 * - `/v1/sorter` 엔드포인트에서 선별기 연결/수량/배출구 정보 수신
 */
import type { SorterStatus } from '@renderer/types/sorter';
import { API_ENDPOINTS } from '@renderer/config/api';
import { StatusSocket } from './statusSocket';

export class SorterStatusSocket extends StatusSocket {
  static readonly ID = 'sorterStatus';

  constructor() {
    super(SorterStatusSocket.ID, API_ENDPOINTS.sorterStatus);
  }

  /**
   * 수신 데이터를 SorterStatus 객체로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): SorterStatus {
    const parsed = JSON.parse(data);
    const raw = (parsed?.data ?? {}) as Record<string, unknown>;
    const sectorInfo = (raw.sector_info as Record<string, number>) ?? {};
    return {
      connected: raw.connected === true || raw.connected === 'true', // 연결 상태
      total_qty: raw.total_qty != null ? Number(raw.total_qty) : null, // 총 수량
      total_weight: raw.total_weight != null ? Number(raw.total_weight) : null, // 총 중량
      excepted_qty: raw.excepted_qty != null ? Number(raw.excepted_qty) : null, // 불량 수량
      excepted_weight: raw.excepted_weight != null ? Number(raw.excepted_weight) : null, // 불량 중량
      sector_info: sectorInfo, // 배출구별 수량
    };
  }
}
