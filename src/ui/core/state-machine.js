(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./actions.js'));
  } else {
    root.MoveNowStateMachine = factory(root.MoveNowActions);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Actions) {
  'use strict';

  const DEFAULT_SETTINGS = {
    hasCompletedOnboarding: false,
    theme: 'geometric',              // 'geometric' | 'sketch' | 'nature_window'
    natureStyle: 'auto',             // 'auto' | 'bokeh' | 'mist' | 'frost'
    reminderMode: 'fullscreen_preview', // 'fullscreen_preview' | 'corner_card' | 'edge_glow'
    preAlertSeconds: 15,             // 10 | 15 | 30
    rhythmPreset: 'golden',          // 'golden' | 'dual' | 'custom'
    customWorkMinutes: 45,
    customBreakSeconds: 45,
    exitStrictness: 'standard',      // 'relaxed' | 'standard' | 'strict'
    handsOffToCount: true,
    autoSealOnAway: true,            // Stage-2 theme-exclusive away seal (default ON per DESIGN.md)
    preventSleepDuringSeal: false,   // Optional IOPMAssertion keep-awake during seal (default OFF per DESIGN.md)
    soundEnabled: false,             // Kano Red Line #3: silent by default
    launchAtLogin: false
  };

  const CONSTANTS = {
    GOLDEN_WORK_SEC: 45 * 60,
    GOLDEN_BREAK_SEC: 45,
    DUAL_EYE_WORK_SEC: 20 * 60,
    DUAL_EYE_BREAK_SEC: 15,
    DUAL_FULL_WORK_SEC: 60 * 60,
    DUAL_FULL_BREAK_SEC: 120,
    PRE_ALERT_SEC: 15,
    SNOOZE_SEC: 5 * 60,
    MAX_CONSECUTIVE_SNOOZES: 3,
    AUTO_DND_SEC: 60 * 60,
    TYPING_QUIET_THRESHOLD_SEC: 2.0,
    MAX_TYPING_DEFERRAL_SEC: 20.0,
    IDLE_RESET_THRESHOLD_SEC: 300.0, // 5 minutes away resets work timer
    ANTI_ACCIDENTAL_GUARD_SEC: 1.8,
    DOUBLE_ESC_WINDOW_SEC: 1.2,
    HANDS_OFF_KEY_RECENT_SEC: 1.2,
    HANDS_OFF_MOUSE_DELTA_PX: 28.0,
    AWAY_RETURN_IDLE_SEC: 8.0,
    SEALED_ROTATION_SEC: 10 * 60,    // 10-minute gentle copy rotation in sealed mode
    MAX_SLEEP_ASSERTION_SEC: 2 * 60 * 60, // 2-hour safety cap for IOPMAssertion
    PREVIEW_BREAK_SEC: 15
  };

  function clampNumber(val, min, max, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function sanitizeSettings(raw) {
    const input = raw || {};
    const s = Object.assign({}, DEFAULT_SETTINGS, input);
    // Migrate legacy 'minimal' theme cleanly to 'nature_window'
    if (s.theme === 'minimal') {
      s.theme = 'nature_window';
    }
    if (!['geometric', 'sketch', 'nature_window'].includes(s.theme)) {
      s.theme = DEFAULT_SETTINGS.theme;
    }
    if (!['auto', 'bokeh', 'mist', 'frost'].includes(s.natureStyle)) {
      s.natureStyle = DEFAULT_SETTINGS.natureStyle;
    }
    if (!['fullscreen_preview', 'corner_card', 'edge_glow'].includes(s.reminderMode)) {
      s.reminderMode = DEFAULT_SETTINGS.reminderMode;
    }
    if (!['golden', 'dual', 'custom'].includes(s.rhythmPreset)) {
      s.rhythmPreset = DEFAULT_SETTINGS.rhythmPreset;
    }
    if (!['relaxed', 'standard', 'strict'].includes(s.exitStrictness)) {
      s.exitStrictness = DEFAULT_SETTINGS.exitStrictness;
    }
    const pa = Number(s.preAlertSeconds);
    s.preAlertSeconds = [10, 15, 30].includes(pa) ? pa : DEFAULT_SETTINGS.preAlertSeconds;
    s.customWorkMinutes = Math.round(clampNumber(s.customWorkMinutes, 1, 180, 45));
    s.customBreakSeconds = Math.round(clampNumber(s.customBreakSeconds, 10, 600, 45));
    s.hasCompletedOnboarding = Boolean(s.hasCompletedOnboarding);
    s.handsOffToCount = Boolean(s.handsOffToCount);
    if (input.autoSealOnAway !== undefined) {
      s.autoSealOnAway = Boolean(input.autoSealOnAway);
    } else if (input.autoFrostOnAway !== undefined) {
      s.autoSealOnAway = Boolean(input.autoFrostOnAway);
    } else if (input.waitForReturnToReveal !== undefined) {
      s.autoSealOnAway = Boolean(input.waitForReturnToReveal);
    } else {
      s.autoSealOnAway = DEFAULT_SETTINGS.autoSealOnAway;
    }
    s.preventSleepDuringSeal = Boolean(input.preventSleepDuringSeal);
    s.soundEnabled = Boolean(s.soundEnabled);
    s.launchAtLogin = Boolean(s.launchAtLogin);
    delete s.waitForReturnToReveal;
    delete s.autoFrostOnAway;
    return s;
  }

  function createEngine(initialSettings, options) {
    const opts = options || {};
    const randomFn = typeof opts.random === 'function' ? opts.random : Math.random;

    let settings = sanitizeSettings(initialSettings);

    const state = {
      phase: 'working', // 'working' | 'typing_deferral' | 'pre_alert' | 'resting' | 'waiting_return' | 'waiting_activity'
      dayKey: opts.dayKey || currentDayKey(),
      todayBreakCount: Math.max(0, Math.round(Number(opts.todayBreakCount) || 0)),
      consecutiveSnoozes: 0,
      mood: 'calm', // 'calm' | 'refreshed' | 'tired'
      refreshedUntilSec: 0,

      // Work timers
      workElapsedSec: 0,
      eyeWorkElapsedSec: 0,
      workExtensionSec: 0,
      eyeExtensionSec: 0,
      snoozeRemainingSec: 0, // >0 when snoozed for 5 min
      dndRemainingSec: 0,    // >0 during timed Do Not Disturb
      dndUntilTomorrow: false,
      dndSelectedPreset: '60', // '30' | '60' | '120' | 'today'

      // Typing deferral
      typingDeferralElapsedSec: 0,
      pendingBreakKind: 'full', // 'full' | 'eye_rest'

      // Pre-alert
      preAlertRemainingSec: 0,
      preAlertVariant: 0,

      // Active break & Stage-2 Sealed Mode
      breakKind: 'full',
      presentationMode: 'fullscreen', // 'fullscreen' | 'corner_card' | 'edge_glow'
      activeNatureStyle: 'bokeh',     // 'bokeh' | 'mist' | 'frost'
      natureAutoIndex: 0,
      breakDurationSec: 45,
      breakRemainingSec: 45,
      breakElapsedWallSec: 0,
      sealedElapsedSec: 0,
      sealedRotationIndex: 0,
      sealedSessionSeed: 1,
      handsOffPaused: false,
      isPreview: false,
      activeAction: null,
      lastActionId: null,
      lastEscTimestampSec: -999,
      escHintActive: false,
      escHintRemainingSec: 0,

      // Toast (e.g. 3-strike auto-DND)
      toastMessage: null,
      toastRemainingSec: 0,

      // System environment flags
      avoiding: false,
      avoidingReason: null,
      lockedOrAsleep: false,
      clockSec: 0,
      lastInputSeenSec: 0,
      hoveringSnooze: false
    };

    function currentDayKey() {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getTargetWorkSec() {
      if (settings.rhythmPreset === 'dual') {
        return CONSTANTS.DUAL_FULL_WORK_SEC;
      }
      if (settings.rhythmPreset === 'custom') {
        return settings.customWorkMinutes * 60;
      }
      return CONSTANTS.GOLDEN_WORK_SEC;
    }

    function getBreakDurationSec(kind) {
      if (kind === 'eye_rest') {
        return CONSTANTS.DUAL_EYE_BREAK_SEC;
      }
      if (settings.rhythmPreset === 'dual') {
        return CONSTANTS.DUAL_FULL_BREAK_SEC;
      }
      if (settings.rhythmPreset === 'custom') {
        return settings.customBreakSeconds;
      }
      return CONSTANTS.GOLDEN_BREAK_SEC;
    }

    function getPresentationForBreak(kind) {
      if (kind === 'eye_rest') {
        return 'corner_card';
      }
      if (settings.reminderMode === 'corner_card') return 'corner_card';
      if (settings.reminderMode === 'edge_glow') return 'edge_glow';
      return 'fullscreen';
    }

    function resetWorkTimers() {
      state.workElapsedSec = 0;
      state.eyeWorkElapsedSec = 0;
      state.workExtensionSec = 0;
      state.eyeExtensionSec = 0;
      state.snoozeRemainingSec = 0;
      state.typingDeferralElapsedSec = 0;
    }

    function isDndActive() {
      return state.dndUntilTomorrow || state.dndRemainingSec > 0;
    }

    function computeMood() {
      if (state.consecutiveSnoozes > 0) return 'tired';
      if (state.clockSec < state.refreshedUntilSec) return 'refreshed';
      return 'calm';
    }

    function startIntervention(kind, events, triggerSource) {
      state.pendingBreakKind = kind;
      const shouldPreAlert =
        triggerSource === 'scheduled' &&
        kind === 'full' &&
        settings.reminderMode === 'fullscreen_preview';

      if (shouldPreAlert) {
        state.phase = 'pre_alert';
        state.preAlertRemainingSec = settings.preAlertSeconds || CONSTANTS.PRE_ALERT_SEC;
        state.preAlertVariant = Math.floor(randomFn() * 10);
        events.push({
          type: 'show_pre_alert',
          remainingSec: state.preAlertRemainingSec,
          message: Actions.getPreAlertCopy(settings.theme, state.preAlertRemainingSec, state.preAlertVariant)
        });
      } else {
        enterResting(kind, false, events);
      }
    }

    function resolveNatureStyle(advance) {
      if (settings.natureStyle !== 'auto') {
        state.activeNatureStyle = settings.natureStyle;
        return state.activeNatureStyle;
      }
      const cycle = ['bokeh', 'mist', 'frost'];
      if (advance) {
        state.activeNatureStyle = cycle[state.natureAutoIndex % cycle.length];
        state.natureAutoIndex += 1;
      }
      return state.activeNatureStyle;
    }

    function enterResting(kind, isPreview, events) {
      state.phase = 'resting';
      state.breakKind = kind;
      state.isPreview = Boolean(isPreview);
      state.presentationMode = isPreview
        ? getPresentationForBreak('full')
        : getPresentationForBreak(kind);
      resolveNatureStyle(true);
      state.breakDurationSec = isPreview
        ? CONSTANTS.PREVIEW_BREAK_SEC
        : getBreakDurationSec(kind);
      state.breakRemainingSec = state.breakDurationSec;
      state.breakElapsedWallSec = 0;
      state.handsOffPaused = false;
      state.lastEscTimestampSec = -999;
      state.escHintActive = false;
      state.escHintRemainingSec = 0;
      state.hoveringSnooze = false;

      const workedMinutes = Math.max(1, Math.round(state.workElapsedSec / 60));
      const picked = Actions.pickBreakAction({
        theme: settings.theme,
        breakKind: kind,
        lastActionId: state.lastActionId,
        workedMinutes: workedMinutes,
        random: randomFn
      });
      state.activeAction = picked;
      state.lastActionId = picked.actionId;

      events.push({
        type: 'show_break',
        presentationMode: state.presentationMode,
        breakKind: state.breakKind,
        durationSec: state.breakDurationSec,
        isPreview: state.isPreview,
        action: picked
      });
    }

    function completeBreak(events, idleSec) {
      const wasPreview = state.isPreview;
      if (!wasPreview) {
        state.todayBreakCount += 1;
        state.consecutiveSnoozes = 0;
        state.refreshedUntilSec = state.clockSec + 15 * 60;
        if (state.breakKind === 'full') {
          resetWorkTimers();
        } else {
          // Eye rest resets only the 20m eye timer, preserves main 60m work progress
          state.eyeWorkElapsedSec = 0;
          state.eyeExtensionSec = 0;
          state.snoozeRemainingSec = 0;
        }
      }

      if (settings.soundEnabled) {
        events.push({ type: 'play_gentle_chime' });
      }

      const userAppearsAway = idleSec >= CONSTANTS.AWAY_RETURN_IDLE_SEC;
      if (settings.autoSealOnAway && userAppearsAway && state.breakKind === 'full') {
        // Stage 2: Theme-exclusive away sealed mode covering all displays
        state.phase = 'sealed';
        state.presentationMode = 'fullscreen';
        state.sealedElapsedSec = 0;
        state.sealedRotationIndex = 0;
        state.sealedSessionSeed = 1 + Math.floor(randomFn() * 999999);
        state.handsOffPaused = false;
        events.push({ type: 'enter_sealed_mode' });
        events.push({ type: 'update_overlay' });
        events.push({ type: 'state_changed' });
        return;
      }

      finishOverlayAndWaitForActivity(events, true, false);
    }

    function finishOverlayAndWaitForActivity(events, peakEndFade, wakeSeal) {
      state.isPreview = false;
      state.handsOffPaused = false;
      state.hoveringSnooze = false;
      state.escHintActive = false;
      state.sealedElapsedSec = 0;
      state.sealedRotationIndex = 0;
      state.phase = 'waiting_activity';
      events.push({
        type: 'hide_overlay',
        restoreFocus: true,
        peakEndFade: Boolean(peakEndFade),
        wakeSeal: Boolean(wakeSeal),
        thawFrost: Boolean(wakeSeal)
      });
    }

    /**
     * Periodic tick called by host every ~0.25s - 1.0s.
     * sensor = {
     *   dtSec,
     *   secondsSinceLastKey,
     *   secondsSinceLastMouse,
     *   mouseDeltaPx,
     *   isMirroring,
     *   isFullscreenPresentation,
     *   isLockedOrAsleep,
     *   dayKey
     * }
     */
    function tick(sensor) {
      const s = sensor || {};
      const dt = clampNumber(s.dtSec, 0.05, 60.0, 0.5);
      state.clockSec += dt;
      const events = [];

      // Midnight rollover for todayBreakCount & "today" DND
      if (s.dayKey && s.dayKey !== state.dayKey) {
        state.dayKey = s.dayKey;
        state.todayBreakCount = 0;
        state.consecutiveSnoozes = 0;
        if (state.dndUntilTomorrow) {
          state.dndUntilTomorrow = false;
          resetWorkTimers();
          state.phase = 'waiting_activity';
          events.push({ type: 'state_changed' });
        }
      }

      const keyIdle = typeof s.secondsSinceLastKey === 'number' ? s.secondsSinceLastKey : 9999;
      const mouseIdle = typeof s.secondsSinceLastMouse === 'number' ? s.secondsSinceLastMouse : 9999;
      const minIdle = Math.min(keyIdle, mouseIdle);
      const mouseDelta = typeof s.mouseDeltaPx === 'number' ? s.mouseDeltaPx : 0;
      const hasRecentInput = minIdle < Math.max(dt + 2.0, 3.0) || mouseDelta >= 4;

      // Toast countdown
      if (state.toastRemainingSec > 0) {
        state.toastRemainingSec = Math.max(0, state.toastRemainingSec - dt);
        if (state.toastRemainingSec === 0) {
          state.toastMessage = null;
          events.push({ type: 'hide_toast' });
        }
      }

      // Esc hint countdown
      if (state.escHintActive) {
        state.escHintRemainingSec = Math.max(0, state.escHintRemainingSec - dt);
        if (state.escHintRemainingSec === 0) {
          state.escHintActive = false;
        }
      }

      // System lock / sleep reset
      if (s.isLockedOrAsleep) {
        if (!state.lockedOrAsleep) {
          state.lockedOrAsleep = true;
          if (state.phase === 'pre_alert' || state.phase === 'resting' || state.phase === 'sealed') {
            events.push({ type: 'hide_overlay', restoreFocus: false, peakEndFade: false, wakeSeal: false, thawFrost: false });
          }
          resetWorkTimers();
          state.phase = 'waiting_activity';
        }
        if (state.dndRemainingSec > 0) {
          state.dndRemainingSec = Math.max(0, state.dndRemainingSec - dt);
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      } else if (state.lockedOrAsleep) {
        state.lockedOrAsleep = false;
        resetWorkTimers();
        state.phase = 'waiting_activity';
      }

      // Update avoidance flag (Mirroring / Fullscreen presentation)
      const prevAvoiding = state.avoiding;
      state.avoiding = Boolean(s.isMirroring || s.isFullscreenPresentation);
      state.avoidingReason = s.isMirroring
        ? 'mirroring'
        : (s.isFullscreenPresentation ? 'fullscreen' : null);

      if (state.avoiding && !prevAvoiding) {
        // Silently step aside if pre_alert was showing
        if (state.phase === 'pre_alert' || state.phase === 'typing_deferral') {
          state.phase = 'working';
          events.push({ type: 'hide_overlay', restoreFocus: false, peakEndFade: false });
        }
      }

      // DND countdown (orthogonal)
      if (state.dndRemainingSec > 0) {
        state.dndRemainingSec = Math.max(0, state.dndRemainingSec - dt);
        if (state.dndRemainingSec === 0) {
          resetWorkTimers();
          state.phase = 'waiting_activity';
          events.push({ type: 'state_changed' });
        }
      }

      // Phase handling: Stage-2 Theme-Exclusive Sealed Mode
      if (state.phase === 'sealed') {
        if (hasRecentInput) {
          finishOverlayAndWaitForActivity(events, true, true);
          // User just returned and touched mouse/keyboard -> start next work cycle cleanly
          state.phase = 'working';
          events.push({ type: 'state_changed' });
        } else {
          state.sealedElapsedSec += dt;
          const nextRot = Math.floor(state.sealedElapsedSec / CONSTANTS.SEALED_ROTATION_SEC);
          if (nextRot !== state.sealedRotationIndex) {
            state.sealedRotationIndex = nextRot;
            events.push({ type: 'update_overlay' });
          }
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      if (state.phase === 'resting') {
        state.breakElapsedWallSec += dt;
        const pastGuard = state.breakElapsedWallSec >= CONSTANTS.ANTI_ACCIDENTAL_GUARD_SEC;
        const activelyTyping = keyIdle < CONSTANTS.HANDS_OFF_KEY_RECENT_SEC && !state.escHintActive;
        const largeMouseMove = mouseDelta >= CONSTANTS.HANDS_OFF_MOUSE_DELTA_PX && !state.hoveringSnooze;

        if (settings.handsOffToCount && pastGuard && (activelyTyping || largeMouseMove)) {
          state.handsOffPaused = true;
        } else {
          state.handsOffPaused = false;
          state.breakRemainingSec = Math.max(0, state.breakRemainingSec - dt);
        }

        if (state.breakRemainingSec <= 0) {
          completeBreak(events, minIdle);
        } else {
          events.push({ type: 'update_overlay' });
        }

        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      if (state.phase === 'pre_alert') {
        if (state.avoiding || isDndActive()) {
          state.phase = 'working';
          events.push({ type: 'hide_overlay', restoreFocus: false, peakEndFade: false });
        } else {
          state.preAlertRemainingSec = Math.max(0, state.preAlertRemainingSec - dt);
          if (state.preAlertRemainingSec <= 0) {
            enterResting(state.pendingBreakKind, false, events);
          } else {
            events.push({ type: 'update_overlay' });
          }
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      // Onboarding pauses automatic background reminders until user finishes welcome card
      if (!settings.hasCompletedOnboarding) {
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      if (isDndActive()) {
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      if (state.phase === 'waiting_activity') {
        if (hasRecentInput) {
          state.phase = 'working';
          events.push({ type: 'state_changed' });
        } else {
          state.mood = computeMood();
          return getSnapshotWithEvents(events);
        }
      }

      if (state.phase === 'typing_deferral') {
        if (state.avoiding) {
          state.phase = 'working';
          state.typingDeferralElapsedSec = 0;
        } else {
          state.typingDeferralElapsedSec += dt;
          if (
            keyIdle >= CONSTANTS.TYPING_QUIET_THRESHOLD_SEC ||
            state.typingDeferralElapsedSec >= CONSTANTS.MAX_TYPING_DEFERRAL_SEC
          ) {
            state.typingDeferralElapsedSec = 0;
            startIntervention(state.pendingBreakKind, events, 'scheduled');
          }
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      // Phase === 'working'
      // Idle reset: user away from keyboard/mouse >= threshold resets work timer
      if (minIdle >= CONSTANTS.IDLE_RESET_THRESHOLD_SEC) {
        if (state.workElapsedSec > 0 || state.eyeWorkElapsedSec > 0 || state.snoozeRemainingSec > 0) {
          resetWorkTimers();
          state.consecutiveSnoozes = 0;
          state.phase = 'waiting_activity';
          events.push({ type: 'state_changed' });
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      // While avoiding (mirroring/presentation), don't pop up breaks; hold safely near threshold
      if (state.avoiding) {
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      // Snoozed countdown (5 min)
      if (state.snoozeRemainingSec > 0) {
        state.snoozeRemainingSec = Math.max(0, state.snoozeRemainingSec - dt);
        if (state.snoozeRemainingSec === 0) {
          triggerBreakOrDefer(state.pendingBreakKind || 'full', keyIdle, events);
        }
        state.mood = computeMood();
        return getSnapshotWithEvents(events);
      }

      // Regular work timer advance
      state.workElapsedSec += dt;
      if (settings.rhythmPreset === 'dual') {
        state.eyeWorkElapsedSec += dt;
      }

      const targetWorkSec = getTargetWorkSec() + state.workExtensionSec;
      const targetEyeSec = CONSTANTS.DUAL_EYE_WORK_SEC + state.eyeExtensionSec;
      if (state.workElapsedSec >= targetWorkSec) {
        triggerBreakOrDefer('full', keyIdle, events);
      } else if (settings.rhythmPreset === 'dual' && state.eyeWorkElapsedSec >= targetEyeSec) {
        triggerBreakOrDefer('eye_rest', keyIdle, events);
      }

      state.mood = computeMood();
      return getSnapshotWithEvents(events);
    }

    function triggerBreakOrDefer(kind, keyIdle, events) {
      // Kano Red Line #1: Never interrupt active continuous typing
      if (keyIdle < CONSTANTS.TYPING_QUIET_THRESHOLD_SEC) {
        state.phase = 'typing_deferral';
        state.typingDeferralElapsedSec = 0;
        state.pendingBreakKind = kind;
      } else {
        startIntervention(kind, events, 'scheduled');
      }
    }

    /**
     * User actions
     */
    function snooze() {
      const events = [];
      if (state.phase !== 'pre_alert' && state.phase !== 'resting') {
        return getSnapshotWithEvents(events);
      }

      // Preview snooze or manual break during active DND simply closes cleanly without counting snooze strikes
      if (state.isPreview || isDndActive()) {
        finishOverlayAndWaitForActivity(events, true);
        state.phase = 'working';
        return getSnapshotWithEvents(events);
      }

      state.consecutiveSnoozes += 1;
      events.push({ type: 'hide_overlay', restoreFocus: true, peakEndFade: true });

      if (state.consecutiveSnoozes >= CONSTANTS.MAX_CONSECUTIVE_SNOOZES) {
        // Fogg Model graceful retreat: auto-enable 1h DND without nagging
        state.consecutiveSnoozes = 0;
        resetWorkTimers();
        state.dndUntilTomorrow = false;
        state.dndSelectedPreset = '60';
        state.dndRemainingSec = CONSTANTS.AUTO_DND_SEC;
        state.phase = 'working';
        state.toastMessage = Actions.SNOOZE_DND_TOAST;
        state.toastRemainingSec = 4.5;
        events.push({
          type: 'show_toast',
          message: Actions.SNOOZE_DND_TOAST,
          durationSec: 4.5
        });
      } else {
        state.phase = 'working';
        state.snoozeRemainingSec = CONSTANTS.SNOOZE_SEC;
      }

      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function handleEscKey() {
      const events = [];
      if (state.phase === 'sealed') {
        finishOverlayAndWaitForActivity(events, true, true);
        state.phase = 'working';
        events.push({ type: 'state_changed' });
        return getSnapshotWithEvents(events);
      }
      if (state.phase !== 'resting') {
        return getSnapshotWithEvents(events);
      }
      if (state.isPreview) {
        finishOverlayAndWaitForActivity(events, true);
        state.phase = 'working';
        return getSnapshotWithEvents(events);
      }
      // Anti-muscle-memory guard (first 1.8s)
      if (state.breakElapsedWallSec < CONSTANTS.ANTI_ACCIDENTAL_GUARD_SEC) {
        return getSnapshotWithEvents(events);
      }

      if (settings.exitStrictness === 'strict') {
        return getSnapshotWithEvents(events);
      }

      if (settings.exitStrictness === 'relaxed') {
        skipCurrentBreak(events);
        return getSnapshotWithEvents(events);
      }

      // 'standard': require double ESC within 1.2s
      const delta = state.clockSec - state.lastEscTimestampSec;
      if (delta <= CONSTANTS.DOUBLE_ESC_WINDOW_SEC) {
        skipCurrentBreak(events);
      } else {
        state.lastEscTimestampSec = state.clockSec;
        state.escHintActive = true;
        state.escHintRemainingSec = 1.6;
        events.push({ type: 'update_overlay' });
      }
      return getSnapshotWithEvents(events);
    }

    function skipCurrentBreak(events) {
      if (state.breakKind === 'full') {
        resetWorkTimers();
      } else {
        state.eyeWorkElapsedSec = 0;
        state.eyeExtensionSec = 0;
        state.snoozeRemainingSec = 0;
      }
      state.consecutiveSnoozes = 0;
      finishOverlayAndWaitForActivity(events, true);
      events.push({ type: 'state_changed' });
    }

    function startBreakNow(options) {
      const o = options || {};
      const events = [];
      const isPreview = Boolean(o.isPreview);
      if (!isPreview && state.phase === 'pre_alert') {
        enterResting(state.pendingBreakKind || 'full', false, events);
      } else {
        enterResting('full', isPreview, events);
      }
      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function toggleDnd(forceValue) {
      const events = [];
      const currentlyActive = isDndActive();
      const nextActive = typeof forceValue === 'boolean' ? forceValue : !currentlyActive;

      if (nextActive) {
        applyDndPreset(state.dndSelectedPreset || '60', events);
      } else {
        state.dndRemainingSec = 0;
        state.dndUntilTomorrow = false;
        resetWorkTimers();
        if (state.phase !== 'resting') {
          state.phase = 'working';
        }
      }
      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function applyDndPreset(preset, events) {
      const key = String(preset || '60');
      if (key === 'today') {
        state.dndSelectedPreset = 'today';
        state.dndUntilTomorrow = true;
        state.dndRemainingSec = 0;
      } else {
        const mins = clampNumber(key, 15, 480, 60);
        state.dndSelectedPreset = String(Math.round(mins));
        state.dndUntilTomorrow = false;
        state.dndRemainingSec = Math.round(mins) * 60;
      }
      if (state.phase === 'pre_alert' || state.phase === 'typing_deferral') {
        state.phase = 'working';
        events.push({ type: 'hide_overlay', restoreFocus: true, peakEndFade: true });
      }
    }

    function setDndDuration(preset) {
      const events = [];
      applyDndPreset(preset, events);
      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function extendCurrentCycle(extraMinutes) {
      const events = [];
      if (isDndActive() || state.phase === 'resting') {
        return getSnapshotWithEvents(events);
      }
      const extraSec = Math.round(clampNumber(extraMinutes, 5, 60, 15)) * 60;
      if (state.phase === 'pre_alert' || state.phase === 'typing_deferral') {
        state.phase = 'working';
        state.typingDeferralElapsedSec = 0;
        events.push({ type: 'hide_overlay', restoreFocus: true, peakEndFade: true });
        state.snoozeRemainingSec = extraSec;
      } else if (state.snoozeRemainingSec > 0) {
        state.snoozeRemainingSec = Math.min(state.snoozeRemainingSec + extraSec, 120 * 60);
      } else {
        state.workExtensionSec = Math.min(state.workExtensionSec + extraSec, 120 * 60);
        if (settings.rhythmPreset === 'dual') {
          state.eyeExtensionSec = Math.min(state.eyeExtensionSec + extraSec, 120 * 60);
        }
      }
      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function resetCurrentCycle() {
      const events = [];
      if (state.phase === 'pre_alert' || state.phase === 'typing_deferral') {
        events.push({ type: 'hide_overlay', restoreFocus: true, peakEndFade: true });
      }
      if (state.phase !== 'resting') {
        state.phase = 'working';
      }
      resetWorkTimers();
      state.consecutiveSnoozes = 0;
      state.mood = computeMood();
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function updateSettings(patch) {
      const prevPreset = settings.rhythmPreset;
      settings = sanitizeSettings(Object.assign({}, settings, patch || {}));
      const events = [];

      if (patch && patch.rhythmPreset && patch.rhythmPreset !== prevPreset) {
        resetWorkTimers();
      }
      if (patch && patch.natureStyle) {
        resolveNatureStyle(false);
      }
      // If user switches theme while resting or pre-alerting, refresh active copy
      if ((state.phase === 'resting' || state.phase === 'pre_alert') && state.activeAction) {
        const picked = Actions.pickBreakAction({
          theme: settings.theme,
          breakKind: state.breakKind,
          lastActionId: null,
          workedMinutes: Math.max(1, Math.round(state.workElapsedSec / 60)),
          random: randomFn
        });
        state.activeAction = picked;
        events.push({ type: 'update_overlay' });
      }
      events.push({ type: 'settings_updated', settings: Object.assign({}, settings) });
      events.push({ type: 'state_changed' });
      return getSnapshotWithEvents(events);
    }

    function wakeFromReturn() {
      const events = [];
      if (state.phase === 'sealed') {
        finishOverlayAndWaitForActivity(events, true, true);
        state.phase = 'working';
        events.push({ type: 'state_changed' });
      }
      return getSnapshotWithEvents(events);
    }

    function setHoveringSnooze(hovering) {
      state.hoveringSnooze = Boolean(hovering);
    }

    function completeOnboarding(patch) {
      const merged = Object.assign({}, patch || {}, { hasCompletedOnboarding: true });
      const res = updateSettings(merged);
      resetWorkTimers();
      state.phase = 'working';
      return res;
    }

    function getSnapshot() {
      const baseTargetWorkSec = getTargetWorkSec();
      const targetWorkSec = baseTargetWorkSec + state.workExtensionSec;
      const targetEyeSec = CONSTANTS.DUAL_EYE_WORK_SEC + state.eyeExtensionSec;
      const dndActive = isDndActive();

      const nextBreakRemainingSec = state.snoozeRemainingSec > 0
        ? state.snoozeRemainingSec
        : Math.max(0, targetWorkSec - state.workElapsedSec);
      const nextEyeRemainingSec = settings.rhythmPreset === 'dual'
        ? Math.max(0, targetEyeSec - state.eyeWorkElapsedSec)
        : null;

      let cycleProgress = 0;
      if (state.snoozeRemainingSec > 0) {
        cycleProgress = Math.max(0, Math.min(1, 1 - state.snoozeRemainingSec / CONSTANTS.SNOOZE_SEC));
      } else if (targetWorkSec > 0) {
        cycleProgress = Math.max(0, Math.min(1, state.workElapsedSec / targetWorkSec));
      }

      const resolvedNatureStyle = resolveNatureStyle(false);
      const isSealed = state.phase === 'sealed';
      const sealedStyle = settings.theme === 'geometric'
        ? 'warm_matte'
        : (settings.theme === 'sketch' ? 'vellum' : resolvedNatureStyle);
      const keepAwakeActive = isSealed &&
        settings.preventSleepDuringSeal &&
        state.sealedElapsedSec < CONSTANTS.MAX_SLEEP_ASSERTION_SEC;

      const sealedBeat = isSealed
        ? Actions.pickSealedVignette({
            theme: settings.theme,
            natureStyle: resolvedNatureStyle,
            rotationIndex: state.sealedRotationIndex,
            sealedElapsedSec: state.sealedElapsedSec,
            sessionSeed: state.sealedSessionSeed
          })
        : null;

      const snapCore = {
        settings: Object.assign({}, settings),
        phase: state.phase,
        dayKey: state.dayKey,
        todayBreakCount: state.todayBreakCount,
        consecutiveSnoozes: state.consecutiveSnoozes,
        mood: dndActive ? 'dnd' : state.mood,
        avoiding: state.avoiding,
        avoidingReason: state.avoidingReason,
        dndActive: dndActive,
        dndUntilTomorrow: state.dndUntilTomorrow,
        dndSelectedPreset: state.dndSelectedPreset,
        dndRemainingSec: state.dndRemainingSec,
        workElapsedSec: state.workElapsedSec,
        workTargetSec: targetWorkSec,
        nextBreakRemainingSec: nextBreakRemainingSec,
        nextEyeRemainingSec: nextEyeRemainingSec,
        cycleProgress: cycleProgress,
        snoozeRemainingSec: state.snoozeRemainingSec,
        preAlertRemainingSec: state.preAlertRemainingSec,
        preAlertMessage: Actions.getPreAlertCopy(settings.theme, state.preAlertRemainingSec, state.preAlertVariant),
        breakKind: state.breakKind,
        presentationMode: state.presentationMode,
        activeNatureStyle: resolvedNatureStyle,
        breakDurationSec: state.breakDurationSec,
        breakRemainingSec: state.breakRemainingSec,
        breakElapsedWallSec: state.breakElapsedWallSec,
        antiGuardActive: state.phase === 'resting' && state.breakElapsedWallSec < CONSTANTS.ANTI_ACCIDENTAL_GUARD_SEC,
        handsOffPaused: state.handsOffPaused,
        handsOffHint: state.handsOffPaused ? Actions.HANDS_OFF_HINT : null,
        escHint: state.escHintActive ? Actions.DOUBLE_ESC_HINT : null,
        sealedStyle: sealedStyle,
        sealedElapsedSec: state.sealedElapsedSec,
        sealedRotationIndex: state.sealedRotationIndex,
        sealedMessage: sealedBeat ? sealedBeat.message : null,
        sealedPose: sealedBeat ? sealedBeat.pose : null,
        sealedCopySource: sealedBeat ? sealedBeat.source : null,
        sealedWakeHint: isSealed ? Actions.SEALED_WAKE_HINT : null,
        keepAwakeActive: keepAwakeActive,
        isPreview: state.isPreview,
        activeAction: state.activeAction,
        toastMessage: state.toastMessage
      };
      snapCore.popoverCopy = Actions.getPopoverCopy(snapCore);
      return snapCore;
    }

    function getSnapshotWithEvents(events) {
      return {
        snapshot: getSnapshot(),
        events: events
      };
    }

    return {
      tick: tick,
      snooze: snooze,
      handleEscKey: handleEscKey,
      startBreakNow: startBreakNow,
      toggleDnd: toggleDnd,
      setDndDuration: setDndDuration,
      extendCurrentCycle: extendCurrentCycle,
      resetCurrentCycle: resetCurrentCycle,
      wakeFromReturn: wakeFromReturn,
      updateSettings: updateSettings,
      completeOnboarding: completeOnboarding,
      setHoveringSnooze: setHoveringSnooze,
      getSnapshot: getSnapshot
    };
  }

  return {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    CONSTANTS: CONSTANTS,
    sanitizeSettings: sanitizeSettings,
    createEngine: createEngine
  };
});
