const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

function createWindow() {
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

  // Grant microphone permission automatically
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === "media" || permission === "microphone") {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === "media" || permission === "microphone") {
      return true;
    }
    return false;
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));

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
  if (process.platform !== "darwin") app.quit();
});
