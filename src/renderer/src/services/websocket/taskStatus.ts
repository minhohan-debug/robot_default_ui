/**
 * 작업 진행 상태(task status) WebSocket
 *
 * - `/v1/task/status` 엔드포인트에서 전체 작업 진행률을 실시간 수신
 * - task_id 기준으로 정렬
 */
import type { TaskProgress } from '@renderer/types/task';
import { API_ENDPOINTS } from '@renderer/config/api';
import { StatusSocket } from './statusSocket';

export class TaskStatusSocket extends StatusSocket {
  static readonly ID = 'taskStatus';

  constructor() {
    super(TaskStatusSocket.ID, API_ENDPOINTS.taskStatus);
  }

  /**
   * 수신 데이터를 작업 진행 리스트로 파싱합니다.
   * @param data - 수신된 JSON 문자열
   */
  static parseData(data: string): TaskProgress[] {
    const parsed = JSON.parse(data);
    return parsed.data as TaskProgress[];
  }

  /**
   * task_id의 날짜/순서를 기준으로 정렬합니다.
   * @param tasks - 작업 진행 배열
   */
  static sortByTaskId(tasks: TaskProgress[]): TaskProgress[] {
    return [...tasks].sort((a, b) => {
      const [, dateA = '', seqA = '0'] = a.task_id.split('_');
      const [, dateB = '', seqB = '0'] = b.task_id.split('_');
      return dateA.localeCompare(dateB) || Number(seqA) - Number(seqB);
    });
  }
}
