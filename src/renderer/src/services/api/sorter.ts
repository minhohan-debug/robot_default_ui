/**
 * 선별기 배출구 설정 API 서비스
 */
import { apiClient } from '@renderer/services/api/index';
import { API_ENDPOINTS } from '@renderer/config/api';
import type { ApiResponse } from '@renderer/types/api';
import type { SorterSetting } from '@renderer/types/sorter';

/** RA-037: 선별기 배출구 설정 목록을 조회합니다 */
export const getSorterSettings = (): Promise<ApiResponse<SorterSetting[]>> =>
  apiClient.get<ApiResponse<SorterSetting[]>>(API_ENDPOINTS.sorterSetting).then((res) => res.data);

/**
 * 선별기 배출구 설정 저장 요청 페이로드
 */
export interface SorterSettingPayload {
  sector_info: SorterSetting[];
}

/** RA-038: 선별기 배출구 설정을 등록/저장합니다 */
export const registerSorterSettings = (payload: SorterSettingPayload): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.sorterSetting, payload).then((res) => res.data);
