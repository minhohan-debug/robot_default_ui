/**
 * 백엔드 서버 URL 설정
 */
export const API_BASE_URL = 'http://127.0.0.1:8000'; // HTTP API 기본 URL
export const WS_BASE_URL = 'ws://127.0.0.1:8000'; // WebSocket 기본 URL

/**
 * API 경로 상수
 */
export const API_ENDPOINTS = {
  login: '/api/v1/auth/login',
  refresh: '/api/v1/auth/refresh',
  robot: '/api/v1/robot',
  robotCommand: '/api/v1/robot/command',
  robotControlRequest: '/api/v1/robot/control/request',
  robotControlHistory: '/api/v1/robot/control',
  robotSetting: '/api/v1/robot/setting',
  robotStatus: '/api/v1/robot/status',
  robotTaskHistory: '/api/v1/robot/task/history',
  robotErrorHistory: '/api/v1/robot/error/history',
  robotStatistics: '/api/v1/robot/statistics',
  robotErrorStatistics: '/api/v1/robot/error/statistics',
  robotErrorCode: '/api/v1/robot/error/code',
  taskHistory: '/api/v1/task/history',
  taskDetail: '/api/v1/task/detail',
  taskStatus: '/api/v1/task/status',
  sorterStatus: '/api/v1/sorter',
  sorterSetting: '/api/v1/sorter/setting',
} as const;
