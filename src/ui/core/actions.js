(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoveNowActions = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * JTBD Micro-Actions & Action-Paired Dialogues:
   * - Every action naturally occupies both hands or invites standing up away from the desk,
   *   preventing the reflex to pick up a phone during short breaks.
   * - Every action pairs a dedicated visual pose with calm, plain, restrained copy
   *   plus an optional second-half follow-up beat (for breaks >= 25s) so action & words move together.
   */
  const FULL_BREAK_ACTIONS = [
    {
      id: 'head_lean',
      pose: 'lean_back',
      title: '托后脑舒展',
      copy: {
        geometric: [
          '双手十指交叉托住后脑，慢慢往后靠一会儿。',
          '双手托住后脑，椅背向后仰一点，代码不会跑掉的。'
        ],
        sketch: [
          '双手托住后脑勺向后仰一仰，把紧绷的肩颈放下来。',
          '十指交叉枕在脑后，往后靠着歇半分钟。'
        ],
        nature_window: [
          '十指交叉托后脑，向后靠片刻。',
          '托住后脑，让视线从屏幕挪开。'
        ]
      },
      followup: {
        geometric: '手肘轻轻往外打开，再慢慢吐一口气。',
        sketch: '不用急，顺着呼吸把手肘再打开一点。',
        nature_window: '舒展肩背，慢呼气。'
      }
    },
    {
      id: 'chest_open',
      pose: 'chest_open',
      title: '背后展肩',
      copy: {
        geometric: [
          '双手背在身后轻轻相扣，把胸口与双肩打开。',
          '手移到身后相握，把缩了半天的肩膀舒展开。'
        ],
        sketch: [
          '站起来，双手背在身后舒展一下胸口和肩膀。',
          '起身把手背到身后，慢慢把含胸的后背拉直。'
        ],
        nature_window: [
          '双手背后舒展，深呼吸。',
          '起身展肩，桌面已为你暂时封存。'
        ]
      },
      followup: {
        geometric: '下巴微微收一点，感受锁骨和后背松开。',
        sketch: '保持几秒，慢慢松开双手甩一甩。',
        nature_window: '舒展片刻，自然放松。'
      }
    },
    {
      id: 'get_water',
      pose: 'water',
      title: '起身接水',
      copy: {
        geometric: [
          '端起水杯去接半杯水吧，这几十秒也顺便放过手机。',
          '起身去接点温水，顺手把手机留在桌上。'
        ],
        sketch: [
          '端起水杯起身走两步去接点水，也把手机留在桌上。',
          '水杯空了吧，起来接半杯水润润嗓子。'
        ],
        nature_window: [
          '桌面已为你暂时封存，放心去接半杯水吧。',
          '端起水杯走几步，把视线和手机都留在桌上。'
        ]
      },
      followup: {
        geometric: '小口喝两口温水，慢慢走回来就行。',
        sketch: '慢慢喝一口，回来再接着忙。',
        nature_window: '喝口温水，不急着回来。'
      }
    },
    {
      id: 'window_gaze',
      pose: 'gaze',
      title: '沉肩远眺',
      copy: {
        geometric: [
          '双手自然下垂，慢慢沉下肩膀，望向窗外最远处。',
          '垂下双手，视线离开近处屏幕，往最远处看一会儿。'
        ],
        sketch: [
          '眼睛累了吧，垂下双手，往窗外最远的地方看一会儿。',
          '顺着窗外看一棵远处的树或屋顶，让眼睛松一松。'
        ],
        nature_window: [
          '把视线从屏幕挪开，让眼睛失焦一会儿。',
          '垂手沉肩，远眺窗外。'
        ]
      },
      followup: {
        geometric: '不用刻意对焦，轻眨几下眼，让睫状肌歇一会儿。',
        sketch: '慢慢眨眨眼，把目光在远处多停几秒。',
        nature_window: '轻眨双眼，停留片刻。'
      }
    },
    {
      id: 'neck_tilt',
      pose: 'neck_tilt',
      title: '慢侧颈放松',
      copy: {
        geometric: [
          '双手平放腿上，头慢慢向左侧倾，感受右颈拉长。',
          '肩膀保持不动，耳朵轻轻靠向左边肩膀停一会儿。'
        ],
        sketch: [
          '手离开键盘放腿上，脑袋慢吞吞往左歪一会儿。',
          '跟着一起向左轻轻歪头，把僵硬的脖子松开。'
        ],
        nature_window: [
          '双手放腿上，头部轻向左倾。',
          '松肩，左侧轻拉伸颈部。'
        ]
      },
      followup: {
        geometric: '缓缓回正，再换右侧慢慢停一会儿。',
        sketch: '慢悠悠回正，再换右边也歪一会儿。',
        nature_window: '回正，换向右侧轻倾。'
      }
    },
    {
      id: 'wrist_shake',
      pose: 'wrist_shake',
      title: '松腕甩手',
      copy: {
        geometric: [
          '双手离开键鼠抬起来，轻轻转动手腕，再把手指松开甩一甩。',
          '敲了这么久键盘，抬起双手慢慢绕几圈手腕吧。'
        ],
        sketch: [
          '手从鼠标上拿开，轻飘飘甩几下手腕，抖掉紧绷感。',
          '握拳再张开五指，顺便把手腕正反各绕两圈。'
        ],
        nature_window: [
          '抬手离键，轻转手腕。',
          '张开十指，放松腕关节。'
        ]
      },
      followup: {
        geometric: '五指用力张开停三秒，再彻底垂下来放松。',
        sketch: '再轻甩两下，让指尖和前臂都暖和起来。',
        nature_window: '自然垂手，卸下力气。'
      }
    },
    {
      id: 'shoulder_roll',
      pose: 'shoulder_roll',
      title: '沉肩画圈',
      copy: {
        geometric: [
          '吸气时双肩轻轻耸起，呼气时顺着后背慢悠悠沉下去。',
          '双手垂在身侧，双肩向后画几个不紧不慢的大圈。'
        ],
        sketch: [
          '耸一下肩，再呼一口气把肩膀重重放下来。',
          '顺着后背把肩膀慢慢绕两圈，把硬邦邦的斜方肌揉松。'
        ],
        nature_window: [
          '松肩，深呼吸。',
          '吸气微耸，呼气沉肩。'
        ]
      },
      followup: {
        geometric: '再重复两次，把耳肩之间的距离拉长。',
        sketch: '最后一次把肩膀彻底放低，后背也会轻一点。',
        nature_window: '再次沉肩，保持舒展。'
      }
    },
    {
      id: 'reach_up',
      pose: 'stretch_up',
      title: '上举伸懒腰',
      copy: {
        geometric: [
          '双手十指交叉举过头顶，掌心朝上，痛痛快快伸个懒腰。',
          '把双手往天花板方向轻轻送高，拉一拉久坐的侧腰。'
        ],
        sketch: [
          '站起来伸个大懒腰，把僵住的脊背一节节舒展开。',
          '双手举高伸直，像刚睡醒一样慢吞吞拉一下背。'
        ],
        nature_window: [
          '双手上举，舒展脊背。',
          '十指交叉向上延展。'
        ]
      },
      followup: {
        geometric: '呼气时双臂从两侧缓缓落下，顺便活动一下脚踝。',
        sketch: '慢慢放下手臂，顺带踮两下脚尖。',
        nature_window: '缓落双臂，归于松弛。'
      }
    },
    {
      id: 'deep_breath',
      pose: 'breath',
      title: '闭目慢呼吸',
      copy: {
        geometric: [
          '双手掌心向上放在腿上，闭上眼，跟着节奏慢吸慢呼。',
          '什么都先不想，只跟着画面做三次悠长的深呼吸。'
        ],
        sketch: [
          '不用急，闭上眼睛慢吞吞深呼吸三次就好。',
          '把念头先放一边，专心吸一口长气，再慢慢吐出来。'
        ],
        nature_window: [
          '松肩，深呼吸。',
          '闭目，吸气四秒，呼气六秒。'
        ]
      },
      followup: {
        geometric: '呼气再拉长一点，把眉心和下巴也一起松开。',
        sketch: '这几十秒也放过手机吧，单纯歇口气就很值。',
        nature_window: '吐尽余气，眉心放松。'
      }
    },
    {
      id: 'stand_walk',
      pose: 'walk',
      title: '起身走两步',
      copy: {
        geometric: [
          '离开椅子站起来，在屋里慢悠悠走上十来步吧。',
          '站起身离开工位一小会儿，让久坐的腰和腿透透气。'
        ],
        sketch: [
          '离开凳子走几步，顺便活动一下发僵的膝盖和脚踝。',
          '站起来绕着桌子走一圈，回来思路说不定更顺。'
        ],
        nature_window: [
          '桌面已为你暂时封存，放心去走走吧。',
          '离开座椅，缓步走动片刻。'
        ]
      },
      followup: {
        geometric: '趁站着的时候抬抬头，把视线放远一点。',
        sketch: '站着深呼吸两口，再慢慢坐回工位。',
        nature_window: '舒展下肢，从容归位。'
      }
    }
  ];

  const EYE_REST_ACTIONS = [
    {
      id: 'eye_far_gaze',
      pose: 'gaze',
      title: '远眺护眼',
      copy: {
        geometric: ['往远处看十几秒，让眼睛从屏幕里松一松。'],
        sketch: ['先停一下，望向窗外最远处眨眨眼。'],
        nature_window: ['把视线从屏幕挪开，让眼睛失焦一会儿。']
      }
    },
    {
      id: 'eye_blink_slow',
      pose: 'breath',
      title: '有意识慢眨眼',
      copy: {
        geometric: ['双手离开键盘，轻慢地完整眨眼七八次，润一润眼睛。'],
        sketch: ['盯屏幕久了容易干涩，慢吞吞多眨几下眼吧。'],
        nature_window: ['轻慢眨眼，湿润双目。']
      }
    },
    {
      id: 'eye_palm_warm',
      pose: 'lean_back',
      title: '掌心温敷',
      copy: {
        geometric: ['双手轻轻搓热，空心覆在闭着的双眼上歇十几秒。'],
        sketch: ['搓热掌心轻盖住眼眶（别压眼球），享受十几秒黑暗。'],
        nature_window: ['暖掌轻覆眼周，小憩片刻。']
      }
    },
    {
      id: 'eye_close_breath',
      pose: 'breath',
      title: '轻闭双目',
      copy: {
        geometric: ['手离键鼠，轻闭双眼，平稳地深呼吸两次。'],
        sketch: ['不用急，闭眼深呼吸两次，让眼皮卸下力气。'],
        nature_window: ['闭目，慢呼吸两次。']
      }
    },
    {
      id: 'eye_shift_focus',
      pose: 'gaze',
      title: '远近切焦',
      copy: {
        geometric: ['先看一眼手边，再立刻望向窗外最远处，来回切换两三次。'],
        sketch: ['视线从桌角移到远处的楼或树，帮眼睛调一调焦距。'],
        nature_window: ['由近及远，切换视线焦点。']
      }
    }
  ];

  // Low-frequency (~10%) cohesive micro-Easter-eggs: visual pose AND dialogue match seamlessly
  const EASTER_EGGS = {
    geometric: [
      {
        tag: 'tea',
        pose: 'tea',
        actionId: 'egg_geo_tea',
        title: '热茶片刻',
        message: '泡了杯热茶，你也起身去接半杯温水吧。',
        followup: '喝两口水歇口气，这几十秒也把手机留在桌上。'
      },
      {
        tag: 'tea',
        pose: 'tea',
        actionId: 'egg_geo_tea_2',
        title: '温水小憩',
        message: '端起水杯缓一缓吧，手头的事等会儿再接着写。',
        followup: '顺便沉下肩膀，往远处看几秒。'
      }
    ],
    sketch: [
      {
        tag: 'yawn',
        pose: 'yawn',
        actionId: 'egg_sketch_yawn',
        title: '打个哈欠',
        message: '跟着打个不赶时间的哈欠，把攒了一阵的困意吐出去。',
        followup: '顺手伸个懒腰，不用急着把手指放回键盘。'
      },
      {
        tag: 'tea',
        pose: 'water',
        actionId: 'egg_sketch_cup',
        title: '喝口温水',
        message: '端起小杯子喝口温水，顺便让握鼠标的手歇一会儿。',
        followup: '站起来走两步，也把手机留在桌上吧。'
      }
    ],
    nature_window: [
      {
        tag: 'golden_bokeh',
        pose: 'gaze',
        actionId: 'egg_nature_golden',
        title: '柔光失焦',
        message: '窗外光斑慢了下来，让眼睛也失焦歇一会儿。',
        followup: '桌面已暂时遮蔽，放心去走两步吧。'
      }
    ]
  };

  const PRE_ALERT_TEMPLATES = {
    geometric: [
      '{s} 秒后歇一会儿，先把手头这句收个尾。',
      '还有 {s} 秒放松一下，可以先把眼前这行写完。'
    ],
    sketch: [
      '还有 {s} 秒准备休息，可以先把这行字打完。',
      '{s} 秒后起身松口气，先把这步收尾吧。'
    ],
    nature_window: [
      '{s} 秒后桌面柔和失焦，请先收尾。'
    ]
  };

  const SNOOZE_DND_TOAST = '看来手头正紧，我先安静 1 小时，忙完记得喝水';
  const HANDS_OFF_HINT = '先松开键盘和鼠标，这几十秒留给自己';
  const DOUBLE_ESC_HINT = '再按一次 ESC 跳过这次休息';
  const SEALED_WAKE_HINT = '轻触键鼠或任意键返回桌面';

  // Theme-exclusive Sealed Mode copy libraries (office-friendly witty lines, rotated every 10 minutes, zero background-task assumptions)
  const SEALED_COPY_LIBRARIES = {
    geometric: [
      '工位临时托管中，本人被劝去喝水了。',
      '短暂离开人体工学椅，灵感正在茶水间加载…',
      '代班看屏幕中——别看我，我也只是个圆球。',
      '人去拯救颈椎了，有急事请稍等几分钟。',
      '去跟窗外的树对视一会儿，马上回来。',
      '正在窗边透气充会儿电，稍后满血归位。'
    ],
    sketch: [
      '工位暂由小狗接管，主人去接续命水了。',
      '代班看守桌面中，人去窗边透口气啦。',
      '离开椅子溜达两圈，回来状态更清醒。',
      '嘘，屏幕和眼睛都在中场休息。',
      '今日份久坐额度已满，先站起来充会儿电。',
      '请勿拍打喂食，去松松肩膀马上就回。'
    ],
    nature_window: {
      bokeh: [
        '屏幕暂时失焦，人去窗边重新对焦了。',
        '清晰度已调至护眼档，视线正在远方散步。',
        '先把焦点从屏幕上挪开几分钟，稍后归位。',
        '大光圈虚化中——人去活动筋骨了，马上回。',
        '短暂离席，给紧绷的眼睛放个小假。'
      ],
      mist: [
        '屏幕起雾透气中，人去接杯温水就回。',
        '给工位降点噪，离开椅子松松肩膀。',
        '雾气散开前，先让颈椎歇口气。',
        '中场休息片刻，去窗边吹吹风。',
        '桌面暂时留白，喝口水马上回来。'
      ],
      frost: [
        '给发烫的大脑和屏幕同时降个温，稍后即回。',
        '工作进度已冷藏保鲜，去走两步回来解冻。',
        '桌面暂时急冻锁鲜，接杯水马上回来。',
        '给久坐按下暂停键，起身活动一下。',
        '冷静几分钟，回来思路更清晰。'
      ]
    }
  };

  function getSealedCopy(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const natureStyle = opts.natureStyle || 'bokeh';
    const elapsedSec = Math.max(0, Number(opts.sealedElapsedSec) || 0);
    const rotationIndex = Math.max(0, Math.floor(Number(opts.rotationIndex) || 0));

    let pool;
    if (theme === 'nature_window') {
      const sub = SEALED_COPY_LIBRARIES.nature_window;
      pool = sub[natureStyle] || sub.bokeh;
    } else if (theme === 'sketch') {
      pool = SEALED_COPY_LIBRARIES.sketch;
    } else {
      // Geometric: 6th quote unlocks after being away >= 20 minutes
      const fullGeo = SEALED_COPY_LIBRARIES.geometric;
      pool = elapsedSec >= 20 * 60 ? fullGeo : fullGeo.slice(0, 5);
    }

    return pool[rotationIndex % pool.length];
  }

  function pickFrom(arr, randFn) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(randFn() * arr.length) % arr.length];
  }

  function pickBreakAction(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const kind = opts.breakKind === 'eye_rest' ? 'eye_rest' : 'full';
    const lastActionId = opts.lastActionId || null;
    const randFn = typeof opts.random === 'function' ? opts.random : Math.random;

    // ~10% restrained micro-Easter-egg on full breaks (pose + dialogue tightly paired)
    if (kind === 'full' && randFn() < 0.10) {
      const eggPool = EASTER_EGGS[theme] || EASTER_EGGS.geometric;
      const filteredEggs = eggPool.filter(function (e) {
        return e.actionId !== lastActionId;
      });
      const egg = pickFrom(filteredEggs.length > 0 ? filteredEggs : eggPool, randFn);
      return {
        actionId: egg.actionId,
        pose: egg.pose,
        title: egg.title,
        message: egg.message,
        followup: egg.followup || null,
        easterEgg: egg.tag
      };
    }

    const pool = kind === 'eye_rest' ? EYE_REST_ACTIONS : FULL_BREAK_ACTIONS;
    const candidates = pool.filter(function (a) {
      return a.id !== lastActionId;
    });
    const list = candidates.length > 0 ? candidates : pool;
    const chosen = list[Math.floor(randFn() * list.length) % list.length];

    const copyPool = (chosen.copy && (chosen.copy[theme] || chosen.copy.geometric)) || ['松肩，深呼吸。'];
    let message = Array.isArray(copyPool) ? pickFrom(copyPool, randFn) : copyPool;

    // Naturally weave workedMinutes into shoulder/gaze copy for geometric & sketch (never minimal)
    if (
      kind === 'full' &&
      theme !== 'nature_window' &&
      opts.workedMinutes >= 40 &&
      (chosen.id === 'shoulder_roll' || chosen.id === 'window_gaze') &&
      randFn() < 0.30
    ) {
      message = '已经连轴转 ' + opts.workedMinutes + ' 分钟了，先把肩膀放下来吧。';
    }

    const followup = chosen.followup
      ? (chosen.followup[theme] || chosen.followup.geometric || null)
      : null;

    return {
      actionId: chosen.id,
      pose: chosen.pose,
      title: chosen.title,
      message: message,
      followup: followup,
      easterEgg: null
    };
  }

  function getPreAlertCopy(theme, remainingSec, variantIndex) {
    const list = PRE_ALERT_TEMPLATES[theme] || PRE_ALERT_TEMPLATES.geometric;
    const idx = Math.abs(Math.floor(Number(variantIndex) || 0)) % list.length;
    const sec = Math.max(1, Math.ceil(remainingSec || 15));
    return list[idx].replace('{s}', String(sec));
  }

  function formatApproxMinutes(sec) {
    const s = Math.max(0, Number(sec) || 0);
    if (s < 60) return '不到 1 分钟';
    const mins = Math.ceil(s / 60);
    return mins + ' 分钟';
  }

  function getRhythmLabel(snapshot) {
    if (!snapshot) return '';
    if (snapshot.dndUntilTomorrow) {
      return '今天已暂停提醒，明天自动恢复';
    }
    if (snapshot.dndActive) {
      return '免打扰中，约 ' + formatApproxMinutes(snapshot.dndRemainingSec) + ' 后恢复';
    }
    if (snapshot.avoiding) {
      return '正静默避让，结束后恢复计时';
    }
    if (snapshot.phase === 'waiting_activity') {
      return '等你回到键鼠前，再起算下一轮';
    }
    if (snapshot.phase === 'pre_alert') {
      return '即将开始放松';
    }
    if (snapshot.phase === 'resting') {
      return '正在放松中';
    }
    if (snapshot.phase === 'sealed') {
      return '桌面已温柔封存 · 等你回来';
    }
    if (snapshot.snoozeRemainingSec > 0) {
      if (snapshot.snoozeRemainingSec < 60) return '已顺延，即将再来提醒';
      return '已顺延，约 ' + formatApproxMinutes(snapshot.snoozeRemainingSec) + ' 后再来';
    }
    const rem = snapshot.nextBreakRemainingSec || 0;
    if (snapshot.settings && snapshot.settings.rhythmPreset === 'dual' && typeof snapshot.nextEyeRemainingSec === 'number') {
      const eyeLabel = snapshot.nextEyeRemainingSec < 60 ? '即将远眺' : '约 ' + formatApproxMinutes(snapshot.nextEyeRemainingSec) + ' 后远眺';
      const fullLabel = rem < 60 ? '即将起身' : formatApproxMinutes(rem) + ' 后起身';
      return eyeLabel + ' · ' + fullLabel;
    }
    if (rem < 60) {
      return '即将放松一下';
    }
    return '约 ' + formatApproxMinutes(rem) + ' 后放松';
  }

  function getPopoverCopy(snapshot) {
    const count = snapshot.todayBreakCount || 0;
    const dndMin = Math.max(1, Math.ceil((snapshot.dndRemainingSec || 0) / 60));

    let statusLine = '';
    if (snapshot.dndUntilTomorrow) {
      statusLine = '今日免打扰，安心忙手头事';
    } else if (snapshot.dndActive) {
      statusLine = '免打扰中，约 ' + dndMin + ' 分钟后恢复';
    } else if (snapshot.avoiding) {
      statusLine = snapshot.avoidingReason === 'mirroring'
        ? '检测到投屏，正静默避让'
        : '全屏演示中，正静默避让';
    } else if (snapshot.phase === 'waiting_activity') {
      statusLine = '等你回座后再重新计时';
    } else if (snapshot.consecutiveSnoozes >= 2) {
      statusLine = '已推迟两次，忙完记得喝水';
    } else if (snapshot.consecutiveSnoozes === 1) {
      statusLine = '已顺延 5 分钟，记得歇会儿';
    } else if (snapshot.mood === 'refreshed') {
      statusLine = '刚起身放松过，状态正好';
    } else if (count >= 4) {
      statusLine = '今天节奏很稳，继续陪你';
    } else {
      statusLine = '安静陪伴，不打扰你的专注';
    }

    const summaryLine = count === 0
      ? '今天还没起身放松过'
      : '今天已陪你起身放松 ' + count + ' 次';

    return {
      statusLine: statusLine,
      summaryLine: summaryLine,
      rhythmLine: getRhythmLabel(snapshot)
    };
  }

  return {
    FULL_BREAK_ACTIONS: FULL_BREAK_ACTIONS,
    EYE_REST_ACTIONS: EYE_REST_ACTIONS,
    EASTER_EGGS: EASTER_EGGS,
    SEALED_COPY_LIBRARIES: SEALED_COPY_LIBRARIES,
    SNOOZE_DND_TOAST: SNOOZE_DND_TOAST,
    HANDS_OFF_HINT: HANDS_OFF_HINT,
    DOUBLE_ESC_HINT: DOUBLE_ESC_HINT,
    SEALED_WAKE_HINT: SEALED_WAKE_HINT,
    FROST_SEAL_HINT: SEALED_WAKE_HINT,
    RETURN_TO_REVEAL_HINT: SEALED_WAKE_HINT,
    pickBreakAction: pickBreakAction,
    getPreAlertCopy: getPreAlertCopy,
    getSealedCopy: getSealedCopy,
    getRhythmLabel: getRhythmLabel,
    getPopoverCopy: getPopoverCopy
  };
});
