(function (root) {
  'use strict';

  /**
   * Procedural Optical Physics Renderer for MoveNow ("自然视窗" & Stage-2 Sealed Backdrops):
   * Designed to layer directly over macOS's real blurred desktop (NSVisualEffectView behindWindow)
   * with genuine optical contrast in BOTH bright light-mode windows and dark-mode workspaces:
   * - sunlight: Komorebi (窗棂树影) — diagonal Venetian blind sunbeams + swaying dual-depth botanical leaf shadows
   * - mist:     Cool-warm condensing window fog + micro-beads + refractive sliding droplets with shadows & trails
   * - frost:    Dual-pass glacial blue-slate + crystalline white fractal 60-deg dendrites + radial warm thaw
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
    let mode = opts.mode || 'sunlight'; // 'sunlight' | 'mist' | 'frost' | 'warm_matte' | 'vellum'
    let deepSeal = Boolean(opts.deepSeal);
    let easterEgg = null;
    let mood = 'calm';

    let modeEnteredAt = performance.now();
    let thawing = false;
    let thawStartedAt = 0;
    const THAW_DURATION_MS = 820;

    let sunBranches = [];
    let sunMotes = [];
    let driftingLeaves = [];
    let mistBeads = [];
    let droplets = [];
    let frostOffscreen = null;
    let vellumOffscreen = null;
    let frostSeed = Math.floor(Math.random() * 100000);
    let lastDark = isDarkScheme();

    // Panoramic Multi-Display Viewport State (defaults cleanly to single-screen local rect)
    let pan = {
      vx: 0,
      vy: 0,
      ww: 0,
      wh: 0,
      originMs: 0,
      screens: null
    };

    // Deterministic closed-form atmospheric breeze envelope (100% synced across all monitors with 0 IPC!)
    let breezeVelX = 0;
    function computeSyncedBreeze(simSec) {
      const period = 34;
      const cyc = Math.floor(simSec / period);
      const localT = simSec - cyc * period;
      const h = ((cyc * 2654435761) ^ (frostSeed >>> 0)) >>> 0;
      const start = 15 + (h % 7);
      const dur = 12 + ((h >>> 4) % 4);
      const dir = ((h >>> 8) & 1) === 0 ? 1 : -1;
      if (localT >= start && localT <= start + dur) {
        return dir * Math.sin(((localT - start) / dur) * Math.PI);
      }
      return 0;
    }

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
      const worldW = (!compact && pan.ww > 0) ? pan.ww : width;
      const worldH = (!compact && pan.wh > 0) ? pan.wh : height;
      const rand = mulberry32(frostSeed);

      // 1. Komorebi (窗棂树影): World-space canopy boughs (including cross-bezel overhang!), Tyndall dust & drifting leaves
      sunBranches = [];
      const boughConfigs = [];
      if (compact) {
        boughConfigs.push(
          { ax: -width * 0.08, ay: height * 0.05, tx: width * 0.52, ty: height * 0.42, layer: 1 },
          { ax: width * 0.65, ay: -height * 0.06, tx: width * 0.25, ty: height * 0.52, layer: 0 }
        );
      } else {
        const scrList = (pan.screens && pan.screens.length > 0)
          ? pan.screens
          : [{ x: 0, y: 0, w: width, h: height, primary: true }];
        for (let sIdx = 0; sIdx < scrList.length; sIdx++) {
          const sr = scrList[sIdx];
          if (sr.primary === false) {
            // High-window / side-window airy corner boughs on Secondary Screens (keeps central clock 100% open & serene!)
            boughConfigs.push(
              { ax: sr.x + sr.w * 1.03, ay: sr.y - sr.h * 0.03, tx: sr.x + sr.w * 0.70, ty: sr.y + sr.h * 0.26, layer: 0 },
              { ax: sr.x + sr.w * 0.90, ay: sr.y - sr.h * 0.04, tx: sr.x + sr.w * 0.66, ty: sr.y + sr.h * 0.19, layer: 1 }
            );
            continue;
          }
          boughConfigs.push(
            { ax: sr.x - sr.w * 0.06, ay: sr.y + sr.h * 0.16, tx: sr.x + sr.w * 0.46, ty: sr.y + sr.h * 0.48, layer: 0 },
            { ax: sr.x + sr.w * 1.05, ay: sr.y + sr.h * 0.08, tx: sr.x + sr.w * 0.56, ty: sr.y + sr.h * 0.40, layer: 0 },
            { ax: sr.x - sr.w * 0.04, ay: sr.y - sr.h * 0.03, tx: sr.x + sr.w * 0.38, ty: sr.y + sr.h * 0.34, layer: 1 },
            { ax: sr.x + sr.w * 0.78, ay: sr.y - sr.h * 0.05, tx: sr.x + sr.w * 0.44, ty: sr.y + sr.h * 0.26, layer: 1 },
            { ax: sr.x + sr.w * 1.04, ay: sr.y + sr.h * 0.28, tx: sr.x + sr.w * 0.68, ty: sr.y + sr.h * 0.62, layer: 1 }
          );
        }
      }

      for (let b = 0; b < boughConfigs.length; b++) {
        const cfg = boughConfigs[b];
        const clusters = [];
        const clusterCount = compact ? 4 : 7;
        for (let k = 0; k < clusterCount; k++) {
          const tFrac = 0.24 + (k / Math.max(1, clusterCount - 1)) * 0.74;
          const twigSide = (k % 2 === 0 ? 1 : -1);
          const subLeaves = [];
          const triplet = 2 + Math.floor(rand() * 2);
          for (let j = 0; j < triplet; j++) {
            const fan = (j - (triplet - 1) * 0.5) * (0.52 + rand() * 0.18);
            subLeaves.push({
              fanAng: fan,
              len: (compact ? 10 : 28) + rand() * (compact ? 6 : 18) * (cfg.layer === 0 ? 1.30 : 1.0),
              wid: (compact ? 4.2 : 10.5) + rand() * (compact ? 2.0 : 5.0) * (cfg.layer === 0 ? 1.25 : 1.0),
              phase: rand() * Math.PI * 2,
              flutter: 0.75 + rand() * 0.65
            });
          }
          clusters.push({
            t: Math.min(1.0, tFrac + (rand() - 0.5) * 0.07),
            twigAng: twigSide * (0.42 + rand() * 0.35),
            twigLen: (compact ? 10 : 34) * (1.18 - tFrac * 0.42) * (0.75 + rand() * 0.45),
            leaves: subLeaves
          });
        }
        sunBranches.push({
          ax: cfg.ax,
          ay: cfg.ay,
          cx: (cfg.ax + cfg.tx) * 0.5 + (rand() - 0.5) * (compact ? 14 : 64),
          cy: (cfg.ay + cfg.ty) * 0.5 - (compact ? 8 : 38),
          tx: cfg.tx,
          ty: cfg.ty,
          layer: cfg.layer,
          phase: rand() * Math.PI * 2,
          clusters: clusters
        });
      }

      const screenMult = (!compact && pan.screens && pan.screens.length > 1) ? pan.screens.length : 1;
      const moteCount = compact ? 8 : (26 * screenMult);
      sunMotes = [];
      for (let i = 0; i < moteCount; i++) {
        sunMotes.push({
          x0: rand() * worldW,
          y0: rand() * worldH,
          r: (compact ? 0.9 : 1.3) + rand() * (compact ? 1.1 : 2.0),
          vx: 4 + rand() * 7,
          vy: -4 - rand() * 6,
          phase: rand() * Math.PI * 2,
          alpha: 0.22 + rand() * 0.38
        });
      }

      const driftCount = compact ? 1 : (3 * screenMult + 1);
      driftingLeaves = [];
      for (let i = 0; i < driftCount; i++) {
        driftingLeaves.push({
          x0: rand() * worldW,
          y0: rand() * worldH,
          len: (compact ? 8 : 21) + rand() * (compact ? 3 : 8),
          wid: (compact ? 3.2 : 7.8) + rand() * 2.5,
          vy: (compact ? 8 : 19) + rand() * 9,
          vx: (compact ? 5 : 22) + rand() * 14,
          swayPhase: rand() * Math.PI * 2
        });
      }

      // 2. Mist micro-beads & gravity droplets (local viewport seeded by viewport offset so multi-screens never clone!)
      const localRand = mulberry32((frostSeed ^ ((pan.vx * 73856093) | 0) ^ ((pan.vy * 19349663) | 0)) >>> 0);
      const beadCount = compact ? 36 : 190;
      mistBeads = [];
      for (let i = 0; i < beadCount; i++) {
        mistBeads.push({
          x: localRand() * width,
          y: localRand() * height,
          r: (compact ? 0.9 : 1.2) + localRand() * (compact ? 1.8 : 3.2),
          alpha: 0.24 + localRand() * 0.34,
          phase: localRand() * Math.PI * 2
        });
      }

      const dropCount = compact ? 4 : 14;
      droplets = [];
      for (let i = 0; i < dropCount; i++) {
        droplets.push({
          x: width * (0.06 + localRand() * 0.88),
          y: localRand() * height * 0.75,
          r: (compact ? 2.4 : 4.0) + localRand() * (compact ? 1.8 : 4.2),
          speed: (compact ? 9 : 18) + localRand() * (compact ? 12 : 30),
          wobble: localRand() * Math.PI * 2,
          wait: localRand() * 4.5,
          trailLen: compact ? 10 : 36
        });
      }

      // 3. Pre-baked dual-pass fractal frost texture & vellum tracing-paper texture (local screen size = minimal VRAM!)
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

      // Airy translucent Washi / vellum tracing paper (~56% opacity so frosted desktop breathes gently underneath)
      vctx.fillStyle = dark ? 'rgba(38, 42, 47, 0.58)' : 'rgba(238, 234, 226, 0.56)';
      vctx.fillRect(0, 0, width, height);

      const rand = mulberry32(((frostSeed + 31337) ^ ((pan.vx * 2654435) | 0)) >>> 0);
      // Whisper-fine paper fibers
      const fiberCount = compact ? 70 : 380;
      vctx.lineCap = 'round';
      for (let i = 0; i < fiberCount; i++) {
        const fx = rand() * width;
        const fy = rand() * height;
        const len = 4 + rand() * 12;
        const ang = rand() * Math.PI * 2;
        vctx.strokeStyle = dark
          ? 'rgba(228, 223, 211,' + (0.015 + rand() * 0.018).toFixed(3) + ')'
          : 'rgba(116, 110, 100,' + (0.016 + rand() * 0.020).toFixed(3) + ')';
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

      const rand = mulberry32(((frostSeed + 7919) ^ ((pan.vx * 7385609) | 0)) >>> 0);

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

    function drawBotanicalLeaf(x, y, ang, len, wid, scaleX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.scale(1, scaleX);
      ctx.beginPath();
      ctx.moveTo(-len * 0.12, 0);
      ctx.quadraticCurveTo(len * 0.36, -wid, len, 0);
      ctx.quadraticCurveTo(len * 0.36, wid, -len * 0.12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function renderSunlight(simSec, nowMs, dtSec, dark, thawFrac) {
      const t = simSec;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.30 + (elapsedSec / 1.3) * 0.70);
      const vis = grow * (1 - thawFrac);
      if (vis <= 0.005) return;

      const worldW = (!compact && pan.ww > 0) ? pan.ww : width;
      const worldH = (!compact && pan.wh > 0) ? pan.wh : height;
      const offX = compact ? 0 : pan.vx;
      const offY = compact ? 0 : pan.vy;

      const b = breathCurve(t);
      const amp = mood === 'dnd' ? 0.45 : 1.0;

      ctx.save();

      // 1. Breathable Translucent Sunlit / Moonlit Frosted Veil
      if (deepSeal) {
        ctx.fillStyle = dark
          ? 'rgba(22, 27, 36,' + (0.50 * vis).toFixed(3) + ')'
          : 'rgba(240, 236, 227,' + (0.46 * vis).toFixed(3) + ')';
        ctx.fillRect(0, 0, width, height);
      } else {
        const veil = ctx.createLinearGradient(0, 0, width, height);
        if (dark) {
          veil.addColorStop(0, 'rgba(24, 32, 44,' + (0.14 * vis).toFixed(3) + ')');
          veil.addColorStop(1, 'rgba(14, 18, 26,' + (0.20 * vis).toFixed(3) + ')');
        } else {
          veil.addColorStop(0, 'rgba(248, 243, 232,' + (0.12 * vis).toFixed(3) + ')');
          veil.addColorStop(1, 'rgba(232, 226, 214,' + (0.10 * vis).toFixed(3) + ')');
        }
        ctx.fillStyle = veil;
        ctx.fillRect(0, 0, width, height);
      }

      // Panoramic directional sunlight / moonlight bloom anchored in unified world space
      const sunGlow = ctx.createRadialGradient(
        worldW * 0.18 - offX, worldH * 0.14 - offY, 10,
        worldW * 0.26 - offX, worldH * 0.24 - offY, Math.max(worldW, worldH) * 0.85
      );
      if (dark) {
        sunGlow.addColorStop(0, 'rgba(236, 212, 182,' + ((deepSeal ? 0.14 : 0.10) * vis).toFixed(3) + ')');
        sunGlow.addColorStop(0.48, 'rgba(138, 168, 204,' + ((deepSeal ? 0.06 : 0.04) * vis).toFixed(3) + ')');
      } else {
        sunGlow.addColorStop(0, 'rgba(255, 250, 236,' + ((deepSeal ? 0.28 : 0.18) * vis).toFixed(3) + ')');
        sunGlow.addColorStop(0.52, 'rgba(246, 234, 208,' + ((deepSeal ? 0.11 : 0.07) * vis).toFixed(3) + ')');
      }
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Panoramic Venetian Blind Louvers & Sunbeams (tilted 25 deg — pixel-aligned across all monitor bezels!)
      ctx.save();
      ctx.translate(worldW * 0.5 - offX, worldH * 0.5 - offY);
      ctx.rotate(-0.42);
      const diag = Math.hypot(worldW, worldH) * 1.25;
      const period = compact ? (Math.hypot(width, height) * 1.25 / 5) : 186;
      const slatCount = Math.ceil((diag * 0.65) / period) + 1;
      const openRatio = Math.min(0.92, (0.56 + b * 0.08 * amp) + thawFrac * 0.36);
      const driftOffset = Math.sin(t * 0.14) * (period * 0.14);

      for (let s = -slatCount; s <= slatCount; s++) {
        const y0 = s * period + driftOffset;
        const beamH = period * openRatio;
        const slatShadowH = period - beamH;

        const bg = ctx.createLinearGradient(0, y0, 0, y0 + beamH);
        const litAlpha = (deepSeal ? (dark ? 0.08 : 0.22) : (dark ? 0.06 : 0.15)) * vis;
        const litRgb = dark ? '242, 224, 198' : '255, 252, 242';
        bg.addColorStop(0, 'rgba(' + litRgb + ',0)');
        bg.addColorStop(0.18, 'rgba(' + litRgb + ',' + litAlpha.toFixed(3) + ')');
        bg.addColorStop(0.82, 'rgba(' + litRgb + ',' + (litAlpha * 0.88).toFixed(3) + ')');
        bg.addColorStop(1, 'rgba(' + litRgb + ',0)');
        ctx.fillStyle = bg;
        ctx.fillRect(-diag * 0.65, y0, diag * 1.3, beamH);

        const sg = ctx.createLinearGradient(0, y0 + beamH, 0, y0 + period);
        const shAlpha = (deepSeal ? (dark ? 0.18 : 0.085) : (dark ? 0.11 : 0.055)) * vis * (1 - thawFrac);
        const shRgb = dark ? '8, 12, 18' : '116, 110, 96';
        sg.addColorStop(0, 'rgba(' + shRgb + ',0)');
        sg.addColorStop(0.26, 'rgba(' + shRgb + ',' + shAlpha.toFixed(3) + ')');
        sg.addColorStop(0.74, 'rgba(' + shRgb + ',' + shAlpha.toFixed(3) + ')');
        sg.addColorStop(1, 'rgba(' + shRgb + ',0)');
        ctx.fillStyle = sg;
        ctx.fillRect(-diag * 0.65, y0 + beamH, diag * 1.3, slatShadowH);
      }

      const mullionW = compact ? 7 : 24;
      const mullionX = -diag * 0.12;
      const mg = ctx.createLinearGradient(mullionX - mullionW, 0, mullionX + mullionW, 0);
      const mAlpha = (deepSeal ? (dark ? 0.17 : 0.08) : (dark ? 0.10 : 0.05)) * vis;
      const mRgb = dark ? '10, 14, 22' : '112, 106, 92';
      mg.addColorStop(0, 'rgba(' + mRgb + ',0)');
      mg.addColorStop(0.5, 'rgba(' + mRgb + ',' + mAlpha.toFixed(3) + ')');
      mg.addColorStop(1, 'rgba(' + mRgb + ',0)');
      ctx.fillStyle = mg;
      ctx.fillRect(mullionX - mullionW, -diag * 0.65, mullionW * 2, diag * 1.3);
      ctx.restore();

      // 3. Swaying World-Space Canopy Boughs (frustum-culled to local viewport!)
      for (let pass = 0; pass <= 1; pass++) {
        ctx.save();
        ctx.translate(-offX, -offY);
        const penumbraBlur = compact ? (pass === 0 ? 3 : 1.5) : (pass === 0 ? 11 : 5);
        for (let i = 0; i < sunBranches.length; i++) {
          const br = sunBranches[i];
          if (br.layer !== pass) continue;
          const minBX = Math.min(br.ax, br.tx) - 90;
          const maxBX = Math.max(br.ax, br.tx) + 90;
          if (!compact && (maxBX < offX || minBX > offX + width)) continue;

          const wind = Math.sin(t * 0.85 + br.phase) * (compact ? 4 : 15)
            + Math.sin(t * 1.65 + br.phase * 1.7) * (compact ? 2 : 7)
            + breezeVelX * (compact ? 7 : 32) * (pass === 1 ? 1.15 : 0.75);
          const windY = Math.cos(t * 0.72 + br.phase) * (compact ? 2.5 : 9) + Math.abs(breezeVelX) * 6;

          const cx = br.cx + wind * 0.55;
          const cy = br.cy + windY * 0.55;
          const tx = br.tx + wind;
          const ty = br.ty + windY;

          const shadowAlpha = pass === 0
            ? (deepSeal ? (dark ? 0.15 : 0.08) : (dark ? 0.10 : 0.058)) * vis
            : (deepSeal ? (dark ? 0.24 : 0.13) : (dark ? 0.16 : 0.095)) * vis;
          const shadowRgb = dark ? '8, 12, 19' : (pass === 0 ? '114, 108, 90' : '78, 76, 62');
          const shadowCol = 'rgba(' + shadowRgb + ',' + shadowAlpha.toFixed(3) + ')';

          ctx.shadowColor = shadowCol;
          ctx.shadowBlur = penumbraBlur;
          ctx.strokeStyle = 'rgba(' + shadowRgb + ',' + (shadowAlpha * 0.85).toFixed(3) + ')';
          ctx.fillStyle = shadowCol;
          ctx.lineCap = 'round';
          ctx.lineWidth = compact ? (pass === 0 ? 2.4 : 1.7) : (pass === 0 ? 5.5 : 3.6);

          ctx.beginPath();
          ctx.moveTo(br.ax, br.ay);
          ctx.quadraticCurveTo(cx, cy, tx, ty);
          ctx.stroke();

          for (let k = 0; k < br.clusters.length; k++) {
            const cl = br.clusters[k];
            const u = cl.t;
            const inv = 1 - u;
            const bx = inv * inv * br.ax + 2 * inv * u * cx + u * u * tx;
            const by = inv * inv * br.ay + 2 * inv * u * cy + u * u * ty;
            const dtx = 2 * inv * (cx - br.ax) + 2 * u * (tx - cx);
            const dty = 2 * inv * (cy - br.ay) + 2 * u * (ty - cy);
            const bAng = Math.atan2(dty, dtx);

            const twigDir = bAng + cl.twigAng + Math.sin(t * 1.1 + k) * 0.06 + breezeVelX * 0.12;
            const tipX = bx + Math.cos(twigDir) * cl.twigLen;
            const tipY = by + Math.sin(twigDir) * cl.twigLen;

            ctx.lineWidth = compact ? 1.0 : 2.0;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo((bx + tipX) * 0.5, (by + tipY) * 0.5 - 3, tipX, tipY);
            ctx.stroke();

            for (let j = 0; j < cl.leaves.length; j++) {
              const lf = cl.leaves[j];
              const flutterAng = twigDir + lf.fanAng
                + Math.sin(t * (1.35 * lf.flutter) + lf.phase) * 0.15
                + breezeVelX * 0.22 * lf.flutter;
              const foreshorten = 0.68 + 0.32 * Math.cos(t * 1.05 + lf.phase);
              drawBotanicalLeaf(tipX, tipY, flutterAng, lf.len, lf.wid, foreshorten);
            }
          }
        }
        ctx.restore();
      }

      // 4. Closed-Form Cross-Screen Drifting Leaves (float seamlessly from Monitor 1 onto Monitor 2!)
      const spanW = worldW + 120;
      const spanH = worldH + 90;
      for (let i = 0; i < driftingLeaves.length; i++) {
        const dl = driftingLeaves[i];
        const gx = (((dl.x0 + dl.vx * t + Math.sin(t * 1.1 + dl.swayPhase) * (compact ? 8 : 28)) % spanW) + spanW) % spanW - 60;
        const gy = (((dl.y0 + dl.vy * t) % spanH) + spanH) % spanH - 45;
        const lx = gx - offX;
        const ly = gy - offY;
        if (lx < -45 || lx > width + 45 || ly < -45 || ly > height + 45) continue;

        const leafAlpha = (deepSeal ? (dark ? 0.26 : 0.14) : (dark ? 0.16 : 0.09)) * vis;
        ctx.fillStyle = dark
          ? 'rgba(10, 14, 22,' + leafAlpha.toFixed(3) + ')'
          : 'rgba(88, 84, 68,' + leafAlpha.toFixed(3) + ')';
        const rockAng = 0.4 + Math.sin(t * 1.5 + dl.swayPhase) * 0.55;
        const tumble = 0.45 + 0.55 * Math.abs(Math.cos(t * 1.8 + dl.swayPhase));
        drawBotanicalLeaf(lx, ly, rockAng, dl.len, dl.wid, tumble);
      }

      // 5. Closed-Form Cross-Screen Tyndall Dust Motes (frustum-culled!)
      const mSpanW = worldW + 40;
      const mSpanH = worldH + 40;
      for (let i = 0; i < sunMotes.length; i++) {
        const m = sunMotes[i];
        const gx = (((m.x0 + m.vx * t) % mSpanW) + mSpanW) % mSpanW - 20;
        const gy = (((m.y0 + m.vy * t + Math.sin(t * 0.9 + m.phase) * 10) % mSpanH) + mSpanH) % mSpanH - 20;
        const mx = gx - offX;
        const my = gy - offY;
        if (mx < -10 || mx > width + 10 || my < -10 || my > height + 10) continue;

        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + m.phase));
        const ma = m.alpha * twinkle * vis;
        ctx.fillStyle = dark
          ? 'rgba(248, 226, 190,' + (ma * 0.65).toFixed(3) + ')'
          : 'rgba(255, 252, 238,' + (ma * 0.95).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function renderMist(simSec, nowMs, dtSec, dark, thawFrac) {
      const t = simSec;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const fogGrow = Math.min(1, elapsedSec / 1.6);
      const visibility = fogGrow * (1 - thawFrac);
      if (visibility <= 0.005) return;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const maxR = Math.hypot(cx, cy);

      // Cool-tinted condensation layer; stays airy & translucent in Sealed Mode
      const fogGrad = ctx.createRadialGradient(cx, cy, maxR * 0.08, cx, cy, maxR * 1.05);
      const density = deepSeal ? 1.12 : 0.88;
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
        const px = width * (0.15 + (i / puffCount) * 0.70) + Math.sin(t * 0.28 + i * 1.7) * (compact ? 14 : 52) + breezeVelX * (compact ? 10 : 48);
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
        renderVitalityWave(simSec, dark, visibility);
      }
    }

    function renderVitalityWave(simSec, dark, vis) {
      if (vis <= 0.02) return;
      const t = simSec;
      const worldW = (!compact && pan.ww > 0) ? pan.ww : width;
      const offX = compact ? 0 : pan.vx;
      const globalLeft = worldW * 0.06;
      const globalRight = worldW * 0.94;
      const span = Math.max(1, globalRight - globalLeft);
      const baseY = height * 0.885;

      ctx.save();
      ctx.globalAlpha = vis;
      // Panoramic continuous vitality ribbon flowing seamlessly across all connected monitors!
      for (let layer = 0; layer < 2; layer++) {
        ctx.strokeStyle = layer === 0
          ? (dark ? 'rgba(156, 216, 248, 0.44)' : 'rgba(72, 126, 168, 0.36)')
          : (dark ? 'rgba(210, 238, 255, 0.22)' : 'rgba(92, 146, 184, 0.18)');
        ctx.lineWidth = layer === 0 ? 1.5 : 1.1;
        ctx.beginPath();
        let started = false;
        for (let lx = 0; lx <= width; lx += 5) {
          const gx = offX + lx;
          if (gx < globalLeft || gx > globalRight) continue;
          const norm = (gx - globalLeft) / span;
          const env = Math.sin(norm * Math.PI);
          const phaseShift = layer * 1.4;
          const y = baseY
            + Math.sin(norm * 15 - t * 2.6 + phaseShift) * (layer === 0 ? 7.5 : 5.0) * env
            + Math.sin(norm * 8 + t * 1.5 - phaseShift) * 3.8 * env;
          if (!started) {
            ctx.moveTo(lx, y);
            started = true;
          } else {
            ctx.lineTo(lx, y);
          }
        }
        if (started) ctx.stroke();
      }
      ctx.restore();
    }

    function renderWarmMatte(simSec, nowMs, dark, thawFrac) {
      const t = simSec;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.25 + (elapsedSec / 1.4) * 0.75);
      const alpha = grow * (1 - thawFrac);
      if (alpha <= 0.005) return;

      const worldW = (!compact && pan.ww > 0) ? pan.ww : width;
      const worldH = (!compact && pan.wh > 0) ? pan.wh : height;
      const offX = compact ? 0 : pan.vx;
      const offY = compact ? 0 : pan.vy;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dark ? 'rgba(26, 28, 33, 0.56)' : 'rgba(236, 233, 226, 0.52)';
      ctx.fillRect(0, 0, width, height);

      const clouds = [
        { x: 0.24, y: 0.36, r: 0.38, warm: true, sp: 0.24 },
        { x: 0.74, y: 0.58, r: 0.42, warm: false, sp: 0.19 },
        { x: 0.50, y: 0.42, r: 0.32, warm: true, sp: 0.31 },
        { x: 0.40, y: 0.66, r: 0.34, warm: false, sp: 0.27 }
      ];
      clouds.forEach(function (c, i) {
        const px = (worldW * c.x + Math.sin(t * c.sp + i * 2.1) * (worldW * 0.06)) - offX;
        const py = (worldH * c.y + Math.cos(t * (c.sp * 0.85) + i * 1.4) * (worldH * 0.055)) - offY;
        const pr = Math.min(worldW, worldH) * c.r;
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        if (c.warm) {
          g.addColorStop(0, dark ? 'rgba(220, 152, 120, 0.09)' : 'rgba(224, 166, 134, 0.095)');
        } else {
          g.addColorStop(0, dark ? 'rgba(126, 174, 158, 0.075)' : 'rgba(124, 168, 154, 0.08)');
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
        ctx.translate(0, -thawFrac * 24);
      }
      ctx.drawImage(vellumOffscreen, 0, 0, width, height);
      ctx.restore();
    }

    function renderFrost(simSec, nowMs, dark, thawFrac) {
      if (!frostOffscreen) return;
      const elapsedSec = (nowMs - modeEnteredAt) / 1000;
      const grow = Math.min(1, 0.22 + (elapsedSec / 2.0) * 0.78);
      const easedGrow = 1 - Math.pow(1 - grow, 3);
      const worldW = (!compact && pan.ww > 0) ? pan.ww : width;
      const offX = compact ? 0 : pan.vx;

      ctx.save();
      ctx.globalAlpha = easedGrow;
      ctx.drawImage(frostOffscreen, 0, 0, width, height);

      // Panoramic iridescent aurora shimmer sweeping continuously from Monitor 1 across Monitor 2!
      const t = simSec;
      const sweepPos = ((t * 0.12) % 1.8) - 0.4;
      const sweepGrad = ctx.createLinearGradient(
        worldW * (sweepPos - 0.22) - offX, 0,
        worldW * (sweepPos + 0.22) - offX, height * 0.85
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
          const sx = (((s * 0.137 + pan.vx * 0.0003) + t * (0.008 + (s % 3) * 0.004)) % 1) * width;
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
        renderVitalityWave(simSec, dark, easedGrow * (1 - thawFrac));
      }

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

      const simSec = (!compact && pan.originMs > 0)
        ? Math.max(0, (Date.now() - pan.originMs) / 1000)
        : (nowMs / 1000);
      breezeVelX = computeSyncedBreeze(simSec);

      let thawFrac = 0;
      if (thawing) {
        thawFrac = Math.min(1, (nowMs - thawStartedAt) / THAW_DURATION_MS);
      }

      ctx.clearRect(0, 0, width, height);

      if (mode === 'mist') {
        renderMist(simSec, nowMs, dtSec, dark, thawFrac);
      } else if (mode === 'frost') {
        renderFrost(simSec, nowMs, dark, thawFrac);
      } else if (mode === 'warm_matte') {
        renderWarmMatte(simSec, nowMs, dark, thawFrac);
      } else if (mode === 'vellum') {
        renderVellum(nowMs, thawFrac);
      } else {
        renderSunlight(simSec, nowMs, dtSec, dark, thawFrac);
      }
    }

    return {
      setPanoramic: function (nextPan) {
        if (!nextPan) return;
        const nextSeed = (Number(nextPan.seed) >>> 0) || frostSeed;
        const changed =
          nextSeed !== frostSeed ||
          (nextPan.vx || 0) !== pan.vx ||
          (nextPan.vy || 0) !== pan.vy ||
          (nextPan.ww || 0) !== pan.ww ||
          (nextPan.wh || 0) !== pan.wh;
        frostSeed = nextSeed;
        pan = {
          vx: Number(nextPan.vx) || 0,
          vy: Number(nextPan.vy) || 0,
          ww: Number(nextPan.ww) || 0,
          wh: Number(nextPan.wh) || 0,
          originMs: Number(nextPan.originMs) || 0,
          screens: Array.isArray(nextPan.screens) ? nextPan.screens : null
        };
        if (changed && width > 0 && height > 0) {
          rebuildEntities();
        }
      },
      setMode: function (nextMode, nextMeta) {
        const meta = nextMeta || {};
        const normalized = nextMode === 'bokeh' ? 'sunlight' : nextMode;
        const resolved = ['sunlight', 'mist', 'frost', 'warm_matte', 'vellum'].includes(normalized) ? normalized : 'sunlight';
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
    const label = container.querySelector('.mn-nature-card-stage .mn-breath-label');
    const engine = createOpticalCanvas(canvas, { compact: true, mode: 'sunlight' });

    return {
      setState: function (next) {
        const s = next || {};
        const raw = s.natureStyle && s.natureStyle !== 'auto' ? s.natureStyle : 'sunlight';
        const style = raw === 'bokeh' ? 'sunlight' : raw;
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
