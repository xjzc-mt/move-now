(function (root) {
  'use strict';

  const listeners = new Set();
  let latestSnapshot = null;
  let previewEngine = null;

  function isMacHost() {
    return Boolean(
      root.webkit &&
      root.webkit.messageHandlers &&
      root.webkit.messageHandlers.moveNow
    );
  }

  function isWindowsHost() {
    return Boolean(root.chrome && root.chrome.webview);
  }

  function send(type, payload) {
    const message = { type: type, payload: payload || {} };
    if (isMacHost()) {
      root.webkit.messageHandlers.moveNow.postMessage(message);
      return;
    }
    if (isWindowsHost()) {
      root.chrome.webview.postMessage(JSON.stringify(message));
      return;
    }
    handleBrowserFallback(message);
  }

  function subscribe(fn) {
    listeners.add(fn);
    if (latestSnapshot) {
      try {
        fn(latestSnapshot);
      } catch (err) {
        console.error('[MoveNowBridge] listener error:', err);
      }
    }
    return function () {
      listeners.delete(fn);
    };
  }

  function dispatchSnapshot(snapshot) {
    latestSnapshot = snapshot;
    listeners.forEach(function (fn) {
      try {
        fn(snapshot);
      } catch (err) {
        console.error('[MoveNowBridge] subscriber error:', err);
      }
    });
  }

  // Host entry point called from Swift WKWebView evaluateJavaScript
  root.__moveNowReceiveState = function (snapshot) {
    dispatchSnapshot(snapshot);
  };

  function handleBrowserFallback(message) {
    if (!previewEngine && root.MoveNowStateMachine) {
      previewEngine = root.MoveNowStateMachine.createEngine({
        hasCompletedOnboarding: true,
        theme: 'geometric'
      });
      setInterval(function () {
        const res = previewEngine.tick({
          dtSec: 0.5,
          secondsSinceLastKey: 5,
          secondsSinceLastMouse: 5,
          mouseDeltaPx: 0,
          isMirroring: false,
          isFullscreenPresentation: false,
          isLockedOrAsleep: false
        });
        dispatchSnapshot(res.snapshot);
      }, 500);
    }
    if (!previewEngine) return;

    let res = null;
    switch (message.type) {
      case 'ready':
        dispatchSnapshot(previewEngine.getSnapshot());
        return;
      case 'updateSettings':
        res = previewEngine.updateSettings(message.payload);
        break;
      case 'completeOnboarding':
        res = previewEngine.completeOnboarding(message.payload);
        break;
      case 'toggleDnd':
        res = previewEngine.toggleDnd(message.payload.active);
        break;
      case 'setDndDuration':
        res = previewEngine.setDndDuration(message.payload.preset);
        break;
      case 'extendCycle':
        res = previewEngine.extendCurrentCycle(message.payload.minutes || 15);
        break;
      case 'resetCycle':
        res = previewEngine.resetCurrentCycle();
        break;
      case 'startBreakNow':
        res = previewEngine.startBreakNow({ isPreview: false });
        break;
      case 'startPreview':
        res = previewEngine.startBreakNow({ isPreview: true });
        break;
      case 'snooze':
        res = previewEngine.snooze();
        break;
      case 'escPressed':
        res = previewEngine.handleEscKey();
        break;
      case 'wakeFromReturn':
        res = previewEngine.wakeFromReturn();
        break;
      case 'hoverSnooze':
        previewEngine.setHoveringSnooze(Boolean(message.payload.hovering));
        return;
      default:
        return;
    }
    if (res && res.snapshot) {
      dispatchSnapshot(res.snapshot);
    }
  }

  root.MoveNowBridge = {
    send: send,
    subscribe: subscribe,
    getLatestSnapshot: function () {
      return latestSnapshot;
    },
    isNativeHost: function () {
      return isMacHost() || isWindowsHost();
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
