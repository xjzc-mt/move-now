// Parse duration from URL
const params = new URLSearchParams(window.location.search);
const totalDuration = parseInt(params.get('duration'), 10) || 30;
let remaining = totalDuration;

const countdownEl = document.getElementById('countdownNumber');
const ringProgress = document.getElementById('ringProgress');
const skipBtn = document.getElementById('skipBtn');

const circumference = 2 * Math.PI * 52; // r = 52 => ~326.72
ringProgress.style.strokeDasharray = `${circumference}`;
ringProgress.style.strokeDashoffset = '0';

// Gentle squeegee wipe sound (pure Web Audio)
function playGentleSqueegee() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime + 0.3;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(780, now + 0.08);
    osc.frequency.linearRampToValueAtTime(420, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
}

// Play sound on launch
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(playGentleSqueegee, 500);
});

// Update countdown ring
function updateDisplay() {
  countdownEl.textContent = remaining;
  const progress = (totalDuration - remaining) / totalDuration;
  const offset = circumference * progress;
  ringProgress.style.strokeDashoffset = offset;
}

updateDisplay();

// Timer countdown loop
const timer = setInterval(() => {
  remaining--;
  if (remaining <= 0) {
    clearInterval(timer);
    exitScreensaver();
  } else {
    updateDisplay();
  }
}, 1000);

function exitScreensaver() {
  if (window.electronAPI && window.electronAPI.close) {
    window.electronAPI.close();
  }
}

// Exit listeners: ESC key or skip button
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    exitScreensaver();
  }
});

skipBtn.addEventListener('click', () => {
  exitScreensaver();
});
