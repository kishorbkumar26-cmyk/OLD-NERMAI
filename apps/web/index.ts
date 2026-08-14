import { registerRootComponent } from 'expo';

import App from './App';

// --- PATCH: React Native Web window.onresize crash guard ---
// RN Web's Dimensions module registers a window.onresize handler that crashes
// with "Cannot read properties of undefined (reading 'style')" when any new
// element (e.g. Zoom iframe) is appended to the DOM, triggering a resize event
// while an internal cached DOM node reference is stale. Without this guard,
// the uncaught exception propagates to React's error boundary and unmounts
// the entire meeting player component tree — meaning zoom.html never boots.
//
// This patch intercepts window.onresize assignments (made by RN Web AFTER this
// module runs) and wraps each registered handler in a safe try/catch shell.
(function patchWindowResizeEvents() {
  // 1. Intercept addEventListener to catch RN Web Dimensions handlers
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: any, listener: any, options?: any) {
    if (type === 'resize' && typeof listener === 'function') {
      const safeListener = function(this: any, ...args: any[]) {
        try {
          return listener.apply(this, args);
        } catch (err: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[onresize guard] Suppressed crash in addEventListener("resize"):', err?.message);
          }
        }
      };
      // Keep a reference to the wrapper so removeEventListener works if needed
      (listener as any).__safeListener = safeListener;
      return originalAddEventListener.call(this, type, safeListener, options);
    }
    return originalAddEventListener.apply(this, [type, listener, options] as any);
  };

  const originalRemoveEventListener = window.removeEventListener;
  window.removeEventListener = function(type: any, listener: any, options?: any) {
    if (type === 'resize' && typeof listener === 'function' && (listener as any).__safeListener) {
      return originalRemoveEventListener.call(this, type, (listener as any).__safeListener, options);
    }
    return originalRemoveEventListener.apply(this, [type, listener, options] as any);
  };

  // 2. Also keep the window.onresize property guard just in case
  let _inner: ((this: Window, ev: UIEvent) => any) | null = null;
  try {
    Object.defineProperty(window, 'onresize', {
      configurable: true,
      enumerable: true,
      get() {
        return _inner;
      },
      set(fn: ((this: Window, ev: UIEvent) => any) | null) {
        if (typeof fn !== 'function') {
          _inner = fn;
          return;
        }
        _inner = function safeOnResize(this: Window, ev: UIEvent) {
          try {
            fn.call(this, ev);
          } catch (err: any) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[onresize guard] Suppressed crash in window.onresize setter:', err?.message);
            }
          }
        };
      },
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[onresize guard] window resize crash guards installed.');
    }
  } catch (e) {
    // defineProperty failed (e.g. already non-configurable) — not fatal
    console.warn('[onresize guard] Could not install guard:', e);
  }
})();
// -----------------------------------------------------------

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
