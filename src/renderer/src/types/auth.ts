/**
 * 로그인 요청 파라미터 규격 (명세서 RA-001) [cite: 65]
 */
export interface LoginPayload {
  type: number; // 0: 관리자, 1: 사용자
  pw: string; // 비밀번호 (4-16자)
}

/**
 * 토큰 재발급 요청 파라미터 규격 (명세서 RA-002)
 */
export interface RefreshPayload {
  refresh_token: string;
}

/**
 * 로그인 성공 응답 data 규격 (명세서 RA-001) [cite: 65]
 */
export interface LoginSuccessData {
  access_token: string; // 접근 토큰
  refresh_token: string; // 갱신 토큰
  token_type: string; // 토큰 타입 (Bearer)
  role: number; // 계정 타입 (0: 관리자, 1: 사용자)
}
