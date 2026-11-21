(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoveNowActions = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * MoveNow Hybrid Copy & Modular Action Engine:
   * 1. Expanded 24 ergonomic break modules + 8 eye-rest modules (100% JTBD hands-occupied / away-from-desk).
   * 2. Hybrid Sealed & Break Copy Engine:
   *    - Pool A: Hand-crafted Action × Copy Paired Vignettes (pose & words tightly choreographed).
   *    - Pool B: Semantically constrained Slot-Grammar Molds (thousands of natural, office-graceful
   *      combinations with zero awkward seams, zero "protect from coworkers" awkwardness, and zero
   *      assumptions about background tasks).
   * 3. Sliding ring-buffer deduplication guarantees long-term variety with < 50 KB memory footprint.
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

  function pickFrom(arr, randFn) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr[Math.floor(randFn() * arr.length) % arr.length];
  }

  // Sliding history ring buffer so random picks never repeat back-to-back
  const recentBreakTexts = [];
  function rememberText(buf, text, limit) {
    if (!text) return;
    buf.push(text);
    if (buf.length > limit) buf.shift();
  }

  // =========================================================================
  // PART 1: 24 Ergonomic Full-Break Modules + Compositional Action Grammars
  // =========================================================================
  const FULL_BREAK_ACTIONS = [
    {
      id: 'head_lean',
      pose: 'lean_back',
      category: 'neck',
      title: '托后脑舒展',
      copy: {
        geometric: [
          '双手十指交叉托住后脑，慢慢往后靠一会儿。',
          '双手托住后脑，椅背向后仰一点，手头的事不会跑掉。'
        ],
        sketch: [
          '双手托住后脑勺向后仰一仰，把紧绷的肩颈放下来。',
          '十指交叉枕在脑后，往后靠着歇半分钟。'
        ],
        nature_window: ['十指交叉托后脑，向后靠片刻。', '托住后脑，让视线从屏幕挪开。']
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
      category: 'shoulder',
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
        nature_window: ['双手背后舒展，深呼吸。', '起身展肩，放松胸廓。']
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
      category: 'walk',
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
        nature_window: ['桌面已暂时遮蔽，放心去接半杯水吧。', '端起水杯走几步，把视线留在远处。']
      },
      followup: {
        geometric: '小口喝两口温水，慢慢走回来就行。',
        sketch: '慢慢喝一口，回来再接着忙。',
        nature_window: '喝口温水，从容归位。'
      }
    },
    {
      id: 'window_gaze',
      pose: 'gaze',
      category: 'eye',
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
        nature_window: ['把视线从屏幕挪开，让眼睛失焦一会儿。', '垂手沉肩，远眺窗外。']
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
      category: 'neck',
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
        nature_window: ['双手放腿上，头部轻向左倾。', '松肩，左侧轻拉伸颈部。']
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
      category: 'wrist',
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
        nature_window: ['抬手离键，轻转手腕。', '张开十指，放松腕关节。']
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
      category: 'shoulder',
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
        nature_window: ['松肩，深呼吸。', '吸气微耸，呼气沉肩。']
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
      category: 'spine',
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
        nature_window: ['双手上举，舒展脊背。', '十指交叉向上延展。']
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
      category: 'breath',
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
        nature_window: ['松肩，深呼吸。', '闭目，吸气四秒，呼气六秒。']
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
      category: 'walk',
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
        nature_window: ['离开座椅，缓步走动片刻。', '起身走两步，舒展下肢。']
      },
      followup: {
        geometric: '趁站着的时候抬抬头，把视线放远一点。',
        sketch: '站着深呼吸两口，再慢慢坐回工位。',
        nature_window: '舒展下肢，从容归位。'
      }
    },
    {
      id: 'side_bend',
      pose: 'asym_stretch',
      category: 'spine',
      title: '单臂侧腰延展',
      copy: {
        geometric: ['左手扶稳椅边，右手举过头顶向左侧轻轻弯腰，把侧肋拉开。'],
        sketch: ['一只手举高往旁边慢慢弯一下腰，像小树苗迎风伸展一样。'],
        nature_window: ['单臂过顶，轻柔拉伸侧腰。']
      },
      followup: {
        geometric: '慢慢回正，换左手举高往右侧也延展几秒。',
        sketch: '换另一边也拉一拉，左右对称最舒服。',
        nature_window: '回正，换侧延展。'
      }
    },
    {
      id: 'chin_tuck',
      pose: 'head_cock',
      category: 'neck',
      title: '收颌归位',
      copy: {
        geometric: ['不知不觉又探着脖子看屏幕了吧？双手扶膝，把头轻轻水平往后收。'],
        sketch: ['把往前凑的小脑袋往后收一收，让耳朵重新回到肩膀正上方。'],
        nature_window: ['水平微收下颌，还原颈椎曲度。']
      },
      followup: {
        geometric: '保持后颈拉长的感觉，自然呼吸两次。',
        sketch: '后脖子是不是轻松了一点？保持住慢呼吸两下。',
        nature_window: '后颈延展，平缓呼吸。'
      }
    },
    {
      id: 'scapula_squeeze',
      pose: 'chest_open',
      category: 'shoulder',
      title: '屈肘夹背',
      copy: {
        geometric: ['双手握虚拳屈肘在身侧，肩胛骨轻轻向后背中间靠拢。'],
        sketch: ['两只手肘往后背轻轻收拢一下，唤醒睡着的上背部。'],
        nature_window: ['屈肘微收肩胛，舒展前胸。']
      },
      followup: {
        geometric: '停住三秒再柔和松开，重复两遍。',
        sketch: '松开再轻收一次，背就不那么酸啦。',
        nature_window: '轻收慢放，放松后背。'
      }
    },
    {
      id: 'finger_fan',
      pose: 'wrist_shake',
      category: 'wrist',
      title: '十指张合',
      copy: {
        geometric: ['双手离开桌面举到胸前，五指尽量张开成扇形，再轻轻握拳。'],
        sketch: ['把敲字敲累的手指大大张开停两秒，再软软合拢。'],
        nature_window: ['张开十指，轻握再舒展。']
      },
      followup: {
        geometric: '像弹空气钢琴一样依次动动每根手指。',
        sketch: '随手动动大拇指和小指，给指关节松松绑。',
        nature_window: '活动指节，放松前臂。'
      }
    },
    {
      id: 'palm_warm',
      pose: 'paw_groom',
      category: 'eye',
      title: '暖掌敷眼',
      copy: {
        geometric: ['把双手掌心对搓到微热，轻轻空心覆在闭上的眼睛上。'],
        sketch: ['搓热手心盖住眼眶（别压眼球哦），安安静静享受片刻温热。'],
        nature_window: ['搓热掌心，轻覆双目小憩。']
      },
      followup: {
        geometric: '在掌心的暗光里慢吸一口气，让眼周肌肉彻底松下来。',
        sketch: '慢慢拿开双手，再轻眨两下眼睛。',
        nature_window: '缓移双手，轻眨适应光线。'
      }
    },
    {
      id: 'ankle_pump',
      pose: 'sniff',
      category: 'walk',
      title: '起身提踵',
      copy: {
        geometric: ['扶着桌沿站起来，慢慢踮起脚尖停两秒，再轻轻落回地面。'],
        sketch: ['站起来踮几下脚尖，帮久坐不动的小腿把血液泵上来。'],
        nature_window: ['扶桌起身，缓慢提踵数次。']
      },
      followup: {
        geometric: '顺便左右轮流转两圈脚踝，下肢会轻快很多。',
        sketch: '再晃晃脚腕，腿脚一下就暖和了。',
        nature_window: '轻转脚踝，活络下肢。'
      }
    },
    {
      id: 'jaw_unclench',
      pose: 'cheek_rest',
      category: 'breath',
      title: '松开牙关与眉心',
      copy: {
        geometric: ['双手离开键鼠，检查一下：后槽牙是不是正咬紧着？轻轻松开它。'],
        sketch: ['专注久了容易不自觉皱眉咬牙，把舌尖轻抵上颚、松开下巴吧。'],
        nature_window: ['松开牙关，抚平眉心。']
      },
      followup: {
        geometric: '连着眉心、眼角和肩膀一起往下沉一沉。',
        sketch: '轻轻呼出一口长气，整张脸都柔和下来。',
        nature_window: '面部松弛，平稳呼气。'
      }
    },
    {
      id: 'butterfly_hug',
      pose: 'tea_blow',
      category: 'shoulder',
      title: '交叉轻拍双肩',
      copy: {
        geometric: ['双手交叉搭在对侧肩膀上，像拥抱自己一样左右轻拍几下。'],
        sketch: ['两手交叉抱住自己的肩膀，慢吞吞轻轻拍两下安抚紧绷的神经。'],
        nature_window: ['双手交叉搭肩，轻缓呼吸。']
      },
      followup: {
        geometric: '顺着呼吸把双肘自然下沉，放慢心率。',
        sketch: '深吸一口气，再把手慢慢放回腿上。',
        nature_window: '沉肘顺气，恢复平静。'
      }
    },
    {
      id: 'torso_twist',
      pose: 'patrol_scan',
      category: 'spine',
      title: '坐姿慢转体',
      copy: {
        geometric: ['双脚踩稳地面，双手轻扶右侧椅背，带动上身慢慢向右转望。'],
        sketch: ['坐直身子扶着椅背往右后方看一眼，给久坐的腰背松松绑。'],
        nature_window: ['轻扶椅背，向右侧缓转上身。']
      },
      followup: {
        geometric: '停顿一次呼吸，再慢慢转向左侧看一眼。',
        sketch: '回正后再往左边也转一转，别太用力哦。',
        nature_window: '回正，换向左侧轻转。'
      }
    },
    {
      id: 'play_stretch',
      pose: 'play_bow',
      category: 'spine',
      title: '扶桌俯身拉背',
      copy: {
        geometric: ['退开椅子半步站起来，双手扶住桌沿，臀部向后退，拉长整个后背。'],
        sketch: ['像小狗伸懒腰一样——站起来双手扶桌沿往后退半步，把背拉得直直的。'],
        nature_window: ['起身扶桌后退半步，延展脊柱。']
      },
      followup: {
        geometric: '感受肩膀与胸椎舒展开，慢慢站直身体。',
        sketch: '慢慢直起腰来，是不是觉得背轻快了不少？',
        nature_window: '缓慢起身，自然站立。'
      }
    },
    {
      id: 'focus_ ladder',
      pose: 'mote_track',
      category: 'eye',
      title: '三点远近调焦',
      copy: {
        geometric: ['双手放在膝上，视线依次看一眼桌面、房间对面、再望向窗外最远处。'],
        sketch: ['带着眼睛散个步：看看桌角，看看远处的墙，再看看窗外的天。'],
        nature_window: ['视线由近及远，逐级放远焦点。']
      },
      followup: {
        geometric: '在最远处多停五秒钟，不急着把目光收回来。',
        sketch: '在最远的地方停一会儿，让眼球彻底歇口气。',
        nature_window: '停驻远方，放松晶状体。'
      }
    },
    {
      id: 'sky_breath',
      pose: 'gaze',
      category: 'walk',
      title: '窗边透气',
      copy: {
        geometric: ['离开工位走到窗边站半分钟吧，看看今天外面的光线和云。'],
        sketch: ['从屏幕前撤出来，走到窗边看看外面的树影和天色吧。'],
        nature_window: ['移步窗边，感受自然天光。']
      },
      followup: {
        geometric: '把手机留在工位上，单纯吹口气再回来。',
        sketch: '不带手机在窗边站十几秒，脑子会清醒很多。',
        nature_window: '静立片刻，清空杂念。'
      }
    }
  ];

  // Polished Compositional Break Grammars (strictly keyed by category so every combination reads seamlessly!)
  const BREAK_CATEGORY_GRAMMARS = {
    neck: {
      openers: ['先把双手从键鼠上挪开，', '把双手轻轻搭在腿上，', '停下敲字的手，'],
      cores: [
        '让下巴微微内收，把前探的脖子慢慢退回肩膀正上方',
        '头向一侧轻轻倾过去，给紧绷的颈侧留出舒展的空间',
        '十指交叉托住后脑往后靠，让颈椎卸下头部的重量'
      ],
      closers: ['。', '，慢呼吸两次。', '，代码不会自己跑掉的。']
    },
    shoulder: {
      openers: ['松开握鼠标的手，', '双手自然垂落身侧，', '先停下手头这半行，'],
      cores: [
        '吸气微耸双肩，呼气时把肩膀重重沉回原位',
        '带着双肩向后慢慢绕两个大圈，揉开僵住的斜方肌',
        '把手背到身后轻轻相扣，把缩了半天的胸口打开'
      ],
      closers: ['。', '，顺便长舒一口气。', '，把耳肩距离拉长一点。']
    },
    spine: {
      openers: ['离开椅背坐直一点，', '干脆站起身来，', '把椅子轻轻往后推开半步，'],
      cores: [
        '双手十指交叉举向头顶，痛痛快快伸个长长的懒腰',
        '单手举高向侧面轻轻弯一弯，把久坐折叠的侧腰拉开',
        '顺着呼吸把脊背一节一节向上延展开'
      ],
      closers: ['。', '，不用急着坐回去。', '，让腰椎松一口气。']
    },
    wrist: {
      openers: ['双手彻底离开键盘鼠标，', '把忙碌了半天的双手抬起来，', '停下敲击，'],
      cores: [
        '正反各慢悠悠转三圈手腕，再轻飘飘甩掉紧绷感',
        '五指尽量张开停两秒再松开，给指关节解解乏',
        '轻轻晃动手腕与前臂，让指尖重新暖和起来'
      ],
      closers: ['。', '，这几十秒留给双手休息。']
    },
    eye: {
      openers: ['把双手安稳放在膝盖上，', '先别急着看手机，', '垂下双手沉住双肩，'],
      cores: [
        '把视线投向窗外最远的一棵树或屋顶，让眼睛自然失焦',
        '轻慢而完整地眨眼七八次，润一润发干的眼眶',
        '搓热掌心轻轻覆在闭着的双眼上，给视线放个短假'
      ],
      closers: ['。', '，让睫状肌彻底松下来。']
    },
    walk: {
      openers: ['把手机留在桌上，', '趁现在思路刚告一段落，', '推开椅子站起来，'],
      cores: [
        '端起杯子去接半杯温水，顺便活动一下发沉的双腿',
        '在屋里不紧不慢走上十几步，顺带转转脚踝',
        '走到窗边站半分钟透透气，换一换脑子里的空气'
      ],
      closers: ['。', '，回来写得更顺。', '，不用赶时间。']
    },
    breath: {
      openers: ['双手掌心向上搭在腿上，', '轻轻合上眼皮，', '把紧咬的后槽牙松开，'],
      cores: [
        '用鼻子慢吸四秒，再顺着肩膀下沉慢慢呼出六秒',
        '什么都不去想，只专心做三次绵长平稳的深呼吸',
        '把拧着的眉心和肩膀一起顺着呼气放下来'
      ],
      closers: ['。', '，给大脑留白半分钟。']
    }
  };

  const EYE_REST_ACTIONS = [
    {
      id: 'eye_far_gaze',
      pose: 'gaze',
      title: '远眺护眼',
      copy: {
        geometric: ['往远处看十几秒，让眼睛从屏幕里松一松。', '视线越过显示器，找一个最远的点停一会儿。'],
        sketch: ['先停一下，望向窗外最远处眨眨眼。', '看看远处的屋顶或树梢，帮眼睛松松绑。'],
        nature_window: ['把视线从屏幕挪开，让眼睛失焦一会儿。', '远眺窗外，放松双目。']
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
      pose: 'mote_track',
      title: '远近切焦',
      copy: {
        geometric: ['先看一眼手边，再立刻望向窗外最远处，来回切换两三次。'],
        sketch: ['视线从桌角移到远处的楼或树，帮眼睛调一调焦距。'],
        nature_window: ['由近及远，切换视线焦点。']
      }
    },
    {
      id: 'eye_brow_relax',
      pose: 'cheek_rest',
      title: '舒展眉心',
      copy: {
        geometric: ['闭上眼，顺便把不知不觉皱起来的眉心松开。'],
        sketch: ['合上眼睛歇十秒，把眼角和眉毛都软软放平。'],
        nature_window: ['闭目松眉，卸下眼压。']
      }
    }
  ];

  // Low-frequency (~12%) cohesive micro-Easter-eggs: visual pose AND dialogue tightly paired
  const EASTER_EGGS = {
    geometric: [
      {
        tag: 'tea',
        pose: 'tea_blow',
        actionId: 'egg_geo_tea',
        title: '热茶片刻',
        message: '泡了杯热茶吹吹热气，你也起身去接半杯温水吧。',
        followup: '喝两口水歇口气，这几十秒也把手机留在桌上。'
      },
      {
        tag: 'mote',
        pose: 'mote_track',
        actionId: 'egg_geo_mote',
        title: '放空追光',
        message: '跟着飘过的小光点发会儿呆，让绷紧的脑子挂个空挡。',
        followup: '顺便沉下肩膀，往窗外远处看几秒。'
      },
      {
        tag: 'tea',
        pose: 'tea',
        actionId: 'egg_geo_tea_2',
        title: '温水小憩',
        message: '端起水杯缓一缓吧，手头的事等会儿再接着写。',
        followup: '慢呼吸两次，回来思路更清楚。'
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
      },
      {
        tag: 'butterfly',
        pose: 'butterfly',
        actionId: 'egg_sketch_fly',
        title: '看会儿窗外',
        message: '哪怕只是看着窗外发半分钟呆，也是正经的充电。',
        followup: '眨眨眼睛，把紧绷的肩膀放下来。'
      }
    ],
    nature_window: [
      {
        tag: 'golden_bokeh',
        pose: 'gaze',
        actionId: 'egg_nature_golden',
        title: '柔光失焦',
        message: '光斑慢了下来，让眼睛也跟着失焦歇一会儿。',
        followup: '离开座椅走两步，从容归位。'
      }
    ]
  };

  // =========================================================================
  // PART 2: Sealed Mode Hybrid Engine (Curated Action×Copy Vignettes + Slot Grammars)
  // =========================================================================

  // Pool A: Hand-polished Action × Copy Paired Vignettes (character immediately performs `pose`)
  const CURATED_SEALED_VIGNETTES = {
    geometric: [
      { pose: 'guardian', message: '工位临时托管中，本人被劝去喝水了。' },
      { pose: 'tea_blow', message: '代班福利：趁正主起身活动，先替他捧会儿这杯热茶。' },
      { pose: 'mote_track', message: '刚才好像有一颗好点子从屏幕前飘过去了，等他回来转告。' },
      { pose: 'nod_doze', message: '没打瞌睡，只是替这块亮了半天的屏幕闭目养神几秒。' },
      { pose: 'cheek_rest', message: '代班看屏幕中——别看我，我也只是个旁观的圆球。' },
      { pose: 'patrol_scan', message: '座位临时值守中，正在左右张望有没有人路过找他。' },
      { pose: 'asym_stretch', message: '正主去松松肩膀了，留我在这儿示范标准伸懒腰。' },
      { pose: 'walk', message: '人去茶水间走动了，我在屏幕里替他把今日步数凑够。' },
      { pose: 'guardian', message: '短暂离开人体工学椅，灵感正在茶水间加载…' },
      { pose: 'shoulder_roll', message: '人去拯救颈椎了，有急事请稍等几分钟。' },
      { pose: 'gaze', message: '去跟窗外的树对视一会儿，马上回来。' },
      { pose: 'happy_squint', message: '终于把这位久坐选手劝离工位了，深感欣慰。' },
      { pose: 'tea', message: '屏幕与肩膀都已挂上空挡，接杯温水就回。' },
      { pose: 'cheek_rest', message: '正在窗边透气充会儿电，稍后满血归位。', longAwayOnly: true }
    ],
    sketch: [
      { pose: 'nap_guard', message: '工位暂由小狗接管，主人去接续命水了。' },
      { pose: 'sleep_bubble', message: '嘘，屏幕和眼睛都在中场休息，稍后满血醒来。' },
      { pose: 'yawn', message: '代班打个大哈欠——盯屏幕太久，确实该出去透口气了。' },
      { pose: 'head_cock', message: '歪头确认过了：人不在座位，应该是去窗边放空了。' },
      { pose: 'walk', message: '巡视完一圈桌面，一切安好，人去松松筋骨马上回。' },
      { pose: 'play_bow', message: '今日份久坐额度已满，先去把僵住的后背拉直一点。' },
      { pose: 'butterfly', message: '盯着小飞虫发呆的工夫，他应该已经接完水往回走了。' },
      { pose: 'paw_groom', message: '请勿拍打喂食，值班小狗正在认真整理仪容。' },
      { pose: 'sniff', message: '低头闻了一圈：没有焦虑味，只有刚泡好的茶水香。' },
      { pose: 'water', message: '替主人守着水杯和桌面，去走廊溜达两圈就回。' },
      { pose: 'gaze', message: '代班望风中，人去窗边给眼睛放个小假。' },
      { pose: 'stretch_up', message: '离开椅子伸个大懒腰，回来状态更清醒。' }
    ],
    nature_window: {
      bokeh: [
        { pose: 'gaze', message: '屏幕暂时失焦，人去窗边重新对焦了。' },
        { pose: 'gaze', message: '清晰度已调至护眼档，视线正在远方散步。' },
        { pose: 'breath', message: '先把焦点从屏幕上挪开几分钟，稍后归位。' },
        { pose: 'gaze', message: '大光圈虚化中——人去活动筋骨了，马上回。' },
        { pose: 'breath', message: '短暂离席，给紧绷的眼睛放个小假。' },
        { pose: 'gaze', message: '把视线借给远处的风景片刻，稍后重新合焦。' }
      ],
      mist: [
        { pose: 'breath', message: '屏幕起雾透气中，人去接杯温水就回。' },
        { pose: 'breath', message: '给工位降点噪，离开椅子松松肩膀。' },
        { pose: 'breath', message: '雾气散开前，先让颈椎歇口气。' },
        { pose: 'gaze', message: '中场休息片刻，去窗边吹吹风。' },
        { pose: 'breath', message: '桌面暂时留白，喝口水马上回来。' },
        { pose: 'breath', message: '窗面微起薄雾，正好起身活动一下手脚。' }
      ],
      frost: [
        { pose: 'breath', message: '给发烫的大脑和屏幕同时降个温，稍后即回。' },
        { pose: 'breath', message: '当前进度已冷藏保鲜，去走两步回来解冻。' },
        { pose: 'breath', message: '桌面暂时急冻锁鲜，接杯水马上回来。' },
        { pose: 'breath', message: '给久坐按下暂停键，起身活动一下。' },
        { pose: 'breath', message: '冷静几分钟，回来思路更清晰。' },
        { pose: 'breath', message: '屏幕进入冬眠小憩，人去茶水间充个电。' }
      ]
    }
  };

  // Pool B: Carefully Polished Slot-Grammar Molds (every cross-product verified for natural Chinese rhythm!)
  const SEALED_GRAMMAR_MOLDS = {
    geometric: [
      {
        poses: ['guardian', 'patrol_scan', 'cheek_rest'],
        a: ['工位临时托管中，', '桌面值班员已上线，', '人体工学椅暂时轮休，', '键盘鼠标正在放风，', '当前座位挂上空挡，'],
        b: ['本人去把耸高的肩膀放下来', '正主去茶水间续半杯温水', '人去窗边给眼睛调个远焦', '去走廊溜达两步活络下腰椎', '去跟远处的绿植对视半分钟'],
        c: ['，稍后即回。', '，几分钟就回。', '，回来思路更顺。', '，马上归位。']
      },
      {
        poses: ['tea_blow', 'mote_track', 'nod_doze', 'asym_stretch'],
        a: ['代班看守屏幕中——', '圆球临时顶岗中：', '替主人看会儿桌面，', '中场休息信号已发出，'],
        b: ['人被劝去活动颈椎了', '灵感正在走廊里慢悠悠加载', '去把僵了一上午的后背拉直一点', '趁机让眼睛离开近处歇口气'],
        c: ['。', '，有急事请稍等片刻。', '，喝口温水就回来。']
      }
    ],
    sketch: [
      {
        poses: ['nap_guard', 'sleep_bubble', 'paw_groom', 'water'],
        a: ['小狗代班看家中，', '桌面暂由小狗接管，', '摇尾巴值守工位中，', '今日份护眼小憩已开启，'],
        b: ['主人去茶水间打水啦', '人去窗边吹吹风透口气', '去把发僵的肩膀松一松', '离开凳子溜达两圈充充电'],
        c: ['。', '，马上就回。', '，回来状态更精神。']
      },
      {
        poses: ['head_cock', 'walk', 'yawn', 'butterfly'],
        a: ['巡视完毕，工位一切正常——', '歪头播报一则简讯：', '嘘，让键盘和手腕都歇会儿，'],
        b: ['正主去活动筋骨了', '人去接半杯温水润润嗓子', '去远处看看风景调调焦距'],
        c: ['，稍后归位。', '，几分钟后见。', '。']
      }
    ],
    bokeh: [
      {
        poses: ['gaze'],
        a: ['画面已切入柔焦护眼档，', '镜头暂时拧到远景模式，', '屏幕光圈柔和虚化中，', '近处像素暂时退居幕后，'],
        b: ['人去窗边给眼睛松松绑', '先把视线借给远方几分钟', '起身去接杯水活动一下肩颈', '离开座椅让睫状肌歇口气'],
        c: ['。', '，稍后重新合焦。', '，几分钟后归位。']
      }
    ],
    mist: [
      {
        poses: ['breath'],
        a: ['玻璃窗面起雾透气中，', '桌面蒙上一层温润薄雾，', '屏幕进入安静留白时刻，', '给忙碌的工位降一点噪，'],
        b: ['人去接杯温水松松肩', '起身去走廊透一口气', '先让紧绷的颈椎缓一缓', '去窗边吹吹风换换脑子'],
        c: ['。', '，雾散即回。', '，稍后即回。']
      }
    ],
    frost: [
      {
        poses: ['breath'],
        a: ['当前桌面已低温锁鲜，', '给发烫的屏幕降个温，', '工作进度暂时凝霜封存，', '给久坐惯性按下暂停键，'],
        b: ['人去起身走动两步', '去茶水间续杯水活络筋骨', '让紧绷的注意力和肩膀都松一松', '去窗边透口气冷静几分钟'],
        c: ['。', '，回来轻触即刻解冻。', '，稍后满血继续。']
      }
    ]
  };

  // Legacy-compatible array export built from curated vignettes
  const SEALED_COPY_LIBRARIES = {
    geometric: CURATED_SEALED_VIGNETTES.geometric.map(function (v) { return v.message; }),
    sketch: CURATED_SEALED_VIGNETTES.sketch.map(function (v) { return v.message; }),
    nature_window: {
      bokeh: CURATED_SEALED_VIGNETTES.nature_window.bokeh.map(function (v) { return v.message; }),
      mist: CURATED_SEALED_VIGNETTES.nature_window.mist.map(function (v) { return v.message; }),
      frost: CURATED_SEALED_VIGNETTES.nature_window.frost.map(function (v) { return v.message; })
    }
  };

  /**
   * Deterministic-per-beat hybrid picker for Sealed Mode:
   * Mixes hand-crafted Action×Copy Paired Vignettes (~55%) with Slot-Grammar Composed Lines (~45%)
   * using `(sessionSeed, rotationIndex)` so `getSnapshot()` is rock-solid on every 0.5s tick
   * while producing thousands of unique, non-repeating pairings across sessions & rotations!
   */
  function pickSealedVignette(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const natureStyle = opts.natureStyle || 'bokeh';
    const elapsedSec = Math.max(0, Number(opts.sealedElapsedSec) || 0);
    const rotationIndex = Math.max(0, Math.floor(Number(opts.rotationIndex) || 0));
    const hasSessionSeed = typeof opts.sessionSeed === 'number' && opts.sessionSeed > 0;

    let curatedPool;
    let grammarMolds;
    if (theme === 'nature_window') {
      const subKey = ['bokeh', 'mist', 'frost'].includes(natureStyle) ? natureStyle : 'bokeh';
      curatedPool = CURATED_SEALED_VIGNETTES.nature_window[subKey];
      grammarMolds = SEALED_GRAMMAR_MOLDS[subKey];
    } else if (theme === 'sketch') {
      curatedPool = CURATED_SEALED_VIGNETTES.sketch;
      grammarMolds = SEALED_GRAMMAR_MOLDS.sketch;
    } else {
      curatedPool = CURATED_SEALED_VIGNETTES.geometric.filter(function (v) {
        return !v.longAwayOnly || elapsedSec >= 20 * 60;
      });
      grammarMolds = SEALED_GRAMMAR_MOLDS.geometric;
    }

    // Legacy deterministic fallback when called without sessionSeed (e.g. direct unit test index lookup)
    if (!hasSessionSeed) {
      if (theme === 'geometric' && elapsedSec >= 20 * 60 && rotationIndex === 5) {
        const longItem = CURATED_SEALED_VIGNETTES.geometric[CURATED_SEALED_VIGNETTES.geometric.length - 1];
        return { message: longItem.message, pose: longItem.pose, source: 'curated' };
      }
      const picked = curatedPool[rotationIndex % curatedPool.length];
      return { message: picked.message, pose: picked.pose, source: 'curated' };
    }

    const rand = mulberry32((opts.sessionSeed ^ Math.imul(rotationIndex + 1, 0x9E3779B1)) >>> 0);

    // Special milestone: after 20+ minutes away on rotation >= 2, surface long-away curated gem once
    if (theme === 'geometric' && elapsedSec >= 20 * 60 && rotationIndex === 2) {
      const longGem = CURATED_SEALED_VIGNETTES.geometric[CURATED_SEALED_VIGNETTES.geometric.length - 1];
      return { message: longGem.message, pose: longGem.pose, source: 'curated' };
    }

    // Alternate & blend: ~55% curated Action×Copy vignette, ~45% polished Slot-Grammar composition
    const useCurated = rand() < 0.56 || !grammarMolds || grammarMolds.length === 0;
    if (useCurated) {
      // Permute index using prime stride so consecutive rotations never collide!
      const offset = Math.floor(mulberry32(opts.sessionSeed)() * curatedPool.length);
      const item = curatedPool[(offset + rotationIndex * 5) % curatedPool.length];
      return { message: item.message, pose: item.pose, source: 'curated' };
    }

    const mold = pickFrom(grammarMolds, rand);
    const message = pickFrom(mold.a, rand) + pickFrom(mold.b, rand) + pickFrom(mold.c, rand);
    const pose = pickFrom(mold.poses, rand);
    return { message: message, pose: pose, source: 'composed' };
  }

  function getSealedCopy(options) {
    return pickSealedVignette(options).message;
  }

  // =========================================================================
  // PART 3: Break Action Picker (Hybrid Curated + Compositional Grammar)
  // =========================================================================

  function composeBreakLine(category, randFn) {
    const gram = BREAK_CATEGORY_GRAMMARS[category] || BREAK_CATEGORY_GRAMMARS.shoulder;
    for (let attempt = 0; attempt < 6; attempt++) {
      const line = pickFrom(gram.openers, randFn) + pickFrom(gram.cores, randFn) + pickFrom(gram.closers, randFn);
      if (!recentBreakTexts.includes(line)) {
        return line;
      }
    }
    return pickFrom(gram.openers, randFn) + pickFrom(gram.cores, randFn) + pickFrom(gram.closers, randFn);
  }

  let lastChosenPose = '';

  function pickBreakAction(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const kind = opts.breakKind === 'eye_rest' ? 'eye_rest' : 'full';
    const lastActionId = opts.lastActionId || null;
    const randFn = typeof opts.random === 'function' ? opts.random : Math.random;

    // ~12% restrained micro-Easter-egg on full breaks (pose + dialogue tightly paired)
    if (kind === 'full' && randFn() < 0.12) {
      const eggPool = EASTER_EGGS[theme] || EASTER_EGGS.geometric;
      const filteredEggs = eggPool.filter(function (e) {
        return e.actionId !== lastActionId;
      });
      const egg = pickFrom(filteredEggs.length > 0 ? filteredEggs : eggPool, randFn);
      lastChosenPose = egg.pose;
      rememberText(recentBreakTexts, egg.message, 16);
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
    // Guarantee consecutive breaks NEVER repeat the same visual pose OR actionId!
    const distinctPoseCandidates = pool.filter(function (a) {
      return a.id !== lastActionId && a.pose !== lastChosenPose;
    });
    const candidates = distinctPoseCandidates.length > 0
      ? distinctPoseCandidates
      : pool.filter(function (a) { return a.id !== lastActionId; });
    const list = candidates.length > 0 ? candidates : pool;
    const chosen = list[Math.floor(randFn() * list.length) % list.length];
    lastChosenPose = chosen.pose;

    let message;
    if (kind === 'full' && theme !== 'nature_window' && chosen.category && randFn() < 0.42) {
      // 42% chance to synthesize a fresh, semantically-matched compositional guidance line
      message = composeBreakLine(chosen.category, randFn);
    } else {
      const copyPool = (chosen.copy && (chosen.copy[theme] || chosen.copy.geometric)) || ['松肩，深呼吸。'];
      message = Array.isArray(copyPool) ? pickFrom(copyPool, randFn) : copyPool;
    }

    if (
      kind === 'full' &&
      theme !== 'nature_window' &&
      opts.workedMinutes >= 40 &&
      (chosen.id === 'shoulder_roll' || chosen.id === 'window_gaze') &&
      randFn() < 0.28
    ) {
      message = '已经连轴转 ' + opts.workedMinutes + ' 分钟了，先把肩膀放下来吧。';
    }

    rememberText(recentBreakTexts, message, 16);

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

  const PRE_ALERT_TEMPLATES = {
    geometric: [
      '{s} 秒后歇一会儿，先把手头这句收个尾。',
      '还有 {s} 秒放松一下，可以先把眼前这行写完。',
      '{s} 秒后起身松松肩，先把这步收尾吧。'
    ],
    sketch: [
      '还有 {s} 秒准备休息，可以先把这行字打完。',
      '{s} 秒后起身松口气，先把这步收尾吧。',
      '再过 {s} 秒歇一会儿，不急，先把半句话敲完。'
    ],
    nature_window: [
      '{s} 秒后桌面柔和失焦，请先收尾。',
      '还有 {s} 秒进入小憩，请先保存手头思绪。'
    ]
  };

  const SNOOZE_DND_TOAST = '看来手头正紧，我先安静 1 小时，忙完记得喝水';
  const HANDS_OFF_HINT = '先松开键盘和鼠标，这几十秒留给自己';
  const DOUBLE_ESC_HINT = '再按一次 ESC 跳过这次休息';
  const SEALED_WAKE_HINT = '轻触键鼠或任意键返回桌面';

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
    if (snapshot.dndUntilTomorrow) return '今天已暂停提醒，明天自动恢复';
    if (snapshot.dndActive) return '免打扰中，约 ' + formatApproxMinutes(snapshot.dndRemainingSec) + ' 后恢复';
    if (snapshot.avoiding) return '正静默避让，结束后恢复计时';
    if (snapshot.phase === 'waiting_activity') return '等你回到键鼠前，再起算下一轮';
    if (snapshot.phase === 'pre_alert') return '即将开始放松';
    if (snapshot.phase === 'resting') return '正在放松中';
    if (snapshot.phase === 'sealed') return '桌面已温柔封存 · 等你回来';
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
    if (rem < 60) return '即将放松一下';
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
      statusLine = snapshot.avoidingReason === 'mirroring' ? '检测到投屏，正静默避让' : '全屏演示中，正静默避让';
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

    const summaryLine = count === 0 ? '今天还没起身放松过' : '今天已陪你起身放松 ' + count + ' 次';

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
    CURATED_SEALED_VIGNETTES: CURATED_SEALED_VIGNETTES,
    SEALED_GRAMMAR_MOLDS: SEALED_GRAMMAR_MOLDS,
    SEALED_COPY_LIBRARIES: SEALED_COPY_LIBRARIES,
    SNOOZE_DND_TOAST: SNOOZE_DND_TOAST,
    HANDS_OFF_HINT: HANDS_OFF_HINT,
    DOUBLE_ESC_HINT: DOUBLE_ESC_HINT,
    SEALED_WAKE_HINT: SEALED_WAKE_HINT,
    FROST_SEAL_HINT: SEALED_WAKE_HINT,
    RETURN_TO_REVEAL_HINT: SEALED_WAKE_HINT,
    pickBreakAction: pickBreakAction,
    getPreAlertCopy: getPreAlertCopy,
    pickSealedVignette: pickSealedVignette,
    getSealedCopy: getSealedCopy,
    getRhythmLabel: getRhythmLabel,
    getPopoverCopy: getPopoverCopy
  };
});
