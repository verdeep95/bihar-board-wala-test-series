(function () {
  "use strict";
  const THEME_KEY = "bbw:theme";
  const icons = { hindi: "अ", english: "Aa", sanskrit: "ॐ", mathematics: "∑", science: "⚗", "social-science": "🌏" };
  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function subjectIcon(slug) { return icons[slug] || "📖"; }
  function errorState(message) {
    const fileHint = location.protocol === "file:" ? "<small>इसे file:// से नहीं, local HTTP server से खोलें।</small>" : "";
    return `<div class="error-state"><strong>कुछ गड़बड़ हुई</strong><p>${escape(message)}</p>${fileHint}</div>`;
  }
  function formatDuration(value) {
    const seconds = value > 100000 ? Math.floor(value / 1000) : Math.max(0, Math.floor(value || 0));
    const hours = Math.floor(seconds / 3600), mins = Math.floor((seconds % 3600) / 60), secs = seconds % 60;
    return `${hours ? `${hours}h ` : ""}${mins ? `${mins}m ` : ""}${secs}s`;
  }
  function number(value) { return new Intl.NumberFormat("hi-IN").format(Number(value) || 0); }
  function setTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll(".theme-toggle").forEach(b => {
      b.innerHTML = theme === "dark" ? "☀️" : "🌙";
      b.setAttribute("aria-label", theme === "dark" ? "Use light mode" : "Use dark mode");
    });
  }
  function initTheme() {
    let theme;
    try { theme = localStorage.getItem(THEME_KEY); } catch (_) {}
    if (!theme) theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(theme);
  }
  function toggleTheme() { setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark"); }
  function openSheet(title, content, options) {
    closeSheet();
    const wrap = document.createElement("div");
    wrap.className = "sheet-backdrop";
    wrap.id = "bbw-sheet";
    wrap.innerHTML = `<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-head"><h2 id="sheet-title">${escape(title)}</h2><button class="sheet-close" aria-label="Close">×</button></div><div class="sheet-body">${content}</div></section>`;
    document.body.appendChild(wrap);
    wrap.querySelector(".sheet-close").onclick = closeSheet;
    wrap.addEventListener("click", e => { if (e.target === wrap && !(options && options.locked)) closeSheet(); });
    document.addEventListener("keydown", onEscape);
    wrap.querySelector("button,input,select,textarea,a")?.focus();
    return wrap;
  }
  function onEscape(e) { if (e.key === "Escape") closeSheet(); }
  function closeSheet() { document.querySelector("#bbw-sheet")?.remove(); document.removeEventListener("keydown", onEscape); }
  document.addEventListener("click", e => { if (e.target.closest(".theme-toggle")) toggleTheme(); });
  initTheme();
  window.BBWUI = { escape, subjectIcon, errorState, formatDuration, number, initTheme, toggleTheme, openSheet, closeSheet };
})();
