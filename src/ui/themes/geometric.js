(function (root) {
  'use strict';

  let instanceSeq = 0;

  function makeSpring(initial, stiffness, damping) {
    return { x: initial, v: 0, target: initial, k: stiffness || 18, c: damping || 7.5 };
  }

  function stepSpring(s, dt) {
    const f = (s.target - s.x) * s.k - s.v * s.c;
    s.v += f * dt;
    s.x += s.v * dt;
    return s.x;
  }

  function createGeometricRenderer(container) {
    const filterId = 'mn-geo-soft-' + (++instanceSeq);

    container.innerHTML =
      '<svg class="mn-geo-svg" viewBox="0 0 260 224" width="100%" height="100%" aria-hidden="true" style="overflow: visible;">' +
      '  <defs>' +
      '    <filter id="' + filterId + '" x="-25%" y="-25%" width="150%" height="150%">' +
      '      <feGaussianBlur stdDeviation="12" />' +
      '    </filter>' +
      '  </defs>' +
      '  <ellipse class="geo-shadow" cx="130" cy="194" rx="56" ry="10.5" fill="currentColor" opacity="0.08" />' +
      '  <circle class="geo-aura" cx="130" cy="118" r="72" fill="var(--halo-primary)" filter="url(#' + filterId + ')" />' +
      '  <!-- Floating inspiration dust mote (tracked by eyes & head in mote_track) -->' +
      '  <g class="geo-mote-group" opacity="0">' +
      '    <circle class="geo-mote-halo" cx="130" cy="54" r="9" fill="var(--accent)" opacity="0.22" />' +
      '    <circle class="geo-mote-dot" cx="130" cy="54" r="3.2" fill="var(--accent)" opacity="0.88" />' +
      '  </g>' +
      '  <g class="geo-body-group" style="transform-origin: 130px 180px;">' +
      '    <!-- Spring-driven modular left & right arms -->' +
      '    <path class="geo-arm-left" d="M72 128 C56 134, 54 158, 68 166" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" opacity="0.90" />' +
      '    <path class="geo-arm-right" d="M188 128 C204 134, 206 158, 192 166" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" opacity="0.90" />' +
      '    <!-- Main organic pebble body -->' +
      '    <path class="geo-torso" d="M130 46 C172 46, 196 78, 196 122 C196 166, 172 184, 130 184 C88 184, 64 166, 64 122 C64 78, 88 46, 130 46 Z" fill="var(--accent)" />' +
      '    <!-- Subtle matte top highlight -->' +
      '    <path d="M98 62 C114 54, 144 54, 158 61" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.22" />' +
      '    <!-- Face group -->' +
      '    <g class="geo-face">' +
      '      <g class="geo-eyes-open">' +
      '        <ellipse class="geo-eye-l" cx="111" cy="108" rx="5.2" ry="6.4" fill="var(--ink)" />' +
      '        <ellipse class="geo-eye-r" cx="149" cy="108" rx="5.2" ry="6.4" fill="var(--ink)" />' +
      '        <circle class="geo-glint-l" cx="109.5" cy="105.5" r="1.6" fill="#FFFFFF" opacity="0.72" />' +
      '        <circle class="geo-glint-r" cx="147.5" cy="105.5" r="1.6" fill="#FFFFFF" opacity="0.72" />' +
      '      </g>' +
      '      <g class="geo-eyes-happy" opacity="0">' +
      '        <path d="M104 110 Q111 102 118 110" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round" />' +
      '        <path d="M142 110 Q149 102 156 110" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round" />' +
      '      </g>' +
      '      <g class="geo-eyes-closed" opacity="0">' +
      '        <path d="M104 108 Q111 114 118 108" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <path d="M142 108 Q149 114 156 108" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />' +
      '      </g>' +
      '      <path class="geo-mouth" d="M124 122 Q130 126 136 122" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" opacity="0.76" />' +
      '    </g>' +
      '    <!-- Tea / Water cup -->' +
      '    <g class="geo-cup" opacity="0">' +
      '      <rect x="117" y="138" width="26" height="22" rx="6" fill="var(--sketch-paper)" stroke="var(--ink)" stroke-width="2.2" />' +
      '      <path d="M143 144 C150 144, 150 154, 143 154" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />' +
      '      <path class="geo-steam-1" d="M125 133 Q122 126 126 120" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />' +
      '      <path class="geo-steam-2" d="M134 133 Q137 125 133 118" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />' +
      '    </g>' +
      '  </g>' +
      '</svg>';

    const bodyGroup = container.querySelector('.geo-body-group');
    const shadow = container.querySelector('.geo-shadow');
    const aura = container.querySelector('.geo-aura');
    const moteGroup = container.querySelector('.geo-mote-group');
    const moteHalo = container.querySelector('.geo-mote-halo');
    const moteDot = container.querySelector('.geo-mote-dot');
    const face = container.querySelector('.geo-face');
    const eyesOpen = container.querySelector('.geo-eyes-open');
    const eyesHappy = container.querySelector('.geo-eyes-happy');
    const eyesClosed = container.querySelector('.geo-eyes-closed');
    const eyeL = container.querySelector('.geo-eye-l');
    const eyeR = container.querySelector('.geo-eye-r');
    const mouth = container.querySelector('.geo-mouth');
    const armLeft = container.querySelector('.geo-arm-left');
    const armRight = container.querySelector('.geo-arm-right');
    const cup = container.querySelector('.geo-cup');
    const steam1 = container.querySelector('.geo-steam-1');
    const steam2 = container.querySelector('.geo-steam-2');

    let state = { pose: 'calm', anchorPose: null, autonomous: false, mood: 'calm', easterEgg: null };
    let lastFrameMs = performance.now();

    // Spring-damper channels (ultra-low CPU: ~15 floats/frame < 0.03ms)
    const spPosX = makeSpring(0, 12, 6.2);
    const spPosY = makeSpring(0, 20, 7.8);
    const spRot = makeSpring(0, 16, 6.8);
    const spScaleX = makeSpring(1, 22, 8.0);
    const spScaleY = makeSpring(1, 22, 8.0);
    const spGazeX = makeSpring(0, 26, 8.5);
    const spGazeY = makeSpring(0, 26, 8.5);
    const spCup = makeSpring(0, 14, 6.5);
    const spMote = makeSpring(0, 10, 5.5);

    // Modular Left & Right Arm control points [cx1, cy1, ex, ey]
    const spArmL = [makeSpring(56, 20, 7.5), makeSpring(136, 20, 7.5), makeSpring(68, 20, 7.5), makeSpring(166, 20, 7.5)];
    const spArmR = [makeSpring(204, 20, 7.5), makeSpring(136, 20, 7.5), makeSpring(192, 20, 7.5), makeSpring(166, 20, 7.5)];

    // Autonomous Markov Brain state (crisp 3.8~7.0s organic beats so motion is immediately vivid!)
    const AUTO_POOL = [
      { pose: 'guardian', weight: 2.0, minSec: 4.0, maxSec: 6.8 },
      { pose: 'patrol_scan', weight: 1.8, minSec: 3.8, maxSec: 6.2 },
      { pose: 'cheek_rest', weight: 1.6, minSec: 4.2, maxSec: 6.8 },
      { pose: 'mote_track', weight: 1.8, minSec: 4.5, maxSec: 7.2 },
      { pose: 'nod_doze', weight: 1.4, minSec: 4.2, maxSec: 6.5 },
      { pose: 'asym_stretch', weight: 1.5, minSec: 3.8, maxSec: 5.8 },
      { pose: 'tea_blow', weight: 1.6, minSec: 4.5, maxSec: 7.0 },
      { pose: 'shoulder_roll', weight: 1.1, minSec: 3.6, maxSec: 5.5 },
      { pose: 'walk', weight: 1.5, minSec: 4.2, maxSec: 6.5 },
      { pose: 'happy_squint', weight: 1.1, minSec: 3.4, maxSec: 5.2 }
    ];
    let brainPose = 'guardian';
    let brainSwitchAt = 0;
    let lastAnchorKey = '';
    let strollTargetX = 0;
    let asymSide = 1;
    let moteSeedPhase = Math.random() * 10;

    // Natural irregular blinking & micro eye saccades
    let nextBlinkAt = 2200;
    let blinkEndAt = 0;
    let wanderGazeX = 0;
    let wanderGazeY = 0;
    let nextSaccadeAt = 1800;

    function pickNextBrainBehavior(nowMs) {
      let total = 0;
      for (let i = 0; i < AUTO_POOL.length; i++) {
        if (AUTO_POOL[i].pose !== brainPose) total += AUTO_POOL[i].weight;
      }
      let roll = Math.random() * total;
      let chosen = AUTO_POOL[0];
      for (let i = 0; i < AUTO_POOL.length; i++) {
        const item = AUTO_POOL[i];
        if (item.pose === brainPose) continue;
        roll -= item.weight;
        if (roll <= 0) {
          chosen = item;
          break;
        }
      }
      brainPose = chosen.pose;
      const dur = chosen.minSec + Math.random() * (chosen.maxSec - chosen.minSec);
      brainSwitchAt = nowMs + dur * 1000;

      // Randomize physical parameters per improvisation so no two loops ever match!
      if (brainPose === 'walk') {
        strollTargetX = (Math.random() - 0.5) * 64;
      } else if (Math.random() < 0.35) {
        strollTargetX *= 0.4;
      }
      asymSide = Math.random() < 0.5 ? 1 : -1;
      moteSeedPhase = Math.random() * Math.PI * 2;
    }

    function setArmTargets(l, r) {
      for (let i = 0; i < 4; i++) {
        spArmL[i].target = l[i];
        spArmR[i].target = r[i];
      }
    }

    function breathCurve(tSec, speedMult) {
      const cycle = (tSec * (speedMult || 1)) % 9.6;
      if (cycle < 3.8) {
        return 0.5 - 0.5 * Math.cos(Math.PI * (cycle / 3.8));
      }
      return 0.5 + 0.5 * Math.cos(Math.PI * ((cycle - 3.8) / 5.8));
    }

    function update(nowMs) {
      const dt = Math.min(0.064, Math.max(0.004, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      const t = nowMs / 1000;

      // Autonomous Markov orchestration
      if (state.autonomous) {
        if (nowMs >= brainSwitchAt) {
          pickNextBrainBehavior(nowMs);
        }
      }
      const activePose = state.autonomous ? brainPose : (state.pose || 'calm');
      const isDnd = state.mood === 'dnd';
      const isTired = state.mood === 'tired';
      const isRefreshed = state.mood === 'refreshed';

      const b = breathCurve(t, isDnd ? 0.78 : 1.0);
      const amp = isDnd ? 0.45 : (activePose === 'breath' ? 1.32 : 1.0);

      // Default neutral targets
      let targetX = state.autonomous ? strollTargetX : 0;
      let targetY = -b * 4.8 * amp;
      let targetRot = 0;
      let targetSX = 1 + (0.5 - b) * 0.030 * amp;
      let targetSY = 1 + (b - 0.5) * 0.042 * amp;
      let targetCup = (activePose === 'tea' || activePose === 'tea_blow' || activePose === 'water' || state.easterEgg === 'tea') ? 1 : 0;
      let targetMote = (activePose === 'mote_track' || activePose === 'butterfly' || state.easterEgg === 'mote') ? 1 : 0;

      // Micro gaze wander
      if (nowMs >= nextSaccadeAt) {
        wanderGazeX = (Math.random() - 0.5) * 3.4;
        wanderGazeY = (Math.random() - 0.5) * 2.2;
        nextSaccadeAt = nowMs + 1600 + Math.random() * 2800;
      }
      let targetGX = wanderGazeX;
      let targetGY = (isTired ? 2.4 : 0) + wanderGazeY;

      // Floating mote trajectory
      const mx = 130 + Math.sin(t * 0.85 + moteSeedPhase) * 68 + Math.cos(t * 0.42) * 18;
      const my = 56 + Math.cos(t * 0.68 + moteSeedPhase) * 24;
      if (targetMote > 0.05) {
        moteDot.setAttribute('cx', mx.toFixed(1));
        moteDot.setAttribute('cy', my.toFixed(1));
        moteHalo.setAttribute('cx', mx.toFixed(1));
        moteHalo.setAttribute('cy', my.toFixed(1));
      }

      // Pose-driven spring targets (modular arms + torso + gaze)
      const drop = (1 - b) * 4.2;
      let armL = [58, 138 + drop, 70, 168];
      let armR = [202, 138 + drop, 190, 168];

      if (activePose === 'guardian') {
        targetY = 3.5 - b * 3.0;
        targetRot = Math.sin(t * 0.31) * 2.4;
        armL = [62, 144, 82, 170];
        armR = [198, 144, 178, 170];
      } else if (activePose === 'nod_doze') {
        // Slowly nods forward drowsily, then gently perks back up!
        const nodCycle = (t * 0.55) % 4.0;
        const nodDrop = nodCycle < 2.8 ? (nodCycle / 2.8) : Math.max(0, 1 - (nodCycle - 2.8) * 3.2);
        targetRot = nodDrop * 7.5;
        targetY = nodDrop * 5.5;
        targetGY = nodDrop * 4.2;
        armL = [62, 146, 80, 172];
        armR = [198, 146, 180, 172];
      } else if (activePose === 'patrol_scan') {
        const scan = Math.sin(t * 1.05);
        targetGX = scan * 7.8;
        targetGY = -1.2;
        targetRot = scan * 3.8;
      } else if (activePose === 'mote_track' || activePose === 'butterfly') {
        targetGX = Math.max(-8.5, Math.min(8.5, (mx - 130) * 0.11));
        targetGY = Math.max(-6.5, Math.min(4.5, (my - 102) * 0.10));
        targetRot = (mx - 130) * 0.055;
      } else if (activePose === 'head_cock') {
        const side = Math.sin(t * 1.15) >= 0 ? 1 : -1;
        targetRot = side * 9.5;
        targetGX = side * 4.5;
        targetGY = -1.5;
      } else if (activePose === 'paw_groom') {
        // Warm palms covering eyes / rubbing temples gently!
        const rub = Math.sin(t * 2.8) * 3.5;
        armL = [72, 98 + rub, 108, 106];
        armR = [188, 98 - rub, 152, 106];
        targetY = -2.0;
      } else if (activePose === 'cheek_rest') {
        targetRot = 5.2 + Math.sin(t * 0.5) * 1.2;
        targetGX = 2.8;
        targetGY = -1.5;
        // Right hand propped up under right cheek, left hand relaxed!
        armL = [58, 142, 72, 168];
        armR = [208, 134, 176, 126];
      } else if (activePose === 'asym_stretch') {
        const lift = b * 10;
        targetRot = -asymSide * (5.5 + b * 2.5);
        targetSY = 1.03 + b * 0.045;
        targetGY = -2.8;
        if (asymSide > 0) {
          armL = [56, 82 - lift, 96, 34 - lift * 0.5];
          armR = [204, 140, 188, 166];
        } else {
          armL = [56, 140, 72, 166];
          armR = [204, 82 - lift, 164, 34 - lift * 0.5];
        }
      } else if (activePose === 'lean_back') {
        targetRot = -3.0 - b * 2.0;
        targetGY = -3.2;
        armL = [56, 98, 86, 86];
        armR = [204, 98, 174, 86];
      } else if (activePose === 'chest_open') {
        const open = b * 8;
        armL = [50 - open, 122, 58 - open * 0.5, 156];
        armR = [210 + open, 122, 202 + open * 0.5, 156];
      } else if (activePose === 'stretch_up' || activePose === 'play_bow') {
        const lift = b * 12;
        targetSY = 1.03 + b * 0.058;
        targetSX = 0.98 - b * 0.024;
        targetY = -b * 8.5;
        targetGY = -3.4;
        armL = [58, 80 - lift, 102, 34 - lift * 0.5];
        armR = [202, 80 - lift, 158, 34 - lift * 0.5];
      } else if (activePose === 'wrist_shake') {
        const w1 = Math.sin(t * 9.2) * 7;
        armL = [48, 112, 50 + w1, 88];
        armR = [212, 112, 210 - w1, 88];
      } else if (activePose === 'shoulder_roll') {
        const ang = t * 1.5;
        const rx = Math.cos(ang) * 6;
        const ry = Math.sin(ang) * 8;
        targetY = -ry * 0.5;
        armL = [56 + rx, 132 + ry, 70, 166];
        armR = [204 - rx, 132 + ry, 190, 166];
      } else if (activePose === 'neck_tilt') {
        targetRot = Math.sin(t * 0.72) * 8.8;
        targetGX = Math.sin(t * 0.72) * 3.2;
      } else if (activePose === 'gaze') {
        targetGX = Math.sin(t * 0.45) * 5.8 + 2.8;
        targetGY = -2.0;
      } else if (activePose === 'walk' || activePose === 'sniff') {
        const step = Math.sin(t * 3.4);
        targetX = (state.autonomous ? strollTargetX : 0) + Math.sin(t * 1.3) * 18;
        targetY = -Math.abs(step) * 6.5;
        targetRot = step * 3.8;
        armL = [56, 136 + step * 11, 70, 164 + step * 7];
        armR = [204, 136 - step * 11, 190, 164 - step * 7];
      }

      if (targetCup > 0.5) {
        armL = [82, 146, 116, 148];
        armR = [178, 146, 146, 148];
        if (activePose === 'tea_blow') {
          targetGY = 2.4;
          targetRot = Math.sin(t * 0.6) * 1.8;
        }
      }

      // Step all springs forward
      spPosX.target = targetX;
      spPosY.target = targetY;
      spRot.target = targetRot;
      spScaleX.target = targetSX;
      spScaleY.target = targetSY;
      spGazeX.target = targetGX;
      spGazeY.target = targetGY;
      spCup.target = targetCup;
      spMote.target = targetMote;
      setArmTargets(armL, armR);

      const px = stepSpring(spPosX, dt);
      const py = stepSpring(spPosY, dt);
      const rot = stepSpring(spRot, dt);
      const sx = stepSpring(spScaleX, dt);
      const sy = stepSpring(spScaleY, dt);
      const gx = stepSpring(spGazeX, dt);
      const gy = stepSpring(spGazeY, dt);
      const cupVal = Math.max(0, Math.min(1, stepSpring(spCup, dt)));
      const moteVal = Math.max(0, Math.min(1, stepSpring(spMote, dt)));

      const l0 = stepSpring(spArmL[0], dt), l1 = stepSpring(spArmL[1], dt), l2 = stepSpring(spArmL[2], dt), l3 = stepSpring(spArmL[3], dt);
      const r0 = stepSpring(spArmR[0], dt), r1 = stepSpring(spArmR[1], dt), r2 = stepSpring(spArmR[2], dt), r3 = stepSpring(spArmR[3], dt);

      bodyGroup.style.transform =
        'translate(' + px.toFixed(2) + 'px, ' + py.toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sx.toFixed(4) + ', ' + sy.toFixed(4) + ')';

      armLeft.setAttribute('d', 'M72 128 C' + l0.toFixed(1) + ' ' + l1.toFixed(1) + ', ' + (l0 + 2).toFixed(1) + ' ' + (l3 - 8).toFixed(1) + ', ' + l2.toFixed(1) + ' ' + l3.toFixed(1));
      armRight.setAttribute('d', 'M188 128 C' + r0.toFixed(1) + ' ' + r1.toFixed(1) + ', ' + (r0 - 2).toFixed(1) + ' ' + (r3 - 8).toFixed(1) + ', ' + r2.toFixed(1) + ' ' + r3.toFixed(1));

      shadow.setAttribute('cx', (130 + px * 0.92).toFixed(1));
      shadow.setAttribute('rx', Math.max(42, 56 + py * 0.6).toFixed(1));
      aura.setAttribute('cx', (130 + px * 0.6).toFixed(1));
      aura.setAttribute('r', (68 + b * 12 * amp).toFixed(1));

      moteGroup.setAttribute('opacity', moteVal.toFixed(2));
      cup.setAttribute('opacity', cupVal.toFixed(2));
      if (cupVal > 0.05) {
        const blowDrift = activePose === 'tea_blow' ? (4.5 + Math.sin(t * 2.4) * 3.0) : (Math.sin(t * 2.1) * 2.2);
        steam1.setAttribute('transform', 'translate(' + blowDrift.toFixed(1) + ', ' + (-((t * 8) % 6.5)).toFixed(1) + ')');
        steam2.setAttribute('transform', 'translate(' + (blowDrift * 0.7).toFixed(1) + ', ' + (-(((t + 0.6) * 8) % 6.5)).toFixed(1) + ')');
      }

      face.setAttribute('transform', 'translate(' + gx.toFixed(2) + ', ' + gy.toFixed(2) + ')');

      // Irregular human-like blinking (occasional double-blink!)
      if (nowMs >= nextBlinkAt) {
        blinkEndAt = nowMs + 145;
        const doubleBlink = Math.random() < 0.22;
        nextBlinkAt = nowMs + (doubleBlink ? 320 : (2600 + Math.random() * 3400));
      }
      const blinking = nowMs < blinkEndAt;

      const dozeClosed = activePose === 'nod_doze' && ((t * 0.55) % 4.0) < 2.7;
      if (isDnd || activePose === 'breath' || activePose === 'paw_groom' || activePose === 'guardian' || dozeClosed || blinking) {
        eyesOpen.setAttribute('opacity', '0');
        eyesHappy.setAttribute('opacity', '0');
        eyesClosed.setAttribute('opacity', '1');
      } else if (isRefreshed || activePose === 'happy_squint' || activePose === 'guardian_wake' || activePose === 'tea_blow') {
        eyesOpen.setAttribute('opacity', '0');
        eyesHappy.setAttribute('opacity', '1');
        eyesClosed.setAttribute('opacity', '0');
      } else {
        eyesOpen.setAttribute('opacity', '1');
        eyesHappy.setAttribute('opacity', '0');
        eyesClosed.setAttribute('opacity', '0');
        const eyeRy = isTired ? 4.2 : 6.4;
        eyeL.setAttribute('ry', String(eyeRy));
        eyeR.setAttribute('ry', String(eyeRy));
      }

      if (activePose === 'tea_blow') {
        mouth.setAttribute('d', 'M128 123 Q130 126 132 123');
      } else {
        mouth.setAttribute('d', 'M124 122 Q130 126 136 122');
      }
    }

    return {
      setState: function (next) {
        const prevAuto = state.autonomous;
        state = Object.assign({}, state, next || {});
        if (state.autonomous) {
          const anchorKey = (state.anchorPose || '') + '|' + (state.anchorToken || '');
          if (!prevAuto || (state.anchorPose && anchorKey !== lastAnchorKey)) {
            lastAnchorKey = anchorKey;
            brainPose = state.anchorPose || 'guardian';
            const startDelay = brainPose === 'guardian' ? (3200 + Math.random() * 1800) : (4800 + Math.random() * 2000);
            brainSwitchAt = performance.now() + startDelay;
            if (brainPose === 'walk') strollTargetX = (Math.random() - 0.5) * 60;
          }
        }
      },
      update: update
    };
  }

  root.MoveNowThemeGeometric = { create: createGeometricRenderer };
})(typeof globalThis !== 'undefined' ? globalThis : this);
