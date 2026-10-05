/* Divar housing dashboard — shared behaviour: navigation, theme, lightbox, chart helpers */
(function () {
  const PAGES = [
    ["index.html", "Overview"],
    ["statistics.html", "Descriptive stats"],
    ["hypothesis.html", "Hypothesis tests"],
    ["clustering.html", "Clustering & recommender"],
    ["prediction.html", "Price prediction"],
    ["maps.html", "Interactive maps"],
  ];

  // ---------- theme ----------
  const THEME_KEY = "divar-dash-theme";
  function storedTheme() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  applyTheme(storedTheme());
  function isDark() {
    const t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // ---------- header ----------
  function buildHeader() {
    const here = location.pathname.split("/").pop() || "index.html";
    const bar = document.createElement("header");
    bar.className = "topbar";
    bar.innerHTML =
      '<div class="topbar-inner">' +
      '<a class="brand" href="index.html"><span class="brand-mark">⌂</span><span>Divar Housing Analysis</span></a>' +
      '<nav class="nav">' +
      PAGES.map(([href, name]) => `<a href="${href}"${href === here ? ' class="active"' : ""}>${name}</a>`).join("") +
      "</nav>" +
      '<button class="theme-btn" type="button" title="Toggle light / dark" aria-label="Toggle theme">◐</button>' +
      "</div>";
    document.body.prepend(bar);
    bar.querySelector(".theme-btn").addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      Dash.redraw();
    });
  }

  // ---------- lightbox for notebook figures ----------
  function buildLightbox() {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = "<img alt=''>";
    document.body.appendChild(box);
    box.addEventListener("click", () => box.classList.remove("open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") box.classList.remove("open"); });
    document.querySelectorAll(".figure img").forEach((img) => {
      img.loading = "lazy";
      img.addEventListener("click", () => {
        box.querySelector("img").src = img.src;
        box.querySelector("img").alt = img.alt;
        box.classList.add("open");
      });
    });
  }

  // ---------- chart registry (re-drawn on theme switch) ----------
  const builders = [];
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function chartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.font.family = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = css("--text-2");
    Chart.defaults.borderColor = css("--grid");
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.boxHeight = 8;
    Chart.defaults.plugins.tooltip.backgroundColor = isDark() ? "#2b2b29" : "#ffffff";
    Chart.defaults.plugins.tooltip.titleColor = css("--text");
    Chart.defaults.plugins.tooltip.bodyColor = css("--text-2");
    Chart.defaults.plugins.tooltip.borderColor = css("--border");
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.elements.bar.borderRadius = 4;
    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.point.radius = 4;
    Chart.defaults.elements.point.hoverRadius = 6;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation.duration = 450;
  }

  const Dash = {
    css,
    isDark,
    series(i) { return css("--s" + ((i % 8) + 1)); },
    alpha(hex, a) {
      const h = hex.replace("#", "");
      const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    },
    /** register(fn) — fn() builds charts; it is called now and again after a theme switch */
    register(fn) { builders.push(fn); if (document.readyState !== "loading") { chartDefaults(); fn(); } },
    charts: {},
    /** make(id, config) — create or replace the Chart in canvas #id */
    make(id, config) {
      if (Dash.charts[id]) Dash.charts[id].destroy();
      const el = document.getElementById(id);
      if (!el) return null;
      Dash.charts[id] = new Chart(el, config);
      return Dash.charts[id];
    },
    redraw() { chartDefaults(); builders.forEach((fn) => fn()); },
    /** segmented control: container with <button data-v>; calls onChange(value) */
    seg(el, onChange) {
      if (typeof el === "string") el = document.querySelector(el);
      el.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          el.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
          onChange(b.dataset.v);
        })
      );
      const on = el.querySelector("button.on") || el.querySelector("button");
      return on ? on.dataset.v : null;
    },
    tabs(root) {
      if (typeof root === "string") root = document.querySelector(root);
      const btns = root.querySelectorAll(".tabs button");
      btns.forEach((b) =>
        b.addEventListener("click", () => {
          btns.forEach((x) => x.classList.toggle("on", x === b));
          root.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("on", p.id === b.dataset.tab));
          Object.values(Dash.charts).forEach((c) => c.resize());
        })
      );
    },
    fmt(n, d = 0) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }); },
    compact(n) {
      const a = Math.abs(n);
      if (a >= 1e12) return (n / 1e12).toFixed(1) + "T";
      if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 1 : 2) + "B";
      if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
      if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + "k";
      return String(Math.round(n * 100) / 100);
    },
    /** standard normal CDF (Abramowitz–Stegun 7.1.26 via erf) */
    normCdf(z) {
      const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
      const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
      return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
    },
  };
  window.Dash = Dash;

  document.addEventListener("DOMContentLoaded", () => {
    buildHeader();
    buildLightbox();
    chartDefaults();
    builders.forEach((fn) => fn());
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (!document.documentElement.getAttribute("data-theme")) Dash.redraw();
      });
    }
  });
})();
