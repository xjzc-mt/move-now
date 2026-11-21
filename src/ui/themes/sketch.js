(function (root) {
  'use strict';

  function makeSpring(initial, k, c) {
    return { x: initial, v: 0, target: initial, k: k || 16, c: c || 7.0 };
  }

  function stepSpring(s, dt) {
    s.v += ((s.target - s.x) * s.k - s.v * s.c) * dt;
    s.x += s.v * dt;
    return s.x;
  }

  function createSketchRenderer(container) {
    container.innerHTML =
      '<svg class="mn-sketch-svg" viewBox="0 0 280 224" width="100%" height="100%" aria-hidden="true" style="overflow: visible;">' +
      '  <!-- Quiet ground line -->' +
      '  <path d="M46 178 Q140 181 234 178" fill="none" stroke="var(--sketch-stroke)" stroke-width="2" stroke-linecap="round" opacity="0.22" />' +
      '  <!-- Minimalist fluttering paper-speck / butterfly (for butterfly watch behavior) -->' +
      '  <g class="sk-fly-group" opacity="0" style="transition: opacity 0.4s ease;">' +
      '    <path class="sk-fly-wings" d="M0 0 Q-5 -6 -8 -1 M0 0 Q5 -6 8 -1" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.8" stroke-linecap="round" />' +
      '  </g>' +
      '  <g class="sk-stage-mover">' +
      '    <!-- Pose A: Unhurried stretch & play_bow -->' +
      '    <g class="sk-pose-stretch" style="transition: opacity 0.42s ease;">' +
      '      <g class="sk-stretch-body" style="transform-origin: 140px 172px;">' +
      '        <path class="sk-tail-stretch" d="M94 140 Q76 124 82 110" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path d="M94 142 C104 116, 136 118, 158 136 C166 143, 172 145, 178 142" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '        <path d="M94 142 C92 158, 96 170, 96 176 M108 154 L108 176 M120 154 C134 156, 148 158, 160 160" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path d="M160 160 C176 170, 194 174, 204 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <circle cx="178" cy="120" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '        <path d="M165 109 C156 114, 156 128, 164 130" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <circle class="sk-eye-a" cx="184" cy="117" r="2.1" fill="var(--sketch-stroke)" />' +
      '        <circle cx="196" cy="121" r="2.4" fill="var(--sketch-stroke)" />' +
      '        <circle cx="185" cy="125" r="3.4" fill="var(--accent)" opacity="0.38" />' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose B: Seated front-facing (cup / head_cock / paw_groom / yawn / breath / wrist_shake) -->' +
      '    <g class="sk-pose-sit" opacity="0" style="transition: opacity 0.42s ease;">' +
      '      <g class="sk-sit-body" style="transform-origin: 140px 174px;">' +
      '        <path class="sk-tail-sit" d="M114 158 Q94 152 92 138" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path d="M118 126 C112 148, 114 168, 122 176 L158 176 C164 166, 164 144, 156 126" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '        <g class="sk-paws-rest">' +
      '          <path d="M126 148 C124 160, 126 170, 131 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '          <path class="sk-paw-right" d="M152 148 C154 160, 152 170, 147 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '        </g>' +
      '        <!-- Raised paw (for wrist_shake OR paw_groom face rub!) -->' +
      '        <g class="sk-paw-wave" opacity="0" style="transform-origin: 156px 144px;">' +
      '          <path d="M154 146 C168 138, 174 124, 168 114" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <circle cx="168" cy="112" r="2.8" fill="var(--accent)" opacity="0.42" />' +
      '        </g>' +
      '        <g class="sk-sit-head" style="transform-origin: 138px 120px;">' +
      '          <circle cx="138" cy="102" r="23" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '          <path class="sk-ear-l" d="M120 90 C110 98, 110 114, 118 116" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <path class="sk-ear-r" d="M156 90 C166 98, 166 114, 158 116" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <g class="sk-sit-eyes-open">' +
      '            <circle cx="131" cy="99" r="2.1" fill="var(--sketch-stroke)" />' +
      '            <circle cx="147" cy="99" r="2.1" fill="var(--sketch-stroke)" />' +
      '          </g>' +
      '          <g class="sk-sit-eyes-soft" opacity="0">' +
      '            <path d="M127 100 Q131 96 135 100" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '            <path d="M143 100 Q147 96 151 100" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '          </g>' +
      '          <g class="sk-sit-eyes-closed" opacity="0">' +
      '            <path d="M127 99 Q131 103 135 99" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '            <path d="M143 99 Q147 103 151 99" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '          </g>' +
      '          <circle cx="139" cy="106" r="2.4" fill="var(--sketch-stroke)" />' +
      '          <ellipse class="sk-yawn-mouth" cx="139" cy="114" rx="4" ry="4.8" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" opacity="0" />' +
      '        </g>' +
      '        <g class="sk-cup" opacity="0">' +
      '          <rect x="130" y="141" width="18" height="16" rx="4" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.4" />' +
      '          <rect x="131" y="142" width="16" height="14" rx="3" fill="var(--accent)" opacity="0.22" />' +
      '          <path d="M148 145 C154 145, 154 153, 148 153" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" stroke-linecap="round" />' +
      '          <path class="sk-steam" d="M136 136 Q134 130 138 125 M143 136 Q145 129 141 124" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose C: Side-profile gaze / butterfly watch -->' +
      '    <g class="sk-pose-gaze" opacity="0" style="transition: opacity 0.42s ease;">' +
      '      <g class="sk-window">' +
      '        <rect x="174" y="48" width="56" height="70" rx="5" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.9" opacity="0.28" />' +
      '        <line x1="202" y1="48" x2="202" y2="118" stroke="var(--sketch-stroke)" stroke-width="1.4" opacity="0.18" />' +
      '        <line x1="174" y1="83" x2="230" y2="83" stroke="var(--sketch-stroke)" stroke-width="1.4" opacity="0.18" />' +
      '        <circle cx="215" cy="64" r="4.8" fill="var(--accent)" opacity="0.28" />' +
      '      </g>' +
      '      <g class="sk-gaze-body" style="transform-origin: 122px 174px;">' +
      '        <path class="sk-tail-gaze" d="M100 164 Q80 158 78 144" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path d="M102 128 C94 148, 98 170, 106 176 L138 176 C142 164, 140 146, 134 130" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '        <g class="sk-gaze-head" style="transform-origin: 120px 118px;">' +
      '          <circle cx="124" cy="108" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '          <path d="M114 99 C105 105, 105 120, 114 122" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <circle class="sk-eye-gaze" cx="132" cy="105" r="2.1" fill="var(--sketch-stroke)" />' +
      '          <circle cx="143" cy="109" r="2.4" fill="var(--sketch-stroke)" />' +
      '          <circle cx="132" cy="113" r="3" fill="var(--accent)" opacity="0.34" />' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose D: Unhurried stroll & ground sniff -->' +
      '    <g class="sk-pose-walk" opacity="0" style="transition: opacity 0.42s ease;">' +
      '      <g class="sk-walk-body" style="transform-origin: 140px 174px;">' +
      '        <path class="sk-tail-walk" d="M102 136 Q86 124 90 110" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path class="sk-leg-1" d="M110 154 L106 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path class="sk-leg-2" d="M122 154 L126 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path class="sk-leg-3" d="M150 154 L146 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <path class="sk-leg-4" d="M160 154 L166 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '        <rect x="102" y="130" width="64" height="28" rx="14" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '        <g class="sk-walk-head" style="transform-origin: 164px 128px;">' +
      '          <circle cx="172" cy="118" r="18" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '          <path d="M161 108 C153 113, 153 127, 161 129" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '          <circle cx="179" cy="115" r="2.1" fill="var(--sketch-stroke)" />' +
      '          <circle cx="190" cy="119" r="2.4" fill="var(--sketch-stroke)" />' +
      '          <circle cx="179" cy="123" r="3" fill="var(--accent)" opacity="0.34" />' +
      '        </g>' +
      '      </g>' +
      '    </g>' +
      '    <!-- Pose E: Curled asleep guardian + sleep bubble + steaming cup -->' +
      '    <g class="sk-pose-sleep" opacity="0" style="transition: opacity 0.42s ease;">' +
      '      <g class="sk-sleep-body" style="transform-origin: 140px 174px;">' +
      '        <path class="sk-tail-sleep" d="M98 166 Q86 160 88 150" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '        <path d="M98 174 C94 144, 124 130, 156 140 C178 146, 186 162, 180 174 Z" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '        <path d="M148 154 Q155 158 162 154" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" stroke-linecap="round" />' +
      '        <circle cx="168" cy="160" r="2.2" fill="var(--accent)" opacity="0.65" />' +
      '        <circle class="sk-sleep-bubble" cx="176" cy="150" r="4" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="1.6" opacity="0" />' +
      '      </g>' +
      '      <g class="sk-sleep-cup" opacity="0">' +
      '        <rect x="194" y="158" width="15" height="15" rx="3.5" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.2" />' +
      '        <rect x="195" y="159" width="13" height="13" rx="2.5" fill="var(--accent)" opacity="0.20" />' +
      '        <path d="M209 162 C214 162, 214 169, 209 169" fill="none" stroke="var(--sketch-stroke)" stroke-width="2" stroke-linecap="round" />' +
      '        <path class="sk-sleep-steam" d="M199 153 Q197 147 201 142 M205 153 Q207 146 203 141" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.6" stroke-linecap="round" opacity="0.42" />' +
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

    const stretchBody = container.querySelector('.sk-stretch-body');
    const sitBody = container.querySelector('.sk-sit-body');
    const sitHead = container.querySelector('.sk-sit-head');
    const gazeBody = container.querySelector('.sk-gaze-body');
    const gazeHead = container.querySelector('.sk-gaze-head');
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
    const sleepCup = container.querySelector('.sk-sleep-cup');
    const sleepSteam = container.querySelector('.sk-sleep-steam');

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

    let state = { pose: 'calm', anchorPose: null, autonomous: false, mood: 'calm', easterEgg: null };
    let lastFrameMs = performance.now();

    // Spring-damper physical channels
    const spPosX = makeSpring(0, 7.5, 5.2);
    const spHeadAngle = makeSpring(0, 22, 7.2);
    const spWalkSniff = makeSpring(0, 18, 6.8);

    // Autonomous Markov Puppy Brain (crisp 3.8~6.8s organic beats so life loop is immediately vivid!)
    const AUTO_PUPPY_POOL = [
      { pose: 'nap_guard', weight: 1.9, minSec: 4.0, maxSec: 6.8 },
      { pose: 'sleep_bubble', weight: 1.7, minSec: 4.2, maxSec: 6.8 },
      { pose: 'head_cock', weight: 1.7, minSec: 3.8, maxSec: 6.0 },
      { pose: 'yawn', weight: 1.4, minSec: 3.8, maxSec: 5.8 },
      { pose: 'paw_groom', weight: 1.5, minSec: 4.0, maxSec: 6.2 },
      { pose: 'play_bow', weight: 1.4, minSec: 3.8, maxSec: 5.8 },
      { pose: 'walk', weight: 1.7, minSec: 4.5, maxSec: 7.0 },
      { pose: 'sniff', weight: 1.4, minSec: 3.8, maxSec: 5.8 },
      { pose: 'butterfly', weight: 1.6, minSec: 4.5, maxSec: 7.2 },
      { pose: 'water', weight: 1.3, minSec: 4.2, maxSec: 6.5 }
    ];

    let brainPose = 'nap_guard';
    let brainSwitchAt = 0;
    let lastAnchorKey = '';
    let strollTargetX = 0;
    let cockSide = 1;
    let nextCockFlipAt = 0;
    let nextBlink = 2600;
    let blinkUntil = 0;

    function pickNextPuppyBehavior(nowMs) {
      let total = 0;
      for (let i = 0; i < AUTO_PUPPY_POOL.length; i++) {
        if (AUTO_PUPPY_POOL[i].pose !== brainPose) total += AUTO_PUPPY_POOL[i].weight;
      }
      let roll = Math.random() * total;
      let chosen = AUTO_PUPPY_POOL[0];
      for (let i = 0; i < AUTO_PUPPY_POOL.length; i++) {
        const item = AUTO_PUPPY_POOL[i];
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

      if (brainPose === 'walk') {
        // Pick a fresh spot along the sketch horizon line!
        const dir = strollTargetX > 10 ? -1 : (strollTargetX < -10 ? 1 : (Math.random() < 0.5 ? 1 : -1));
        strollTargetX = dir * (22 + Math.random() * 34);
      } else if (brainPose === 'nap_guard' || brainPose === 'sleep_bubble') {
        strollTargetX *= 0.25; // gently settle back near center nest
      }
      cockSide = Math.random() < 0.5 ? 1 : -1;
      nextCockFlipAt = nowMs + 2200;
    }

    function update(nowMs) {
      const dt = Math.min(0.064, Math.max(0.004, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;
      const t = nowMs / 1000;
      const breath = 0.5 + 0.5 * Math.sin(t * ((2 * Math.PI) / 6.2));

      if (state.autonomous && nowMs >= brainSwitchAt) {
        pickNextPuppyBehavior(nowMs);
      }
      const pose = state.autonomous ? brainPose : (state.pose || 'calm');

      if (nowMs >= nextBlink) {
        blinkUntil = nowMs + 140;
        nextBlink = nowMs + 2800 + Math.random() * 3000;
      }
      const blinking = nowMs < blinkUntil;
      const isDnd = state.mood === 'dnd';

      spPosX.target = state.autonomous ? strollTargetX : 0;
      const curX = stepSpring(spPosX, dt);
      stageMover.style.transform = 'translateX(' + curX.toFixed(2) + 'px)';

      const showButterfly = (pose === 'butterfly' || pose === 'mote_track' || state.easterEgg === 'butterfly');
      flyGroup.setAttribute('opacity', showButterfly ? '0.78' : '0');
      let flyX = 185, flyY = 74;
      if (showButterfly) {
        flyX = 152 + Math.sin(t * 0.95) * 44;
        flyY = 66 + Math.cos(t * 1.45) * 16;
        const flap = 0.55 + 0.45 * Math.abs(Math.sin(t * 9.5));
        flyGroup.setAttribute('transform', 'translate(' + flyX.toFixed(1) + ', ' + flyY.toFixed(1) + ')');
        flyWings.setAttribute('transform', 'scale(1, ' + flap.toFixed(2) + ')');
      }

      const activeMode = (isDnd || pose === 'nap_guard' || pose === 'sleep_bubble')
        ? 'sleep'
        : (pose === 'gaze' || pose === 'butterfly' || pose === 'mote_track' || pose === 'patrol_scan')
          ? 'gaze'
          : (pose === 'walk' || pose === 'sniff')
            ? 'walk'
            : (pose === 'water' || pose === 'tea' || pose === 'tea_blow' || pose === 'cheek_rest' || pose === 'neck_tilt' || pose === 'head_cock' || pose === 'paw_groom' || pose === 'wrist_shake' || pose === 'shoulder_roll' || pose === 'breath' || pose === 'yawn' || state.easterEgg === 'yawn' || state.mood === 'tired')
              ? 'sit'
              : 'stretch';

      poseStretch.setAttribute('opacity', activeMode === 'stretch' ? '1' : '0');
      poseSit.setAttribute('opacity', activeMode === 'sit' ? '1' : '0');
      poseGaze.setAttribute('opacity', activeMode === 'gaze' ? '1' : '0');
      poseWalk.setAttribute('opacity', activeMode === 'walk' ? '1' : '0');
      poseSleep.setAttribute('opacity', activeMode === 'sleep' ? '1' : '0');

      if (activeMode === 'sleep') {
        sleepBody.style.transform = 'scaleY(' + (1 + breath * 0.044).toFixed(4) + ')';
        const hasCup = (pose === 'nap_guard' || pose === 'sleep_bubble');
        sleepCup.setAttribute('opacity', hasCup ? '1' : '0');
        if (hasCup && sleepSteam) {
          sleepSteam.setAttribute('transform', 'translate(' + (Math.sin(t * 2.1) * 1.8).toFixed(1) + ', ' + (-((t * 5.5) % 5.5)).toFixed(1) + ')');
        }
        // Sleep bubble gently expanding & popping with breath!
        if (pose === 'sleep_bubble') {
          const bR = 2.2 + breath * 4.4;
          sleepBubble.setAttribute('r', bR.toFixed(2));
          sleepBubble.setAttribute('cx', (175 + breath * 2.5).toFixed(1));
          sleepBubble.setAttribute('cy', (151 - breath * 3.0).toFixed(1));
          sleepBubble.setAttribute('opacity', (0.30 + breath * 0.45).toFixed(2));
        } else {
          sleepBubble.setAttribute('opacity', '0');
        }
        const gentleSway = Math.sin(t * 1.35) * 2.8;
        const twitch = Math.sin(t * 0.65) > 0.78 ? Math.sin(t * 7.8) * 4.5 : 0;
        const totalTail = gentleSway + twitch;
        tailSleep.setAttribute('d', 'M98 166 Q' + (86 + totalTail * 0.45).toFixed(1) + ' 160 ' + (88 + totalTail).toFixed(1) + ' 150');
        return;
      }

      if (activeMode === 'gaze') {
        windowBox.setAttribute('opacity', pose === 'butterfly' ? '0' : '1');
        gazeBody.style.transform = 'scaleY(' + (1 + breath * 0.025).toFixed(4) + ')';
        const wag = Math.sin(t * 1.9) * 5.5;
        tailGaze.setAttribute('d', 'M100 164 Q' + (80 + wag * 0.5).toFixed(1) + ' 158 ' + (78 + wag).toFixed(1) + ' 144');
        eyeGaze.setAttribute('r', blinking ? '0.6' : '2.1');
        if (pose === 'butterfly') {
          const lookPitch = (flyY - 95) * 0.25;
          gazeHead.style.transform = 'rotate(' + lookPitch.toFixed(1) + 'deg)';
        } else {
          gazeHead.style.transform = 'rotate(0deg)';
        }
        return;
      }

      if (activeMode === 'walk') {
        const isSniff = pose === 'sniff';
        spWalkSniff.target = isSniff ? 1 : 0;
        const sniffVal = stepSpring(spWalkSniff, dt);

        if (isSniff) {
          walkBody.style.transform = 'translateY(1px)';
          const sniffBob = Math.sin(t * 8.5) * 2.4;
          walkHead.style.transform = 'translate(2px, ' + (14 * sniffVal + sniffBob * 0.5).toFixed(1) + 'px) rotate(' + (22 * sniffVal).toFixed(1) + 'deg)';
          const fastWag = Math.sin(t * 6.5) * 6.5;
          tailWalk.setAttribute('d', 'M102 136 Q86 124 ' + (90 + fastWag).toFixed(1) + ' 110');
          leg1.setAttribute('d', 'M110 154 L108 176');
          leg2.setAttribute('d', 'M122 154 L124 176');
          leg3.setAttribute('d', 'M150 154 L148 176');
          leg4.setAttribute('d', 'M160 154 L164 176');
        } else {
          const stride = Math.sin(t * 3.8);
          const bob = Math.abs(stride) * 3.2;
          walkBody.style.transform = 'translateY(' + (-bob).toFixed(2) + 'px)';
          walkHead.style.transform = 'rotate(' + (Math.sin(t * 1.9) * 3.5).toFixed(1) + 'deg)';
          leg1.setAttribute('d', 'M110 154 L' + (106 + stride * 7.5).toFixed(1) + ' 176');
          leg2.setAttribute('d', 'M122 154 L' + (126 - stride * 7.5).toFixed(1) + ' 176');
          leg3.setAttribute('d', 'M150 154 L' + (146 - stride * 7.5).toFixed(1) + ' 176');
          leg4.setAttribute('d', 'M160 154 L' + (166 + stride * 7.5).toFixed(1) + ' 176');
          const wag = Math.sin(t * 3.8) * 5.5;
          tailWalk.setAttribute('d', 'M102 136 Q86 124 ' + (90 + wag).toFixed(1) + ' 110');
        }
        return;
      }

      if (activeMode === 'sit') {
        const rollLift = pose === 'shoulder_roll' ? Math.sin(t * 1.5) * 3.5 : 0;
        const sy = 1 + breath * (pose === 'breath' ? 0.042 : 0.024);
        sitBody.style.transform = 'translateY(' + (-rollLift).toFixed(2) + 'px) scaleY(' + sy.toFixed(4) + ')';

        if (pose === 'head_cock' && nowMs >= nextCockFlipAt) {
          cockSide = -cockSide;
          nextCockFlipAt = nowMs + 1900 + Math.random() * 1100;
        }

        if (pose === 'neck_tilt') {
          spHeadAngle.target = Math.sin(t * 0.72) * 14;
        } else if (pose === 'head_cock') {
          spHeadAngle.target = cockSide * 15.5;
        } else if (pose === 'paw_groom') {
          spHeadAngle.target = 8.5 + Math.sin(t * 5.2) * 3.0;
        } else if (pose === 'yawn' || state.easterEgg === 'yawn') {
          spHeadAngle.target = Math.sin(t * 1.4) * 5.5;
        } else {
          spHeadAngle.target = 0;
        }
        const curHeadAng = stepSpring(spHeadAngle, dt);
        sitHead.style.transform = 'rotate(' + curHeadAng.toFixed(2) + 'deg)';

        const raisingPaw = (pose === 'wrist_shake' || pose === 'paw_groom');
        pawWave.setAttribute('opacity', raisingPaw ? '1' : '0');
        pawRight.setAttribute('opacity', raisingPaw ? '0' : '1');
        if (pose === 'paw_groom') {
          // Rubbing cheek gently with front paw!
          const rub = Math.sin(t * 5.2) * 8 - 10;
          pawWave.style.transform = 'rotate(' + rub.toFixed(2) + 'deg)';
        } else if (pose === 'wrist_shake') {
          pawWave.style.transform = 'rotate(' + (Math.sin(t * 8.5) * 14).toFixed(2) + 'deg)';
        }

        const wag = Math.sin(t * 2.1) * 5.2;
        tailSit.setAttribute('d', 'M114 158 Q' + (94 + wag * 0.5).toFixed(1) + ' 152 ' + (92 + wag).toFixed(1) + ' 138');

        const isYawn = pose === 'yawn' || state.easterEgg === 'yawn';
        const showCup = pose === 'water' || pose === 'tea' || pose === 'tea_blow';
        cup.setAttribute('opacity', showCup ? '1' : '0');
        if (showCup) {
          steam.setAttribute('transform', 'translate(0, ' + (-((t * 6) % 5)).toFixed(1) + ')');
        }

        if (isYawn) {
          const yawnPhase = 0.5 + 0.5 * Math.sin(t * 1.4);
          sitEyesOpen.setAttribute('opacity', yawnPhase > 0.35 ? '0' : '1');
          sitEyesSoft.setAttribute('opacity', yawnPhase > 0.35 ? '1' : '0');
          sitEyesClosed.setAttribute('opacity', '0');
          yawnMouth.setAttribute('opacity', yawnPhase > 0.35 ? '1' : '0');
          yawnMouth.setAttribute('ry', (2.2 + yawnPhase * 3.5).toFixed(1));
        } else if (pose === 'breath' || pose === 'paw_groom') {
          yawnMouth.setAttribute('opacity', '0');
          sitEyesOpen.setAttribute('opacity', '0');
          sitEyesSoft.setAttribute('opacity', pose === 'paw_groom' ? '1' : '0');
          sitEyesClosed.setAttribute('opacity', pose === 'breath' ? '1' : '0');
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

      // Stretch / play_bow pose
      const bowExtra = pose === 'play_bow' ? 0.035 : 0;
      const sy = 1 + breath * (0.028 + bowExtra);
      stretchBody.style.transform = 'scaleY(' + sy.toFixed(4) + ')';
      const wagSpeed = pose === 'play_bow' ? 4.2 : 2.1;
      const wag = Math.sin(t * wagSpeed) * 6.5;
      tailStretch.setAttribute('d', 'M94 140 Q76 124 ' + (82 + wag).toFixed(1) + ' 110');
      eyeA.setAttribute('r', blinking ? '0.6' : '2.1');
    }

    return {
      setState: function (next) {
        const prevAuto = state.autonomous;
        state = Object.assign({}, state, next || {});
        if (state.autonomous) {
          const anchorKey = (state.anchorPose || '') + '|' + (state.anchorToken || '');
          if (!prevAuto || (state.anchorPose && anchorKey !== lastAnchorKey)) {
            lastAnchorKey = anchorKey;
            brainPose = state.anchorPose || 'nap_guard';
            const startDelay = brainPose === 'nap_guard' ? (3200 + Math.random() * 1800) : (4800 + Math.random() * 2000);
            brainSwitchAt = performance.now() + startDelay;
            if (brainPose === 'walk') {
              strollTargetX = (Math.random() < 0.5 ? 1 : -1) * (24 + Math.random() * 28);
            }
          }
        } else {
          strollTargetX = 0;
        }
      },
      update: update
    };
  }

  root.MoveNowThemeSketch = { create: createSketchRenderer };
})(typeof globalThis !== 'undefined' ? globalThis : this);
