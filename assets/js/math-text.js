(function () {
  "use strict";
  function esc(s) { return BBWUI.escape(s); }
  function inline(text) {
    let safe = esc(text);
    safe = safe.replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:])/g, "$1<em>$2</em>");
    return safe.replace(/(^|[\s>])(\d+)\^(-?\d+)/g, (_, p, base, power) => `${p}${base}<sup>${power}</sup>`);
  }
  function math(tex, display) {
    if (window.katex && typeof katex.renderToString === "function") {
      try { return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore" }); } catch (_) {}
    }
    return display ? `<span class="math-display">$$${esc(tex)}$$</span>` : `$${esc(tex)}$`;
  }
  function render(text) {
    const source = String(text == null ? "" : text), tokens = [];
    let replaced = source.replace(/\$\$([\s\S]+?)\$\$/g, (_, x) => `\u0000${tokens.push(math(x.trim(), true)) - 1}\u0000`)
      .replace(/\$([^$\n]+?)\$/g, (_, x) => `\u0000${tokens.push(math(x.trim(), false)) - 1}\u0000`);
    replaced = inline(replaced).replace(/\n/g, "<br>");
    return replaced.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
  }
  function hydrate(root) { (root || document).querySelectorAll("[data-math]").forEach(el => { el.innerHTML = render(el.textContent); el.removeAttribute("data-math"); }); }
  window.BBWMath = { render, hydrate };
})();
