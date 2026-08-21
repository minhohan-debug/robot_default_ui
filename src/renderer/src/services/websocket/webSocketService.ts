/**
 * 렌더러 WebSocket 이벤트 관리 서비스
 *
 * - Electron preload의 `window.api`를 통해 메인 프로세스와 통신합니다.
 * - 소켓 ID별로 open/message/close/error 핸들러를 등록/제거합니다.
 */

// 특정 소켓 ID용 이벤트 핸들러 타입
type MessageHandler = (data: string) => void;
type OpenHandler = () => void;
type CloseHandler = () => void;
type ErrorHandler = (msg: string) => void;
// 전체 이벤트를 수신하는 글로벌 핸들러 타입
type GlobalMessageHandler = (id: string, data: string) => void;
type GlobalOpenHandler = (id: string) => void;
type GlobalCloseHandler = (id: string) => void;
type GlobalErrorHandler = (id: string, msg: string) => void;

// ID → 핸들러 집합 맵
type HandlerMap<T> = Map<string, Set<T>>;

// 소켓 ID별 핸들러 저장소
const messageHandlers: HandlerMap<MessageHandler> = new Map();
const openHandlers: HandlerMap<OpenHandler> = new Map();
const closeHandlers: HandlerMap<CloseHandler> = new Map();
const errorHandlers: HandlerMap<ErrorHandler> = new Map();
// 글로벌(모든 소켓) 핸들러 저장소
const globalMessageHandlers: Set<GlobalMessageHandler> = new Set();
const globalOpenHandlers: Set<GlobalOpenHandler> = new Set();
const globalCloseHandlers: Set<GlobalCloseHandler> = new Set();
const globalErrorHandlers: Set<GlobalErrorHandler> = new Set();

// 글로벌 메시지 리스너가 등록되었는지 추적
let globalMessageListenerAdded = false;

/**
 * `window.api.onWsMessage`를 한 번만 등록하여,
 * messageHandlers와 globalMessageHandlers에 연결된 핸들러를 실행합니다.
 */
const ensureGlobalMessageListener = (): void => {
  if (globalMessageListenerAdded) return;
  globalMessageListenerAdded = true;
  window.api.onWsMessage((id, data) => {
    messageHandlers.get(id)?.forEach((handler) => handler(data));
    globalMessageHandlers.forEach((handler) => handler(id, data));
  });
};

// 글로벌 open 리스너가 등록되었는지 추적
let globalOpenListenerAdded = false;

/**
 * `window.api.onWsOpen`를 한 번만 등록하여 open 이벤트를 분배합니다.
 */
const ensureGlobalOpenListener = (): void => {
  if (globalOpenListenerAdded) return;
  globalOpenListenerAdded = true;
  window.api.onWsOpen((id) => {
    openHandlers.get(id)?.forEach((handler) => handler());
    globalOpenHandlers.forEach((handler) => handler(id));
  });
};

// 글로벌 close 리스너가 등록되었는지 추적
let globalCloseListenerAdded = false;

/**
 * `window.api.onWsClose`를 한 번만 등록하여 close 이벤트를 분배합니다.
 */
const ensureGlobalCloseListener = (): void => {
  if (globalCloseListenerAdded) return;
  globalCloseListenerAdded = true;
  window.api.onWsClose((id) => {
    closeHandlers.get(id)?.forEach((handler) => handler());
    globalCloseHandlers.forEach((handler) => handler(id));
  });
};

// 글로벌 error 리스너가 등록되었는지 추적
let globalErrorListenerAdded = false;

/**
 * `window.api.onWsError`를 한 번만 등록하여 error 이벤트를 분배합니다.
 */
const ensureGlobalErrorListener = (): void => {
  if (globalErrorListenerAdded) return;
  globalErrorListenerAdded = true;
  window.api.onWsError((id, msg) => {
    errorHandlers.get(id)?.forEach((handler) => handler(msg));
    globalErrorHandlers.forEach((handler) => handler(id, msg));
  });
};

/**
 * 지정한 ID에 핸들러를 추가합니다.
 */
const addHandler = <T>(map: HandlerMap<T>, id: string, handler: T): void => {
  const set = map.get(id) ?? new Set<T>();
  set.add(handler);
  map.set(id, set);
};

/**
 * 지정한 ID의 핸들러를 제거합니다.
 * handler가 주어지지 않으면 해당 ID의 모든 핸들러를 제거합니다.
 */
const removeHandler = <T>(map: HandlerMap<T>, id: string, handler?: T): void => {
  if (handler) {
    map.get(id)?.delete(handler);
  } else {
    map.delete(id);
  }
};

/**
 * 해당 ID의 모든 이벤트 핸들러를 제거합니다.
 */
const clearId = (id: string): void => {
  messageHandlers.delete(id);
  openHandlers.delete(id);
  closeHandlers.delete(id);
  errorHandlers.delete(id);
};

/**
 * WebSocket 연결을 메인 프로세스에 요청합니다.
 */
export const connect = (id: string, url: string, headers?: Record<string, string>): Promise<void> =>
  window.api.wsConnect(id, url, headers ?? {});

/**
 * WebSocket 연결을 종료합니다.
 */
export const disconnect = (id: string): Promise<void> => window.api.wsDisconnect(id);

/**
 * WebSocket 메시지를 전송합니다.
 */
export const send = (id: string, message: string): Promise<void> => window.api.wsSend(id, message);

// open 이벤트 핸들러 오버로드
export function onOpen(id: string, handler: OpenHandler): void;
export function onOpen(handler: GlobalOpenHandler): void;
export function onOpen(idOrHandler: string | GlobalOpenHandler, handler?: OpenHandler): void {
  ensureGlobalOpenListener();
  if (typeof idOrHandler === 'function') {
    globalOpenHandlers.add(idOrHandler);
    return;
  }
  addHandler(openHandlers, idOrHandler, handler as OpenHandler);
}

export function offOpen(id: string, handler?: OpenHandler): void;
export function offOpen(handler: GlobalOpenHandler): void;
export function offOpen(idOrHandler: string | GlobalOpenHandler, handler?: OpenHandler): void {
  if (typeof idOrHandler === 'function') {
    globalOpenHandlers.delete(idOrHandler);
    return;
  }
  removeHandler(openHandlers, idOrHandler, handler);
}

// message 이벤트 핸들러 오버로드
export function onMessage(id: string, handler: MessageHandler): void;
export function onMessage(handler: GlobalMessageHandler): void;
export function onMessage(idOrHandler: string | GlobalMessageHandler, handler?: MessageHandler): void {
  ensureGlobalMessageListener();
  if (typeof idOrHandler === 'function') {
    globalMessageHandlers.add(idOrHandler);
    return;
  }
  addHandler(messageHandlers, idOrHandler, handler as MessageHandler);
}

export function offMessage(id: string, handler?: MessageHandler): void;
export function offMessage(handler: GlobalMessageHandler): void;
export function offMessage(idOrHandler: string | GlobalMessageHandler, handler?: MessageHandler): void {
  if (typeof idOrHandler === 'function') {
    globalMessageHandlers.delete(idOrHandler);
    return;
  }
  removeHandler(messageHandlers, idOrHandler, handler);
}

// close 이벤트 핸들러 오버로드
export function onClose(id: string, handler: CloseHandler): void;
export function onClose(handler: GlobalCloseHandler): void;
export function onClose(idOrHandler: string | GlobalCloseHandler, handler?: CloseHandler): void {
  ensureGlobalCloseListener();
  if (typeof idOrHandler === 'function') {
    globalCloseHandlers.add(idOrHandler);
    return;
  }
  addHandler(closeHandlers, idOrHandler, handler as CloseHandler);
}

export function offClose(id: string, handler?: CloseHandler): void;
export function offClose(handler: GlobalCloseHandler): void;
export function offClose(idOrHandler: string | GlobalCloseHandler, handler?: CloseHandler): void {
  if (typeof idOrHandler === 'function') {
    globalCloseHandlers.delete(idOrHandler);
    return;
  }
  removeHandler(closeHandlers, idOrHandler, handler);
}

// error 이벤트 핸들러 오버로드
export function onError(id: string, handler: ErrorHandler): void;
export function onError(handler: GlobalErrorHandler): void;
export function onError(idOrHandler: string | GlobalErrorHandler, handler?: ErrorHandler): void {
  ensureGlobalErrorListener();
  if (typeof idOrHandler === 'function') {
    globalErrorHandlers.add(idOrHandler);
    return;
  }
  addHandler(errorHandlers, idOrHandler, handler as ErrorHandler);
}

export function offError(id: string, handler?: ErrorHandler): void;
export function offError(handler: GlobalErrorHandler): void;
export function offError(idOrHandler: string | GlobalErrorHandler, handler?: ErrorHandler): void {
  if (typeof idOrHandler === 'function') {
    globalErrorHandlers.delete(idOrHandler);
    return;
  }
  removeHandler(errorHandlers, idOrHandler, handler);
}

/**
 * 지정된 ID의 핸들러를 모두 제거하거나,
 * ID가 없으면 전역 및 ID별 핸들러를 모두 초기화합니다.
 */
export const offListeners = (id?: string): void => {
  if (id) {
    clearId(id);
  } else {
    messageHandlers.clear();
    globalMessageHandlers.clear();
    openHandlers.clear();
    globalOpenHandlers.clear();
    closeHandlers.clear();
    globalCloseHandlers.clear();
    errorHandlers.clear();
    globalErrorHandlers.clear();
  }
};

// 외부에서 사용하는 WebSocket 서비스 객체
export const WebSocketService = {
  connect,
  disconnect,
  send,
  onOpen,
  offOpen,
  onMessage,
  offMessage,
  onClose,
  offClose,
  onError,
  offError,
  offListeners,
};
