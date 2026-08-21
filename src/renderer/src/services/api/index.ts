/**
 * 전역 axios 인스턴스 및 인증/토큰 갱신 인터셉터 설정
 */
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@renderer/config/api';
import { ERROR_CODES } from '@renderer/constants/errorCodes';
import { refreshAccessToken } from '@renderer/services/auth/tokenRefresh';
import { getAccessToken } from '@renderer/composables/useAuth';

// API_BASE_URL을 기준으로 axios 인스턴스를 생성합니다
export const apiClient = axios.create({ baseURL: API_BASE_URL });

/**
 * 요청 인터셉터: 저장된 access 토큰이 있으면 Authorization 헤더에 Bearer로 추가합니다.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 응답 인터셉터: 401, 토큰 만료/무효 코드이면 토큰을 재발급한 후 원래 요청을 재시도합니다.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const responseData = error.response?.data as { detail?: { err_code?: string }; err_code?: string } | undefined;
    const errCode: string | undefined = responseData?.detail?.err_code ?? responseData?.err_code;

    if (
      (error.response?.status === 401 ||
        errCode === ERROR_CODES.ACCESS_TOKEN_EXPIRED ||
        errCode === ERROR_CODES.ACCESS_TOKEN_INVALID) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error('Token refresh failed');
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
