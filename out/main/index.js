"use strict";
const electron = require("electron");
const WebSocket = require("ws");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  const wsClients = /* @__PURE__ */ new Map();
  const wsThrottles = /* @__PURE__ */ new Map();
  const WS_MESSAGE_THROTTLE_MS = 100;
  const clearWsThrottle = (id) => {
    const t = wsThrottles.get(id);
    if (t) {
      if (t.timer) clearTimeout(t.timer);
      wsThrottles.delete(id);
    }
  };
  const throttledSend = (sender, id, data, ms = WS_MESSAGE_THROTTLE_MS) => {
    const existing = wsThrottles.get(id);
    if (existing) {
      existing.lastData = data;
      return;
    }
    const state = { lastData: data, timer: null };
    wsThrottles.set(id, state);
    state.timer = setTimeout(() => {
      wsThrottles.delete(id);
      if (!sender.isDestroyed()) {
        sender.send("ws:message", id, state.lastData);
      }
    }, ms);
  };
  const closeWebSocket = async (ws, socketId) => {
    return new Promise((resolve) => {
      ws.removeAllListeners();
      const done = () => {
        clearWsThrottle(socketId);
        resolve();
      };
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        done();
        return;
      }
      ws.once("close", done);
      ws.on("error", () => {
      });
      try {
        ws.terminate();
      } catch {
        done();
      }
    });
  };
  electron.ipcMain.handle(
    "ws:connect",
    async (event, { id, url, headers }) => {
      const existing = wsClients.get(id);
      if (existing) {
        await closeWebSocket(existing, id);
        wsClients.delete(id);
      }
      const ws = new WebSocket(url, { headers });
      wsClients.set(id, ws);
      const sender = event.sender;
      ws.on("open", () => {
        if (!sender.isDestroyed()) sender.send("ws:open", id);
      });
      ws.on("message", (data) => throttledSend(sender, id, data.toString()));
      ws.on("error", (err) => {
        if (!sender.isDestroyed()) sender.send("ws:error", id, err.message);
      });
      ws.on("close", () => {
        wsClients.delete(id);
        clearWsThrottle(id);
        if (!sender.isDestroyed()) sender.send("ws:close", id);
      });
    }
  );
  electron.ipcMain.handle("ws:send", (_, { id, data }) => {
    const ws = wsClients.get(id);
    if (ws?.readyState === WebSocket.OPEN) ws.send(data);
  });
  electron.ipcMain.handle("ws:disconnect", async (_, id) => {
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
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
