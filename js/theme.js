/* Theme toggle: sun = light, moon = dark.
   The very first paint is handled by the tiny inline script in each page <head>. */
(() => {
  const root = document.documentElement;
  const KEY = "theme";
  const current = () => (root.dataset.theme === "dark" ? "dark" : "light");

  function syncControls() {
    const dark = current() === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const label = dark ? "Switch to light theme" : "Switch to dark theme";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0B1020" : "#FAF7F2");
  }

  function apply(theme, persist) {
    root.dataset.theme = theme;
    if (persist) {
      try { localStorage.setItem(KEY, theme); } catch (e) { /* private mode: ignore */ }
    }
    syncControls();
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.classList.add("theme-anim");
      apply(current() === "dark" ? "light" : "dark", true);
      setTimeout(() => root.classList.remove("theme-anim"), 450);
    });
  });

  // follow the system setting until the visitor picks a theme themselves
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = (e) => {
    try { if (localStorage.getItem(KEY)) return; } catch (err) { /* ignore */ }
    apply(e.matches ? "dark" : "light", false);
  };
  if (mq.addEventListener) mq.addEventListener("change", onSystem);

  syncControls();
})();
