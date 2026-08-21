"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  // WebSocket 연결을 메인 프로세스에 요청합니다
  wsConnect: (id, url, headers) => electron.ipcRenderer.invoke("ws:connect", { id, url, headers }),
  // WebSocket 연결을 종료합니다. id가 없으면 전체 연결을 종료합니다
  wsDisconnect: (id) => electron.ipcRenderer.invoke("ws:disconnect", id),
  // WebSocket 메시지를 메인 프로세스를 통해 전송합니다
  wsSend: (id, data) => electron.ipcRenderer.invoke("ws:send", { id, data }),
  // WebSocket 연결 성공 이벤트를 렌더러로 전달합니다
  onWsOpen: (cb) => {
    electron.ipcRenderer.on("ws:open", (_e, id) => cb(id));
  },
  // WebSocket 수신 메시지를 렌더러로 전달합니다
  onWsMessage: (cb) => {
    electron.ipcRenderer.on("ws:message", (_e, id, data) => cb(id, data));
  },
  // WebSocket 오류를 렌더러로 전달합니다
  onWsError: (cb) => {
    electron.ipcRenderer.on("ws:error", (_e, id, msg) => cb(id, msg));
  },
  // WebSocket 연결 종료 이벤트를 렌더러로 전달합니다
  onWsClose: (cb) => {
    electron.ipcRenderer.on("ws:close", (_e, id) => cb(id));
  },
  // 등록된 WebSocket 이벤트 리스너를 모두 제거합니다
  offWsListeners: () => {
    electron.ipcRenderer.removeAllListeners("ws:open");
    electron.ipcRenderer.removeAllListeners("ws:message");
    electron.ipcRenderer.removeAllListeners("ws:error");
    electron.ipcRenderer.removeAllListeners("ws:close");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
