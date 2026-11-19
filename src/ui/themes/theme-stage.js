(function (root) {
  'use strict';

  function mountThemeStage(container, options) {
    const opts = options || {};
    container.classList.add('mn-stage-root');

    let currentTheme = null;
    let renderer = null;
    let rafId = null;
    let lastState = { theme: 'geometric', natureStyle: 'bokeh', pose: 'calm', mood: 'calm', easterEgg: null };
    const reduceMotion = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function buildRenderer(theme) {
      currentTheme = theme;
      if (theme === 'sketch' && root.MoveNowThemeSketch) {
        renderer = root.MoveNowThemeSketch.create(container, opts);
      } else if (theme === 'nature_window' && root.MoveNowThemeNatureWindow) {
        renderer = root.MoveNowThemeNatureWindow.create(container, opts);
      } else if (root.MoveNowThemeGeometric) {
        renderer = root.MoveNowThemeGeometric.create(container, opts);
      }
      if (renderer) {
        renderer.setState(lastState);
        renderer.update(performance.now());
      }
    }

    function loop(now) {
      if (renderer && !reduceMotion && !document.hidden) {
        renderer.update(now);
      }
      rafId = root.requestAnimationFrame(loop);
    }

    function setState(next) {
      lastState = Object.assign({}, lastState, next || {});
      const nextTheme = lastState.theme || 'geometric';
      document.documentElement.setAttribute('data-theme', nextTheme);
      if (nextTheme !== currentTheme) {
        buildRenderer(nextTheme);
      } else if (renderer) {
        renderer.setState(lastState);
      }
    }

    setState(lastState);
    if (!reduceMotion) {
      rafId = root.requestAnimationFrame(loop);
    }

    return {
      setState: setState,
      destroy: function () {
        if (rafId !== null) {
          root.cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };
  }

  root.MoveNowThemeStage = { mount: mountThemeStage };
})(typeof globalThis !== 'undefined' ? globalThis : this);
