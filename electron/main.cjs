const { app, BrowserWindow, shell, session } = require("electron");
const http = require("http");
const path = require("path");
const handler = require("serve-handler");

let server;
const PORT = 45231;

function startServer() {
  return new Promise((resolve) => {
    const distPath = path.join(__dirname, "../dist");
    server = http.createServer((req, res) => {
      handler(req, res, { public: distPath });
    });
    server.listen(PORT, "127.0.0.1", () => resolve());
  });
}

async function createWindow() {
  await startServer();

  // Grant microphone and media permissions
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media" || permission === "microphone" || permission === "audioCapture") {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === "media" || permission === "microphone" || permission === "audioCapture") {
      return true;
    }
    return false;
  });

  const win = new BrowserWindow({
    width: 1100,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: "Pakistan Meeting Minutes Assistant",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  // Load over localhost so Web Speech API works
  win.loadURL(`http://127.0.0.1:${PORT}`);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});
