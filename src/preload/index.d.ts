/**
 * Electron 프리로드에서 노출하는 API 타입 정의
 *
 * `window.electron`과 `window.api`의 타입을 확장하여
 * 렌더러 프로세스에서 TypeScript 자동 완성을 지원합니다.
 */
import { ElectronAPI } from '@electron-toolkit/preload';

/**
 * WebSocket IPC API 인터페이스
 */
interface AppApi {
  // WebSocket 연결을 요청합니다
  wsConnect: (id: string, url: string, headers: Record<string, string>) => Promise<void>;
  // WebSocket 연결을 종료합니다. id 미지정 시 전체 종료
  wsDisconnect: (id?: string) => Promise<void>;
  // WebSocket 메시지를 전송합니다
  wsSend: (id: string, data: string) => Promise<void>;
  // WebSocket open 이벤트를 수신합니다
  onWsOpen: (cb: (id: string) => void) => void;
  // WebSocket message 이벤트를 수신합니다
  onWsMessage: (cb: (id: string, data: string) => void) => void;
  // WebSocket error 이벤트를 수신합니다
  onWsError: (cb: (id: string, msg: string) => void) => void;
  // WebSocket close 이벤트를 수신합니다
  onWsClose: (cb: (id: string) => void) => void;
  // WebSocket 관련 IPC 리스너를 해제합니다
  offWsListeners: () => void;
}

/**
 * 전역 Window 인터페이스 확장
 */
declare global {
  interface Window {
    // Electron Toolkit에서 제공하는 기본 Electron API
    electron: ElectronAPI;
    // 커스텀 WebSocket IPC API
    api: AppApi;
  }
}
