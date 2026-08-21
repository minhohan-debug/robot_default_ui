/**
 * 인증 API 서비스
 *
 * - 로그인 및 토큰 갱신 API를 직접 호출합니다.
 * - `apiClient`가 아닌 일반 axios를 사용하여 인터셉터 순환을 방지합니다.
 */
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '@renderer/config/api';
import type { ApiResponse } from '@renderer/types/api';
import type { LoginPayload, LoginSuccessData, RefreshPayload } from '@renderer/types/auth';

/**
 * 로그인 API
 * @param payload - 사용자 아이디/비밀번호
 * @returns 로그인 성공 데이터
 */
export const login = (payload: LoginPayload): Promise<ApiResponse<LoginSuccessData>> => {
  return axios
    .post<ApiResponse<LoginSuccessData>>(`${API_BASE_URL}${API_ENDPOINTS.login}`, payload)
    .then((res) => res.data);
};

/**
 * refresh 토큰을 이용해 access 토큰을 갱신합니다.
 * @param payload - refresh_token
 * @returns 새 토큰 데이터
 */
export const refreshTokens = (payload: RefreshPayload): Promise<ApiResponse<LoginSuccessData>> => {
  return axios
    .post<ApiResponse<LoginSuccessData>>(`${API_BASE_URL}${API_ENDPOINTS.refresh}`, payload)
    .then((res) => res.data);
};
