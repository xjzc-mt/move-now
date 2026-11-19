(function () {
  'use strict';

  const stageEl = document.getElementById('welcomeStage');
  const sampleEl = document.getElementById('welcomeSample');
  const themeCards = document.querySelectorAll('#themeChoices [data-theme]');
  const modeCards = document.querySelectorAll('#modeChoices [data-mode]');
  const naturePillsBox = document.getElementById('welcomeNaturePills');
  const naturePills = document.querySelectorAll('#welcomeNaturePills [data-nature]');
  const startBtn = document.getElementById('startBtn');

  const SAMPLES = {
    geometric: '已经连轴转 45 分钟了，先把肩膀放下来吧。',
    sketch: '眼睛累了吧，往窗外最远的地方看一会儿。',
    nature_window: {
      bokeh: '把视线从屏幕挪开，让眼睛失焦一会儿。',
      mist: '桌面已为你暂时封存，放心去走走吧。',
      frost: '寒窗凝霜已遮蔽文字，回来轻触键鼠即刻解冻。'
    }
  };

  let selectedTheme = 'geometric';
  let selectedMode = 'fullscreen_preview';
  let selectedNature = 'bokeh';

  const stage = window.MoveNowThemeStage.mount(stageEl, { showBreathLabel: true });

  function updateUI() {
    stage.setState({
      theme: selectedTheme,
      natureStyle: selectedNature,
      mood: 'calm',
      pose: 'calm',
      easterEgg: null
    });

    const isNature = selectedTheme === 'nature_window';
    naturePillsBox.hidden = !isNature;
    if (isNature) {
      sampleEl.textContent = SAMPLES.nature_window[selectedNature] || SAMPLES.nature_window.bokeh;
    } else {
      sampleEl.textContent = SAMPLES[selectedTheme] || SAMPLES.geometric;
    }

    themeCards.forEach(function (card) {
      card.classList.toggle('active', card.getAttribute('data-theme') === selectedTheme);
    });
    modeCards.forEach(function (card) {
      card.classList.toggle('active', card.getAttribute('data-mode') === selectedMode);
    });
    naturePills.forEach(function (pill) {
      pill.classList.toggle('active', pill.getAttribute('data-nature') === selectedNature);
    });
  }

  themeCards.forEach(function (card) {
    card.addEventListener('click', function () {
      selectedTheme = card.getAttribute('data-theme');
      updateUI();
    });
  });

  naturePills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      selectedNature = pill.getAttribute('data-nature');
      updateUI();
    });
  });

  modeCards.forEach(function (card) {
    card.addEventListener('click', function () {
      selectedMode = card.getAttribute('data-mode');
      updateUI();
    });
  });

  startBtn.addEventListener('click', function () {
    window.MoveNowBridge.send('completeOnboarding', {
      theme: selectedTheme,
      natureStyle: selectedTheme === 'nature_window' ? selectedNature : 'auto',
      reminderMode: selectedMode
    });
  });

  window.MoveNowBridge.subscribe(function (snapshot) {
    if (!snapshot || !snapshot.settings) return;
    if (!snapshot.settings.hasCompletedOnboarding) {
      selectedTheme = snapshot.settings.theme;
      selectedMode = snapshot.settings.reminderMode;
      if (snapshot.settings.natureStyle && snapshot.settings.natureStyle !== 'auto') {
        selectedNature = snapshot.settings.natureStyle;
      }
      updateUI();
    }
  });

  updateUI();
  window.MoveNowBridge.send('ready');
})();
