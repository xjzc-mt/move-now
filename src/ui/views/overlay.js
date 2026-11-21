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
      if (!document.hidden) {
        if (opticalActive && opticalEngine) {
          opticalEngine.update(now);
        }
        if (currentPhase === 'sealed') {
          updateSealedLiveScene(now);
        }
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

  const sealedStageRoot = document.getElementById('sealedStage');
  const sealedClockEl = document.getElementById('sealedClock');
  const sealedStatusTextEl = document.getElementById('sealedStatusText');
  const sealedSketchLineEl = document.getElementById('sealedSketchLine');
  const sealedDividerEl = document.getElementById('sealedDivider');
  const sealedFrontCanvas = document.getElementById('sealedFrontCanvas');
  const sealedMessageEl = document.getElementById('sealedMessage');
  const sealedWakeHintEl = document.getElementById('sealedWakeHint');
  const guardianStageEl = document.getElementById('guardianStage');

  let currentSealedLayout = 'glass_clock';
  let lastGuardianPose = '';
  let frontCanvasW = 0;
  let frontCanvasH = 0;
  let frontCanvasDpr = 1;
  const frontCtx = sealedFrontCanvas ? sealedFrontCanvas.getContext('2d') : null;
  const frontDepthOrbs = [
    { x: 0.36, y: 0.38, r: 105, vx: 0.014, vy: 0.009, warm: false },
    { x: 0.62, y: 0.44, r: 128, vx: -0.011, vy: 0.008, warm: true },
    { x: 0.48, y: 0.33, r: 88, vx: 0.009, vy: -0.011, warm: false }
  ];

  const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function getClockHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function getCalmDateStatus() {
    const d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + WEEKDAY_CN[d.getDay()] + ' · 桌面小憩中';
  }

  function updateSealedLiveScene(nowMs) {
    if (sealedClockEl) {
      const hhmm = getClockHHMM();
      if (sealedClockEl.textContent !== hhmm) {
        sealedClockEl.textContent = hhmm;
      }
    }

    const t = nowMs / 1000;

    // 1. Autonomous Living Guardian Life-Cycle (70% calm nap, periodic patrol/yawn/stretch/tea/stroll!)
    if (currentTheme === 'geometric' && !guardianStageEl.hidden) {
      const c = t % 36;
      const pose = c < 16
        ? 'guardian'
        : c < 22
          ? 'gaze'
          : c < 27
            ? 'stretch_up'
            : c < 34
              ? 'tea'
              : 'guardian';
      if (pose !== lastGuardianPose) {
        lastGuardianPose = pose;
        ensureGuardianStage().setState({
          theme: 'geometric',
          pose: pose,
          mood: 'calm',
          easterEgg: pose === 'tea' ? 'tea' : null
        });
      }
      guardianStageEl.style.transform = '';
    } else if (currentTheme === 'sketch' && !guardianStageEl.hidden) {
      const c = t % 42;
      const pose = c < 17
        ? 'nap_guard'
        : c < 22
          ? 'yawn'
          : c < 27
            ? 'stretch_up'
            : c < 36
              ? 'walk'
              : 'tea';
      if (pose !== lastGuardianPose) {
        lastGuardianPose = pose;
        ensureGuardianStage().setState({
          theme: 'sketch',
          pose: pose,
          mood: 'calm',
          easterEgg: pose === 'yawn' ? 'yawn' : null
        });
      }
      if (pose === 'walk') {
        const walkProgress = (c - 27) / 9; // 0 -> 1
        const strollX = Math.sin(walkProgress * Math.PI * 2) * 56;
        guardianStageEl.style.transform = 'translateX(' + strollX.toFixed(1) + 'px)';
      } else {
        guardianStageEl.style.transform = 'translateX(0px)';
      }
    }

    // 2. Foreground Depth Layer Orbs drifting IN FRONT OF Giant Glass Clock (Apple Depth Effect!)
    if (frontCtx && sealedFrontCanvas) {
      const activeDepth = currentSealedLayout === 'glass_clock';
      sealedFrontCanvas.classList.toggle('active', activeDepth);
      if (activeDepth) {
        const rect = sealedFrontCanvas.getBoundingClientRect();
        const w = Math.max(40, Math.round(rect.width));
        const h = Math.max(40, Math.round(rect.height));
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        if (w !== frontCanvasW || h !== frontCanvasH || dpr !== frontCanvasDpr) {
          frontCanvasW = w;
          frontCanvasH = h;
          frontCanvasDpr = dpr;
          sealedFrontCanvas.width = Math.round(w * dpr);
          sealedFrontCanvas.height = Math.round(h * dpr);
          frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        frontCtx.clearRect(0, 0, w, h);
        const dark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        for (let i = 0; i < frontDepthOrbs.length; i++) {
          const o = frontDepthOrbs[i];
          const ox = w * (o.x + Math.sin(t * 0.24 + i * 2.2) * 0.14);
          const oy = h * (o.y + Math.cos(t * 0.19 + i * 1.7) * 0.08);
          const orad = o.r * (w / 1280 + 0.35);
          const g = frontCtx.createRadialGradient(ox, oy, 4, ox, oy, orad);
          if (dark) {
            g.addColorStop(0, o.warm ? 'rgba(232, 174, 142, 0.18)' : 'rgba(255, 255, 255, 0.14)');
          } else {
            g.addColorStop(0, o.warm ? 'rgba(244, 232, 218, 0.44)' : 'rgba(248, 245, 238, 0.48)');
          }
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          frontCtx.fillStyle = g;
          frontCtx.beginPath();
          frontCtx.arc(ox, oy, orad, 0, Math.PI * 2);
          frontCtx.fill();
        }
      }
    }
  }

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
        const sealedStyle = snapshot.sealedStyle || 'warm_matte';
        if (currentTheme === 'geometric') {
          currentSealedLayout = 'glass_clock';
        } else if (currentTheme === 'sketch') {
          currentSealedLayout = 'sketch_paper';
        } else if (sealedStyle === 'bokeh') {
          currentSealedLayout = 'solar_orbit';
        } else {
          currentSealedLayout = 'editorial_wave';
        }
        if (sealedStageRoot) {
          sealedStageRoot.setAttribute('data-sealed-layout', currentSealedLayout);
        }
        if (sealedSketchLineEl) {
          sealedSketchLineEl.hidden = currentSealedLayout !== 'sketch_paper';
        }
        if (sealedDividerEl) {
          sealedDividerEl.hidden = currentSealedLayout !== 'editorial_wave';
        }
        if (sealedClockEl) {
          sealedClockEl.textContent = getClockHHMM();
        }
        if (sealedStatusTextEl) {
          sealedStatusTextEl.textContent = getCalmDateStatus();
        }

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

        if (currentTheme === 'geometric' || currentTheme === 'sketch') {
          guardianStageEl.hidden = false;
          if (!lastGuardianPose) {
            const initPose = currentTheme === 'geometric' ? 'guardian' : 'nap_guard';
            lastGuardianPose = initPose;
            ensureGuardianStage().setState({
              theme: currentTheme,
              pose: initPose,
              mood: 'calm',
              easterEgg: null
            });
          }
        } else {
          guardianStageEl.hidden = true;
          lastGuardianPose = '';
        }
        startOpticalLoop();
        return;
      }

      guardianStageEl.hidden = true;
      lastGuardianPose = '';
      if (sealedFrontCanvas) {
        sealedFrontCanvas.classList.remove('active');
      }
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
