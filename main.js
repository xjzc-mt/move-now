const { app, BrowserWindow, Tray, Menu, ipcMain, screen, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Persistent Config File
const CONFIG_FILE = path.join(app.getPath('userData'), 'movenow_config.json');

let defaultConfig = {
  workDuration: 1800, // 30 minutes
  restDuration: 30,   // 30 seconds
  strictMode: true,
  soundFx: true,
  isPaused: false,
  character: 'whale' // whale, cat, capybara, etc.
};

let config = { ...defaultConfig };

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    config = { ...defaultConfig, ...JSON.parse(raw) };
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
let settingsWindow = null;
let overlayWindows = [];
let remainingWorkTime = config.workDuration;
let timerInterval = null;

// Create or Get Tray Icon
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
  // Fallback: minimal 16x16 transparent image
  return nativeImage.createEmpty();
}

// Format Seconds to MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Start Work Timer
function startWorkTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (config.isPaused || overlayWindows.length > 0) return;

    remainingWorkTime--;
    updateTrayMenu();

    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('timer-tick', { remainingWorkTime });
    }

    if (remainingWorkTime <= 0) {
      remainingWorkTime = config.workDuration;
      triggerBreak();
    }
  }, 1000);
}

// Trigger Fullscreen Screensaver Break
function triggerBreak() {
  if (overlayWindows.length > 0) return; // Already in break

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
      transparent: false,
      backgroundColor: '#070e1e',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setAlwaysOnTop(true, 'screen-saver', 1);

    if (config.strictMode) {
      win.setKiosk(true);
    }

    const query = `?restDuration=${config.restDuration}&strict=${config.strictMode}&sound=${config.soundFx}&isPrimary=${idx === 0}`;
    win.loadFile(path.join(__dirname, 'overlay', 'overlay.html'), { search: query });

    overlayWindows.push(win);
  });

  // Focus primary window
  if (overlayWindows[0]) {
    overlayWindows[0].focus();
  }
}

// Close Screensaver Break
function endBreak() {
  overlayWindows.forEach(win => {
    if (!win.isDestroyed()) {
      if (config.strictMode) {
        win.setKiosk(false);
      }
      win.close();
    }
  });
  overlayWindows = [];
  remainingWorkTime = config.workDuration;
  updateTrayMenu();
}

// Create Settings Window
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 620,
    height: 640,
    resizable: false,
    maximizable: false,
    title: 'MoveNow · 动一下',
    backgroundColor: '#0b1329',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html'));

  settingsWindow.webContents.on('did-finish-load', () => {
    settingsWindow.webContents.send('config-update', config);
    settingsWindow.webContents.send('timer-tick', { remainingWorkTime });
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// Update macOS Tray Menu
function updateTrayMenu() {
  if (!tray) return;

  const timeStr = formatTime(remainingWorkTime);
  const statusStr = config.isPaused ? '⏸️ (已暂停)' : `⏱️ ${timeStr}`;

  tray.setToolTip(`MoveNow (动一下): ${statusStr}`);
  if (process.platform === 'darwin') {
    const icon2x = path.join(__dirname, 'assets', 'tray-iconTemplate@2x.png');
    const hasIcon = fs.existsSync(icon2x);
    const whalePrefix = hasIcon ? '' : '🏃 ';
    tray.setTitle(config.isPaused ? ` ${whalePrefix}⏸` : ` ${whalePrefix}${Math.ceil(remainingWorkTime / 60)}m`);
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: `🏃 距离下次活动: ${timeStr} 后到`, enabled: false },
    { type: 'separator' },
    {
      label: '⚡ 立即全屏活动 (召唤角色/预览)',
      accelerator: 'CommandOrControl+Alt+R',
      click: () => triggerBreak()
    },
    {
      label: config.isPaused ? '▶️ 继续计时' : '⏸️ 暂停计时',
      click: () => {
        config.isPaused = !config.isPaused;
        saveConfig();
        updateTrayMenu();
        if (settingsWindow && !settingsWindow.isDestroyed()) {
          settingsWindow.webContents.send('config-update', config);
        }
      }
    },
    {
      label: '🔄 重置计时',
      click: () => {
        remainingWorkTime = config.workDuration;
        updateTrayMenu();
        if (settingsWindow && !settingsWindow.isDestroyed()) {
          settingsWindow.webContents.send('timer-tick', { remainingWorkTime });
        }
      }
    },
    { type: 'separator' },
    {
      label: '⏱️ 工作间隔',
      submenu: [
        { label: '⚡ 10 秒 (测试模式)', type: 'radio', checked: config.workDuration === 10, click: () => setWorkDuration(10) },
        { label: '20 分钟', type: 'radio', checked: config.workDuration === 1200, click: () => setWorkDuration(1200) },
        { label: '30 分钟 (推荐)', type: 'radio', checked: config.workDuration === 1800, click: () => setWorkDuration(1800) },
        { label: '45 分钟', type: 'radio', checked: config.workDuration === 2700, click: () => setWorkDuration(2700) },
        { label: '60 分钟', type: 'radio', checked: config.workDuration === 3600, click: () => setWorkDuration(3600) }
      ]
    },
    {
      label: '🛋️ 活动时长',
      submenu: [
        { label: '⚡ 10 秒 (测试模式)', type: 'radio', checked: config.restDuration === 10, click: () => setRestDuration(10) },
        { label: '20 秒 (微休息)', type: 'radio', checked: config.restDuration === 20, click: () => setRestDuration(20) },
        { label: '30 秒 (推荐)', type: 'radio', checked: config.restDuration === 30, click: () => setRestDuration(30) },
        { label: '1 分钟', type: 'radio', checked: config.restDuration === 60, click: () => setRestDuration(60) },
        { label: '2 分钟', type: 'radio', checked: config.restDuration === 120, click: () => setRestDuration(120) }
      ]
    },
    {
      label: '🛡️ 强制模式 (防秒关)',
      type: 'checkbox',
      checked: config.strictMode,
      click: (item) => {
        config.strictMode = item.checked;
        saveConfig();
        syncConfigToSettings();
      }
    },
    {
      label: '🔊 音效开启',
      type: 'checkbox',
      checked: config.soundFx,
      click: (item) => {
        config.soundFx = item.checked;
        saveConfig();
        syncConfigToSettings();
      }
    },
    { type: 'separator' },
    {
      label: '⚙️ 打开 MoveNow 控制台...',
      click: () => openSettingsWindow()
    },
    {
      label: '🚪 退出 MoveNow',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function setWorkDuration(seconds) {
  config.workDuration = seconds;
  remainingWorkTime = seconds;
  saveConfig();
  updateTrayMenu();
  syncConfigToSettings();
}

function setRestDuration(seconds) {
  config.restDuration = seconds;
  saveConfig();
  updateTrayMenu();
  syncConfigToSettings();
}

function syncConfigToSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send('config-update', config);
    settingsWindow.webContents.send('timer-tick', { remainingWorkTime });
  }
}

// IPC Handlers
ipcMain.on('rest-complete', () => {
  endBreak();
});

ipcMain.on('emergency-exit', () => {
  endBreak();
});

ipcMain.on('trigger-break-now', () => {
  triggerBreak();
});

ipcMain.on('toggle-pause', (_event, isPaused) => {
  config.isPaused = isPaused;
  saveConfig();
  updateTrayMenu();
});

ipcMain.on('reset-timer', () => {
  remainingWorkTime = config.workDuration;
  updateTrayMenu();
  syncConfigToSettings();
});

ipcMain.on('update-config', (_event, newConfig) => {
  const oldWork = config.workDuration;
  config = { ...config, ...newConfig };
  if (config.workDuration !== oldWork) {
    remainingWorkTime = config.workDuration;
  }
  saveConfig();
  updateTrayMenu();
});

// App Lifecycle
app.whenReady().then(() => {
  // Hide dock icon if desired, or keep as helper app
  // In macOS, if we want purely menu bar, app.dock.hide() can be used
  // But let's show dock icon or menubar cleanly
  
  const icon = getTrayIcon();
  tray = new Tray(icon);
  updateTrayMenu();

  // Register Global Shortcut
  globalShortcut.register('CommandOrControl+Alt+R', () => {
    triggerBreak();
  });

  // Start background timer
  startWorkTimer();

  // Show settings on initial launch so user sees the controls immediately
  openSettingsWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (timerInterval) clearInterval(timerInterval);
});

app.on('window-all-closed', (e) => {
  // Prevent quitting when windows close, app continues in tray
  e.preventDefault();
});
