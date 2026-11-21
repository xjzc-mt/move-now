import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Actions = require('../src/ui/core/actions.js');
const SM = require('../src/ui/core/state-machine.js');

function activeSensor(dtSec = 1.0, extra = {}) {
  return Object.assign(
    {
      dtSec,
      secondsSinceLastKey: 10,
      secondsSinceLastMouse: 0.2,
      mouseDeltaPx: 2,
      isMirroring: false,
      isFullscreenPresentation: false,
      isLockedOrAsleep: false,
      dayKey: '2026-11-18'
    },
    extra
  );
}

test('Defaults obey Kano Red Line #3 (sound disabled), Golden Rhythm, autoSealOnAway ON, preventSleepDuringSeal OFF', () => {
  const engine = SM.createEngine({ hasCompletedOnboarding: true }, { dayKey: '2026-11-19' });
  const snap = engine.getSnapshot();
  assert.equal(snap.settings.soundEnabled, false);
  assert.equal(snap.settings.theme, 'geometric');
  assert.equal(snap.settings.rhythmPreset, 'golden');
  assert.equal(snap.settings.autoSealOnAway, true);
  assert.equal(snap.settings.preventSleepDuringSeal, false);
  assert.equal(snap.keepAwakeActive, false);
  assert.equal(snap.workTargetSec, 45 * 60);

  // Legacy 'minimal' theme & 'autoFrostOnAway' migrate cleanly
  const migrated = SM.createEngine({ theme: 'minimal', autoFrostOnAway: false, hasCompletedOnboarding: true });
  assert.equal(migrated.getSnapshot().settings.theme, 'nature_window');
  assert.equal(migrated.getSnapshot().settings.autoSealOnAway, false);
});

test('Typing deferral prevents interrupting mid-sentence typing (Kano Red Line #1)', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1 },
    { dayKey: '2026-11-18' }
  );

  // Advance 59s normally
  for (let i = 0; i < 59; i++) {
    engine.tick(activeSensor(1.0));
  }
  assert.equal(engine.getSnapshot().phase, 'working');

  // At 60s, user is actively typing (key idle 0.3s < 2.0s)
  const r60 = engine.tick(activeSensor(1.0, { secondsSinceLastKey: 0.3 }));
  assert.equal(r60.snapshot.phase, 'typing_deferral');

  // Keep typing for 5 seconds: still deferred
  for (let i = 0; i < 5; i++) {
    const r = engine.tick(activeSensor(1.0, { secondsSinceLastKey: 0.4 }));
    assert.equal(r.snapshot.phase, 'typing_deferral');
  }

  // User pauses typing (key idle 2.2s >= 2.0s): transitions smoothly to pre_alert
  const rDone = engine.tick(activeSensor(1.0, { secondsSinceLastKey: 2.2 }));
  assert.equal(rDone.snapshot.phase, 'pre_alert');
  assert.ok(rDone.events.some((e) => e.type === 'show_pre_alert'));
});

test('Typing deferral enforces 20s max fallback even if continuous typing never stops', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1 },
    { dayKey: '2026-11-18' }
  );
  for (let i = 0; i < 60; i++) {
    engine.tick(activeSensor(1.0, { secondsSinceLastKey: 0.2 }));
  }
  assert.equal(engine.getSnapshot().phase, 'typing_deferral');

  for (let i = 0; i < 20; i++) {
    engine.tick(activeSensor(1.0, { secondsSinceLastKey: 0.2 }));
  }
  assert.equal(engine.getSnapshot().phase, 'pre_alert');
});

test('Fogg Model: 3 consecutive snoozes automatically enable 1-hour DND with gentle toast', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1 },
    { dayKey: '2026-11-18' }
  );

  const reachBreak = () => {
    engine.startBreakNow({ isPreview: false });
  };

  reachBreak();
  let res = engine.snooze();
  assert.equal(res.snapshot.consecutiveSnoozes, 1);
  assert.equal(res.snapshot.dndActive, false);
  assert.equal(res.snapshot.snoozeRemainingSec, 300);

  // Advance 5 min snooze
  for (let i = 0; i < 300; i++) {
    engine.tick(activeSensor(1.0));
  }
  assert.equal(engine.getSnapshot().phase, 'pre_alert');

  res = engine.snooze();
  assert.equal(res.snapshot.consecutiveSnoozes, 2);
  assert.equal(res.snapshot.dndActive, false);

  // 3rd snooze -> 1h DND
  reachBreak();
  res = engine.snooze();
  assert.equal(res.snapshot.consecutiveSnoozes, 0);
  assert.equal(res.snapshot.dndActive, true);
  assert.equal(res.snapshot.dndRemainingSec, 3600);
  assert.ok(res.events.some((e) => e.type === 'show_toast' && e.message.includes('安静 1 小时')));
});

test('Anti-muscle-memory guard + Exit strictness (relaxed, standard double-ESC, strict)', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, exitStrictness: 'standard' },
    { dayKey: '2026-11-18' }
  );
  engine.startBreakNow();

  // Within first 1.8s guard: ESC is ignored
  engine.tick(activeSensor(1.0));
  let res = engine.handleEscKey();
  assert.equal(res.snapshot.phase, 'resting');
  assert.equal(res.snapshot.escHint, null);

  // Past 1.8s guard: first ESC sets hint, second within 1.2s exits
  engine.tick(activeSensor(1.0)); // total 2.0s
  res = engine.handleEscKey();
  assert.equal(res.snapshot.phase, 'resting');
  assert.ok(res.snapshot.escHint.includes('再按一次 ESC'));

  engine.tick(activeSensor(0.5));
  res = engine.handleEscKey();
  assert.equal(res.snapshot.phase, 'waiting_activity');
  assert.ok(res.events.some((e) => e.type === 'hide_overlay' && e.restoreFocus));

  // Strict mode: ESC never exits
  engine.updateSettings({ exitStrictness: 'strict' });
  engine.startBreakNow();
  engine.tick(activeSensor(2.5));
  engine.handleEscKey();
  engine.tick(activeSensor(0.3));
  res = engine.handleEscKey();
  assert.equal(res.snapshot.phase, 'resting');

  // Relaxed mode: single ESC exits
  engine.updateSettings({ exitStrictness: 'relaxed' });
  res = engine.handleEscKey();
  assert.equal(res.snapshot.phase, 'waiting_activity');
});

test('Hands-off progress pauses when typing/moving mouse, resumes on release', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, handsOffToCount: true, customBreakSeconds: 20, rhythmPreset: 'custom' },
    { dayKey: '2026-11-18' }
  );
  engine.startBreakNow();

  // First 2s pass guard
  engine.tick(activeSensor(1.0, { secondsSinceLastKey: 5, secondsSinceLastMouse: 5, mouseDeltaPx: 0 }));
  engine.tick(activeSensor(1.0, { secondsSinceLastKey: 5, secondsSinceLastMouse: 5, mouseDeltaPx: 0 }));
  assert.equal(engine.getSnapshot().breakRemainingSec, 18);

  // Active typing pauses countdown
  const paused = engine.tick(activeSensor(1.0, { secondsSinceLastKey: 0.2, mouseDeltaPx: 0 }));
  assert.equal(paused.snapshot.handsOffPaused, true);
  assert.equal(paused.snapshot.breakRemainingSec, 18);

  // Hovering snooze button allows clicking without pausing prematurely on mouse move
  engine.setHoveringSnooze(true);
  const hovering = engine.tick(activeSensor(1.0, { secondsSinceLastKey: 5, mouseDeltaPx: 45 }));
  assert.equal(hovering.snapshot.handsOffPaused, false);
  assert.equal(hovering.snapshot.breakRemainingSec, 17);
});

test('Stage-2 Away Sealed Mode: theme-exclusive sealedStyle, 10-min copy rotation, 2h keepAwake cap, and instant wake', () => {
  // 1. Geometric theme -> warm_matte sealedStyle + 10-min rotation + 20-min 6th quote + preventSleepDuringSeal 2h cap
  const geo = SM.createEngine(
    {
      hasCompletedOnboarding: true,
      theme: 'geometric',
      rhythmPreset: 'custom',
      customWorkMinutes: 1,
      customBreakSeconds: 10,
      autoSealOnAway: true,
      preventSleepDuringSeal: false
    },
    { dayKey: '2026-11-19' }
  );
  geo.startBreakNow();

  // User leaves desk during break (idle >= 10s)
  let res;
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(1.0, { secondsSinceLastKey: 15, secondsSinceLastMouse: 15, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.sealedStyle, 'warm_matte');
  assert.equal(res.snapshot.todayBreakCount, 1);
  assert.equal(res.snapshot.keepAwakeActive, false);
  assert.ok(res.snapshot.sealedMessage && res.snapshot.sealedMessage.length > 0);
  assert.equal(res.snapshot.sealedWakeHint, Actions.SEALED_WAKE_HINT);
  assert.ok(res.events.some((e) => e.type === 'enter_sealed_mode'));

  // Enable preventSleepDuringSeal -> keepAwakeActive becomes true while sealed
  geo.updateSettings({ preventSleepDuringSeal: true });
  assert.equal(geo.getSnapshot().keepAwakeActive, true);

  // Advance 10 minutes (600s) while away -> sealedRotationIndex increments & copy rotates
  const firstQuote = res.snapshot.sealedMessage;
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 600, secondsSinceLastMouse: 600, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.sealedRotationIndex, 1);
  assert.notEqual(res.snapshot.sealedMessage, firstQuote);
  assert.equal(res.snapshot.keepAwakeActive, true);

  // Advance another 10 minutes (total 20m = 1200s) -> geometric 6th long-away quote available
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 1200, secondsSinceLastMouse: 1200, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.sealedRotationIndex, 2);
  const shortAwayCopy = Actions.getSealedCopy({ theme: 'geometric', rotationIndex: 5, sealedElapsedSec: 600 });
  const longAwayCopy = Actions.getSealedCopy({ theme: 'geometric', rotationIndex: 5, sealedElapsedSec: 1200 });
  assert.notEqual(shortAwayCopy, longAwayCopy);
  assert.ok(longAwayCopy.includes('窗边透气'));

  // Advance past 2-hour cap (7200s) -> keepAwakeActive automatically turns false for battery safety
  for (let i = 0; i < 105; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 7500, secondsSinceLastMouse: 7500, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.keepAwakeActive, false);

  // User returns and touches mouse -> theme wake animation + restore focus + begins next work round cleanly
  res = geo.tick(activeSensor(0.5, { secondsSinceLastKey: 7500, secondsSinceLastMouse: 0.1, mouseDeltaPx: 12 }));
  assert.equal(res.snapshot.phase, 'working');
  assert.equal(res.snapshot.keepAwakeActive, false);
  assert.ok(res.events.some((e) => e.type === 'hide_overlay' && e.restoreFocus && e.peakEndFade && e.wakeSeal));

  // 2. Sketch theme -> vellum sealedStyle (never forces frost)
  const sk = SM.createEngine(
    { hasCompletedOnboarding: true, theme: 'sketch', rhythmPreset: 'custom', customBreakSeconds: 10, autoSealOnAway: true },
    { dayKey: '2026-11-19' }
  );
  sk.startBreakNow();
  for (let i = 0; i < 10; i++) {
    res = sk.tick(activeSensor(1.0, { secondsSinceLastKey: 15, secondsSinceLastMouse: 15, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.sealedStyle, 'vellum');

  // 3. Nature Window (bokeh / mist / frost) -> sealedStyle strictly matches activeNatureStyle
  for (const style of ['bokeh', 'mist', 'frost']) {
    const nw = SM.createEngine(
      { hasCompletedOnboarding: true, theme: 'nature_window', natureStyle: style, rhythmPreset: 'custom', customBreakSeconds: 10, autoSealOnAway: true },
      { dayKey: '2026-11-19' }
    );
    nw.startBreakNow();
    for (let i = 0; i < 10; i++) {
      res = nw.tick(activeSensor(1.0, { secondsSinceLastKey: 15, secondsSinceLastMouse: 15, mouseDeltaPx: 0 }));
    }
    assert.equal(res.snapshot.phase, 'sealed');
    assert.equal(res.snapshot.sealedStyle, style);
  }

  // 4. If autoSealOnAway disabled, skips sealed & waits for next input
  geo.updateSettings({ autoSealOnAway: false });
  geo.startBreakNow();
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(1.0, { secondsSinceLastKey: 15, secondsSinceLastMouse: 15, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'waiting_activity');
  res = geo.tick(activeSensor(1.0, { secondsSinceLastKey: 10, secondsSinceLastMouse: 10, mouseDeltaPx: 0 }));
  assert.equal(res.snapshot.workElapsedSec, 0);
  res = geo.tick(activeSensor(1.0, { secondsSinceLastKey: 0.1, secondsSinceLastMouse: 10, mouseDeltaPx: 0 }));
  assert.equal(res.snapshot.phase, 'working');
});

test('Nature Window auto-rotation cycles across bokeh, mist, and frost cleanly', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, theme: 'nature_window', natureStyle: 'auto' },
    { dayKey: '2026-11-19' }
  );
  const styles = [];
  for (let i = 0; i < 3; i++) {
    const r = engine.startBreakNow();
    styles.push(r.snapshot.activeNatureStyle);
  }
  assert.deepEqual(styles, ['bokeh', 'mist', 'frost']);
});

test('Dual rhythm triggers 20m eye rest corner card and 60m formal break', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'dual' },
    { dayKey: '2026-11-18' }
  );

  // 20 minutes -> eye_rest corner_card (no pre_alert)
  for (let i = 0; i < 20 * 60; i++) {
    engine.tick(activeSensor(1.0));
  }
  const snap = engine.getSnapshot();
  assert.equal(snap.phase, 'resting');
  assert.equal(snap.breakKind, 'eye_rest');
  assert.equal(snap.presentationMode, 'corner_card');
  assert.equal(snap.breakDurationSec, 15);
});

test('Mirroring/fullscreen presentation silently avoids interruption', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1 },
    { dayKey: '2026-11-18' }
  );

  for (let i = 0; i < 59; i++) {
    engine.tick(activeSensor(1.0));
  }
  // At 60s, user is screen mirroring
  const res = engine.tick(activeSensor(1.0, { isMirroring: true }));
  assert.equal(res.snapshot.avoiding, true);
  assert.equal(res.snapshot.phase, 'working');
});

test('Low-frequency 10% Easter egg pairs matching pose and dialogue and never repeats immediately', () => {
  const eggAction = Actions.pickBreakAction({
    theme: 'geometric',
    breakKind: 'full',
    lastActionId: 'head_lean',
    random: () => 0.05
  });
  assert.equal(eggAction.easterEgg, 'tea');
  assert.equal(eggAction.pose, 'tea');
  assert.ok(eggAction.message.includes('茶') || eggAction.message.includes('水'));
  assert.ok(eggAction.followup && eggAction.followup.length > 0);

  const sketchYawn = Actions.pickBreakAction({
    theme: 'sketch',
    breakKind: 'full',
    lastActionId: 'head_lean',
    random: () => 0.02
  });
  assert.equal(sketchYawn.easterEgg, 'yawn');
  assert.equal(sketchYawn.pose, 'yawn');
  assert.ok(sketchYawn.message.includes('哈欠'));

  const normalAction = Actions.pickBreakAction({
    theme: 'geometric',
    breakKind: 'full',
    lastActionId: 'head_lean',
    random: () => 0.55
  });
  assert.equal(normalAction.easterEgg, null);
  assert.notEqual(normalAction.actionId, 'head_lean');
  assert.ok(normalAction.followup && normalAction.followup.length > 0);
  assert.ok(Actions.FULL_BREAK_ACTIONS.length >= 10);
  assert.ok(Actions.EYE_REST_ACTIONS.length >= 5);
});

test('Pressing ESC once does not falsely trigger hands-off pause, and snoozing manual break during DND preserves DND', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, exitStrictness: 'standard', handsOffToCount: true },
    { dayKey: '2026-11-18' }
  );
  engine.startBreakNow({ isPreview: false });
  engine.tick(activeSensor(2.2, { secondsSinceLastKey: 5, secondsSinceLastMouse: 5, mouseDeltaPx: 0 }));

  // First ESC press activates escHint; immediate keyIdle=0.1 should NOT trigger handsOffPaused
  engine.handleEscKey();
  const afterEsc = engine.tick(activeSensor(0.5, { secondsSinceLastKey: 0.1, secondsSinceLastMouse: 5, mouseDeltaPx: 0 }));
  assert.equal(afterEsc.snapshot.handsOffPaused, false);

  // Manual break during DND -> snooze exits cleanly without counting snooze strikes
  engine.toggleDnd(true);
  engine.startBreakNow({ isPreview: false });
  const snoozed = engine.snooze();
  assert.equal(snoozed.snapshot.phase, 'working');
  assert.equal(snoozed.snapshot.dndActive, true);
  assert.equal(snoozed.snapshot.consecutiveSnoozes, 0);
});

test('Manual startBreakNow always enters resting even during avoiding, DND, or active typing', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1, customBreakSeconds: 20 },
    { dayKey: '2026-11-18' }
  );

  // Activate avoiding + DND
  engine.toggleDnd(true);
  engine.tick(activeSensor(1.0, { isMirroring: true, secondsSinceLastKey: 0.1 }));
  assert.equal(engine.getSnapshot().avoiding, true);
  assert.equal(engine.getSnapshot().dndActive, true);

  // User explicitly clicks "立即放松一下"
  const res = engine.startBreakNow({ isPreview: false });
  assert.equal(res.snapshot.phase, 'resting');
  assert.ok(res.events.some((e) => e.type === 'show_break'));

  // Subsequent ticks keep break running cleanly
  const t1 = engine.tick(activeSensor(1.0, { isMirroring: true, secondsSinceLastKey: 5 }));
  assert.equal(t1.snapshot.phase, 'resting');
  assert.equal(t1.snapshot.breakRemainingSec, 19);
});

test('Rhythm controls: +15m extend, cycle reset, DND today rollover, and configurable preAlertSeconds', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'golden', preAlertSeconds: 30 },
    { dayKey: '2026-11-19' }
  );

  // Advance 10 minutes -> ~35 minutes remaining
  for (let i = 0; i < 600; i++) {
    engine.tick(activeSensor(1.0));
  }
  assert.equal(engine.getSnapshot().nextBreakRemainingSec, 35 * 60);
  assert.ok(engine.getSnapshot().popoverCopy.rhythmLine.includes('35 分钟'));

  // Proactive +15m extension pushes remaining to 50m without counting as snooze strike
  const ext = engine.extendCurrentCycle(15);
  assert.equal(ext.snapshot.nextBreakRemainingSec, 50 * 60);
  assert.equal(ext.snapshot.consecutiveSnoozes, 0);

  // Reset cycle returns cleanly to 45m
  const rst = engine.resetCurrentCycle();
  assert.equal(rst.snapshot.workElapsedSec, 0);
  assert.equal(rst.snapshot.nextBreakRemainingSec, 45 * 60);

  // DND "today" pauses until next dayKey
  const dndToday = engine.setDndDuration('today');
  assert.equal(dndToday.snapshot.dndActive, true);
  assert.equal(dndToday.snapshot.dndUntilTomorrow, true);
  assert.ok(dndToday.snapshot.popoverCopy.rhythmLine.includes('今天已暂停'));

  const nextDay = engine.tick(activeSensor(1.0, { dayKey: '2026-11-20' }));
  assert.equal(nextDay.snapshot.dndActive, false);
  assert.equal(nextDay.snapshot.dndUntilTomorrow, false);
});

test('Timer resilience: delayed tick advances full dt and waiting_activity resumes reliably after input', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 1 },
    { dayKey: '2026-11-19' }
  );

  // Even if OS coalesced a tick to 15s, workElapsedSec advances by full 15s (not clamped to 5s)
  engine.tick(activeSensor(15.0));
  assert.equal(engine.getSnapshot().workElapsedSec, 15);

  // Idle reset at 5 minutes enters waiting_activity
  engine.tick(activeSensor(1.0, { secondsSinceLastKey: 305, secondsSinceLastMouse: 305, mouseDeltaPx: 0 }));
  assert.equal(engine.getSnapshot().phase, 'waiting_activity');

  // User tapped key 1.2s ago before a 0.5s tick -> reliably wakes into working
  const woke = engine.tick(activeSensor(0.5, { secondsSinceLastKey: 1.2, secondsSinceLastMouse: 305, mouseDeltaPx: 0 }));
  assert.equal(woke.snapshot.phase, 'working');
});

test('Hybrid Curated + Compositional Copy & Modular Action Engine produces rich, paired, non-empty variety', () => {
  assert.ok(Actions.FULL_BREAK_ACTIONS.length >= 20, 'Expanded full break action modules >= 20');

  // Verify both curated paired vignettes and slot-grammar composed lines are generated cleanly
  const seenSealed = new Set();
  const sources = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    for (const theme of ['geometric', 'sketch', 'nature_window']) {
      const v = Actions.pickSealedVignette({
        theme,
        natureStyle: theme === 'nature_window' ? ['bokeh', 'mist', 'frost'][seed % 3] : 'bokeh',
        rotationIndex: seed % 6,
        sealedElapsedSec: 300,
        sessionSeed: seed * 7919
      });
      assert.ok(v.message && v.message.length >= 8);
      assert.ok(v.pose && v.pose.length >= 3);
      seenSealed.add(v.message);
      sources.add(v.source);
    }
  }
  assert.ok(sources.has('curated') && sources.has('composed'), 'Blends both curated paired vignettes and composed slot-grammar lines');
  assert.ok(seenSealed.size >= 45, 'Generates high diversity across sessions without repetition');

  // Verify break action picker covers expanded poses and compositional phrases cleanly
  const seenBreakMessages = new Set();
  const seenPoses = new Set();
  for (let i = 0; i < 80; i++) {
    const act = Actions.pickBreakAction({ theme: i % 2 === 0 ? 'geometric' : 'sketch', breakKind: 'full', workedMinutes: 45 });
    assert.ok(act.message && act.message.length >= 8);
    assert.ok(act.pose);
    seenBreakMessages.add(act.message);
    seenPoses.add(act.pose);
  }
  assert.ok(seenBreakMessages.size >= 25);
  assert.ok(seenPoses.size >= 8);
});
