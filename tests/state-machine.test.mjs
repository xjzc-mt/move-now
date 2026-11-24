import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Actions = require('../src/ui/core/actions.js');
const SM = require('../src/ui/core/state-machine.js');
const RoamingStage = require('../src/ui/themes/roaming-stage.js');

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

  // Enable preventSleepDuringSeal -> Stage-1 'display' keep-awake becomes active while sealed on AC power
  geo.updateSettings({ preventSleepDuringSeal: true });
  assert.equal(geo.getSnapshot().keepAwakeActive, true);
  assert.equal(geo.getSnapshot().keepAwakeMode, 'display');

  // Advance 10 minutes (600s) while away -> sealedRotationIndex increments & copy rotates
  const firstQuote = res.snapshot.sealedMessage;
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 600, secondsSinceLastMouse: 600, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.sealedRotationIndex, 1);
  assert.notEqual(res.snapshot.sealedMessage, firstQuote);
  assert.equal(res.snapshot.keepAwakeMode, 'display');

  // Advance another 10 minutes (total 20m = 1200s) -> geometric 6th long-away quote available, still Stage-1 'display'
  for (let i = 0; i < 10; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 1200, secondsSinceLastMouse: 1200, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.sealedRotationIndex, 2);
  assert.equal(res.snapshot.keepAwakeMode, 'display');
  const shortAwayCopy = Actions.getSealedCopy({ theme: 'geometric', rotationIndex: 5, sealedElapsedSec: 600 });
  const longAwayCopy = Actions.getSealedCopy({ theme: 'geometric', rotationIndex: 5, sealedElapsedSec: 1200 });
  assert.notEqual(shortAwayCopy, longAwayCopy);
  assert.ok(longAwayCopy.includes('窗边透气'));

  // Advance past 2-hour Stage-1 AC cap (7200s) -> emits stage1_display_handover & steps down to Stage-2 'system'
  let sawHandoverEvent = false;
  for (let i = 0; i < 105; i++) {
    res = geo.tick(activeSensor(60.0, { secondsSinceLastKey: 7500, secondsSinceLastMouse: 7500, mouseDeltaPx: 0 }));
    if (res.events.some((e) => e.type === 'stage1_display_handover')) {
      sawHandoverEvent = true;
    }
  }
  assert.equal(sawHandoverEvent, true, 'Emits polite display sleep handover at 2h mark');
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.keepAwakeMode, 'system');
  assert.equal(res.snapshot.keepAwakeActive, true);

  // User returns and touches mouse -> theme wake animation + releases Stage-2 assertion + begins next work round cleanly
  res = geo.tick(activeSensor(0.5, { secondsSinceLastKey: 7500, secondsSinceLastMouse: 0.1, mouseDeltaPx: 12 }));
  assert.equal(res.snapshot.phase, 'working');
  assert.equal(res.snapshot.keepAwakeMode, 'none');
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

  // 3. Nature Window (sunlight / mist / frost) -> sealedStyle strictly matches activeNatureStyle (and legacy 'bokeh' migrates to 'sunlight')
  for (const style of ['sunlight', 'mist', 'frost']) {
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
  const migratedNw = SM.createEngine({ theme: 'nature_window', natureStyle: 'bokeh' });
  assert.equal(migratedNw.getSnapshot().settings.natureStyle, 'sunlight');

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

test('Nature Window auto-rotation cycles across sunlight, mist, and frost cleanly', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, theme: 'nature_window', natureStyle: 'auto' },
    { dayKey: '2026-11-19' }
  );
  const styles = [];
  for (let i = 0; i < 3; i++) {
    const r = engine.startBreakNow();
    styles.push(r.snapshot.activeNatureStyle);
  }
  assert.deepEqual(styles, ['sunlight', 'mist', 'frost']);
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
    random: () => 0.01
  });
  assert.ok(['tea', 'mote', 'halo', 'cheek'].includes(eggAction.easterEgg));
  assert.ok(eggAction.pose && eggAction.message.length >= 8);
  assert.ok(eggAction.followup && eggAction.followup.length > 0);

  const sketchEgg = Actions.pickBreakAction({
    theme: 'sketch',
    breakKind: 'full',
    lastActionId: 'head_lean',
    random: () => 0.02
  });
  assert.ok(['yawn', 'tea', 'butterfly', 'groom', 'bow'].includes(sketchEgg.easterEgg));
  assert.ok(sketchEgg.pose && sketchEgg.message.length >= 8);

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

test('Timer resilience: delayed tick advances full dt (up to 300s) and waiting_activity resumes reliably after input', () => {
  const engine = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customWorkMinutes: 5 },
    { dayKey: '2026-11-19' }
  );

  // Even if OS coalesced an active tick to 120s, workElapsedSec advances by full 120s without losing time
  engine.tick(activeSensor(120.0));
  assert.equal(engine.getSnapshot().workElapsedSec, 120);

  // Idle reset at 5 minutes still fires before advancing workElapsedSec, entering waiting_activity
  engine.tick(activeSensor(120.0, { secondsSinceLastKey: 305, secondsSinceLastMouse: 305, mouseDeltaPx: 0 }));
  assert.equal(engine.getSnapshot().phase, 'waiting_activity');
  assert.equal(engine.getSnapshot().workElapsedSec, 0);

  // User tapped key 1.2s ago before a 0.5s tick -> reliably wakes into working
  const woke = engine.tick(activeSensor(0.5, { secondsSinceLastKey: 1.2, secondsSinceLastMouse: 305, mouseDeltaPx: 0 }));
  assert.equal(woke.snapshot.phase, 'working');
});

test('Hybrid Curated + Compositional Copy & Modular Action Engine produces rich, paired, non-empty variety', () => {
  assert.equal(Actions.FULL_BREAK_ACTIONS.length, 44, 'Doubled full break action modules = 44');
  assert.equal(Actions.EYE_REST_ACTIONS.length, 12, 'Doubled eye rest modules = 12');

  // Verify both curated paired vignettes and slot-grammar composed lines are generated cleanly
  const seenSealed = new Set();
  const sources = new Set();
  for (let seed = 1; seed <= 40; seed++) {
    for (const theme of ['geometric', 'sketch', 'nature_window']) {
      const v = Actions.pickSealedVignette({
        theme,
        natureStyle: theme === 'nature_window' ? ['sunlight', 'mist', 'frost'][seed % 3] : 'sunlight',
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
  assert.ok(seenSealed.size >= 55, 'Generates high diversity across sessions without repetition');

  // Verify break action picker covers expanded poses, followupPoses, and compositional phrases cleanly
  const seenBreakMessages = new Set();
  const seenPoses = new Set();
  let followupPoseCount = 0;
  for (let i = 0; i < 100; i++) {
    const act = Actions.pickBreakAction({ theme: i % 2 === 0 ? 'geometric' : 'sketch', breakKind: 'full', workedMinutes: 45 });
    assert.ok(act.message && act.message.length >= 8);
    assert.ok(act.pose);
    if (act.followupPose) followupPoseCount += 1;
    seenBreakMessages.add(act.message);
    seenPoses.add(act.pose);
  }
  assert.ok(seenBreakMessages.size >= 40);
  assert.ok(seenPoses.size >= 14);
  assert.ok(followupPoseCount >= 50);
});

test('Dual-Universe Roaming Stage: ZERO shared archetypes between Geometric & Sketch, rhythmic multi-companion visits, and >2.5h (144 stories + 16 copy rotations) with ZERO repeats', () => {
  assert.equal(RoamingStage.GEOMETRIC_ARCHETYPES.length, 72);
  assert.equal(RoamingStage.SKETCH_ARCHETYPES.length, 72);

  const geoSet = new Set(RoamingStage.GEOMETRIC_ARCHETYPES);
  const skSet = new Set(RoamingStage.SKETCH_ARCHETYPES);
  assert.equal(geoSet.size, 72, 'All 72 Geometric archetypes are unique');
  assert.equal(skSet.size, 72, 'All 72 Sketch archetypes are unique');

  for (const id of geoSet) {
    assert.equal(skSet.has(id), false, `Zero overlap allowed between themes, found shared: ${id}`);
  }

  // Simulate > 2.6 hours (144 consecutive story cycles) for BOTH themes -> 0 repeated story keys & early companion visits!
  const stage = RoamingStage.create(null);
  for (const theme of ['geometric', 'sketch']) {
    const first72Ids = new Set();
    const full144Keys = new Set();
    let firstSocialIndex = -1;
    let socialCount = 0;
    let prevId = '';
    for (let i = 0; i < 144; i++) {
      const card = stage._drawNextCardForTest(theme);
      assert.notEqual(card.id, prevId, 'Never repeats adjacent archetype even across pass boundary');
      prevId = card.id;
      if (card.id.includes('_social_')) {
        socialCount += 1;
        if (firstSocialIndex === -1) firstSocialIndex = i;
      }
      if (i < 72) first72Ids.add(card.id);
      full144Keys.add(card.key);
    }
    assert.equal(first72Ids.size, 72, `${theme}: First pass plays all 72 distinct archetypes before any variant`);
    assert.equal(full144Keys.size, 144, `${theme}: Full >2.6h (144 stories) has 0 repeated stories`);
    assert.equal(socialCount, 24, `${theme}: 24 companion social stories across 2 passes`);
    assert.ok(firstSocialIndex >= 0 && firstSocialIndex <= 1, `${theme}: First companion story appears within first 2 stories (got ${firstSocialIndex})`);
  }

  // Simulate > 2.5 hours (16 x 10-min rotations) of Sealed Copy -> 0 repeated quotes!
  for (const theme of ['geometric', 'sketch', 'nature_window']) {
    const quotes = new Set();
    for (let rot = 0; rot < 16; rot++) {
      const q = Actions.getSealedCopy({
        theme,
        natureStyle: 'sunlight',
        rotationIndex: rot,
        sealedElapsedSec: rot * 600,
        sessionSeed: 20261122
      });
      quotes.add(q);
    }
    assert.equal(quotes.size, 16, `${theme}: 160 minutes of Sealed Copy rotations has 0 repeats`);
  }
});

test('Panoramic Multi-Monitor Home-Base & Round-Trip Excursion: Primary hosts home stories while excursions cross onto Secondary and return home in 100% lockstep', () => {
  const screens = [
    { x: 0, y: 200, w: 1440, h: 900, primary: true },
    { x: 1440, y: 0, w: 2560, h: 1440, primary: false }
  ];
  const leftScreen = RoamingStage.create(null);
  const rightScreen = RoamingStage.create(null);

  leftScreen.setTheme('sketch');
  rightScreen.setTheme('sketch');
  leftScreen.setPanoramic({ isPrimary: true, vx: 0, vy: 200, vw: 1440, vh: 900, ww: 4000, wh: 1440, seed: 88482026, originMs: 1700000000000, screens });
  rightScreen.setPanoramic({ isPrimary: false, vx: 1440, vy: 0, vw: 2560, vh: 1440, ww: 4000, wh: 1440, seed: 88482026, originMs: 1700000000000, screens });

  // 1. Default 'home' story stays strictly confined to Primary Screen (0..1440)
  leftScreen._forceStory('sk_social_circle_tail_powwow', 0);
  rightScreen._forceStory('sk_social_circle_tail_powwow', 0);
  const homeL = leftScreen._stepDeterministicForTest(350);
  const homeR = rightScreen._stepDeterministicForTest(350);
  assert.equal(homeL.scope, 'home');
  assert.equal(homeR.scope, 'home');
  assert.ok(homeL.worldX > 0 && homeL.worldX < 1440, 'Home story stays inside Primary Screen');
  assert.equal(homeL.worldX, homeR.worldX, 'Bit-for-bit identical worldX across monitors');

  // 2. Curated cross-screen excursion starts on Primary -> visits Secondary (>1440) -> returns to Primary (<1440)!
  leftScreen._forceStory('sk_social_duckling_breed_parade', 0);
  rightScreen._forceStory('sk_social_duckling_breed_parade', 0);

  const startState = leftScreen._stepDeterministicForTest(20);
  rightScreen._stepDeterministicForTest(20);
  assert.equal(startState.scope, 'panoramic');
  assert.ok(startState.worldX < 1440, `Excursion departs from Primary Screen (got ${startState.worldX})`);

  const midVisitL = leftScreen._stepDeterministicForTest(650); // ~13.4s -> mid-visit on Secondary Screen!
  const midVisitR = rightScreen._stepDeterministicForTest(650);
  assert.ok(midVisitL.worldX > 1440, `Excursion crosses bezel onto Secondary Screen (got ${midVisitL.worldX})`);
  assert.equal(midVisitL.worldX, midVisitR.worldX, 'Lockstep worldX on Secondary Screen');
  assert.equal(midVisitL.firstCompX, midVisitR.firstCompX, 'Lockstep companion positions on Secondary Screen');

  const returnedL = leftScreen._stepDeterministicForTest(850); // ~30.4s -> back on Primary Screen!
  const returnedR = rightScreen._stepDeterministicForTest(850);
  assert.ok(returnedL.worldX < 1440, `Excursion returns home onto Primary Screen before sleeping (got ${returnedL.worldX})`);
  assert.equal(returnedL.worldX, returnedR.worldX, 'Lockstep worldX upon homecoming');

  // 3. Vertically Stacked Displays (MacBook Primary [bottom y:1440..2422] + External Monitor Secondary [top y:0..1440])!
  const vScreens = [
    { x: 544, y: 1440, w: 1512, h: 982, primary: true },
    { x: 0, y: 0, w: 2560, h: 1440, primary: false }
  ];
  const bottomMac = RoamingStage.create(null);
  const topExt = RoamingStage.create(null);
  bottomMac.setTheme('sketch');
  topExt.setTheme('sketch');
  bottomMac.setPanoramic({ isPrimary: true, vx: 544, vy: 1440, vw: 1512, vh: 982, ww: 2560, wh: 2422, seed: 20261124, originMs: 1700000000000, screens: vScreens });
  topExt.setPanoramic({ isPrimary: false, vx: 0, vy: 0, vw: 2560, vh: 1440, ww: 2560, wh: 2422, seed: 20261124, originMs: 1700000000000, screens: vScreens });

  bottomMac._forceStory('sk_social_duckling_breed_parade', 0);
  topExt._forceStory('sk_social_duckling_breed_parade', 0);
  const vStart = bottomMac._stepDeterministicForTest(15);
  topExt._stepDeterministicForTest(15);
  assert.ok(vStart.worldY > 1440, `Starts on bottom Primary MacBook (got y=${vStart.worldY})`);

  const vVisit = bottomMac._stepDeterministicForTest(650);
  const vVisitTop = topExt._stepDeterministicForTest(650);
  assert.ok(vVisit.worldY < 1440, `Climbs across top bezel onto upper External Monitor (got y=${vVisit.worldY})`);
  assert.equal(vVisit.worldY, vVisitTop.worldY, 'Lockstep vertical worldY across stacked displays');

  const vHome = bottomMac._stepDeterministicForTest(850);
  topExt._stepDeterministicForTest(850);
  assert.ok(vHome.worldY > 1440, `Returns back down onto bottom Primary MacBook (got y=${vHome.worldY})`);
});

test('Adaptive Power-Aware Two-Stage Keep-Awake: preserves Stage-2 across OS screen lock, tightens on battery, and yields below 20% / Low Power Mode', () => {
  const eng = SM.createEngine(
    { hasCompletedOnboarding: true, rhythmPreset: 'custom', customBreakSeconds: 10, autoSealOnAway: true, preventSleepDuringSeal: true },
    { dayKey: '2026-11-24' }
  );

  // 1. Enter sealed mode on AC power -> Stage-1 'display'
  eng.startBreakNow();
  let res;
  for (let i = 0; i < 10; i++) {
    res = eng.tick(activeSensor(1.0, { secondsSinceLastKey: 15, secondsSinceLastMouse: 15, mouseDeltaPx: 0 }));
  }
  assert.equal(res.snapshot.phase, 'sealed');
  assert.equal(res.snapshot.keepAwakeMode, 'display');

  // 2. Unplug to Battery (65%) -> still 'display' under 25m, then steps down to 'system' at 25m (1500s)
  for (let i = 0; i < 26; i++) {
    res = eng.tick(activeSensor(60.0, { secondsSinceLastKey: 1600, secondsSinceLastMouse: 1600, mouseDeltaPx: 0, onBattery: true, batteryPercent: 65 }));
  }
  assert.equal(res.snapshot.keepAwakeMode, 'system');

  // 3. OS locks screen after Stage-1 handover -> Stage-2 'system' SURVIVES screen lock to keep background Agents alive!
  res = eng.tick(activeSensor(60.0, { secondsSinceLastKey: 1700, secondsSinceLastMouse: 1700, mouseDeltaPx: 0, onBattery: true, batteryPercent: 65, isLockedOrAsleep: true }));
  assert.equal(res.snapshot.phase, 'waiting_activity');
  assert.equal(res.snapshot.keepAwakeMode, 'system');
  assert.equal(res.snapshot.keepAwakeActive, true);

  // 4. Battery drops to 18% (< 20%) -> immediately releases all assertions to save power!
  res = eng.tick(activeSensor(60.0, { secondsSinceLastKey: 1800, secondsSinceLastMouse: 1800, mouseDeltaPx: 0, onBattery: true, batteryPercent: 18, isLockedOrAsleep: true }));
  assert.equal(res.snapshot.keepAwakeMode, 'none');
  assert.equal(res.snapshot.keepAwakeActive, false);

  // 5. Plug back into AC while still away (< 12h) -> resumes Stage-2 'system', then auto-releases past 12h (43200s)
  res = eng.tick(activeSensor(60.0, { secondsSinceLastKey: 1900, secondsSinceLastMouse: 1900, mouseDeltaPx: 0, onBattery: false, batteryPercent: 25, isLockedOrAsleep: true }));
  assert.equal(res.snapshot.keepAwakeMode, 'system');
  for (let i = 0; i < 145; i++) {
    res = eng.tick(activeSensor(300.0, { secondsSinceLastKey: 45000, secondsSinceLastMouse: 45000, mouseDeltaPx: 0, onBattery: false, isLockedOrAsleep: true }));
  }
  assert.equal(res.snapshot.keepAwakeMode, 'none');
});
