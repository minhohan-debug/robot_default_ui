/** 로봇 기본 정보 */
export interface Robot {
  robot_id: number;
  description: string;
}

/** 로봇 명령어 정보 */
export interface RobotCommand {
  command_id: number;
  command: string;
  description: string;
  extra_usable: boolean;
}

/** 원격 제어 요청 페이로드 */
export interface RobotControlRequest {
  robot_id: number[]; // 제어 대상 로봇 ID 목록
  command_id: number; // 명령어 ID
  extra_command: string | null; // 추가 명령 (선택)
}

/** 원격 제어 이력 항목 */
export interface RemoteControlHistoryItem {
  remote_id: number;
  command: string;
  extra_data: string | null;
  description: string;
  created_at: string;
  collected_at: string;
  responded_at: string | null;
}

/** 로봇 실시간 상태 */
export interface RobotStatus {
  robot_id: number; // 로봇 ID
  state: number | null; // 상태 코드
  current_sector: number | null; // 현재 배출구
  progress: number | null; // 진행률
  task_id: string | null; // 현재 작업 ID
  connected: boolean; // 연결 여부
}

/** 로봇 오류 코드 */
export interface RobotErrorCode {
  error_code: string;
  description: string;
}

/** 로봇 오류 이력 항목 */
export interface RobotErrorHistoryItem {
  code: string; // 오류 코드
  level: number; // 심각도
  message: string; // 오류 메시지
  occurred_at: string; // 발생 시각
  uid?: string; // 화면 표시용 고유 ID
}

/** 로봇 작업 통계 */
export interface RobotStatistics {
  weekly_task: number[];
  weekly_average: Record<string, number[]>;
  daily_task: Record<string, number>;
  daily_utilization: Record<string, number>;
}

/** 로봇 오류 통계 */
export interface RobotErrorStatistics {
  weekly_error: Record<string, number[]>;
  daily_error: Record<string, number>;
}
