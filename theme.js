// Toolcrate theme handling. Include this AFTER the theme-toggle button markup.
(function () {
  function getPreferredTheme() {
    const saved = localStorage.getItem('toolcrate-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    applyTheme(getPreferredTheme());
    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('toolcrate-theme', next);
      applyTheme(next);
    });
  });

  // Ctrl/Cmd+Enter runs a tool's primary action (its first non-secondary
  // button), while focused anywhere on the page. No-op on pages without
  // one, e.g. tools with no explicit submit button, or non-tool pages.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || (!e.ctrlKey && !e.metaKey)) return;
    const btn = document.querySelector('.panel .btn-row button:not(.secondary)');
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  });

  // "Add to Home Screen" hint: a native install prompt on Android/Chrome
  // (via beforeinstallprompt — there's no equivalent way to trigger it
  // programmatically), and manual instructions on iOS Safari, which has no
  // install API at all. Each page's own <meta name="apple-mobile-web-app-title">
  // is set to that page's own tool name, so pinning a specific tool on iOS
  // gets a distinct home-screen icon and label rather than a generic one.
  (function () {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    const DISMISS_KEY = 'toolcrate-install-hint-dismissed';
    function isDismissed() {
      try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
    }
    function dismiss() {
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* storage unavailable */ }
      hideBanner();
    }

    let banner = null;
    function showBanner(text, actionLabel, onAction) {
      if (isDismissed() || banner || !document.body) return;
      banner = document.createElement('div');
      banner.className = 'install-hint';

      const textEl = document.createElement('span');
      textEl.textContent = text;
      banner.appendChild(textEl);

      if (actionLabel) {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = 'install-hint-action';
        actionBtn.textContent = actionLabel;
        actionBtn.addEventListener('click', function () {
          if (onAction) onAction();
          dismiss();
        });
        banner.appendChild(actionBtn);
      }

      const dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.className = 'install-hint-dismiss';
      dismissBtn.setAttribute('aria-label', 'Dismiss');
      dismissBtn.textContent = '✕';
      dismissBtn.addEventListener('click', dismiss);
      banner.appendChild(dismissBtn);

      document.body.appendChild(banner);
    }
    function hideBanner() {
      if (banner) { banner.remove(); banner = null; }
    }

    // Each page links its own manifest (its own start_url/scope), so
    // installing from here installs just this tool or game as its own
    // home-screen app — not a shortcut to the toolcrate homepage. Name the
    // banner after the current page for that reason.
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const appTitle = (titleMeta && titleMeta.content) || 'toolcrate';

    // Android / Chrome / Edge: the browser offers a real install prompt.
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      const deferredPrompt = e;
      showBanner('Install ' + appTitle + ' for quick access from your home screen.', 'Install', function () {
        deferredPrompt.prompt();
      });
    });

    // iOS Safari has no install API — "Add to Home Screen" is a manual
    // step from the Share sheet, so just point people at it.
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (isIOS && isSafari) {
      showBanner('Add ' + appTitle + ' to your Home Screen: tap Share, then "Add to Home Screen".', null, null);
    }
  })();
})();
