const { app, BrowserWindow, Tray, Menu, screen, globalShortcut, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Simple persistent config
const CONFIG_FILE = path.join(app.getPath('userData'), 'movenow_config.json');
let config = {
  workDuration: 1800, // 30 minutes
  restDuration: 30,   // 30 seconds
  isPaused: false
};

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  }
} catch (e) {
  console.error('Failed to load config, using defaults:', e);
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

// App State
let tray = null;
let screensaverWindows = [];
let remainingWorkTime = config.workDuration;
let timer = null;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getTrayIcon() {
  const icon2x = path.join(__dirname, 'assets', 'tray-iconTemplate@2x.png');
  const icon1x = path.join(__dirname, 'assets', 'tray-iconTemplate.png');
  if (fs.existsSync(icon2x)) {
    const img = nativeImage.createFromPath(icon2x);
    img.setTemplateImage(true);
    return img;
  } else if (fs.existsSync(icon1x)) {
    const img = nativeImage.createFromPath(icon1x);
    img.setTemplateImage(true);
    return img;
  }
  return nativeImage.createEmpty();
}

function updateTray() {
  if (!tray) return;

  const timeStr = formatTime(remainingWorkTime);
  const title = config.isPaused ? ' ⏸' : ` ${Math.ceil(remainingWorkTime / 60)}m`;
  tray.setTitle(title);
  tray.setToolTip(`MoveNow: ${config.isPaused ? '已暂停' : `下次活动在 ${timeStr}`}`);

  const menu = Menu.buildFromTemplate([
    {
      label: `🏃 距离下次活动: ${timeStr}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: '⚡ 立即动一下 (演示/屏保)',
      accelerator: 'CommandOrControl+Alt+R',
      click: () => showScreensaver()
    },
    {
      label: config.isPaused ? '▶️ 继续计时' : '⏸️ 暂停计时',
      click: () => {
        config.isPaused = !config.isPaused;
        saveConfig();
        updateTray();
      }
    },
    {
      label: '🔄 重新计时',
      click: () => {
        remainingWorkTime = config.workDuration;
        updateTray();
      }
    },
    { type: 'separator' },
    {
      label: '⏱️ 工作间隔',
      submenu: [
        { label: '⚡ 10 秒 (测试模式)', type: 'radio', checked: config.workDuration === 10, click: () => setWorkTime(10) },
        { label: '20 分钟', type: 'radio', checked: config.workDuration === 1200, click: () => setWorkTime(1200) },
        { label: '30 分钟 (推荐)', type: 'radio', checked: config.workDuration === 1800, click: () => setWorkTime(1800) },
        { label: '45 分钟', type: 'radio', checked: config.workDuration === 2700, click: () => setWorkTime(2700) },
        { label: '60 分钟', type: 'radio', checked: config.workDuration === 3600, click: () => setWorkTime(3600) }
      ]
    },
    {
      label: '🛋️ 休息时长',
      submenu: [
        { label: '⚡ 10 秒 (测试模式)', type: 'radio', checked: config.restDuration === 10, click: () => setRestTime(10) },
        { label: '20 秒', type: 'radio', checked: config.restDuration === 20, click: () => setRestTime(20) },
        { label: '30 秒 (推荐)', type: 'radio', checked: config.restDuration === 30, click: () => setRestTime(30) },
        { label: '1 分钟', type: 'radio', checked: config.restDuration === 60, click: () => setRestTime(60) }
      ]
    },
    { type: 'separator' },
    {
      label: '🚪 退出 MoveNow',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
}

function setWorkTime(sec) {
  config.workDuration = sec;
  remainingWorkTime = sec;
  saveConfig();
  updateTray();
}

function setRestTime(sec) {
  config.restDuration = sec;
  saveConfig();
  updateTray();
}

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (config.isPaused || screensaverWindows.length > 0) return;

    remainingWorkTime--;
    updateTray();

    if (remainingWorkTime <= 0) {
      remainingWorkTime = config.workDuration;
      showScreensaver();
    }
  }, 1000);
}

function showScreensaver() {
  if (screensaverWindows.length > 0) return;

  const displays = screen.getAllDisplays();

  displays.forEach((disp, idx) => {
    const win = new BrowserWindow({
      x: disp.bounds.x,
      y: disp.bounds.y,
      width: disp.bounds.width,
      height: disp.bounds.height,
      frame: false,
      fullscreen: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#0a0f1d',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver', 1);

    const query = `?duration=${config.restDuration}&isPrimary=${idx === 0}`;
    win.loadFile(path.join(__dirname, 'screensaver', 'index.html'), { search: query });

    screensaverWindows.push(win);
  });

  if (screensaverWindows[0]) {
    screensaverWindows[0].focus();
  }
}

function closeScreensaver() {
  screensaverWindows.forEach(win => {
    if (!win.isDestroyed()) {
      win.close();
    }
  });
  screensaverWindows = [];
  remainingWorkTime = config.workDuration;
  updateTray();
}

ipcMain.on('close-screensaver', () => {
  closeScreensaver();
});

app.whenReady().then(() => {
  // Pure menu bar app on macOS (no dock icon clutter)
  if (app.dock) {
    app.dock.hide();
  }

  tray = new Tray(getTrayIcon());
  updateTray();

  globalShortcut.register('CommandOrControl+Alt+R', () => {
    showScreensaver();
  });

  startTimer();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (timer) clearInterval(timer);
});

app.on('window-all-closed', (e) => {
  // Keep alive in tray
  e.preventDefault();
});
