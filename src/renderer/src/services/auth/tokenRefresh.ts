/**
 * 액세스 토큰 갱신 서비스
 *
 * refresh 토큰을 사용하여 새 access 토큰을 발급받고,
 * 실패 시 인증 정보를 초기화하고 로그인 화면으로 이동합니다.
 */
import axios from 'axios';
import router from '@renderer/router';
import { refreshTokens } from '@renderer/services/api/auth';
import { getRefreshToken, setAuthTokens, clearAuth } from '@renderer/composables/useAuth';
import { ERROR_CODES } from '@renderer/constants/errorCodes';
import type { ApiErrorResponse } from '@renderer/types/api';

// 중복된 토큰 갱신 요청을 방지하기 위해 현재 진행 중인 Promise를 저장합니다
let refreshPromise: Promise<string | null> | null = null;

/**
 * refresh 토큰 갱신이 불가능한 치명적인 오류인지 확인합니다.
 * @param errCode - 서버 응답의 에러 코드
 * @returns true이면 로그아웃 처리
 */
const isFatalRefreshError = (errCode?: string): boolean =>
  errCode === ERROR_CODES.REFRESH_TOKEN_INVALID ||
  errCode === ERROR_CODES.REFRESH_TOKEN_EXPIRED ||
  errCode === ERROR_CODES.TOKEN_IP_MISMATCH ||
  errCode === ERROR_CODES.SESSION_BLOCKED;

/**
 * access 토큰을 갱신합니다.
 * @returns 새 access 토큰, 실패하면 null
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  // 이미 갱신 중이면 같은 Promise를 재사용합니다
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  // refresh 토큰이 없으면 인증 정보를 지우고 로그인으로 이동합니다
  if (!refreshToken) {
    clearAuth();
    await router.push('/login');
    return null;
  }

  refreshPromise = refreshTokens({ refresh_token: refreshToken })
    .then((response) => {
      const tokenData = response.data;
      // access 토큰이 없으면 갱신 실패로 간주하고 로그인으로 이동합니다
      if (!tokenData?.access_token) {
        clearAuth();
        void router.push('/login');
        return null;
      }
      // 새로 받은 토큰 정보를 상태와 localStorage에 저장합니다
      setAuthTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        role: tokenData.role,
      });
      return tokenData.access_token;
    })
    .catch(async (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as ApiErrorResponse | undefined;
        const errCode = errorData?.detail?.err_code;
        // 치명적인 refresh 오류 발생 시 인증 초기화 및 로그인 이동
        if (isFatalRefreshError(errCode)) {
          clearAuth();
          await router.push('/login');
        }
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null; // 다음 갱신을 위해 Promise 초기화
    });

  return refreshPromise;
};
