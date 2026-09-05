// Toolcrate sound-toggle handling, shared by games that play sound.
// Include this alongside theme.js, after a #soundToggle button in the markup.
window.ToolcrateSound = (function () {
  var KEY = 'toolcrate-sound-muted';

  function isMuted() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  function applyIcon() {
    var btn = document.getElementById('soundToggle');
    if (!btn) return;
    var muted = isMuted();
    btn.textContent = muted ? '🔇' : '🔊';
    btn.setAttribute('aria-pressed', String(muted));
    btn.title = muted ? 'Unmute sound' : 'Mute sound';
  }

  function setMuted(muted) {
    try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    applyIcon();
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyIcon();
    var btn = document.getElementById('soundToggle');
    if (btn) btn.addEventListener('click', function () { setMuted(!isMuted()); });
  });

  return { isMuted: isMuted, setMuted: setMuted };
})();
