/**
 * API 응답 타입 정의
 *
 * - 성공/실패 응답 규격을 정의합니다.
 */
// src/types/api.ts

/**
 * 공통 API 성공 응답 규격
 * @template T - 응답 data의 실제 타입
 */
export interface ApiResponse<T> {
  err_code: string | null; // 서버 응답 결과 코드 (NULL이면 정상)
  message: string | null; // 에러 메시지
  data: T | null; // 실제 결과 데이터
  count: number | null; // data 개수
}

/**
 * 공통 API 실패(Fail) 응답 규격
 */
export interface ApiErrorResponse {
  detail: {
    err_code: string; // 서버 에러 코드
    message: string; // 에러 상세 메시지
  };
}
