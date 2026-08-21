/**
 * 선별기 배출구 설정 실시간 WebSocket
 *
 * - `/v1/sorter/setting` 엔드포인트에서 현재 선별기 설정 상태 수신
 */
import type { SorterSetting } from '@renderer/types/sorter';
import { API_ENDPOINTS } from '@renderer/config/api';
import { StatusSocket } from './statusSocket';

export class SorterSettingStatusSocket extends StatusSocket {
  static readonly ID = 'sorterSettingStatus';

  constructor() {
    super(SorterSettingStatusSocket.ID, API_ENDPOINTS.sorterSetting);
  }

  /**
   * 수신 데이터를 선별기 배출구 설정 리스트로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): SorterSetting[] {
    const parsed = JSON.parse(data);
    return (parsed?.data ?? []) as SorterSetting[];
  }
}
