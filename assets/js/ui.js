(function () {
  "use strict";
  const THEME_KEY = "bbw:theme";
  const icons = {
    hindi: "अ", english: "Aa", sanskrit: "ॐ", mathematics: "∑", science: "⚗", "social-science": "🌏",
    physics: "⚛", chemistry: "🧪", biology: "🧬", maths: "∑", accountancy: "📒", economics: "📈",
    "business-studies": "💼", geography: "🗺", history: "🏛", "political-science": "⚖", psychology: "🧠",
    reasoning: "🧩", "general-knowledge": "🌐", "general-awareness": "🌐", "current-affairs": "📰",
    "quantitative-aptitude": "🔢", "general-studies": "📚", computer: "💻"
  };
  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function subjectIcon(slug) { return icons[slug] || "📖"; }
  function localized(value, fallback) {
    if (value && typeof value === "object") return value.hi || value.en || fallback || "";
    return value || fallback || "";
  }
  function secondary(value) {
    if (value && typeof value === "object" && value.en && value.en !== value.hi) return value.en;
    return "";
  }
  function setBrandSubtitle(text) {
    document.querySelectorAll(".brand small").forEach(el => { el.textContent = text; });
  }
  function courseCard(course, progress) {
    const soon = course.status === "coming-soon";
    const name = escape(localized(course.name, course.slug));
    const en = secondary(course.name);
    const style = course.accent ? ` style="--accent:${escape(course.accent)}"` : "";
    const icon = `<span class="course-icon">${escape(course.icon || "📘")}</span>`;
    const chips = soon
      ? `<span class="chip">जल्द आ रहा है</span>`
      : `<span class="chip live">Live</span><span class="chip">${number(course.subjectCount || 0)} विषय</span><span class="chip good">${number(course.testCount || 0)} टेस्ट</span>`;
    const note = !soon && progress
      ? `<span class="course-progress">${number(progress.attempts)} टेस्ट दिए • बेस्ट ${progress.bestScore}%</span>`
      : `<span class="course-progress muted">${escape(localized(course.tagline, ""))}</span>`;
    const cta = soon ? "" : `<span class="course-cta">Start →</span>`;
    const body = `${icon}<span class="course-body"><strong>${name}</strong>${en ? `<small>${escape(en)}</small>` : ""}${note}<span class="course-meta">${chips}</span>${cta}</span>`;
    return soon
      ? `<div class="course-card is-soon" aria-disabled="true"${style}>${body}</div>`
      : `<a class="course-card is-live" href="course.html?course=${encodeURIComponent(course.slug)}"${style}>${body}</a>`;
  }
  function coursePill(course) {
    if (!course) return "";
    const style = course.accent ? ` style="--accent:${escape(course.accent)}"` : "";
    return `<a class="course-pill" href="index.html?pick=1"${style}><span class="course-pill-icon">${escape(course.icon || "📘")}</span>${escape(localized(course.name, course.slug))}<span aria-hidden="true">▾</span><span class="sr-only">कोर्स बदलें</span></a>`;
  }
  function videoCard(video, heading, options) {
    options = options || {};
    const headingText = heading || "अध्याय का वीडियो";
    if (!video) {
      if (!options.placeholder) return "";
      return `<div class="video-card is-soon" aria-disabled="true"><span class="video-play" aria-hidden="true">▶</span><span class="video-info"><strong>${escape(headingText)}</strong><small>वीडियो जल्द आ रहा है</small></span><span class="btn btn-ghost">Soon</span></div>`;
    }
    const title = video.title || "YouTube पर सीखें";
    const note = options.note ? `<small>${escape(options.note)}</small>` : `<small>YouTube पर खुलता है</small>`;
    const cta = options.cta || "YouTube पर देखें ↗";
    const cls = `video-card${options.emphasise ? " is-revise" : ""}`;
    return `<a class="${cls}" href="${escape(video.url)}" target="_blank" rel="noopener noreferrer"><span class="video-play" aria-hidden="true">▶</span><span class="video-info"><strong>${escape(headingText)}</strong><small>${escape(title)}</small>${note}</span><span class="btn btn-outline">${escape(cta)}</span></a>`;
  }
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
    document.body.classList.add("sheet-open");
    wrap.querySelector(".sheet-close").onclick = closeSheet;
    wrap.addEventListener("click", e => { if (e.target === wrap && !(options && options.locked)) closeSheet(); });
    document.addEventListener("keydown", onEscape);
    wrap.querySelector("button,input,select,textarea,a")?.focus();
    return wrap;
  }
  function onEscape(e) { if (e.key === "Escape") closeSheet(); }
  function closeSheet() { document.querySelector("#bbw-sheet")?.remove(); document.body.classList.remove("sheet-open"); document.removeEventListener("keydown", onEscape); }
  document.addEventListener("click", e => { if (e.target.closest(".theme-toggle")) toggleTheme(); });
  initTheme();
  window.BBWUI = { escape, subjectIcon, localized, secondary, setBrandSubtitle, courseCard, coursePill, videoCard, errorState, formatDuration, number, initTheme, toggleTheme, openSheet, closeSheet };
})();
