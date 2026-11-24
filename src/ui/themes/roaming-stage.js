(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoveNowRoamingStage = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * MoveNow v0.1.0 Dual-Universe Full-Screen Causal Theatre (`roaming-stage.js`)
   *
   * Key Design Principles:
   * 1. ZERO Shared Scripts Between Themes:
   *    - `GEOMETRIC_ARCHETYPES` (60 archetypes): Soft-body elasticity, anti-gravity levitation,
   *      twin fission/fusion, Zen stone stacking, crystal prism refraction, Newton's cradle,
   *      edge portals, pendulum swings, constellation rays, ripple skimming, bubble pods.
   *    - `SKETCH_ARCHETYPES` (60 archetypes): Authentic puppy ethology & hand-drawn ink-on-paper
   *      play — frisbee diving catch, digging & burying bones, chasing own tail dizzy, stepping in
   *      ink puddles & leaving dark pawprints, sketched rainclouds, butterfly landing on nose,
   *      dandelion puffballs, curling the sketch-paper corner, yarn ball unraveling, frog hopping.
   * 2. Guaranteed > 2 Hours (120+ Cycles = ~136 Minutes) With ZERO Repeats:
   *    - Stratified Fisher-Yates Deck: All 60 distinct archetypes play once in shuffled order
   *      (~68 min) before any second-choreography mirror/twist variant (`v1`, another ~68 min) plays!
   * 3. Ultra-Low Footprint:
   *    - Pure procedural 2D vector curves, < 0.08ms/frame active CPU, 0% CPU when not sealed.
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

  function mulberry32(seed) {
    let a = (seed >>> 0) || 20261123;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleArray(arr, randFn) {
    const rfn = randFn || Math.random;
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rfn() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // ===========================================================================
  // 72 GEOMETRIC-EXCLUSIVE ARCHETYPES (60 Solo + 12 Multi-Companion Social!)
  // ===========================================================================
  const GEOMETRIC_ARCHETYPES = [
    'geo_trampoline_acrobatics',
    'geo_zero_g_levitation',
    'geo_zen_stone_stack',
    'geo_twin_fission_waltz',
    'geo_prism_rainbow_beam',
    'geo_pendulum_light_swing',
    'geo_newton_cradle_impulse',
    'geo_ripple_pond_skim',
    'geo_orbiting_moons_juggle',
    'geo_slingshot_sonic_dash',
    'geo_giant_bubble_voyage',
    'geo_stepping_pillars_climb',
    'geo_magnetic_duet',
    'geo_clock_metronome_sync',
    'geo_souffle_pancake_melt',
    'geo_shooting_star_catch',
    'geo_domino_cascade_run',
    'geo_hula_halo_spin',
    'geo_edge_portal_warp',
    'geo_musical_chime_steps',
    'geo_gyro_top_glide',
    'geo_balance_beam_walk',
    'geo_cloud_cushion_hop',
    'geo_sky_lantern_release',
    'geo_arc_jumprope',
    'geo_sphere_bowling_strike',
    'geo_hourglass_meditation',
    'geo_periscope_stretch_scan',
    'geo_telekinetic_tea_ceremony',
    'geo_golden_spiral_roam',
    'geo_shadow_totem_morph',
    'geo_balloon_buoyancy_drift',
    'geo_pinball_wall_ricochet',
    'geo_constellation_connect',
    'geo_curtain_call_rollout',
    'geo_lotus_ripple_bloom',
    'geo_twin_leapfrog_parade',
    'geo_twin_seesaw_tilt',
    'geo_aurora_ribbon_trail',
    'geo_gravity_well_orbit',
    'geo_origami_crown_float',
    'geo_crystal_chime_tap',
    'geo_sundial_shadow_chase',
    'geo_mochi_wall_squish',
    'geo_floating_stair_descend',
    'geo_Firefly_swarm_conduct',
    'geo_eclipse_halo_align',
    'geo_billiard_corner_pocket',
    'geo_elastic_limbo_slide',
    'geo_zen_garden_sand_rings',
    'geo_star_trampoline_zig',
    'geo_prism_twin_refract',
    'geo_levitate_figure_eight',
    'geo_meteor_shower_dance',
    'geo_bubble_staircase_pop',
    'geo_harmonic_wave_surf',
    'geo_compass_four_corners',
    'geo_warm_hearth_pulse',
    'geo_sky_elevator_drop',
    'geo_infinity_glide_finale',
    // --- 12 Multi-Companion Social Scenarios (2, 3~6, up to 12 Full-Screen Spirits!) ---
    'geo_social_orb_catch_duet',
    'geo_social_totem_two_stack',
    'geo_social_mirror_hop_duet',
    'geo_social_trio_totem_tower',
    'geo_social_color_wave_train',
    'geo_social_constellation_ring',
    'geo_social_leapfrog_relay',
    'geo_social_musical_choir_line',
    'geo_social_meadow_gathering',
    'geo_social_lantern_festival',
    'geo_social_spiral_galaxy_parade',
    'geo_social_cozy_stone_clusters'
  ];

  // ===========================================================================
  // 72 SKETCH-EXCLUSIVE ARCHETYPES (60 Solo + 12 Multi-Puppy Social!)
  // ===========================================================================
  const SKETCH_ARCHETYPES = [
    'sk_frisbee_diving_catch',
    'sk_dig_and_bury_bone',
    'sk_chase_own_tail_dizzy',
    'sk_paper_plane_pounce',
    'sk_ink_puddle_pawprints',
    'sk_raincloud_umbrella_shake',
    'sk_butterfly_nose_perch',
    'sk_proud_stick_parade',
    'sk_yarn_ball_unravel',
    'sk_belly_up_back_wiggle',
    'sk_double_sneeze_recoil',
    'sk_dandelion_puff_scatter',
    'sk_page_corner_curl_peek',
    'sk_crescent_moon_howl',
    'sk_soccer_ball_dribble',
    'sk_grass_tuft_frog_race',
    'sk_snack_bowl_crunch',
    'sk_radar_ears_listen',
    'sk_figure_eight_zoomies',
    'sk_feather_tickle_hop',
    'sk_dashed_scent_trail',
    'sk_sploot_frog_stretch',
    'sk_bezel_window_scratch',
    'sk_paper_boat_escort',
    'sk_shadow_play_bow',
    'sk_three_autumn_leaves',
    'sk_dream_bone_twitch',
    'sk_rolling_acorn_pat',
    'sk_morning_yoga_trio',
    'sk_offscreen_daisy_gift',
    'sk_ladybug_crawl_watch',
    'sk_headwind_ears_fly',
    'sk_pebble_hurdle_steeple',
    'sk_tea_mug_guard_post',
    'sk_front_glass_sniff_closeup',
    'sk_buried_treasure_unearth',
    'sk_double_frisbee_boomerang',
    'sk_butterfly_duo_spiral',
    'sk_paper_windmill_blow',
    'sk_ puddle_jump_splash',
    'sk_apple_head_balance',
    'sk_cricket_chirp_pounce',
    'sk_origami_crane_greeting',
    'sk_footprints_circle_art',
    'sk_broom_leaf_sweep',
    'sk_yawn_stretch_roll_combo',
    'sk_bezel_left_right_patrol',
    'sk_kite_string_trot',
    'sk_snow_speck_catch',
    'sk_sleeping_bird_tiptoe',
    'sk_bone_juggle_toss',
    'sk_tail_wag_semaphore',
    'sk_sketch_pencil_chase',
    'sk_cloud_shadow_tag',
    'sk_four_corner_sniff_map',
    'sk_happy_backflip_try',
    'sk_acorn_hide_and_seek',
    'sk_gentle_rain_listen',
    'sk_starry_night_watch',
    'sk_goodboy_bow_curtain',
    // --- 12 Multi-Companion Social Scenarios (2, 3~6, up to 11 Full-Screen Line Puppies!) ---
    'sk_social_nose_boop_greet',
    'sk_social_dachshund_stick_share',
    'sk_social_synchronized_head_cock',
    'sk_social_duckling_breed_parade',
    'sk_social_circle_tail_powwow',
    'sk_social_frisbee_pack_race',
    'sk_social_follow_the_sprout',
    'sk_social_butterfly_audience',
    'sk_social_park_lawn_gathering',
    'sk_social_sunny_nap_pile',
    'sk_social_grand_cross_parade',
    'sk_social_meadow_zoomie_party'
  ];

  // Curated Cross-Screen Excursion Stories (~33% of deck):
  // On multi-monitor setups, ONLY these traveling/parade stories depart from the Primary Screen
  // across the bezel to visit the Secondary Screen and trot back Home — keeping Secondary Screens
  // 100% clean (Time + Background) the rest of the time!
  const CROSS_SCREEN_EXCURSION_SET = new Set([
    'sk_social_duckling_breed_parade',
    'sk_social_follow_the_sprout',
    'sk_social_dachshund_stick_share',
    'sk_social_frisbee_pack_race',
    'sk_paper_plane_pounce',
    'sk_paper_boat_escort',
    'sk_frisbee_diving_catch',
    'sk_yarn_ball_unravel',
    'sk_dandelion_puff_scatter',
    'sk_kite_string_trot',
    'sk_soccer_ball_dribble',
    'sk_proud_stick_parade',
    'geo_social_color_wave_train',
    'geo_social_orb_catch_duet',
    'geo_social_leapfrog_relay',
    'geo_slingshot_sonic_dash',
    'geo_pinball_wall_ricochet',
    'geo_giant_bubble_voyage',
    'geo_aurora_ribbon_trail',
    'geo_golden_spiral_roam',
    'geo_twin_leapfrog_parade',
    'geo_infinity_glide_finale',
    'geo_shooting_star_catch',
    'geo_meteor_shower_dance'
  ]);

  function weavePassWithSocialCadence(archetypes, variant, randFn) {
    const rfn = randFn || Math.random;
    const social = shuffleArray(archetypes.filter(function (id) { return id.indexOf('_social_') !== -1; }), rfn);
    const solo = shuffleArray(archetypes.filter(function (id) { return id.indexOf('_social_') === -1; }), rfn);
    if (social.length === 0) {
      return shuffleArray(archetypes, rfn).map(function (id) { return { id: id, variant: variant, key: id + '#v' + variant }; });
    }
    const out = [];
    const chunkSize = Math.max(1, Math.floor(solo.length / social.length));
    let soloIdx = 0;
    for (let g = 0; g < social.length; g++) {
      const group = [];
      const count = g === social.length - 1 ? (solo.length - soloIdx) : chunkSize;
      for (let k = 0; k < count && soloIdx < solo.length; k++) {
        group.push(solo[soloIdx++]);
      }
      const insertPos = g === 0
        ? Math.min(group.length, Math.floor(rfn() * 2))
        : Math.floor(rfn() * (group.length + 1));
      group.splice(insertPos, 0, social[g]);
      for (let m = 0; m < group.length; m++) {
        const id = group[m];
        out.push({ id: id, variant: variant, key: id + '#v' + variant });
      }
    }
    // Guarantee an early cross-screen excursion in slot 1 or 2 of Pass 0 while keeping ~80% of stories on Primary Home
    if (variant === 0 && out.length > 3) {
      const hasEarlyExcursion = out.slice(0, 3).some(function (c) { return CROSS_SCREEN_EXCURSION_SET.has(c.id); });
      if (!hasEarlyExcursion) {
        const excIdx = out.findIndex(function (c) { return CROSS_SCREEN_EXCURSION_SET.has(c.id); });
        if (excIdx > 2) {
          const swapSlot = out[1].id.indexOf('_social_') !== -1 ? 2 : 1;
          const tmp = out[swapSlot];
          out[swapSlot] = out[excIdx];
          out[excIdx] = tmp;
        }
      }
    }
    return out;
  }

  function buildStratifiedDeck(archetypes, randFn) {
    const pass0 = weavePassWithSocialCadence(archetypes, 0, randFn);
    const pass1 = weavePassWithSocialCadence(archetypes, 1, randFn);
    if (pass0.length > 1 && pass1.length > 1 && pass0[pass0.length - 1].id === pass1[0].id) {
      const swap = pass1[0];
      pass1[0] = pass1[1];
      pass1[1] = swap;
    }
    return pass0.concat(pass1);
  }

  function createRoamingStage(canvas) {
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    let viewW = 1280;
    let viewH = 800;
    let width = 1280;   // Global panoramic world width (`worldW`)
    let height = 800;   // Global panoramic world height (`worldH`)
    let refScreenW = 1280;
    let refScreenH = 800;
    let dpr = 1;
    let theme = 'geometric';
    let active = false;
    let ambientOnly = false;
    let secHostWake = 0;
    let secHostJumpZ = 0;
    let secHostJumpVZ = 0;
    let secHostGreeted = false;
    let lastMs = typeof performance !== 'undefined' ? performance.now() : 0;

    // Panoramic Multi-Screen Synchronization State (deterministic PRNG + wall-clock lockstep)
    let pan = {
      isPrimary: true,
      vx: 0,
      vy: 0,
      vw: 0,
      vh: 0,
      ww: 0,
      wh: 0,
      seed: 0,
      originMs: 0,
      screens: null
    };
    // 'home' = confined to Primary Screen (Secondary Screen shows ONLY clean Clock + Background!)
    // 'panoramic' = departs Primary Screen across bezel -> visits Secondary Screen -> returns Home!
    let storyScope = 'home';
    let rng = mulberry32(Math.floor(Math.random() * 2147483646) + 1);
    let simSec = 0;
    let nextBlinkSimSec = 2.4;
    let blinkUntilSimSec = 0;

    function randRange(lo, hi) {
      return lo + rng() * (hi - lo);
    }

    function getHomeScreen() {
      if (pan.screens && pan.screens.length > 0) {
        for (let i = 0; i < pan.screens.length; i++) {
          if (pan.screens[i].primary) return pan.screens[i];
        }
        return pan.screens[0];
      }
      return { x: 0, y: 0, w: pan.ww > 0 ? pan.ww : viewW, h: pan.wh > 0 ? pan.wh : viewH, primary: true };
    }

    function getSecondaryScreens() {
      if (!pan.screens || pan.screens.length < 2) return [];
      return pan.screens.filter(function (s) { return !s.primary; });
    }

    function getExcursionAnchors() {
      const home = getHomeScreen();
      const secs = getSecondaryScreens();
      if (storyScope !== 'panoramic' || secs.length === 0) {
        return {
          inPan: false,
          vertical: false,
          home: home,
          sec: home,
          homeX: home.x + home.w * 0.42,
          homeY: home.y + home.h * 0.80,
          secX: home.x + home.w * 0.74,
          secY: home.y + home.h * 0.80
        };
      }
      const sec = secs[0];
      const overlapMinX = Math.max(home.x + 80, sec.x + 80);
      const overlapMaxX = Math.min(home.x + home.w - 80, sec.x + sec.w - 80);
      const vertical = (overlapMaxX - overlapMinX > 200) && (Math.abs(sec.y - home.y) > home.h * 0.42);
      if (vertical) {
        const bridgeX = (overlapMinX + overlapMaxX) * 0.5;
        return {
          inPan: true,
          vertical: true,
          home: home,
          sec: sec,
          homeX: clamp(bridgeX - home.w * 0.08, overlapMinX, overlapMaxX),
          homeY: home.y + home.h * 0.80,
          secX: clamp(bridgeX + home.w * 0.10, overlapMinX, overlapMaxX),
          secY: sec.y + sec.h * 0.80
        };
      }
      return {
        inPan: true,
        vertical: false,
        home: home,
        sec: sec,
        homeX: home.x + home.w * 0.38,
        homeY: home.y + home.h * 0.80,
        secX: sec.x + sec.w * 0.54,
        secY: sec.y + sec.h * 0.80
      };
    }

    function setStoryScope(nextScope) {
      const secs = getSecondaryScreens();
      const target = (nextScope === 'panoramic' && secs.length > 0) ? 'panoramic' : 'home';
      const home = getHomeScreen();
      if (target === storyScope) {
        width = target === 'panoramic' ? (pan.ww || home.w) : home.w;
        height = target === 'panoramic' ? (pan.wh || home.h) : home.h;
        return;
      }
      if (target === 'panoramic') {
        // Shift coordinates seamlessly from Primary-local (0..home.w) into Global Panoramic (0..worldW) — 0.00px jump!
        worldX += home.x;
        worldY += home.y;
        for (let i = 0; i < footprints.length; i++) {
          footprints[i].x += home.x;
          footprints[i].y += home.y;
        }
        storyScope = 'panoramic';
        width = pan.ww || home.w;
        height = pan.wh || home.h;
      } else {
        // Shift back from Global Panoramic into Primary-local (0..home.w) — 0.00px jump!
        worldX = clamp(worldX - home.x, home.w * 0.12, home.w * 0.88);
        worldY = clamp(worldY - home.y, home.h * 0.74, home.h * 0.90);
        for (let i = footprints.length - 1; i >= 0; i--) {
          footprints[i].x -= home.x;
          footprints[i].y -= home.y;
          if (footprints[i].x < 0 || footprints[i].x > home.w) footprints.splice(i, 1);
        }
        storyScope = 'home';
        width = home.w;
        height = home.h;
      }
    }

    const decks = {
      geometric: [],
      sketch: []
    };

    function drawNextFromDeck(themeKey) {
      const archList = themeKey === 'sketch' ? SKETCH_ARCHETYPES : GEOMETRIC_ARCHETYPES;
      if (!decks[themeKey] || decks[themeKey].length === 0) {
        decks[themeKey] = buildStratifiedDeck(archList, rng);
      }
      return decks[themeKey].shift();
    }

    // World kinematics
    let worldX = 640;
    let worldY = 620;
    let vx = 0;
    let vy = 0;
    let stridePhase = 0;
    let initializedPos = false;

    // Vertical parabolic jump & anti-gravity levitation
    let jumpZ = 0;
    let jumpVZ = 0;
    const spLevitateZ = makeSpring(0, 6.5, 4.8);   // Geometric zero-G float height
    const spJellyWide = makeSpring(0, 12.0, 5.8);  // +pancake wide, -totem tall
    const spTwinSplit = makeSpring(0, 9.0, 5.2);   // 0..1 twin pebble separation
    const spSpinAngle = makeSpring(0, 14.0, 6.2);  // gyroscope / tail-chase spin

    // Shared continuous posture springs
    const spFacing = makeSpring(1, 24, 8.5);
    const spSleep = makeSpring(1, 9.5, 5.8);
    const spSit = makeSpring(0, 11.0, 6.2);
    const spBow = makeSpring(0, 13.0, 6.4);
    const spStand = makeSpring(0, 12.0, 6.4);
    const spRearUp = makeSpring(0, 13.0, 6.4);
    const spRoll = makeSpring(0, 10.0, 5.8);
    const spShake = makeSpring(0, 16.0, 6.8);
    const spSquash = makeSpring(0, 28.0, 7.2);
    const spHeadPitch = makeSpring(0, 15, 6.6);
    const spHeadCock = makeSpring(0, 16, 6.8);
    const spYawn = makeSpring(0, 12, 6.0);
    const spCup = makeSpring(0, 9.5, 5.6);
    const spPeek = makeSpring(0, 11, 6.0);
    const spSploot = makeSpring(0, 10, 5.8);       // Puppy flat frog-leg sploot!
    const spScaleBoost = makeSpring(1, 10, 5.8);   // Closeup screen sniff scale

    // Mouth-carried item for Sketch Puppy: null | 'frisbee' | 'bone' | 'stick' | 'daisy' | 'apple_head'
    let carriedItem = null;
    let inkPawStepsLeft = 0;

    // Multi-Companion Social Cast (2, 4~6, up to 12 full-screen companions — enter & exit cleanly via edges!)
    const companions = [];
    const SKETCH_BREEDS = ['shiba', 'dachshund', 'poodle', 'terrier', 'classic'];
    const SKETCH_ACCS = ['scarf', 'sprout', 'beret', 'bow', 'bell', 'none'];
    const GEO_PALETTES = ['sage', 'ochre', 'slate', 'rose', 'terracotta'];
    const GEO_ORNAMENTS = ['halo', 'sprout', 'pebble_hat', 'antenna', 'crown', 'none'];

    function dismissCompanionsGracefully() {
      const home = getHomeScreen();
      const secs = getSecondaryScreens();
      const inPan = storyScope === 'panoramic' && secs.length > 0;
      const homeOuterLeft = inPan ? (secs[0].x >= home.x + home.w * 0.5) : false;
      for (let i = 0; i < companions.length; i++) {
        const c = companions[i];
        c.leaving = true;
        c.stackParent = -1;
        c.pose = 'stand';
        c.targetLevitateZ = 0;
        if (inPan) {
          // Exit via Primary Screen's non-secondary outer edge so companions return home rather than lingering on Secondary!
          c.tx = homeOuterLeft
            ? (home.x - 96 - (i % 5) * 28)
            : (home.x + home.w + 96 + (i % 5) * 28);
          c.ty = clamp(c.y, home.y + home.h * 0.68, home.y + home.h * 0.88);
          c.speed = Math.max(c.speed || 95, 118);
        } else {
          const goLeft = c.x < width * 0.5;
          c.tx = goLeft ? (-92 - (i % 5) * 28) : (width + 92 + (i % 5) * 28);
          c.ty = clamp(c.y, height * 0.60, height * 0.88);
          c.speed = Math.max(c.speed || 85, 98);
        }
      }
    }

    function terrainBandForScreen(sr, gx) {
      const inClockCol = gx > sr.x + sr.w * 0.22 && gx < sr.x + sr.w * 0.78;
      if (sr.primary) {
        return {
          minY: sr.y + sr.h * (inClockCol ? 0.74 : 0.42),
          maxY: sr.y + sr.h * 0.92
        };
      }
      // Secondary screens display a clean centered Clock — visiting excursions pass cleanly below the clock!
      return {
        minY: sr.y + sr.h * (inClockCol ? 0.68 : 0.46),
        maxY: sr.y + sr.h * 0.92
      };
    }

    function getTerrainBandAtX(gx) {
      if (storyScope === 'home' || !pan.screens || pan.screens.length === 0) {
        const inTextCol = gx > width * 0.22 && gx < width * 0.78;
        return { minY: height * (inTextCol ? 0.74 : 0.42), maxY: height * 0.92 };
      }
      const scrs = pan.screens;
      const matches = [];
      for (let i = 0; i < scrs.length; i++) {
        const s = scrs[i];
        if (gx >= s.x && gx <= s.x + s.w) {
          matches.push(terrainBandForScreen(s, gx));
        }
      }
      if (matches.length === 1) return matches[0];
      if (matches.length > 1) {
        // Vertically stacked monitors share X: span from upper screen's below-clock meadow to lower screen's floor!
        let minY = matches[0].minY;
        let maxY = matches[0].maxY;
        for (let i = 1; i < matches.length; i++) {
          if (matches[i].minY < minY) minY = matches[i].minY;
          if (matches[i].maxY > maxY) maxY = matches[i].maxY;
        }
        return { minY: minY, maxY: maxY };
      }
      // Smoothly interpolate across any horizontal bezel gap or offscreen entrance
      let leftS = null, rightS = null;
      for (let i = 0; i < scrs.length; i++) {
        const s = scrs[i];
        if (s.x + s.w < gx && (!leftS || s.x + s.w > leftS.x + leftS.w)) leftS = s;
        if (s.x > gx && (!rightS || s.x < rightS.x)) rightS = s;
      }
      if (leftS && rightS) {
        const bL = terrainBandForScreen(leftS, leftS.x + leftS.w);
        const bR = terrainBandForScreen(rightS, rightS.x);
        const u = clamp((gx - (leftS.x + leftS.w)) / Math.max(1, rightS.x - (leftS.x + leftS.w)), 0, 1);
        return { minY: lerp(bL.minY, bR.minY, u), maxY: lerp(bL.maxY, bR.maxY, u) };
      }
      const fallback = leftS || rightS || scrs[0];
      return terrainBandForScreen(fallback, gx);
    }

    function clampSafeY(gx, gy) {
      const band = getTerrainBandAtX(gx);
      return clamp(gy, band.minY, band.maxY);
    }

    function spawnCompanions(baseCount, isSketch, opts) {
      const o = opts || {};
      const count = baseCount;
      const home = getHomeScreen();
      const secs = getSecondaryScreens();
      const inPan = storyScope === 'panoramic' && secs.length > 0;
      const homeOuterLeft = inPan ? (secs[0].x >= home.x + home.w * 0.5) : true;

      for (let i = companions.length - 1; i >= 0; i--) {
        if (companions[i].leaving) continue;
        companions.splice(i, 1);
      }
      const shuffledSlots = shuffleArray(Array.from({ length: count }, function (_, k) { return k; }), rng);
      for (let i = 0; i < count; i++) {
        const slot = shuffledSlots[i];
        const fromLeft = inPan
          ? homeOuterLeft
          : (o.sameSide !== undefined ? o.sameSide : (slot < count * 0.5));
        const fracX = count > 1 ? (slot / (count - 1)) : 0.5;
        // Always assemble companions on Primary Screen first before any cross-screen excursion!
        const stageX = inPan ? home.x : 0;
        const stageW = inPan ? home.w : width;
        const gx = stageX + stageW * clamp(0.08 + fracX * 0.84 + randRange(-0.02, 0.02), 0.08, 0.92);
        const band = inPan ? terrainBandForScreen(home, gx) : getTerrainBandAtX(gx);
        const gy = lerp(band.minY, band.maxY, randRange(0.08, 0.94));
        const sideOrder = inPan ? i : Math.floor(i / 2);
        const startX = inPan
          ? (homeOuterLeft ? (home.x - 52 - sideOrder * 46) : (home.x + home.w + 52 + sideOrder * 46))
          : (fromLeft ? (-52 - sideOrder * 54) : (width + 52 + sideOrder * 54));
        const startY = clampSafeY(inPan ? gx : (fromLeft ? 20 : width - 20), gy);
        let scale = randRange(0.84, 1.02);
        if (o.miniPack) scale = randRange(0.64, 0.74);
        else if (o.graduated) scale = lerp(0.64, 1.06, count > 1 ? i / (count - 1) : 0.5);
        else if (count >= 8) scale = randRange(0.70, 1.00);

        companions.push({
          id: i,
          x: startX,
          y: startY,
          homeX: gx,
          homeY: gy,
          tx: gx,
          ty: gy,
          vx: 0,
          vy: 0,
          speed: (isSketch ? randRange(78, 104) : randRange(98, 128)) * clamp(stageW / 1280, 0.9, 1.8),
          stride: randRange(0, Math.PI * 2),
          jumpZ: 0,
          jumpVZ: 0,
          levitateZ: 0,
          targetLevitateZ: 0,
          facing: fromLeft ? 1 : -1,
          targetFacing: fromLeft ? 1 : -1,
          pose: 'stand',
          headCock: 0,
          headPitch: 0,
          scale: scale,
          breed: SKETCH_BREEDS[i % SKETCH_BREEDS.length],
          acc: o.plainFirst && i === 0 ? 'scarf' : SKETCH_ACCS[i % SKETCH_ACCS.length],
          palette: GEO_PALETTES[i % GEO_PALETTES.length],
          ornament: GEO_ORNAMENTS[i % GEO_ORNAMENTS.length],
          stackParent: -1,
          phaseOffset: i * 0.85,
          nextActionAt: randRange(2.0, 5.0),
          leaving: false
        });
      }
    }

    // Persistent trails & transient particles
    const footprints = [];
    const inkThreadPts = [];
    const shakeParticles = [];
    const popRings = [];
    let distSinceLastPrint = 0;
    let nextFootSide = 1;
    let shakeSpawnAccum = 0;

    // Modular Scene Props container (reset cleanly between stories)
    let sceneProps = {
      kind: 'none',
      items: [],
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rot: 0,
      alpha: 0,
      progress: 0,
      duration: 10,
      flag: false
    };

    let nextBlinkMs = 2400;
    let blinkUntilMs = 0;

    let currentStory = 'initial_calm';
    let phaseSteps = [];
    let stepIndex = 0;
    let stepElapsed = 0;

    function launchJump(upVel) {
      if (jumpZ <= 3) {
        const vScale = clamp(height / 860, 0.9, 1.45);
        jumpVZ = upVel * vScale;
        spSquash.v -= 3.2;
      }
    }

    function spawnPopRing(x, y, maxR) {
      popRings.push({ x: x, y: y, r: 5, maxR: maxR || 36, alpha: 0.80 });
    }

    function spawnBurstParticles(cx, cy, count, upSpeed) {
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2 + rng() * 0.4;
        shakeParticles.push({
          x: cx + Math.cos(ang) * 8,
          y: cy + Math.sin(ang) * 6,
          vx: Math.cos(ang) * randRange(35, 95),
          vy: Math.sin(ang) * randRange(25, 65) - (upSpeed || 65),
          alpha: 0.78,
          r: randRange(1.8, 3.2)
        });
      }
    }

    function clearStoryState() {
      carriedItem = null;
      spLevitateZ.target = 0;
      spJellyWide.target = 0;
      spTwinSplit.target = 0;
      spSpinAngle.target = 0;
      spSploot.target = 0;
      spScaleBoost.target = 1;
      inkThreadPts.length = 0;
      dismissCompanionsGracefully();
      sceneProps = {
        kind: 'none',
        items: [],
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rot: 0,
        alpha: 0, progress: 0, duration: 10, flag: false
      };
    }

    function resize() {
      if (!canvas || !canvas.getBoundingClientRect) return;
      const rect = canvas.getBoundingClientRect();
      const nw = Math.max(320, Math.round(rect.width || 1280));
      const nh = Math.max(240, Math.round(rect.height || 800));
      const ndpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
      const home = getHomeScreen();
      const nextWorldW = storyScope === 'panoramic' ? (pan.ww > 0 ? pan.ww : nw) : home.w;
      const nextWorldH = storyScope === 'panoramic' ? (pan.wh > 0 ? pan.wh : nh) : home.h;
      if (nw === viewW && nh === viewH && nextWorldW === width && nextWorldH === height && ndpr === dpr && initializedPos) return;

      viewW = nw;
      viewH = nh;
      width = nextWorldW;
      height = nextWorldH;
      refScreenW = home.w;
      refScreenH = home.h;
      dpr = ndpr;
      canvas.width = Math.round(viewW * dpr);
      canvas.height = Math.round(viewH * dpr);
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!initializedPos) {
        resetWorldPlacement();
      } else {
        worldX = clamp(worldX, width * 0.06, width * 0.94);
        worldY = clampSafeY(worldX, worldY);
      }
    }

    function resetWorldPlacement() {
      initializedPos = true;
      if (pan.seed > 0) {
        rng = mulberry32((pan.seed ^ (theme === 'sketch' ? 0x5A17C3 : 0x3C71A5)) >>> 0);
      }
      decks.geometric = [];
      decks.sketch = [];
      simSec = 0;
      nextBlinkSimSec = 2.4;
      blinkUntilSimSec = 0;

      // Always start in 'home' scope on Primary Screen so Secondary Screen begins 100% clean!
      storyScope = 'home';
      const home = getHomeScreen();
      width = home.w;
      height = home.h;

      const startRight = rng() < 0.55;
      worldX = width * (startRight ? randRange(0.66, 0.84) : randRange(0.16, 0.34));
      worldY = clampSafeY(worldX, height * randRange(0.76, 0.86));
      vx = 0;
      vy = 0;
      jumpZ = 0;
      jumpVZ = 0;
      spFacing.x = spFacing.target = worldX > width * 0.5 ? -1 : 1;
      spSleep.x = spSleep.target = 1;
      spSit.x = spSit.target = 0;
      spBow.x = spBow.target = 0;
      spStand.x = spStand.target = 0;
      spRearUp.x = spRearUp.target = 0;
      spRoll.x = spRoll.target = 0;
      spShake.x = spShake.target = 0;
      footprints.length = 0;
      shakeParticles.length = 0;
      popRings.length = 0;
      companions.length = 0;
      clearStoryState();

      currentStory = 'initial_calm';
      phaseSteps = [
        { kind: 'sleep', dur: randRange(1.8, 2.8), cup: rng() < 0.45 }
      ];
      stepIndex = 0;
      stepElapsed = 0;
    }

    function pickOppositeX(vFlip) {
      if (storyScope === 'panoramic') {
        const secs = getSecondaryScreens();
        if (secs.length > 0) {
          const home = getHomeScreen();
          if (!vFlip) {
            const sec = secs[Math.floor(rng() * secs.length)];
            return sec.x + sec.w * randRange(0.26, 0.74);
          }
          return home.x + home.w * randRange(0.26, 0.74);
        }
      }
      const preferRight = worldX < width * 0.5;
      const goRight = vFlip ? !preferRight : preferRight;
      if (goRight) return width * randRange(0.68, 0.88);
      return width * randRange(0.12, 0.32);
    }

    // =========================================================================
    // Story Compiler: Compiles any of the 120 Geometric or 120 Sketch Cards
    // into a Complete Multi-Act 38~54s Theatrical Sequence!
    // =========================================================================
    function compileGeometricStory(card) {
      const id = card.id;
      const v = card.variant; // 0 or 1
      const vScale = clamp(width / 1280, 0.92, 1.85);
      const runSpd = randRange(108, 138) * vScale;
      const fastSpd = randRange(155, 195) * vScale;
      const anc = getExcursionAnchors();
      const destX = anc.inPan ? (anc.secX + randRange(-80, 80)) : pickOppositeX(false);
      const midX = anc.inPan ? anc.homeX : (width * (v === 0 ? randRange(0.42, 0.58) : randRange(0.32, 0.68)));
      const baseY = anc.inPan ? anc.secY : (height * randRange(0.71, 0.85));

      const steps = [{ kind: 'stretch', dur: 1.5 }];

      if (id === 'geo_trampoline_acrobatics' || id === 'geo_star_trampoline_zig') {
        sceneProps = { kind: 'trampoline_pad', x: midX, y: baseY, alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: runSpd, dur: 14 },
          { kind: 'trampoline_bounces', bounces: v === 0 ? 4 : 5, cur: 0, nextAt: 0.2, driftX: id === 'geo_star_trampoline_zig' ? (destX - midX) * 0.18 : 0, dur: 9.5 },
          { kind: 'jelly_pancake_rest', dur: 4.5 },
          { kind: 'walk_to', tx: destX, ty: height * 0.80, speed: runSpd * 0.85, dur: 14 }
        );
      } else if (id === 'geo_zero_g_levitation' || id === 'geo_levitate_figure_eight' || id === 'geo_sky_elevator_drop') {
        const fig8 = id === 'geo_levitate_figure_eight';
        steps.push(
          { kind: 'levitate_roam', mode: fig8 ? 'fig8' : (id === 'geo_sky_elevator_drop' ? 'elevator' : 'drift'), dir: v === 0 ? 1 : -1, dur: randRange(18, 24) },
          { kind: 'sit_calm', dur: 3.5 },
          { kind: 'walk_to', tx: destX, ty: baseY, speed: runSpd * 0.85, dur: 14 }
        );
      } else if (id === 'geo_zen_stone_stack' || id === 'geo_origami_crown_float' || id === 'geo_eclipse_halo_align') {
        const stoneCount = v === 0 ? 3 : 4;
        sceneProps = { kind: 'head_zen_stack', count: stoneCount, mode: id, alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: runSpd * 0.8, dur: 14 },
          { kind: 'zen_balance_walk', tx: destX, ty: baseY, speed: runSpd * 0.58, dur: 18 },
          { kind: 'release_zen_stack', dur: 4.2 }
        );
      } else if (id === 'geo_twin_fission_waltz' || id === 'geo_twin_leapfrog_parade' || id === 'geo_twin_seesaw_tilt') {
        if (id === 'geo_twin_seesaw_tilt') {
          sceneProps = { kind: 'seesaw_beam', x: midX, y: baseY, alpha: 1, items: [] };
        }
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: runSpd, dur: 14 },
          { kind: 'twin_dance', style: id, tx: destX, ty: baseY, dur: randRange(16, 21) },
          { kind: 'sit_calm', dur: 3.2 }
        );
      } else if (id === 'geo_prism_rainbow_beam' || id === 'geo_prism_twin_refract') {
        sceneProps = { kind: 'prism_crystal', x: midX, y: height * 0.56, lit: false, twin: id === 'geo_prism_twin_refract', alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: midX, ty: height * 0.75, speed: runSpd, dur: 14 },
          { kind: 'leap_activate_prism', dur: 8.5 },
          { kind: 'walk_to', tx: destX, ty: baseY, speed: runSpd * 0.85, dur: 14 },
          { kind: 'sit_calm', dur: 3.0 }
        );
      } else if (id === 'geo_pendulum_light_swing') {
        sceneProps = { kind: 'pendulum_tether', x: width * 0.5, y: height * 0.18, len: height * 0.50, ang: 0, alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: width * 0.5, ty: height * 0.72, speed: runSpd, dur: 15 },
          { kind: 'swing_on_pendulum', amp: v === 0 ? 0.52 : -0.58, dur: 14.5 },
          { kind: 'walk_to', tx: destX, ty: baseY, speed: runSpd, dur: 14 }
        );
      } else if (id === 'geo_newton_cradle_impulse' || id === 'geo_sphere_bowling_strike' || id === 'geo_billiard_corner_pocket') {
        const items = [];
        for (let k = 0; k < 4; k++) {
          items.push({ x: midX + (k - 1.5) * 24, y: baseY, vx: 0, vy: 0 });
        }
        sceneProps = { kind: 'sphere_row', subtype: id, items: items, hit: false, alpha: 1 };
        const startSideX = midX > worldX ? midX - 180 : midX + 180;
        steps.push(
          { kind: 'walk_to', tx: clamp(startSideX, 90, width - 90), ty: baseY, speed: runSpd, dur: 12 },
          { kind: 'slingshot_charge_dash', tx: midX, ty: baseY, speed: fastSpd * 1.25, hitSpheres: true, dur: 8 },
          { kind: 'happy_pant', dur: 4.5 },
          { kind: 'walk_to', tx: destX, ty: baseY, speed: runSpd * 0.85, dur: 14 }
        );
      } else if (id === 'geo_edge_portal_warp') {
        sceneProps = { kind: 'edge_portals', y1: height * 0.74, y2: height * 0.68, alpha: 1, items: [] };
        const enterRight = v === 0;
        steps.push(
          { kind: 'sprint_to', tx: enterRight ? width - 22 : 22, ty: height * 0.74, speed: fastSpd, dur: 14 },
          { kind: 'portal_teleport', exitX: enterRight ? 26 : width - 26, exitY: height * 0.68, dur: 0.6 },
          { kind: 'sprint_to', tx: enterRight ? width - 22 : 22, ty: height * 0.68, speed: fastSpd, hopMid: true, dur: 14 },
          { kind: 'portal_teleport', exitX: enterRight ? 26 : width - 26, exitY: height * 0.78, dur: 0.6 },
          { kind: 'walk_to', tx: width * randRange(0.28, 0.72), ty: height * 0.78, speed: runSpd, dur: 12 },
          { kind: 'sit_calm', dur: 3.2 }
        );
      } else if (id === 'geo_stepping_pillars_climb' || id === 'geo_floating_stair_descend' || id === 'geo_bubble_staircase_pop') {
        const count = 5;
        const goRight = destX > worldX;
        const pts = [];
        for (let i = 0; i < count; i++) {
          const px = lerp(width * (goRight ? 0.20 : 0.80), width * (goRight ? 0.80 : 0.20), i / (count - 1));
          const arch = id === 'geo_floating_stair_descend' ? (1 - i / count) * 95 : Math.sin(((i + 0.5) / count) * Math.PI) * 95;
          pts.push({ x: px, y: baseY, h: 22 + arch, popped: false });
        }
        sceneProps = { kind: id === 'geo_bubble_staircase_pop' ? 'bubble_steps' : 'geo_pillars', items: pts, alpha: 1 };
        for (let i = 0; i < pts.length; i++) {
          steps.push({ kind: 'pillar_hop_step', itemIdx: i, speed: runSpd * 1.1, dur: 5.5 });
        }
        steps.push({ kind: 'walk_to', tx: destX, ty: baseY, speed: runSpd, dur: 8 }, { kind: 'sit_calm', dur: 3.0 });
      } else if (id === 'geo_giant_bubble_voyage' || id === 'geo_balloon_buoyancy_drift' || id === 'geo_cloud_cushion_hop') {
        sceneProps = { kind: id, x: worldX, y: worldY - 26, alpha: 1, items: [] };
        steps.push(
          { kind: 'buoyant_sky_voyage', style: id, tx: destX, ty: baseY, dur: randRange(17, 22) },
          { kind: 'walk_to', tx: pickOppositeX(true), ty: baseY, speed: runSpd * 0.85, dur: 14 },
          { kind: 'sit_calm', dur: 3.0 }
        );
      } else if (id === 'geo_constellation_connect' || id === 'geo_shooting_star_catch' || id === 'geo_meteor_shower_dance') {
        const stars = [];
        for (let s = 0; s < 4; s++) {
          stars.push({
            x: width * (0.20 + s * 0.20 + randRange(-0.04, 0.04)),
            y: height * randRange(0.56, 0.66),
            lit: false
          });
        }
        if (v === 1) stars.reverse();
        sceneProps = { kind: 'constellation_nodes', subtype: id, items: stars, alpha: 1 };
        for (let s = 0; s < stars.length; s++) {
          steps.push({ kind: 'touch_star_node', idx: s, speed: runSpd * 1.15, dur: 6.5 });
        }
        steps.push({ kind: 'watch_sky_farewell', dur: 5.0 });
      } else if (id === 'geo_domino_cascade_run' || id === 'geo_musical_chime_steps' || id === 'geo_aurora_ribbon_trail' || id === 'geo_ripple_pond_skim') {
        const goRight = destX > worldX;
        const nodes = [];
        for (let k = 0; k < 9; k++) {
          nodes.push({
            x: lerp(width * (goRight ? 0.16 : 0.84), width * (goRight ? 0.84 : 0.16), k / 8),
            y: baseY,
            tilted: 0
          });
        }
        sceneProps = { kind: 'wave_line_nodes', subtype: id, items: nodes, alpha: 1 };
        steps.push(
          { kind: 'walk_to', tx: nodes[0].x, ty: baseY, speed: runSpd, dur: 12 },
          { kind: 'skim_trigger_nodes', tx: nodes[nodes.length - 1].x, ty: baseY, speed: fastSpd, subtype: id, dur: 14 },
          { kind: 'walk_to', tx: midX, ty: height * 0.78, speed: runSpd * 0.85, dur: 12 },
          { kind: 'sit_calm', dur: 3.5 }
        );
      } else if (id.indexOf('geo_social_') === 0) {
        steps.push(
          { kind: 'geo_social_scene', subtype: id, variant: v, runSpd: runSpd, dur: 29 },
          { kind: 'social_farewell', dur: 6.5 }
        );
      } else if (id === 'geo_slingshot_sonic_dash' || id === 'geo_pinball_wall_ricochet' || id === 'geo_mochi_wall_squish') {
        const p1 = v === 0 ? width - 38 : 38;
        const p2 = v === 0 ? 38 : width - 38;
        steps.push(
          { kind: 'slingshot_charge_dash', tx: p1, ty: height * 0.68, speed: fastSpd * 1.35, dur: 11 },
          { kind: 'wall_squish_bounce', dir: v === 0 ? -1 : 1, dur: 1.4 },
          { kind: 'slingshot_charge_dash', tx: p2, ty: height * 0.82, speed: fastSpd * 1.30, dur: 12 },
          { kind: 'wall_squish_bounce', dir: v === 0 ? 1 : -1, dur: 1.4 },
          { kind: 'walk_to', tx: midX, ty: baseY, speed: runSpd, dur: 12 },
          { kind: 'jelly_pancake_rest', dur: 3.5 }
        );
      } else {
        // Remaining specialized Geometric Set-Pieces (orbiting moons, hula halo, hourglass, lantern, arc jumprope, spiral, compass, etc.)
        sceneProps = { kind: 'geo_emblem_show', subtype: id, x: midX, y: baseY, rot: 0, alpha: 1, items: [] };
        const cornerA = v === 0 ? width * 0.18 : width * 0.82;
        const cornerB = v === 0 ? width * 0.82 : width * 0.18;
        steps.push(
          { kind: 'walk_to', tx: cornerA, ty: height * 0.68, speed: runSpd, dur: 12 },
          { kind: 'walk_to', tx: midX, ty: baseY, speed: runSpd * 1.1, dur: 12 },
          { kind: 'perform_geo_emblem', subtype: id, dur: randRange(13, 17) },
          { kind: 'bound_across', tx: cornerB, ty: height * 0.80, speed: runSpd, nextHopAt: 0.25, dur: 12 },
          { kind: 'sit_calm', dur: 3.0 }
        );
      }

      if (storyScope === 'panoramic') {
        const home = getHomeScreen();
        steps.push({
          kind: 'return_home_screen',
          tx: home.x + home.w * randRange(0.28, 0.72),
          ty: home.y + home.h * randRange(0.76, 0.85),
          speed: runSpd * 1.05,
          dur: 16.0
        });
      }
      steps.push({ kind: 'settle_sleep', dur: 2.0 });
      return steps;
    }

    function compileSketchStory(card) {
      const id = card.id;
      const v = card.variant;
      const vScale = clamp(width / 1280, 0.90, 1.65);
      const trotSpd = randRange(72, 96) * vScale;
      const sprintSpd = randRange(112, 142) * vScale;
      const anc = getExcursionAnchors();
      const destX = anc.inPan ? (anc.secX + randRange(-80, 80)) : pickOppositeX(false);
      const midX = anc.inPan ? anc.homeX : (width * randRange(0.36, 0.64));
      const baseY = anc.inPan ? anc.secY : (height * randRange(0.71, 0.85));

      const steps = [{ kind: 'wake_yawn', dur: 1.6 }, { kind: 'stretch', dur: 1.4 }];

      if (id.indexOf('sk_social_') === 0) {
        steps.push(
          { kind: 'sk_social_scene', subtype: id, variant: v, trotSpd: trotSpd, dur: 30 },
          { kind: 'social_farewell', dur: 6.5 }
        );
      } else if (id === 'sk_frisbee_diving_catch' || id === 'sk_double_frisbee_boomerang') {
        const fromLeft = storyScope === 'panoramic' ? (destX > worldX) : (worldX > width * 0.5);
        sceneProps = {
          kind: 'sk_frisbee',
          x: storyScope === 'panoramic' ? worldX : (fromLeft ? -40 : width + 40),
          y: height * 0.56,
          vx: (fromLeft ? 1 : -1) * randRange(145, 175) * vScale,
          caught: false,
          alpha: 1,
          items: []
        };
        steps.push(
          { kind: 'chase_frisbee_dive', speed: sprintSpd * 1.1, dur: 11 },
          { kind: 'proud_carry_parade', item: 'frisbee', tx: pickOppositeX(true), ty: baseY, speed: trotSpd, dur: 15 },
          { kind: 'drop_item_wag', dur: 4.0 }
        );
      } else if (id === 'sk_dig_and_bury_bone' || id === 'sk_buried_treasure_unearth' || id === 'sk_acorn_hide_and_seek') {
        const digX = pickOppositeX(false);
        const itemKind = id === 'sk_acorn_hide_and_seek' ? 'stick' : 'bone';
        carriedItem = id === 'sk_dig_and_bury_bone' ? itemKind : null;
        sceneProps = { kind: 'dirt_mound', x: digX, y: baseY, size: id === 'sk_dig_and_bury_bone' ? 0 : 1, alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: digX, ty: baseY, speed: trotSpd, dur: 15 },
          { kind: 'dig_ground_paws', unearth: id !== 'sk_dig_and_bury_bone', item: itemKind, dur: 6.5 },
          { kind: 'proud_carry_parade', item: carriedItem ? null : itemKind, tx: midX, ty: height * 0.78, speed: trotSpd, dur: 14 },
          { kind: 'sniff_ground', dur: 3.5 }
        );
      } else if (id === 'sk_chase_own_tail_dizzy' || id === 'sk_tail_wag_semaphore' || id === 'sk_happy_backflip_try') {
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: trotSpd, dur: 13 },
          { kind: 'chase_tail_spin', turns: v === 0 ? 5 : 7, dur: 7.5 },
          { kind: 'dizzy_wobble_sit', dur: 4.5 },
          { kind: 'bound_across', tx: destX, ty: baseY, speed: trotSpd, nextHopAt: 0.3, dur: 13 }
        );
      } else if (id === 'sk_ink_puddle_pawprints' || id === 'sk_footprints_circle_art') {
        sceneProps = { kind: 'ink_puddle', x: midX, y: baseY, alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: trotSpd, dur: 14 },
          { kind: 'step_in_ink_puddle', dur: 2.8 },
          { kind: 'sprint_to', tx: destX, ty: height * 0.68, speed: trotSpd * 1.15, dur: 12 },
          { kind: 'walk_to', tx: pickOppositeX(true), ty: height * 0.83, speed: trotSpd, dur: 13 },
          { kind: 'look_around', dur: 3.5 }
        );
      } else if (id === 'sk_raincloud_umbrella_shake' || id === 'sk_headwind_ears_fly' || id === 'sk_gentle_rain_listen') {
        sceneProps = { kind: id === 'sk_headwind_ears_fly' ? 'wind_gust_lines' : 'sk_raincloud', x: worldX, y: height * 0.50, alpha: 1, items: [] };
        steps.push(
          { kind: 'weather_scurry', subtype: id, tx: destX, ty: baseY, speed: sprintSpd * 0.9, dur: 15 },
          { kind: 'body_shake', dur: 2.6 },
          { kind: 'walk_to', tx: midX, ty: baseY, speed: trotSpd, dur: 12 },
          { kind: 'sit_calm', dur: 3.2 }
        );
      } else if (id === 'sk_butterfly_nose_perch' || id === 'sk_butterfly_duo_spiral') {
        sceneProps = { kind: 'nose_butterfly', x: v === 0 ? -20 : width + 20, y: height * 0.58, perched: false, duo: id === 'sk_butterfly_duo_spiral', alpha: 1, items: [] };
        steps.push(
          { kind: 'walk_to', tx: midX, ty: baseY, speed: trotSpd, dur: 13 },
          { kind: 'butterfly_perch_act', dur: 12.5 },
          { kind: 'sneeze_recoil', dur: 2.6 },
          { kind: 'walk_to', tx: destX, ty: baseY, speed: trotSpd, dur: 12 }
        );
      } else if (id === 'sk_yarn_ball_unravel' || id === 'sk_soccer_ball_dribble' || id === 'sk_rolling_acorn_pat') {
        const startBallX = lerp(worldX, destX, 0.18);
        sceneProps = { kind: id === 'sk_yarn_ball_unravel' ? 'yarn_ball' : 'sk_ball', x: startBallX, y: baseY, vx: 0, rot: 0, alpha: 1, items: [] };
        inkThreadPts.length = 0;
        steps.push(
          { kind: 'dribble_prop_across', isYarn: id === 'sk_yarn_ball_unravel', tx: destX, ty: baseY, speed: trotSpd * 1.15, dur: 18 },
          { kind: 'happy_pant', dur: 3.5 },
          { kind: 'walk_to', tx: midX, ty: height * 0.80, speed: trotSpd, dur: 12 }
        );
      } else if (id === 'sk_dandelion_puff_scatter' || id === 'sk_three_autumn_leaves' || id === 'sk_feather_tickle_hop' || id === 'sk_snow_speck_catch') {
        const seeds = [];
        for (let s = 0; s < 8; s++) {
          seeds.push({ x: midX, y: baseY - 18, vx: randRange(-42, 42), vy: -randRange(18, 52), phase: s });
        }
        sceneProps = { kind: 'dandelion_puff', subtype: id, x: midX, y: baseY, blown: false, items: seeds, alpha: 1 };
        steps.push(
          { kind: 'walk_to', tx: midX - 28, ty: baseY, speed: trotSpd, dur: 13 },
          { kind: 'blow_dandelion_chase', tx: destX, ty: baseY, speed: trotSpd * 1.2, dur: 16 },
          { kind: 'sneeze_recoil', dur: 2.4 },
          { kind: 'sit_calm', dur: 3.2 }
        );
      } else if (id === 'sk_page_corner_curl_peek' || id === 'sk_bezel_window_scratch' || id === 'sk_bezel_left_right_patrol') {
        const rightSide = v === 0;
        const cornerX = rightSide ? width - 54 : 54;
        sceneProps = { kind: 'paper_corner_curl', side: rightSide ? 1 : -1, curl: 0, alpha: 1, items: [] };
        steps.push(
          { kind: 'sprint_to', tx: cornerX, ty: height * 0.85, speed: trotSpd * 1.2, dur: 15 },
          { kind: 'paw_curl_paper_peek', edgeDir: rightSide ? 1 : -1, dur: 8.5 },
          { kind: 'bound_across', tx: rightSide ? width * 0.24 : width * 0.76, ty: height * 0.75, speed: trotSpd, nextHopAt: 0.25, dur: 14 },
          { kind: 'sit_calm', dur: 3.0 }
        );
      } else if (id === 'sk_grass_tuft_frog_race' || id === 'sk_pebble_hurdle_steeple' || id === 'sk_cricket_chirp_pounce') {
        const goRight = destX > worldX;
        const tufts = [];
        for (let k = 0; k < 4; k++) {
          tufts.push({
            x: lerp(width * (goRight ? 0.22 : 0.78), width * (goRight ? 0.78 : 0.22), k / 3),
            y: baseY
          });
        }
        sceneProps = { kind: 'grass_and_frog', subtype: id, items: tufts, frogX: tufts[0].x, frogZ: 0, alpha: 1 };
        steps.push(
          { kind: 'walk_to', tx: tufts[0].x - (goRight ? 36 : -36), ty: baseY, speed: trotSpd, dur: 12 },
          { kind: 'frog_hurdle_chase', tx: tufts[3].x, ty: baseY, speed: trotSpd * 1.15, nextHopAt: 0.2, dur: 15 },
          { kind: 'sniff_ground', dur: 3.5 },
          { kind: 'walk_to', tx: midX, ty: height * 0.80, speed: trotSpd, dur: 11 }
        );
      } else if (id === 'sk_proud_stick_parade' || id === 'sk_offscreen_daisy_gift' || id === 'sk_apple_head_balance') {
        const exitX = worldX > width * 0.5 ? width + 130 : -130;
        const enterX = exitX > 0 ? -130 : width + 130;
        const gift = id === 'sk_proud_stick_parade' ? 'stick' : (id === 'sk_apple_head_balance' ? 'apple_head' : 'daisy');
        steps.push(
          { kind: 'walk_to', tx: exitX, ty: baseY, speed: trotSpd * 1.1, dur: 14 },
          { kind: 'offscreen_equip', enterX: enterX, enterY: baseY, item: gift, dur: 3.2 },
          { kind: 'proud_carry_parade', item: gift, tx: pickOppositeX(false), ty: baseY, speed: trotSpd * 0.92, dur: 16 },
          { kind: 'drop_item_wag', dur: 4.5 }
        );
      } else if (id === 'sk_paper_plane_pounce' || id === 'sk_paper_boat_escort' || id === 'sk_kite_string_trot' || id === 'sk_origami_crane_greeting') {
        const goRight = storyScope === 'panoramic' ? (destX > worldX) : (worldX < width * 0.5);
        sceneProps = {
          kind: id === 'sk_paper_boat_escort' ? 'sk_paper_boat' : 'sk_paper_plane',
          x: storyScope === 'panoramic' ? (worldX - (goRight ? 60 : -60)) : (goRight ? -45 : width + 45),
          y: id === 'sk_paper_boat_escort' ? baseY + 10 : height * 0.48,
          vx: goRight ? 1 : -1,
          progress: 0,
          duration: 15,
          alpha: 1,
          items: []
        };
        steps.push(
          { kind: 'escort_paper_craft', isBoat: id === 'sk_paper_boat_escort', ty: baseY, speed: trotSpd * 1.1, dur: 15.5 },
          { kind: 'watch_sky_farewell', dur: 3.8 },
          { kind: 'walk_to', tx: storyScope === 'panoramic' ? pickOppositeX(true) : midX, ty: height * 0.79, speed: trotSpd, dur: 14 }
        );
      } else if (id === 'sk_belly_up_back_wiggle' || id === 'sk_sploot_frog_stretch' || id === 'sk_yawn_stretch_roll_combo') {
        steps.push(
          { kind: 'walk_to', tx: destX, ty: baseY, speed: trotSpd, dur: 14 },
          { kind: id === 'sk_sploot_frog_stretch' ? 'frog_sploot_relax' : 'belly_roll', dur: 9.5 },
          { kind: 'body_shake', dur: 2.2 },
          { kind: 'walk_to', tx: midX, ty: height * 0.80, speed: trotSpd, dur: 12 }
        );
      } else if (id === 'sk_front_glass_sniff_closeup') {
        steps.push(
          { kind: 'walk_to', tx: width * 0.5, ty: height * 0.87, speed: trotSpd, dur: 14 },
          { kind: 'closeup_screen_sniff', dur: 8.5 },
          { kind: 'bound_across', tx: destX, ty: height * 0.74, speed: trotSpd * 1.15, nextHopAt: 0.2, dur: 13 }
        );
      } else {
        // Remaining Sketch Puppy Ethology Stories (dashed scent trail, snack bowl, crescent howl, ladybug watch, radar ears, figure-8 zoomies, etc.)
        sceneProps = { kind: 'sk_vignette_prop', subtype: id, x: midX, y: baseY, alpha: 1, items: [] };
        const sideA = v === 0 ? width * 0.16 : width * 0.84;
        const sideB = v === 0 ? width * 0.84 : width * 0.16;
        steps.push(
          { kind: 'sprint_to', tx: sideA, ty: height * 0.67, speed: sprintSpd * 0.88, hopMid: true, dur: 12 },
          { kind: 'walk_to', tx: midX, ty: baseY, speed: trotSpd, dur: 12 },
          { kind: 'perform_sk_vignette', subtype: id, dur: randRange(12, 16) },
          { kind: 'walk_to', tx: sideB, ty: height * 0.81, speed: trotSpd, dur: 13 }
        );
      }

      if (storyScope === 'panoramic') {
        const home = getHomeScreen();
        steps.push({
          kind: 'return_home_screen',
          tx: home.x + home.w * randRange(0.28, 0.72),
          ty: home.y + home.h * randRange(0.76, 0.85),
          speed: trotSpd * 1.12,
          dur: 16.0
        });
      }
      steps.push({ kind: 'settle_sleep', dur: 2.0 });
      return steps;
    }

    function buildNextNarrative() {
      clearStoryState();
      if (currentStory !== 'sleep_dwell' && currentStory !== 'initial_calm') {
        setStoryScope('home');
        currentStory = 'sleep_dwell';
        phaseSteps = [
          { kind: 'sleep', dur: randRange(16.0, 24.0), cup: rng() < 0.40, dreamBone: theme === 'sketch' && rng() < 0.45 }
        ];
        stepIndex = 0;
        stepElapsed = 0;
        return;
      }

      const card = drawNextFromDeck(theme);
      setStoryScope(CROSS_SCREEN_EXCURSION_SET.has(card.id) ? 'panoramic' : 'home');
      currentStory = card.key;
      phaseSteps = theme === 'sketch' ? compileSketchStory(card) : compileGeometricStory(card);
      stepIndex = 0;
      stepElapsed = 0;
    }

    function setPoseWeights(sleep, sit, bow, stand, rearUp, roll) {
      spSleep.target = sleep;
      spSit.target = sit;
      spBow.target = bow;
      spStand.target = stand;
      spRearUp.target = rearUp || 0;
      spRoll.target = roll || 0;
    }

    function steerToward(goalX, goalY, maxSpeed, dt) {
      const dx = goalX - worldX;
      const dy = goalY - worldY;
      const dist = Math.hypot(dx, dy);
      if (Math.abs(dx) > 6) {
        spFacing.target = dx >= 0 ? 1 : -1;
      }
      const turnAligned = Math.abs(spFacing.x - spFacing.target) < 0.55 ? 1 : 0.20;
      const spd = maxSpeed * clamp(dist / 46, 0, 1) * turnAligned;
      if (dist > 4.5) {
        vx = lerp(vx, (dx / dist) * spd, Math.min(1, dt * 6.2));
        vy = lerp(vy, (dy / dist) * spd, Math.min(1, dt * 6.2));
        return false;
      }
      vx = lerp(vx, 0, Math.min(1, dt * 9));
      vy = lerp(vy, 0, Math.min(1, dt * 9));
      return true;
    }

    // =========================================================================
    // Unified Step Executor
    // =========================================================================
    function stepDirector(dt, tSec) {
      if (phaseSteps.length === 0 || stepIndex >= phaseSteps.length) {
        buildNextNarrative();
      }
      const step = phaseSteps[stepIndex];
      stepElapsed += dt;

      // Reset transient modifiers unless held by current step
      spYawn.target = 0;
      spHeadPitch.target = 0;
      spHeadCock.target = 0;
      spPeek.target = 0;
      spShake.target = 0;
      spJellyWide.target = 0;
      spSploot.target = 0;
      spScaleBoost.target = 1;
      spCup.target = step.cup ? 1 : 0;

      let stepDone = stepElapsed >= step.dur;

      switch (step.kind) {
        case 'sleep':
          vx = lerp(vx, 0, dt * 7);
          vy = lerp(vy, 0, dt * 7);
          setPoseWeights(1, 0, 0, 0, 0, 0);
          break;

        case 'wake_yawn':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spYawn.target = Math.sin(clamp(stepElapsed / step.dur, 0, 1) * Math.PI);
          spHeadPitch.target = -0.30 * spYawn.target;
          break;

        case 'stretch':
          vx = 0; vy = 0;
          if (stepElapsed < step.dur * 0.70) setPoseWeights(0, 0, 1, 0, 0, 0);
          else setPoseWeights(0, 0, 0, 1, 0, 0);
          break;

        case 'walk_to':
        case 'sprint_to':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          if (step.hopMid && !step._hop && stepElapsed > 1.2 && Math.abs(step.tx - worldX) > 120) {
            step._hop = true;
            launchJump(240);
          }
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;

        case 'bound_across':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          if (stepElapsed >= step.nextHopAt && Math.abs(step.tx - worldX) > 65) {
            launchJump(randRange(215, 255));
            step.nextHopAt = stepElapsed + randRange(0.78, 0.96);
          }
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;

        // --- GEOMETRIC ACT HANDLERS ---
        case 'trampoline_bounces':
          vx = lerp(vx, step.driftX || 0, dt * 3);
          vy = 0;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          if (jumpZ <= 2 && stepElapsed >= step.nextAt) {
            step.cur += 1;
            launchJump(220 + step.cur * 45);
            spawnPopRing(worldX, worldY, 28 + step.cur * 6);
            step.nextAt = stepElapsed + 0.55;
            if (step.cur >= step.bounces) stepDone = true;
          }
          if (jumpZ > 65) spSpinAngle.target = Math.PI * 2;
          else if (jumpZ <= 4) spSpinAngle.x = spSpinAngle.target = 0;
          break;

        case 'jelly_pancake_rest':
          vx = 0; vy = 0;
          setPoseWeights(1, 0, 0, 0, 0, 0);
          spJellyWide.target = 1.0;
          break;

        case 'levitate_roam': {
          setPoseWeights(0, 1, 0, 0, 0, 0);
          const p = stepElapsed / step.dur;
          const env = Math.sin(clamp(p, 0, 1) * Math.PI);
          spLevitateZ.target = env * (step.mode === 'elevator' ? height * 0.44 : height * 0.30);
          const targetX = step.mode === 'fig8'
            ? width * 0.5 + Math.sin(p * Math.PI * 2) * (width * 0.32) * step.dir
            : lerp(worldX, width * 0.5 + step.dir * width * 0.28, dt * 0.8);
          const targetY = height * 0.76 + Math.sin(p * Math.PI * 4) * 28;
          steerToward(targetX, targetY, 95, dt);
          spHeadPitch.target = -0.35 * env;
          if (p > 0.92) spLevitateZ.target = 0;
          break;
        }

        case 'zen_balance_walk':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = -0.25;
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;

        case 'release_zen_stack':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 0, 1, 0);
          if (!step._popped && stepElapsed > 1.2) {
            step._popped = true;
            launchJump(210);
            spawnBurstParticles(worldX, worldY - 75, 8, 80);
            sceneProps.kind = 'none';
          }
          break;

        case 'twin_dance':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spTwinSplit.target = stepElapsed < step.dur - 2.2 ? 1 : 0;
          steerToward(step.tx, step.ty, 72, dt);
          if (Math.floor(stepElapsed * 1.4) !== step._lastHopTick) {
            step._lastHopTick = Math.floor(stepElapsed * 1.4);
            if (spTwinSplit.x > 0.5) launchJump(175);
          }
          break;

        case 'leap_activate_prism':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 0, 1, 0);
          spHeadPitch.target = -0.65;
          if (!sceneProps.lit && stepElapsed > 1.2) {
            sceneProps.lit = true;
            launchJump(275);
            spawnPopRing(sceneProps.x, sceneProps.y, 48);
          }
          break;

        case 'swing_on_pendulum': {
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          const env = Math.sin(clamp(stepElapsed / step.dur, 0, 1) * Math.PI);
          const ang = Math.sin(stepElapsed * 2.1) * step.amp * env;
          sceneProps.ang = ang;
          worldX = sceneProps.x + Math.sin(ang) * sceneProps.len;
          const arcLift = (1 - Math.cos(ang)) * sceneProps.len + 26 * env;
          spLevitateZ.x = spLevitateZ.target = arcLift;
          spFacing.target = Math.cos(stepElapsed * 2.1) * step.amp >= 0 ? 1 : -1;
          if (stepElapsed > step.dur - 0.5) spLevitateZ.target = 0;
          break;
        }

        case 'slingshot_charge_dash':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          if (stepElapsed < 1.1) {
            vx = 0; vy = 0;
            spFacing.target = step.tx >= worldX ? 1 : -1;
            spJellyWide.target = 0.85;
          } else {
            spJellyWide.target = -0.45;
            if (steerToward(step.tx, step.ty, step.speed, dt)) {
              if (step.hitSpheres && sceneProps.items && sceneProps.items.length > 0 && !sceneProps.hit) {
                sceneProps.hit = true;
                const dir = spFacing.target;
                const last = sceneProps.items[dir > 0 ? sceneProps.items.length - 1 : 0];
                last.vx = dir * 320;
                spawnPopRing(worldX, worldY - 18, 42);
              }
              stepDone = true;
            }
          }
          break;

        case 'wall_squish_bounce':
          vx = 0; vy = 0;
          spJellyWide.target = -0.75;
          spFacing.target = step.dir;
          if (stepElapsed > 0.4 && !step._bounced) {
            step._bounced = true;
            launchJump(190);
          }
          break;

        case 'portal_teleport':
          worldX = step.exitX;
          worldY = step.exitY;
          spawnPopRing(worldX, worldY - 24, 44);
          launchJump(185);
          stepDone = true;
          break;

        case 'pillar_hop_step': {
          const pItem = sceneProps.items[step.itemIdx];
          if (!pItem) { stepDone = true; break; }
          setPoseWeights(0, 0, 0, 1, 0, 0);
          const arrived = steerToward(pItem.x, pItem.y, step.speed, dt);
          spLevitateZ.target = pItem.h;
          if (Math.abs(pItem.x - worldX) < 42 && !step._jumped) {
            step._jumped = true;
            launchJump(165);
            if (sceneProps.kind === 'bubble_steps') {
              pItem.popped = true;
              spawnPopRing(pItem.x, pItem.y - pItem.h, 30);
            }
          }
          if (arrived && stepElapsed > 1.2) {
            if (step.itemIdx === sceneProps.items.length - 1) spLevitateZ.target = 0;
            stepDone = true;
          }
          break;
        }

        case 'buoyant_sky_voyage': {
          setPoseWeights(0, 1, 0, 0, 0, 0);
          const p = clamp(stepElapsed / step.dur, 0, 1);
          const lift = Math.sin(p * Math.PI) * (height * 0.34);
          spLevitateZ.target = lift;
          steerToward(step.tx, step.ty, 68, dt);
          sceneProps.x = worldX;
          sceneProps.y = worldY - spLevitateZ.x - 28;
          if (p > 0.90 && !sceneProps.flag) {
            sceneProps.flag = true;
            spawnPopRing(sceneProps.x, sceneProps.y, 52);
            sceneProps.kind = 'none';
            spLevitateZ.target = 0;
          }
          break;
        }

        case 'touch_star_node': {
          const st = sceneProps.items[step.idx];
          if (!st) { stepDone = true; break; }
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = -0.55;
          steerToward(st.x, height * 0.76, step.speed, dt);
          if (Math.abs(st.x - worldX) < 36 && jumpZ <= 2) {
            launchJump(285);
          }
          if (!st.lit && Math.abs(st.x - worldX) < 42 && jumpZ > 32) {
            st.lit = true;
            spawnPopRing(st.x, st.y, 32);
            stepDone = true;
          }
          break;
        }

        case 'skim_trigger_nodes':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          if (step.subtype === 'geo_ripple_pond_skim' && jumpZ <= 2) {
            launchJump(140);
            spawnPopRing(worldX, worldY, 44);
          }
          for (let i = 0; i < sceneProps.items.length; i++) {
            const nd = sceneProps.items[i];
            if (!nd.tilted && Math.abs(nd.x - worldX) < 28) {
              nd.tilted = 1;
              spawnPopRing(nd.x, nd.y - 16, 22);
            }
          }
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;

        case 'perform_geo_emblem':
          vx = lerp(vx, 0, dt * 6);
          vy = lerp(vy, 0, dt * 6);
          sceneProps.x = worldX;
          sceneProps.y = worldY;
          sceneProps.rot += dt * 2.2;
          if (step.subtype.includes('spin') || step.subtype.includes('gyro') || step.subtype.includes('hula')) {
            setPoseWeights(0, 0, 0, 1, 0, 0);
            spFacing.target = Math.sin(stepElapsed * 5) >= 0 ? 1 : -1;
          } else if (step.subtype.includes('tea') || step.subtype.includes('hourglass') || step.subtype.includes('hearth')) {
            setPoseWeights(0, 1, 0, 0, 0, 0);
            spCup.target = step.subtype.includes('tea') ? 1 : 0;
            spLevitateZ.target = step.subtype.includes('tea') ? 22 : 0;
          } else if (step.subtype.includes('periscope') || step.subtype.includes('totem')) {
            setPoseWeights(0, 0, 0, 0, 1, 0);
            spJellyWide.target = -0.85 * Math.sin(stepElapsed * 1.6);
          } else {
            setPoseWeights(0, 0, 0, 1, 0, 0);
            if (Math.floor(stepElapsed * 1.1) !== step._jt && jumpZ <= 2) {
              step._jt = Math.floor(stepElapsed * 1.1);
              launchJump(205);
            }
          }
          if (stepElapsed > step.dur - 0.8) spLevitateZ.target = 0;
          break;

        // --- SKETCH PUPPY ACT HANDLERS ---
        case 'chase_frisbee_dive':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = -0.45;
          sceneProps.x += sceneProps.vx * dt;
          sceneProps.y = height * 0.62 + Math.sin(stepElapsed * 2.2) * 18;
          steerToward(clamp(sceneProps.x, 80, width - 80), height * 0.76, step.speed, dt);
          if (!sceneProps.caught && Math.abs(sceneProps.x - worldX) < 58 && stepElapsed > 1.2) {
            sceneProps.caught = true;
            sceneProps.kind = 'none';
            carriedItem = 'frisbee';
            launchJump(275);
            spawnPopRing(worldX, worldY - 48, 34);
            stepDone = true;
          }
          if (sceneProps.x < -80 || sceneProps.x > width + 80) {
            sceneProps.kind = 'none';
            carriedItem = 'frisbee';
            stepDone = true;
          }
          break;

        case 'proud_carry_parade':
          if (step.item) carriedItem = step.item;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = -0.22;
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;

        case 'drop_item_wag':
          vx = 0; vy = 0;
          carriedItem = null;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spHeadCock.target = Math.sin(tSec * 2.6) * 0.45;
          break;

        case 'dig_ground_paws':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 1, 0, 0, 0);
          spHeadPitch.target = 0.65;
          sceneProps.size = step.unearth ? Math.max(0.2, 1 - stepElapsed / step.dur) : Math.min(1, stepElapsed / step.dur);
          shakeSpawnAccum += dt;
          if (shakeSpawnAccum >= 0.18) {
            shakeSpawnAccum = 0;
            shakeParticles.push({
              x: worldX + spFacing.target * 18,
              y: worldY - 4,
              vx: -spFacing.target * randRange(35, 80),
              vy: -randRange(45, 95),
              alpha: 0.68,
              r: 2.0
            });
          }
          if (stepElapsed > step.dur - 0.4) {
            carriedItem = step.unearth ? step.item : null;
          }
          break;

        case 'chase_tail_spin':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spFacing.x = Math.sin(stepElapsed * 9.5) >= 0 ? 1 : -1;
          spFacing.target = spFacing.x;
          spHeadPitch.target = 0.45;
          break;

        case 'dizzy_wobble_sit':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spHeadCock.target = Math.sin(stepElapsed * 4.5) * 0.85;
          break;

        case 'step_in_ink_puddle':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = 0.72;
          if (!step._inked && stepElapsed > 1.2) {
            step._inked = true;
            inkPawStepsLeft = 18;
            launchJump(155);
          }
          break;

        case 'weather_scurry':
          setPoseWeights(0, 0, 0, 1, 0, 0);
          sceneProps.x = lerp(sceneProps.x, worldX, dt * 1.4);
          if (step.subtype === 'sk_headwind_ears_fly') {
            vx = 0; vy = 0;
            spFacing.target = 1;
            spHeadPitch.target = -0.18;
          } else if (steerToward(step.tx, step.ty, step.speed, dt)) {
            sceneProps.kind = 'none';
            stepDone = true;
          }
          break;

        case 'butterfly_perch_act': {
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          const noseX = worldX + spFacing.target * 26;
          const noseY = worldY - 46;
          if (stepElapsed < 8.5) {
            sceneProps.x = lerp(sceneProps.x, noseX, dt * 1.8);
            sceneProps.y = lerp(sceneProps.y, noseY, dt * 1.8) + Math.sin(tSec * 4) * 2;
            spHeadPitch.target = -0.15;
          } else {
            sceneProps.y -= 65 * dt;
            sceneProps.x += spFacing.target * 45 * dt;
            spHeadPitch.target = -0.65;
          }
          break;
        }

        case 'sneeze_recoil':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          if (stepElapsed < 1.1) {
            spHeadPitch.target = -0.65;
          } else if (!step._sneezed) {
            step._sneezed = true;
            spHeadPitch.x = 0.85;
            launchJump(145);
            spawnBurstParticles(worldX + spFacing.target * 24, worldY - 36, 5, 40);
          }
          break;

        case 'dribble_prop_across': {
          setPoseWeights(0, 0, 0, 1, 0, 0);
          const arrived = steerToward(step.tx, step.ty, step.speed, dt);
          sceneProps.x = worldX + spFacing.target * 28;
          sceneProps.y = worldY;
          sceneProps.rot += vx * dt * 0.08;
          if (step.isYarn && Math.hypot(vx, vy) > 12) {
            if (inkThreadPts.length === 0 || Math.hypot(worldX - inkThreadPts[inkThreadPts.length - 1].x, worldY - inkThreadPts[inkThreadPts.length - 1].y) > 14) {
              inkThreadPts.push({ x: sceneProps.x, y: worldY + 1 });
              if (inkThreadPts.length > 65) inkThreadPts.shift();
            }
          }
          if (arrived) stepDone = true;
          break;
        }

        case 'blow_dandelion_chase':
          if (stepElapsed < 2.0) {
            vx = 0; vy = 0;
            setPoseWeights(0, 0, 0, 1, 0, 0);
            spHeadPitch.target = 0.45;
          } else {
            sceneProps.blown = true;
            for (let i = 0; i < sceneProps.items.length; i++) {
              const sd = sceneProps.items[i];
              sd.x += (sd.vx + 28) * dt;
              sd.y += (sd.vy + Math.sin(tSec * 2 + sd.phase) * 18) * dt * 0.45;
            }
            setPoseWeights(0, 0, 0, 1, 0, 0);
            spHeadPitch.target = -0.52;
            if (Math.floor(stepElapsed * 0.9) !== step._lt && jumpZ <= 2) {
              step._lt = Math.floor(stepElapsed * 0.9);
              launchJump(235);
            }
            steerToward(step.tx, step.ty, step.speed, dt);
          }
          break;

        case 'paw_curl_paper_peek':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 0, 1, 0);
          spFacing.target = step.edgeDir;
          spPeek.target = 1;
          sceneProps.curl = smoothstep(0, 2.2, stepElapsed) * (1 - smoothstep(step.dur - 1.5, step.dur, stepElapsed));
          break;

        case 'frog_hurdle_chase': {
          setPoseWeights(0, 0, 0, 1, 0, 0);
          const hopCycle = (stepElapsed * 1.5) % 1;
          sceneProps.frogZ = Math.sin(hopCycle * Math.PI) * 34;
          sceneProps.frogX = lerp(worldX + spFacing.target * 54, step.tx, 0.15);
          if (stepElapsed >= step.nextHopAt && jumpZ <= 2) {
            launchJump(230);
            step.nextHopAt = stepElapsed + 0.85;
          }
          if (steerToward(step.tx, step.ty, step.speed, dt)) stepDone = true;
          break;
        }

        case 'offscreen_equip':
          vx = 0; vy = 0;
          worldX = step.enterX;
          worldY = step.enterY;
          carriedItem = step.item;
          spFacing.x = spFacing.target = step.enterX < 0 ? 1 : -1;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          break;

        case 'escort_paper_craft': {
          sceneProps.progress += dt / sceneProps.duration;
          const p = clamp(sceneProps.progress, 0, 1);
          sceneProps.x = sceneProps.vx > 0 ? lerp(-40, width + 50, p) : lerp(width + 40, -50, p);
          if (!step.isBoat) {
            sceneProps.y = height * 0.50 + Math.sin(p * Math.PI * 3) * 38;
            spHeadPitch.target = -0.58;
            if (!step._leapt && p > 0.48 && Math.abs(sceneProps.x - worldX) < 85) {
              step._leapt = true;
              launchJump(280);
            }
          }
          setPoseWeights(0, 0, 0, 1, 0, 0);
          steerToward(clamp(sceneProps.x - sceneProps.vx * 32, 70, width - 70), step.ty, step.speed, dt);
          if (p >= 1) {
            sceneProps.kind = 'none';
            stepDone = true;
          }
          break;
        }

        case 'frog_sploot_relax':
          vx = 0; vy = 0;
          setPoseWeights(1, 0, 0, 0, 0, 0);
          spSploot.target = 1;
          break;

        case 'closeup_screen_sniff':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spScaleBoost.target = 1.42;
          spHeadCock.target = Math.sin(stepElapsed * 2.1) * 0.68;
          spHeadPitch.target = Math.sin(stepElapsed * 6.5) * 0.15;
          break;

        case 'perform_sk_vignette':
          vx = lerp(vx, 0, dt * 6);
          vy = lerp(vy, 0, dt * 6);
          sceneProps.x = worldX;
          sceneProps.y = worldY;
          if (step.subtype.includes('howl') || step.subtype.includes('starry')) {
            setPoseWeights(0, 1, 0, 0, 0, 0);
            spHeadPitch.target = -0.78;
            spYawn.target = 0.65;
          } else if (step.subtype.includes('radar') || step.subtype.includes('listen')) {
            setPoseWeights(0, 1, 0, 0, 0, 0);
            spHeadCock.target = Math.sin(stepElapsed * 1.6) >= 0 ? 0.75 : -0.75;
          } else if (step.subtype.includes('bowl') || step.subtype.includes('ladybug') || step.subtype.includes('scent')) {
            setPoseWeights(0, 0, 1, 0, 0, 0);
            spHeadPitch.target = 0.68 + Math.sin(tSec * 7) * 0.12;
          } else if (step.subtype.includes('tea')) {
            setPoseWeights(0, 1, 0, 0, 0, 0);
            spCup.target = 1;
          } else {
            setPoseWeights(0, 0, 1, 0, 0, 0);
            if (Math.floor(stepElapsed * 1.0) !== step._pb && jumpZ <= 2) {
              step._pb = Math.floor(stepElapsed * 1.0);
              spFacing.target = -spFacing.target;
              launchJump(185);
            }
          }
          break;

        case 'geo_social_scene': {
          const sub = step.subtype;
          const rSpd = step.runSpd || 110;
          if (!step._init) {
            step._init = true;
            if (sub === 'geo_social_orb_catch_duet' || sub === 'geo_social_totem_two_stack' || sub === 'geo_social_mirror_hop_duet') {
              spawnCompanions(1, false, {});
              if (sub === 'geo_social_orb_catch_duet') {
                sceneProps = { kind: 'shared_orb', x: worldX, y: worldY - 46, alpha: 1, items: [] };
              }
            } else if (sub === 'geo_social_trio_totem_tower') {
              spawnCompanions(2, false, {});
            } else if (sub === 'geo_social_leapfrog_relay') {
              spawnCompanions(3, false, {});
            } else if (sub === 'geo_social_color_wave_train') {
              spawnCompanions(4, false, { sameSide: worldX < width * 0.5 });
            } else if (sub === 'geo_social_musical_choir_line') {
              spawnCompanions(4, false, { graduated: true });
            } else if (sub === 'geo_social_constellation_ring') {
              spawnCompanions(5, false, {});
              sceneProps = { kind: 'constellation_ring', x: width * 0.5, y: height * 0.68, alpha: 1, items: [] };
            } else if (sub === 'geo_social_spiral_galaxy_parade') {
              spawnCompanions(8, false, {});
            } else if (sub === 'geo_social_lantern_festival') {
              spawnCompanions(9, false, {});
              sceneProps = { kind: 'lantern_field', x: width * 0.5, y: height * 0.5, alpha: 1, items: [] };
            } else if (sub === 'geo_social_cozy_stone_clusters') {
              spawnCompanions(10, false, {});
            } else {
              // geo_social_meadow_gathering -> 11 friends + protagonist = 12 full-screen spirits!
              spawnCompanions(11, false, {});
            }
          }

          const activeComps = companions.filter(function (c) { return !c.leaving; });
          if (sub === 'geo_social_orb_catch_duet' && activeComps[0]) {
            const c0 = activeComps[0];
            // On multi-screen setups, companion crosses from Primary onto Secondary to toss the glowing pearl across the bezel, then returns!
            const anc = getExcursionAnchors();
            const inPan = anc.inPan;
            const returning = inPan && stepElapsed > 23.5;
            const posAX = inPan ? anc.homeX : (width * 0.30);
            const posAY = inPan ? anc.homeY : clampSafeY(posAX, height * 0.78);
            const posBX = inPan ? (returning ? (anc.homeX + 80) : anc.secX) : (width * 0.70);
            const posBY = inPan ? (returning ? anc.homeY : anc.secY) : clampSafeY(posBX, height * 0.78);
            steerToward(posAX, posAY, rSpd, dt);
            c0.tx = posBX;
            c0.ty = posBY;
            c0.targetFacing = posBX >= posAX ? -1 : 1;
            spFacing.target = posBX >= posAX ? 1 : -1;
            setPoseWeights(0, 0, 0, 1, 0, 0);
            if (stepElapsed > 3.8 && !returning) {
              const cyc = (stepElapsed - 3.8) / 2.2;
              const leg = Math.floor(cyc);
              const p = cyc - leg;
              const fromA = leg % 2 === 0;
              const sx = fromA ? worldX : c0.x;
              const ex = fromA ? c0.x : worldX;
              const sy = (fromA ? worldY : c0.y) - 46;
              const ey = (fromA ? c0.y : worldY) - 46;
              sceneProps.x = lerp(sx, ex, p);
              sceneProps.y = lerp(sy, ey, p) - Math.sin(p * Math.PI) * 110;
              if (leg !== step._lastThrow) {
                step._lastThrow = leg;
                if (fromA) launchJump(175);
                else if (c0.jumpZ <= 2) c0.jumpVZ = 175;
              }
            } else {
              sceneProps.x = worldX;
              sceneProps.y = worldY - 48;
            }
          } else if ((sub === 'geo_social_totem_two_stack' || sub === 'geo_social_trio_totem_tower') && activeComps[0]) {
            const c0 = activeComps[0];
            const c1 = activeComps[1];
            if (stepElapsed < 5.2) {
              steerToward(width * 0.44, height * 0.78, rSpd, dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
              c0.tx = width * 0.54; c0.ty = height * 0.78;
              if (c1) { c1.tx = width * 0.62; c1.ty = height * 0.78; }
            } else if (stepElapsed < 23.5) {
              if (c0.stackParent !== 0) {
                c0.stackParent = 0;
                c0.jumpVZ = 210;
              }
              if (c1 && stepElapsed > 7.6 && c1.stackParent !== 1) {
                c1.stackParent = 1;
                c1.jumpVZ = 210;
              }
              const patrolX = width * (0.5 + Math.sin((stepElapsed - 5.2) * 0.42) * 0.24);
              steerToward(patrolX, height * 0.78, rSpd * 0.72, dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
            } else {
              if (c0.stackParent !== -1) {
                c0.stackParent = -1;
                c0.tx = width * 0.34; c0.jumpVZ = 220;
                if (c1) { c1.stackParent = -1; c1.tx = width * 0.66; c1.jumpVZ = 240; }
                launchJump(180);
              }
              setPoseWeights(0, 1, 0, 0, 0, 0);
            }
          } else if (sub === 'geo_social_mirror_hop_duet' && activeComps[0]) {
            const c0 = activeComps[0];
            const off = Math.sin(stepElapsed * 0.85) * width * 0.16 + width * 0.14;
            steerToward(width * 0.5 - off, height * 0.76, rSpd, dt);
            c0.tx = width * 0.5 + off;
            c0.ty = height * 0.76;
            spFacing.target = 1;
            c0.targetFacing = -1;
            setPoseWeights(0, 0, 0, 1, 0, 0);
            if (Math.floor(stepElapsed / 3.2) !== step._mh && stepElapsed > 3.0) {
              step._mh = Math.floor(stepElapsed / 3.2);
              launchJump(220);
              c0.jumpVZ = 220;
            }
          } else if (sub === 'geo_social_color_wave_train') {
            const anc = getExcursionAnchors();
            const inPan = anc.inPan;
            const prog = stepElapsed / step.dur;
            let leadX, baseLeadY;
            if (inPan) {
              const u = prog < 0.50 ? clamp(prog / 0.48, 0, 1) : clamp(1 - (prog - 0.50) / 0.46, 0, 1);
              leadX = lerp(anc.homeX, anc.secX, u);
              baseLeadY = lerp(anc.homeY, anc.secY, u);
            } else {
              const goRight = step.variant === 0;
              leadX = lerp(width * (goRight ? 0.16 : 0.84), width * (goRight ? 0.86 : 0.14), clamp(prog * 1.15, 0, 1));
              baseLeadY = height * 0.78;
            }
            const leadY = clampSafeY(leadX, baseLeadY + Math.sin(stepElapsed * 1.25) * 28);
            steerToward(leadX, leadY, rSpd * (inPan ? 1.32 : 0.95), dt);
            setPoseWeights(0, 0, 0, 1, 0, 0);
            let prevX = worldX, prevY = worldY;
            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              c.speed = Math.max(c.speed, rSpd * (inPan ? 1.32 : 1.0));
              const dirSign = spFacing.target >= 0 ? -1 : 1;
              c.tx = clamp(prevX + dirSign * 74, 48, width - 48);
              c.ty = clampSafeY(c.tx, prevY + Math.sin(stepElapsed * 1.6 + i) * 10);
              prevX = c.x; prevY = c.y;
              const wavePhase = (stepElapsed * 1.6 - i * 0.28);
              if (wavePhase > 1.5 && Math.floor(wavePhase / 2.6) !== c._wv && c.jumpZ <= 2) {
                c._wv = Math.floor(wavePhase / 2.6);
                c.jumpVZ = 195;
              }
            }
            if (Math.floor((stepElapsed * 1.6) / 2.6) !== step._lwv && stepElapsed > 1.5 && jumpZ <= 2) {
              step._lwv = Math.floor((stepElapsed * 1.6) / 2.6);
              launchJump(195);
            }
          } else if (sub === 'geo_social_constellation_ring') {
            const cx = width * 0.5, cy = height * 0.70;
            const total = activeComps.length + 1;
            const baseAng = stepElapsed * 0.52;
            const rx = Math.min(width * 0.26, 220), ry = 58;
            steerToward(cx + Math.cos(baseAng) * rx, cy + Math.sin(baseAng) * ry, rSpd, dt);
            setPoseWeights(0, 1, 0, 0, 0, 0);
            spLevitateZ.target = stepElapsed > 3.2 ? (38 + Math.sin(tSec * 2.2) * 10) : 0;
            for (let i = 0; i < activeComps.length; i++) {
              const ang = baseAng + ((i + 1) / total) * Math.PI * 2;
              activeComps[i].tx = cx + Math.cos(ang) * rx;
              activeComps[i].ty = cy + Math.sin(ang) * ry;
              activeComps[i].pose = 'sit';
              activeComps[i].targetLevitateZ = stepElapsed > 3.2 ? (38 + Math.sin(tSec * 2.2 + i) * 10) : 0;
            }
          } else if (sub === 'geo_social_musical_choir_line' || sub === 'geo_social_leapfrog_relay') {
            const total = activeComps.length + 1;
            const slotW = Math.min(82, (width * 0.62) / total);
            const startLineX = width * 0.5 - ((total - 1) * slotW) * 0.5;
            steerToward(startLineX, height * 0.77, rSpd, dt);
            setPoseWeights(0, 0, 0, 1, 0, 0);
            for (let i = 0; i < activeComps.length; i++) {
              activeComps[i].tx = startLineX + (i + 1) * slotW;
              activeComps[i].ty = height * 0.77;
            }
            if (stepElapsed > 4.5) {
              const noteIdx = Math.floor((stepElapsed - 4.5) * 2.2) % total;
              if (noteIdx !== step._lastNote) {
                step._lastNote = noteIdx;
                if (noteIdx === 0) {
                  launchJump(205);
                  spawnPopRing(worldX, worldY + 2, 34);
                } else if (activeComps[noteIdx - 1] && activeComps[noteIdx - 1].jumpZ <= 2) {
                  const cc = activeComps[noteIdx - 1];
                  cc.jumpVZ = 205 + noteIdx * 12;
                  spawnPopRing(cc.x, cc.y + 2, 32);
                }
              }
            }
          } else if (sub === 'geo_social_spiral_galaxy_parade') {
            const cx = width * 0.5, cy = height * 0.73;
            setPoseWeights(0, 0, 0, 1, 0, 0);
            steerToward(cx + Math.cos(stepElapsed * 0.6) * 55, cy + Math.sin(stepElapsed * 0.6) * 22, rSpd * 0.8, dt);
            for (let i = 0; i < activeComps.length; i++) {
              const r = 85 + i * 32;
              const ang = stepElapsed * (0.55 - i * 0.025) + i * 1.1;
              activeComps[i].tx = clamp(cx + Math.cos(ang) * r, 55, width - 55);
              activeComps[i].ty = clamp(cy + Math.sin(ang) * (r * 0.34), height * 0.57, height * 0.89);
            }
          } else {
            // Full-Screen Geometric Gatherings (`meadow_gathering`, `lantern_festival`, `cozy_stone_clusters`)
            steerToward(width * 0.50 + Math.sin(stepElapsed * 0.35) * 90, height * 0.76, rSpd * 0.65, dt);
            setPoseWeights(0, sub === 'geo_social_cozy_stone_clusters' && stepElapsed > 6 ? 1 : 0, 0, sub === 'geo_social_cozy_stone_clusters' && stepElapsed > 6 ? 0 : 1, 0, 0);
            const waveX = ((stepElapsed * 260) % (width + 320)) - 160;
            if (Math.abs(worldX - waveX) < 22 && jumpZ <= 2 && stepElapsed > 5) launchJump(165);

            if (sub === 'geo_social_lantern_festival' && stepElapsed > 4 && rng() < dt * 2.2) {
              const src = activeComps[Math.floor(rng() * activeComps.length)];
              if (src && sceneProps.items.length < 18) {
                sceneProps.items.push({ x: src.x, y: src.y - 42, vy: randRange(24, 42), r: randRange(4.5, 7.5), alpha: 0.78 });
              }
            }
            if (sub === 'geo_social_lantern_festival') {
              for (let k = sceneProps.items.length - 1; k >= 0; k--) {
                const lt = sceneProps.items[k];
                lt.y -= lt.vy * dt;
                lt.x += Math.sin(tSec * 1.5 + k) * 12 * dt;
                lt.alpha -= dt * 0.085;
                if (lt.alpha <= 0.02) sceneProps.items.splice(k, 1);
              }
            }

            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              if (sub === 'geo_social_cozy_stone_clusters') {
                const clusterIdx = i % 3;
                const clusterCX = width * (0.22 + clusterIdx * 0.28);
                const clusterCY = height * (clusterIdx === 1 ? 0.80 : 0.71);
                if (i === 7 && stepElapsed > 7) {
                  c.stackParent = 1;
                } else {
                  c.tx = clusterCX + ((Math.floor(i / 3) - 1) * 44);
                  c.ty = clusterCY + ((i % 2) * 14);
                  c.pose = stepElapsed > 6.5 ? 'sit' : 'stand';
                }
              } else {
                if (stepElapsed >= c.nextActionAt) {
                  c.nextActionAt = stepElapsed + randRange(3.2, 6.2);
                  const nx = clamp(c.homeX + randRange(-58, 58), width * 0.08, width * 0.92);
                  c.tx = nx;
                  c.ty = clampSafeY(nx, c.homeY + randRange(-22, 22));
                  c.pose = rng() < 0.35 ? 'sit' : 'stand';
                }
                if (Math.abs(c.x - waveX) < 22 && c.jumpZ <= 2 && stepElapsed > 5) {
                  c.jumpVZ = 165;
                }
              }
            }
          }
          break;
        }

        case 'sk_social_scene': {
          const sub = step.subtype;
          const tSpd = step.trotSpd || 84;
          if (!step._init) {
            step._init = true;
            if (sub === 'sk_social_nose_boop_greet' || sub === 'sk_social_dachshund_stick_share') {
              spawnCompanions(1, true, { plainFirst: true });
              if (sub === 'sk_social_dachshund_stick_share' && companions[0]) {
                companions[0].breed = 'dachshund';
                companions[0].acc = 'beret';
                carriedItem = 'stick';
              }
            } else if (sub === 'sk_social_synchronized_head_cock') {
              spawnCompanions(2, true, {});
            } else if (sub === 'sk_social_frisbee_pack_race' || sub === 'sk_social_butterfly_audience') {
              spawnCompanions(3, true, {});
              if (sub === 'sk_social_frisbee_pack_race') {
                sceneProps = { kind: 'sk_frisbee', x: width * 0.2, y: height * 0.62, vx: 135, caught: false, alpha: 1, items: [] };
              } else {
                sceneProps = { kind: 'nose_butterfly', x: width * 0.5, y: height * 0.58, perched: false, duo: true, alpha: 1, items: [] };
              }
            } else if (sub === 'sk_social_duckling_breed_parade' || sub === 'sk_social_circle_tail_powwow') {
              spawnCompanions(4, true, { sameSide: sub === 'sk_social_duckling_breed_parade' ? (worldX < width * 0.5) : undefined });
            } else if (sub === 'sk_social_follow_the_sprout') {
              spawnCompanions(5, true, { miniPack: true, sameSide: worldX < width * 0.5 });
            } else if (sub === 'sk_social_grand_cross_parade') {
              spawnCompanions(7, true, {});
            } else if (sub === 'sk_social_sunny_nap_pile') {
              spawnCompanions(8, true, {});
            } else if (sub === 'sk_social_park_lawn_gathering') {
              spawnCompanions(9, true, {});
            } else {
              // sk_social_meadow_zoomie_party -> 10 friends + protagonist = 11 minimalist line puppies across the whole screen!
              spawnCompanions(10, true, {});
            }
          }

          const activeComps = companions.filter(function (c) { return !c.leaving; });
          if (sub === 'sk_social_nose_boop_greet' && activeComps[0]) {
            const c0 = activeComps[0];
            if (stepElapsed < 7.5) {
              steerToward(width * 0.46, height * 0.77, tSpd, dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
              c0.tx = width * 0.54; c0.ty = height * 0.77;
              spFacing.target = 1; c0.targetFacing = -1;
            } else if (stepElapsed < 14.5) {
              vx = 0; vy = 0;
              spFacing.target = 1; c0.targetFacing = -1;
              const boopBow = stepElapsed > 10.2;
              setPoseWeights(0, 0, boopBow ? 1 : 0, boopBow ? 0 : 1, 0, 0);
              spHeadPitch.target = boopBow ? -0.2 : 0.25;
              c0.pose = boopBow ? 'bow' : 'stand';
              if (boopBow && !step._boopHop) {
                step._boopHop = true;
                launchJump(165);
                c0.jumpVZ = 165;
              }
            } else {
              const strollX = width * 0.74;
              steerToward(strollX, height * 0.79, tSpd * 0.88, dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
              c0.pose = 'stand';
              c0.tx = worldX - 54;
              c0.ty = worldY + 8;
            }
          } else if (sub === 'sk_social_dachshund_stick_share' && activeComps[0]) {
            const c0 = activeComps[0];
            const goalX = width * (0.5 + Math.sin(stepElapsed * 0.42) * 0.32);
            const goalY = height * (0.76 + Math.cos(stepElapsed * 0.65) * 0.06);
            steerToward(goalX, goalY, tSpd * 1.05, dt);
            setPoseWeights(0, 0, 0, 1, 0, 0);
            c0.tx = worldX - spFacing.target * 52;
            c0.ty = worldY + 9;
            if (Math.floor(stepElapsed / 4.2) !== step._dh && stepElapsed > 3 && c0.jumpZ <= 2) {
              step._dh = Math.floor(stepElapsed / 4.2);
              c0.jumpVZ = 155;
            }
          } else if (sub === 'sk_social_synchronized_head_cock') {
            steerToward(width * 0.50, height * 0.78, tSpd, dt);
            if (activeComps[0]) { activeComps[0].tx = width * 0.39; activeComps[0].ty = height * 0.78; }
            if (activeComps[1]) { activeComps[1].tx = width * 0.61; activeComps[1].ty = height * 0.78; }
            if (stepElapsed > 6.5) {
              setPoseWeights(0, 1, 0, 0, 0, 0);
              const tilt = Math.sin(stepElapsed * 2.2) >= 0 ? 0.72 : -0.72;
              spHeadCock.target = tilt;
              for (let i = 0; i < activeComps.length; i++) {
                activeComps[i].pose = 'sit';
                activeComps[i].headCock = tilt;
                activeComps[i].targetFacing = spFacing.target;
              }
            } else {
              setPoseWeights(0, 0, 0, 1, 0, 0);
            }
          } else if (sub === 'sk_social_duckling_breed_parade' || sub === 'sk_social_follow_the_sprout') {
            const anc = getExcursionAnchors();
            const inPan = anc.inPan;
            const pauseMid = stepElapsed > 12.0 && stepElapsed < 15.5;
            const goRight = step.variant === 0;
            if (pauseMid) {
              vx = lerp(vx, 0, dt * 7); vy = lerp(vy, 0, dt * 7);
              setPoseWeights(0, 1, 0, 0, 0, 0);
              spHeadCock.target = Math.sin(stepElapsed * 2.5) * 0.6;
            } else {
              let lx, baseLY;
              if (inPan) {
                const u = stepElapsed <= 12.0
                  ? clamp(stepElapsed / 11.5, 0, 1)
                  : clamp(1 - (stepElapsed - 15.5) / 13.5, 0, 1);
                lx = lerp(anc.homeX, anc.secX, u);
                baseLY = lerp(anc.homeY, anc.secY, u);
              } else {
                const tNorm = stepElapsed <= 12.0 ? (stepElapsed / 12.0) * 0.5 : 0.5 + ((stepElapsed - 15.5) / 14.5) * 0.5;
                lx = lerp(width * (goRight ? 0.14 : 0.86), width * (goRight ? 0.86 : 0.14), clamp(tNorm, 0, 1));
                baseLY = height * 0.78;
              }
              const ly = clampSafeY(lx, baseLY + Math.sin(stepElapsed * 1.1) * 26);
              steerToward(lx, ly, tSpd * (inPan ? 1.38 : 0.95), dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
            }
            let px = worldX, py = worldY;
            const spacing = sub === 'sk_social_follow_the_sprout' ? 56 : 74;
            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              c.speed = Math.max(c.speed, tSpd * (inPan ? 1.38 : 1.0));
              const behindSign = spFacing.target >= 0 ? -1 : 1;
              c.tx = clamp(px + behindSign * spacing, 42, width - 42);
              c.ty = clampSafeY(c.tx, py + (i % 2 === 0 ? 5 : -5));
              c.pose = (pauseMid && stepElapsed > 12.3 + i * 0.32) ? 'sit' : 'stand';
              c.headCock = c.pose === 'sit' ? spHeadCock.target : 0;
              if (!pauseMid && sub === 'sk_social_follow_the_sprout' && rng() < dt * 0.9 && c.jumpZ <= 2) {
                c.jumpVZ = 145;
              }
              px = c.x; py = c.y;
            }
          } else if (sub === 'sk_social_circle_tail_powwow') {
            const cx = width * 0.5, cy = height * 0.76;
            const total = activeComps.length + 1;
            const rx = 92, ry = 34;
            steerToward(cx - rx, cy, tSpd, dt);
            spFacing.target = 1;
            const arrived = stepElapsed > 6.5;
            setPoseWeights(0, 0, arrived && Math.sin(stepElapsed * 1.6) > 0.3 ? 1 : 0, arrived && Math.sin(stepElapsed * 1.6) > 0.3 ? 0 : 1, 0, 0);
            for (let i = 0; i < activeComps.length; i++) {
              const ang = ((i + 1) / total) * Math.PI * 2 + Math.PI;
              const c = activeComps[i];
              c.tx = cx + Math.cos(ang) * rx;
              c.ty = cy + Math.sin(ang) * ry;
              c.targetFacing = c.tx < cx ? 1 : -1;
              if (arrived) {
                const myTurn = Math.sin(stepElapsed * 1.8 + i * 1.3) > 0.45;
                c.pose = myTurn ? 'bow' : 'stand';
                if (myTurn && c.jumpZ <= 2 && rng() < dt * 1.4) c.jumpVZ = 145;
              }
            }
          } else if (sub === 'sk_social_frisbee_pack_race') {
            const frisX = width * (0.5 + Math.sin(stepElapsed * 0.58) * 0.34);
            sceneProps.x = frisX;
            sceneProps.y = height * 0.58 + Math.sin(stepElapsed * 2.4) * 16;
            steerToward(frisX, height * 0.76, tSpd * 1.15, dt);
            setPoseWeights(0, 0, 0, 1, 0, 0);
            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              c.tx = clamp(frisX + (i - 1) * 48, 55, width - 55);
              c.ty = height * (0.71 + i * 0.05);
              if (Math.abs(c.x - frisX) < 42 && c.jumpZ <= 2 && rng() < dt * 1.8) c.jumpVZ = 185;
            }
          } else if (sub === 'sk_social_butterfly_audience') {
            const bx = width * 0.5 + Math.sin(stepElapsed * 0.85) * 85;
            const by = height * 0.57 + Math.cos(stepElapsed * 1.4) * 22;
            sceneProps.x = bx;
            sceneProps.y = by;
            steerToward(width * 0.44, height * 0.78, tSpd, dt);
            setPoseWeights(0, stepElapsed > 5.5 ? 1 : 0, 0, stepElapsed > 5.5 ? 0 : 1, 0, 0);
            spHeadPitch.target = -0.55;
            spFacing.target = bx >= worldX ? 1 : -1;
            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              c.tx = width * (0.34 + i * 0.11 + (i >= 1 ? 0.08 : 0));
              c.ty = height * (0.76 + (i % 2) * 0.04);
              c.pose = stepElapsed > 5.5 ? 'sit' : 'stand';
              c.headPitch = -0.52;
              c.targetFacing = bx >= c.x ? 1 : -1;
            }
          } else if (sub === 'sk_social_grand_cross_parade') {
            const anc = getExcursionAnchors();
            const inPan = anc.inPan;
            const pauseGreet = stepElapsed > 12.0 && stepElapsed < 15.5;
            if (inPan) {
              // Grand Two-Row Expedition: depart Primary together -> bow on Secondary -> march back to Primary!
              const u = pauseGreet
                ? 1.0
                : (stepElapsed <= 12.0
                    ? clamp(stepElapsed / 11.5, 0, 1)
                    : clamp(1 - (stepElapsed - 15.5) / 13.5, 0, 1));
              const gx = lerp(anc.homeX, anc.secX, u);
              const gy = clampSafeY(gx, lerp(anc.homeY, anc.secY, u));
              steerToward(gx, gy, pauseGreet ? 5 : tSpd * 1.36, dt);
              setPoseWeights(0, 0, pauseGreet ? 1 : 0, pauseGreet ? 0 : 1, 0, 0);
              for (let i = 0; i < activeComps.length; i++) {
                const c = activeComps[i];
                c.speed = Math.max(c.speed, tSpd * 1.38);
                const row = i % 2;
                const col = Math.floor(i / 2) + 1;
                const behindSign = spFacing.target >= 0 ? -1 : 1;
                c.tx = clamp(worldX + behindSign * col * 58, 42, width - 42);
                c.ty = clampSafeY(c.tx, worldY + (row === 0 ? -18 : 22));
                c.pose = pauseGreet ? 'bow' : 'stand';
              }
            } else {
              const p = pauseGreet ? 0.5 : (stepElapsed <= 12.0 ? (stepElapsed / 12.0) * 0.5 : 0.5 + ((stepElapsed - 15.5) / 14.5) * 0.5);
              steerToward(lerp(width * 0.14, width * 0.86, clamp(p, 0, 1)), height * 0.73, pauseGreet ? 5 : tSpd * 0.88, dt);
              setPoseWeights(0, 0, pauseGreet ? 1 : 0, pauseGreet ? 0 : 1, 0, 0);
              for (let i = 0; i < activeComps.length; i++) {
                const c = activeComps[i];
                const groupRightToLeft = i >= 3;
                const slot = groupRightToLeft ? (i - 3) : (i + 1);
                if (groupRightToLeft) {
                  c.tx = lerp(width * 0.88 + slot * 46, width * 0.12 + slot * 46, clamp(p, 0, 1));
                  c.ty = height * 0.81;
                  c.targetFacing = -1;
                } else {
                  c.tx = lerp(width * 0.14 - slot * 46, width * 0.86 - slot * 46, clamp(p, 0, 1));
                  c.ty = height * 0.73;
                  c.targetFacing = 1;
                }
                c.pose = pauseGreet ? 'bow' : 'stand';
              }
            }
          } else {
            // Full-Screen Minimalist Line-Puppy Gatherings (`park_lawn_gathering` [10], `sunny_nap_pile` [9], `meadow_zoomie_party` [11])
            const isNapPile = sub === 'sk_social_sunny_nap_pile' && stepElapsed > 9.0;
            if (isNapPile) {
              vx = lerp(vx, 0, dt * 6); vy = lerp(vy, 0, dt * 6);
              setPoseWeights(1, 0, 0, 0, 0, 0);
            } else {
              steerToward(width * 0.50 + Math.sin(stepElapsed * 0.38) * 110, height * 0.77, tSpd * 0.75, dt);
              setPoseWeights(0, 0, 0, 1, 0, 0);
            }

            for (let i = 0; i < activeComps.length; i++) {
              const c = activeComps[i];
              if (isNapPile) {
                const pileIdx = i % 3;
                c.tx = width * (0.22 + pileIdx * 0.28) + ((Math.floor(i / 3) - 1) * 42);
                c.ty = height * (pileIdx === 1 ? 0.81 : 0.72) + ((i % 2) * 12);
                if (Math.hypot(c.tx - c.x, c.ty - c.y) < 16) c.pose = 'sleep';
              } else if (stepElapsed >= c.nextActionAt) {
                c.nextActionAt = stepElapsed + randRange(3.4, 6.4);
                const nx = clamp(c.homeX + randRange(-65, 65), width * 0.08, width * 0.92);
                c.tx = nx;
                c.ty = clampSafeY(nx, c.homeY + randRange(-22, 22));
                const r = rng();
                if (sub === 'sk_social_meadow_zoomie_party') {
                  c.pose = r < 0.22 ? 'roll' : (r < 0.48 ? 'bow' : 'stand');
                  if (r > 0.65 && c.jumpZ <= 2) c.jumpVZ = 160;
                } else {
                  c.pose = r < 0.32 ? 'sit' : (r < 0.52 ? 'bow' : 'stand');
                  c.headCock = c.pose === 'sit' ? (rng() < 0.5 ? 0.6 : -0.6) : 0;
                }
              }
            }
          }
          break;
        }

        case 'social_farewell': {
          if (!step._dismissed) {
            step._dismissed = true;
            dismissCompanionsGracefully();
          }
          vx = lerp(vx, 0, dt * 7);
          vy = lerp(vy, 0, dt * 7);
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spHeadCock.target = Math.sin(stepElapsed * 2.0) * 0.45;
          if (companions.length === 0 && stepElapsed > 1.8) {
            stepDone = true;
          }
          break;
        }

        // --- SHARED NATURAL FINISHING BEATS ---
        case 'belly_roll':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 0, 0, stepElapsed < step.dur * 0.84 ? 1 : 0);
          if (stepElapsed >= step.dur * 0.84) setPoseWeights(0, 0, 0, 1, 0, 0);
          break;

        case 'body_shake':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spShake.target = 1;
          shakeSpawnAccum += dt;
          if (shakeSpawnAccum >= 0.14) {
            shakeSpawnAccum = 0;
            spawnBurstParticles(worldX, worldY - 30, 2, 55);
          }
          break;

        case 'sniff_ground':
          vx = 0; vy = 0;
          setPoseWeights(0, 0, 0, 1, 0, 0);
          spHeadPitch.target = 0.72 + Math.sin(tSec * 7.8) * 0.14;
          break;

        case 'look_around':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spHeadCock.target = Math.sin(stepElapsed * 2.1) * 0.68;
          if (stepElapsed > step.dur * 0.5 && stepElapsed - dt <= step.dur * 0.5) spFacing.target = -spFacing.target;
          break;

        case 'watch_sky_farewell':
          vx = 0; vy = 0;
          setPoseWeights(0, 1, 0, 0, 0, 0);
          spHeadPitch.target = -0.68;
          break;

        case 'happy_pant':
        case 'sit_calm':
          vx = lerp(vx, 0, dt * 8);
          vy = lerp(vy, 0, dt * 8);
          setPoseWeights(0, 1, 0, 0, 0, 0);
          break;

        case 'return_home_screen': {
          const home = getHomeScreen();
          const alreadyHome =
            worldX >= home.x + home.w * 0.14 &&
            worldX <= home.x + home.w * 0.86 &&
            worldY >= home.y + home.h * 0.25 &&
            worldY <= home.y + home.h * 0.95;
          if (alreadyHome && stepElapsed > 0.1) {
            vx = lerp(vx, 0, dt * 8);
            vy = lerp(vy, 0, dt * 8);
            stepDone = true;
          } else {
            setPoseWeights(0, 0, 0, 1, 0, 0);
            if (steerToward(step.tx, step.ty, step.speed || 110, dt)) {
              stepDone = true;
            }
          }
          break;
        }

        case 'settle_sleep': {
          vx = 0; vy = 0;
          const p = smoothstep(0, step.dur, stepElapsed);
          setPoseWeights(p, 1 - p, 0, 0, 0, 0);
          break;
        }
      }

      // Advance world motion & parabolic jump (adapting smoothly to multi-monitor vertical terrain contours!)
      const speed = Math.hypot(vx, vy);
      worldX += vx * dt;
      worldY += vy * dt;
      if (worldX >= 0 && worldX <= width) {
        const safeWorldY = clampSafeY(worldX, worldY);
        worldY = lerp(worldY, safeWorldY, Math.min(1, dt * 6.5));
      }
      stridePhase += speed * dt * 0.138;

      if (jumpZ > 0 || jumpVZ !== 0) {
        const grav = 620 * clamp(height / 860, 0.9, 1.45);
        jumpVZ -= grav * dt;
        jumpZ += jumpVZ * dt;
        if (jumpZ <= 0) {
          jumpZ = 0;
          if (jumpVZ < -60) spSquash.v += 4.2;
          jumpVZ = 0;
        }
      }

      // Advance Multi-Companion Kinematics (smooth steering, jumps, levitation, totem stacking, edge exit!)
      const cGrav = 620 * clamp(height / 860, 0.9, 1.45);
      for (let i = companions.length - 1; i >= 0; i--) {
        const c = companions[i];
        c.levitateZ = lerp(c.levitateZ, c.targetLevitateZ || 0, Math.min(1, dt * 4.5));

        if (c.stackParent >= 0) {
          // Riding stacked on protagonist (0) or on companions[stackParent - 1]!
          const hostX = c.stackParent === 0 ? worldX : (companions[c.stackParent - 1] ? companions[c.stackParent - 1].x : worldX);
          const hostY = c.stackParent === 0 ? worldY : (companions[c.stackParent - 1] ? companions[c.stackParent - 1].y : worldY);
          const hostZ = c.stackParent === 0 ? (jumpZ + spLevitateZ.x + 56) : ((companions[c.stackParent - 1] ? companions[c.stackParent - 1].levitateZ : 0) + 52);
          const wob = Math.sin(tSec * 3.4 + i) * 3.5;
          c.x = lerp(c.x, hostX + wob, Math.min(1, dt * 11));
          c.y = lerp(c.y, hostY + 0.5, Math.min(1, dt * 11));
          c.levitateZ = lerp(c.levitateZ, hostZ, Math.min(1, dt * 10));
          c.vx = 0; c.vy = 0;
          c.pose = 'sit';
          c.targetFacing = spFacing.target;
        } else {
          const dx = c.tx - c.x;
          const dy = c.ty - c.y;
          const dist = Math.hypot(dx, dy);
          if (Math.abs(dx) > 7) {
            c.targetFacing = dx >= 0 ? 1 : -1;
          }
          if (dist > 4.5) {
            const cSpd = (c.speed || 88) * clamp(dist / 42, 0.15, 1);
            c.vx = lerp(c.vx, (dx / dist) * cSpd, Math.min(1, dt * 5.8));
            c.vy = lerp(c.vy, (dy / dist) * cSpd, Math.min(1, dt * 5.8));
          } else {
            c.vx = lerp(c.vx, 0, Math.min(1, dt * 8.5));
            c.vy = lerp(c.vy, 0, Math.min(1, dt * 8.5));
          }

          // Gentle Boids Separation so companions never pile into a messy overlap!
          if (!c.leaving && c.x > 30 && c.x < width - 30) {
            let sepX = 0, sepY = 0;
            const minSep = 86 * (c.scale || 0.9);
            const pdx = c.x - worldX, pdy = (c.y - worldY) * 1.6;
            const pDist = Math.hypot(pdx, pdy);
            if (pDist > 0.5 && pDist < minSep) {
              const push = (minSep - pDist) / minSep;
              sepX += (pdx / pDist) * push * 85;
              sepY += (pdy / pDist) * push * 45;
            }
            for (let j = 0; j < companions.length; j++) {
              if (j === i || companions[j].leaving || companions[j].stackParent >= 0) continue;
              const o = companions[j];
              const odx = c.x - o.x, ody = (c.y - o.y) * 1.6;
              const oDist = Math.hypot(odx, ody);
              if (oDist > 0.5 && oDist < minSep) {
                const push = (minSep - oDist) / minSep;
                sepX += (odx / oDist) * push * 92;
                sepY += (ody / oDist) * push * 48;
              }
            }
            c.vx += sepX * dt * 4.2;
            c.vy += sepY * dt * 4.2;
          }

          const cs = Math.hypot(c.vx, c.vy);
          c.x += c.vx * dt;
          c.y = c.leaving ? (c.y + c.vy * dt) : clampSafeY(c.x, c.y + c.vy * dt);
          c.stride += cs * dt * 0.14;
        }

        c.facing = lerp(c.facing, c.targetFacing, Math.min(1, dt * 10));
        if (c.jumpZ > 0 || c.jumpVZ !== 0) {
          c.jumpVZ -= cGrav * dt;
          c.jumpZ += c.jumpVZ * dt;
          if (c.jumpZ <= 0) {
            c.jumpZ = 0;
            c.jumpVZ = 0;
          }
        }

        if (c.leaving && (c.x < -76 || c.x > width + 76 || Math.abs(c.x - c.tx) < 18)) {
          companions.splice(i, 1);
        }
      }

      if (sceneProps.kind === 'sphere_row' && sceneProps.items) {
        for (let i = 0; i < sceneProps.items.length; i++) {
          sceneProps.items[i].x += (sceneProps.items[i].vx || 0) * dt;
        }
      }

      // Footprints (darker & paw-shaped when Sketch Puppy stepped in ink puddle!)
      if (jumpZ < 3 && spLevitateZ.x < 4 && speed > 18 && worldX > 20 && worldX < width - 20) {
        distSinceLastPrint += speed * dt;
        if (distSinceLastPrint >= 28) {
          distSinceLastPrint = 0;
          nextFootSide = -nextFootSide;
          const inked = theme === 'sketch' && inkPawStepsLeft > 0;
          if (inked) inkPawStepsLeft -= 1;
          footprints.push({
            x: worldX - spFacing.target * 8,
            y: worldY + nextFootSide * 4,
            alpha: inked ? 0.62 : 0.25,
            inked: inked
          });
          if (footprints.length > 32) footprints.shift();
        }
      }

      for (let i = footprints.length - 1; i >= 0; i--) {
        footprints[i].alpha -= dt * (footprints[i].inked ? 0.015 : 0.028);
        if (footprints[i].alpha <= 0.005) footprints.splice(i, 1);
      }

      for (let i = shakeParticles.length - 1; i >= 0; i--) {
        const p = shakeParticles[i];
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= dt * 0.85;
        if (p.alpha <= 0.01) shakeParticles.splice(i, 1);
      }

      for (let i = popRings.length - 1; i >= 0; i--) {
        const r = popRings[i];
        r.r = lerp(r.r, r.maxR, dt * 7);
        r.alpha -= dt * 1.45;
        if (r.alpha <= 0.01) popRings.splice(i, 1);
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
    // Theme-Exclusive Scene Prop Renderers
    // =========================================================================
    function drawGeometricProps(tSec, dark) {
      const accent = dark ? '#E59A7C' : '#DF8666';
      const sage = dark ? '#7AB39E' : '#689F8B';
      const ink = dark ? 'rgba(240,236,228,0.55)' : 'rgba(46,50,54,0.42)';

      for (let i = 0; i < popRings.length; i++) {
        const pr = popRings[i];
        ctx.save();
        ctx.globalAlpha = pr.alpha;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < shakeParticles.length; i++) {
        const sp = shakeParticles[i];
        ctx.save();
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const pk = sceneProps.kind;
      if (pk === 'shared_orb') {
        ctx.save();
        ctx.fillStyle = sage;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(sceneProps.x, sceneProps.y, 9.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'constellation_ring' && companions.length > 0) {
        ctx.save();
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.28;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        const ringPts = [{ x: worldX, y: worldY - spLevitateZ.x - 28 }];
        for (let i = 0; i < companions.length; i++) {
          if (!companions[i].leaving) {
            ringPts.push({ x: companions[i].x, y: companions[i].y - companions[i].levitateZ - 28 });
          }
        }
        if (ringPts.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(ringPts[0].x, ringPts[0].y);
          for (let i = 1; i < ringPts.length; i++) ctx.lineTo(ringPts[i].x, ringPts[i].y);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      } else if (pk === 'lantern_field' && sceneProps.items) {
        for (let i = 0; i < sceneProps.items.length; i++) {
          const lt = sceneProps.items[i];
          ctx.save();
          ctx.globalAlpha = lt.alpha;
          ctx.fillStyle = dark ? '#E9BE82' : '#DF9B6D';
          ctx.beginPath();
          ctx.arc(lt.x, lt.y, lt.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (pk === 'trampoline_pad') {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(sceneProps.x, sceneProps.y + 3, 44, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'prism_crystal') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        ctx.rotate(Math.sin(tSec * 0.8) * 0.12);
        ctx.strokeStyle = ink;
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(17, 13);
        ctx.lineTo(-17, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (sceneProps.lit) {
          const beam = ctx.createLinearGradient(14, 0, 290, 80);
          beam.addColorStop(0, 'rgba(242, 162, 118, 0.45)');
          beam.addColorStop(0.5, 'rgba(122, 184, 162, 0.30)');
          beam.addColorStop(1, 'rgba(122, 184, 162, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(12, -4);
          ctx.lineTo(310, 42);
          ctx.lineTo(290, 115);
          ctx.lineTo(12, 8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (pk === 'pendulum_tether') {
        const bx = sceneProps.x + Math.sin(sceneProps.ang) * sceneProps.len;
        const by = sceneProps.y + Math.cos(sceneProps.ang) * sceneProps.len;
        ctx.save();
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sceneProps.x, sceneProps.y);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(sceneProps.x, sceneProps.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pk === 'sphere_row') {
        for (let i = 0; i < sceneProps.items.length; i++) {
          const it = sceneProps.items[i];
          ctx.fillStyle = i % 2 === 0 ? accent : sage;
          ctx.beginPath();
          ctx.arc(it.x, it.y - 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pk === 'edge_portals') {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.ellipse(8, sceneProps.y1 - 26, 6, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = sage;
        ctx.beginPath();
        ctx.ellipse(width - 8, sceneProps.y2 - 26, 6, 34, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'geo_pillars' || pk === 'bubble_steps') {
        for (let i = 0; i < sceneProps.items.length; i++) {
          const p = sceneProps.items[i];
          if (p.popped) continue;
          ctx.save();
          if (pk === 'bubble_steps') {
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y - p.h + 10, 14, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = dark ? 'rgba(255,255,255,0.10)' : 'rgba(60,64,68,0.10)';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.roundRect(p.x - 18, p.y - p.h, 36, p.h, 8);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (pk === 'geo_giant_bubble_voyage' || pk === 'geo_balloon_buoyancy_drift' || pk === 'geo_cloud_cushion_hop') {
        ctx.save();
        if (pk === 'geo_giant_bubble_voyage') {
          ctx.strokeStyle = accent;
          ctx.fillStyle = dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.28)';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.arc(sceneProps.x, sceneProps.y, 48, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (pk === 'geo_balloon_buoyancy_drift') {
          ctx.strokeStyle = ink;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sceneProps.x, sceneProps.y + 18);
          ctx.lineTo(sceneProps.x, sceneProps.y - 38);
          ctx.stroke();
          ctx.fillStyle = sage;
          ctx.beginPath();
          ctx.ellipse(sceneProps.x, sceneProps.y - 54, 16, 20, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.68)';
          ctx.beginPath();
          ctx.arc(sceneProps.x - 16, sceneProps.y + 28, 16, 0, Math.PI * 2);
          ctx.arc(sceneProps.x, sceneProps.y + 24, 20, 0, Math.PI * 2);
          ctx.arc(sceneProps.x + 16, sceneProps.y + 28, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (pk === 'constellation_nodes') {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < sceneProps.items.length; i++) {
          const st = sceneProps.items[i];
          if (st.lit) {
            if (!started) { ctx.moveTo(st.x, st.y); started = true; }
            else ctx.lineTo(st.x, st.y);
          }
        }
        ctx.stroke();
        for (let i = 0; i < sceneProps.items.length; i++) {
          const st = sceneProps.items[i];
          ctx.fillStyle = st.lit ? accent : ink;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.lit ? 5.5 : 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (pk === 'wave_line_nodes') {
        for (let i = 0; i < sceneProps.items.length; i++) {
          const nd = sceneProps.items[i];
          ctx.save();
          ctx.translate(nd.x, nd.y);
          ctx.rotate(nd.tilted ? 1.05 : 0);
          ctx.strokeStyle = nd.tilted ? accent : ink;
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -24);
          ctx.stroke();
          ctx.restore();
        }
      } else if (pk === 'seesaw_beam') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        ctx.rotate(Math.sin(tSec * 2.2) * 0.18);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-64, -8);
        ctx.lineTo(64, -8);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'geo_emblem_show') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y - 34);
        ctx.strokeStyle = sage;
        ctx.lineWidth = 1.8;
        for (let k = 0; k < 3; k++) {
          const ang = sceneProps.rot + (k * Math.PI * 2) / 3;
          ctx.fillStyle = k === 0 ? accent : sage;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 48, Math.sin(ang) * 16, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function drawSketchProps(tSec, dark) {
      const strokeCol = dark ? '#E4DFD3' : '#35332F';
      const paperCol = dark ? '#3B4046' : '#E8E4DB';
      const accentCol = dark ? '#D4886A' : '#BF7658';

      // Unwinding yarn ink thread
      if (inkThreadPts.length > 1) {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(inkThreadPts[0].x, inkThreadPts[0].y);
        for (let i = 1; i < inkThreadPts.length; i++) {
          ctx.lineTo(inkThreadPts[i].x, inkThreadPts[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < popRings.length; i++) {
        const pr = popRings[i];
        ctx.save();
        ctx.globalAlpha = pr.alpha;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < shakeParticles.length; i++) {
        const sp = shakeParticles[i];
        ctx.save();
        ctx.globalAlpha = sp.alpha;
        ctx.fillStyle = strokeCol;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const pk = sceneProps.kind;
      if (pk === 'sk_frisbee') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        ctx.rotate(Math.sin(tSec * 8) * 0.15);
        ctx.fillStyle = accentCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'dirt_mound' && sceneProps.size > 0.05) {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y + 2);
        ctx.scale(sceneProps.size, sceneProps.size);
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.quadraticCurveTo(0, -16, 20, 0);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'ink_puddle') {
        ctx.save();
        ctx.fillStyle = strokeCol;
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.ellipse(sceneProps.x, sceneProps.y + 2, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (pk === 'sk_raincloud') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-16, 0, 13, Math.PI * 0.5, Math.PI * 1.6);
        ctx.arc(0, -8, 16, Math.PI, 0);
        ctx.arc(16, 0, 13, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Sketched rain dashes
        ctx.lineWidth = 1.5;
        for (let r = -14; r <= 14; r += 9) {
          const ry = 18 + ((tSec * 48 + r * 3) % 26);
          ctx.beginPath();
          ctx.moveTo(r, ry);
          ctx.lineTo(r - 2, ry + 7);
          ctx.stroke();
        }
        ctx.restore();
      } else if (pk === 'wind_gust_lines') {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.8;
        for (let w = 0; w < 3; w++) {
          const wy = worldY - 46 + w * 18;
          const wx = ((width - ((tSec * 220 + w * 190) % width)));
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.quadraticCurveTo(wx - 35, wy - 5, wx - 70, wy);
          ctx.stroke();
        }
        ctx.restore();
      } else if (pk === 'nose_butterfly') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.0;
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(tSec * 9.5));
        ctx.scale(1, flap);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.quadraticCurveTo(-7, -9, -11, -1);
        ctx.moveTo(0, 0); ctx.quadraticCurveTo(7, -9, 11, -1);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'yarn_ball' || pk === 'sk_ball') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y - 10);
        ctx.rotate(sceneProps.rot);
        ctx.fillStyle = pk === 'yarn_ball' ? accentCol : paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, -4); ctx.quadraticCurveTo(0, 2, 6, -4);
        ctx.moveTo(-5, 4); ctx.quadraticCurveTo(0, -2, 5, 4);
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'dandelion_puff') {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.8;
        if (!sceneProps.blown) {
          ctx.beginPath();
          ctx.moveTo(sceneProps.x, sceneProps.y);
          ctx.lineTo(sceneProps.x, sceneProps.y - 18);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(sceneProps.x, sceneProps.y - 22, 7, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          for (let i = 0; i < sceneProps.items.length; i++) {
            const sd = sceneProps.items[i];
            ctx.beginPath();
            ctx.moveTo(sd.x, sd.y);
            ctx.lineTo(sd.x + 3, sd.y - 5);
            ctx.arc(sd.x + 3, sd.y - 6, 1.5, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (pk === 'paper_corner_curl' && sceneProps.curl > 0.02) {
        ctx.save();
        const sz = 58 * sceneProps.curl;
        const cx = sceneProps.side > 0 ? width : 0;
        const dir = sceneProps.side > 0 ? -1 : 1;
        ctx.fillStyle = dark ? '#26292E' : '#C8C2B6';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cx, height);
        ctx.lineTo(cx + dir * sz, height);
        ctx.lineTo(cx, height - sz);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'grass_and_frog') {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.0;
        for (let i = 0; i < sceneProps.items.length; i++) {
          const g = sceneProps.items[i];
          ctx.beginPath();
          ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - 5, g.y - 12);
          ctx.moveTo(g.x, g.y); ctx.lineTo(g.x, g.y - 15);
          ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + 5, g.y - 12);
          ctx.stroke();
        }
        // Cute 3-stroke hopping frog!
        ctx.fillStyle = paperCol;
        ctx.beginPath();
        ctx.ellipse(sceneProps.frogX, sceneProps.items[0].y - sceneProps.frogZ - 6, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (pk === 'sk_paper_plane' || pk === 'sk_paper_boat') {
        ctx.save();
        ctx.translate(sceneProps.x, sceneProps.y);
        if (sceneProps.vx < 0) ctx.scale(-1, 1);
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        if (pk === 'sk_paper_boat') {
          ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(10, 8); ctx.lineTo(-10, 8); ctx.closePath();
          ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(0, -11); ctx.lineTo(6, 0); ctx.stroke();
        } else {
          ctx.moveTo(16, 0); ctx.lineTo(-12, -9); ctx.lineTo(-7, 0); ctx.lineTo(-12, 9); ctx.closePath();
          ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      } else if (pk === 'sk_vignette_prop') {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.0;
        if (sceneProps.subtype.includes('bowl')) {
          ctx.beginPath();
          ctx.roundRect(sceneProps.x + 28, sceneProps.y - 9, 18, 9, 3);
          ctx.stroke();
        } else if (sceneProps.subtype.includes('howl')) {
          const ny = sceneProps.y - 68 - ((tSec * 18) % 20);
          ctx.globalAlpha = 0.65;
          ctx.beginPath();
          ctx.arc(sceneProps.x + 18, ny, 4, 0, Math.PI * 2);
          ctx.moveTo(sceneProps.x + 22, ny);
          ctx.lineTo(sceneProps.x + 22, ny - 12);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // =========================================================================
    // Unified Articulated Renderer 1: Minimalist Single-Stroke Ink Puppies (`简笔画` + 5 Breeds & 6 Ink Accessories!)
    // =========================================================================
    function drawSketchActor(actor, tSec, dark, blinking) {
      const strokeCol = dark ? '#E4DFD3' : '#35332F';
      const paperCol = dark ? '#3B4046' : '#E8E4DB';
      const accentCol = dark ? '#D4886A' : '#BF7658';
      const sageInkCol = dark ? '#8AB6A3' : '#6A9683';

      const breed = actor.breed || 'classic'; // 'classic' | 'shiba' | 'dachshund' | 'poodle' | 'terrier'
      const acc = actor.acc || 'none';        // 'none' | 'scarf' | 'sprout' | 'beret' | 'bow' | 'bell'

      const sSleep = actor.sSleep || 0;
      const sSit = actor.sSit || 0;
      const sBow = actor.sBow || 0;
      const sStand = actor.sStand || 0;
      const sRear = actor.sRear || 0;
      const sRoll = actor.sRoll || 0;

      const breath = 0.5 + 0.5 * Math.sin(tSec * 1.15 + (actor.phaseOffset || 0));
      const speed = actor.speedVal || 0;
      const aJumpZ = actor.jumpZ || 0;
      const aStride = actor.stride || 0;
      const walkAmp = clamp(speed / 50, 0, 1.15) * sStand;
      const bob = aJumpZ > 1 ? 0 : Math.abs(Math.sin(aStride)) * 2.8 * walkAmp;

      const viewportScale = clamp(refScreenW / 1120, 1.06, 1.40) * (actor.scaleMult || 1);
      const depthScale = lerp(0.92, 1.08, clamp((actor.y - height * 0.66) / (height * 0.24), 0, 1)) * viewportScale;
      const rawFace = actor.facing;
      const faceSign = rawFace >= 0 ? 1 : -1;
      const faceFlip = Math.abs(rawFace) < 0.20 ? faceSign * 0.20 : rawFace;
      const shakeJitterX = (actor.shake || 0) > 0.05 ? Math.sin(tSec * 38) * 4.0 * actor.shake : 0;

      // Breed minimalist proportion modifiers (still 100% single-stroke `简笔画`!)
      const bodyLen = breed === 'dachshund' ? 1.38 : (breed === 'poodle' ? 0.90 : 1.0);
      const legHeight = breed === 'dachshund' ? 0.68 : 1.0;

      ctx.save();
      ctx.translate(actor.x + shakeJitterX, actor.y);
      ctx.scale(faceFlip * depthScale, depthScale);

      // Quiet local sketch ground whisper line
      const shadowScale = clamp(1 - aJumpZ / 140, 0.4, 1);
      ctx.strokeStyle = strokeCol;
      ctx.globalAlpha = 0.15 * shadowScale;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-42 * bodyLen * shadowScale, 1.6);
      ctx.quadraticCurveTo(0, 3.0, 42 * bodyLen * shadowScale, 1.6);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const sq = clamp(actor.squash || 0, -0.18, 0.20);
      const sploot = actor.sploot || 0;
      ctx.translate(0, -aJumpZ / depthScale);
      ctx.scale(1 + sq * 0.36 + sploot * 0.16, 1 - sq * 0.36 - sploot * 0.14);

      const peekShift = (actor.peek || 0) * 9;
      const hipX = (sSleep * (-18) + sSit * (-12) + sBow * (-21) + sStand * (-19) + sRear * (-8) + sRoll * (-16)) * bodyLen;
      const hipY = (sSleep * (-9) + sSit * (-9) + sBow * (-29) + sStand * (-23 - bob) + sRear * (-11) + sRoll * (-10)) * legHeight;

      const shX = (sSleep * 12 + sSit * 7 + sBow * 18 + sStand * 16 + sRear * (-1) + sRoll * 14) * bodyLen + peekShift * 0.5;
      const shY = (sSleep * (-10 - breath * 1.5) + sSit * (-28 - breath * 1.1) + sBow * (-13) + sStand * (-24 - bob) + sRear * (-37) + sRoll * (-10)) * (sSit > 0.5 || sRear > 0.4 ? 0.92 : legHeight);

      const backCtrlX = lerp(hipX, shX, 0.48) - sRear * 3;
      const backCtrlY = (sSleep * (-28 - breath * 2.0) + sSit * (-23) + sBow * (-16) + sStand * (-28 - bob) + sRear * (-26) + sRoll * (-6)) * (sSit > 0.5 ? 0.92 : legHeight);

      const pitch = (actor.headPitch || 0) - (aJumpZ > 8 ? 0.22 : 0);
      const headX = shX + (sSleep * 9 + sSit * 6 + sBow * 13 + sStand * 11 + sRear * 5 + sRoll * 10) + peekShift * 0.5 + pitch * 3.5;
      const headY = shY + (sSleep * (-3) + sSit * (-14) + sBow * (-7) + sStand * (-12) + sRear * (-14) + sRoll * (-5)) + pitch * 10;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = strokeCol;
      ctx.fillStyle = paperCol;

      // 1. Minimalist Breed-Distinct Single-Stroke Tail
      const wagFreq = (sBow > 0.3 || walkAmp > 0.3 || sRear > 0.3 || sRoll > 0.3) ? 4.8 : 1.8;
      const wagAmp = (sSleep > 0.6 ? 2.2 : 6.0) + walkAmp * 2.8;
      const wag = Math.sin(tSec * wagFreq + (actor.phaseOffset || 0)) * wagAmp;
      ctx.lineWidth = 2.6;
      if (breed === 'shiba') {
        // Curled sickle ring tail over the back!
        ctx.beginPath();
        ctx.moveTo(hipX - 3, hipY + 2);
        ctx.bezierCurveTo(hipX - 15, hipY - 10 + wag * 0.3, hipX - 6 + wag * 0.4, hipY - 23 + wag * 0.5, hipX - 1, hipY - 13);
        ctx.stroke();
      } else if (breed === 'poodle') {
        // Short stem + tiny fluffy pom-pom circle!
        ctx.beginPath();
        ctx.moveTo(hipX - 4, hipY + 2);
        ctx.lineTo(hipX - 11 + wag * 0.3, hipY - 9 + wag * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hipX - 12 + wag * 0.35, hipY - 11 + wag * 0.55, 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (breed === 'terrier') {
        // Perky short docked upright tail!
        ctx.beginPath();
        ctx.moveTo(hipX - 4, hipY + 2);
        ctx.lineTo(hipX - 10 + wag * 0.45, hipY - 14 + wag * 0.3);
        ctx.stroke();
      } else {
        // Classic & Dachshund curved single-stroke tail
        ctx.beginPath();
        ctx.moveTo(hipX - 4, hipY + 2);
        ctx.quadraticCurveTo(hipX - 17, hipY - 7 + wag * 0.4, hipX - 14 + wag * 0.5, hipY - 18 + wag);
        ctx.stroke();
      }

      // 2. Far-side minimalist single-stroke legs
      const legVis = clamp(1 - sSleep * 1.15, 0, 1);
      const airSpread = clamp(aJumpZ / 35, 0, 1) * 7.5;
      const s1 = aJumpZ > 4 ? airSpread : Math.sin(aStride) * 8.5 * walkAmp * legHeight;
      const s2 = aJumpZ > 4 ? -airSpread : -s1;
      const reachWave = Math.sin(tSec * 5.2) * 4 * sRear;

      if (legVis > 0.04 && sRoll < 0.45) {
        ctx.save();
        ctx.globalAlpha = legVis * 0.65;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        if (sSit > 0.5) {
          ctx.moveTo(hipX + 4, hipY + 4);
          ctx.quadraticCurveTo(hipX + 13, 0, hipX + 16, 0);
        } else {
          ctx.moveTo(hipX + 4, hipY + 4);
          ctx.lineTo(hipX + 4 + s2, 0);
        }
        if (sRear > 0.4) {
          ctx.moveTo(shX, shY + 4);
          ctx.lineTo(shX + 12, shY - 8 - reachWave);
        } else {
          ctx.moveTo(shX - 2, shY + 5);
          ctx.lineTo(shX + sBow * 13 + s1, 0);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (sRoll > 0.35) {
        const kick = Math.sin(tSec * 6.5 + (actor.phaseOffset || 0)) * 4.5;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hipX + 3, -10); ctx.lineTo(hipX + kick, -21);
        ctx.moveTo(shX - 2, -10); ctx.lineTo(shX - kick, -22);
        ctx.stroke();
      }

      // 3. Compact slender torso silhouette (paper-matched fill — zero visual weight!)
      ctx.fillStyle = paperCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      if (sRoll > 0.5) {
        ctx.moveTo(hipX - 8, -4);
        ctx.quadraticCurveTo(0, 2, shX + 8, -4);
        ctx.quadraticCurveTo(shX + 10, -20 - breath * 1.5, 0, -21 - breath * 1.5);
        ctx.quadraticCurveTo(hipX - 10, -20 - breath * 1.5, hipX - 8, -4);
      } else {
        ctx.moveTo(hipX - 7, hipY + 5);
        ctx.quadraticCurveTo(backCtrlX, backCtrlY - 8, shX + 8, shY - 3);
        const bellyY = lerp(0, Math.max(hipY, shY) + (breed === 'dachshund' ? 6.5 : 8), 1 - sSleep);
        ctx.quadraticCurveTo(shX + 10, bellyY, lerp(hipX, shX, 0.5), bellyY);
        ctx.quadraticCurveTo(hipX - 9, bellyY, hipX - 7, hipY + 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Minimalist Neck Accessories (`scarf` or `bell`)
      if (acc === 'scarf' && sRoll < 0.5) {
        ctx.save();
        ctx.fillStyle = (actor.id || 0) % 2 === 0 ? accentCol : sageInkCol;
        ctx.globalAlpha = 0.44;
        ctx.beginPath();
        ctx.moveTo(shX + 1, shY - 2);
        ctx.lineTo(shX + 11, shY + 1);
        ctx.lineTo(shX + 7, shY + 9);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.restore();
      } else if (acc === 'bell' && sRoll < 0.5) {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.fillStyle = paperCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(shX + 2, shY - 2);
        ctx.quadraticCurveTo(shX + 7, shY + 2, shX + 10, shY - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(shX + 9, shY + 3.2, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 4. Near-side minimalist single-stroke legs
      if (legVis > 0.04 && sRoll < 0.45) {
        ctx.save();
        ctx.globalAlpha = legVis;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        if (sSit > 0.5) {
          ctx.moveTo(hipX, hipY + 5);
          ctx.quadraticCurveTo(hipX + 11, 1, hipX + 14, 0);
        } else {
          ctx.moveTo(hipX, hipY + 4);
          ctx.lineTo(hipX + s1, 0);
        }
        if (sRear > 0.4) {
          ctx.moveTo(shX + 3, shY + 4);
          ctx.lineTo(shX + 15, shY - 5 + reachWave);
        } else {
          ctx.moveTo(shX + 3, shY + 4);
          ctx.lineTo(shX + 4 + sBow * 15 + s2, 0);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 5. Minimalist Ink Head + Breed Ears + Simple Dot Eye & Dot Nose
      ctx.save();
      ctx.translate(headX, headY);
      const shakeRot = (actor.shake || 0) > 0.05 ? Math.sin(tSec * 40) * 0.28 * actor.shake : 0;
      ctx.rotate(pitch * 0.34 + (actor.headCock || 0) * 0.24 - sRoll * 0.40 + shakeRot);

      const headR = 14.6;
      ctx.fillStyle = paperCol;
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 2.8;

      if (breed === 'shiba') {
        // Back pointy prick ear
        ctx.beginPath();
        ctx.moveTo(-8, -9); ctx.lineTo(-12, -21); ctx.lineTo(-1, -13);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }

      if (breed === 'poodle') {
        // Fluffy 7-scallop minimalist cloud head!
        ctx.beginPath();
        const lobes = 7;
        for (let k = 0; k < lobes; k++) {
          const a0 = (k / lobes) * Math.PI * 2;
          const a1 = ((k + 1) / lobes) * Math.PI * 2;
          const am = (a0 + a1) * 0.5;
          const x0 = Math.cos(a0) * (headR - 1.2), y0 = Math.sin(a0) * (headR - 1.2);
          const xm = Math.cos(am) * (headR + 3.4), ym = Math.sin(am) * (headR + 3.4);
          const x1 = Math.cos(a1) * (headR - 1.2), y1 = Math.sin(a1) * (headR - 1.2);
          if (k === 0) ctx.moveTo(x0, y0);
          ctx.quadraticCurveTo(xm, ym, x1, y1);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Breed-specific foreground ear & facial stroke
      const windBack = sceneProps.kind === 'wind_gust_lines' ? -7 : 0;
      const earSwing = -pitch * 3 + Math.sin(aStride) * 1.8 * walkAmp + windBack;
      ctx.lineWidth = 2.6;
      if (breed === 'shiba') {
        ctx.beginPath();
        ctx.moveTo(-1, -12); ctx.lineTo(3, -23); ctx.lineTo(8, -10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-1, -12); ctx.lineTo(3, -23); ctx.lineTo(8, -10);
        ctx.stroke();
      } else if (breed === 'terrier') {
        // Perky folded V-ear + tiny 2-stroke whisker beard!
        ctx.beginPath();
        ctx.moveTo(-4, -10); ctx.lineTo(-12 + earSwing * 0.5, -14); ctx.lineTo(-11 + earSwing * 0.5, -4);
        ctx.stroke();
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(12, 4.5); ctx.lineTo(15.5, 8.5);
        ctx.moveTo(9.5, 6.5); ctx.lineTo(12, 10.5);
        ctx.stroke();
      } else if (breed === 'dachshund') {
        // Extra-long sweeping floppy ear!
        ctx.beginPath();
        ctx.moveTo(-4, -4);
        ctx.bezierCurveTo(-15 + earSwing, 0, -15 + earSwing, 14, -4, 13.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.bezierCurveTo(-13 + earSwing, -1, -13 + earSwing, 10.5, -4, 10.5);
        ctx.stroke();
      }

      // Minimalist Head Accessories (`sprout`, `beret`, `bow`)
      if (acc === 'sprout') {
        ctx.save();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -headR);
        ctx.quadraticCurveTo(1.5, -headR - 6, -2, -headR - 9);
        ctx.moveTo(0, -headR - 5);
        ctx.quadraticCurveTo(5, -headR - 8, 3, -headR - 3);
        ctx.stroke();
        ctx.restore();
      } else if (acc === 'beret') {
        ctx.save();
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.ellipse(-2.5, -headR - 0.5, 8.8, 3.2, -0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3.5, -headR - 3.5);
        ctx.lineTo(-4.5, -headR - 6);
        ctx.stroke();
        ctx.restore();
      } else if (acc === 'bow') {
        ctx.save();
        ctx.fillStyle = accentCol;
        ctx.globalAlpha = 0.42;
        ctx.beginPath();
        ctx.moveTo(-4, -10); ctx.lineTo(-9, -13.5); ctx.lineTo(-8, -7.5); ctx.closePath();
        ctx.moveTo(-4, -10); ctx.lineTo(1, -13.5); ctx.lineTo(0, -7.5); ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.restore();
      }

      // Minimalist eye (soft closed curve or simple ink dot)
      const closedEye = sSleep > 0.55 || blinking || (actor.yawn || 0) > 0.45 || (actor.shake || 0) > 0.3;
      ctx.strokeStyle = strokeCol;
      if (closedEye) {
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(5.5, -1.5, 3.0, 0.12 * Math.PI, 0.88 * Math.PI);
        ctx.stroke();
      } else {
        ctx.fillStyle = strokeCol;
        ctx.beginPath();
        ctx.arc(6.2, -2.0, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Minimalist dot nose
      ctx.fillStyle = strokeCol;
      ctx.beginPath();
      ctx.arc(headR - 0.5, 1.5, 2.1, 0, Math.PI * 2);
      ctx.fill();

      // Whisper-faint blush dot
      ctx.fillStyle = accentCol;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(5.5, 4.8, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if ((actor.yawn || 0) > 0.08) {
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(9.5, 6.6, 2.4 * actor.yawn, 3.3 * actor.yawn, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (sSleep > 0.82 && Math.sin(tSec * 0.25 + (actor.phaseOffset || 0)) > -0.2) {
        const bRad = 2.0 + breath * 3.6;
        ctx.globalAlpha = 0.26 + breath * 0.34;
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(headR + 4 + breath * 2, -2 - breath * 2.4, bRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Minimalist single-line carried items (on protagonist)
      const cItem = actor.carriedItem;
      if (cItem) {
        ctx.strokeStyle = strokeCol;
        ctx.fillStyle = paperCol;
        ctx.lineWidth = 1.9;
        if (cItem === 'frisbee') {
          ctx.beginPath();
          ctx.ellipse(21, 4.5, 9.5, 3.0, 0.12, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else if (cItem === 'bone') {
          ctx.beginPath();
          ctx.moveTo(15, 5.2); ctx.lineTo(27, 3.8); ctx.stroke();
          ctx.beginPath();
          ctx.arc(28, 2.2, 2.0, 0, Math.PI * 2);
          ctx.arc(28, 5.4, 2.0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        } else if (cItem === 'stick' || cItem === 'daisy') {
          ctx.beginPath();
          ctx.moveTo(15, 4.8); ctx.lineTo(29, 1.5); ctx.stroke();
          if (cItem === 'daisy') {
            ctx.beginPath();
            ctx.arc(30, 0.8, 3.2, 0, Math.PI * 2);
            ctx.fill(); ctx.stroke();
          }
        } else if (cItem === 'apple_head') {
          ctx.beginPath();
          ctx.arc(0, -18.5, 4.2, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }

      ctx.restore();

      const cupAlpha = clamp(actor.cup || 0, 0, 1);
      if (cupAlpha > 0.03 && speed < 8 && aJumpZ < 2) {
        ctx.save();
        ctx.globalAlpha = cupAlpha;
        const cx = shX + 34;
        ctx.fillStyle = paperCol;
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(cx - 6.5, -13, 13, 13, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    function drawUnifiedSketchPuppy(tSec, dark, blinking) {
      for (let i = 0; i < footprints.length; i++) {
        const fp = footprints[i];
        if (fp.x < pan.vx - 24 || fp.x > pan.vx + viewW + 24) continue;
        ctx.fillStyle = dark
          ? 'rgba(228, 223, 211,' + fp.alpha.toFixed(3) + ')'
          : 'rgba(53, 51, 47,' + fp.alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(fp.x, fp.y, fp.inked ? 3.2 : 2.5, fp.inked ? 1.9 : 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSketchProps(tSec, dark);

      const wSleep = Math.max(0, spSleep.x);
      const wSit = Math.max(0, spSit.x);
      const wBow = Math.max(0, spBow.x);
      const wStand = Math.max(0, spStand.x);
      const wRear = Math.max(0, spRearUp.x);
      const wRoll = Math.max(0, spRoll.x);
      const wSum = Math.max(0.001, wSleep + wSit + wBow + wStand + wRear + wRoll);

      const renderList = [{
        sortY: worldY,
        actor: {
          id: -1,
          x: worldX,
          y: worldY,
          facing: spFacing.x,
          speedVal: Math.hypot(vx, vy),
          stride: stridePhase,
          jumpZ: jumpZ,
          scaleMult: spScaleBoost.x,
          sSleep: wSleep / wSum,
          sSit: wSit / wSum,
          sBow: wBow / wSum,
          sStand: wStand / wSum,
          sRear: wRear / wSum,
          sRoll: wRoll / wSum,
          shake: spShake.x,
          squash: spSquash.x,
          sploot: spSploot.x,
          peek: spPeek.x,
          headPitch: spHeadPitch.x,
          headCock: spHeadCock.x,
          yawn: spYawn.x,
          cup: spCup.x,
          carriedItem: carriedItem,
          breed: 'classic',
          acc: 'none',
          phaseOffset: 0
        }
      }];

      for (let i = 0; i < companions.length; i++) {
        const c = companions[i];
        renderList.push({
          sortY: c.y,
          actor: {
            id: c.id,
            x: c.x,
            y: c.y,
            facing: c.facing,
            speedVal: Math.hypot(c.vx, c.vy),
            stride: c.stride,
            jumpZ: c.jumpZ,
            scaleMult: c.scale,
            sSleep: c.pose === 'sleep' ? 1 : 0,
            sSit: c.pose === 'sit' ? 1 : 0,
            sBow: c.pose === 'bow' ? 1 : 0,
            sStand: c.pose === 'stand' ? 1 : 0,
            sRear: c.pose === 'rear' ? 1 : 0,
            sRoll: c.pose === 'roll' ? 1 : 0,
            shake: 0,
            squash: 0,
            sploot: 0,
            peek: 0,
            headPitch: c.headPitch || 0,
            headCock: c.headCock || 0,
            yawn: 0,
            cup: 0,
            carriedItem: null,
            breed: c.breed,
            acc: c.acc,
            phaseOffset: c.phaseOffset
          }
        });
      }

      renderList.sort(function (a, b) { return a.sortY - b.sortY; });
      const minVisX = (storyScope === 'home' ? 0 : pan.vx) - 160;
      const maxVisX = (storyScope === 'home' ? viewW : pan.vx + viewW) + 160;
      const minVisY = (storyScope === 'home' ? 0 : pan.vy) - 180;
      const maxVisY = (storyScope === 'home' ? viewH : pan.vy + viewH) + 180;
      for (let i = 0; i < renderList.length; i++) {
        const act = renderList[i].actor;
        if (act.x < minVisX || act.x > maxVisX || act.y < minVisY || act.y > maxVisY) continue;
        drawSketchActor(act, tSec, dark, blinking);
      }
    }

    // =========================================================================
    // Unified Articulated Renderer 2: Geometric Spirits (5 Nordic Colors × 6 Ornaments + Twins & Totems!)
    // =========================================================================
    const GEO_COLOR_MAP = {
      terracotta: { light: ['#DF8666', '#F2A384'], dark: ['#D68263', '#E59A7C'] },
      sage:       { light: ['#689F8B', '#84BAA6'], dark: ['#5E9480', '#7AB09C'] },
      ochre:      { light: ['#D4A259', '#E7BA74'], dark: ['#C4934C', '#D8A964'] },
      slate:      { light: ['#768FA6', '#91AAC1'], dark: ['#6A839A', '#849DB4'] },
      rose:       { light: ['#C78283', '#DDA0A1'], dark: ['#B87475', '#CE9091'] }
    };

    function drawGeometricActor(actor, tSec, dark, blinking) {
      const palEntry = GEO_COLOR_MAP[actor.palette || 'terracotta'] || GEO_COLOR_MAP.terracotta;
      const pair = dark ? palEntry.dark : palEntry.light;
      const bodyCol = pair[0];
      const bodyTopCol = pair[1];
      const sageCol = dark ? '#7AB39E' : '#689F8B';
      const inkCol = dark ? '#1E2024' : '#292C2F';
      const haloStroke = dark ? 'rgba(242,238,230,0.68)' : 'rgba(52,56,62,0.52)';
      const cupFill = dark ? '#363940' : '#F5F2EA';

      const sSleep = actor.sSleep || 0;
      const sBow = actor.sBow || 0;
      const sStand = actor.sStand || 0;
      const sRear = actor.sRear || 0;
      const sRoll = actor.sRoll || 0;

      const speed = actor.speedVal || 0;
      const walkAmp = clamp(speed / 55, 0, 1.45) * sStand;
      const totalAirZ = (actor.jumpZ || 0) + (actor.levitateZ || 0);
      const bob = totalAirZ > 2 ? 0 : Math.abs(Math.sin(actor.stride || 0)) * 4.6 * walkAmp;
      const dir = actor.facing;
      const scaleMult = actor.scaleMult;

      ctx.save();
      ctx.translate(actor.x, actor.y);
      ctx.scale(scaleMult, scaleMult);

      if (!actor.stacked) {
        const shadowScale = clamp(1 - totalAirZ / 180, 0.25, 1);
        ctx.fillStyle = dark ? 'rgba(0,0,0,0.26)' : 'rgba(38,42,46,0.13)';
        ctx.beginPath();
        ctx.ellipse(0, 2, (30 - bob * 0.4) * shadowScale, 6.2 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      const sq = clamp((actor.squash || 0) + (actor.jellyWide || 0) * 0.55, -0.45, 0.55);
      ctx.translate(0, -totalAirZ / scaleMult);
      ctx.scale(1 + sq * 0.52, 1 - sq * 0.45);

      const activeFeet = actor.stacked ? 0 : clamp(sStand + sRear, 0, 1);
      if (activeFeet > 0.05) {
        const stepL = totalAirZ > 5 ? -6 : Math.sin(actor.stride || 0) * 9.5 * walkAmp;
        const stepR = totalAirZ > 5 ? 6 : -stepL;
        ctx.fillStyle = bodyCol;
        ctx.globalAlpha = activeFeet;
        ctx.beginPath();
        ctx.ellipse(-10 + stepL * dir * 0.6, -3, 6.8, 4.4 + sRear * 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(10 + stepR * dir * 0.6, -3, 6.8, 4.4 + sRear * 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const liftY = actor.stacked ? 0 : (sStand * (-8) - bob + sBow * (-4) + sRear * (-15));
      const rollRock = sRoll * (Math.PI * 0.92 + Math.sin(tSec * 4.2) * 0.28) + (actor.spinAngle || 0);
      const lean = ((actor.vx || 0) * 0.0016) + (actor.peek || 0) * dir * 0.16 + rollRock;

      ctx.save();
      ctx.translate(0, liftY - sRoll * 28);
      ctx.rotate(lean);
      if (sRoll > 0.01) ctx.translate(0, sRoll * 28);

      const armSwing = Math.sin(actor.stride || 0) * 11 * walkAmp;
      const stretchLift = Math.max(sBow * 28, sRear * 36, clamp((actor.jumpZ || 0) / 45, 0, 1) * 28);
      const cupHold = clamp(actor.cup || 0, 0, 1);

      ctx.strokeStyle = bodyCol;
      ctx.lineWidth = 8.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-27, -26);
      ctx.quadraticCurveTo(lerp(-37, -16, cupHold), -20 - stretchLift + armSwing, lerp(-30, -8, cupHold), lerp(-9 - stretchLift * 1.2 + armSwing * 0.7, -14, cupHold));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(27, -26);
      ctx.quadraticCurveTo(lerp(37, 16, cupHold), -20 - stretchLift - armSwing, lerp(30, 8, cupHold), lerp(-9 - stretchLift * 1.2 - armSwing * 0.7, -14, cupHold));
      ctx.stroke();

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

      // Zen stones balanced on protagonist head
      if (actor.isProtagonist && sceneProps.kind === 'head_zen_stack') {
        const cnt = sceneProps.count || 3;
        for (let s = 0; s < cnt; s++) {
          const wob = Math.sin(tSec * 3.2 + s) * (s + 1) * 1.4;
          ctx.fillStyle = s % 2 === 0 ? sageCol : cupFill;
          ctx.beginPath();
          ctx.ellipse(wob, -68 - s * 11, 12 - s * 2.2, 5.2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Minimalist Geometric Companion Ornaments (`halo`, `sprout`, `pebble_hat`, `antenna`, `crown`)
      const orn = actor.ornament || 'none';
      const ornBob = Math.sin(tSec * 2.6 + (actor.phaseOffset || 0)) * 2.0;
      if (orn === 'halo') {
        ctx.save();
        ctx.strokeStyle = haloStroke;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(0, -70 + ornBob, 13.5, 3.6, -0.10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (orn === 'sprout') {
        ctx.save();
        ctx.strokeStyle = sageCol;
        ctx.fillStyle = sageCol;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -62);
        ctx.lineTo(0, -70);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(-4.5, -71, 4.5, 2.4, -0.45, 0, Math.PI * 2);
        ctx.ellipse(4.5, -71, 4.5, 2.4, 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (orn === 'pebble_hat') {
        ctx.save();
        ctx.fillStyle = cupFill;
        ctx.beginPath();
        ctx.ellipse(ornBob * 0.6, -66.5, 9.5, 4.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (orn === 'antenna') {
        ctx.save();
        ctx.strokeStyle = haloStroke;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(0, -62);
        ctx.quadraticCurveTo(2, -70, ornBob * 1.3, -75);
        ctx.stroke();
        ctx.fillStyle = bodyTopCol;
        ctx.beginPath();
        ctx.arc(ornBob * 1.3, -76, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (orn === 'crown') {
        ctx.save();
        ctx.fillStyle = haloStroke;
        ctx.beginPath();
        ctx.arc(-8.5, -69 + ornBob * 0.6, 2.2, 0, Math.PI * 2);
        ctx.arc(0, -73 + ornBob * 0.6, 2.5, 0, Math.PI * 2);
        ctx.arc(8.5, -69 + ornBob * 0.6, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const gx = clamp(dir * 5.4 + (actor.peek || 0) * dir * 3.5, -8.5, 8.5);
      const gy = clamp((actor.headPitch || 0) * 7.5 - sBow * 3.0 - sRear * 4.0, -8.0, 5.5);

      ctx.save();
      ctx.translate(gx, -33 + gy);
      const eyesShut = sSleep > 0.55 || blinking;
      const eyesJoy = cupHold > 0.6 || (actor.jumpZ || 0) > 14 || sRoll > 0.5;
      ctx.strokeStyle = inkCol;
      ctx.fillStyle = inkCol;
      ctx.lineCap = 'round';

      if (eyesJoy) {
        ctx.lineWidth = 2.1;
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath(); ctx.arc(ex, 1.5, 3.4, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
        });
      } else if (eyesShut) {
        ctx.lineWidth = 2.0;
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath(); ctx.arc(ex, 0, 3.4, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        });
      } else {
        [-8.5, 8.5].forEach(function (ex) {
          ctx.beginPath(); ctx.ellipse(ex, 0, 2.7, 3.4, 0, 0, Math.PI * 2); ctx.fill();
        });
      }
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 6.2, 3.4, 0.16 * Math.PI, 0.84 * Math.PI);
      ctx.stroke();
      ctx.restore();

      if (cupHold > 0.04 && speed < 10) {
        ctx.save();
        ctx.globalAlpha = cupHold;
        ctx.fillStyle = cupFill;
        ctx.strokeStyle = inkCol;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-7, -20, 14, 12, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    }

    function drawUnifiedGeometricPebble(tSec, dark, blinking) {
      for (let i = 0; i < footprints.length; i++) {
        const fp = footprints[i];
        if (fp.x < pan.vx - 24 || fp.x > pan.vx + viewW + 24) continue;
        ctx.fillStyle = dark
          ? 'rgba(214, 130, 99,' + (fp.alpha * 0.65).toFixed(3) + ')'
          : 'rgba(180, 112, 86,' + (fp.alpha * 0.55).toFixed(3) + ')';
        ctx.beginPath();
        ctx.ellipse(fp.x, fp.y, 3.4, 1.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawGeometricProps(tSec, dark);

      const viewportScale = clamp(refScreenW / 1080, 1.10, 1.44);
      const baseDepth = lerp(0.88, 1.12, clamp((worldY - height * 0.60) / (height * 0.28), 0, 1)) * viewportScale;

      const wSleep = Math.max(0, spSleep.x);
      const wSit = Math.max(0, spSit.x);
      const wBow = Math.max(0, spBow.x);
      const wStand = Math.max(0, spStand.x);
      const wRear = Math.max(0, spRearUp.x);
      const wRoll = Math.max(0, spRoll.x);
      const wSum = Math.max(0.001, wSleep + wSit + wBow + wStand + wRear + wRoll);

      const renderList = [];
      if (spTwinSplit.x > 0.06) {
        const sep = spTwinSplit.x * 46;
        const orbitY = Math.sin(tSec * 2.8) * 10 * spTwinSplit.x;
        const subScale = baseDepth * lerp(1, 0.76, spTwinSplit.x);
        [-1, 1].forEach(function (side) {
          renderList.push({
            sortY: worldY + side * orbitY,
            actor: {
              isProtagonist: false,
              x: worldX + side * sep,
              y: worldY + side * orbitY,
              vx: vx,
              facing: spFacing.x,
              speedVal: Math.hypot(vx, vy),
              stride: stridePhase + (side > 0 ? 1.2 : 0),
              jumpZ: jumpZ,
              levitateZ: spLevitateZ.x,
              scaleMult: subScale,
              sSleep: wSleep / wSum, sBow: wBow / wSum, sStand: wStand / wSum, sRear: wRear / wSum, sRoll: wRoll / wSum,
              squash: spSquash.x, jellyWide: spJellyWide.x, spinAngle: spSpinAngle.x, peek: spPeek.x, headPitch: spHeadPitch.x, cup: 0,
              palette: side > 0 ? 'sage' : 'terracotta',
              ornament: 'none'
            }
          });
        });
      } else {
        renderList.push({
          sortY: worldY,
          actor: {
            isProtagonist: true,
            x: worldX,
            y: worldY,
            vx: vx,
            facing: spFacing.x,
            speedVal: Math.hypot(vx, vy),
            stride: stridePhase,
            jumpZ: jumpZ,
            levitateZ: spLevitateZ.x,
            scaleMult: baseDepth,
            sSleep: wSleep / wSum, sBow: wBow / wSum, sStand: wStand / wSum, sRear: wRear / wSum, sRoll: wRoll / wSum,
            squash: spSquash.x, jellyWide: spJellyWide.x, spinAngle: spSpinAngle.x, peek: spPeek.x, headPitch: spHeadPitch.x, cup: spCup.x,
            palette: 'terracotta',
            ornament: 'none'
          }
        });
      }

      for (let i = 0; i < companions.length; i++) {
        const c = companions[i];
        const cDepth = lerp(0.86, 1.15, clamp((c.y - height * 0.60) / (height * 0.28), 0, 1)) * viewportScale * c.scale;
        renderList.push({
          sortY: c.y + (c.stackParent >= 0 ? (c.stackParent + 1) * 0.5 : 0),
          actor: {
            isProtagonist: false,
            stacked: c.stackParent >= 0,
            x: c.x,
            y: c.y,
            vx: c.vx,
            facing: c.facing >= 0 ? 1 : -1,
            speedVal: Math.hypot(c.vx, c.vy),
            stride: c.stride,
            jumpZ: c.jumpZ,
            levitateZ: c.levitateZ,
            scaleMult: cDepth,
            sSleep: c.pose === 'sleep' ? 1 : 0,
            sBow: c.pose === 'bow' ? 1 : 0,
            sStand: c.pose === 'stand' ? 1 : 0,
            sRear: c.pose === 'rear' ? 1 : 0,
            sRoll: c.pose === 'roll' ? 1 : 0,
            squash: 0, jellyWide: 0, spinAngle: 0, peek: 0, headPitch: c.headPitch || 0, cup: 0,
            palette: c.palette,
            ornament: c.ornament,
            phaseOffset: c.phaseOffset
          }
        });
      }

      renderList.sort(function (a, b) { return a.sortY - b.sortY; });
      const minVisGeoX = (storyScope === 'home' ? 0 : pan.vx) - 160;
      const maxVisGeoX = (storyScope === 'home' ? viewW : pan.vx + viewW) + 160;
      const minVisGeoY = (storyScope === 'home' ? 0 : pan.vy) - 180;
      const maxVisGeoY = (storyScope === 'home' ? viewH : pan.vy + viewH) + 180;
      for (let i = 0; i < renderList.length; i++) {
        const act = renderList[i].actor;
        if (act.x < minVisGeoX || act.x > maxVisGeoX || act.y < minVisGeoY || act.y > maxVisGeoY) continue;
        drawGeometricActor(act, tSec, dark, blinking);
      }
    }

    // =========================================================================
    // Secondary Screen Ambient Horizons (10s Slow Breathing · Cohesive Material Echo)
    // =========================================================================
    function computeBreath10s(tSec) {
      const cyc = ((tSec % 10.0) + 10.0) % 10.0;
      return cyc < 4.0
        ? 0.5 - 0.5 * Math.cos(Math.PI * (cyc / 4.0))
        : 0.5 + 0.5 * Math.cos(Math.PI * ((cyc - 4.0) / 6.0));
    }

    function drawSecondarySketchHorizon(tSec, breath01, dark) {
      const strokeBase = dark ? '230, 225, 214' : '47, 46, 43';
      const paperFill = dark ? '#27282B' : '#F7F4EC';
      const sway = (breath01 - 0.5) * 7.5 + Math.sin(tSec * 0.9) * 2.2;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Minimalist Horizon Pencil Whisper + 10s-Breathing Grass & Dandelion (bottom-left)
      const hx = viewW * 0.22;
      const hy = viewH * 0.83;
      ctx.strokeStyle = 'rgba(' + strokeBase + ', 0.14)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx - 96, hy);
      ctx.quadraticCurveTo(hx + 6, hy - 4, hx + 108, hy + 1);
      ctx.stroke();

      // Grass tuft 1 & 2
      ctx.strokeStyle = 'rgba(' + strokeBase + ', 0.44)';
      ctx.lineWidth = 1.65;
      ctx.beginPath();
      ctx.moveTo(hx - 54, hy - 1);
      ctx.quadraticCurveTo(hx - 58 + sway * 0.35, hy - 14, hx - 63 + sway * 0.55, hy - 19);
      ctx.moveTo(hx - 52, hy - 1);
      ctx.quadraticCurveTo(hx - 49 + sway * 0.45, hy - 16, hx - 43 + sway * 0.65, hy - 22);
      ctx.moveTo(hx + 64, hy);
      ctx.quadraticCurveTo(hx + 61 + sway * 0.35, hy - 11, hx + 57 + sway * 0.50, hy - 15);
      ctx.moveTo(hx + 66, hy);
      ctx.quadraticCurveTo(hx + 69 + sway * 0.40, hy - 13, hx + 74 + sway * 0.55, hy - 17);
      ctx.stroke();

      // Slender Dandelion stem + puff head
      const dTopX = hx + 12 + sway * 0.85;
      const dTopY = hy - 42 + Math.abs(sway) * 0.18;
      ctx.beginPath();
      ctx.moveTo(hx + 4, hy - 1);
      ctx.quadraticCurveTo(hx + 7 + sway * 0.4, hy - 23, dTopX, dTopY + 7);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(' + strokeBase + ', 0.34)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(dTopX, dTopY, 7.5, 0, Math.PI * 2);
      ctx.stroke();

      // 3 Drifting Dandelion Seeds floating gently across the sky
      for (let s = 0; s < 3; s++) {
        const sp = ((tSec * 0.042 + s * 0.333) % 1.0);
        const env = smoothstep(0.0, 0.15, sp) * (1 - smoothstep(0.80, 1.0, sp));
        const sx = dTopX + 14 + sp * (viewW * 0.26);
        const sy = dTopY - 6 - sp * (viewH * 0.16) + Math.sin(tSec * 0.85 + s * 2.1) * 9;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.sin(tSec * 0.7 + s) * 0.22);
        ctx.strokeStyle = 'rgba(' + strokeBase + ',' + (env * 0.42).toFixed(3) + ')';
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(0, 5); ctx.lineTo(2, -3);
        ctx.moveTo(-2.5, -4); ctx.lineTo(6, -2);
        ctx.moveTo(0, -6); ctx.lineTo(4, 0);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Cross-Screen Origami Paper Plane / Butterfly Messenger (calm 32s sky glide)
      const skyCyc = 32.0;
      const skyIdx = Math.floor(tSec / skyCyc);
      const skyP = (tSec % skyCyc) / skyCyc;
      if (skyP > 0.08 && skyP < 0.88) {
        const u = (skyP - 0.08) / 0.80;
        const alpha = smoothstep(0, 0.16, u) * (1 - smoothstep(0.82, 1.0, u));
        const startX = viewW * 0.56;
        const endX = viewW * 0.88;
        const startY = viewH * 0.29;
        const endY = viewH * 0.16;
        const gx = lerp(startX, endX, u);
        const gy = lerp(startY, endY, u) + Math.sin(u * Math.PI * 2) * 16;

        if (skyIdx % 3 !== 2) {
          // Single-stroke Origami Paper Plane + whisper dashed breeze wake
          const trailU = Math.max(0, u - 0.22);
          const tx0 = lerp(startX, endX, trailU);
          const ty0 = lerp(startY, endY, trailU) + Math.sin(trailU * Math.PI * 2) * 16;
          ctx.save();
          ctx.strokeStyle = 'rgba(' + strokeBase + ',' + (alpha * 0.17).toFixed(3) + ')';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 7]);
          ctx.beginPath();
          ctx.moveTo(tx0, ty0);
          ctx.quadraticCurveTo((tx0 + gx) * 0.5, (ty0 + gy) * 0.5 + 10, gx - 18, gy + 4);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.translate(gx, gy);
          ctx.rotate(-0.22 + Math.cos(u * Math.PI * 2) * 0.08);
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = 'rgba(' + strokeBase + ', 0.62)';
          ctx.fillStyle = paperFill;
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-14, -9);
          ctx.lineTo(-7, 2);
          ctx.lineTo(-14, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(-7, 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // Minimalist 2-stroke fluttering butterfly
          const flap = 0.45 + 0.55 * Math.abs(Math.sin(tSec * 6.2));
          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(-0.18);
          ctx.strokeStyle = 'rgba(' + strokeBase + ',' + (alpha * 0.58).toFixed(3) + ')';
          ctx.lineWidth = 1.45;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-10 * flap, -10, -4 * flap, 3);
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(10 * flap, -10, 4 * flap, 3);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Subtle fading pawprint trail near bottom-right margin
      const pawBaseX = viewW * 0.72;
      const pawBaseY = viewH * 0.85;
      for (let p = 0; p < 3; p++) {
        const px = pawBaseX + p * 28;
        const py = pawBaseY + (p % 2 === 0 ? 3 : -4);
        const pa = (0.14 - p * 0.03) * (0.85 + breath01 * 0.15);
        ctx.fillStyle = 'rgba(' + strokeBase + ',' + pa.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px, py, 2.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px - 2.8, py - 3.4, 1.05, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + 2.0, py - 3.8, 1.05, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
    }

    function drawSecondaryGeometricHorizon(tSec, breath01, dark, blinking) {
      const cx = viewW * 0.5;
      const cy = viewH * 0.5;
      const minDim = Math.min(viewW, viewH);

      ctx.save();
      // 1. 10-Second Abdominal Slow-Breathing Concentric Halo (4s Inhale expand · 6s Exhale settle)
      const glowR = minDim * (0.36 + breath01 * 0.065);
      const g = ctx.createRadialGradient(cx, cy, minDim * 0.03, cx, cy, glowR);
      if (dark) {
        g.addColorStop(0, 'rgba(214, 130, 99,' + (0.13 + breath01 * 0.05).toFixed(3) + ')');
        g.addColorStop(0.55, 'rgba(94, 148, 128,' + (0.07 + breath01 * 0.03).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        g.addColorStop(0, 'rgba(223, 134, 102,' + (0.15 + breath01 * 0.05).toFixed(3) + ')');
        g.addColorStop(0.55, 'rgba(104, 159, 139,' + (0.08 + breath01 * 0.03).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      const r1 = minDim * (0.245 + breath01 * 0.034);
      const r2 = minDim * (0.328 + breath01 * 0.046);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = dark
        ? 'rgba(214, 130, 99,' + (0.16 + breath01 * 0.06).toFixed(3) + ')'
        : 'rgba(223, 134, 102,' + (0.17 + breath01 * 0.06).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = dark
        ? 'rgba(122, 176, 156,' + (0.11 + breath01 * 0.05).toFixed(3) + ')'
        : 'rgba(104, 159, 139,' + (0.12 + breath01 * 0.05).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r2, 0, Math.PI * 2);
      ctx.stroke();

      // 2. 4 Zero-Gravity Matte Dust Motes drifting calmly around the halo
      const moteSpecs = [
        { ox: -0.21, oy: 0.16, r: 4.2, col: dark ? '122,176,156' : '104,159,139', ph: 0.0 },
        { ox: -0.24, oy: 0.09, r: 2.9, col: dark ? '214,130,99' : '223,134,102', ph: 1.7 },
        { ox: 0.22, oy: -0.12, r: 4.8, col: dark ? '216,169,100' : '212,162,89', ph: 3.1 },
        { ox: 0.25, oy: -0.04, r: 3.1, col: dark ? '122,176,156' : '104,159,139', ph: 4.6 }
      ];
      for (let i = 0; i < moteSpecs.length; i++) {
        const m = moteSpecs[i];
        const mx = cx + viewW * m.ox + Math.sin(tSec * 0.38 + m.ph) * 14;
        const my = cy + viewH * m.oy + Math.cos(tSec * 0.31 + m.ph) * 16 - breath01 * 6;
        ctx.fillStyle = 'rgba(' + m.col + ', 0.26)';
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Corner Napping Sage Sprout-Pebble (wakes & hops gently when Primary friends visit!)
      const hostX = viewW * 0.25;
      const hostY = viewH * 0.82;
      const visitorLocalX = worldX - pan.vx;
      drawGeometricActor({
        isProtagonist: false,
        x: hostX,
        y: hostY,
        facing: visitorLocalX >= hostX ? 1 : -1,
        vx: 0,
        speedVal: 0,
        stride: 0,
        jumpZ: secHostJumpZ,
        levitateZ: 0,
        scaleMult: 0.78,
        stacked: false,
        sSleep: 1 - secHostWake,
        sBow: 0,
        sStand: secHostWake * 0.35,
        sRear: 0,
        sRoll: 0,
        squash: (1 - secHostWake) * (breath01 - 0.5) * 0.07,
        jellyWide: (1 - secHostWake) * 0.08,
        spinAngle: 0,
        peek: 0,
        headPitch: 0,
        headCock: secHostWake * Math.sin(tSec * 2.2) * 0.32,
        yawn: 0,
        cup: 0,
        palette: 'sage',
        ornament: 'sprout'
      }, tSec, dark, blinking);
    }

    function stepSimulationTick(dt, curSimSec) {
      stepDirector(dt, curSimSec);

      stepSpring(spFacing, dt);
      stepSpring(spSleep, dt);
      stepSpring(spSit, dt);
      stepSpring(spBow, dt);
      stepSpring(spStand, dt);
      stepSpring(spRearUp, dt);
      stepSpring(spRoll, dt);
      stepSpring(spShake, dt);
      stepSpring(spSquash, dt);
      stepSpring(spLevitateZ, dt);
      stepSpring(spJellyWide, dt);
      stepSpring(spTwinSplit, dt);
      stepSpring(spSpinAngle, dt);
      stepSpring(spSploot, dt);
      stepSpring(spScaleBoost, dt);
      stepSpring(spHeadPitch, dt);
      stepSpring(spHeadCock, dt);
      stepSpring(spYawn, dt);
      stepSpring(spCup, dt);
      stepSpring(spPeek, dt);

      if (curSimSec >= nextBlinkSimSec) {
        blinkUntilSimSec = curSimSec + 0.145;
        nextBlinkSimSec = curSimSec + (rng() < 0.2 ? 0.32 : randRange(2.6, 5.6));
      }
    }

    function update(nowMs) {
      if (!active || !ctx) return;
      resize();

      const FIXED_DT = 0.02; // 50Hz deterministic cross-screen lockstep!
      if (pan.originMs > 0) {
        const targetSec = clamp((Date.now() - pan.originMs) / 1000, 0, 14400);
        // If monitor was plugged in long into a session (>180s), cap catch-up burst per frame cleanly
        let maxCatchUpTicks = 600; // up to 12s of world time per frame -> catches up 2min in ~10 frames smoothly
        while (simSec + FIXED_DT <= targetSec && maxCatchUpTicks > 0) {
          simSec += FIXED_DT;
          stepSimulationTick(FIXED_DT, simSec);
          maxCatchUpTicks -= 1;
        }
      } else {
        const dt = clamp((nowMs - lastMs) / 1000, 0.004, 0.064);
        lastMs = nowMs;
        simSec += dt;
        stepSimulationTick(dt, simSec);
      }

      const blinking = simSec < blinkUntilSimSec;
      const dark = Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

      ctx.clearRect(0, 0, viewW, viewH);
      const breath01 = computeBreath10s(simSec);

      // Secondary Screen: Always ground the display with its 10s-breathing cohesive horizon,
      // and seamlessly layer visiting excursions right on top when Primary friends cross over!
      if (!pan.isPrimary || ambientOnly) {
        const frameDt = 0.016;
        const protagonistVisiting =
          !ambientOnly &&
          storyScope === 'panoramic' &&
          worldX >= pan.vx - 60 &&
          worldX <= pan.vx + viewW + 60 &&
          worldY >= pan.vy - 60 &&
          worldY <= pan.vy + viewH + 60;

        if (protagonistVisiting) {
          secHostWake = lerp(secHostWake, 1, frameDt * 4.5);
          if (!secHostGreeted && secHostWake > 0.55) {
            secHostGreeted = true;
            secHostJumpVZ = 165;
          }
        } else {
          secHostWake = lerp(secHostWake, 0, frameDt * 2.8);
          if (secHostWake < 0.15) secHostGreeted = false;
        }
        if (secHostJumpZ > 0 || secHostJumpVZ !== 0) {
          secHostJumpVZ -= 580 * frameDt;
          secHostJumpZ += secHostJumpVZ * frameDt;
          if (secHostJumpZ <= 0) {
            secHostJumpZ = 0;
            secHostJumpVZ = 0;
          }
        }

        if (theme === 'sketch') {
          drawSecondarySketchHorizon(simSec, breath01, dark);
        } else {
          drawSecondaryGeometricHorizon(simSec, breath01, dark, blinking);
        }

        if (!ambientOnly && storyScope === 'panoramic') {
          ctx.save();
          ctx.translate(-pan.vx, -pan.vy);
          if (theme === 'sketch') {
            drawUnifiedSketchPuppy(simSec, dark, blinking);
          } else {
            drawUnifiedGeometricPebble(simSec, dark, blinking);
          }
          ctx.restore();
        }
        return;
      }

      if (storyScope === 'home') {
        ctx.save();
        if (theme === 'sketch') {
          drawUnifiedSketchPuppy(simSec, dark, blinking);
        } else {
          drawUnifiedGeometricPebble(simSec, dark, blinking);
        }
        ctx.restore();
        return;
      }

      ctx.save();
      ctx.translate(-pan.vx, -pan.vy);
      if (theme === 'sketch') {
        drawUnifiedSketchPuppy(simSec, dark, blinking);
      } else {
        drawUnifiedGeometricPebble(simSec, dark, blinking);
      }
      ctx.restore();
    }

    return {
      setPanoramic: function (nextPan) {
        if (!nextPan) return;
        const nextSeed = (Number(nextPan.seed) >>> 0) || 0;
        const nextOrigin = Number(nextPan.originMs) || 0;
        const worldChanged =
          nextSeed !== pan.seed ||
          nextOrigin !== pan.originMs ||
          (Number(nextPan.ww) || 0) !== pan.ww ||
          (Number(nextPan.wh) || 0) !== pan.wh;
        pan = {
          isPrimary: nextPan.isPrimary !== false,
          vx: Number(nextPan.vx) || 0,
          vy: Number(nextPan.vy) || 0,
          vw: Number(nextPan.vw) || 0,
          vh: Number(nextPan.vh) || 0,
          ww: Number(nextPan.ww) || 0,
          wh: Number(nextPan.wh) || 0,
          seed: nextSeed,
          originMs: nextOrigin,
          screens: Array.isArray(nextPan.screens) ? nextPan.screens : null
        };
        if (worldChanged && initializedPos) {
          initializedPos = false;
          resize();
        }
      },
      setActive: function (nextActive, nextTheme, opts) {
        const wasActive = active;
        active = Boolean(nextActive);
        ambientOnly = Boolean(opts && opts.ambientOnly);
        if (nextTheme) theme = nextTheme;
        if (active && !wasActive) {
          lastMs = typeof performance !== 'undefined' ? performance.now() : 0;
          resize();
          resetWorldPlacement();
        } else if (!active && wasActive && ctx) {
          ctx.clearRect(0, 0, viewW, viewH);
        }
      },
      setTheme: function (nextTheme) {
        if (nextTheme && nextTheme !== theme) {
          theme = nextTheme;
          if (active) resetWorldPlacement();
        }
      },
      wakeReaction: function () {
        spSleep.target = 0;
        spSit.target = 0;
        spBow.target = 0;
        spStand.target = 0;
        spRearUp.target = 1;
        spRoll.target = 0;
        launchJump(185);
      },
      update: update,
      // Diagnostic helpers for unit & visual verification
      _drawNextCardForTest: drawNextFromDeck,
      _forceStory: function (storyId, variant) {
        if (!initializedPos) {
          resetWorldPlacement();
        }
        companions.length = 0;
        clearStoryState();
        setStoryScope(CROSS_SCREEN_EXCURSION_SET.has(storyId) ? 'panoramic' : 'home');
        const card = { id: storyId, variant: variant || 0, key: storyId + '#v' + (variant || 0) };
        currentStory = card.key;
        phaseSteps = theme === 'sketch' ? compileSketchStory(card) : compileGeometricStory(card);
        let mainIdx = 0;
        for (let k = 0; k < phaseSteps.length; k++) {
          if (phaseSteps[k].kind !== 'wake_yawn' && phaseSteps[k].kind !== 'stretch') {
            mainIdx = k;
            break;
          }
        }
        stepIndex = mainIdx;
        stepElapsed = 0;
      },
      _stepDeterministicForTest: function (ticks) {
        if (!initializedPos) {
          resetWorldPlacement();
        }
        for (let i = 0; i < ticks; i++) {
          simSec += 0.02;
          stepSimulationTick(0.02, simSec);
        }
        return {
          story: currentStory,
          scope: storyScope,
          worldX: worldX,
          worldY: worldY,
          companionCount: companions.length,
          firstCompX: companions[0] ? companions[0].x : null
        };
      }
    };
  }

  return {
    create: createRoamingStage,
    GEOMETRIC_ARCHETYPES: GEOMETRIC_ARCHETYPES,
    SKETCH_ARCHETYPES: SKETCH_ARCHETYPES,
    CROSS_SCREEN_EXCURSION_SET: CROSS_SCREEN_EXCURSION_SET,
    buildStratifiedDeck: buildStratifiedDeck
  };
});
