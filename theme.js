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

  // A registered service worker is one of Chrome/Edge's hard requirements
  // for a page to be considered installable at all — without one,
  // beforeinstallprompt simply never fires, on any page, no matter how
  // long you wait. Register unconditionally (not just when we're about to
  // show install UI) so it's in place well before it's needed, and so
  // installed pages get real offline caching, not just a shortcut that
  // fails to load without a connection.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* not fatal */ });
    });
  }

  // "Add to Home Screen": a native install prompt on Android/Chrome/Edge
  // (via beforeinstallprompt — there's no way to trigger that
  // programmatically, the browser decides when it's eligible to fire),
  // manual instructions on iOS Safari, which has no install API at all,
  // and a persistent button next to the share button on both — the
  // banner alone is easy to miss or dismiss once and never see again,
  // which isn't what a page-specific "install just this tool" feature
  // should do. Each page's own <meta name="apple-mobile-web-app-title">
  // is set to that page's own tool name, so pinning a specific tool gets
  // a distinct home-screen icon and label rather than a generic one.
  (function () {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const appTitle = (titleMeta && titleMeta.content) || 'toolcrate';

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    const iosSupported = isIOS && isSafari;

    let deferredPrompt = null;
    let installBtn = null;

    function doInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; updateInstallButton(); });
      } else if (iosSupported) {
        showBanner('Add ' + appTitle + ' to your Home Screen: tap Share, then "Add to Home Screen".', null, null);
      }
    }

    function ensureInstallButton() {
      if (installBtn || !document.body) return installBtn;
      const shareBtn = document.getElementById('shareBtn');
      if (!shareBtn) return null;
      installBtn = document.createElement('button');
      installBtn.type = 'button';
      installBtn.className = 'share-btn install-btn';
      installBtn.hidden = true;
      installBtn.addEventListener('click', doInstall);
      shareBtn.insertAdjacentElement('afterend', installBtn);
      return installBtn;
    }

    function updateInstallButton() {
      const btn = ensureInstallButton();
      if (!btn) return;
      if (deferredPrompt) {
        btn.hidden = false;
        btn.textContent = 'Install ' + appTitle;
      } else if (iosSupported) {
        btn.hidden = false;
        btn.textContent = 'Add to Home Screen';
      } else {
        btn.hidden = true;
      }
    }

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

    // Android / Chrome / Edge: the browser offers a real install prompt.
    // Dismissing the passive banner below only stops that one-time nudge
    // — the button stays put and clickable regardless, since it's a
    // deliberate action someone can come back for any time.
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      updateInstallButton();
      showBanner('Install ' + appTitle + ' for quick access from your home screen.', 'Install', function () {
        deferredPrompt.prompt();
      });
    });

    if (iosSupported) {
      updateInstallButton();
      showBanner('Add ' + appTitle + ' to your Home Screen: tap Share, then "Add to Home Screen".', null, null);
    }

    document.addEventListener('DOMContentLoaded', updateInstallButton);
  })();
})();
