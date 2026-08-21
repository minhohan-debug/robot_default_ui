/**
 * Electron 메인 프로세스 진입점
 *
 * - 애플리케이션 윈도우 생성
 * - 렌더러 프로세스와의 WebSocket 연결/메시지 중계 (IPC)
 * - Electron 앱 라이프사이클 관리
 */
import { app, shell, BrowserWindow, ipcMain } from 'electron';
import WebSocket from 'ws';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

/**
 * 메인 윈도우를 생성하고 개발/운영 환경에 맞는 진입 URL을 로드합니다.
 */
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// Electron 초기화가 끝난 후 브라우저 윈도우를 생성하고 WebSocket IPC 핸들러를 등록합니다
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on('ping', () => console.log('pong'));

  const wsClients = new Map<string, WebSocket>();
  const wsThrottles = new Map<string, { lastData: string; timer: ReturnType<typeof setTimeout> | null }>();
  const WS_MESSAGE_THROTTLE_MS = 100;

  /**
   * 지정된 ID의 WebSocket 메시지 throttle 타이머를 정리합니다.
   * @param id WebSocket 소켓 식별자
   */
  const clearWsThrottle = (id: string): void => {
    const t = wsThrottles.get(id);
    if (t) {
      if (t.timer) clearTimeout(t.timer);
      wsThrottles.delete(id);
    }
  };

  /**
   * WebSocket 메시지를 일정 시간(ms)마다 한 번씩 렌더러 프로세스로 전송합니다.
   * 연속된 메시지가 들어오면 타이머가 끝날 때 가장 최신 데이터만 전송합니다.
   * @param sender 렌더러 프로세스 WebContents
   * @param id WebSocket 소켓 식별자
   * @param data 전송할 데이터
   * @param ms throttle 간격(밀리초)
   */
  const throttledSend = (sender: Electron.WebContents, id: string, data: string, ms = WS_MESSAGE_THROTTLE_MS): void => {
    const existing = wsThrottles.get(id);
    if (existing) {
      existing.lastData = data;
      return;
    }
    const state = { lastData: data, timer: null as ReturnType<typeof setTimeout> | null };
    wsThrottles.set(id, state);
    state.timer = setTimeout(() => {
      wsThrottles.delete(id);
      if (!sender.isDestroyed()) {
        sender.send('ws:message', id, state.lastData);
      }
    }, ms);
  };

  /**
   * WebSocket 연결을 안전하게 종료합니다.
   * 이미 닫히고 있거나 닫힌 상태면 바로 완료하고, 그렇지 않으면 terminate 후 정리합니다.
   * @param ws 종료할 WebSocket 인스턴스
   * @param socketId 소켓 식별자
   */
  const closeWebSocket = async (ws: WebSocket, socketId: string): Promise<void> => {
    return new Promise((resolve) => {
      ws.removeAllListeners();
      const done = (): void => {
        clearWsThrottle(socketId);
        resolve();
      };
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        done();
        return;
      }
      ws.once('close', done);
      ws.on('error', () => {
        /* ignore post-close errors */
      });
      try {
        ws.terminate();
      } catch {
        done();
      }
    });
  };

  /**
   * 렌더러에서 WebSocket 연결을 요청하면 지정된 URL로 연결하고,
   * open/message/error/close 이벤트를 렌더러로 전달합니다.
   */
  ipcMain.handle(
    'ws:connect',
    async (event, { id, url, headers }: { id: string; url: string; headers: Record<string, string> }) => {
      const existing = wsClients.get(id);
      if (existing) {
        await closeWebSocket(existing, id);
        wsClients.delete(id);
      }
      const ws = new WebSocket(url, { headers });
      wsClients.set(id, ws);
      const sender = event.sender;
      ws.on('open', () => {
        if (!sender.isDestroyed()) sender.send('ws:open', id);
      });
      ws.on('message', (data) => throttledSend(sender, id, data.toString()));
      ws.on('error', (err) => {
        if (!sender.isDestroyed()) sender.send('ws:error', id, err.message);
      });
      ws.on('close', () => {
        wsClients.delete(id);
        clearWsThrottle(id);
        if (!sender.isDestroyed()) sender.send('ws:close', id);
      });
    },
  );

  /**
   * 렌더러에서 WebSocket 메시지 전송을 요청하면 열려 있는 연결로 데이터를 전송합니다.
   */
  ipcMain.handle('ws:send', (_, { id, data }: { id: string; data: string }) => {
    const ws = wsClients.get(id);
    if (ws?.readyState === WebSocket.OPEN) ws.send(data);
  });

  /**
   * 지정한 ID의 WebSocket 연결을 종료하거나, ID가 없으면 모든 연결을 종료합니다.
   */
  ipcMain.handle('ws:disconnect', async (_, id?: string) => {
    if (id) {
      const ws = wsClients.get(id);
      if (ws) {
        await closeWebSocket(ws, id);
        wsClients.delete(id);
      }
    } else {
      const entries = Array.from(wsClients.entries());
      wsClients.clear();
      await Promise.all(entries.map(([socketId, ws]) => closeWebSocket(ws, socketId)));
    }
  });

  createWindow();

  // macOS에서 독(dock) 아이콘 클릭 시 열린 윈도우가 없으면 새 윈도우를 만듭니다
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
// 모든 윈도우가 닫히면 macOS를 제외하고 앱을 종료합니다
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
