/**
 * 로봇 명령어 및 원격 제어 API 서비스
 */
import { apiClient } from '@renderer/services/api/index';
import { API_ENDPOINTS } from '@renderer/config/api';
import type { ApiResponse } from '@renderer/types/api';
import type { RobotCommand, RobotControlRequest } from '@renderer/types/robot';

/** RA-014: 로봇 명령어 목록을 조회합니다 */
export const getRobotCommands = (): Promise<ApiResponse<RobotCommand[]>> =>
  apiClient.get<ApiResponse<RobotCommand[]>>(API_ENDPOINTS.robotCommand).then((res) => res.data);

/** RA-019: 특정 로봇에 원격 제어 명령을 요청합니다 */
export const requestRobotControl = (payload: RobotControlRequest): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.robotControlRequest, payload).then((res) => res.data);
