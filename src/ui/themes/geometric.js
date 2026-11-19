(function (root) {
  'use strict';

  let instanceSeq = 0;

  function createGeometricRenderer(container) {
    const filterId = 'mn-geo-soft-' + (++instanceSeq);

    container.innerHTML =
      '<svg class="mn-geo-svg" viewBox="0 0 240 220" width="100%" height="100%" aria-hidden="true">' +
      '  <defs>' +
      '    <filter id="' + filterId + '" x="-20%" y="-20%" width="140%" height="140%">' +
      '      <feGaussianBlur stdDeviation="12" />' +
      '    </filter>' +
      '  </defs>' +
      '  <ellipse class="geo-shadow" cx="120" cy="190" rx="58" ry="11" fill="currentColor" opacity="0.08" />' +
      '  <circle class="geo-aura" cx="120" cy="116" r="72" fill="var(--halo-primary)" filter="url(#' + filterId + ')" />' +
      '  <g class="geo-body-group" style="transform-origin: 120px 176px;">' +
      '    <!-- Soft arms / shoulders -->' +
      '    <path class="geo-arm-left" d="M62 126 C46 132, 44 156, 58 164" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" opacity="0.88" />' +
      '    <path class="geo-arm-right" d="M178 126 C194 132, 196 156, 182 164" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" opacity="0.88" />' +
      '    <!-- Main organic pebble body -->' +
      '    <path class="geo-torso" d="M120 44 C162 44, 186 76, 186 120 C186 164, 162 182, 120 182 C78 182, 54 164, 54 120 C54 76, 78 44, 120 44 Z" fill="var(--accent)" />' +
      '    <!-- Subtle matte top highlight -->' +
      '    <path d="M88 60 C104 52, 134 52, 148 59" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.22" />' +
      '    <!-- Face group -->' +
      '    <g class="geo-face">' +
      '      <g class="geo-eyes-open">' +
      '        <ellipse class="geo-eye-l" cx="101" cy="106" rx="5.2" ry="6.4" fill="var(--ink)" />' +
      '        <ellipse class="geo-eye-r" cx="139" cy="106" rx="5.2" ry="6.4" fill="var(--ink)" />' +
      '        <circle class="geo-glint-l" cx="99.5" cy="103.5" r="1.6" fill="#FFFFFF" opacity="0.7" />' +
      '        <circle class="geo-glint-r" cx="137.5" cy="103.5" r="1.6" fill="#FFFFFF" opacity="0.7" />' +
      '      </g>' +
      '      <g class="geo-eyes-happy" opacity="0">' +
      '        <path d="M94 108 Q101 100 108 108" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round" />' +
      '        <path d="M132 108 Q139 100 146 108" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round" />' +
      '      </g>' +
      '      <g class="geo-eyes-closed" opacity="0">' +
      '        <path d="M94 106 Q101 112 108 106" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />' +
      '        <path d="M132 106 Q139 112 146 106" fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" />' +
      '      </g>' +
      '      <path class="geo-mouth" d="M114 120 Q120 124 126 120" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" opacity="0.75" />' +
      '    </g>' +
      '    <!-- Tea / Water cup -->' +
      '    <g class="geo-cup" opacity="0">' +
      '      <rect x="107" y="136" width="26" height="22" rx="6" fill="var(--sketch-paper)" stroke="var(--ink)" stroke-width="2.2" />' +
      '      <path d="M133 142 C140 142, 140 152, 133 152" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" />' +
      '      <path class="geo-steam-1" d="M115 131 Q112 124 116 118" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />' +
      '      <path class="geo-steam-2" d="M124 131 Q127 123 123 116" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" opacity="0.45" />' +
      '    </g>' +
      '  </g>' +
      '</svg>';

    const bodyGroup = container.querySelector('.geo-body-group');
    const shadow = container.querySelector('.geo-shadow');
    const aura = container.querySelector('.geo-aura');
    const face = container.querySelector('.geo-face');
    const eyesOpen = container.querySelector('.geo-eyes-open');
    const eyesHappy = container.querySelector('.geo-eyes-happy');
    const eyesClosed = container.querySelector('.geo-eyes-closed');
    const eyeL = container.querySelector('.geo-eye-l');
    const eyeR = container.querySelector('.geo-eye-r');
    const armLeft = container.querySelector('.geo-arm-left');
    const armRight = container.querySelector('.geo-arm-right');
    const cup = container.querySelector('.geo-cup');
    const steam1 = container.querySelector('.geo-steam-1');
    const steam2 = container.querySelector('.geo-steam-2');

    let state = { pose: 'calm', mood: 'calm', easterEgg: null };
    let nextBlinkAt = 2400;
    let blinkEndAt = 0;

    function breathCurve(tSec) {
      // 10s cycle: 4s smooth inhale (0 -> 1), 6s smooth exhale (1 -> 0)
      const cycle = tSec % 10;
      if (cycle < 4) {
        const u = cycle / 4;
        return 0.5 - 0.5 * Math.cos(Math.PI * u);
      }
      const u = (cycle - 4) / 6;
      return 0.5 + 0.5 * Math.cos(Math.PI * u);
    }

    function update(nowMs) {
      const t = nowMs / 1000;
      const b = breathCurve(t);
      const isDnd = state.mood === 'dnd';
      const isTired = state.mood === 'tired';
      const isRefreshed = state.mood === 'refreshed';
      const pose = state.pose || 'calm';
      const showCup = pose === 'tea' || pose === 'water' || state.easterEgg === 'tea';

      // Organic squash & stretch breathing + pose-driven body motion
      let amp = isDnd ? 0.45 : (pose === 'breath' ? 1.35 : 1.0);
      let sx = 1 + (0.5 - b) * 0.032 * amp;
      let sy = 1 + (b - 0.5) * 0.044 * amp;
      let tx = 0;
      let ty = -b * 5.0 * amp;
      let rot = 0;

      if (pose === 'neck_tilt') {
        rot = Math.sin(t * 0.72) * 8.5;
      } else if (pose === 'lean_back') {
        rot = -2.5 - b * 2.0;
      } else if (pose === 'guardian') {
        // Seated calm guardian slowly shifting posture over time
        rot = Math.sin(t * 0.28) * 2.6;
        ty = 4.0 - b * 3.2;
      } else if (pose === 'guardian_wake') {
        // Friendly quick nod on wake
        ty = -4.0;
        rot = Math.sin(t * 10.0) * 3.5;
      } else if (pose === 'stretch_up') {
        sy = 1.02 + b * 0.065;
        sx = 0.99 - b * 0.028;
        ty = -b * 9.0;
      } else if (pose === 'walk') {
        const step = Math.sin(t * 2.8);
        tx = Math.sin(t * 1.4) * 7.0;
        ty = -Math.abs(step) * 5.5;
        rot = step * 3.2;
      }

      bodyGroup.style.transform =
        'translate(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sx.toFixed(4) + ', ' + sy.toFixed(4) + ')';

      const shadowRx = Math.max(44, 58 - b * 4 * amp + (pose === 'walk' ? Math.abs(Math.sin(t * 2.8)) * -4 : 0));
      shadow.setAttribute('rx', shadowRx.toFixed(1));
      shadow.setAttribute('cx', (120 + tx * 0.8).toFixed(1));
      aura.setAttribute('r', (68 + b * 12 * amp).toFixed(1));
      aura.setAttribute('fill', pose === 'breath' ? 'var(--halo-secondary)' : 'var(--halo-primary)');

      // Pose-specific arm choreography
      if (pose === 'chest_open') {
        const open = b * 7;
        armLeft.setAttribute('d', 'M62 126 C' + (40 - open).toFixed(1) + ' 118, ' + (34 - open).toFixed(1) + ' 142, 46 154');
        armRight.setAttribute('d', 'M178 126 C' + (200 + open).toFixed(1) + ' 118, ' + (206 + open).toFixed(1) + ' 142, 194 154');
      } else if (pose === 'lean_back') {
        armLeft.setAttribute('d', 'M62 118 C46 96, 56 78, 76 84');
        armRight.setAttribute('d', 'M178 118 C194 96, 184 78, 164 84');
      } else if (pose === 'stretch_up') {
        const lift = b * 12;
        armLeft.setAttribute('d', 'M64 114 C48 ' + (82 - lift).toFixed(1) + ', 64 ' + (46 - lift).toFixed(1) + ', 92 ' + (34 - lift * 0.6).toFixed(1));
        armRight.setAttribute('d', 'M176 114 C192 ' + (82 - lift).toFixed(1) + ', 176 ' + (46 - lift).toFixed(1) + ', 148 ' + (34 - lift * 0.6).toFixed(1));
      } else if (pose === 'wrist_shake') {
        const w1 = Math.sin(t * 9.5) * 6;
        const w2 = Math.cos(t * 9.5) * 6;
        armLeft.setAttribute('d', 'M62 124 C42 114, 34 98, ' + (40 + w1).toFixed(1) + ' ' + (86 + w2 * 0.4).toFixed(1));
        armRight.setAttribute('d', 'M178 124 C198 114, 206 98, ' + (200 - w1).toFixed(1) + ' ' + (86 - w2 * 0.4).toFixed(1));
      } else if (pose === 'shoulder_roll') {
        const ang = t * 1.45;
        const rx = Math.cos(ang) * 6;
        const ry = Math.sin(ang) * 8;
        armLeft.setAttribute('d', 'M62 ' + (122 + ry).toFixed(1) + ' C' + (46 + rx).toFixed(1) + ' ' + (132 + ry).toFixed(1) + ', 46 158, 60 165');
        armRight.setAttribute('d', 'M178 ' + (122 + ry).toFixed(1) + ' C' + (194 - rx).toFixed(1) + ' ' + (132 + ry).toFixed(1) + ', 194 158, 180 165');
      } else if (pose === 'walk') {
        const swing = Math.sin(t * 2.8) * 10;
        armLeft.setAttribute('d', 'M62 126 C46 ' + (136 + swing).toFixed(1) + ', 48 ' + (156 + swing).toFixed(1) + ', 60 ' + (164 + swing * 0.6).toFixed(1));
        armRight.setAttribute('d', 'M178 126 C194 ' + (136 - swing).toFixed(1) + ', 192 ' + (156 - swing).toFixed(1) + ', 180 ' + (164 - swing * 0.6).toFixed(1));
      } else if (showCup) {
        armLeft.setAttribute('d', 'M62 128 C72 144, 90 148, 106 146');
        armRight.setAttribute('d', 'M178 128 C168 144, 150 148, 136 146');
      } else {
        const drop = (1 - b) * 4.5;
        armLeft.setAttribute('d', 'M62 ' + (126 + drop).toFixed(1) + ' C48 ' + (136 + drop).toFixed(1) + ', 48 160, 60 166');
        armRight.setAttribute('d', 'M178 ' + (126 + drop).toFixed(1) + ' C192 ' + (136 + drop).toFixed(1) + ', 192 160, 180 166');
      }

      cup.setAttribute('opacity', showCup ? '1' : '0');
      if (showCup) {
        const sOffset = Math.sin(t * 2.2) * 2.5;
        steam1.setAttribute('transform', 'translate(' + sOffset.toFixed(1) + ', ' + (-((t * 8) % 6)).toFixed(1) + ')');
        steam2.setAttribute('transform', 'translate(' + (-sOffset).toFixed(1) + ', ' + (-(((t + 0.6) * 8) % 6)).toFixed(1) + ')');
      }

      // Gaze & Blink
      if (nowMs >= nextBlinkAt) {
        blinkEndAt = nowMs + 150;
        nextBlinkAt = nowMs + 3400 + Math.random() * 2800;
      }
      const blinking = nowMs < blinkEndAt;

      let gazeX = 0;
      let gazeY = isTired ? 2.5 : 0;
      if (pose === 'gaze') {
        gazeX = Math.sin(t * 0.45) * 5.5 + 3.0;
        gazeY = -1.5;
      } else if (pose === 'lean_back' || pose === 'stretch_up') {
        gazeY = -3.2;
      } else if (pose === 'neck_tilt') {
        gazeX = Math.sin(t * 0.72) * 3.0;
      }
      face.setAttribute('transform', 'translate(' + gazeX.toFixed(2) + ', ' + gazeY.toFixed(2) + ')');

      if (isDnd || pose === 'breath' || pose === 'guardian' || blinking) {
        eyesOpen.setAttribute('opacity', '0');
        eyesHappy.setAttribute('opacity', '0');
        eyesClosed.setAttribute('opacity', '1');
      } else if (isRefreshed || pose === 'guardian_wake' || state.easterEgg === 'tea') {
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
    }

    return {
      setState: function (next) {
        state = Object.assign({}, state, next || {});
      },
      update: update
    };
  }

  root.MoveNowThemeGeometric = { create: createGeometricRenderer };
})(typeof globalThis !== 'undefined' ? globalThis : this);
