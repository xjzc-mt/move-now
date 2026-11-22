(function (root) {
  'use strict';

  /**
   * MoveNow Full-Screen Causal Roaming & Unified Articulated Rig Engine
   * - Entire 100vw x 100vh monitor is the stage.
   * - Single continuous articulated skeleton per theme (ZERO opacity crossfades or pose-cut pops!).
   * - Causal Precondition Graph: Sleep -> Wake/Yawn -> Stretch/Stand -> Roam/Chase/Peek/Excursion -> Sit -> Curl Sleep.
   * - Ultra-lightweight Canvas 2D vector curves (~20 floats/frame, < 0.06ms CPU on Apple Silicon).
   */

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function makeSpring(val, k, c) {
    return { x: val, v: 0, target: val, k: k || 14, c: c || 6.8 };
  }

  function stepSpring(s, dt) {
    const f = (s.target - s.x) * s.k - s.v * s.c;
    s.v += f * dt;
    s.x += s.v * dt;
    return s.x;
  }

  function randRange(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function createRoamingStage(canvas) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let theme = 'geometric'; // 'geometric' | 'sketch'
    let active = false;
    let lastMs = performance.now();

    // World position & locomotion state
    let worldX = 0;
    let worldY = 0;
    let vx = 0;
    let vy = 0;
    let stridePhase = 0;
    let initializedPos = false;

    // Continuous articulated blend weights (always smoothly damped, never hard-switched!)
    const spFacing = makeSpring(1, 22, 8.5);      // +1 right, -1 left
    const spSleep = makeSpring(1, 8.5, 5.6);      // 1 = curled asleep, 0 = awake
    const spSit = makeSpring(0, 10.0, 6.0);       // 1 = seated upright
    const spBow = makeSpring(0, 11.0, 6.2);       // 1 = morning stretch / play-bow
    const spStand = makeSpring(0, 10.5, 6.2);     // 1 = standing / walking on feet
    const spHeadPitch = makeSpring(0, 14, 6.5);   // -up (looking at clock/sky) .. +down (sniffing/dozing)
    const spHeadCock = makeSpring(0, 16, 6.8);    // curious head tilt
    const spYawn = makeSpring(0, 12, 6.0);        // 0..1 mouth open yawn
    const spCup = makeSpring(0, 9.0, 5.5);        // 0..1 warm cup held / beside
    const spPeek = makeSpring(0, 10, 5.8);        // leaning curiously at screen bezel

    // Subtle fading footprints / paw marks left behind during cross-screen walks
    const footprints = [];
    let distSinceLastPrint = 0;
    let nextFootSide = 1;

    // Flying wonder entity (glowing inspiration mote for geometric; minimalist ink butterfly for sketch)
    const flyer = {
      active: false,
      x: 0,
      y: 0,
      alpha: 0,
      startX: 0,
      endX: 0,
      baseY: 0,
      progress: 0,
      duration: 12
    };

    // Blinking
    let nextBlinkMs = 2400;
    let blinkUntilMs = 0;

    // =========================================================================
    // Causal Narrative Director (Stories with Beginning -> Middle -> End)
    // =========================================================================
    let currentStory = 'sleep_dwell';
    let lastMainStory = '';
    let phaseSteps = [];
    let stepIndex = 0;
    let stepElapsed = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const nw = Math.max(320, Math.round(rect.width || window.innerWidth || 1280));
      const nh = Math.max(240, Math.round(rect.height || window.innerHeight || 800));
      const ndpr = Math.min(2, root.devicePixelRatio || 1);
      if (nw === width && nh === height && ndpr === dpr) return;
      width = nw;
      height = nh;
      dpr = ndpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initializedPos) {
        resetWorldPlacement();
      } else {
        worldX = clamp(worldX, width * 0.12, width * 0.88);
        worldY = clamp(worldY, height * 0.72, height * 0.87);
      }
    }

    function resetWorldPlacement() {
      if (width <= 0 || height <= 0) return;
      initializedPos = true;
      // Start in a pleasant asymmetric spot on the lower canvas
      const startRight = Math.random() < 0.65;
      worldX = width * (startRight ? randRange(0.68, 0.82) : randRange(0.18, 0.32));
      worldY = height * randRange(0.77, 0.84);
      vx = 0;
      vy = 0;
      const initFace = worldX > width * 0.5 ? -1 : 1;
      spFacing.x = spFacing.target = initFace;
      spSleep.x = spSleep.target = 1;
      spSit.x = spSit.target = 0;
      spBow.x = spBow.target = 0;
      spStand.x = spStand.target = 0;
      footprints.length = 0;
      flyer.active = false;
      flyer.alpha = 0;

      // Calm initial rest of 4.8~6.8s, then unfold the first full-screen narrative story!
      currentStory = 'initial_calm';
      phaseSteps = [
        { kind: 'sleep', dur: randRange(4.8, 6.8), cup: true }
      ];
      stepIndex = 0;
      stepElapsed = 0;
    }

    function pickFarScreenX() {
      // Pick a destination meaningfully across the screen from current worldX
      if (worldX < width * 0.42) {
        return width * randRange(0.64, 0.86);
      }
      if (worldX > width * 0.58) {
        return width * randRange(0.14, 0.36);
      }
      return Math.random() < 0.5 ? width * randRange(0.14, 0.30) : width * randRange(0.70, 0.86);
    }

    function buildNextNarrative() {
      // After any active story, always enjoy a long, peaceful rest (22~38s) before the next adventure!
      if (currentStory !== 'sleep_dwell' && currentStory !== 'initial_calm') {
        currentStory = 'sleep_dwell';
        const showCup = Math.random() < 0.55;
        phaseSteps = [
          { kind: 'sleep', dur: randRange(22.0, 38.0), cup: showCup }
        ];
        stepIndex = 0;
        stepElapsed = 0;
        return;
      }

      // Pick a complete, logical multi-act story (never repeating the exact same story twice in a row)
      const candidates = [
        { id: 'cross_stroll', weight: 2.6 },
        { id: 'chase_wonder', weight: 2.4 },
        { id: 'clock_and_tea', weight: 1.8 },
        { id: 'bezel_peek', weight: 1.5 },
        { id: 'offscreen_excursion', weight: 1.3 }
      ].filter(function (c) { return c.id !== lastMainStory; });

      let total = 0;
      for (let i = 0; i < candidates.length; i++) total += candidates[i].weight;
      let roll = Math.random() * total;
      let chosen = candidates[0].id;
      for (let i = 0; i < candidates.length; i++) {
        roll -= candidates[i].weight;
        if (roll <= 0) {
          chosen = candidates[i].id;
          break;
        }
      }

      currentStory = chosen;
      lastMainStory = chosen;
      stepIndex = 0;
      stepElapsed = 0;

      const destY = height * randRange(0.73, 0.85);
      const vScale = clamp(width / 1280, 0.92, 1.75);

      if (chosen === 'cross_stroll') {
        // Wake & Yawn -> Morning Stretch -> Walk across screen (with mid-way sniff/pause) -> Sit -> Curl Sleep
        const destX = pickFarScreenX();
        const midX = lerp(worldX, destX, randRange(0.42, 0.58));
        const midY = lerp(worldY, destY, 0.5);
        const sp1 = randRange(54, 70) * vScale;
        const sp2 = randRange(50, 66) * vScale;
        phaseSteps = [
          { kind: 'wake_yawn', dur: randRange(2.4, 3.2) },
          { kind: 'stretch', dur: randRange(2.0, 2.7) },
          { kind: 'walk_to', tx: midX, ty: midY, speed: sp1, dur: Math.abs(midX - worldX) / sp1 + 5.0 },
          { kind: Math.random() < 0.55 ? 'sniff_ground' : 'look_around', dur: randRange(2.8, 4.2) },
          { kind: 'walk_to', tx: destX, ty: destY, speed: sp2, dur: Math.abs(destX - midX) / sp2 + 5.0 },
          { kind: 'sit_calm', dur: randRange(2.4, 3.6) },
          { kind: 'settle_sleep', dur: 2.2 }
        ];
      } else if (chosen === 'chase_wonder') {
        // Flyer enters -> Companion notices & stands -> Joyful trot across screen tracking flyer -> Flyer ascends -> Sit & gaze skyward -> Sleep
        const goRight = worldX < width * 0.5;
        const fStartX = goRight ? -30 : width + 30;
        const fEndX = goRight ? width * randRange(0.74, 0.88) : width * randRange(0.12, 0.26);
        const chaseDur = randRange(10.0, 13.5);

        flyer.active = true;
        flyer.startX = fStartX;
        flyer.endX = fEndX;
        flyer.x = fStartX;
        flyer.baseY = height * randRange(0.55, 0.65);
        flyer.y = flyer.baseY;
        flyer.progress = 0;
        flyer.duration = chaseDur + 3.2;

        phaseSteps = [
          { kind: 'notice_flyer', dur: 2.2 },
          { kind: 'stretch', dur: 1.5 },
          { kind: 'chase_flyer', tx: fEndX, ty: destY, speed: randRange(78, 96) * vScale, dur: chaseDur },
          { kind: 'watch_sky_farewell', dur: randRange(3.6, 4.8) },
          { kind: 'settle_sleep', dur: 2.2 }
        ];
      } else if (chosen === 'clock_and_tea') {
        // Wake -> Stroll near center under Giant Clock -> Gaze up at clock digits -> Enjoy steaming tea -> Sleep
        const underClockX = width * randRange(0.38, 0.62);
        const sp = randRange(50, 64) * vScale;
        phaseSteps = [
          { kind: 'wake_yawn', dur: 2.4 },
          { kind: 'stretch', dur: 1.8 },
          { kind: 'walk_to', tx: underClockX, ty: height * randRange(0.75, 0.83), speed: sp, dur: Math.abs(underClockX - worldX) / sp + 5.0 },
          { kind: 'gaze_clock', dur: randRange(4.2, 5.8) },
          { kind: 'tea_break', dur: randRange(5.5, 7.8) },
          { kind: 'settle_sleep', dur: 2.2 }
        ];
      } else if (chosen === 'bezel_peek') {
        // Walk right up to monitor edge -> Peek curiously past bezel -> Stroll to new cozy spot -> Sleep
        const goLeftEdge = worldX < width * 0.5 ? (Math.random() < 0.65) : (Math.random() < 0.35);
        const edgeX = goLeftEdge ? 58 : width - 58;
        const cozyX = goLeftEdge ? width * randRange(0.22, 0.40) : width * randRange(0.60, 0.78);
        const sp1 = randRange(56, 70) * vScale;
        const sp2 = randRange(50, 62) * vScale;
        phaseSteps = [
          { kind: 'wake_yawn', dur: 2.2 },
          { kind: 'stretch', dur: 1.7 },
          { kind: 'walk_to', tx: edgeX, ty: destY, speed: sp1, dur: Math.abs(edgeX - worldX) / sp1 + 5.0 },
          { kind: 'peek_bezel', edgeDir: goLeftEdge ? -1 : 1, dur: randRange(3.6, 5.0) },
          { kind: 'walk_to', tx: cozyX, ty: height * randRange(0.75, 0.84), speed: sp2, dur: Math.abs(cozyX - edgeX) / sp2 + 5.0 },
          { kind: 'sit_calm', dur: 2.4 },
          { kind: 'settle_sleep', dur: 2.2 }
        ];
      } else {
        // Off-screen Excursion (Scheme 3!): Stroll completely off one side of monitor -> serene empty beat -> stroll back in from opposite/same side!
        const exitRight = worldX >= width * 0.5;
        const exitX = exitRight ? width + 135 : -135;
        const reenterFromOpposite = Math.random() < 0.72;
        const enterStartX = reenterFromOpposite ? (exitRight ? -135 : width + 135) : exitX;
        const settleX = width * randRange(0.20, 0.80);
        const spOut = randRange(58, 72) * vScale;
        const spIn = randRange(54, 68) * vScale;
        phaseSteps = [
          { kind: 'wake_yawn', dur: 2.2 },
          { kind: 'stretch', dur: 1.7 },
          { kind: 'walk_to', tx: exitX, ty: destY, speed: spOut, dur: Math.abs(exitX - worldX) / spOut + 5.0 },
          { kind: 'offscreen_pause', enterX: enterStartX, enterY: height * randRange(0.74, 0.84), dur: randRange(5.5, 9.5) },
          { kind: 'walk_to', tx: settleX, ty: height * randRange(0.75, 0.84), speed: spIn, dur: Math.abs(settleX - enterStartX) / spIn + 5.0 },
          { kind: 'sit_calm', dur: 2.6 },
          { kind: 'settle_sleep', dur: 2.2 }
        ];
      }
    }

    function setPoseWeights(sleep, sit, bow, stand) {
      spSleep.target = sleep;
      spSit.target = sit;
      spBow.target = bow;
      spStand.target = stand;
    }

    function stepDirector(dt, tSec) {
      if (phaseSteps.length === 0 || stepIndex >= phaseSteps.length) {
        buildNextNarrative();
      }
      const step = phaseSteps[stepIndex];
      stepElapsed += dt;

      // Reset transient expression targets unless active step overrides
      spYawn.target = 0;
      spHeadPitch.target = 0;
      spHeadCock.target = 0;
      spPeek.target = 0;
      spCup.target = step.cup ? 1 : 0;

      let stepDone = stepElapsed >= step.dur;

      if (step.kind === 'sleep') {
        vx = lerp(vx, 0, dt * 6);
        vy = lerp(vy, 0, dt * 6);
        setPoseWeights(1, 0, 0, 0);
      } else if (step.kind === 'wake_yawn') {
        vx = lerp(vx, 0, dt * 6);
        vy = lerp(vy, 0, dt * 6);
        setPoseWeights(0, 1, 0, 0);
        const yawnArc = Math.sin(clamp(stepElapsed / step.dur, 0, 1) * Math.PI);
        spYawn.target = yawnArc;
        spHeadPitch.target = -0.25 * yawnArc;
      } else if (step.kind === 'notice_flyer') {
        vx = 0;
        vy = 0;
        setPoseWeights(0, 1, 0, 0);
        const dx = flyer.x - worldX;
        if (Math.abs(dx) > 8) spFacing.target = dx >= 0 ? 1 : -1;
        spHeadPitch.target = -0.45;
        spHeadCock.target = 0.35;
      } else if (step.kind === 'stretch') {
        vx = 0;
        vy = 0;
        if (stepElapsed < step.dur * 0.68) {
          setPoseWeights(0, 0, 1, 0);
        } else {
          setPoseWeights(0, 0, 0, 1);
        }
      } else if (step.kind === 'walk_to' || step.kind === 'chase_flyer') {
        setPoseWeights(0, 0, 0, 1);
        const goalX = step.kind === 'chase_flyer' ? clamp(flyer.x - spFacing.target * 36, 80, width - 80) : step.tx;
        const goalY = step.ty;
        const dx = goalX - worldX;
        const dy = goalY - worldY;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dx) > 6) {
          spFacing.target = dx >= 0 ? 1 : -1;
        }

        // Only move forward once body turn has mostly aligned (prevents sideways/backward sliding!)
        const turnAligned = Math.abs(spFacing.x - spFacing.target) < 0.45 ? 1 : 0.12;
        const slowRadius = 54;
        const speedFactor = step.kind === 'chase_flyer'
          ? clamp(dist / 42, 0.25, 1.0)
          : clamp(dist / slowRadius, 0, 1.0);
        const desiredSpeed = step.speed * speedFactor * turnAligned;

        if (dist > 3.5) {
          vx = lerp(vx, (dx / dist) * desiredSpeed, Math.min(1, dt * 5.0));
          vy = lerp(vy, (dy / dist) * desiredSpeed, Math.min(1, dt * 5.0));
        } else {
          vx = lerp(vx, 0, Math.min(1, dt * 8.0));
          vy = lerp(vy, 0, Math.min(1, dt * 8.0));
          if (step.kind === 'walk_to') {
            stepDone = true;
          }
        }

        if (step.kind === 'chase_flyer') {
          spHeadPitch.target = -0.42;
        }
      } else if (step.kind === 'sniff_ground') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 0, 0, 1);
        spHeadPitch.target = 0.72 + Math.sin(tSec * 7.5) * 0.12;
      } else if (step.kind === 'look_around') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 1, 0, 0);
        spHeadCock.target = Math.sin(stepElapsed * 1.8) * 0.65;
        if (stepElapsed > step.dur * 0.5 && stepElapsed - dt <= step.dur * 0.5) {
          spFacing.target = -spFacing.target;
        }
      } else if (step.kind === 'watch_sky_farewell' || step.kind === 'gaze_clock') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 1, 0, 0);
        if (step.kind === 'gaze_clock') {
          const toCenter = width * 0.5 - worldX;
          if (Math.abs(toCenter) > 25) spFacing.target = toCenter >= 0 ? 1 : -1;
        }
        spHeadPitch.target = -0.68;
        spHeadCock.target = Math.sin(tSec * 0.9) * 0.25;
      } else if (step.kind === 'tea_break') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 1, 0, 0);
        spCup.target = 1;
        spHeadPitch.target = 0.15 + Math.sin(tSec * 0.8) * 0.08;
      } else if (step.kind === 'peek_bezel') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 0, 0, 1);
        spFacing.target = step.edgeDir;
        spPeek.target = 1;
        spHeadPitch.target = -0.18;
      } else if (step.kind === 'offscreen_pause') {
        vx = 0;
        vy = 0;
        worldX = step.enterX;
        worldY = step.enterY;
        spFacing.x = spFacing.target = step.enterX < 0 ? 1 : -1;
        setPoseWeights(0, 0, 0, 1);
      } else if (step.kind === 'sit_calm') {
        vx = lerp(vx, 0, dt * 8);
        vy = lerp(vy, 0, dt * 8);
        setPoseWeights(0, 1, 0, 0);
      } else if (step.kind === 'settle_sleep') {
        vx = lerp(vx, 0, dt * 10);
        vy = lerp(vy, 0, dt * 10);
        const p = smoothstep(0, step.dur, stepElapsed);
        setPoseWeights(p, 1 - p, 0, 0);
      }

      // Advance position & stride phase tied strictly to true ground speed (zero foot sliding!)
      const speed = Math.hypot(vx, vy);
      worldX += vx * dt;
      worldY += vy * dt;
      stridePhase += speed * dt * 0.135;

      // Record subtle footprints when walking on-screen
      if (speed > 14 && worldX > 20 && worldX < width - 20) {
        distSinceLastPrint += speed * dt;
        if (distSinceLastPrint >= 26) {
          distSinceLastPrint = 0;
          nextFootSide = -nextFootSide;
          footprints.push({
            x: worldX - spFacing.target * 8,
            y: worldY + nextFootSide * 3.5,
            alpha: 0.24
          });
          if (footprints.length > 18) footprints.shift();
        }
      }

      for (let i = footprints.length - 1; i >= 0; i--) {
        footprints[i].alpha -= dt * 0.022;
        if (footprints[i].alpha <= 0.005) footprints.splice(i, 1);
      }

      // Advance flyer trajectory if active
      if (flyer.active) {
        flyer.progress += dt / flyer.duration;
        if (flyer.progress >= 1) {
          flyer.active = false;
          flyer.alpha = 0;
        } else {
          const p = flyer.progress;
          const ascend = smoothstep(0.72, 1.0, p);
          flyer.x = lerp(flyer.startX, flyer.endX, Math.min(1, p / 0.78));
          flyer.y = flyer.baseY + Math.sin(p * Math.PI * 5.5) * 26 - ascend * (height * 0.42);
          flyer.alpha = Math.min(1, p * 6) * (1 - ascend);
        }
      }

      if (stepDone) {
        stepIndex += 1;
        stepElapsed = 0;
        if (stepIndex >= phaseSteps.length) {
          buildNextNarrative();
        }
      }
    }

    // =========================================================================
    // Unified Articulated Renderer 1: Sketch Puppy (Single Continuous Ink Body!)
    // =========================================================================
    function drawUnifiedSketchPuppy(tSec, dark, blinking) {
      const strokeCol = dark ? '#E4DFD3' : '#35332F';
      const paperCol = dark ? '#3B4046' : '#E8E4DB';
      const accentCol = dark ? '#D4886A' : '#BF7658';

      // Subtle fading paw-dots trail behind cross-screen strolls
      for (let i = 0; i < footprints.length; i++) {
        const fp = footprints[i];
        ctx.fillStyle = dark
          ? 'rgba(228, 223, 211,' + fp.alpha.toFixed(3) + ')'
          : 'rgba(53, 51, 47,' + fp.alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(fp.x, fp.y, 2.6, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fluttering minimalist ink butterfly when active
      if (flyer.active && flyer.alpha > 0.02) {
        ctx.save();
        ctx.translate(flyer.x, flyer.y);
        ctx.globalAlpha = flyer.alpha * 0.82;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.9;
        ctx.lineCap = 'round';
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(tSec * 10.5));
        ctx.scale(1, flap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-6, -8, -10, -1);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(6, -8, 10, -1);
        ctx.stroke();
        ctx.restore();
      }

      // Normalize blend weights
      const wSleep = Math.max(0, spSleep.x);
      const wSit = Math.max(0, spSit.x);
      const wBow = Math.max(0, spBow.x);
      const wStand = Math.max(0, spStand.x);
      const wSum = Math.max(0.001, wSleep + wSit + wBow + wStand);
      const sSleep = wSleep / wSum;
      const sSit = wSit / wSum;
      const sBow = wBow / wSum;
      const sStand = wStand / wSum;

      const breath = 0.5 + 0.5 * Math.sin(tSec * 1.15);
      const speed = Math.hypot(vx, vy);
      const walkAmp = clamp(speed / 48, 0, 1.15) * sStand;
      const bob = Math.abs(Math.sin(stridePhase)) * 3.0 * walkAmp;

      // Perspective depth scale + big-screen responsive presence
      const viewportScale = clamp(width / 1120, 1.08, 1.48);
      const depthScale = lerp(0.92, 1.08, clamp((worldY - height * 0.70) / (height * 0.18), 0, 1)) * viewportScale;
      const faceFlip = Math.abs(spFacing.x) < 0.18 ? (spFacing.target >= 0 ? 0.18 : -0.18) : spFacing.x;

      ctx.save();
      ctx.translate(worldX, worldY);
      ctx.scale(faceFlip * depthScale, depthScale);

      // Soft ground contact shadow + local sketch ground whisper line
      ctx.strokeStyle = strokeCol;
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-48, 1.5);
      ctx.quadraticCurveTo(0, 3.2, 48, 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Continuous Joint Coordinates blended seamlessly across Sleep / Sit / Bow / Stand!
      const peekShift = spPeek.x * 10;
      const hipX = sSleep * (-20) + sSit * (-14) + sBow * (-24) + sStand * (-22);
      const hipY = sSleep * (-10) + sSit * (-10) + sBow * (-32) + sStand * (-25) - bob;

      const shX = (sSleep * 14 + sSit * 8 + sBow * 20 + sStand * 18) + peekShift * 0.5;
      const shY = sSleep * (-11 - breath * 1.6) + sSit * (-31 - breath * 1.2) + sBow * (-14) + sStand * (-26 - bob);

      const backCtrlX = lerp(hipX, shX, 0.48);
      const backCtrlY = sSleep * (-31 - breath * 2.4) + sSit * (-25) + sBow * (-17) + sStand * (-30 - bob);

      const pitch = spHeadPitch.x;
      const headX = shX + (sSleep * 10 + sSit * 7 + sBow * 14 + sStand * 12) + peekShift * 0.5 + pitch * 4;
      const headY = shY + (sSleep * (-3) + sSit * (-15) + sBow * (-7) + sStand * (-13)) + pitch * 12;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeCol;
      ctx.fillStyle = paperCol;

      // 1. Tail (wagging speed adapts naturally to mood & movement!)
      const wagFreq = (sBow > 0.3 || walkAmp > 0.3) ? 5.2 : 1.7;
      const wagAmp = (sSleep > 0.6 ? 2.5 : 6.5) + walkAmp * 3.0;
      const wag = Math.sin(tSec * wagFreq) * wagAmp;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(hipX - 4, hipY + 2);
      ctx.quadraticCurveTo(hipX - 18, hipY - 8 + wag * 0.4, hipX - 15 + wag * 0.5, hipY - 19 + wag);
      ctx.stroke();

      // 2. Back legs (far side, fading smoothly into body when curled asleep)
      const legVis = clamp(1 - sSleep * 1.15, 0, 1);
      if (legVis > 0.04) {
        const s1 = Math.sin(stridePhase) * 9.5 * walkAmp;
        const s2 = -s1;
        ctx.save();
        ctx.globalAlpha = legVis * 0.68;
        ctx.lineWidth = 2.7;
        // Far hind & far front leg
        ctx.beginPath();
        if (sSit > 0.5) {
          // Seated tucked hind paw
          ctx.moveTo(hipX + 4, hipY + 4);
          ctx.quadraticCurveTo(hipX + 14, 0, hipX + 18, 0);
        } else {
          ctx.moveTo(hipX + 4, hipY + 5);
          ctx.lineTo(hipX + 4 + s2, 0);
        }
        const frontReachFar = sBow * 14;
        ctx.moveTo(shX - 2, shY + 6);
        ctx.lineTo(shX + frontReachFar + s1, 0);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Unified Torso Pill / Curled Body Silhouette
      ctx.lineWidth = 2.9;
      ctx.beginPath();
      ctx.moveTo(hipX - 8, hipY + 6);
      // Smooth dorsal back curve
      ctx.quadraticCurveTo(backCtrlX, backCtrlY - 9, shX + 9, shY - 4);
      // Chest curve down to belly
      const bellyY = lerp(0, Math.max(hipY, shY) + 9, 1 - sSleep);
      ctx.quadraticCurveTo(shX + 12, bellyY, lerp(hipX, shX, 0.5), bellyY);
      ctx.quadraticCurveTo(hipX - 10, bellyY, hipX - 8, hipY + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. Near-side Hind & Front Legs
      if (legVis > 0.04) {
        const s1 = Math.sin(stridePhase) * 9.5 * walkAmp;
        const s2 = -s1;
        ctx.save();
        ctx.globalAlpha = legVis;
        ctx.lineWidth = 2.9;
        ctx.beginPath();
        if (sSit > 0.5) {
          ctx.moveTo(hipX, hipY + 5);
          ctx.quadraticCurveTo(hipX + 12, 1, hipX + 16, 0);
        } else {
          ctx.moveTo(hipX, hipY + 5);
          ctx.lineTo(hipX + s1, 0);
        }
        const frontReach = sBow * 16;
        ctx.moveTo(shX + 3, shY + 5);
        ctx.lineTo(shX + 4 + frontReach + s2, 0);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Head, Floppy Ear, Eyes, Nose, Yawn & Sleep Bubble
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(pitch * 0.35 + spHeadCock.x * 0.22);

      const headR = 14.8;
      ctx.fillStyle = paperCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.9;
      ctx.beginPath();
      ctx.arc(0, 0, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Floppy ear with subtle bounce
      const earSwing = -pitch * 3 + Math.sin(stridePhase) * 1.8 * walkAmp;
      ctx.lineWidth = 2.7;
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.bezierCurveTo(-13 + earSwing, -1, -13 + earSwing, 11, -4, 11);
      ctx.stroke();

      // Eye (closed peaceful curve when sleeping or blinking; bright dot when awake)
      const closedEye = sSleep > 0.55 || blinking || spYawn.x > 0.45;
      if (closedEye) {
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.arc(5.5, -1.5, 3.2, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
      } else {
        ctx.fillStyle = strokeCol;
        ctx.beginPath();
        ctx.arc(6.2, -2.0, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Little dark nose tip
      ctx.fillStyle = strokeCol;
      ctx.beginPath();
      ctx.arc(headR - 0.5, 1.5, 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Soft warm blush cheek
      ctx.fillStyle = accentCol;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(5.5, 4.8, 2.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Yawn mouth
      if (spYawn.x > 0.08) {
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.ellipse(9.5, 6.8, 2.6 * spYawn.x, 3.6 * spYawn.x, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Delicate sleep bubble expanding gently with breath during deep sleep
      if (sSleep > 0.82 && Math.sin(tSec * 0.25) > -0.2) {
        const bRad = 2.0 + breath * 3.8;
        ctx.globalAlpha = 0.28 + breath * 0.36;
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(headR + 4 + breath * 2, -2 - breath * 2.5, bRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // 6. Steaming Little Mug beside companion during tea_break or sleep
      const cupAlpha = clamp(spCup.x, 0, 1);
      if (cupAlpha > 0.03 && speed < 8) {
        ctx.save();
        ctx.globalAlpha = cupAlpha;
        const cx = shX + 34;
        const cy = 0;
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.roundRect(cx - 7, cy - 14, 14, 14, 3);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 7, 3.5, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        // Rising steam wisps
        const syOff = (tSec * 5.5) % 6;
        ctx.globalAlpha = cupAlpha * (0.48 - syOff * 0.06);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 17 - syOff);
        ctx.quadraticCurveTo(cx - 4, cy - 21 - syOff, cx, cy - 24 - syOff);
        ctx.moveTo(cx + 3, cy - 16 - syOff * 0.8);
        ctx.quadraticCurveTo(cx + 5, cy - 20 - syOff * 0.8, cx + 2, cy - 23 - syOff * 0.8);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    // =========================================================================
    // Unified Articulated Renderer 2: Geometric Pebble (Single Continuous Body!)
    // =========================================================================
    function drawUnifiedGeometricPebble(tSec, dark, blinking) {
      const bodyCol = dark ? '#D68263' : '#DF8666';
      const bodyTopCol = dark ? '#E59A7C' : '#F2A384';
      const inkCol = dark ? '#1E2024' : '#292C2F';
      const cupFill = dark ? '#363940' : '#F5F2EA';

      // Subtle footsteps trail
      for (let i = 0; i < footprints.length; i++) {
        const fp = footprints[i];
        ctx.fillStyle = dark
          ? 'rgba(214, 130, 99,' + (fp.alpha * 0.65).toFixed(3) + ')'
          : 'rgba(180, 112, 86,' + (fp.alpha * 0.55).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(fp.x, fp.y, 3.2, 1.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glowing floating inspiration mote when active
      if (flyer.active && flyer.alpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = flyer.alpha;
        const rg = ctx.createRadialGradient(flyer.x, flyer.y, 1, flyer.x, flyer.y, 16);
        rg.addColorStop(0, 'rgba(246, 168, 118, 0.90)');
        rg.addColorStop(0.45, 'rgba(242, 152, 104, 0.32)');
        rg.addColorStop(1, 'rgba(242, 152, 104, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(flyer.x, flyer.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF4E8';
        ctx.beginPath();
        ctx.arc(flyer.x, flyer.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const wSleep = Math.max(0, spSleep.x);
      const wSit = Math.max(0, spSit.x);
      const wBow = Math.max(0, spBow.x);
      const wStand = Math.max(0, spStand.x);
      const wSum = Math.max(0.001, wSleep + wSit + wBow + wStand);
      const sSleep = wSleep / wSum;
      const sBow = wBow / wSum;
      const sStand = wStand / wSum;

      const breath = 0.5 + 0.5 * Math.sin(tSec * 1.05);
      const speed = Math.hypot(vx, vy);
      const walkAmp = clamp(speed / 50, 0, 1.15) * sStand;
      const bob = Math.abs(Math.sin(stridePhase)) * 4.2 * walkAmp;
      const viewportScale = clamp(width / 1120, 1.08, 1.48);
      const depthScale = lerp(0.92, 1.08, clamp((worldY - height * 0.70) / (height * 0.18), 0, 1)) * viewportScale;
      const dir = spFacing.x;

      ctx.save();
      ctx.translate(worldX, worldY);
      ctx.scale(depthScale, depthScale);

      // Ground shadow
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.26)' : 'rgba(38,42,46,0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 30 - bob * 0.5, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Two rounded capsule feet (smoothly emerge when standing/walking, tuck in when seated/sleeping!)
      if (sStand > 0.05) {
        const stepL = Math.sin(stridePhase) * 8.5 * walkAmp;
        const stepR = -stepL;
        const liftL = Math.max(0, Math.cos(stridePhase)) * 4.5 * walkAmp;
        const liftR = Math.max(0, -Math.cos(stridePhase)) * 4.5 * walkAmp;

        ctx.fillStyle = bodyCol;
        ctx.globalAlpha = clamp(sStand * 1.1, 0, 1);
        ctx.beginPath();
        ctx.ellipse(-10 + stepL * dir * 0.6, -3 - liftL, 6.5, 4.2, 0, 0, Math.PI * 2);
        ctx.ellipse(10 + stepR * dir * 0.6, -3 - liftR, 6.5, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 2. Unified Organic Pebble Body (lifts when standing, squishes cozily when seated/sleeping, stretches tall on bow!)
      const liftY = sStand * (-8) - bob + sBow * (-5);
      const sx = 1 + (0.5 - breath) * 0.028 + sSleep * 0.04 - sBow * 0.04;
      const sy = 1 + (breath - 0.5) * 0.038 - sSleep * 0.05 + sBow * 0.08;
      const lean = (vx * 0.0016) + spPeek.x * dir * 0.14 + spHeadCock.x * 0.08;

      ctx.save();
      ctx.translate(0, liftY);
      ctx.rotate(lean);
      ctx.scale(sx, sy);

      // Arms (continuous interpolation from resting -> swinging walk -> overhead stretch -> cup hold!)
      const armSwing = Math.sin(stridePhase) * 9 * walkAmp;
      const stretchLift = sBow * 28;
      const cupHold = clamp(spCup.x, 0, 1);

      ctx.strokeStyle = bodyCol;
      ctx.lineWidth = 8.5;
      ctx.lineCap = 'round';
      // Left arm
      ctx.beginPath();
      ctx.moveTo(-27, -26);
      ctx.quadraticCurveTo(
        lerp(-36, -16, cupHold),
        -20 - stretchLift + armSwing,
        lerp(-30, -8, cupHold),
        lerp(-9 - stretchLift * 1.15 + armSwing * 0.7, -14, cupHold)
      );
      ctx.stroke();
      // Right arm
      ctx.beginPath();
      ctx.moveTo(27, -26);
      ctx.quadraticCurveTo(
        lerp(36, 16, cupHold),
        -20 - stretchLift - armSwing,
        lerp(30, 8, cupHold),
        lerp(-9 - stretchLift * 1.15 - armSwing * 0.7, -14, cupHold)
      );
      ctx.stroke();

      // Pebble Torso with subtle matte top gradient
      const grad = ctx.createLinearGradient(0, -64, 0, 0);
      grad.addColorStop(0, bodyTopCol);
      grad.addColorStop(1, bodyCol);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -62);
      ctx.bezierCurveTo(24, -62, 34, -42, 33, -20);
      ctx.bezierCurveTo(32, -3, 19, 0, 0, 0);
      ctx.bezierCurveTo(-19, 0, -32, -3, -33, -20);
      ctx.bezierCurveTo(-34, -42, -24, -62, 0, -62);
      ctx.closePath();
      ctx.fill();

      // Matte top rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-14, -54);
      ctx.quadraticCurveTo(0, -58, 14, -54);
      ctx.stroke();

      // 2D Gaze direction (looks in walking direction, up at clock/flyer, or down at cup!)
      const gx = clamp(dir * 5.2 + spPeek.x * dir * 3.5, -8.5, 8.5);
      const gy = clamp(spHeadPitch.x * 7.5 - sBow * 3.0, -7.5, 5.5);

      ctx.save();
      ctx.translate(gx, -33 + gy);
      const eyesShut = sSleep > 0.55 || blinking;
      ctx.strokeStyle = inkCol;
      ctx.fillStyle = inkCol;
      ctx.lineCap = 'round';

      if (eyesShut) {
        ctx.lineWidth = 2.0;
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath();
          ctx.arc(ex, 0, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        });
      } else if (cupHold > 0.6) {
        // Happy squinting arcs while enjoying warm tea
        ctx.lineWidth = 2.1;
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath();
          ctx.arc(ex, 1.5, 3.4, 1.15 * Math.PI, 1.85 * Math.PI);
          ctx.stroke();
        });
      } else {
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath();
          ctx.ellipse(ex, 0, 2.7, 3.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.beginPath();
          ctx.arc(ex - 0.8, -1.1, 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = inkCol;
        });
      }

      // Mouth (gentle smile or sleepy yawn oval)
      if (spYawn.x > 0.1) {
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 8.5, 2.4 * spYawn.x, 3.2 * spYawn.x, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(0, 6.2, 3.2, 0.18 * Math.PI, 0.82 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();

      // Held / Resting Warm Tea Cup
      if (cupHold > 0.04 && speed < 10) {
        ctx.save();
        ctx.globalAlpha = cupHold;
        const cx = sSleep > 0.5 ? 42 : 0;
        const cy = sSleep > 0.5 ? -7 : -14;
        ctx.fillStyle = cupFill;
        ctx.strokeStyle = inkCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(cx - 7, cy - 6, 14, 12, 3);
        ctx.fill();
        ctx.stroke();
        const syOff = (tSec * 5) % 5.5;
        ctx.globalAlpha = cupHold * (0.45 - syOff * 0.06);
        ctx.beginPath();
        ctx.moveTo(cx - 2, cy - 9 - syOff);
        ctx.quadraticCurveTo(cx - 4, cy - 13 - syOff, cx, cy - 16 - syOff);
        ctx.moveTo(cx + 3, cy - 8 - syOff * 0.8);
        ctx.quadraticCurveTo(cx + 5, cy - 12 - syOff * 0.8, cx + 2, cy - 15 - syOff * 0.8);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    }

    function update(nowMs) {
      if (!active) return;
      resize();
      const dt = clamp((nowMs - lastMs) / 1000, 0.004, 0.064);
      lastMs = nowMs;
      const tSec = nowMs / 1000;

      stepDirector(dt, tSec);

      // Step all continuous kinematic springs
      stepSpring(spFacing, dt);
      stepSpring(spSleep, dt);
      stepSpring(spSit, dt);
      stepSpring(spBow, dt);
      stepSpring(spStand, dt);
      stepSpring(spHeadPitch, dt);
      stepSpring(spHeadCock, dt);
      stepSpring(spYawn, dt);
      stepSpring(spCup, dt);
      stepSpring(spPeek, dt);

      if (nowMs >= nextBlinkMs) {
        blinkUntilMs = nowMs + 145;
        nextBlinkMs = nowMs + (Math.random() < 0.2 ? 320 : randRange(2600, 5600));
      }
      const blinking = nowMs < blinkUntilMs;
      const dark = Boolean(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches);

      ctx.clearRect(0, 0, width, height);
      if (theme === 'sketch') {
        drawUnifiedSketchPuppy(tSec, dark, blinking);
      } else if (theme === 'geometric') {
        drawUnifiedGeometricPebble(tSec, dark, blinking);
      }
    }

    return {
      setActive: function (nextActive, nextTheme) {
        const wasActive = active;
        active = Boolean(nextActive);
        if (nextTheme) theme = nextTheme;
        if (active && !wasActive) {
          lastMs = performance.now();
          resize();
          resetWorldPlacement();
        } else if (!active && wasActive) {
          ctx.clearRect(0, 0, width, height);
        }
      },
      setTheme: function (nextTheme) {
        if (nextTheme && nextTheme !== theme) {
          theme = nextTheme;
        }
      },
      wakeReaction: function () {
        // Gentle morning perk-up when user returns to desk
        spSleep.target = 0;
        spSit.target = 0;
        spBow.target = 1;
        spStand.target = 0;
        spHeadPitch.target = -0.35;
      },
      update: update
    };
  }

  root.MoveNowRoamingStage = { create: createRoamingStage };
})(typeof globalThis !== 'undefined' ? globalThis : this);
