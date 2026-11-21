(function (root) {
  'use strict';

  /**
   * Procedural Optical Physics Renderer for MoveNow ("自然视窗" & Stage-2 Frost Seal):
   * Designed to layer directly over macOS's real blurred desktop (NSVisualEffectView behindWindow)
   * with genuine optical contrast in BOTH bright light-mode windows and dark-mode workspaces:
   * - bokeh: Multi-layered optical depth-of-field bokeh discs with spherical-aberration rim rings
   * - mist:  Cool-warm condensing window fog + micro-beads + refractive sliding droplets with shadows & trails
   * - frost: Dual-pass glacial blue-slate + crystalline white fractal 60-deg dendrites + radial warm thaw
   */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function isDarkScheme() {
    return Boolean(root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function breathCurve(tSec) {
    // 10s cycle: 4s inhale (0 -> 1), 6s exhale (1 -> 0)
    const cycle = tSec % 10;
    if (cycle < 4) {
      return 0.5 - 0.5 * Math.cos(Math.PI * (cycle / 4));
    }
    return 0.5 + 0.5 * Math.cos(Math.PI * ((cycle - 4) / 6));
  }

  function createOpticalCanvas(canvas, options) {
    const opts = options || {};
    const compact = Boolean(opts.compact);
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let mode = opts.mode || 'bokeh'; // 'bokeh' | 'mist' | 'frost' | 'warm_matte' | 'vellum'
    let deepSeal = Boolean(opts.deepSeal);
    let easterEgg = null;
    let mood = 'calm';

    let modeEnteredAt = performance.now();
    let thawing = false;
    let thawStartedAt = 0;
    const THAW_DURATION_MS = 820;

    let bokehDiscs = [];
    let mistBeads = [];
    let droplets = [];
    let frostOffscreen = null;
    let vellumOffscreen = null;
    let frostSeed = Math.floor(Math.random() * 100000);
    let lastDark = isDarkScheme();

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(40, Math.round(rect.width || canvas.width || 300));
      const nextH = Math.max(40, Math.round(rect.height || canvas.height || 200));
      const nextDpr = Math.min(2, root.devicePixelRatio || 1);
      if (nextW === width && nextH === height && nextDpr === dpr) return;

      width = nextW;
      height = nextH;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      rebuildEntities();
    }

    function rebuildEntities() {
      const dark = isDarkScheme();
      lastDark = dark;
      const rand = mulberry32(frostSeed);

      // 1. Bokeh discs with distinct depth planes & natural palette
      const discCount = compact ? 11 : 32;
      bokehDiscs = [];
      for (let i = 0; i < discCount; i++) {
        const depth = 0.28 + rand() * 0.72;
        const baseR = (compact ? 12 : 44) + rand() * (compact ? 22 : 118) * depth;
        const toneRoll = rand();
        const warmLimit = easterEgg === 'golden_bokeh' ? 0.65 : 0.38;
        const tone = toneRoll < warmLimit ? 'warm' : (toneRoll < 0.76 ? 'cool' : 'sage');
        bokehDiscs.push({
          x: rand() * width,
          y: rand() * height,
          r: baseR,
          depth: depth,
          vx: (rand() - 0.5) * (compact ? 5 : 11) * depth,
          vy: (rand() - 0.5) * (compact ? 4 : 8) * depth,
          phase: rand() * Math.PI * 2,
          tone: tone,
          alpha: (compact ? 0.22 : 0.16) + rand() * (compact ? 0.18 : 0.18)
        });
      }

      // 2. Mist micro-beads & gravity droplets
      const beadCount = compact ? 36 : 190;
      mistBeads = [];
      for (let i = 0; i < beadCount; i++) {
        mistBeads.push({
          x: rand() * width,
          y: rand() * height,
          r: (compact ? 0.9 : 1.2) + rand() * (compact ? 1.8 : 3.2),
          alpha: 0.24 + rand() * 0.34,
          phase: rand() * Math.PI * 2
        });
      }

      const dropCount = compact ? 4 : 14;
      droplets = [];
      for (let i = 0; i < dropCount; i++) {
        droplets.push({
          x: width * (0.06 + rand() * 0.88),
          y: rand() * height * 0.75,
          r: (compact ? 2.4 : 4.0) + rand() * (compact ? 1.8 : 4.2),
          speed: (compact ? 9 : 18) + rand() * (compact ? 12 : 30),
          wobble: rand() * Math.PI * 2,
          wait: rand() * 4.5,
          trailLen: compact ? 10 : 36
        });
      }

      // 3. Pre-baked dual-pass fractal frost texture & vellum tracing-paper texture
      bakeFrostTexture(dark);
      bakeVellumTexture(dark);
    }

    function bakeVellumTexture(dark) {
      if (width <= 0 || height <= 0) return;
      const off = document.createElement('canvas');
      off.width = Math.round(width * dpr);
      off.height = Math.round(height * dpr);
      const vctx = off.getContext('2d');
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // A · Kindle E-ink Warm Paper (84% luminance #DFDAD0 in Light; Soft Slate Chalkboard #32363B in Dark — zero glare on 27" monitors!)
      vctx.fillStyle = dark ? 'rgba(50, 54, 59, 0.88)' : 'rgba(223, 218, 208, 0.88)';
      vctx.fillRect(0, 0, width, height);

      const rand = mulberry32(frostSeed + 31337);
      // Subtle tactile paper fibers
      const fiberCount = compact ? 90 : 520;
      vctx.lineCap = 'round';
      for (let i = 0; i < fiberCount; i++) {
        const fx = rand() * width;
        const fy = rand() * height;
        const len = 4 + rand() * 12;
        const ang = rand() * Math.PI * 2;
        vctx.strokeStyle = dark
          ? 'rgba(228, 223, 211,' + (0.022 + rand() * 0.026).toFixed(3) + ')'
          : 'rgba(116, 110, 100,' + (0.026 + rand() * 0.032).toFixed(3) + ')';
        vctx.lineWidth = 0.65;
        vctx.beginPath();
        vctx.moveTo(fx, fy);
        vctx.lineTo(fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
        vctx.stroke();
      }

      vellumOffscreen = off;
    }

    function drawDendrite(fctx, x, y, angle, length, depth, dark, rand) {
      if (depth <= 0 || length < 3.2) return;
      const ex = x + Math.cos(angle) * length;
      const ey = y + Math.sin(angle) * length;

      // Pass 1: Cool glacial refraction shadow (critical for visibility over bright light-mode windows!)
      fctx.beginPath();
      fctx.moveTo(x, y);
      fctx.lineTo(ex, ey);
      fctx.lineWidth = Math.max(0.9, depth * (compact ? 0.58 : 0.92));
      fctx.strokeStyle = dark
        ? 'rgba(130, 186, 224,' + (0.20 + depth * 0.11).toFixed(3) + ')'
        : 'rgba(84, 128, 166,' + (0.18 + depth * 0.11).toFixed(3) + ')';
      fctx.stroke();

      // Pass 2: Crisp offset snow-white ice specular edge
      fctx.beginPath();
      fctx.moveTo(x - 0.8, y - 0.8);
      fctx.lineTo(ex - 0.8, ey - 0.8);
      fctx.lineWidth = Math.max(0.6, depth * (compact ? 0.36 : 0.55));
      fctx.strokeStyle = dark
        ? 'rgba(232, 246, 255,' + (0.26 + depth * 0.12).toFixed(3) + ')'
        : 'rgba(255, 255, 255,' + (0.48 + depth * 0.12).toFixed(3) + ')';
      fctx.stroke();

      const branches = depth >= 4 ? 3 : 2;
      for (let b = 1; b <= branches; b++) {
        const frac = (b / (branches + 0.42)) + (rand() - 0.5) * 0.08;
        const bx = x + (ex - x) * frac;
        const by = y + (ey - y) * frac;
        const spread = (56 + rand() * 10) * (Math.PI / 180);
        const subLen = length * (0.50 + rand() * 0.16);
        drawDendrite(fctx, bx, by, angle + spread, subLen, depth - 1, dark, rand);
        drawDendrite(fctx, bx, by, angle - spread, subLen, depth - 1, dark, rand);
      }

      if (rand() < 0.80) {
        drawDendrite(
          fctx,
          ex,
          ey,
          angle + (rand() - 0.5) * 0.22,
          length * 0.70,
          depth - 1,
          dark,
          rand
        );
      }
    }

    function bakeFrostTexture(dark) {
      if (width <= 0 || height <= 0) return;
      const off = document.createElement('canvas');
      off.width = Math.round(width * dpr);
      off.height = Math.round(height * dpr);
      const fctx = off.getContext('2d');
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rand = mulberry32(frostSeed + 7919);

      // Perimeter glacial frost gradient: keeps blurred desktop silhouettes perceptible in center
      // while building unmistakable icy frost depth around all 4 edges & corners
      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxR = Math.hypot(cx, cy);
      const veilGrad = fctx.createRadialGradient(cx, cy, maxR * 0.10, cx, cy, maxR * 1.02);
      if (dark) {
        veilGrad.addColorStop(0, 'rgba(170, 206, 232, 0.10)');
        veilGrad.addColorStop(0.55, 'rgba(154, 196, 228, 0.24)');
        veilGrad.addColorStop(1, 'rgba(182, 220, 246, 0.54)');
      } else {
        veilGrad.addColorStop(0, 'rgba(210, 228, 242, 0.14)');
        veilGrad.addColorStop(0.55, 'rgba(184, 212, 234, 0.34)');
        veilGrad.addColorStop(1, 'rgba(148, 186, 216, 0.62)');
      }
      fctx.fillStyle = veilGrad;
      fctx.fillRect(0, 0, width, height);

      // Crystalline ice facets (dual-tone dots near perimeter)
      const grainCount = compact ? 110 : 620;
      for (let i = 0; i < grainCount; i++) {
        const edgeBias = rand() < 0.78;
        let gx, gy;
        if (edgeBias) {
          const side = Math.floor(rand() * 4);
          const inset = Math.pow(rand(), 1.9) * Math.min(width, height) * 0.44;
          if (side === 0) { gx = rand() * width; gy = inset; }
          else if (side === 1) { gx = rand() * width; gy = height - inset; }
          else if (side === 2) { gx = inset; gy = rand() * height; }
          else { gx = width - inset; gy = rand() * height; }
        } else {
          gx = rand() * width;
          gy = rand() * height;
        }
        const gr = (compact ? 0.8 : 1.1) + rand() * (compact ? 2.2 : 4.8);
        const isBright = rand() < 0.55;
        if (dark) {
          fctx.fillStyle = isBright
            ? 'rgba(235, 248, 255,' + (0.08 + rand() * 0.18).toFixed(3) + ')'
            : 'rgba(142, 192, 228,' + (0.08 + rand() * 0.14).toFixed(3) + ')';
        } else {
          fctx.fillStyle = isBright
            ? 'rgba(255, 255, 255,' + (0.34 + rand() * 0.36).toFixed(3) + ')'
            : 'rgba(104, 148, 184,' + (0.12 + rand() * 0.18).toFixed(3) + ')';
        }
        fctx.beginPath();
        fctx.arc(gx, gy, gr, 0, Math.PI * 2);
        fctx.fill();
      }

      // Fractal 60-degree dendritic ice ferns growing inward from corners & all 4 edges
      fctx.lineCap = 'round';
      const minDim = Math.min(width, height);
      const maxDepth = compact ? 3 : 4;

      const corners = [
        { x: 0, y: 0, baseAngle: Math.PI * 0.25 },
        { x: width, y: 0, baseAngle: Math.PI * 0.75 },
        { x: width, y: height, baseAngle: -Math.PI * 0.75 },
        { x: 0, y: height, baseAngle: -Math.PI * 0.25 }
      ];
      corners.forEach(function (c) {
        const fronds = compact ? 3 : 6;
        for (let k = 0; k < fronds; k++) {
          const offset = (k - (fronds - 1) / 2) * 0.26 + (rand() - 0.5) * 0.10;
          const len = minDim * (compact ? 0.30 : 0.22 + rand() * 0.12);
          drawDendrite(fctx, c.x, c.y, c.baseAngle + offset, len, maxDepth, dark, rand);
        }
      });

      if (!compact) {
        const edgeSeeds = 18;
        for (let i = 0; i < edgeSeeds; i++) {
          const side = i % 4;
          let sx, sy, ang;
          if (side === 0) {
            sx = width * (0.10 + rand() * 0.80);
            sy = 0;
            ang = Math.PI * 0.5 + (rand() - 0.5) * 0.48;
          } else if (side === 1) {
            sx = width * (0.10 + rand() * 0.80);
            sy = height;
            ang = -Math.PI * 0.5 + (rand() - 0.5) * 0.48;
          } else if (side === 2) {
            sx = 0;
            sy = height * (0.12 + rand() * 0.76);
            ang = (rand() - 0.5) * 0.48;
          } else {
            sx = width;
            sy = height * (0.12 + rand() * 0.76);
            ang = Math.PI + (rand() - 0.5) * 0.48;
          }
          const len = minDim * (0.12 + rand() * 0.09);
          drawDendrite(fctx, sx, sy, ang, len, 3, dark, rand);
        }
      }

      frostOffscreen = off;
    }

    function renderBokeh(nowMs, dtSec, dark, thawFrac) {
      const t = nowMs / 1000;
      const b = breathCurve(t);
      const amp = mood === 'dnd' ? 0.35 : 1.0;

      // Subtle photographic aperture vignette over real blurred desktop; deepens in Sealed Mode
      const grad = ctx.createRadialGradient(width * 0.5, height * 0.48, Math.min(width, height) * 0.12, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
      if (dark) {
        grad.addColorStop(0, deepSeal ? 'rgba(18, 24, 34, 0.34)' : 'rgba(20, 28, 38, 0.04)');
        grad.addColorStop(1, deepSeal ? 'rgba(10, 14, 22, 0.68)' : 'rgba(10, 14, 22, 0.38)');
      } else {
        grad.addColorStop(0, deepSeal ? 'rgba(232, 238, 244, 0.40)' : 'rgba(32, 48, 64, 0.02)');
        grad.addColorStop(1, deepSeal ? 'rgba(196, 210, 224, 0.62)' : 'rgba(56, 78, 100, 0.20)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sealed mode expands bokeh circles of confusion; wake triggers Rack Focus contraction
      const sealBoost = deepSeal ? 1.36 : 1.0;
      const focusScale = Math.max(0.12, sealBoost * (1 - thawFrac * 0.80) * (0.93 + b * 0.12 * amp));

      for (let i = 0; i < bokehDiscs.length; i++) {
        const d = bokehDiscs[i];
        d.x += d.vx * dtSec;
        d.y += d.vy * dtSec;
        if (d.x < -d.r) d.x = width + d.r;
        if (d.x > width + d.r) d.x = -d.r;
        if (d.y < -d.r) d.y = height + d.r;
        if (d.y > height + d.r) d.y = -d.r;

        const r = d.r * focusScale;
        const pulse = 0.84 + 0.16 * Math.sin(t * 0.75 + d.phase);
        const alpha = d.alpha * pulse * (1 - thawFrac);

        let rgb, rimRgb;
        if (d.tone === 'warm') {
          rgb = dark ? '224, 174, 126' : '212, 146, 86';
          rimRgb = dark ? '252, 220, 186' : '232, 176, 120';
        } else if (d.tone === 'sage') {
          rgb = dark ? '132, 184, 166' : '96, 152, 134';
          rimRgb = dark ? '194, 232, 218' : '128, 180, 162';
        } else {
          rgb = dark ? '138, 188, 216' : '92, 144, 184';
          rimRgb = dark ? '206, 236, 252' : '132, 178, 212';
        }

        const rg = ctx.createRadialGradient(d.x, d.y, r * 0.10, d.x, d.y, r);
        rg.addColorStop(0, 'rgba(' + rgb + ',' + (alpha * 0.34).toFixed(3) + ')');
        rg.addColorStop(0.72, 'rgba(' + rgb + ',' + (alpha * 0.56).toFixed(3) + ')');
        rg.addColorStop(0.90, 'rgba(' + rimRgb + ',' + (alpha * 1.15).toFixed(3) + ')');
        rg.addColorStop(1, 'rgba(' + rgb + ',0)');

        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Turrell Solar Orbit & Celestial Dial in Big-Screen Sealed Mode!
      if (deepSeal && !compact) {
        const vis = Math.max(0, 1 - thawFrac * 1.3);
        if (vis > 0.01) {
          const cx = width * 0.5;
          const cy = height * 0.44;
          const R = Math.min(width * 0.28, height * 0.30, 260);
          // Smooth continuous 60-second celestial orbit synced to real seconds + ms
          const nowDate = new Date();
          const secFrac = (nowDate.getSeconds() + nowDate.getMilliseconds() / 1000) / 60;
          const angle = secFrac * Math.PI * 2 - Math.PI * 0.5;
          const sx = cx + Math.cos(angle) * R;
          const sy = cy + Math.sin(angle) * R;

          ctx.save();
          ctx.globalAlpha = vis;

          // Rotating Turrell atmospheric radial light spill following the sun pearl
          const spill = ctx.createRadialGradient(sx, sy, 4, cx, cy, R * 1.85);
          if (dark) {
            spill.addColorStop(0, 'rgba(255, 190, 134, 0.34)');
            spill.addColorStop(0.42, 'rgba(226, 136, 98, 0.12)');
            spill.addColorStop(0.80, 'rgba(84, 140, 174, 0.06)');
          } else {
            spill.addColorStop(0, 'rgba(244, 162, 102, 0.32)');
            spill.addColorStop(0.45, 'rgba(224, 138, 94, 0.12)');
            spill.addColorStop(0.82, 'rgba(92, 146, 176, 0.06)');
          }
          spill.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = spill;
          ctx.fillRect(0, 0, width, height);

          // 60 fine celestial dial ticks
          for (let k = 0; k < 60; k++) {
            const a = (k / 60) * Math.PI * 2;
            const major = k % 5 === 0;
            const r1 = R - (major ? 7 : 3.5);
            const r2 = R + (major ? 7 : 3.5);
            ctx.strokeStyle = dark
              ? (major ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.10)')
              : (major ? 'rgba(36,52,68,0.26)' : 'rgba(36,52,68,0.10)');
            ctx.lineWidth = major ? 1.3 : 0.85;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
            ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
            ctx.stroke();
          }

          // Main hairline orbital ring
          ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(36,52,68,0.16)';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.stroke();

          // Luminous trailing comet arc behind sun pearl
          ctx.strokeStyle = dark ? 'rgba(255, 196, 146, 0.62)' : 'rgba(224, 130, 78, 0.62)';
          ctx.lineWidth = 2.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(cx, cy, R, angle - 0.88, angle);
          ctx.stroke();

          // Glowing sun pearl
          ctx.shadowColor = dark ? 'rgba(255, 180, 120, 0.92)' : 'rgba(230, 130, 75, 0.78)';
          ctx.shadowBlur = 18;
          ctx.fillStyle = dark ? '#FFE8CC' : '#EA8652';
          ctx.beginPath();
          ctx.arc(sx, sy, 5.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.restore();
        }
      }
    }

    function renderMist(nowMs, dtSec, dark, thawFrac) {
      const t = nowMs / 1000;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const fogGrow = Math.min(1, elapsedSec / 1.6);
      const visibility = fogGrow * (1 - thawFrac);
      if (visibility <= 0.005) return;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxR = Math.hypot(cx, cy);

      // Cool-tinted condensation layer; becomes dense creamy-cool privacy vapor in Sealed Mode
      const fogGrad = ctx.createRadialGradient(cx, cy, maxR * 0.08, cx, cy, maxR * 1.05);
      const density = deepSeal ? 1.55 : 1.0;
      if (dark) {
        fogGrad.addColorStop(0, 'rgba(182, 200, 214,' + Math.min(0.62, 0.10 * density * visibility).toFixed(3) + ')');
        fogGrad.addColorStop(0.60, 'rgba(176, 198, 216,' + Math.min(0.74, 0.26 * density * visibility).toFixed(3) + ')');
        fogGrad.addColorStop(1, 'rgba(196, 214, 228,' + Math.min(0.84, 0.46 * density * visibility).toFixed(3) + ')');
      } else {
        fogGrad.addColorStop(0, 'rgba(222, 230, 238,' + Math.min(0.72, 0.18 * density * visibility).toFixed(3) + ')');
        fogGrad.addColorStop(0.60, 'rgba(202, 214, 224,' + Math.min(0.82, 0.36 * density * visibility).toFixed(3) + ')');
        fogGrad.addColorStop(1, 'rgba(174, 192, 208,' + Math.min(0.88, 0.52 * density * visibility).toFixed(3) + ')');
      }
      ctx.save();
      if (thawFrac > 0) {
        // Horizontal breeze sweep clears mist from left to right
        ctx.translate(thawFrac * width * 0.12, 0);
      }
      ctx.fillStyle = fogGrad;
      ctx.fillRect(-width * 0.15, 0, width * 1.3, height);

      // Soft drifting mist clouds
      const puffCount = compact ? 3 : 6;
      for (let i = 0; i < puffCount; i++) {
        const px = width * (0.15 + (i / puffCount) * 0.70) + Math.sin(t * 0.28 + i * 1.7) * (compact ? 14 : 52);
        const py = height * (0.22 + ((i * 37) % 100) / 165) + Math.cos(t * 0.22 + i) * (compact ? 10 : 34);
        const pr = (compact ? 36 : 210) + (i % 3) * (compact ? 12 : 70);
        const pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
        pg.addColorStop(0, dark
          ? 'rgba(218, 232, 242,' + (0.13 * visibility).toFixed(3) + ')'
          : 'rgba(255, 255, 255,' + (0.34 * visibility).toFixed(3) + ')');
        pg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Condensation micro-beads with subtle shadow edge so they're tangible on bright windows
      for (let i = 0; i < mistBeads.length; i++) {
        const mb = mistBeads[i];
        const a = mb.alpha * visibility * (0.85 + 0.15 * Math.sin(t * 0.6 + mb.phase));
        if (!dark) {
          ctx.fillStyle = 'rgba(84, 108, 128,' + (a * 0.34).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(mb.x + 0.6, mb.y + 0.8, mb.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = dark
          ? 'rgba(226, 238, 248,' + (a * 0.55).toFixed(3) + ')'
          : 'rgba(255, 255, 255,' + (a * 0.88).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(mb.x, mb.y, mb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Realistic refracting gravity droplets with dark refractive shadow + lower bright caustic crescent + trail
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        if (d.wait > 0) {
          d.wait -= dtSec;
        } else {
          const dy = d.speed * dtSec;
          d.y += dy;
          d.x += Math.sin(t * 1.4 + d.wobble) * 3.8 * dtSec;
          d.trailLen = Math.min(compact ? 30 : 140, d.trailLen + dy * 0.90);
          if (d.y > height + 24) {
            d.y = -12;
            d.x = width * (0.08 + ((i * 0.17 + (t * 0.03)) % 0.84));
            d.trailLen = 0;
            d.wait = 1.0 + (i % 4) * 1.0;
          }
        }

        // Visible damp track left by sliding droplet
        if (d.trailLen > 4) {
          const tg = ctx.createLinearGradient(d.x, d.y - d.trailLen, d.x, d.y);
          tg.addColorStop(0, 'rgba(90, 114, 136, 0)');
          tg.addColorStop(1, dark
            ? 'rgba(180, 206, 224,' + (0.24 * visibility).toFixed(3) + ')'
            : 'rgba(104, 128, 150,' + (0.28 * visibility).toFixed(3) + ')');
          ctx.strokeStyle = tg;
          ctx.lineWidth = d.r * 0.78;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(d.x, d.y - d.trailLen);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }

        // 1) Refractive shadow underneath droplet
        ctx.fillStyle = dark
          ? 'rgba(8, 16, 26,' + (0.45 * visibility).toFixed(3) + ')'
          : 'rgba(66, 90, 114,' + (0.30 * visibility).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(d.x + 1.0, d.y + 1.6, d.r * 0.90, d.r * 1.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2) Glassy water body
        ctx.fillStyle = dark
          ? 'rgba(210, 232, 248,' + (0.34 * visibility).toFixed(3) + ')'
          : 'rgba(232, 244, 252,' + (0.72 * visibility).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, d.r * 0.88, d.r * 1.16, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3) Subtle rim outline + luminous bottom caustic arc + top specular glint
        ctx.strokeStyle = dark
          ? 'rgba(230, 246, 255,' + (0.45 * visibility).toFixed(3) + ')'
          : 'rgba(116, 146, 170,' + (0.40 * visibility).toFixed(3) + ')';
        ctx.lineWidth = 0.85;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255,' + (0.92 * visibility).toFixed(3) + ')';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(d.x, d.y + d.r * 0.24, d.r * 0.56, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255,' + (0.90 * visibility).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.26, d.y - d.r * 0.36, Math.max(0.8, d.r * 0.22), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (deepSeal && !compact) {
        renderVitalityWave(nowMs, dark, visibility);
      }
    }

    function renderVitalityWave(nowMs, dark, vis) {
      if (vis <= 0.02) return;
      const t = nowMs / 1000;
      const leftX = width * 0.09;
      const rightX = width * 0.91;
      const span = rightX - leftX;
      const baseY = height * 0.885;

      ctx.save();
      ctx.globalAlpha = vis;
      // Dual-layered silky background-task vitality waves
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = layer === 0
          ? (dark ? 'rgba(156, 216, 248, 0.44)' : 'rgba(72, 126, 168, 0.36)')
          : (dark ? 'rgba(210, 238, 255, 0.22)' : 'rgba(92, 146, 184, 0.18)');
        ctx.lineWidth = layer === 0 ? 1.5 : 1.1;
        ctx.beginPath();
        for (let x = leftX; x <= rightX; x += 5) {
          const norm = (x - leftX) / span;
          const env = Math.sin(norm * Math.PI);
          const phaseShift = layer * 1.4;
          const y = baseY
            + Math.sin(norm * 15 - t * 2.6 + phaseShift) * (layer === 0 ? 7.5 : 5.0) * env
            + Math.sin(norm * 8 + t * 1.5 - phaseShift) * 3.8 * env;
          if (x === leftX) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function renderWarmMatte(nowMs, dark, thawFrac) {
      const t = nowMs / 1000;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.25 + (elapsedSec / 1.4) * 0.75);
      const alpha = grow * (1 - thawFrac);
      if (alpha <= 0.005) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      // E-ink Warm Matte Stone veil (~84% luminance in Light, zero floodlight glare on big monitors!)
      ctx.fillStyle = dark ? 'rgba(28, 30, 34, 0.84)' : 'rgba(224, 220, 211, 0.86)';
      ctx.fillRect(0, 0, width, height);

      // Slow organic warm apricot & sage depth orbs behind the Giant Glass Clock
      const clouds = [
        { x: 0.28, y: 0.36, r: 0.36, warm: true, sp: 0.24 },
        { x: 0.72, y: 0.58, r: 0.40, warm: false, sp: 0.19 },
        { x: 0.50, y: 0.42, r: 0.28, warm: true, sp: 0.31 },
        { x: 0.38, y: 0.66, r: 0.30, warm: false, sp: 0.27 }
      ];
      clouds.forEach(function (c, i) {
        const px = width * c.x + Math.sin(t * c.sp + i * 2.1) * (width * 0.065);
        const py = height * c.y + Math.cos(t * (c.sp * 0.85) + i * 1.4) * (height * 0.055);
        const pr = Math.min(width, height) * c.r;
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        if (c.warm) {
          g.addColorStop(0, dark ? 'rgba(220, 138, 102, 0.22)' : 'rgba(216, 138, 98, 0.24)');
        } else {
          g.addColorStop(0, dark ? 'rgba(116, 168, 150, 0.18)' : 'rgba(108, 156, 140, 0.20)');
        }
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      });
      ctx.restore();
    }

    function renderVellum(nowMs, thawFrac) {
      if (!vellumOffscreen) return;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.25 + (elapsedSec / 1.2) * 0.75);
      const alpha = grow * (1 - thawFrac);
      if (alpha <= 0.005) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      if (thawFrac > 0) {
        // Gentle translucent paper lift upward on wake
        ctx.translate(0, -thawFrac * 24);
      }
      ctx.drawImage(vellumOffscreen, 0, 0, width, height);
      ctx.restore();
    }

    function renderFrost(nowMs, dark, thawFrac) {
      if (!frostOffscreen) return;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.22 + (elapsedSec / 2.0) * 0.78);
      const easedGrow = 1 - Math.pow(1 - grow, 3);

      ctx.save();
      ctx.globalAlpha = easedGrow;
      ctx.drawImage(frostOffscreen, 0, 0, width, height);

      // Sweeping iridescent aurora shimmer & drifting micro ice sparkles in Sealed Mode
      const t = nowMs / 1000;
      const sweepPos = ((t * 0.14) % 1.8) - 0.4;
      const sweepGrad = ctx.createLinearGradient(
        width * (sweepPos - 0.28), 0,
        width * (sweepPos + 0.28), height * 0.85
      );
      const shimPeak = (deepSeal ? 0.22 : 0.08) * easedGrow * (1 - thawFrac);
      sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGrad.addColorStop(0.45, dark
        ? 'rgba(186, 228, 255,' + shimPeak.toFixed(3) + ')'
        : 'rgba(255, 255, 255,' + (shimPeak * 1.45).toFixed(3) + ')');
      sweepGrad.addColorStop(0.55, dark
        ? 'rgba(225, 245, 255,' + (shimPeak * 1.2).toFixed(3) + ')'
        : 'rgba(210, 236, 255,' + (shimPeak * 1.1).toFixed(3) + ')');
      sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, 0, width, height);

      if (deepSeal && !compact) {
        const sparkleVis = easedGrow * (1 - thawFrac);
        for (let s = 0; s < 24; s++) {
          const sx = (((s * 0.137) + t * (0.008 + (s % 3) * 0.004)) % 1) * width;
          const sy = (((s * 0.219) + t * (0.014 + (s % 4) * 0.005)) % 1) * height;
          const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.8 + s * 1.9));
          ctx.fillStyle = dark
            ? 'rgba(226, 244, 255,' + (twinkle * 0.58 * sparkleVis).toFixed(3) + ')'
            : 'rgba(255, 255, 255,' + (twinkle * 0.82 * sparkleVis).toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.4 + (s % 3) * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (deepSeal && !compact) {
        renderVitalityWave(nowMs, dark, easedGrow * (1 - thawFrac));
      }

      // Radial warm thaw from center outward (~0.82s)
      if (thawFrac > 0) {
        const cx = width * 0.5;
        const cy = height * 0.5;
        const maxR = Math.hypot(cx, cy) * 1.18;
        const easeThaw = 1 - Math.pow(1 - thawFrac, 2.2);
        const meltR = easeThaw * maxR;

        ctx.globalCompositeOperation = 'destination-out';
        const meltGrad = ctx.createRadialGradient(cx, cy, Math.max(0, meltR * 0.56), cx, cy, Math.max(1, meltR));
        meltGrad.addColorStop(0, 'rgba(0,0,0,1)');
        meltGrad.addColorStop(0.74, 'rgba(0,0,0,0.88)');
        meltGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = meltGrad;
        ctx.fillRect(0, 0, width, height);

        // Warm luminous melt rim
        ctx.globalCompositeOperation = 'source-over';
        const rimAlpha = Math.sin(thawFrac * Math.PI) * 0.28;
        ctx.strokeStyle = dark
          ? 'rgba(246, 224, 198,' + rimAlpha.toFixed(3) + ')'
          : 'rgba(248, 226, 194,' + rimAlpha.toFixed(3) + ')';
        ctx.lineWidth = compact ? 8 : 28;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, meltR * 0.84), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    let lastFrameMs = performance.now();

    function update(nowMs) {
      resize();
      const dark = isDarkScheme();
      if (dark !== lastDark) {
        rebuildEntities();
      }

      const dtSec = Math.min(0.1, Math.max(0.008, (nowMs - lastFrameMs) / 1000));
      lastFrameMs = nowMs;

      let thawFrac = 0;
      if (thawing) {
        thawFrac = Math.min(1, (nowMs - thawStartedAt) / THAW_DURATION_MS);
      }

      ctx.clearRect(0, 0, width, height);

      if (mode === 'mist') {
        renderMist(nowMs, dtSec, dark, thawFrac);
      } else if (mode === 'frost') {
        renderFrost(nowMs, dark, thawFrac);
      } else if (mode === 'warm_matte') {
        renderWarmMatte(nowMs, dark, thawFrac);
      } else if (mode === 'vellum') {
        renderVellum(nowMs, thawFrac);
      } else {
        renderBokeh(nowMs, dtSec, dark, thawFrac);
      }
    }

    return {
      setMode: function (nextMode, nextMeta) {
        const meta = nextMeta || {};
        const resolved = ['bokeh', 'mist', 'frost', 'warm_matte', 'vellum'].includes(nextMode) ? nextMode : 'bokeh';
        if (resolved !== mode) {
          mode = resolved;
          modeEnteredAt = performance.now();
          thawing = false;
        }
        if (meta.deepSeal !== undefined) deepSeal = Boolean(meta.deepSeal);
        if (meta.easterEgg !== undefined) easterEgg = meta.easterEgg;
        if (meta.mood !== undefined) mood = meta.mood;
      },
      startThaw: function () {
        if (!thawing) {
          thawing = true;
          thawStartedAt = performance.now();
        }
      },
      resetThaw: function () {
        thawing = false;
        modeEnteredAt = performance.now();
      },
      update: update
    };
  }

  /**
   * Compact stage renderer wrapper used by ThemeStage (Popover card / Welcome card)
   */
  function createNatureWindowStage(container, options) {
    const showBreathLabel = Boolean(options && options.showBreathLabel);
    container.innerHTML =
      '<div class="mn-nature-card-stage">' +
      '  <canvas class="mn-nature-canvas"></canvas>' +
      (showBreathLabel ? '<span class="mn-breath-label">吸气</span>' : '') +
      '</div>';

    const canvas = container.querySelector('.mn-nature-canvas');
    const label = container.querySelector('.mn-breath-label');
    const engine = createOpticalCanvas(canvas, { compact: true, mode: 'bokeh' });

    return {
      setState: function (next) {
        const s = next || {};
        const style = s.natureStyle && s.natureStyle !== 'auto' ? s.natureStyle : 'bokeh';
        engine.setMode(style, { easterEgg: s.easterEgg, mood: s.mood });
      },
      update: function (nowMs) {
        engine.update(nowMs);
        if (label) {
          const cycle = (nowMs / 1000) % 10;
          label.textContent = cycle < 4 ? '吸气' : '呼气';
        }
      }
    };
  }

  root.MoveNowNatureOptics = { createCanvas: createOpticalCanvas };
  root.MoveNowThemeNatureWindow = { create: createNatureWindowStage };
})(typeof globalThis !== 'undefined' ? globalThis : this);
