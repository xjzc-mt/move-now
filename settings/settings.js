// Settings Window Controller

const liveCountdown = document.getElementById('liveCountdown');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const previewNowBtn = document.getElementById('previewNowBtn');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const pauseIcon = document.getElementById('pauseIcon');
const pauseText = document.getElementById('pauseText');
const resetBtn = document.getElementById('resetBtn');

const workDurationBtns = document.querySelectorAll('#workDurationSelect .segment-btn');
const restDurationBtns = document.querySelectorAll('#restDurationSelect .segment-btn');
const strictModeToggle = document.getElementById('strictModeToggle');
const soundFxToggle = document.getElementById('soundFxToggle');

let currentConfig = {
  workDuration: 1800, // 30 mins
  restDuration: 30,   // 30 secs
  strictMode: true,
  soundFx: true,
  isPaused: false
};

// Update segmented button groups
function setupSegmentedGroup(buttons, onSelect) {
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = parseInt(btn.getAttribute('data-val'), 10);
      onSelect(val);
    });
  });
}

function setActiveButton(buttons, val) {
  buttons.forEach(btn => {
    if (parseInt(btn.getAttribute('data-val'), 10) === val) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Work duration selection
setupSegmentedGroup(workDurationBtns, (val) => {
  currentConfig.workDuration = val;
  saveAndSyncConfig();
});

// Rest duration selection
setupSegmentedGroup(restDurationBtns, (val) => {
  currentConfig.restDuration = val;
  saveAndSyncConfig();
});

// Toggles
strictModeToggle.addEventListener('change', () => {
  currentConfig.strictMode = strictModeToggle.checked;
  saveAndSyncConfig();
});

soundFxToggle.addEventListener('change', () => {
  currentConfig.soundFx = soundFxToggle.checked;
  saveAndSyncConfig();
});

// Buttons
previewNowBtn.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.triggerBreakNow();
  }
});

pauseResumeBtn.addEventListener('click', () => {
  currentConfig.isPaused = !currentConfig.isPaused;
  updatePauseUI();
  if (window.electronAPI) {
    window.electronAPI.togglePause(currentConfig.isPaused);
  }
});

resetBtn.addEventListener('click', () => {
  if (window.electronAPI) {
    window.electronAPI.resetTimer();
  }
});

function updatePauseUI() {
  if (currentConfig.isPaused) {
    statusBadge.classList.add('paused');
    statusText.textContent = '已暂停';
    pauseIcon.textContent = '▶️';
    pauseText.textContent = '继续计时';
  } else {
    statusBadge.classList.remove('paused');
    statusText.textContent = '计时中';
    pauseIcon.textContent = '⏸️';
    pauseText.textContent = '暂停计时';
  }
}

function saveAndSyncConfig() {
  if (window.electronAPI) {
    window.electronAPI.updateConfig(currentConfig);
  }
}

// IPC listener for live timer updates from main process
if (window.electronAPI) {
  window.electronAPI.onTimerTick((data) => {
    const mins = Math.floor(data.remainingWorkTime / 60);
    const secs = data.remainingWorkTime % 60;
    liveCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  window.electronAPI.onConfigUpdate((config) => {
    currentConfig = { ...currentConfig, ...config };
    setActiveButton(workDurationBtns, currentConfig.workDuration);
    setActiveButton(restDurationBtns, currentConfig.restDuration);
    strictModeToggle.checked = currentConfig.strictMode;
    soundFxToggle.checked = currentConfig.soundFx;
    updatePauseUI();
  });
}
