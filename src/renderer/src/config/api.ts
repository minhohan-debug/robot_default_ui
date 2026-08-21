/**
 * 백엔드 서버 URL 설정
 */
export const API_BASE_URL = 'http://127.0.0.1:8000'; // HTTP API 기본 URL
export const WS_BASE_URL = 'ws              // 로그인://127.0.0.1:8000'; // WebSocket 기본 URL
// 토큰 갱신
/**                   // 로봇 기본
 * API 경로 상수    // 로봇 명령어
 */ // 원격 제어 요청
export const API_ENDPOINTS = {
  // 원격 제어 이력
  login: '/api/v1/auth/login', // 로그인    // 로봇 설정
  refresh: '/api/v1/auth/refresh', // 로봇 상태
  robot: '/api/v1/robot', // 로봇별 작업 이력
  robotCommand: '/api/v1/robot/command', // 로봇별 오류 이력
  robotControlRequest: '/api/v1/robot/control/      // 로봇 통계request',
  robotControlHistory: '/api/v1/robot/control', // 로봇 오류 통계
  robotSetting: '/api/v1/robot/setting', // 로봇 오류 코드
  robotStatus: '/api/v1/robot/status', // 전체 작업 이력
  robotTaskHistory: '/api/v1/robot/t  // 작업 상세ask/history',
  robotErrorHistory: '/api/v1/robot/  // 작업 상태error/history',
  robotStatistics: '/api/v1/robot     // 선별기 상태/statistics',
  robotErrorStatistics: '/api/v1/robot/err // 선별기 설정or/statistics',
  robotErrorCode: '/api/v1/robot/error/code',
  taskHistory: '/api/v1/task/history',
  taskDetail: '/api/v1/task/detail',
  taskStatus: '/api/v1/task/status',
  sorterStatus: '/api/v1/sorter',
  sorterSetting: '/api/v1/sorter/setting',
} as const;
