(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoveNowActions = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * MoveNow v0.1.0 Hybrid Copy & Modular Action Engine:
   * 1. 44 Office-Gentle Full-Break Modules (with two-stage `pose` -> `followupPose` progression at 50% mark!)
   *    + 12 Eye-Rest Modules + 13 Restrained Micro-Easter-Eggs.
   * 2. Doubled Sealed & Break Copy Engine:
   *    - Pool A: Hand-crafted Action × Copy Paired Vignettes (including 窗棂树影 `sunlight`).
   *    - Pool B: Expanded Slot-Grammar Molds (~1,000+ natural, office-graceful combinations).
   * 3. Multi-slot sliding deduplication ring-buffers for actions, poses, and copy lines.
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

  const recentBreakTexts = [];
  const recentActionIds = [];
  const recentPoses = [];
  function rememberItem(buf, val, limit) {
    if (!val) return;
    buf.push(val);
    if (buf.length > limit) buf.shift();
  }

  // =========================================================================
  // PART 1: 44 Office-Gentle Full-Break Modules (with Two-Stage Pose Flow!)
  // =========================================================================
  const FULL_BREAK_ACTIONS = [
    {
      id: 'head_lean',
      pose: 'lean_back',
      followupPose: 'chest_open',
      category: 'neck',
      title: '托后脑舒展',
      copy: {
        geometric: [
          '双手十指交叉托住后脑，慢慢往椅背上靠一会儿。',
          '双手托住后脑，椅背向后仰一点，手头的事不会跑掉。'
        ],
        sketch: [
          '双手托住后脑勺向后仰一仰，把紧绷的肩颈放下来。',
          '十指交叉枕在脑后，往后靠着歇半分钟。'
        ],
        nature_window: ['十指交叉托后脑，向后靠片刻。', '托住后脑，让视线从屏幕挪开。']
      },
      followup: {
        geometric: '手肘轻轻向两侧打开，再顺着呼吸慢慢放下。',
        sketch: '不用急，顺着呼吸把手肘再打开一点。',
        nature_window: '舒展双肘，慢呼气。'
      }
    },
    {
      id: 'chest_open',
      pose: 'chest_open',
      followupPose: 'breath',
      category: 'shoulder',
      title: '背后展肩',
      copy: {
        geometric: [
          '双手背在身后轻轻相扣，把胸口与双肩柔和打开。',
          '手移到身后相握，把缩了半天的肩膀舒展开。'
        ],
        sketch: [
          '站起来，双手背在身后舒展一下胸口和肩膀。',
          '起身把手背到身后，慢慢把含胸的后背拉直。'
        ],
        nature_window: ['双手背后舒展，深呼吸。', '起身展肩，放松胸廓。']
      },
      followup: {
        geometric: '慢慢松开双手垂落身侧，平稳呼吸两次。',
        sketch: '保持几秒，慢慢松开双手自然垂下。',
        nature_window: '松开双手，自然呼吸。'
      }
    },
    {
      id: 'get_water',
      pose: 'water',
      followupPose: 'walk',
      category: 'walk',
      title: '起身接水',
      copy: {
        geometric: [
          '端起水杯去接半杯温水吧，这几十秒也顺便放过手机。',
          '起身去接点温水，顺手把手机留在桌上。'
        ],
        sketch: [
          '端起水杯起身走两步去接点水，也把手机留在桌上。',
          '水杯空了吧，起来接半杯水润润嗓子。'
        ],
        nature_window: ['桌面已暂时遮蔽，放心去接半杯温水吧。', '端起水杯走几步，把视线留在远处。']
      },
      followup: {
        geometric: '小口喝两口温水，不紧不慢走回来就行。',
        sketch: '慢慢喝一口，顺便溜达两步再坐下。',
        nature_window: '喝口温水，从容归位。'
      }
    },
    {
      id: 'window_gaze',
      pose: 'gaze',
      followupPose: 'breath',
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
        nature_window: ['把视线投向窗外最远处，让双目自然放松。', '垂手沉肩，远眺窗外。']
      },
      followup: {
        geometric: '轻轻合上眼睛缓两秒，再慢慢睁开。',
        sketch: '慢慢眨眨眼，闭目歇两秒会更舒服。',
        nature_window: '轻眨双眼，平缓呼吸。'
      }
    },
    {
      id: 'neck_tilt',
      pose: 'neck_tilt_l',
      followupPose: 'neck_tilt_r',
      category: 'neck',
      title: '左右慢侧颈',
      copy: {
        geometric: [
          '双手平放腿上，头慢慢向左侧倾，感受右颈柔和拉长。',
          '肩膀保持下沉，左耳轻轻靠向左肩停一会儿。'
        ],
        sketch: [
          '手离开键盘放腿上，脑袋慢吞吞往左边歪一会儿。',
          '跟着一起向左轻轻歪头，把僵硬的脖子松开。'
        ],
        nature_window: ['双手放腿上，头部轻向左倾。', '松肩，左侧轻拉伸颈部。']
      },
      followup: {
        geometric: '缓缓回正，现在换向右侧慢慢倾过去停一会儿。',
        sketch: '慢悠悠回正，再换右边也歪一会儿，左右对称。',
        nature_window: '回正，换向右侧轻倾。'
      }
    },
    {
      id: 'wrist_shake',
      pose: 'wrist_shake',
      followupPose: 'arm_circle',
      category: 'wrist',
      title: '松腕绕环',
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
        geometric: '顺势把小臂轻轻画个圆，再自然垂回腿上。',
        sketch: '带着手臂柔和画个圈，让指尖和前臂都暖和起来。',
        nature_window: '轻画圆弧，自然垂手。'
      }
    },
    {
      id: 'shoulder_roll',
      pose: 'shoulder_roll',
      followupPose: 'chest_open',
      category: 'shoulder',
      title: '沉肩画圈',
      copy: {
        geometric: [
          '吸气时双肩轻轻耸起，呼气时顺着后背慢悠悠沉下去。',
          '双手垂在身侧，双肩向后画几个不紧不慢的大圈。'
        ],
        sketch: [
          '耸一下肩，再呼一口气把肩膀稳稳放下来。',
          '顺着后背把肩膀慢慢绕两圈，把硬邦邦的斜方肌揉松。'
        ],
        nature_window: ['松肩，深呼吸。', '吸气微耸，呼气沉肩。']
      },
      followup: {
        geometric: '最后把双肩向后微展，让耳肩距离拉长。',
        sketch: '最后一次把肩膀彻底放低、微开胸口，后背会轻很多。',
        nature_window: '微展双肩，保持舒展。'
      }
    },
    {
      id: 'reach_up',
      pose: 'stretch_up',
      followupPose: 'arm_circle',
      category: 'spine',
      title: '上举伸懒腰',
      copy: {
        geometric: [
          '双手十指交叉举过头顶，掌心朝上，温和地伸个长懒腰。',
          '把双手往天花板方向轻轻送高，拉一拉久坐的脊背。'
        ],
        sketch: [
          '坐直或站起来伸个懒腰，把僵住的脊背一节节舒展开。',
          '双手举高伸直，像刚睡醒一样慢吞吞拉一下背。'
        ],
        nature_window: ['双手上举，舒展脊背。', '十指交叉向上延展。']
      },
      followup: {
        geometric: '呼气时双臂从身体两侧画个大圆缓缓落下。',
        sketch: '顺着呼气把手臂从两侧画大圈慢慢放下来。',
        nature_window: '双臂画弧缓落，归于松弛。'
      }
    },
    {
      id: 'deep_breath',
      pose: 'breath',
      followupPose: 'gaze',
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
        geometric: '慢慢睁开眼，把柔和的目光放到最远处。',
        sketch: '轻轻睁开眼看一眼远处，单纯歇口气就很值。',
        nature_window: '缓睁双目，目光放远。'
      }
    },
    {
      id: 'stand_walk',
      pose: 'walk',
      followupPose: 'tiptoe_lift',
      category: 'walk',
      title: '起身走两步',
      copy: {
        geometric: [
          '离开椅子站起来，在旁边慢悠悠走上几步吧。',
          '站起身离开工位一小会儿，让久坐的腰和腿透透气。'
        ],
        sketch: [
          '离开凳子走几步，顺便活动一下发僵的膝盖和脚踝。',
          '站起来在桌边踱两步，回来思路说不定更顺。'
        ],
        nature_window: ['离开座椅，缓步走动片刻。', '起身走两步，舒展下肢。']
      },
      followup: {
        geometric: '站稳后轻轻踮两下脚尖，再从容坐回工位。',
        sketch: '顺带轻轻踮两下脚尖，再慢慢坐回工位。',
        nature_window: '轻踮脚尖，从容归位。'
      }
    },
    {
      id: 'side_bend_lr',
      pose: 'side_bend_l',
      followupPose: 'side_bend_r',
      category: 'spine',
      title: '左右侧腰延展',
      copy: {
        geometric: ['左手扶稳椅边，右手举过头顶向左侧柔和弯腰，把侧肋拉开。'],
        sketch: ['一只手举高往左边慢慢弯一下腰，像小树苗迎风伸展一样。'],
        nature_window: ['单臂过顶向左，轻柔拉伸右侧腰。']
      },
      followup: {
        geometric: '慢慢回正，换左手举高往右侧对称延展几秒。',
        sketch: '换另一边也拉一拉，左右都舒展开最舒服。',
        nature_window: '回正，换向右侧柔和延展。'
      }
    },
    {
      id: 'chin_tuck',
      pose: 'head_cock',
      followupPose: 'lean_back',
      category: 'neck',
      title: '收颌归位',
      copy: {
        geometric: ['不知不觉又探着脖子看屏幕了吧？双手扶膝，把头轻轻水平往后收。'],
        sketch: ['把往前凑的小脑袋往后收一收，让耳朵重新回到肩膀正上方。'],
        nature_window: ['水平微收下颌，还原颈椎曲度。']
      },
      followup: {
        geometric: '保持后颈拉长的感觉，顺势轻靠椅背呼吸两次。',
        sketch: '后脖子是不是轻松了一点？靠着椅背慢呼吸两下。',
        nature_window: '轻靠椅背，平缓呼吸。'
      }
    },
    {
      id: 'scapula_squeeze',
      pose: 'chest_open',
      followupPose: 'hug_self',
      category: 'shoulder',
      title: '夹背与环抱松肩',
      copy: {
        geometric: ['双手握虚拳屈肘在身侧，肩胛骨轻轻向后背中间靠拢。'],
        sketch: ['两只手肘往后背轻轻收拢一下，唤醒睡着的上背部。'],
        nature_window: ['屈肘微收肩胛，舒展前胸。']
      },
      followup: {
        geometric: '再把双手交叉环抱在肩头，反向拉开肩胛骨缝隙。',
        sketch: '现在反过来双手交叉抱抱肩膀，把后背拉得宽宽的。',
        nature_window: '交叉搭肩，舒展上背。'
      }
    },
    {
      id: 'finger_fan',
      pose: 'wrist_shake',
      followupPose: 'breath',
      category: 'wrist',
      title: '十指扇形张合',
      copy: {
        geometric: ['双手离开桌面举到胸前，五指尽量张开成扇形，再轻轻握拳。'],
        sketch: ['把敲字敲累的手指大大张开停两秒，再软软合拢。'],
        nature_window: ['张开十指，轻握再舒展。']
      },
      followup: {
        geometric: '像弹空气钢琴一样依次动动手指，再平放腿上。',
        sketch: '随手动动大拇指和小指，再把手安稳放回膝上。',
        nature_window: '活动指节，覆膝静息。'
      }
    },
    {
      id: 'palm_warm',
      pose: 'paw_groom',
      followupPose: 'gaze',
      category: 'eye',
      title: '暖掌敷眼与远望',
      copy: {
        geometric: ['把双手掌心对搓到微热，轻轻空心覆在闭上的眼睛上。'],
        sketch: ['搓热手心盖住眼眶（别压眼球哦），安安静静享受片刻温热。'],
        nature_window: ['搓热掌心，轻覆双目小憩。']
      },
      followup: {
        geometric: '缓缓移开双手，顺着柔和光线望向最远处。',
        sketch: '慢慢拿开双手眨眨眼，往远处看一眼适应光线。',
        nature_window: '缓移双手，放远视线。'
      }
    },
    {
      id: 'ankle_pump',
      pose: 'tiptoe_lift',
      followupPose: 'walk',
      category: 'walk',
      title: '起身缓慢提踵',
      copy: {
        geometric: ['扶着桌沿站起来，慢慢踮起脚尖停两秒，再轻轻落回地面。'],
        sketch: ['站起来温和地踮几下脚尖，帮久坐不动的小腿把血液泵上来。'],
        nature_window: ['扶桌起身，缓慢提踵数次。']
      },
      followup: {
        geometric: '顺便左右轮流转两圈脚踝，轻走两步放松小腿。',
        sketch: '再晃晃脚腕原地走两步，腿脚一下就暖和了。',
        nature_window: '轻转脚踝，缓步活络。'
      }
    },
    {
      id: 'jaw_unclench',
      pose: 'cheek_rest',
      followupPose: 'breath',
      category: 'breath',
      title: '松开牙关与眉心',
      copy: {
        geometric: ['双手离开键鼠，检查一下：后槽牙是不是正咬紧着？轻轻松开它。'],
        sketch: ['专注久了容易不自觉皱眉咬牙，把舌尖轻抵上颚、松开下巴吧。'],
        nature_window: ['松开牙关，抚平眉心。']
      },
      followup: {
        geometric: '连着眉心、眼角和肩膀一起顺着呼气往下沉。',
        sketch: '轻轻呼出一口长气，整张脸都柔和下来。',
        nature_window: '面部松弛，平稳呼气。'
      }
    },
    {
      id: 'butterfly_hug',
      pose: 'hug_self',
      followupPose: 'shoulder_roll',
      category: 'shoulder',
      title: '交叉轻拍双肩',
      copy: {
        geometric: ['双手交叉搭在对侧肩膀上，像拥抱自己一样左右轻拍几下。'],
        sketch: ['两手交叉抱住自己的肩膀，慢吞吞轻轻拍两下安抚紧绷的神经。'],
        nature_window: ['双手交叉搭肩，轻缓呼吸。']
      },
      followup: {
        geometric: '放下双手，顺势向后轻轻滚一圈肩膀。',
        sketch: '深吸一口气放下手，再把肩膀往后轻轻绕一圈。',
        nature_window: '沉手绕肩，恢复平静。'
      }
    },
    {
      id: 'torso_twist',
      pose: 'torso_twist_r',
      followupPose: 'torso_twist_l',
      category: 'spine',
      title: '坐姿左右慢转体',
      copy: {
        geometric: ['双脚踩稳地面，双手轻扶右侧椅背，带动上身慢慢向右转望。'],
        sketch: ['坐直身子扶着椅背往右后方看一眼，给久坐的腰背松松绑。'],
        nature_window: ['轻扶椅背，向右侧缓转上身。']
      },
      followup: {
        geometric: '平稳回正，现在换扶左侧椅背，慢慢向左边转望。',
        sketch: '回正后再往左边也柔和转一转，两边腰背都舒坦。',
        nature_window: '回正，换向左侧轻转。'
      }
    },
    {
      id: 'table_stretch',
      pose: 'table_bow',
      followupPose: 'stretch_up',
      category: 'spine',
      title: '扶桌俯身延展',
      copy: {
        geometric: ['退开椅子半步站起来，双手扶住桌沿向后退，温和拉长整个后背。'],
        sketch: ['站起来双手扶住桌沿往后退半步，把拱了一上午的后背拉得平平直直。'],
        nature_window: ['起身扶桌后退半步，延展脊柱。']
      },
      followup: {
        geometric: '缓慢站直身体，顺势向上轻轻伸展一下。',
        sketch: '慢慢直起腰来向上舒展一下，背会轻快不少。',
        nature_window: '缓慢起身，向上轻展。'
      }
    },
    {
      id: 'focus_ladder',
      pose: 'mote_track',
      followupPose: 'gaze',
      category: 'eye',
      title: '三点远近调焦',
      copy: {
        geometric: ['双手放在膝上，视线依次看一眼桌角、房间对面、再望向窗外最远处。'],
        sketch: ['带着眼睛散个步：看看桌角，看看远处的墙，再看看窗外的天。'],
        nature_window: ['视线由近及远，逐级放远焦点。']
      },
      followup: {
        geometric: '把目光留在最远的地方多停五秒钟，不急着收回。',
        sketch: '在最远的地方停一会儿，让眼球彻底歇口气。',
        nature_window: '停驻远方，放松晶状体。'
      }
    },
    {
      id: 'sky_breath',
      pose: 'walk',
      followupPose: 'gaze',
      category: 'walk',
      title: '移步窗边透气',
      copy: {
        geometric: ['离开工位走到窗边站半分钟吧，看看今天外面的天色和树影。'],
        sketch: ['从屏幕前撤出来，走到窗边看看外面的光线和云吧。'],
        nature_window: ['移步窗边，感受自然天光。']
      },
      followup: {
        geometric: '把手机留在工位上，单纯远望吹口气再回来。',
        sketch: '不带手机在窗边站十几秒，脑子会清醒很多。',
        nature_window: '静立远望，清空杂念。'
      }
    },
    // --- V1.0.1 Newly Added 22 Office-Gentle Full-Silhouette Modules (23..44) ---
    {
      id: 'big_arm_halo',
      pose: 'arm_circle',
      followupPose: 'breath',
      category: 'shoulder',
      title: '双臂慢画大圆',
      copy: {
        geometric: ['坐稳或站立，双臂从身侧沿着最大半径慢慢向上画一个圆弧。'],
        sketch: ['把两只手从身侧慢悠悠举高再从两侧画大圈落下，给肩关节上点润滑油。'],
        nature_window: ['双臂沿身侧柔和画圆舒展。']
      },
      followup: {
        geometric: '配合慢呼气再画最后一圈，双手轻落膝头。',
        sketch: '顺着长长的呼气慢慢落回腿上，肩膀立刻松快下来。',
        nature_window: '随呼气缓落，静息片刻。'
      }
    },
    {
      id: 'temple_gentle_rub',
      pose: 'temple_rub',
      followupPose: 'breath',
      category: 'eye',
      title: '指腹轻揉太阳穴',
      copy: {
        geometric: ['抬起双手，用指腹在太阳穴和眉弓外侧极轻地打圈按揉几下。'],
        sketch: ['用温热的指腹轻轻揉两下太阳穴，把紧绷的脑门揉松快。'],
        nature_window: ['指腹轻揉太阳穴，舒缓眼周。']
      },
      followup: {
        geometric: '放下双手闭目两秒，感受额头的紧绷慢慢散开。',
        sketch: '把手放回腿上，闭眼歇两秒钟吧。',
        nature_window: '垂手闭目，卸下紧绷。'
      }
    },
    {
      id: 'ear_warm_pinch',
      pose: 'temple_rub',
      followupPose: 'neck_tilt_l',
      category: 'neck',
      title: '轻捏耳廓暖头颈',
      copy: {
        geometric: ['双手抬起，从耳垂到耳尖轻轻揉捏一遍双耳，头部会很快放松下来。'],
        sketch: ['两手轻轻捏一捏耳朵边缘，久坐发木的脑袋一下子就暖和了。'],
        nature_window: ['轻柔按捏耳廓，活络头颈。']
      },
      followup: {
        geometric: '放下双手，顺势把头轻轻偏向一侧歇两秒。',
        sketch: '放下手，顺便歪一下小脑袋松松脖子。',
        nature_window: '垂手松肩，微倾颈部。'
      }
    },
    {
      id: 'seated_cat_cow',
      pose: 'hug_self',
      followupPose: 'chest_open',
      category: 'spine',
      title: '坐姿猫牛柔脊',
      copy: {
        geometric: ['双手扶膝，呼气时轻轻含胸拱背、低头看肚脐，拉开整条后背。'],
        sketch: ['坐在椅子上先轻轻拱起后背低头，把紧绷的背肌拉开。'],
        nature_window: ['扶膝微拱后背，舒展脊柱。']
      },
      followup: {
        geometric: '吸气时反过来微挺胸口、双肩后展，让脊柱柔和流动起来。',
        sketch: '再慢慢吸气打开胸口微抬头，一收一展最解乏。',
        nature_window: '吸气微展前胸，柔顺脊背。'
      }
    },
    {
      id: 'prayer_wrist_stretch',
      pose: 'paw_groom',
      followupPose: 'wrist_shake',
      category: 'wrist',
      title: '合十沉腕拉伸',
      copy: {
        geometric: ['双手在胸前掌心合十，保持掌根贴合，把双腕轻轻向下沉一点。'],
        sketch: ['胸前双手合十慢慢往下沉手腕，拉一拉敲键盘发紧的小臂内侧。'],
        nature_window: ['胸前合十微沉手腕，拉伸前臂。']
      },
      followup: {
        geometric: '松开合十的双手，轻柔抖松手腕与十指。',
        sketch: '松开手轻轻晃两下手腕，前臂舒服多啦。',
        nature_window: '松开双手，轻柔甩腕。'
      }
    },
    {
      id: 'reverse_wrist_press',
      pose: 'wrist_shake',
      followupPose: 'breath',
      category: 'wrist',
      title: '手背轻贴松腕背',
      copy: {
        geometric: ['双手手背在胸前轻轻相贴，指尖朝下停住五秒，舒缓握鼠标的手腕背侧。'],
        sketch: ['换手背贴手背停几秒钟，专门安抚点了一上午鼠标的手腕。'],
        nature_window: ['手背轻贴片刻，舒缓腕背。']
      },
      followup: {
        geometric: '缓缓放下双手平铺腿上，让前臂彻底卸力。',
        sketch: '放回腿上软软摊开手心，歇一口气。',
        nature_window: '平放双掌，自然放松。'
      }
    },
    {
      id: 'neck_half_moon',
      pose: 'neck_tilt_r',
      followupPose: 'neck_tilt_l',
      category: 'neck',
      title: '下颌轻画半圆',
      copy: {
        geometric: ['不要向后仰脖子，只让下巴贴近锁骨前侧，从右肩慢慢滑向左肩。'],
        sketch: ['低头让下巴顺着锁骨前边慢吞吞画个小半圆，别往后仰头哦。'],
        nature_window: ['微低头，下颌沿锁骨轻画半弧。']
      },
      followup: {
        geometric: '再从左肩缓缓滑回中间，抬起头平视远方。',
        sketch: '再慢悠悠滑回正中间，抬起头来深呼吸一下。',
        nature_window: '缓滑回正，平视远方。'
      }
    },
    {
      id: 'pelvic_stand_shift',
      pose: 'walk',
      followupPose: 'chest_open',
      category: 'walk',
      title: '站立重心轻移',
      copy: {
        geometric: ['站起身双脚与肩同宽，把身体重心极其轻缓地在左右脚之间来回转移。'],
        sketch: ['站起来双脚踩稳，像钟摆一样慢悠悠左右换换重心，松开久坐的髋部。'],
        nature_window: ['起身站立，左右轻移重心。']
      },
      followup: {
        geometric: '回到双脚均分重心，微开双肩深吸一口气。',
        sketch: '站稳当之后打开肩膀吸口气，整个人都稳了。',
        nature_window: '双足站稳，展肩深呼吸。'
      }
    },
    {
      id: 'seated_heel_toe',
      pose: 'tiptoe_lift',
      followupPose: 'breath',
      category: 'walk',
      title: '桌下脚尖脚跟交替',
      copy: {
        geometric: ['双手搭在腿上，双脚在桌下先立起脚尖，再落下换勾起脚尖，重复几次。'],
        sketch: ['不用大动静：手放腿上，脚在桌子底下悄悄交替踮脚尖、勾脚背。'],
        nature_window: ['双手覆膝，足尖足跟轻缓交替。']
      },
      followup: {
        geometric: '双脚平踩回地面，感受小腿温热松弛下来。',
        sketch: '把脚平平踩稳地面，久坐发胀的小腿会轻松不少。',
        nature_window: '双足平踏，安稳呼吸。'
      }
    },
    {
      id: 'infinity_eye_trace',
      pose: 'mote_track',
      followupPose: 'paw_groom',
      category: 'eye',
      title: '视线慢画横 8 字',
      copy: {
        geometric: ['头部不动，带着目光在远处空气里极慢地画两个横向的“∞”字。'],
        sketch: ['脑袋保持不动，只用眼神在前面空气里慢吞吞画个大大的横 8 字。'],
        nature_window: ['头部不动，视线在远处慢画横 8 字。']
      },
      followup: {
        geometric: '停下视线，搓热掌心轻覆眼眶歇几秒。',
        sketch: '画完啦，闭上眼用手心暖一暖眼周吧。',
        nature_window: '停驻闭目，温掌护眼。'
      }
    },
    {
      id: 'clavicle_tap',
      pose: 'hug_self',
      followupPose: 'breath',
      category: 'breath',
      title: '轻叩锁骨顺气',
      copy: {
        geometric: ['双手食指与中指并拢，在锁骨下方轻轻点叩几下，配合悠长呼气。'],
        sketch: ['抬起手在锁骨下面轻轻拍点几下，把闷在胸口的气顺开。'],
        nature_window: ['轻抚锁骨下方，拉长呼气。']
      },
      followup: {
        geometric: '双手放回膝上，感受胸廓自然起伏。',
        sketch: '把手放下来，安安静静听一次自己的呼吸。',
        nature_window: '垂手静坐，胸廓舒展。'
      }
    },
    {
      id: 'w_shoulder_drop',
      pose: 'stretch_up',
      followupPose: 'chest_open',
      category: 'shoulder',
      title: '上举变 W 字沉肘',
      copy: {
        geometric: ['双臂柔和举高，呼气时屈肘向下沉成“W”字形，唤醒后背下侧肌群。'],
        sketch: ['双手举高再顺着呼气弯手肘往下收成 W 字，专治敲键盘圆肩驼背。'],
        nature_window: ['双臂上举，随呼气屈肘微收成 W 形。']
      },
      followup: {
        geometric: '再做一次轻柔下沉，然后彻底松开双肩。',
        sketch: '慢慢放下手臂抖一抖肩，后背立刻挺拔起来。',
        nature_window: '缓落双臂，放松斜方肌。'
      }
    },
    {
      id: 'ribcage_breath',
      pose: 'hug_self',
      followupPose: 'gaze',
      category: 'breath',
      title: '双手扶肋深呼吸',
      copy: {
        geometric: ['双手轻轻扶在身体两侧肋骨上，吸气时感受肋骨向左右手心微微推开。'],
        sketch: ['两只手扶在腰侧肋骨旁，深吸一口气感受胸腔像风琴一样往两边推开。'],
        nature_window: ['双手轻扶侧肋，感受横向深呼吸。']
      },
      followup: {
        geometric: '呼气时感受肋骨温柔回落，目光自然投向远方。',
        sketch: '慢慢吐气让肋骨收回来，再抬头看一眼窗外。',
        nature_window: '随呼气内收，放远目光。'
      }
    },
    {
      id: 'doorway_stand_open',
      pose: 'walk',
      followupPose: 'chest_open',
      category: 'walk',
      title: '起身微展髋胸',
      copy: {
        geometric: ['推开椅子站起来，双手扶在后腰上方，身体极其轻缓地舒展一下前侧。'],
        sketch: ['坐太久髋部都折着啦，站起来双手扶后腰，轻轻把身体前侧舒展开。'],
        nature_window: ['起身站立，双手扶腰轻展前侧。']
      },
      followup: {
        geometric: '回正站稳，放松双臂做一次深呼吸。',
        sketch: '站直回正，垂下双手舒舒服服喘口气。',
        nature_window: '回正站稳，自然垂臂。'
      }
    },
    {
      id: 'diagonal_neck_smell',
      pose: 'neck_tilt_l',
      followupPose: 'neck_tilt_r',
      category: 'neck',
      title: '斜向低头松肩胛提肌',
      copy: {
        geometric: ['右手背在身后，头转向左侧 45 度并轻轻低头，拉伸最易酸痛的颈后侧。'],
        sketch: ['脑袋往左前方轻轻低下去一点，把脖子后面最酸的那根筋温柔拉开。'],
        nature_window: ['头部轻向左前微低，舒展右颈后侧。']
      },
      followup: {
        geometric: '缓慢抬头回正，换转向右前方 45 度轻轻低头。',
        sketch: '慢吞吞抬起头，再换往右前方轻轻低一会儿。',
        nature_window: '回正，换向右前轻柔延展。'
      }
    },
    {
      id: 'thumb_palm_press',
      pose: 'paw_groom',
      followupPose: 'wrist_shake',
      category: 'wrist',
      title: '轻按虎口与掌心',
      copy: {
        geometric: ['离开鼠标，用左手拇指在右手虎口与掌心轻轻按揉几秒。'],
        sketch: ['拿开握鼠标的右手，用左手大拇指轻轻揉两下虎口和掌心。'],
        nature_window: ['双手离键，互相轻揉虎口掌心。']
      },
      followup: {
        geometric: '换右手拇指也按揉一下左手虎口，再轻甩双手。',
        sketch: '换另一只手也揉两下，两边手掌都松快了。',
        nature_window: '换手轻揉，自然松腕。'
      }
    },
    {
      id: 'soft_blink_bath',
      pose: 'breath',
      followupPose: 'gaze',
      category: 'eye',
      title: '羽毛慢眨润眼',
      copy: {
        geometric: ['双手放腿上，像羽毛落下一样极轻、极慢地完整眨眼六次，铺开泪膜。'],
        sketch: ['盯代码盯久了眨眼会变少，现在慢吞吞完整合上眼皮再睁开，重复五六次。'],
        nature_window: ['双手放膝，极轻极慢完整眨眼数次。']
      },
      followup: {
        geometric: '眨完后把润泽的视线轻轻投向房间最远处。',
        sketch: '眼睛润一点了吧？顺势往最远的地方看几秒。',
        nature_window: '双目润泽，静望远方。'
      }
    },
    {
      id: 'single_shoulder_drop',
      pose: 'side_bend_r',
      followupPose: 'side_bend_l',
      category: 'shoulder',
      title: '交替沉肩松鼠标手',
      copy: {
        geometric: ['常用鼠标的那侧肩膀往往更高——特意把右肩往下沉低一点，头微偏左。'],
        sketch: ['握鼠标的右肩膀是不是不知不觉端着？特意把它往下放低，松一口气。'],
        nature_window: ['有意识沉低右侧肩膀，卸下紧绷。']
      },
      followup: {
        geometric: '再把左肩也沉到同样低的位置，双肩平齐放松。',
        sketch: '再把左边肩膀也对齐放平，两边一样高最舒服。',
        nature_window: '双肩对齐下沉，平缓呼吸。'
      }
    },
    {
      id: 'back_chair_reach',
      pose: 'torso_twist_l',
      followupPose: 'torso_twist_r',
      category: 'spine',
      title: '轻搭椅背微开胸',
      copy: {
        geometric: ['坐稳椅子前半段，左手向后轻搭椅背边缘，微侧身打开左胸前侧。'],
        sketch: ['往前坐半格，一只手往后搭住椅背轻轻打开胸口前侧。'],
        nature_window: ['单手后搭椅背，柔和舒展前胸。']
      },
      followup: {
        geometric: '慢慢换右手向后搭住椅背，对称打开右侧胸口。',
        sketch: '换另一只手也往后搭一下，把缩着的胸口轻轻展开。',
        nature_window: '换侧轻搭椅背，对称舒展。'
      }
    },
    {
      id: 'warm_cup_hold',
      pose: 'water',
      followupPose: 'breath',
      category: 'breath',
      title: '双手捧杯暖手歇息',
      copy: {
        geometric: ['如果手边有水杯，双手捧住杯壁暖一暖手指，喝一小口水。'],
        sketch: ['捧起桌上的杯子暖暖手指、润一口水；要是空了就起身去续半杯吧。'],
        nature_window: ['捧杯饮一口温水，让双手离开键盘。']
      },
      followup: {
        geometric: '放下杯子，顺着呼吸安静发呆十秒钟。',
        sketch: '放下杯子什么都不干，光明正大发十秒钟呆。',
        nature_window: '放下水杯，静心留白片刻。'
      }
    },
    {
      id: 'calf_back_step',
      pose: 'table_bow',
      followupPose: 'walk',
      category: 'walk',
      title: '扶椅后撤拉小腿',
      copy: {
        geometric: ['起身扶稳椅背，右脚向后撤半步、脚跟轻踩地面，温和拉伸小腿后侧。'],
        sketch: ['站起来扶着椅子，一只脚往后撤半步踩实脚跟，拉一拉发紧的小腿肚。'],
        nature_window: ['起身扶椅，单足后撤轻拉小腿。']
      },
      followup: {
        geometric: '收回右脚，换左脚向后撤半步同样轻踩地面几秒。',
        sketch: '换另一只脚往后踩一踩，两条腿都松快松快。',
        nature_window: '换足后撤轻展，从容回位。'
      }
    },
    {
      id: 'box_calm_breath',
      pose: 'arm_circle',
      followupPose: 'breath',
      category: 'breath',
      title: '四拍方盒稳心呼吸',
      copy: {
        geometric: ['双手轻放腿上：慢吸四秒、轻停两秒、再绵长呼气六秒，稳住心率。'],
        sketch: ['脑子转太快的时候，跟着做两次慢吸长呼，给思绪降降温。'],
        nature_window: ['慢吸四秒，轻停片刻，缓呼六秒。']
      },
      followup: {
        geometric: '保持这份平稳的节奏，等倒计时自然归零。',
        sketch: '保持不紧不慢的呼吸，等会儿从容接着忙。',
        nature_window: '呼吸绵长，身心安顿。'
      }
    }
  ];

  // Polished Compositional Break Grammars (strictly keyed by category, expanded for 2x variety!)
  const BREAK_CATEGORY_GRAMMARS = {
    neck: {
      openers: ['先把双手从键鼠上挪开，', '把双手轻轻搭在腿上，', '停下敲字的手，', '离开屏幕半尺坐稳，'],
      cores: [
        '让下巴微微内收，把前探的脖子慢慢退回肩膀正上方',
        '头向一侧轻轻倾过去，给紧绷的颈侧留出舒展的空间',
        '十指交叉托住后脑往后靠，让颈椎卸下头部的重量',
        '低头让下颌贴近锁骨轻画小半弧，温和松开后颈'
      ],
      closers: ['。', '，慢呼吸两次。', '，手头的事不会跑掉。', '，回来脖子会轻快不少。']
    },
    shoulder: {
      openers: ['松开握鼠标的手，', '双手自然垂落身侧，', '先停下手头这半行，', '把端着的肩膀放下来，'],
      cores: [
        '吸气微耸双肩，呼气时把肩膀重重沉回原位',
        '带着双肩向后慢慢绕两个大圈，揉开僵住的斜方肌',
        '把手背到身后轻轻相扣，把缩了半天的胸口打开',
        '双臂沿身侧柔和画个圆弧，给肩背松松绑'
      ],
      closers: ['。', '，顺便长舒一口气。', '，把耳肩距离拉长一点。', '，给上背部放个短假。']
    },
    spine: {
      openers: ['离开椅背坐直一点，', '不妨站起身来，', '把椅子轻轻往后推开半步，', '双脚稳稳踩实地面，'],
      cores: [
        '双手十指交叉举向头顶，温和地伸个长长的懒腰',
        '单手举高向侧面轻轻弯一弯，把久坐折叠的侧腰拉开',
        '顺着呼吸把脊背一节一节向上延展开',
        '轻扶椅背向侧面缓转上身，活动一下僵住的胸腰椎'
      ],
      closers: ['。', '，不用急着坐回去。', '，让腰椎松一口气。', '，两边对称舒展最舒服。']
    },
    wrist: {
      openers: ['双手彻底离开键盘鼠标，', '把忙碌了半天的双手抬起来，', '停下敲击，', '松开紧握鼠标的指节，'],
      cores: [
        '正反各慢悠悠转三圈手腕，再轻飘飘甩掉紧绷感',
        '五指尽量张开停两秒再松开，给指关节解解乏',
        '轻轻晃动手腕与前臂，让指尖重新暖和起来',
        '掌心合十微沉手腕停几秒，舒缓敲字发酸的小臂'
      ],
      closers: ['。', '，这几十秒留给双手休息。', '，指尖松快了打字更顺。']
    },
    eye: {
      openers: ['把双手安稳放在膝盖上，', '先别急着看手机，', '垂下双手沉住双肩，', '把视线从像素格里抽出来，'],
      cores: [
        '把视线投向窗外最远的一棵树或屋顶，让眼睛自然放松',
        '轻慢而完整地眨眼七八次，润一润发干的眼眶',
        '搓热掌心轻轻覆在闭着的双眼上，给视线放个短假',
        '由近及远逐级看向窗外最远处，替晶状体解解乏'
      ],
      closers: ['。', '，让睫状肌彻底松下来。', '，回来画面会更清爽。']
    },
    walk: {
      openers: ['把手机留在桌上，', '趁现在思路刚告一段落，', '推开椅子站起来，', '离开工位半分钟，'],
      cores: [
        '端起杯子去接半杯温水，顺便活动一下发沉的双腿',
        '在旁边不紧不慢走上几步，顺带轻轻踮两下脚尖',
        '走到窗边站半分钟透透气，换一换脑子里的空气',
        '扶着桌沿缓慢提踵几次，帮下肢恢复轻快循环'
      ],
      closers: ['。', '，回来写得更顺。', '，不用赶时间。', '，久坐的腰腿都会感谢你。']
    },
    breath: {
      openers: ['双手掌心向上搭在腿上，', '轻轻合上眼皮，', '把紧咬的后槽牙松开，', '抚平不自觉皱起的眉心，'],
      cores: [
        '用鼻子慢吸四秒，再顺着肩膀下沉慢慢呼出六秒',
        '什么都不去想，只专心做三次绵长平稳的深呼吸',
        '把拧着的眉心和肩膀一起顺着呼气放下来',
        '安静留白半分钟，让高速运转的大脑挂一会儿空挡'
      ],
      closers: ['。', '，给大脑留白半分钟。', '，松弛下来效率反而更高。']
    }
  };

  // 12 Eye-Rest Modules (for 20m Dual-Rhythm Corner Card)
  const EYE_REST_ACTIONS = [
    {
      id: 'eye_far_gaze',
      pose: 'gaze',
      title: '远眺护眼',
      copy: {
        geometric: ['往远处看十几秒，让眼睛从屏幕里松一松。', '视线越过显示器，找一个最远的点停一会儿。'],
        sketch: ['先停一下，望向窗外最远处眨眨眼。', '看看远处的屋顶或树梢，帮眼睛松松绑。'],
        nature_window: ['把视线投向窗外最远处，让双目放松片刻。', '远眺窗外，放松双目。']
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
      pose: 'paw_groom',
      title: '掌心温敷',
      copy: {
        geometric: ['双手轻轻搓热，空心覆在闭着的双眼上歇十几秒。'],
        sketch: ['搓热掌心轻盖住眼眶（别压眼球），享受十几秒温热。'],
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
    },
    {
      id: 'eye_green_tree',
      pose: 'gaze',
      title: '寻绿远看',
      copy: {
        geometric: ['往窗外找一抹绿色植物或开阔天空，静静看上十秒。'],
        sketch: ['看看窗外的树叶或远处的云，给眼睛换换颜色。'],
        nature_window: ['静看窗外绿意与天光。']
      }
    },
    {
      id: 'eye_temple_touch',
      pose: 'temple_rub',
      title: '轻触太阳穴',
      copy: {
        geometric: ['指腹轻轻点揉两下太阳穴，顺便把视线移开屏幕。'],
        sketch: ['抬手轻轻揉一下太阳穴，让酸胀的眼角松口气。'],
        nature_window: ['轻揉太阳穴，移开近处视线。']
      }
    },
    {
      id: 'eye_figure_eight',
      pose: 'mote_track',
      title: '横向画 8 字',
      copy: {
        geometric: ['头不动，眼睛轻轻在远处空气里慢画两个横 8 字。'],
        sketch: ['只动眼球在远处慢悠悠画个横 8 字，活动眼周小肌肉。'],
        nature_window: ['目光在远方轻画横 8 字。']
      }
    },
    {
      id: 'eye_screen_distance',
      pose: 'lean_back',
      title: '后靠拉远视距',
      copy: {
        geometric: ['身体往椅背上一靠，先把眼睛离屏幕的距离拉开一倍。'],
        sketch: ['往后靠回椅背上，别不知不觉把脸贴到屏幕前啦。'],
        nature_window: ['轻靠椅背，拉开视距放松。']
      }
    },
    {
      id: 'eye_soft_unfocus',
      pose: 'gaze',
      title: '放空漫视',
      copy: {
        geometric: ['不盯着任何字，用余光柔和感受整个房间的光线十几秒。'],
        sketch: ['不用看清任何字，放空眼神发十几秒小呆就好。'],
        nature_window: ['收回聚光焦点，柔和漫视片刻。']
      }
    },
    {
      id: 'eye_warm_sip',
      pose: 'water',
      title: '润口歇眼',
      copy: {
        geometric: ['端起水杯抿一口水，眼睛顺便往屏幕外看十秒。'],
        sketch: ['喝口水的工夫，顺便把目光投到房间最远处歇一歇。'],
        nature_window: ['轻抿温水，目光停驻远方。']
      }
    }
  ];

  // 13 Cohesive Micro-Easter-Eggs (~12% chance on full breaks)
  const EASTER_EGGS = {
    geometric: [
      {
        tag: 'tea',
        pose: 'tea_blow',
        followupPose: 'tea',
        actionId: 'egg_geo_tea',
        title: '热茶片刻',
        message: '泡了杯热茶吹吹热气，你也起身去接半杯温水吧。',
        followup: '喝两口水歇口气，这几十秒也把手机留在桌上。'
      },
      {
        tag: 'mote',
        pose: 'mote_track',
        followupPose: 'gaze',
        actionId: 'egg_geo_mote',
        title: '放空追光',
        message: '跟着飘过的小光点发会儿呆，让绷紧的脑子挂个空挡。',
        followup: '顺便沉下肩膀，往窗外远处看几秒。'
      },
      {
        tag: 'tea',
        pose: 'tea',
        followupPose: 'breath',
        actionId: 'egg_geo_tea_2',
        title: '温水小憩',
        message: '端起水杯缓一缓吧，手头的事等会儿再接着写。',
        followup: '慢呼吸两次，回来思路更清楚。'
      },
      {
        tag: 'halo',
        pose: 'arm_circle',
        followupPose: 'happy_squint',
        actionId: 'egg_geo_halo',
        title: '伸展充电',
        message: '连轴转了这么久，陪我一起慢悠悠画个大圆松松肩吧。',
        followup: '肩膀放下来的这一刻，效率其实已经在回血了。'
      },
      {
        tag: 'cheek',
        pose: 'cheek_rest',
        followupPose: 'lean_back',
        actionId: 'egg_geo_daydream',
        title: '光明正大发呆',
        message: '批准这四十五秒什么都不想，托着腮帮子发会儿呆。',
        followup: '往椅背上靠一靠，长舒一口气。'
      }
    ],
    sketch: [
      {
        tag: 'yawn',
        pose: 'yawn',
        followupPose: 'stretch_up',
        actionId: 'egg_sketch_yawn',
        title: '打个哈欠',
        message: '跟着打个不赶时间的哈欠，把攒了一阵的困意吐出去。',
        followup: '顺手温和伸个懒腰，不用急着把手指放回键盘。'
      },
      {
        tag: 'tea',
        pose: 'water',
        followupPose: 'walk',
        actionId: 'egg_sketch_cup',
        title: '喝口温水',
        message: '端起小杯子喝口温水，顺便让握鼠标的手歇一会儿。',
        followup: '站起来走两步，也把手机留在桌上吧。'
      },
      {
        tag: 'butterfly',
        pose: 'butterfly',
        followupPose: 'gaze',
        actionId: 'egg_sketch_fly',
        title: '看会儿窗外',
        message: '哪怕只是看着窗外发半分钟呆，也是正经的充电。',
        followup: '眨眨眼睛，把紧绷的肩膀放下来。'
      },
      {
        tag: 'groom',
        pose: 'paw_groom',
        followupPose: 'breath',
        actionId: 'egg_sketch_groom',
        title: '揉暖眼周',
        message: '小狗都在认真揉脸放松啦，你也搓热手心暖一暖眼睛吧。',
        followup: '放下手慢慢深呼吸一次，神清气爽。'
      },
      {
        tag: 'bow',
        pose: 'table_bow',
        followupPose: 'chest_open',
        actionId: 'egg_sketch_bow',
        title: '小狗拉背法',
        message: '学小狗伸个长长的护脊懒腰：起身扶桌后退半步拉直后背。',
        followup: '慢慢站直打开肩膀，腰背一下就松开了。'
      }
    ],
    nature_window: [
      {
        tag: 'warm_sunbeam',
        pose: 'gaze',
        actionId: 'egg_nature_sun',
        title: '窗棂晴光',
        message: '窗边树影正随风轻晃，让视线也跟着歇一会儿吧。',
        followup: '离开座椅走两步，从容归位。'
      },
      {
        tag: 'mist_calm',
        pose: 'breath',
        actionId: 'egg_nature_mist',
        title: '听风留白',
        message: '给屏幕和思绪留一小片空白，起身喝口温水。',
        followup: '松开双肩，平缓呼吸。'
      },
      {
        tag: 'frost_clear',
        pose: 'breath',
        actionId: 'egg_nature_frost',
        title: '清凉醒神',
        message: '让发烫的注意力降降温，站起来远望半分钟。',
        followup: '轻眨双目，清爽归位。'
      }
    ]
  };

  // =========================================================================
  // PART 2: Doubled Sealed Mode Hybrid Engine (incl. `sunlight` 窗棂树影!)
  // =========================================================================

  const CURATED_SEALED_VIGNETTES = {
    geometric: [
      { pose: 'guardian', message: '工位临时托管中，本人被劝去喝水了。' },
      { pose: 'tea_blow', message: '代班福利：趁正主起身活动，先替他捧会儿这杯热茶。' },
      { pose: 'mote_track', message: '刚才有一束三棱镜微光掠过屏幕，等他回来转告。' },
      { pose: 'nod_doze', message: '没打瞌睡，只是开启了圆球零重力漂浮省电模式。' },
      { pose: 'cheek_rest', message: '代班看屏幕中——别看我，我只是一颗有弹性的几何体。' },
      { pose: 'patrol_scan', message: '正在头顶平衡三颗鹅卵石巡视桌面，正主很快归位。' },
      { pose: 'asym_stretch', message: '趁主人去松肩膀，我在屏幕里练习一下软体分身术。' },
      { pose: 'walk', message: '人去茶水间走动了，我在屏幕两侧传送门之间替他凑步数。' },
      { pose: 'guardian', message: '短暂离开人体工学椅，灵感正在茶水间加载…' },
      { pose: 'shoulder_roll', message: '人去拯救颈椎了，有急事请稍等几分钟。' },
      { pose: 'gaze', message: '去跟窗外的树对视一会儿，马上回来。' },
      { pose: 'happy_squint', message: '终于把这位久坐选手劝离工位了，原地Q弹蹦三下庆祝。' },
      { pose: 'tea', message: '屏幕与肩膀都已挂上空挡，接杯温水就回。' },
      { pose: 'walk', message: '在玻璃巨钟下荡会儿光丝秋千，人喝完水就回。' },
      { pose: 'mote_track', message: '乘着半透明大泡泡巡航桌面中，一切安稳。' },
      { pose: 'asym_stretch', message: '久坐暂停中——去走廊伸展两下，回来效率翻倍。' },
      { pose: 'patrol_scan', message: '工位状态：风平浪静，人去窗边给眼睛放个短假。' },
      { pose: 'tea_blow', message: '热茶还在冒气，人去附近溜达两步很快就回。' },
      { pose: 'happy_squint', message: '先摊成一张暖融融的圆饼歇几秒，正主马上回座。' },
      { pose: 'guardian', message: '暂时挂起屏幕，去把缩了半天的肩膀舒展开。' },
      { pose: 'walk', message: '偶尔会有不同颜色的几何同伴路过串门——报告，周边一切正常。' },
      { pose: 'gaze', message: '把视线借给远方几分钟，稍后回来继续推进。' },
      { pose: 'cheek_rest', message: '正在窗边透气充会儿电，稍后满血归位。', longAwayOnly: true }
    ],
    sketch: [
      { pose: 'nap_guard', message: '工位暂由小狗接管，主人去接续命水了。' },
      { pose: 'sleep_bubble', message: '嘘，屏幕和眼睛都在中场休息，稍后满血醒来。' },
      { pose: 'yawn', message: '代班打个大哈欠——盯屏幕太久，确实该出去透口气了。' },
      { pose: 'head_cock', message: '竖起耳朵听过了：人不在座位，应该是去窗边放空了。' },
      { pose: 'walk', message: '刚在屏幕角落刨坑藏好一根小骨头，主人马上就回。' },
      { pose: 'play_bow', message: '今日份久坐额度已满，先去把僵住的后背拉直一点。' },
      { pose: 'butterfly', message: '一只小墨蝶刚停在鼻尖上，他应该已经接完水往回走了。' },
      { pose: 'paw_groom', message: '请勿拍打喂食，值班小狗正在素描纸上追飞盘。' },
      { pose: 'sniff', message: '低头顺着虚线闻了一圈：没有焦虑味，只有茶水香。' },
      { pose: 'water', message: '替主人守着水杯和桌面，去走廊溜达两圈就回。' },
      { pose: 'gaze', message: '扒开素描纸折角偷看了一眼——人去给眼睛放小假啦。' },
      { pose: 'stretch_up', message: '离开椅子伸个大懒腰，回来状态更清醒。' },
      { pose: 'walk', message: '不小心踩到一滴墨水，顺便在屏幕上印一串梅花小爪印。' },
      { pose: 'play_bow', message: '小狗巡逻队播报：正主去活动手脚啦，片刻就回。' },
      { pose: 'butterfly', message: '刚吹散了一朵手绘蒲公英，主人应该也在回工位路上了。' },
      { pose: 'head_cock', message: '如果看到我在纸页上四脚朝天蹭后背，说明他很快回来。' },
      { pose: 'sniff', message: '刚躲开一朵路过的手绘小雨云，抖干毛等主人回来。' },
      { pose: 'yawn', message: '给键盘和手腕放个课间假，几分钟后接着忙。' },
      { pose: 'nap_guard', message: '追自己尾巴转晕了先趴会儿，人去松松肩膀就回。' },
      { pose: 'water', message: '水杯已续满，人正在窗边远眺回血中。' },
      { pose: 'walk', message: '顺着素描纸散步时，偶尔会有戴小领巾或长耳朵的朋友来串门。' },
      { pose: 'sleep_bubble', message: '团成一笔安静的小毛球趴会儿，屏幕和眼睛都在歇息。' }
    ],
    nature_window: {
      sunlight: [
        { pose: 'gaze', message: '把窗边的晴光树影借来桌面，人去走动两步就回。' },
        { pose: 'gaze', message: '百叶窗的日影慢了下来，视线正在窗外散步。' },
        { pose: 'breath', message: '趁阳光正好，离开椅子去透一口气，稍后归位。' },
        { pose: 'gaze', message: '桌面暂留一片微风树影，接杯温水马上回。' },
        { pose: 'breath', message: '短暂离席，让紧绷的肩颈和眼睛都晒晒日光。' },
        { pose: 'gaze', message: '树影随风轻晃的片刻，人去走廊松松筋骨。' },
        { pose: 'breath', message: '把近处的忙碌先合上几分钟，去窗边换换空气。' },
        { pose: 'gaze', message: '光影在墙面慢慢挪动，人去续半杯水就回来。' },
        { pose: 'breath', message: '中场留白片刻，回来时思路会像晴光一样通透。' },
        { pose: 'gaze', message: '视线去远处的树梢上歇会儿脚，片刻即回。' }
      ],
      mist: [
        { pose: 'breath', message: '屏幕起雾透气中，人去接杯温水就回。' },
        { pose: 'breath', message: '给工位降点噪，离开椅子松松肩膀。' },
        { pose: 'breath', message: '雾气散开前，先让颈椎歇口气。' },
        { pose: 'gaze', message: '中场休息片刻，去窗边吹吹风。' },
        { pose: 'breath', message: '桌面暂时留白，喝口水马上回来。' },
        { pose: 'breath', message: '窗面微起薄雾，正好起身活动一下手脚。' },
        { pose: 'breath', message: '水珠顺着窗面滑落的工夫，人去走廊走两步。' },
        { pose: 'gaze', message: '暂借一层温润水汽遮住喧嚣，稍后清爽归位。' },
        { pose: 'breath', message: '给发紧的眉心透透气，几分钟后回来继续。' },
        { pose: 'breath', message: '雨雾听风时刻，起身舒展一下后背就回。' }
      ],
      frost: [
        { pose: 'breath', message: '给发烫的大脑和屏幕同时降个温，稍后即回。' },
        { pose: 'breath', message: '工作进度已冷藏保鲜，去走两步回来解冻。' },
        { pose: 'breath', message: '桌面暂时急冻锁鲜，接杯水马上回来。' },
        { pose: 'breath', message: '给久坐按下暂停键，起身活动一下。' },
        { pose: 'breath', message: '冷静几分钟，回来思路更清晰。' },
        { pose: 'breath', message: '屏幕进入冬眠小憩，人去茶水间充个电。' },
        { pose: 'breath', message: '冰晶替你守住当前进度，起身松松肩颈就回。' },
        { pose: 'gaze', message: '清冽凝霜护眼中，去窗边远望片刻即刻解冻。' },
        { pose: 'breath', message: '把连轴转的热度缓一缓，喝口温水马上归位。' },
        { pose: 'breath', message: '思绪保鲜封存中，活动下腰腿很快就回。' }
      ]
    }
  };
  // Backward-compat alias so any external caller reading `.bokeh` still works cleanly
  CURATED_SEALED_VIGNETTES.nature_window.bokeh = CURATED_SEALED_VIGNETTES.nature_window.sunlight;

  // Pool B: Doubled Slot-Grammar Molds
  const SEALED_GRAMMAR_MOLDS = {
    geometric: [
      {
        poses: ['guardian', 'patrol_scan', 'cheek_rest', 'walk'],
        a: ['工位临时托管中，', '桌面值班员已上线，', '人体工学椅暂时轮休，', '键盘鼠标正在放风，', '当前座位挂上空挡，', '大屏漫游模式已开启，'],
        b: ['本人去把耸高的肩膀放下来', '正主去茶水间续半杯温水', '人去窗边给眼睛调个远焦', '去走廊溜达两步活络下腰椎', '去跟远处的绿植对视半分钟', '起身去把紧绷的后背舒展开'],
        c: ['，稍后即回。', '，几分钟就回。', '，回来思路更顺。', '，马上归位。', '，片刻后满电回归。']
      },
      {
        poses: ['tea_blow', 'mote_track', 'nod_doze', 'asym_stretch'],
        a: ['代班看守屏幕中——', '圆球临时顶岗中：', '替主人看会儿桌面，', '中场休息信号已发出，', '趁正主不在工位散个步：'],
        b: ['人被劝去活动颈椎了', '灵感正在走廊里慢悠悠加载', '去把僵了一上午的后背拉直一点', '趁机让眼睛离开近处歇口气', '去茶水间喝口水换换脑子'],
        c: ['。', '，有急事请稍等片刻。', '，喝口温水就回来。', '，很快就回。']
      }
    ],
    sketch: [
      {
        poses: ['nap_guard', 'sleep_bubble', 'paw_groom', 'water'],
        a: ['小狗代班看家中，', '桌面暂由小狗接管，', '摇尾巴值守工位中，', '今日份护眼小憩已开启，', '大屏遛弯时间到——'],
        b: ['主人去茶水间打水啦', '人去窗边吹吹风透口气', '去把发僵的肩膀松一松', '离开凳子溜达两圈充充电', '去远处看看风景歇歇眼睛'],
        c: ['。', '，马上就回。', '，回来状态更精神。', '，片刻归位。']
      },
      {
        poses: ['head_cock', 'walk', 'yawn', 'butterfly'],
        a: ['巡视完毕，工位一切正常——', '歪头播报一则简讯：', '嘘，让键盘和手腕都歇会儿，', '趁主人起身去活动筋骨，'],
        b: ['正主去松松肩颈了', '人去接半杯温水润润嗓子', '去窗边看看天色调调焦距', '我在大屏上替他跑两圈步'],
        c: ['，稍后归位。', '，几分钟后见。', '。', '，很快回来。']
      }
    ],
    sunlight: [
      {
        poses: ['gaze', 'breath'],
        a: ['窗棂斜阳正落在桌面，', '微风吹动窗边树影，', '百叶窗滤出柔和晴光，', '桌面暂留一片婆娑树影，', '阳光与叶影慢悠悠晃动中，'],
        b: ['人去窗边给眼睛松松绑', '先把视线借给远方几分钟', '起身去接杯温水活动肩颈', '离开座椅让睫状肌歇口气', '去走廊走两步换换空气'],
        c: ['。', '，稍后从容归位。', '，几分钟后见。', '，片刻即回。']
      }
    ],
    mist: [
      {
        poses: ['breath', 'gaze'],
        a: ['玻璃窗面起雾透气中，', '桌面蒙上一层温润薄雾，', '屏幕进入安静留白时刻，', '给忙碌的工位降一点噪，', '微凉水汽正漫过窗面，'],
        b: ['人去接杯温水松松肩', '起身去走廊透一口气', '先让紧绷的颈椎缓一缓', '去窗边吹吹风换换脑子', '离开座椅活动一下手脚'],
        c: ['。', '，雾散即回。', '，稍后即回。', '，几分钟后归位。']
      }
    ],
    frost: [
      {
        poses: ['breath', 'gaze'],
        a: ['当前桌面已低温锁鲜，', '给发烫的屏幕降个温，', '工作进度暂时凝霜封存，', '给久坐惯性按下暂停键，', '清冽冰晶正替你守住桌面，'],
        b: ['人去起身走动两步', '去茶水间续杯水活络筋骨', '让紧绷的注意力和肩膀都松一松', '去窗边透口气冷静几分钟', '起身把僵住的腰背舒展开'],
        c: ['。', '，回来轻触即刻解冻。', '，稍后满血继续。', '，片刻归位。']
      }
    ]
  };
  SEALED_GRAMMAR_MOLDS.bokeh = SEALED_GRAMMAR_MOLDS.sunlight;

  const SEALED_COPY_LIBRARIES = {
    geometric: CURATED_SEALED_VIGNETTES.geometric.map(function (v) { return v.message; }),
    sketch: CURATED_SEALED_VIGNETTES.sketch.map(function (v) { return v.message; }),
    nature_window: {
      sunlight: CURATED_SEALED_VIGNETTES.nature_window.sunlight.map(function (v) { return v.message; }),
      bokeh: CURATED_SEALED_VIGNETTES.nature_window.sunlight.map(function (v) { return v.message; }),
      mist: CURATED_SEALED_VIGNETTES.nature_window.mist.map(function (v) { return v.message; }),
      frost: CURATED_SEALED_VIGNETTES.nature_window.frost.map(function (v) { return v.message; })
    }
  };

  function pickSealedVignette(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const rawStyle = opts.natureStyle || 'sunlight';
    const natureStyle = rawStyle === 'bokeh' ? 'sunlight' : rawStyle;
    const elapsedSec = Math.max(0, Number(opts.sealedElapsedSec) || 0);
    const rotationIndex = Math.max(0, Math.floor(Number(opts.rotationIndex) || 0));
    const hasSessionSeed = typeof opts.sessionSeed === 'number' && opts.sessionSeed > 0;

    let curatedPool;
    let grammarMolds;
    if (theme === 'nature_window') {
      const subKey = ['sunlight', 'mist', 'frost'].includes(natureStyle) ? natureStyle : 'sunlight';
      curatedPool = CURATED_SEALED_VIGNETTES.nature_window[subKey];
      grammarMolds = SEALED_GRAMMAR_MOLDS[subKey];
    } else if (theme === 'sketch') {
      curatedPool = CURATED_SEALED_VIGNETTES.sketch;
      grammarMolds = SEALED_GRAMMAR_MOLDS.sketch;
    } else {
      curatedPool = CURATED_SEALED_VIGNETTES.geometric.filter(function (v) {
        return !v.longAwayOnly;
      });
      grammarMolds = SEALED_GRAMMAR_MOLDS.geometric;
    }

    if (!hasSessionSeed) {
      if (theme === 'geometric' && elapsedSec >= 20 * 60 && rotationIndex === 5) {
        const longItem = CURATED_SEALED_VIGNETTES.geometric[CURATED_SEALED_VIGNETTES.geometric.length - 1];
        return { message: longItem.message, pose: longItem.pose, source: 'curated' };
      }
      const picked = curatedPool[rotationIndex % curatedPool.length];
      return { message: picked.message, pose: picked.pose, source: 'curated' };
    }

    // Build a deterministic 32-slot non-repeating deck seeded by sessionSeed (>= 5 hours of 10-min rotations with ZERO repeats!)
    const deckRand = mulberry32((opts.sessionSeed ^ 0x5BD1E995) >>> 0);
    const seenMsgs = new Set();
    const deck = [];

    for (let i = 0; i < curatedPool.length; i++) {
      const c = curatedPool[i];
      if (!seenMsgs.has(c.message)) {
        seenMsgs.add(c.message);
        deck.push({ message: c.message, pose: c.pose, source: 'curated' });
      }
    }

    if (grammarMolds && grammarMolds.length > 0) {
      let guard = 0;
      while (deck.length < 36 && guard < 120) {
        guard += 1;
        const mold = pickFrom(grammarMolds, deckRand);
        const msg = pickFrom(mold.a, deckRand) + pickFrom(mold.b, deckRand) + pickFrom(mold.c, deckRand);
        if (!seenMsgs.has(msg)) {
          seenMsgs.add(msg);
          deck.push({ message: msg, pose: pickFrom(mold.poses, deckRand), source: 'composed' });
        }
      }
    }

    // Fisher-Yates shuffle using deckRand so every session has a fresh 36-slot non-repeating order
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(deckRand() * (i + 1));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }

    if (theme === 'geometric' && elapsedSec >= 20 * 60 && rotationIndex === 2) {
      const longGem = CURATED_SEALED_VIGNETTES.geometric[CURATED_SEALED_VIGNETTES.geometric.length - 1];
      return { message: longGem.message, pose: longGem.pose, source: 'curated' };
    }

    return deck[rotationIndex % deck.length];
  }

  function getSealedCopy(options) {
    return pickSealedVignette(options).message;
  }

  // =========================================================================
  // PART 3: Break Action Picker (with 8-step Action & 4-step Pose Deduplication!)
  // =========================================================================

  function composeBreakLine(category, randFn) {
    const gram = BREAK_CATEGORY_GRAMMARS[category] || BREAK_CATEGORY_GRAMMARS.shoulder;
    for (let attempt = 0; attempt < 8; attempt++) {
      const line = pickFrom(gram.openers, randFn) + pickFrom(gram.cores, randFn) + pickFrom(gram.closers, randFn);
      if (!recentBreakTexts.includes(line)) {
        return line;
      }
    }
    return pickFrom(gram.openers, randFn) + pickFrom(gram.cores, randFn) + pickFrom(gram.closers, randFn);
  }

  function pickBreakAction(options) {
    const opts = options || {};
    const theme = opts.theme || 'geometric';
    const kind = opts.breakKind === 'eye_rest' ? 'eye_rest' : 'full';
    const lastActionId = opts.lastActionId || null;
    const randFn = typeof opts.random === 'function' ? opts.random : Math.random;

    if (kind === 'full' && randFn() < 0.12) {
      const eggPool = EASTER_EGGS[theme] || EASTER_EGGS.geometric;
      const filteredEggs = eggPool.filter(function (e) {
        return e.actionId !== lastActionId && !recentActionIds.includes(e.actionId);
      });
      const egg = pickFrom(filteredEggs.length > 0 ? filteredEggs : eggPool, randFn);
      rememberItem(recentActionIds, egg.actionId, 8);
      rememberItem(recentPoses, egg.pose, 4);
      rememberItem(recentBreakTexts, egg.message, 20);
      return {
        actionId: egg.actionId,
        pose: egg.pose,
        followupPose: egg.followupPose || null,
        title: egg.title,
        message: egg.message,
        followup: egg.followup || null,
        easterEgg: egg.tag
      };
    }

    const pool = kind === 'eye_rest' ? EYE_REST_ACTIONS : FULL_BREAK_ACTIONS;
    const freshCandidates = pool.filter(function (a) {
      return a.id !== lastActionId && !recentActionIds.includes(a.id) && !recentPoses.includes(a.pose);
    });
    const nonRepeatIdCandidates = freshCandidates.length > 0
      ? freshCandidates
      : pool.filter(function (a) { return a.id !== lastActionId && !recentActionIds.includes(a.id); });
    const fallbackCandidates = nonRepeatIdCandidates.length > 0
      ? nonRepeatIdCandidates
      : pool.filter(function (a) { return a.id !== lastActionId; });
    const list = fallbackCandidates.length > 0 ? fallbackCandidates : pool;
    const chosen = list[Math.floor(randFn() * list.length) % list.length];

    rememberItem(recentActionIds, chosen.id, kind === 'eye_rest' ? 5 : 10);
    rememberItem(recentPoses, chosen.pose, 4);

    let message;
    if (kind === 'full' && theme !== 'nature_window' && chosen.category && randFn() < 0.44) {
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

    rememberItem(recentBreakTexts, message, 20);

    const followup = chosen.followup
      ? (chosen.followup[theme] || chosen.followup.geometric || null)
      : null;

    return {
      actionId: chosen.id,
      pose: chosen.pose,
      followupPose: chosen.followupPose || null,
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
      '{s} 秒后起身松松肩，先把这步收尾吧。',
      '再过 {s} 秒中场小憩，从容收个尾就好。'
    ],
    sketch: [
      '还有 {s} 秒准备休息，可以先把这行字打完。',
      '{s} 秒后起身松口气，先把这步收尾吧。',
      '再过 {s} 秒歇一会儿，不急，先把半句话敲完。',
      '小狗提醒：{s} 秒后歇歇眼睛，先把这句写完吧。'
    ],
    nature_window: [
      '{s} 秒后窗边小憩，请先收尾手头思绪。',
      '还有 {s} 秒进入留白放松，请从容收尾。',
      '{s} 秒后暂歇片刻，先把眼前这句写完。'
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
