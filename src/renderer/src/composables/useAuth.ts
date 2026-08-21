/**
 * 인증 상태 및 로그인/로그아웃 관련 컴포저블
 *
 * - localStorage와 연동된 반응형 인증 상태를 제공합니다.
 * - 접근 토큰, 역할 정보를 읽고 쓸 수 있습니다.
 */
import { computed, reactive, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';

/**
 * 로그인 응답에서 받은 토큰 정보
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  role: string | number;
}

/**
 * 현재 인증 상태
 */
interface AuthState {
  accessToken: string | null; // API 접근용 JWT
  refreshToken: string | null; // 토큰 재발급용 JWT
  userRole: string | null; // 사용자 역할 (예: '0'은 관리자)
}

/**
 * localStorage에서 복원된 전역 인증 상태
 */
export const authState = reactive<AuthState>({
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  userRole: localStorage.getItem('user_role'),
});

/**
 * 로그인 성공 시 토큰을 상태와 localStorage에 저장합니다.
 * @param tokens - access/refresh 토큰과 역할 정보
 */
export const setAuthTokens = (tokens: AuthTokens): void => {
  authState.accessToken = tokens.access_token;
  authState.refreshToken = tokens.refresh_token;
  authState.userRole = String(tokens.role);
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('user_role', authState.userRole);
};

/**
 * 인증 정보를 모두 초기화하고 localStorage에서 삭제합니다.
 */
export const clearAuth = (): void => {
  authState.accessToken = null;
  authState.refreshToken = null;
  authState.userRole = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
};

export const getAccessToken = (): string | null => authState.accessToken; // 접근 토큰 조회
export const getRefreshToken = (): string | null => authState.refreshToken; // 재발급 토큰 조회
export const getUserRole = (): string | null => authState.userRole; // 사용자 역할 조회

/**
 * 인증 관련 반응형 상태와 로그아웃 함수를 제공합니다.
 * @returns {object} accessToken, isAuthenticated, isAdmin, logout
 */
export function useAuth(): {
  accessToken: ComputedRef<string | null>;
  isAuthenticated: ComputedRef<boolean>;
  isAdmin: ComputedRef<boolean>;
  logout: () => Promise<void>;
} {
  const router = useRouter();

  const accessToken = computed<string | null>(() => authState.accessToken); // 현재 접근 토큰
  const isAuthenticated = computed<boolean>(() => !!authState.accessToken); // 로그인 여부
  const isAdmin = computed<boolean>(() => authState.userRole === '0'); // 관리자 권한 여부

  const logout = async (): Promise<void> => {
    clearAuth();
    await router.push('/login'); // 로그인 화면으로 이동
  };

  return { accessToken, isAuthenticated, isAdmin, logout };
}

/**
 * 접근 토큰 computed 래퍼
 */
export function useAccessToken(): Ref<string | null> {
  return computed<string | null>(() => authState.accessToken);
}
