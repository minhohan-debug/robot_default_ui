/**
 * 로봇/명령어/오류 코드 CRUD API 서비스
 *
 * API 명세서 RA-005 ~ RA-028번에 해당하는 엔드포인트를 호출합니다.
 */
import { apiClient } from '@renderer/services/api/index';
import { API_ENDPOINTS } from '@renderer/config/api';
import type { ApiResponse } from '@renderer/types/api';
import type { Robot, RobotCommand, RobotControlRequest, RobotErrorCode } from '@renderer/types/robot';

/** RA-005: 전체 로봇 리스트를 조회합니다 */
export const getRobotList = (): Promise<ApiResponse<Robot[]>> =>
  apiClient.get<ApiResponse<Robot[]>>(API_ENDPOINTS.robot).then((res) => res.data);

/** RA-006: 신규 로봇을 등록합니다 */
export const createRobot = (payload: Robot): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.robot, payload).then((res) => res.data);

/** RA-007: 기존 로봇 정보를 수정합니다 */
export const updateRobot = (payload: Robot): Promise<ApiResponse<null>> =>
  apiClient.put<ApiResponse<null>>(API_ENDPOINTS.robot, payload).then((res) => res.data);

/** RA-008: 지정한 로봇을 삭제합니다 */
export const deleteRobot = (robotId: number): Promise<ApiResponse<null>> =>
  apiClient.delete<ApiResponse<null>>(API_ENDPOINTS.robot, { data: { robot_id: robotId } }).then((res) => res.data);

/** RA-011: 특정 로봇의 설정 정보를 조회합니다 */
export const getRobotSetting = (robotId: number): Promise<ApiResponse<unknown>> =>
  apiClient.get<ApiResponse<unknown>>(`${API_ENDPOINTS.robotSetting}/${robotId}`).then((res) => res.data);

/** RA-012: 특정 로봇의 설정 정보를 저장합니다 */
export const updateRobotSetting = (
  payload: { robot_id: number } & Record<string, unknown>,
): Promise<ApiResponse<null>> =>
  apiClient.put<ApiResponse<null>>(API_ENDPOINTS.robotSetting, payload).then((res) => res.data);

/** RA-014: 등록된 로봇 명령어 목록을 조회합니다 */
export const getRobotCommands = (): Promise<ApiResponse<RobotCommand[]>> =>
  apiClient.get<ApiResponse<RobotCommand[]>>(API_ENDPOINTS.robotCommand).then((res) => res.data);

/** RA-015: 로봇 명령어를 신규 등록합니다 */
export const createRobotCommand = (payload: {
  command: string;
  description: string;
  extra_usable: boolean;
}): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.robotCommand, payload).then((res) => res.data);

/** RA-016: 기존 로봇 명령어를 수정합니다 */
export const updateRobotCommand = (payload: RobotCommand): Promise<ApiResponse<null>> =>
  apiClient.put<ApiResponse<null>>(API_ENDPOINTS.robotCommand, payload).then((res) => res.data);

/** RA-017: 지정한 로봇 명령어를 삭제합니다 */
export const deleteRobotCommand = (commandId: number): Promise<ApiResponse<null>> =>
  apiClient
    .delete<ApiResponse<null>>(API_ENDPOINTS.robotCommand, { data: { command_id: commandId } })
    .then((res) => res.data);

/** RA-019: 특정 로봇에 원격 제어 요청을 전송합니다 */
export const sendRobotControlRequest = (payload: RobotControlRequest): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.robotControlRequest, payload).then((res) => res.data);

/** RA-024: 등록된 로봇 오류 코드 목록을 조회합니다 */
export const getRobotErrorCodes = (): Promise<ApiResponse<RobotErrorCode[]>> =>
  apiClient.get<ApiResponse<RobotErrorCode[]>>(API_ENDPOINTS.robotErrorCode).then((res) => res.data);

/** RA-026: 로봇 오류 코드를 신규 등록합니다 */
export const createRobotErrorCode = (payload: {
  error_code: string;
  description: string;
}): Promise<ApiResponse<null>> =>
  apiClient.post<ApiResponse<null>>(API_ENDPOINTS.robotErrorCode, payload).then((res) => res.data);

/** RA-027: 기존 로봇 오류 코드를 수정합니다 */
export const updateRobotErrorCode = (payload: {
  error_code: string;
  description: string;
}): Promise<ApiResponse<null>> =>
  apiClient.put<ApiResponse<null>>(API_ENDPOINTS.robotErrorCode, payload).then((res) => res.data);

/** RA-028: 지정한 로봇 오류 코드를 삭제합니다 */
export const deleteRobotErrorCode = (errorCode: string): Promise<ApiResponse<null>> =>
  apiClient
    .delete<ApiResponse<null>>(API_ENDPOINTS.robotErrorCode, { data: { error_code: errorCode } })
    .then((res) => res.data);
