/* One gesture, one step (Home and About pages, mouse wheel / trackpad / keyboard).
   - Each scroll gesture glides to the next section (or back to the previous one).
   - A section taller than the screen is stepped through in screen-sized chunks first.
   - Inside the Experience section, each gesture moves the bee/firefly to the next role only,
     then on to the point where it flies away, then to the photos.
   Touch screens keep their normal swipe scrolling. Dragging the rose/owl still works freely. */
(() => {
  if (!window.smoothScrollTo) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const main = document.querySelector("main");
  if (!main) return;

  const QUIET = 170;        // ms of wheel silence that ends one gesture (swallows trackpad momentum)
  const NEAR = 6;           // px: "already here"
  const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

  // every place the page can rest, top to bottom
  function stops() {
    const vh = window.innerHeight, max = maxScroll(), out = [0];
    const sections = [...main.children].filter((el) => el.tagName === "SECTION");
    for (const sec of sections) {
      const top = absTop(sec), h = sec.offsetHeight;
      const xp = sec.querySelector("[data-xp]");
      const xs = xp && xp.xpStops ? xp.xpStops() : null;
      out.push(top);
      if (xs) {
        xs.roles.forEach((y) => { if (y > top + 40) out.push(y); });   // roles already in place at the section top need no extra stop
        out.push(xs.end);
      } else if (h > vh * 1.1) {
        const step = vh * 0.82;
        for (let y = top + step; y < top + h - vh - 40; y += step) out.push(y);
        out.push(top + h - vh);
      }
    }
    out.push(max);
    const clean = out.map((y) => Math.round(Math.min(Math.max(y, 0), max))).sort((a, b) => a - b);
    return clean.filter((y, i) => i === 0 || y - clean[i - 1] > 40);
  }

  let locked = false, lastWheel = 0, queued = 0;
  const busy = () => window.isSmoothScrolling();   // false again if the glide finished or the visitor grabbed the page

  function go(dir) {
    const y = window.scrollY, list = stops();
    let to;
    if (dir > 0) to = list.find((s) => s > y + NEAR);
    else for (let i = list.length - 1; i >= 0; i--) if (list[i] < y - NEAR) { to = list[i]; break; }
    if (to === undefined) return;
    const d = Math.abs(to - y);
    locked = true;   // the rest of this gesture (and its momentum) is spent on this one step
    queued = 0;
    window.smoothScrollTo(to, reduce.matches ? 0 : Math.min(1150, Math.max(720, 520 + d * 0.3)), () => {
      if (queued) { const q = Math.sign(queued); queued -= q; const rest = queued; go(q); queued = rest; }   // wheel turns made during the glide: take those steps next
    });
  }

  // is the wheel inside something that scrolls on its own (a gallery strip, a dialog)?
  function ownScroller(el, dy) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2) {
        if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
      }
    }
    return false;
  }

  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey || e.defaultPrevented) return;                          // pinch-zoom
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;                  // sideways swipes
    if (document.querySelector("dialog[open], .lightbox.is-open")) return;
    if (ownScroller(e.target, e.deltaY)) return;
    e.preventDefault();
    const now = performance.now(), gap = now - lastWheel;
    lastWheel = now;
    if (busy()) {
      if (gap >= QUIET) { const d = e.deltaY > 0 ? 1 : -1; queued = Math.sign(queued) === -d ? d : Math.max(-3, Math.min(3, queued + d)); }
      return;
    }
    if (locked) { if (gap < QUIET) return; locked = false; }
    if (Math.abs(e.deltaY) < 2) return;
    go(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    let dir = 0;
    if (e.key === "PageDown" || e.key === "ArrowDown" || (e.key === " " && !e.shiftKey)) dir = 1;
    else if (e.key === "PageUp" || e.key === "ArrowUp" || (e.key === " " && e.shiftKey)) dir = -1;
    else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      window.smoothScrollTo(e.key === "Home" ? 0 : maxScroll());
      return;
    }
    if (!dir) return;
    if (e.key === " " && t && t.closest && t.closest("a, button")) return;  // space presses a focused button
    e.preventDefault();
    if (!busy()) go(dir);
  });

  // after dragging the rose/owl, the next wheel turn starts a fresh step
  window.addEventListener("scrollbar-release", () => { locked = false; });
})();
