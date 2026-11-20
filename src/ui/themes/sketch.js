(function (root) {
  'use strict';

  function createSketchRenderer(container) {
    container.innerHTML =
      '<svg class="mn-sketch-svg" viewBox="0 0 260 220" width="100%" height="100%" aria-hidden="true">' +
      '  <!-- Quiet ground line -->' +
      '  <path d="M52 176 Q130 179 208 176" fill="none" stroke="var(--sketch-stroke)" stroke-width="2" stroke-linecap="round" opacity="0.22" />' +
      '  <!-- Pose A: Unhurried stretch (chest_open / stretch_up / lean_back / default) -->' +
      '  <g class="sk-pose-stretch" style="transition: opacity 0.45s ease;">' +
      '    <g class="sk-stretch-body" style="transform-origin: 130px 170px;">' +
      '      <path class="sk-tail-stretch" d="M84 138 Q66 122 72 108" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path d="M84 140 C94 114, 126 116, 148 134 C156 141, 162 143, 168 140" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '      <path d="M84 140 C82 156, 86 168, 86 174 M98 152 L98 174 M110 152 C124 154, 138 156, 150 158" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path d="M150 158 C166 168, 184 172, 194 172" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <circle cx="168" cy="118" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '      <path d="M155 107 C146 112, 146 126, 154 128" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '      <circle class="sk-eye-a" cx="174" cy="115" r="2.1" fill="var(--sketch-stroke)" />' +
      '      <circle cx="186" cy="119" r="2.4" fill="var(--sketch-stroke)" />' +
      '      <circle cx="175" cy="123" r="3.4" fill="var(--accent)" opacity="0.38" />' +
      '    </g>' +
      '  </g>' +
      '  <!-- Pose B: Seated front-facing (cup / neck_tilt / wrist_shake / shoulder_roll / breath / yawn / tired) -->' +
      '  <g class="sk-pose-sit" opacity="0" style="transition: opacity 0.45s ease;">' +
      '    <g class="sk-sit-body" style="transform-origin: 130px 172px;">' +
      '      <path class="sk-tail-sit" d="M104 156 Q84 150 82 136" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path d="M108 124 C102 146, 104 166, 112 174 L148 174 C154 164, 154 142, 146 124" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '      <!-- Resting little paws -->' +
      '      <g class="sk-paws-rest">' +
      '        <path d="M116 146 C114 158, 116 168, 121 172" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '        <path class="sk-paw-right" d="M142 146 C144 158, 142 168, 137 172" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '      </g>' +
      '      <!-- Raised waving/shaking paw (wrist_shake) -->' +
      '      <g class="sk-paw-wave" opacity="0" style="transform-origin: 148px 144px;">' +
      '        <path d="M146 144 C162 138, 170 126, 166 116" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <circle cx="166" cy="114" r="3" fill="var(--accent)" opacity="0.45" />' +
      '      </g>' +
      '      <!-- Head group (supports smooth neck_tilt rotation) -->' +
      '      <g class="sk-sit-head" style="transform-origin: 128px 118px;">' +
      '        <circle cx="128" cy="100" r="23" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '        <path d="M110 88 C100 96, 100 112, 108 114" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <path d="M146 88 C156 96, 156 112, 148 114" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <g class="sk-sit-eyes-open">' +
      '          <circle cx="121" cy="97" r="2.1" fill="var(--sketch-stroke)" />' +
      '          <circle cx="137" cy="97" r="2.1" fill="var(--sketch-stroke)" />' +
      '        </g>' +
      '        <g class="sk-sit-eyes-soft" opacity="0">' +
      '          <path d="M117 98 Q121 94 125 98" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '          <path d="M133 98 Q137 94 141 98" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '        </g>' +
      '        <g class="sk-sit-eyes-closed" opacity="0">' +
      '          <path d="M117 97 Q121 101 125 97" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '          <path d="M133 97 Q137 101 141 97" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.4" stroke-linecap="round" />' +
      '        </g>' +
      '        <circle cx="129" cy="104" r="2.4" fill="var(--sketch-stroke)" />' +
      '        <ellipse class="sk-yawn-mouth" cx="129" cy="112" rx="4" ry="4.8" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" opacity="0" />' +
      '      </g>' +
      '      <!-- Small warm cup (water / tea) -->' +
      '      <g class="sk-cup" opacity="0">' +
      '        <rect x="120" y="139" width="18" height="16" rx="4" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.4" />' +
      '        <rect x="121" y="140" width="16" height="14" rx="3" fill="var(--accent)" opacity="0.22" />' +
      '        <path d="M138 143 C144 143, 144 151, 138 151" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" stroke-linecap="round" />' +
      '        <path class="sk-steam" d="M126 134 Q124 128 128 123 M133 134 Q135 127 131 122" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.7" stroke-linecap="round" opacity="0.45" />' +
      '      </g>' +
      '    </g>' +
      '  </g>' +
      '  <!-- Pose C: Side-profile window gaze (gaze) -->' +
      '  <g class="sk-pose-gaze" opacity="0" style="transition: opacity 0.45s ease;">' +
      '    <g class="sk-window">' +
      '      <rect x="160" y="48" width="58" height="72" rx="5" fill="none" stroke="var(--sketch-stroke)" stroke-width="2" opacity="0.34" />' +
      '      <line x1="189" y1="48" x2="189" y2="120" stroke="var(--sketch-stroke)" stroke-width="1.5" opacity="0.20" />' +
      '      <line x1="160" y1="84" x2="218" y2="84" stroke="var(--sketch-stroke)" stroke-width="1.5" opacity="0.20" />' +
      '      <circle cx="203" cy="65" r="5" fill="var(--accent)" opacity="0.28" />' +
      '    </g>' +
      '    <g class="sk-gaze-body" style="transform-origin: 112px 172px;">' +
      '      <path class="sk-tail-gaze" d="M90 162 Q70 156 68 142" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <!-- Side seated back & front paw -->' +
      '      <path d="M92 126 C84 146, 88 168, 96 174 L128 174 C132 162, 130 144, 124 128" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '      <!-- Side-profile head looking right toward window -->' +
      '      <circle cx="114" cy="106" r="19" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '      <path d="M104 97 C95 103, 95 118, 104 120" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '      <circle class="sk-eye-gaze" cx="122" cy="103" r="2.1" fill="var(--sketch-stroke)" />' +
      '      <circle cx="133" cy="107" r="2.4" fill="var(--sketch-stroke)" />' +
      '      <circle cx="122" cy="111" r="3" fill="var(--accent)" opacity="0.34" />' +
      '    </g>' +
      '  </g>' +
      '  <!-- Pose D: Unhurried stroll (walk) -->' +
      '  <g class="sk-pose-walk" opacity="0" style="transition: opacity 0.45s ease;">' +
      '    <g class="sk-walk-body" style="transform-origin: 130px 172px;">' +
      '      <path class="sk-tail-walk" d="M92 134 Q76 122 80 108" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path class="sk-leg-1" d="M100 152 L96 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path class="sk-leg-2" d="M112 152 L116 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path class="sk-leg-3" d="M140 152 L136 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <path class="sk-leg-4" d="M150 152 L156 174" fill="none" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" />' +
      '      <rect x="92" y="128" width="64" height="28" rx="14" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '      <circle cx="162" cy="116" r="18" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" />' +
      '      <path d="M151 106 C143 111, 143 125, 151 127" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.8" stroke-linecap="round" />' +
      '      <circle cx="169" cy="113" r="2.1" fill="var(--sketch-stroke)" />' +
      '      <circle cx="180" cy="117" r="2.4" fill="var(--sketch-stroke)" />' +
      '      <circle cx="169" cy="121" r="3" fill="var(--accent)" opacity="0.34" />' +
      '    </g>' +
      '  </g>' +
      '  <!-- Pose E: DND / curled asleep guardian (with optional quiet cup) -->' +
      '  <g class="sk-pose-sleep" opacity="0" style="transition: opacity 0.45s ease;">' +
      '    <g class="sk-sleep-body" style="transform-origin: 130px 172px;">' +
      '      <path class="sk-tail-sleep" d="M88 164 Q76 158 78 148" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.6" stroke-linecap="round" />' +
      '      <path d="M88 172 C84 142, 114 128, 146 138 C168 144, 176 160, 170 172 Z" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />' +
      '      <path d="M138 152 Q145 156 152 152" fill="none" stroke="var(--sketch-stroke)" stroke-width="2.2" stroke-linecap="round" />' +
      '      <circle cx="158" cy="158" r="2.2" fill="var(--accent)" opacity="0.65" />' +
      '    </g>' +
      '    <g class="sk-sleep-cup" opacity="0">' +
      '      <rect x="184" y="156" width="15" height="15" rx="3.5" fill="var(--sketch-paper)" stroke="var(--sketch-stroke)" stroke-width="2.2" />' +
      '      <rect x="185" y="157" width="13" height="13" rx="2.5" fill="var(--accent)" opacity="0.20" />' +
      '      <path d="M199 160 C204 160, 204 167, 199 167" fill="none" stroke="var(--sketch-stroke)" stroke-width="2" stroke-linecap="round" />' +
      '      <path class="sk-sleep-steam" d="M189 151 Q187 145 191 140 M195 151 Q197 144 193 139" fill="none" stroke="var(--sketch-stroke)" stroke-width="1.6" stroke-linecap="round" opacity="0.42" />' +
      '    </g>' +
      '  </g>' +
      '</svg>';

    const poseStretch = container.querySelector('.sk-pose-stretch');
    const poseSit = container.querySelector('.sk-pose-sit');
    const poseGaze = container.querySelector('.sk-pose-gaze');
    const poseWalk = container.querySelector('.sk-pose-walk');
    const poseSleep = container.querySelector('.sk-pose-sleep');

    const stretchBody = container.querySelector('.sk-stretch-body');
    const sitBody = container.querySelector('.sk-sit-body');
    const sitHead = container.querySelector('.sk-sit-head');
    const gazeBody = container.querySelector('.sk-gaze-body');
    const walkBody = container.querySelector('.sk-walk-body');
    const sleepBody = container.querySelector('.sk-sleep-body');

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

    let state = { pose: 'calm', mood: 'calm', easterEgg: null };
    let nextBlink = 2800;
    let blinkUntil = 0;

    function update(nowMs) {
      const t = nowMs / 1000;
      const breath = 0.5 + 0.5 * Math.sin(t * ((2 * Math.PI) / 6.5));

      if (nowMs >= nextBlink) {
        blinkUntil = nowMs + 140;
        nextBlink = nowMs + 3200 + Math.random() * 2600;
      }
      const blinking = nowMs < blinkUntil;

      const isDnd = state.mood === 'dnd';
      const pose = state.pose || 'calm';
      const activeMode = (isDnd || pose === 'nap_guard')
        ? 'sleep'
        : pose === 'gaze'
          ? 'gaze'
          : pose === 'walk'
            ? 'walk'
            : (pose === 'water' || pose === 'tea' || pose === 'neck_tilt' || pose === 'wrist_shake' || pose === 'shoulder_roll' || pose === 'breath' || pose === 'yawn' || state.easterEgg === 'yawn' || state.mood === 'tired')
              ? 'sit'
              : 'stretch';

      poseStretch.setAttribute('opacity', activeMode === 'stretch' ? '1' : '0');
      poseSit.setAttribute('opacity', activeMode === 'sit' ? '1' : '0');
      poseGaze.setAttribute('opacity', activeMode === 'gaze' ? '1' : '0');
      poseWalk.setAttribute('opacity', activeMode === 'walk' ? '1' : '0');
      poseSleep.setAttribute('opacity', activeMode === 'sleep' ? '1' : '0');

      if (activeMode === 'sleep') {
        sleepBody.style.transform = 'scaleY(' + (1 + breath * 0.042).toFixed(4) + ')';
        const hasCup = pose === 'nap_guard';
        sleepCup.setAttribute('opacity', hasCup ? '1' : '0');
        if (hasCup && sleepSteam) {
          const sx = Math.sin(t * 2.1) * 1.8;
          const sy = -((t * 5.5) % 5.5);
          sleepSteam.setAttribute('transform', 'translate(' + sx.toFixed(1) + ', ' + sy.toFixed(1) + ')');
        }
        // Gentle slow rhythmic tail sway + occasional happy twitch while napping on guard
        const gentleSway = Math.sin(t * 1.35) * 2.8;
        const twitch = Math.sin(t * 0.65) > 0.80 ? Math.sin(t * 7.5) * 4.2 : 0;
        const totalTail = gentleSway + twitch;
        tailSleep.setAttribute('d', 'M88 164 Q' + (76 + totalTail * 0.45).toFixed(1) + ' 158 ' + (78 + totalTail).toFixed(1) + ' 148');
        return;
      }

      if (activeMode === 'gaze') {
        gazeBody.style.transform = 'scaleY(' + (1 + breath * 0.025).toFixed(4) + ')';
        const wag = Math.sin(t * 1.7) * 5;
        tailGaze.setAttribute('d', 'M90 162 Q' + (70 + wag * 0.5).toFixed(1) + ' 156 ' + (68 + wag).toFixed(1) + ' 142');
        eyeGaze.setAttribute('r', blinking ? '0.6' : '2.1');
        return;
      }

      if (activeMode === 'walk') {
        const stride = Math.sin(t * 3.6);
        const bob = Math.abs(stride) * 3.2;
        const drift = Math.sin(t * 0.9) * 8;
        walkBody.style.transform = 'translate(' + drift.toFixed(2) + 'px, ' + (-bob).toFixed(2) + 'px)';
        leg1.setAttribute('d', 'M100 152 L' + (96 + stride * 7).toFixed(1) + ' 174');
        leg2.setAttribute('d', 'M112 152 L' + (116 - stride * 7).toFixed(1) + ' 174');
        leg3.setAttribute('d', 'M140 152 L' + (136 - stride * 7).toFixed(1) + ' 174');
        leg4.setAttribute('d', 'M150 152 L' + (156 + stride * 7).toFixed(1) + ' 174');
        const wag = Math.sin(t * 3.6) * 5;
        tailWalk.setAttribute('d', 'M92 134 Q76 122 ' + (80 + wag).toFixed(1) + ' 108');
        return;
      }

      if (activeMode === 'sit') {
        const rollLift = pose === 'shoulder_roll' ? Math.sin(t * 1.5) * 3.5 : 0;
        const sy = 1 + breath * (pose === 'breath' ? 0.042 : 0.024);
        sitBody.style.transform = 'translateY(' + (-rollLift).toFixed(2) + 'px) scaleY(' + sy.toFixed(4) + ')';

        // Head tilt for neck_tilt or gentle yawn lean
        let headAngle = 0;
        if (pose === 'neck_tilt') {
          headAngle = Math.sin(t * 0.72) * 14;
        } else if (pose === 'yawn' || state.easterEgg === 'yawn') {
          headAngle = Math.sin(t * 1.4) * 5;
        }
        sitHead.style.transform = 'rotate(' + headAngle.toFixed(2) + 'deg)';

        // Paw wave for wrist_shake
        const shaking = pose === 'wrist_shake';
        pawWave.setAttribute('opacity', shaking ? '1' : '0');
        pawRight.setAttribute('opacity', shaking ? '0' : '1');
        if (shaking) {
          pawWave.style.transform = 'rotate(' + (Math.sin(t * 8.5) * 14).toFixed(2) + 'deg)';
        }

        const wag = Math.sin(t * 2.0) * 5;
        tailSit.setAttribute('d', 'M104 156 Q' + (84 + wag * 0.5).toFixed(1) + ' 150 ' + (82 + wag).toFixed(1) + ' 136');

        const isYawn = pose === 'yawn' || state.easterEgg === 'yawn';
        const showCup = pose === 'water' || pose === 'tea';
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
        } else if (pose === 'breath') {
          yawnMouth.setAttribute('opacity', '0');
          sitEyesOpen.setAttribute('opacity', '0');
          sitEyesSoft.setAttribute('opacity', '0');
          sitEyesClosed.setAttribute('opacity', '1');
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

      // Stretch / default pose
      const sy = 1 + breath * 0.028;
      stretchBody.style.transform = 'scaleY(' + sy.toFixed(4) + ')';
      const wag = Math.sin(t * 2.0) * 6;
      tailStretch.setAttribute('d', 'M84 138 Q66 122 ' + (72 + wag).toFixed(1) + ' 108');
      eyeA.setAttribute('r', blinking ? '0.6' : '2.1');
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
