(function (root) {
  'use strict';

  function makeSpring(initial, k, c) {
    return { x: initial, v: 0, target: initial, k: k || 15, c: c || 7.0 };
  }

  function stepSpring(s, dt) {
    s.v += ((s.target - s.x) * s.k - s.v * s.c) * dt;
    s.x += s.v * dt;
    return s.x;
  }

  /**
   * MoveNow v0.1.0 Minimalist Ink-Sketch Puppy (`sketch.js`)
   * - Preserves the original ultra-clean single-stroke `简笔画` soul:
   *   `var(--sketch-stroke)` + `var(--sketch-paper)` + single-line ears, tail, and limbs,
   *   simple dot eyes & dot nose — ZERO visual clutter or sticker pressure.
   * - Eliminates the old front-facing big pot-belly:
   *   Stretches/bends/twists use airy side-profile puppy sketches, and seated poses use a
   *   petite, narrow, open-bottomed little puppy silhouette (`24px` wide under a `42px` head).
   */
  function createSketchRenderer(container) {
    container.innerHTML =
      '<svg class="mn-sketch-svg" viewBox="0 0 280 224" width="100%" height="100%" aria-hidden="true" style="overflow: visible;">' +
      '  <!-- Quiet ground line -->' +
      '  <path d="M56 176 Q140 178.5 224 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.8" stroke-linecap="round" opacity="0.20" />' +
      '  <!-- Minimalist fluttering 2-stroke ink butterfly -->' +
      '  <g class="sk-fly-group" opacity="0" style="transition: opacity 0.4s ease;">' +
      '    <path class="sk-fly-wings" d="M0 0 Q-5 -6 -8 -1 M0 0 Q5 -6 8 -1" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.8" stroke-linecap="round" />' +
      '  </g>' +
      '  <g class="sk-stage-mover" style="transform-origin: 140px 174px;">' +
      '    <!-- Pose A: Minimalist open-line side stretch / play-bow / perk-up (ZERO big belly!) -->' +
      '    <g class="sk-pose-stretch" style="transition: opacity 0.36s ease;">' +
      '      <g class="sk-stretch-flip" style="transform-origin: 140px 150px;">' +
      '        <g class="sk-stretch-body" style="transform-origin: 140px 174px;">' +
      '          <path class="sk-tail-stretch" d="M98 142 Q80 126 86 112" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-stretch-back" d="M98 143 C108 120, 136 122, 158 138 C165 143, 171 144, 176 141" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" />' +
      '          <path class="sk-stretch-legs" d="M98 143 C96 158, 99 169, 99 175 M111 153 L111 175 M122 153 C135 155, 148 157, 159 159" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-stretch-fore" d="M159 159 C174 169, 190 173, 200 173" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <g class="sk-stretch-head" style="transform-origin: 174px 126px;">' +
      '            <circle cx="176" cy="120" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" />' +
      '            <path d="M163 110 C155 115, 155 128, 163 130" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '            <circle class="sk-eye-a" cx="183" cy="117" r="2.0" fill="var(--sketch-stroke)" />' +
      '            <circle cx="194" cy="121" r="2.2" fill="var(--sketch-stroke)" />' +
      '            <circle cx="183" cy="125" r="3.0" fill="var(--accent)" opacity="0.32" />' +
      '          </g>' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose B: Petite open-bottom minimalist sit (Narrow 24px body under 42px head — NO fat belly!) -->' +
      '    <g class="sk-pose-sit" opacity="0" style="transition: opacity 0.36s ease;">' +
      '      <g class="sk-sit-body" style="transform-origin: 140px 174px;">' +
      '        <path class="sk-tail-sit" d="M126 164 Q108 158 106 145" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <!-- Subtle paper backing (no bottom border!) + two light outer strokes + two slender paw lines -->' +
      '        <path d="M128 140 C125 152, 126 165, 129 174 L151 174 C154 165, 155 152, 152 140 Z" fill="var(--sketch-paper)" stroke="none" />' +
      '        <path d="M128 141 C125 153, 126 165, 129 174 M152 141 C155 153, 154 165, 151 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <g class="sk-paws-rest">' +
      '          <path class="sk-paw-left" d="M135 154 L135 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.5" stroke-linecap="round" />' +
      '          <path class="sk-paw-right" d="M145 154 L145 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.5" stroke-linecap="round" />' +
      '        </g>' +
      '        <!-- Minimalist single-stroke raised paw (only for wrist_shake / paw_groom / cheek_rest) -->' +
      '        <g class="sk-paw-wave" opacity="0" style="transform-origin: 151px 148px;">' +
      '          <path d="M150 149 C162 142, 166 130, 161 122" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '        </g>' +
      '        <g class="sk-sit-head" style="transform-origin: 140px 134px;">' +
      '          <circle cx="140" cy="119" r="21" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" />' +
      '          <path class="sk-ear-l" d="M123 108 C114 115, 114 130, 122 132" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '          <path class="sk-ear-r" d="M157 108 C166 115, 166 130, 158 132" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '          <g class="sk-sit-eyes-open">' +
      '            <circle cx="133" cy="117" r="2.0" fill="var(--sketch-stroke)" />' +
      '            <circle cx="147" cy="117" r="2.0" fill="var(--sketch-stroke)" />' +
      '          </g>' +
      '          <g class="sk-sit-eyes-soft" opacity="0">' +
      '            <path d="M129 118 Q133 114 137 118" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.3" stroke-linecap="round" />' +
      '            <path d="M143 118 Q147 114 151 118" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.3" stroke-linecap="round" />' +
      '          </g>' +
      '          <g class="sk-sit-eyes-closed" opacity="0">' +
      '            <path d="M129 117 Q133 121 137 117" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.3" stroke-linecap="round" />' +
      '            <path d="M143 117 Q147 121 151 117" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.3" stroke-linecap="round" />' +
      '          </g>' +
      '          <circle cx="140" cy="123.5" r="2.2" fill="var(--sketch-stroke)" />' +
      '          <ellipse class="sk-yawn-mouth" cx="140" cy="130" rx="3.4" ry="4.2" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.1" opacity="0" />' +
      '        </g>' +
      '        <g class="sk-cup" opacity="0">' +
      '          <rect x="158" y="158" width="15" height="15" rx="3.5" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.2" />' +
      '          <path d="M173 162 C178 162, 178 169, 173 169" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.0" stroke-linecap="round" />' +
      '          <path class="sk-steam" d="M163 153 Q161 148 165 143 M169 153 Q171 147 167 142" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.5" stroke-linecap="round" opacity="0.42" />' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose C: Slender side-profile gaze / butterfly watch -->' +
      '    <g class="sk-pose-gaze" opacity="0" style="transition: opacity 0.36s ease;">' +
      '      <g class="sk-window">' +
      '        <rect x="174" y="48" width="54" height="68" rx="5" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.8" opacity="0.25" />' +
      '        <line x1="201" y1="48" x2="201" y2="116" stroke="var(--sketch-stroke)" stroke-width="1.3" opacity="0.16" />' +
      '        <line x1="174" y1="82" x2="228" y2="82" stroke="var(--sketch-stroke)" stroke-width="1.3" opacity="0.16" />' +
      '        <circle cx="214" cy="64" r="4.4" fill="var(--accent)" opacity="0.26" />' +
      '      </g>' +
      '      <g class="sk-gaze-body" style="transform-origin: 122px 174px;">' +
      '        <path class="sk-tail-gaze" d="M106 164 Q88 158 86 145" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <path d="M110 136 C104 152, 106 166, 111 174 L134 174 C136 164, 135 150, 131 138 Z" fill="var(--sketch-paper)" stroke="none" />' +
      '        <path d="M110 136 C104 152, 106 166, 111 174 M131 138 C135 152, 135 165, 133 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <g class="sk-gaze-head" style="transform-origin: 122px 126px;">' +
      '          <circle cx="124" cy="115" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" />' +
      '          <path d="M114 106 C105 112, 105 126, 114 128" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '          <circle class="sk-eye-gaze" cx="132" cy="112" r="2.0" fill="var(--sketch-stroke)" />' +
      '          <circle cx="142" cy="116" r="2.2" fill="var(--sketch-stroke)" />' +
      '          <circle cx="132" cy="120" r="2.8" fill="var(--accent)" opacity="0.30" />' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose D: Compact slender side stroll & sniff -->' +
      '    <g class="sk-pose-walk" opacity="0" style="transition: opacity 0.36s ease;">' +
      '      <g class="sk-walk-flip" style="transform-origin: 140px 154px;">' +
      '        <g class="sk-walk-body" style="transform-origin: 140px 174px;">' +
      '          <path class="sk-tail-walk" d="M112 141 Q96 130 100 116" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-leg-1" d="M119 154 L116 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-leg-2" d="M128 154 L131 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-leg-3" d="M148 154 L145 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-leg-4" d="M156 154 L160 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <rect x="112" y="135" width="50" height="22" rx="11" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" />' +
      '          <g class="sk-walk-head" style="transform-origin: 158px 134px;">' +
      '            <circle cx="166" cy="124" r="17.5" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" />' +
      '            <path d="M155 115 C148 120, 148 133, 156 135" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.7" stroke-linecap="round" />' +
      '            <circle cx="173" cy="121" r="2.0" fill="var(--sketch-stroke)" />' +
      '            <circle cx="183" cy="125" r="2.2" fill="var(--sketch-stroke)" />' +
      '            <circle cx="173" cy="128.5" r="2.8" fill="var(--accent)" opacity="0.30" />' +
      '          </g>' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose E: Curled asleep single-curve guardian -->' +
      '    <g class="sk-pose-sleep" opacity="0" style="transition: opacity 0.36s ease;">' +
      '      <g class="sk-sleep-body" style="transform-origin: 140px 174px;">' +
      '        <path class="sk-tail-sleep" d="M102 167 Q90 161 92 151" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '        <path d="M102 174 C98 147, 125 134, 155 143 C175 149, 182 163, 176 174 Z" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" />' +
      '        <path d="M148 156 Q154 160 160 156" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" stroke-linecap="round" />' +
      '        <circle cx="166" cy="161" r="2.1" fill="var(--accent)" opacity="0.55" />' +
      '        <circle class="sk-sleep-bubble" cx="173" cy="151" r="3.8" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="1.5" opacity="0" />' +
      '      </g>' +
      '    </g>' +
      '  </g>' +
      '</svg>';

    const stageMover = container.querySelector('.sk-stage-mover');
    const flyGroup = container.querySelector('.sk-fly-group');
    const flyWings = container.querySelector('.sk-fly-wings');

    const poseStretch = container.querySelector('.sk-pose-stretch');
    const poseSit = container.querySelector('.sk-pose-sit');
    const poseGaze = container.querySelector('.sk-pose-gaze');
    const poseWalk = container.querySelector('.sk-pose-walk');
    const poseSleep = container.querySelector('.sk-pose-sleep');

    const stretchFlip = container.querySelector('.sk-stretch-flip');
    const stretchBody = container.querySelector('.sk-stretch-body');
    const stretchHead = container.querySelector('.sk-stretch-head');
    const sitBody = container.querySelector('.sk-sit-body');
    const sitHead = container.querySelector('.sk-sit-head');
    const gazeBody = container.querySelector('.sk-gaze-body');
    const gazeHead = container.querySelector('.sk-gaze-head');
    const walkFlip = container.querySelector('.sk-walk-flip');
    const walkBody = container.querySelector('.sk-walk-body');
    const walkHead = container.querySelector('.sk-walk-head');
    const sleepBody = container.querySelector('.sk-sleep-body');
    const sleepBubble = container.querySelector('.sk-sleep-bubble');

    const windowBox = container.querySelector('.sk-window');
    const tailStretch = container.querySelector('.sk-tail-stretch');
    const tailSit = container.querySelector('.sk-tail-sit');
    const tailGaze = container.querySelector('.sk-tail-gaze');
    const tailWalk = container.querySelector('.sk-tail-walk');
    const tailSleep = container.querySelector('.sk-tail-sleep');

    const sitEyesOpen = container.querySelector('.sk-sit-eyes-open');
    const sitEyesSoft = container.querySelector('.sk-sit-eyes-soft');
    const sitEyesClosed = container.querySelector('.sk-sit-eyes-closed');
    const yawnMouth = container.querySelector('.sk-yawn-mouth');
    const pawWave = container.querySelector('.sk-paw-wave');
    const pawRight = container.querySelector('.sk-paw-right');
    const cup = container.querySelector('.sk-cup');
    const steam = container.querySelector('.sk-steam');
    const eyeA = container.querySelector('.sk-eye-a');
    const eyeGaze = container.querySelector('.sk-eye-gaze');
    const leg1 = container.querySelector('.sk-leg-1');
    const leg2 = container.querySelector('.sk-leg-2');
    const leg3 = container.querySelector('.sk-leg-3');
    const leg4 = container.querySelector('.sk-leg-4');

    let state = { pose: 'calm', mood: 'calm', easterEgg: null };
    let lastFrameMs = performance.now();
    let cockSide = 1;
    let nextCockFlipAt = 0;
    let nextBlink = 2600;
    let blinkUntil = 0;

    const spPosX = makeSpring(0, 9.0, 5.8);
    const spHeadAngle = makeSpring(0, 20, 7.2);
    const spStretchHead = makeSpring(0, 16, 6.8);
    const spWalkPitch = makeSpring(0, 16, 6.8);

    function resolveMode(pose, isDnd) {
      if (isDnd || pose === 'nap_guard' || pose === 'sleep_bubble') return 'sleep';
      if (pose === 'gaze' || pose === 'butterfly' || pose === 'mote_track' || pose === 'patrol_scan') return 'gaze';
      if (pose === 'walk' || pose === 'sniff' || pose === 'tiptoe_lift' || pose === 'torso_twist_l' || pose === 'torso_twist_r') return 'walk';
      if (
        pose === 'water' || pose === 'tea' || pose === 'tea_blow' ||
        pose === 'cheek_rest' || pose === 'temple_rub' || pose === 'hug_self' ||
        pose === 'neck_tilt' || pose === 'neck_tilt_l' || pose === 'neck_tilt_r' ||
        pose === 'head_cock' || pose === 'paw_groom' || pose === 'wrist_shake' ||
        pose === 'shoulder_roll' || pose === 'breath' || pose === 'happy_squint' ||
        pose === 'yawn' || state.easterEgg === 'yawn' || state.easterEgg === 'tea' || state.mood === 'tired'
      ) {
        return 'sit';
      }
      // All full-body stretches (`stretch_up`, `lean_back`, `chest_open`, `side_bend_l/r`, `arm_circle`, `table_bow`, `play_bow`, `asym_stretch`)
      // use the airy open-line side-profile puppy stretch — zero front-facing big belly!
      return 'stretch';
    }

    function update(nowMs) {
      const dt = Math.min(0.064, Math.max(0.004, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      const t = nowMs / 1000;
      const breath = 0.5 + 0.5 * Math.sin(t * ((2 * Math.PI) / 6.4));

      if (nowMs >= nextBlink) {
        blinkUntil = nowMs + 140;
        nextBlink = nowMs + 2800 + Math.random() * 3200;
      }
      const blinking = nowMs < blinkUntil;
      const pose = state.pose || 'calm';
      const isDnd = state.mood === 'dnd';

      const showButterfly = !isDnd && (pose === 'butterfly' || pose === 'mote_track' || state.easterEgg === 'butterfly');
      flyGroup.setAttribute('opacity', showButterfly ? '0.76' : '0');
      let flyX = 185, flyY = 74;
      if (showButterfly) {
        flyX = 152 + Math.sin(t * 0.9) * 42;
        flyY = 66 + Math.cos(t * 1.4) * 14;
        const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 9.2));
        flyGroup.setAttribute('transform', 'translate(' + flyX.toFixed(1) + ', ' + flyY.toFixed(1) + ')');
        flyWings.setAttribute('transform', 'scale(1, ' + flap.toFixed(2) + ')');
      }

      const activeMode = resolveMode(pose, isDnd);
      poseStretch.setAttribute('opacity', activeMode === 'stretch' ? '1' : '0');
      poseSit.setAttribute('opacity', activeMode === 'sit' ? '1' : '0');
      poseGaze.setAttribute('opacity', activeMode === 'gaze' ? '1' : '0');
      poseWalk.setAttribute('opacity', activeMode === 'walk' ? '1' : '0');
      poseSleep.setAttribute('opacity', activeMode === 'sleep' ? '1' : '0');

      spPosX.target = activeMode === 'walk' && (pose === 'walk' || pose === 'sniff') ? Math.sin(t * 0.85) * 16 : 0;
      const curX = stepSpring(spPosX, dt);
      stageMover.style.transform = 'translateX(' + curX.toFixed(2) + 'px)';

      if (activeMode === 'sleep') {
        sleepBody.style.transform = 'scaleY(' + (1 + breath * 0.038).toFixed(4) + ')';
        const bR = 2.0 + breath * 3.8;
        sleepBubble.setAttribute('r', bR.toFixed(2));
        sleepBubble.setAttribute('cx', (173 + breath * 2.0).toFixed(1));
        sleepBubble.setAttribute('cy', (151 - breath * 2.5).toFixed(1));
        sleepBubble.setAttribute('opacity', (0.28 + breath * 0.40).toFixed(2));
        const gentleSway = Math.sin(t * 1.3) * 2.5;
        tailSleep.setAttribute('d', 'M102 167 Q' + (90 + gentleSway * 0.5).toFixed(1) + ' 161 ' + (92 + gentleSway).toFixed(1) + ' 151');
        return;
      }

      if (activeMode === 'gaze') {
        windowBox.setAttribute('opacity', showButterfly ? '0' : '1');
        gazeBody.style.transform = 'scaleY(' + (1 + breath * 0.022).toFixed(4) + ')';
        const lookAngle = showButterfly ? ((flyY - 102) * 0.22) : (-5 + Math.sin(t * 0.55) * 2.5);
        gazeHead.style.transform = 'rotate(' + lookAngle.toFixed(2) + 'deg)';
        const wag = Math.sin(t * (showButterfly ? 3.2 : 1.7)) * 4.5;
        tailGaze.setAttribute('d', 'M106 164 Q' + (88 + wag * 0.5).toFixed(1) + ' 158 ' + (86 + wag).toFixed(1) + ' 145');
        eyeGaze.setAttribute('r', blinking ? '0.6' : '2.0');
        return;
      }

      if (activeMode === 'walk') {
        const faceLeft = pose === 'torso_twist_l';
        walkFlip.style.transform = faceLeft ? 'scaleX(-1)' : 'scaleX(1)';
        const isTwist = pose === 'torso_twist_l' || pose === 'torso_twist_r';
        const isTiptoe = pose === 'tiptoe_lift';
        const step = (pose === 'walk' || pose === 'sniff') ? Math.sin(t * 3.2) * 5.0 : 0;
        const riseY = isTiptoe ? -Math.pow(0.5 - 0.5 * Math.cos(t * 1.6), 1.3) * 8.5 : -Math.abs(step) * 0.35;

        leg1.setAttribute('d', 'M119 154 L' + (116 + step).toFixed(1) + ' 174');
        leg2.setAttribute('d', 'M128 154 L' + (131 - step).toFixed(1) + ' 174');
        leg3.setAttribute('d', 'M148 154 L' + (145 - step).toFixed(1) + ' 174');
        leg4.setAttribute('d', 'M156 154 L' + (160 + step).toFixed(1) + ' 174');
        walkBody.style.transform = 'translateY(' + riseY.toFixed(2) + 'px)';

        spWalkPitch.target = pose === 'sniff' ? 16 : (isTiptoe ? -11 : (isTwist ? -8 : 0));
        const wp = stepSpring(spWalkPitch, dt);
        walkHead.style.transform = 'rotate(' + wp.toFixed(2) + 'deg)';

        const wag = Math.sin(t * 3.8) * 5.8;
        tailWalk.setAttribute('d', 'M112 141 Q96 130 ' + (100 + wag).toFixed(1) + ' 116');
        return;
      }

      if (activeMode === 'sit') {
        const rollLift = pose === 'shoulder_roll' ? Math.sin(t * 1.5) * 3.0 : 0;
        const sy = 1 + breath * (pose === 'breath' ? 0.038 : 0.022);
        sitBody.style.transform = 'translateY(' + (-rollLift).toFixed(2) + 'px) scaleY(' + sy.toFixed(4) + ')';

        if (pose === 'head_cock' && nowMs >= nextCockFlipAt) {
          cockSide = -cockSide;
          nextCockFlipAt = nowMs + 2000 + Math.random() * 1100;
        }

        if (pose === 'neck_tilt_l') {
          spHeadAngle.target = -14 * (0.85 + 0.15 * breath);
        } else if (pose === 'neck_tilt_r') {
          spHeadAngle.target = 14 * (0.85 + 0.15 * breath);
        } else if (pose === 'neck_tilt') {
          spHeadAngle.target = Math.sin(t * 0.72) * 13.5;
        } else if (pose === 'head_cock') {
          spHeadAngle.target = cockSide * 14.5;
        } else if (pose === 'paw_groom' || pose === 'cheek_rest' || pose === 'temple_rub') {
          spHeadAngle.target = 8.0 + Math.sin(t * 3.8) * 2.5;
        } else if (pose === 'yawn' || state.easterEgg === 'yawn') {
          spHeadAngle.target = Math.sin(t * 1.4) * 5.0;
        } else {
          spHeadAngle.target = 0;
        }
        const curHeadAng = stepSpring(spHeadAngle, dt);
        sitHead.style.transform = 'rotate(' + curHeadAng.toFixed(2) + 'deg)';

        const raisingPaw = (pose === 'wrist_shake' || pose === 'paw_groom' || pose === 'cheek_rest' || pose === 'temple_rub');
        pawWave.setAttribute('opacity', raisingPaw ? '1' : '0');
        pawRight.setAttribute('opacity', raisingPaw ? '0' : '1');
        if (pose === 'paw_groom' || pose === 'temple_rub' || pose === 'cheek_rest') {
          const rub = Math.sin(t * 4.4) * 6 - 10;
          pawWave.style.transform = 'rotate(' + rub.toFixed(2) + 'deg)';
        } else if (pose === 'wrist_shake') {
          pawWave.style.transform = 'rotate(' + (Math.sin(t * 7.2) * 12).toFixed(2) + 'deg)';
        }

        const wag = Math.sin(t * 2.0) * 4.8;
        tailSit.setAttribute('d', 'M126 164 Q' + (108 + wag * 0.5).toFixed(1) + ' 158 ' + (106 + wag).toFixed(1) + ' 145');

        const isYawn = pose === 'yawn' || state.easterEgg === 'yawn';
        const showCup = pose === 'water' || pose === 'tea' || pose === 'tea_blow' || state.easterEgg === 'tea';
        cup.setAttribute('opacity', showCup ? '1' : '0');
        if (showCup) {
          steam.setAttribute('transform', 'translate(0, ' + (-((t * 5.5) % 5)).toFixed(1) + ')');
        }

        if (isYawn) {
          const yawnPhase = 0.5 + 0.5 * Math.sin(t * 1.4);
          sitEyesOpen.setAttribute('opacity', yawnPhase > 0.35 ? '0' : '1');
          sitEyesSoft.setAttribute('opacity', yawnPhase > 0.35 ? '1' : '0');
          sitEyesClosed.setAttribute('opacity', '0');
          yawnMouth.setAttribute('opacity', yawnPhase > 0.35 ? '1' : '0');
          yawnMouth.setAttribute('ry', (2.0 + yawnPhase * 3.0).toFixed(1));
        } else if (pose === 'breath' || pose === 'paw_groom' || pose === 'temple_rub') {
          yawnMouth.setAttribute('opacity', '0');
          sitEyesOpen.setAttribute('opacity', '0');
          sitEyesSoft.setAttribute('opacity', pose === 'breath' ? '0' : '1');
          sitEyesClosed.setAttribute('opacity', pose === 'breath' ? '1' : '0');
        } else if (state.mood === 'refreshed' || pose === 'happy_squint' || pose === 'hug_self' || showCup) {
          yawnMouth.setAttribute('opacity', '0');
          sitEyesOpen.setAttribute('opacity', '0');
          sitEyesSoft.setAttribute('opacity', '1');
          sitEyesClosed.setAttribute('opacity', '0');
        } else {
          yawnMouth.setAttribute('opacity', '0');
          sitEyesClosed.setAttribute('opacity', '0');
          if (blinking || state.mood === 'tired') {
            sitEyesOpen.setAttribute('opacity', '0');
            sitEyesSoft.setAttribute('opacity', '1');
          } else {
            sitEyesOpen.setAttribute('opacity', '1');
            sitEyesSoft.setAttribute('opacity', '0');
          }
        }
        return;
      }

      // Pose A: Minimalist open-line side stretch (flips left/right cleanly for side_bend_l / side_bend_r!)
      const flipLeft = pose === 'side_bend_l';
      stretchFlip.style.transform = flipLeft ? 'scaleX(-1)' : 'scaleX(1)';
      const isUpStretch = (pose === 'stretch_up' || pose === 'lean_back' || pose === 'chest_open' || pose === 'arm_circle');
      spStretchHead.target = isUpStretch ? (-10 - breath * 5) : (2 + breath * 3);
      const shAng = stepSpring(spStretchHead, dt);
      stretchHead.style.transform = 'rotate(' + shAng.toFixed(2) + 'deg)';

      const sy = 1 + breath * 0.032;
      stretchBody.style.transform = 'scaleY(' + sy.toFixed(4) + ')';
      const wagSpeed = (pose === 'play_bow' || pose === 'arm_circle') ? 3.8 : 2.1;
      const wag = Math.sin(t * wagSpeed) * 6.0;
      tailStretch.setAttribute('d', 'M98 142 Q80 126 ' + (86 + wag).toFixed(1) + ' 112');
      eyeA.setAttribute('r', blinking ? '0.6' : '2.0');
    }

    return {
      setState: function (next) {
        state = Object.assign({}, state, next || {});
      },
      update: update
    };
  }

  root.MoveNowThemeSketch = { create: createSketchRenderer };
})(typeof globalThis !== 'undefined' ? globalThis : this);
