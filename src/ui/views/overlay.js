(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const surfaceRole = params.get('role') || 'auto'; // 'auto' | 'pre_alert' | 'fullscreen' | 'secondary' | 'corner_card' | 'edge_frame' | 'edge_pill' | 'toast'

  const surfaces = {
    pre_alert: document.getElementById('surfacePreAlert'),
    fullscreen: document.getElementById('surfaceFullscreen'),
    secondary: document.getElementById('surfaceSecondaryVeil'),
    corner_card: document.getElementById('surfaceCornerCard'),
    edge_frame: document.getElementById('surfaceEdgeFrame'),
    edge_pill: document.getElementById('surfaceEdgePill'),
    toast: document.getElementById('surfaceToast')
  };

  // Lazy-mount animated ThemeStages only when needed
  let fsStage = null;
  let cornerStage = null;
  let guardianStage = null;
  function ensureFsStage() {
    if (!fsStage) {
      fsStage = window.MoveNowThemeStage.mount(document.getElementById('fsStage'), { showBreathLabel: false });
    }
    return fsStage;
  }
  function ensureCornerStage() {
    if (!cornerStage) {
      cornerStage = window.MoveNowThemeStage.mount(document.getElementById('cornerStage'), { showBreathLabel: false });
    }
    return cornerStage;
  }
  function ensureGuardianStage() {
    if (!guardianStage) {
      guardianStage = window.MoveNowThemeStage.mount(document.getElementById('guardianStage'), { showBreathLabel: false });
    }
    return guardianStage;
  }

  // Lazy-mount full-bleed optical physics canvas (for nature_window & all Stage-2 sealed backdrops)
  let opticalEngine = null;
  let opticalCanvasEl = null;
  let opticalRafId = null;
  let opticalActive = false;
  const fsNatureBreath = document.getElementById('fsNatureBreath');

  function ensureOpticalEngine(canvasId) {
    if (!opticalEngine && window.MoveNowNatureOptics) {
      opticalCanvasEl = document.getElementById(canvasId);
      if (opticalCanvasEl) {
        opticalEngine = window.MoveNowNatureOptics.createCanvas(opticalCanvasEl, { compact: false, mode: 'bokeh' });
      }
    }
    return opticalEngine;
  }

  function startOpticalLoop() {
    if (opticalRafId !== null) return;
    function step(now) {
      if (opticalActive && opticalEngine && !document.hidden) {
        opticalEngine.update(now);
      }
      if (!fsNatureBreath.hidden) {
        const cycle = (now / 1000) % 10;
        fsNatureBreath.textContent = cycle < 4 ? '吸气' : '呼气';
        const level = cycle < 4
          ? 0.5 - 0.5 * Math.cos(Math.PI * (cycle / 4))
          : 0.5 + 0.5 * Math.cos(Math.PI * ((cycle - 4) / 6));
        fsNatureBreath.style.opacity = (0.45 + level * 0.4).toFixed(2);
      }
      opticalRafId = window.requestAnimationFrame(step);
    }
    opticalRafId = window.requestAnimationFrame(step);
  }

  const preAlertText = document.getElementById('preAlertText');
  const preAlertProgress = document.getElementById('preAlertProgress');
  const fsStageEl = document.getElementById('fsStage');
  const fsMessage = document.getElementById('fsMessage');
  const fsProgressRing = document.getElementById('fsProgressRing');
  const fsSeconds = document.getElementById('fsSeconds');
  const fsRingFg = document.getElementById('fsRingFg');
  const fsEscapeNote = document.getElementById('fsEscapeNote');
  const fsSnoozeBtn = document.getElementById('fsSnoozeBtn');

  const sealedMessageEl = document.getElementById('sealedMessage');
  const sealedWakeHintEl = document.getElementById('sealedWakeHint');
  const guardianStageEl = document.getElementById('guardianStage');

  const cornerMessage = document.getElementById('cornerMessage');
  const cornerHint = document.getElementById('cornerHint');
  const cornerTimer = document.getElementById('cornerTimer');
  const cornerProgress = document.getElementById('cornerProgress');
  const cornerSkipBtn = document.getElementById('cornerSkipBtn');
  const cornerSnoozeBtn = document.getElementById('cornerSnoozeBtn');

  const edgeMessage = document.getElementById('edgeMessage');
  const edgeHint = document.getElementById('edgeHint');
  const edgeTimer = document.getElementById('edgeTimer');
  const edgeSnoozeBtn = document.getElementById('edgeSnoozeBtn');

  const toastText = document.getElementById('toastText');

  const RING_CIRCUMFERENCE = 2 * Math.PI * 18; // ~113.1
  let currentPhase = 'working';
  let currentTheme = 'geometric';
  let currentDisplayedFsMessage = '';
  let currentDisplayedSealedMessage = '';
  let swapTimer = null;
  let sealedSwapTimer = null;

  function setSmoothText(el, nextText, getCurr, setCurr, getTimer, setTimer) {
    if (nextText === getCurr()) return;
    if (!getCurr()) {
      setCurr(nextText);
      el.textContent = nextText;
      return;
    }
    setCurr(nextText);
    if (getTimer()) {
      clearTimeout(getTimer());
      setTimer(null);
    }
    el.classList.add('swapping');
    setTimer(setTimeout(function () {
      el.textContent = getCurr();
      el.classList.remove('swapping');
      setTimer(null);
    }, 280));
  }

  function formatDuration(sec) {
    const s = Math.max(0, Math.ceil(sec));
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m + ':' + String(rem).padStart(2, '0');
  }

  function resolveActiveSurface(snapshot) {
    if (surfaceRole !== 'auto') return surfaceRole;
    if (snapshot.toastMessage) return 'toast';
    if (snapshot.phase === 'pre_alert') return 'pre_alert';
    if (snapshot.phase === 'resting' || snapshot.phase === 'sealed') {
      if (snapshot.presentationMode === 'corner_card') return 'corner_card';
      if (snapshot.presentationMode === 'edge_glow') return 'edge_pill';
      return 'fullscreen';
    }
    return null;
  }

  function showOnly(targetKey) {
    Object.keys(surfaces).forEach(function (key) {
      const el = surfaces[key];
      const show = key === targetKey;
      el.hidden = !show;
      if (show && (key === 'fullscreen' || key === 'secondary')) {
        el.classList.remove('fading-out');
        el.classList.add('visible');
      }
    });
  }

  window.__moveNowPrepareFadeOut = function () {
    surfaces.fullscreen.classList.add('fading-out');
    surfaces.secondary.classList.add('fading-out');
  };

  window.__moveNowStartThaw = function () {
    surfaces.fullscreen.classList.add('fading-out');
    surfaces.secondary.classList.add('fading-out');
    if (guardianStage && currentPhase === 'sealed') {
      if (currentTheme === 'geometric') {
        guardianStage.setState({ theme: 'geometric', pose: 'guardian_wake', mood: 'refreshed' });
      } else if (currentTheme === 'sketch') {
        guardianStage.setState({ theme: 'sketch', pose: 'stretch_up', mood: 'refreshed' });
      }
    }
    if (opticalEngine) {
      opticalEngine.startThaw();
    }
  };

  function resolveActionText(action, snapshot, ratio) {
    if (
      action &&
      action.followup &&
      snapshot.breakDurationSec >= 25 &&
      ratio <= 0.48
    ) {
      return action.followup;
    }
    return (action && action.message) || '松肩，深呼吸。';
  }

  function syncFullBleedOptics(canvasId, snapshot) {
    const isSealed = snapshot.phase === 'sealed';
    const isNature = snapshot.settings.theme === 'nature_window';
    const needOptics = isSealed || isNature;

    const eng = needOptics ? ensureOpticalEngine(canvasId) : opticalEngine;
    if (needOptics && eng && opticalCanvasEl) {
      opticalActive = true;
      opticalCanvasEl.classList.add('active');
      const mode = isSealed
        ? (snapshot.sealedStyle || 'warm_matte')
        : (snapshot.activeNatureStyle || 'bokeh');
      eng.setMode(mode, {
        deepSeal: isSealed,
        easterEgg: snapshot.activeAction ? snapshot.activeAction.easterEgg : null,
        mood: snapshot.mood
      });
      startOpticalLoop();
    } else if (opticalCanvasEl) {
      opticalActive = false;
      opticalCanvasEl.classList.remove('active');
    }
  }

  function render(snapshot) {
    if (!snapshot || !snapshot.settings) return;
    currentPhase = snapshot.phase;
    currentTheme = snapshot.settings.theme;
    document.documentElement.setAttribute('data-theme', currentTheme);

    const active = resolveActiveSurface(snapshot);
    showOnly(active);

    if (active === 'pre_alert') {
      preAlertText.textContent = snapshot.preAlertMessage || '';
      const totalPre = (snapshot.settings && snapshot.settings.preAlertSeconds) || 15;
      const pct = Math.max(0, Math.min(100, (snapshot.preAlertRemainingSec / totalPre) * 100));
      preAlertProgress.style.width = pct.toFixed(1) + '%';
      return;
    }

    if (active === 'toast') {
      toastText.textContent = snapshot.toastMessage || '';
      return;
    }

    if (active === 'secondary') {
      syncFullBleedOptics('secOpticalCanvas', snapshot);
      return;
    }

    const action = snapshot.activeAction || { pose: 'calm', message: '松肩，深呼吸。', followup: null, easterEgg: null };
    const ratio = snapshot.breakDurationSec > 0
      ? Math.max(0, Math.min(1, snapshot.breakRemainingSec / snapshot.breakDurationSec))
      : 0;
    const activeCopy = resolveActionText(action, snapshot, ratio);

    if (active === 'fullscreen') {
      const isSealed = snapshot.phase === 'sealed';
      const isNature = currentTheme === 'nature_window';

      surfaces.fullscreen.classList.toggle('sealed', isSealed);
      syncFullBleedOptics('fsOpticalCanvas', snapshot);

      if (isSealed) {
        const msg = snapshot.sealedMessage || '桌面已暂时封存，后台仍在安稳运行。';
        setSmoothText(
          sealedMessageEl,
          msg,
          function () { return currentDisplayedSealedMessage; },
          function (v) { currentDisplayedSealedMessage = v; },
          function () { return sealedSwapTimer; },
          function (v) { sealedSwapTimer = v; }
        );
        sealedWakeHintEl.textContent = snapshot.sealedWakeHint || '轻触键鼠或任意键返回桌面';

        // Theme-exclusive guardian companion (Geometric sits & breathes; Sketch naps with cup; Nature has no character)
        if (currentTheme === 'geometric' || currentTheme === 'sketch') {
          guardianStageEl.hidden = false;
          ensureGuardianStage().setState({
            theme: currentTheme,
            pose: currentTheme === 'geometric' ? 'guardian' : 'nap_guard',
            mood: 'calm',
            easterEgg: null
          });
        } else {
          guardianStageEl.hidden = true;
        }
        return;
      }

      guardianStageEl.hidden = true;
      currentDisplayedSealedMessage = '';

      if (isNature) {
        fsStageEl.hidden = true;
        fsNatureBreath.hidden = false;
      } else {
        fsStageEl.hidden = false;
        fsNatureBreath.hidden = true;
        ensureFsStage().setState({
          theme: currentTheme,
          natureStyle: snapshot.activeNatureStyle,
          pose: action.pose,
          mood: 'calm',
          easterEgg: action.easterEgg
        });
      }

      fsSnoozeBtn.hidden = false;
      setSmoothText(
        fsMessage,
        activeCopy,
        function () { return currentDisplayedFsMessage; },
        function (v) { currentDisplayedFsMessage = v; },
        function () { return swapTimer; },
        function (v) { swapTimer = v; }
      );
      fsSeconds.textContent = String(Math.max(0, Math.ceil(snapshot.breakRemainingSec)));
      fsRingFg.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - ratio));
      fsProgressRing.classList.toggle('paused', Boolean(snapshot.handsOffPaused));

      if (snapshot.escHint) {
        fsEscapeNote.textContent = snapshot.escHint;
        fsEscapeNote.classList.add('highlighted');
        fsEscapeNote.classList.remove('hands-off');
      } else if (snapshot.handsOffHint) {
        fsEscapeNote.textContent = snapshot.handsOffHint;
        fsEscapeNote.classList.remove('highlighted');
        fsEscapeNote.classList.add('hands-off');
      } else {
        fsEscapeNote.classList.remove('highlighted', 'hands-off');
        if (snapshot.isPreview) {
          fsEscapeNote.textContent = '预览模式 · 按 ESC 随时退出';
        } else if (snapshot.settings.exitStrictness === 'strict') {
          fsEscapeNote.textContent = '当前为严格模式 · 不可按 ESC 跳过';
        } else if (snapshot.settings.exitStrictness === 'relaxed') {
          fsEscapeNote.textContent = '按 ESC 可跳过本次休息';
        } else {
          fsEscapeNote.textContent = '双击 ESC 可跳过本次休息';
        }
      }
      return;
    }

    if (active === 'corner_card') {
      ensureCornerStage().setState({
        theme: currentTheme,
        natureStyle: snapshot.activeNatureStyle,
        pose: action.pose,
        mood: 'calm',
        easterEgg: action.easterEgg
      });
      cornerMessage.textContent = activeCopy;
      cornerTimer.textContent = formatDuration(snapshot.breakRemainingSec);
      cornerProgress.style.width = (ratio * 100).toFixed(1) + '%';

      const hint = snapshot.handsOffHint || snapshot.escHint || '';
      cornerHint.textContent = hint;
      cornerHint.hidden = !hint;
      cornerSkipBtn.hidden = snapshot.settings.exitStrictness === 'strict' && !snapshot.isPreview;
      return;
    }

    if (active === 'edge_pill') {
      edgeMessage.textContent = activeCopy;
      edgeTimer.textContent = formatDuration(snapshot.breakRemainingSec);
      const hint = snapshot.handsOffHint || snapshot.escHint || '';
      edgeHint.textContent = hint;
      edgeHint.hidden = !hint;
    }
  }

  function bindSnoozeHover(btn) {
    btn.addEventListener('mouseenter', function () {
      window.MoveNowBridge.send('hoverSnooze', { hovering: true });
    });
    btn.addEventListener('mouseleave', function () {
      window.MoveNowBridge.send('hoverSnooze', { hovering: false });
    });
    btn.addEventListener('click', function () {
      window.MoveNowBridge.send('snooze');
    });
  }

  document.getElementById('preRestNowBtn').addEventListener('click', function () {
    window.MoveNowBridge.send('startBreakNow');
  });
  document.getElementById('preSnoozeBtn').addEventListener('click', function () {
    window.MoveNowBridge.send('snooze');
  });

  bindSnoozeHover(fsSnoozeBtn);
  bindSnoozeHover(cornerSnoozeBtn);
  bindSnoozeHover(edgeSnoozeBtn);

  cornerSkipBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('escPressed');
  });

  window.addEventListener('keydown', function (ev) {
    if (currentPhase === 'sealed') {
      window.MoveNowBridge.send('wakeFromReturn');
      return;
    }
    if (ev.key === 'Escape') {
      window.MoveNowBridge.send('escPressed');
    }
  });

  window.addEventListener('mousedown', function () {
    if (currentPhase === 'sealed') {
      window.MoveNowBridge.send('wakeFromReturn');
    }
  });

  window.addEventListener('mousemove', function () {
    if (currentPhase === 'sealed') {
      window.MoveNowBridge.send('wakeFromReturn');
    }
  });

  window.MoveNowBridge.subscribe(render);
  window.MoveNowBridge.send('ready');
})();
