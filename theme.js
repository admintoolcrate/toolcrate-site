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
})();
