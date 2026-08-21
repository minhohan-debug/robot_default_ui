/**
 * Electron 프리로드(Preload) 스크립트
 *
 * 메인 프로세스와 렌더러 프로세스 사이의 안전한 IPC 통신 브리지를 구성합니다.
 * 렌더러에서는 `window.api`와 `window.electron`을 통해 노출된 기능만 사용할 수 있습니다.
 */
import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// 렌더러에서 사용할 커스텀 API 객체
/**
 * 렌더러에서 호출하는 WebSocket 관련 IPC API
 */
const api = {
  // WebSocket 연결을 메인 프로세스에 요청합니다
  wsConnect: (id: string, url: string, headers: Record<string, string>): Promise<void> =>
    ipcRenderer.invoke('ws:connect', { id, url, headers }),
  // WebSocket 연결을 종료합니다. id가 없으면 전체 연결을 종료합니다
  wsDisconnect: (id?: string): Promise<void> => ipcRenderer.invoke('ws:disconnect', id),
  // WebSocket 메시지를 메인 프로세스를 통해 전송합니다
  wsSend: (id: string, data: string): Promise<void> => ipcRenderer.invoke('ws:send', { id, data }),
  // WebSocket 연결 성공 이벤트를 렌더러로 전달합니다
  onWsOpen: (cb: (id: string) => void): void => {
    ipcRenderer.on('ws:open', (_e, id) => cb(id));
  },
  // WebSocket 수신 메시지를 렌더러로 전달합니다
  onWsMessage: (cb: (id: string, data: string) => void): void => {
    ipcRenderer.on('ws:message', (_e, id, data) => cb(id, data));
  },
  // WebSocket 오류를 렌더러로 전달합니다
  onWsError: (cb: (id: string, msg: string) => void): void => {
    ipcRenderer.on('ws:error', (_e, id, msg) => cb(id, msg));
  },
  // WebSocket 연결 종료 이벤트를 렌더러로 전달합니다
  onWsClose: (cb: (id: string) => void): void => {
    ipcRenderer.on('ws:close', (_e, id) => cb(id));
  },
  // 등록된 WebSocket 이벤트 리스너를 모두 제거합니다
  offWsListeners: (): void => {
    ipcRenderer.removeAllListeners('ws:open');
    ipcRenderer.removeAllListeners('ws:message');
    ipcRenderer.removeAllListeners('ws:error');
    ipcRenderer.removeAllListeners('ws:close');
  },
};

// 컨텍스트 분리(contextIsolation) 설정에 따라 API를 노출합니다
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
