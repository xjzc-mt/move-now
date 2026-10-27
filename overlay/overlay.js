// DeepSeek Chubby Whale Screensaver Controller

// Web Audio API Synthesizer (Zero dependencies, pure browser audio)
class SoundFx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Cute bubble pop sound
  playPop() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const now = this.ctx.currentTime;
      osc.type = 'sine';
      // Pitch drops rapidly
      const startFreq = 400 + Math.random() * 200;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Squeegee wipe sound (rubbery squeak on glass)
  playSqueegee() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      
      const freq = 600 + Math.random() * 400;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.06);
      osc.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.12);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  // Soothing pentatonic chord for completion
  playCompletionChime() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.3);
      });
    } catch (e) {}
  }
}

const soundFx = new SoundFx();

// Configuration & State
const params = new URLSearchParams(window.location.search);
let restDuration = parseInt(params.get('restDuration') || '30', 10);
let strictMode = params.get('strict') === 'true';
let remainingTime = restDuration;
let isWipingDone = false;
let isFinished = false;

// DOM Elements
const canvas = document.getElementById('wipeCanvas');
const ctx = canvas.getContext('2d');
const whaleActor = document.getElementById('whaleActor');
const speechBubble = document.getElementById('speechBubble');
const bubbleText = speechBubble.querySelector('.bubble-text');
const contentContainer = document.getElementById('contentContainer');
const countdownNumber = document.getElementById('countdownNumber');
const progressRingFill = document.getElementById('progressRingFill');
const tipIcon = document.getElementById('tipIcon');
const tipTitle = document.getElementById('tipTitle');
const tipDesc = document.getElementById('tipDesc');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const emergencyBtn = document.getElementById('emergencyBtn');
const emergencyRingFill = document.getElementById('emergencyRingFill');
const whaleToast = document.getElementById('whaleToast');
const toastMessage = document.getElementById('toastMessage');
const finishOverlay = document.getElementById('finishOverlay');
const r1ThinkCard = document.getElementById('r1ThinkCard');
const r1ThinkHeader = document.getElementById('r1ThinkHeader');
const ambientBubbles = document.getElementById('ambient-bubbles');

// Set up Progress Ring
const ringRadius = 95;
const ringCircumference = 2 * Math.PI * ringRadius;
progressRingFill.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
progressRingFill.style.strokeDashoffset = '0';

// Canvas Setup
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (!isWipingDone) {
    drawFrostedScreen();
  }
}
window.addEventListener('resize', resizeCanvas);

// Draw the initial Frosted Glass Screen
function drawFrostedScreen() {
  const w = canvas.width;
  const h = canvas.height;

  // Frosted blue-tinted translucent glass layer
  ctx.save();
  ctx.fillStyle = 'rgba(215, 230, 250, 0.94)';
  ctx.fillRect(0, 0, w, h);

  // Add noise/condensation droplets
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 180; i++) {
    const rx = Math.random() * w;
    const ry = Math.random() * h;
    const r = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Faint steam text on glass
  ctx.font = '700 28px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(100, 140, 190, 0.28)';
  ctx.textAlign = 'center';
  ctx.fillText('屏幕已起雾 · 等待大肥鱼擦拭...', w / 2, h / 2);
  ctx.restore();
}

// Whale Swimming & Screen Wiping Animation
function startWhaleWipe() {
  resizeCanvas();

  const w = window.innerWidth;
  const h = window.innerHeight;

  // Waypoints for the chubby whale to swim across and wipe the entire screen
  // Curve: Enters from bottom-left, loops across center, wipes right, then docks at top center
  const waypoints = [
    { x: -280, y: h * 0.75, angle: -10, speech: "哼哧哼哧！发现久坐人类~", wiperActive: false },
    { x: w * 0.15, y: h * 0.65, angle: -5, speech: "大肥鱼带着刮刀来没收屏幕啦！", wiperActive: true },
    { x: w * 0.45, y: h * 0.40, angle: -15, speech: "呲呲呲~ 屏幕统统擦掉！", wiperActive: true },
    { x: w * 0.78, y: h * 0.60, angle: 10, speech: "好舒服的泡泡！快站起来伸展~", wiperActive: true },
    { x: w * 0.50, y: 70, angle: 0, speech: "擦亮啦！主人快看窗外~", wiperActive: false }
  ];

  let currentPoint = 0;
  let progress = 0;
  const speed = 0.007; // Smooth wiping duration (~3 seconds)

  // Last wiper position
  let lastWiperPos = null;

  function animateWipe() {
    if (currentPoint >= waypoints.length - 1) {
      // Completed wiping sequence
      finishWipeSequence();
      return;
    }

    progress += speed;
    if (progress >= 1) {
      progress = 0;
      currentPoint++;
    }

    const p0 = waypoints[currentPoint];
    const p1 = waypoints[Math.min(currentPoint + 1, waypoints.length - 1)];

    // Smooth cubic easing
    const t = progress;
    const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const curX = p0.x + (p1.x - p0.x) * easeT;
    const curY = p0.y + (p1.y - p0.y) * easeT;
    const curAngle = p0.angle + (p1.angle - p0.angle) * easeT;

    // Position Whale Actor
    whaleActor.style.transform = `translate(${curX}px, ${curY}px) rotate(${curAngle}deg)`;

    // Speech bubble
    if (p0.speech && !speechBubble.classList.contains('active')) {
      bubbleText.textContent = p0.speech;
      speechBubble.classList.add('active');
    }

    // Wiper blade world position (~260px offset from whale origin)
    const rad = (curAngle * Math.PI) / 180;
    const wiperLocalX = 260;
    const wiperLocalY = 170;
    const wiperWorldX = curX + (wiperLocalX * Math.cos(rad) - wiperLocalY * Math.sin(rad));
    const wiperWorldY = curY + (wiperLocalX * Math.sin(rad) + wiperLocalY * Math.cos(rad));

    if (p0.wiperActive) {
      // Erase frosted layer on canvas along wiper trajectory
      eraseCanvasCircle(wiperWorldX, wiperWorldY, 150);

      if (lastWiperPos) {
        eraseCanvasLine(lastWiperPos.x, lastWiperPos.y, wiperWorldX, wiperWorldY, 150);
      }

      // Random squeegee audio chirp
      if (Math.random() < 0.08) {
        soundFx.playSqueegee();
      }

      // Spawn soap froth particles
      if (Math.random() < 0.4) {
        spawnFoamBubble(wiperWorldX, wiperWorldY);
      }
    }

    lastWiperPos = { x: wiperWorldX, y: wiperWorldY };

    requestAnimationFrame(animateWipe);
  }

  requestAnimationFrame(animateWipe);
}

// Clear a soft circle on the frosted glass canvas
function eraseCanvasCircle(x, y, radius) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const grad = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius);
  grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Clear a smooth stroke between two wiper points
function eraseCanvasLine(x1, y1, x2, y2, width) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

// Finish Wipe Sequence and reveal UI
function finishWipeSequence() {
  isWipingDone = true;

  // Fully clear remaining canvas smoothly
  let fadeAlpha = 1;
  const fadeInterval = setInterval(() => {
    fadeAlpha -= 0.1;
    if (fadeAlpha <= 0) {
      clearInterval(fadeInterval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.pointerEvents = 'none';
    } else {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, 30);

  // Smoothly position whale at top center as resting buddy
  const targetX = (window.innerWidth - 320) / 2;
  const targetY = 30;
  whaleActor.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
  whaleActor.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.9)`;

  // Update speech bubble
  bubbleText.textContent = "屏幕擦干净啦！好好做做拉伸哦~";
  setTimeout(() => {
    speechBubble.classList.remove('active');
  }, 4000);

  // Reveal Content Cards
  contentContainer.classList.add('revealed');

  // Start Countdown
  startCountdown();
}

// Foam bubble animation
function spawnFoamBubble(x, y) {
  const b = document.createElement('div');
  b.className = 'bubble-pop-score';
  b.textContent = '✨';
  b.style.left = `${x + (Math.random() * 40 - 20)}px`;
  b.style.top = `${y + (Math.random() * 40 - 20)}px`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 700);
}

// Ambient Floating Bubbles System
const bubbleCheers = [
  "+10 颈椎护甲",
  "腰椎压力 -50%",
  "👀 视力回血",
  "大脑重新注水 💧",
  "💧 血液循环加速",
  "大肥鱼给你点赞 👍",
  "✨ 疲劳驱散"
];

function initAmbientBubbles() {
  for (let i = 0; i < 14; i++) {
    createSingleBubble();
  }
}

function createSingleBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'floating-bubble';
  
  const size = Math.random() * 42 + 24;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 95}vw`;
  
  const duration = Math.random() * 12 + 10;
  bubble.style.animationDuration = `${duration}s`;
  bubble.style.animationDelay = `${Math.random() * 8}s`;
  bubble.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 80}px`);

  bubble.addEventListener('click', (e) => {
    e.stopPropagation();
    soundFx.playPop();

    // Floating text
    const cheer = bubbleCheers[Math.floor(Math.random() * bubbleCheers.length)];
    const score = document.createElement('div');
    score.className = 'bubble-pop-score';
    score.textContent = cheer;
    score.style.left = `${e.clientX - 30}px`;
    score.style.top = `${e.clientY - 20}px`;
    document.body.appendChild(score);
    setTimeout(() => score.remove(), 800);

    // Pop animation
    bubble.remove();
    createSingleBubble();
  });

  ambientBubbles.appendChild(bubble);
}

// Ergonomic Stretch Tips Carousel
const stretchTips = [
  {
    icon: "🧘‍♂️",
    title: "眺望远方 & 颈椎后仰",
    desc: "将视线移向窗外6米外景物，双肩下沉，头部缓缓向后仰，保持5秒~"
  },
  {
    icon: "🍵",
    title: "离开座椅 · 补充水分",
    desc: "站起来接一杯温水，一小口一小口慢慢饮下，激活全身代谢循环！"
  },
  {
    icon: "🙆‍♂️",
    title: "双手交叉 · 向上拉伸",
    desc: "双手十指交叉翻转向上，手臂伸直推向天花板，深吸一口气慢慢吐出~"
  },
  {
    icon: "🦒",
    title: "米字操放松肩颈",
    desc: "头颈放松，以鼻尖为笔，在空中缓慢书写一个‘米’字，缓解僵硬~"
  },
  {
    icon: "👀",
    title: "20-20-20 护眼法则",
    desc: "连续用眼20分钟后，注视20英尺（约6米）外物体至少20秒，给眼睛放假！"
  }
];

let tipIndex = 0;
function rotateTips() {
  tipIndex = (tipIndex + 1) % stretchTips.length;
  const tip = stretchTips[tipIndex];
  
  tipIcon.style.transform = 'scale(0.8)';
  setTimeout(() => {
    tipIcon.textContent = tip.icon;
    tipTitle.textContent = tip.title;
    tipDesc.textContent = tip.desc;
    tipIcon.style.transform = 'scale(1)';
  }, 200);
}
setInterval(rotateTips, 8000);

// Countdown Timer Controller
let timerInterval = null;
function startCountdown() {
  updateTimerUI();
  
  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerUI();

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      triggerFinishCelebration();
    }
  }, 1000);
}

function updateTimerUI() {
  const mins = Math.floor(remainingTime / 60);
  const secs = remainingTime % 60;
  countdownNumber.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Update ring progress
  const progressRatio = Math.max(0, remainingTime / restDuration);
  const offset = ringCircumference * (1 - progressRatio);
  progressRingFill.style.strokeDashoffset = offset;
}

// Celebration when break completes
function triggerFinishCelebration() {
  if (isFinished) return;
  isFinished = true;

  soundFx.playCompletionChime();
  finishOverlay.classList.add('active');

  // Whale jump
  whaleActor.style.transform = `translate(${(window.innerWidth - 320) / 2}px, 60px) scale(1.15)`;

  setTimeout(() => {
    // Notify Electron main process to close or unlock
    if (window.electronAPI) {
      window.electronAPI.restComplete();
    } else {
      window.close();
    }
  }, 2000);
}

// Emergency Bypass Mechanism (Press & Hold ESC 3 seconds)
let escHoldTimer = null;
let escHoldStart = null;
const ESC_HOLD_DURATION = 3000;

function showWhaleToast(msg) {
  toastMessage.textContent = msg;
  whaleToast.classList.add('active');
  setTimeout(() => whaleToast.classList.remove('active'), 2800);
}

function startEscHold() {
  if (escHoldStart) return;
  escHoldStart = Date.now();
  
  emergencyRingFill.style.transition = 'stroke-dashoffset 0.1s linear';
  
  escHoldTimer = setInterval(() => {
    const elapsed = Date.now() - escHoldStart;
    const progress = Math.min(1, elapsed / ESC_HOLD_DURATION);
    const ringLen = 94.2;
    emergencyRingFill.style.strokeDashoffset = ringLen * (1 - progress);

    if (elapsed >= ESC_HOLD_DURATION) {
      clearInterval(escHoldTimer);
      triggerEmergencyExit();
    }
  }, 50);
}

function cancelEscHold() {
  if (escHoldTimer) {
    clearInterval(escHoldTimer);
    escHoldTimer = null;
  }
  if (escHoldStart) {
    const elapsed = Date.now() - escHoldStart;
    if (elapsed < ESC_HOLD_DURATION && !isFinished) {
      // Casual press
      showWhaleToast(`大肥鱼顶住：倒计时还剩 ${remainingTime} 秒！(真有急事请长按ESC 3秒)`);
    }
    escHoldStart = null;
    emergencyRingFill.style.strokeDashoffset = 94.2;
  }
}

function triggerEmergencyExit() {
  isFinished = true;
  if (window.electronAPI) {
    window.electronAPI.emergencyExit();
  } else {
    window.close();
  }
}

// Keyboard Listeners
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    startEscHold();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEscHold();
  }
});

// Emergency button mouse hold
emergencyBtn.addEventListener('mousedown', (e) => {
  e.preventDefault();
  startEscHold();
});
window.addEventListener('mouseup', cancelEscHold);

// Toggle R1 Thinking Card
r1ThinkHeader.addEventListener('click', () => {
  r1ThinkCard.classList.toggle('collapsed');
});

// Toggle Sound
soundToggleBtn.addEventListener('click', () => {
  const isMuted = soundFx.toggle();
  soundIcon.textContent = isMuted ? '🔇' : '🔊';
});

// Interactive mouse wipe on canvas for fun
let isMouseDown = false;
window.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup', () => isMouseDown = false);
window.addEventListener('mousemove', (e) => {
  if (!isWipingDone || isMouseDown) {
    eraseCanvasCircle(e.clientX, e.clientY, 80);
  }
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  initAmbientBubbles();
  setTimeout(startWhaleWipe, 300);
});
