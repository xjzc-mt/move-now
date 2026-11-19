(function () {
  'use strict';

  const rhythmButtons = document.querySelectorAll('#rhythmGroup [data-rhythm]');
  const customBox = document.getElementById('customDurationBox');
  const customWorkInput = document.getElementById('customWorkInput');
  const customBreakInput = document.getElementById('customBreakInput');
  const modeButtons = document.querySelectorAll('#modeGroup [data-mode]');
  const previewModeTitle = document.getElementById('previewModeTitle');
  const preAlertRow = document.getElementById('preAlertRow');
  const preAlertButtons = document.querySelectorAll('#preAlertGroup [data-pre-alert]');
  const strictnessButtons = document.querySelectorAll('#strictnessGroup [data-strictness]');
  const toggleRows = document.querySelectorAll('[data-toggle]');
  const previewBtn = document.getElementById('previewBtn');
  const quitBtn = document.getElementById('quitBtn');

  let latestSettings = null;

  function render(snapshot) {
    if (!snapshot || !snapshot.settings) return;
    const s = snapshot.settings;
    latestSettings = s;
    document.documentElement.setAttribute('data-theme', s.theme);

    rhythmButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-rhythm') === s.rhythmPreset);
    });
    customBox.classList.toggle('visible', s.rhythmPreset === 'custom');

    if (document.activeElement !== customWorkInput) {
      customWorkInput.value = s.customWorkMinutes;
    }
    if (document.activeElement !== customBreakInput) {
      customBreakInput.value = s.customBreakSeconds;
    }

    modeButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === s.reminderMode);
    });
    const preSec = s.preAlertSeconds || 15;
    previewModeTitle.textContent = preSec + 's 预告 + 全屏';
    preAlertRow.classList.toggle('visible', s.reminderMode === 'fullscreen_preview');
    preAlertButtons.forEach(function (btn) {
      btn.classList.toggle('active', Number(btn.getAttribute('data-pre-alert')) === preSec);
    });

    strictnessButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-strictness') === s.exitStrictness);
    });

    toggleRows.forEach(function (row) {
      const key = row.getAttribute('data-toggle');
      row.setAttribute('aria-checked', s[key] ? 'true' : 'false');
    });
  }

  rhythmButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('updateSettings', {
        rhythmPreset: btn.getAttribute('data-rhythm')
      });
    });
  });

  function commitCustomDurations() {
    window.MoveNowBridge.send('updateSettings', {
      customWorkMinutes: Number(customWorkInput.value),
      customBreakSeconds: Number(customBreakInput.value)
    });
  }

  customWorkInput.addEventListener('change', commitCustomDurations);
  customBreakInput.addEventListener('change', commitCustomDurations);

  modeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('updateSettings', {
        reminderMode: btn.getAttribute('data-mode')
      });
    });
  });

  preAlertButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('updateSettings', {
        preAlertSeconds: Number(btn.getAttribute('data-pre-alert'))
      });
    });
  });

  strictnessButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('updateSettings', {
        exitStrictness: btn.getAttribute('data-strictness')
      });
    });
  });

  toggleRows.forEach(function (row) {
    row.addEventListener('click', function () {
      const key = row.getAttribute('data-toggle');
      const current = latestSettings ? Boolean(latestSettings[key]) : row.getAttribute('aria-checked') === 'true';
      const patch = {};
      patch[key] = !current;
      window.MoveNowBridge.send('updateSettings', patch);
    });
  });

  previewBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('startPreview');
  });

  quitBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('quitApp');
  });

  window.MoveNowBridge.subscribe(render);
  window.MoveNowBridge.send('ready');
})();
