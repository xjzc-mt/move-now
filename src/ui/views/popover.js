(function () {
  'use strict';

  const popShell = document.getElementById('popShell');
  const stageEl = document.getElementById('popoverStage');
  const statusLine = document.getElementById('statusLine');
  const summaryLine = document.getElementById('summaryLine');
  const statusBadge = document.getElementById('statusBadge');
  const rhythmProgressFill = document.getElementById('rhythmProgressFill');
  const rhythmLabel = document.getElementById('rhythmLabel');
  const rhythmActions = document.getElementById('rhythmActions');
  const extendCycleBtn = document.getElementById('extendCycleBtn');
  const resetCycleBtn = document.getElementById('resetCycleBtn');
  const restNowBtn = document.getElementById('restNowBtn');
  const dndToggleBtn = document.getElementById('dndToggleBtn');
  const dndSub = document.getElementById('dndSub');
  const dndPresets = document.getElementById('dndPresets');
  const dndPillButtons = document.querySelectorAll('[data-dnd-preset]');
  const openPrefsBtn = document.getElementById('openPrefsBtn');
  const themeButtons = document.querySelectorAll('[data-theme-choice]');
  const natureSubBar = document.getElementById('natureSubBar');
  const naturePillButtons = document.querySelectorAll('[data-nature-style]');

  const stage = window.MoveNowThemeStage.mount(stageEl, { showBreathLabel: false });
  let lastReportedHeight = 0;

  function syncPopoverHeight() {
    requestAnimationFrame(function () {
      const h = Math.ceil(popShell.getBoundingClientRect().height);
      if (h > 200 && h !== lastReportedHeight) {
        lastReportedHeight = h;
        window.MoveNowBridge.send('resizePopover', { height: h });
      }
    });
  }

  function render(snapshot) {
    if (!snapshot) return;
    const settings = snapshot.settings;

    stage.setState({
      theme: settings.theme,
      natureStyle: settings.natureStyle === 'auto' ? (snapshot.activeNatureStyle || 'sunlight') : settings.natureStyle,
      mood: snapshot.mood,
      pose: 'calm',
      easterEgg: null
    });

    if (snapshot.popoverCopy) {
      statusLine.textContent = snapshot.popoverCopy.statusLine;
      summaryLine.textContent = snapshot.popoverCopy.summaryLine;
      rhythmLabel.textContent = snapshot.popoverCopy.rhythmLine || '';
    }

    // Smooth minute-level progress bar (no ticking seconds)
    const pct = snapshot.dndActive
      ? 0
      : Math.max(0, Math.min(100, (snapshot.cycleProgress || 0) * 100));
    rhythmProgressFill.style.width = pct.toFixed(1) + '%';
    rhythmActions.hidden = Boolean(snapshot.dndActive || snapshot.phase === 'resting');

    // DND status & expandable duration presets
    if (snapshot.dndActive) {
      if (snapshot.dndUntilTomorrow) {
        statusBadge.textContent = '今日免打扰';
        dndSub.textContent = '今天已暂停，明天自动恢复';
      } else {
        const mins = Math.max(1, Math.ceil(snapshot.dndRemainingSec / 60));
        statusBadge.textContent = '免打扰 · ' + mins + 'm';
        dndSub.textContent = '余 ' + mins + ' 分钟后自动恢复';
      }
      statusBadge.classList.add('visible');
      dndToggleBtn.setAttribute('aria-checked', 'true');
      dndPresets.hidden = false;
    } else if (snapshot.avoiding) {
      statusBadge.textContent = '已静默避让';
      statusBadge.classList.add('visible');
      dndToggleBtn.setAttribute('aria-checked', 'false');
      dndSub.textContent = '暂停全部提醒';
      dndPresets.hidden = true;
    } else {
      statusBadge.classList.remove('visible');
      dndToggleBtn.setAttribute('aria-checked', 'false');
      dndSub.textContent = '暂停全部提醒';
      dndPresets.hidden = true;
    }

    const activePreset = snapshot.dndSelectedPreset || '60';
    dndPillButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-dnd-preset') === activePreset);
    });

    themeButtons.forEach(function (btn) {
      const choice = btn.getAttribute('data-theme-choice');
      const active = choice === settings.theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    const isNature = settings.theme === 'nature_window';
    natureSubBar.hidden = !isNature;
    const activeStyle = settings.natureStyle || 'auto';
    naturePillButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-nature-style') === activeStyle);
    });

    syncPopoverHeight();
  }

  extendCycleBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('extendCycle', { minutes: 15 });
  });

  resetCycleBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('resetCycle');
  });

  restNowBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('startBreakNow');
  });

  dndToggleBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('toggleDnd');
  });

  dndPillButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('setDndDuration', {
        preset: btn.getAttribute('data-dnd-preset')
      });
    });
  });

  openPrefsBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('openPreferences');
  });

  themeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const choice = btn.getAttribute('data-theme-choice');
      window.MoveNowBridge.send('updateSettings', { theme: choice });
    });
  });

  naturePillButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('updateSettings', {
        natureStyle: btn.getAttribute('data-nature-style')
      });
    });
  });

  window.MoveNowBridge.subscribe(render);
  window.MoveNowBridge.send('ready');
})();
