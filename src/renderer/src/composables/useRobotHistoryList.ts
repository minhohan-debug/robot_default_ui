/**
 * 로봇별 작업/오류 이력 WebSocket 데이터를 관리하는 컴포저블
 *
 * - WebSocket 연결 수립
 * - 신규 데이터 수신 시 중복 제거 및 `new-row` 하이라이팅
 * - 컴포넌트 언마운트 시 연결 정리
 */
import { ref, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import { refreshAccessToken } from '@renderer/services/auth/tokenRefresh';
import { WebSocketService } from '@renderer/services/websocket/webSocketService';
import { BaseRobotHistorySocket } from '@renderer/services/websocket/baseRobotHistory';

/**
 * useRobotHistoryList 반환 타입
 */
export interface UseRobotHistoryListReturn<T> {
  loading: Ref<boolean>; // 데이터 로딩 상태
  historyMap: Ref<Record<number, T[]>>; // robot_id별 이력 목록
  fetchHistories: (start: string, end: string) => Promise<void>; // 기간 검색
  rowClass: (data: T & { uid?: string }) => string; // 신규 행 CSS 클래스 반환
}

// API/WS 인증을 위해 토큰을 갱신합니다
const ensureAccessToken = async (): Promise<string | null> => refreshAccessToken();

/**
 * 로봇 이력 목록 훅
 * @param socket - WebSocket 데이터 파싱/연결 객체
 * @param makeUid - 항목별 고유 id 생성 함수
 * @returns {UseRobotHistoryListReturn<T>} 로딩, 데이터, 검색 함수, 행 클래스
 */
export function useRobotHistoryList<T extends { uid?: string }>(
  socket: BaseRobotHistorySocket<T>,
  makeUid: (robotId: number, item: T, index: number) => string,
): UseRobotHistoryListReturn<T> {
  const loading = ref(false); // 로딩 상태
  const historyMap = ref<Record<number, T[]>>({}); // robot_id별 이력 데이터
  const newIds = ref<Set<string>>(new Set()); // 최근 추가된 uid 집합 (하이라이트용)
  const uidMap = new Map<string, T>(); // uid → 항목 중복 방지 맵

  /**
   * WebSocket 이벤트 리스너를 등록합니다.
   * 메시지 수신 시 robot_id별로 중복 제거 후 맨 앞에 추가하고,
   * 1.5초간 'new-row' 클래스로 신규 항목을 표시합니다.
   */
  const registerWsListeners = (): void => {
    WebSocketService.onMessage(socket.id, (data) => {
      try {
        const incoming = socket.parseRobotData(data);
        const addedIds: string[] = [];
        for (const [robotId, items] of Object.entries(incoming)) {
          const rid = Number(robotId);
          const newItems: T[] = [];
          // 최신 항목부터 역순으로 처리
          for (const [index, item] of [...items].reverse().entries()) {
            const uid = makeUid(rid, item, index);
            if (uidMap.has(uid)) continue; // 중복 무시
            const enriched = { ...item, uid } as T;
            uidMap.set(uid, enriched);
            newItems.push(enriched);
            addedIds.push(uid);
          }
          if (newItems.length === 0) continue;
          historyMap.value[rid] = [...newItems, ...(historyMap.value[rid] ?? [])];
        }
        if (addedIds.length > 0) {
          const next = new Set(newIds.value);
          addedIds.forEach((id) => next.add(id));
          newIds.value = next;
          setTimeout(() => {
            const removed = new Set(newIds.value);
            addedIds.forEach((id) => removed.delete(id));
            newIds.value = removed;
          }, 1500);
        }
      } catch (error) {
        console.error('[useRobotHistoryList] WebSocket parse error:', error);
      } finally {
        loading.value = false;
      }
    });

    WebSocketService.onClose(socket.id, () => {
      loading.value = false;
    });

    WebSocketService.onError(socket.id, () => {
      loading.value = false;
    });
  };

  /**
   * 지정한 기간의 이력 데이터를 WebSocket으로 요청합니다.
   * @param start - 검색 시작 시간 문자열
   * @param end - 검색 종료 시간 문자열
   */
  const fetchHistories = async (start: string, end: string): Promise<void> => {
    loading.value = true;
    historyMap.value = {};
    newIds.value = new Set();
    uidMap.clear();
    const accessToken = await ensureAccessToken();
    if (!accessToken) {
      loading.value = false;
      return;
    }
    await socket.disconnect();
    await socket.connect(start, end);
  };

  // 컴포넌트가 제거되면 WebSocket 리스너와 연결을 정리합니다
  onUnmounted(async () => {
    WebSocketService.offListeners(socket.id);
    await socket.disconnect();
  });

  registerWsListeners();

  /**
   * 신규 데이터 행에 하이라이트용 클래스를 부여합니다.
   * @param data - 이력 항목
   * @returns CSS 클래스 문자열
   */
  const rowClass = (data: T & { uid?: string }): string => (newIds.value.has(data.uid ?? '') ? 'new-row' : '');

  return { loading, historyMap, fetchHistories, rowClass };
}
