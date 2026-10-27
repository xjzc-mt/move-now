const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  restComplete: () => ipcRenderer.send('rest-complete'),
  emergencyExit: () => ipcRenderer.send('emergency-exit'),
  triggerBreakNow: () => ipcRenderer.send('trigger-break-now'),
  togglePause: (paused) => ipcRenderer.send('toggle-pause', paused),
  resetTimer: () => ipcRenderer.send('reset-timer'),
  updateConfig: (config) => ipcRenderer.send('update-config', config),
  onTimerTick: (callback) => {
    ipcRenderer.on('timer-tick', (_event, data) => callback(data));
  },
  onConfigUpdate: (callback) => {
    ipcRenderer.on('config-update', (_event, config) => callback(config));
  }
});
