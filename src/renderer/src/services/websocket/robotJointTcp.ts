/**
 * 특정 로봇의 관절(Joint) 및 TCP 좌표 WebSocket
 *
 * - `/v1/robot/joint-tcp/{robot_id}` 엔드포인트에서 실시간 좌표 데이터 수신
 */
import { WS_BASE_URL } from '@renderer/config/api';
import { getAccessToken } from '@renderer/composables/useAuth';
import { WebSocketService } from './webSocketService';

/** 6축 관절 각도 데이터 */
export interface JointData {
  joint_1: number | null;
  joint_2: number | null;
  joint_3: number | null;
  joint_4: number | null;
  joint_5: number | null;
  joint_6: number | null;
  updated_at: string | null;
}

/** TCP(툴 중심점) 좌표 데이터 */
export interface TcpData {
  x: number | null;
  y: number | null;
  z: number | null;
  rx: number | null;
  ry: number | null;
  rz: number | null;
  updated_at: string | null;
}

/** 관절 + TCP 데이터 */
export interface RobotJointTcpData {
  joint: JointData;
  tcp: TcpData;
}

export class RobotJointTcpSocket {
  static readonly ID_PREFIX = 'robotJointTcp';

  private robotId: number; // 조회 대상 로봇 ID

  /**
   * @param robotId - 조회 대상 로봇 ID
   */
  constructor(robotId: number) {
    this.robotId = robotId;
  }

  get id(): string {
    return `${RobotJointTcpSocket.ID_PREFIX}_${this.robotId}`;
  }

  private get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${getAccessToken() ?? ''}` };
  }

  /** WebSocket 연결 */
  async connect(): Promise<void> {
    await WebSocketService.connect(this.id, `${WS_BASE_URL}/api/v1/robot/joint-tcp/${this.robotId}`, this.authHeaders);
  }

  async destroy(): Promise<void> {
    await WebSocketService.disconnect(this.id);
  }

  /**
   * 수신 데이터를 RobotJointTcpData로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): RobotJointTcpData | null {
    const parsed = JSON.parse(data) as { data?: RobotJointTcpData } | null;
    if (!parsed?.data) return null;
    return parsed.data;
  }
}
