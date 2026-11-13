/* Scroll indicator on the right edge: a red rose (light) or an owl (dark)
   slides down a thin track as you scroll, and sways a little with scroll speed.
   It works like a scrollbar: drag the rose/owl, or click the track to jump there.
   Also: a "back to top" button (bottom right) and window.smoothScrollTo(), an eased
   page scroll shared with js/pager.js. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  const rose = `
    <svg class="rose" width="32" height="48" viewBox="-16 -14 32 48" aria-hidden="true">
      <path d="M0 8 L0 32" stroke="#3F6B3A" stroke-width="2" stroke-linecap="round"/>
      <path d="M0 22 Q10 15 15 19 Q9 26 0 24 Z" fill="#3F6B3A"/>
      <circle r="11" fill="#B3202A"/>
      <path d="M0 -7 Q7 -7 7 0 Q7 7 0 7 Q-6 7 -6 1 Q-6 -4 -1 -4 Q3 -4 3 0 Q3 3 0 3" fill="none" stroke="#7E1019" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  const owl = `
    <svg class="owl" width="32" height="44" viewBox="-16 -22 32 44" aria-hidden="true">
      <path d="M-10 -11 L-7 -18 L-2 -13 Z M10 -11 L7 -18 L2 -13 Z" fill="#1F2740" stroke="#EDEBE4" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse rx="12" ry="15" fill="#1F2740" stroke="#EDEBE4" stroke-width="1.4"/>
      <circle cx="-5" cy="-4" r="4.6" fill="#EDEBE4"/><circle cx="5" cy="-4" r="4.6" fill="#EDEBE4"/>
      <circle cx="-5" cy="-4" r="1.8" fill="#0B1020"/><circle cx="5" cy="-4" r="1.8" fill="#0B1020"/>
      <path d="M0 0 L-2.4 4 L2.4 4 Z" fill="#E3B25B"/>
      <path d="M-6 8 Q0 11 6 8" fill="none" stroke="#EDEBE4" stroke-opacity="0.5" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M-4 15 L-4 19 M4 15 L4 19" stroke="#E3B25B" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

  /* ---------- eased page scrolling (one animation at a time) ---------- */
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const maxScroll = () => Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" });
  let anim = 0;
  const root = document.documentElement;
  function stop() { if (anim) { cancelAnimationFrame(anim); anim = 0; } root.classList.remove("is-gliding"); }
  function smoothScrollTo(y, ms, done) {
    stop();
    const from = window.scrollY, to = Math.min(Math.max(y, 0), maxScroll()), d = to - from;
    if (Math.abs(d) < 1 || reduce.matches) { jump(to); root.classList.remove("is-gliding"); if (done) done(); return; }
    const dur = ms || Math.min(1300, Math.max(650, 420 + Math.abs(d) * 0.35));
    const t0 = performance.now();
    root.classList.add("is-gliding");             // touch snapping waits until the glide is over
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      jump(from + d * ease(t));
      if (t < 1) anim = requestAnimationFrame(step);
      else { anim = 0; root.classList.remove("is-gliding"); if (done) done(); }
    };
    anim = requestAnimationFrame(step);
  }
  window.smoothScrollTo = smoothScrollTo;
  window.stopSmoothScroll = stop;
  window.isSmoothScrolling = () => anim !== 0;
  // a person grabbing the page (touch, scrollbar, middle click) always wins over an animation
  ["touchstart", "mousedown"].forEach((ev) => window.addEventListener(ev, (e) => { if (!e.target.closest || !e.target.closest(".to-top, .scroll-track")) stop(); }, { passive: true }));

  /* ---------- the rose / owl track ---------- */
  const track = document.createElement("div");
  track.className = "scroll-track is-clickable";
  track.setAttribute("aria-hidden", "true");
  track.innerHTML = `<div class="scroll-thumb"><div class="tilt">${rose}${owl}</div></div>`;
  document.body.appendChild(track);
  const thumb = track.querySelector(".scroll-thumb");
  const tilt = track.querySelector(".tilt");
  const THUMB = 44;

  let lastY = window.scrollY, rot = 0, ticking = false;

  function update() {
    const max = maxScroll();
    const p = max ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    const room = Math.max(track.clientHeight - THUMB, 0);
    thumb.style.transform = `translate3d(-50%, ${(p * room).toFixed(1)}px, 0)`;

    if (!reduce.matches && !dragging) {
      const v = window.scrollY - lastY;
      rot += (Math.max(-14, Math.min(14, v * 0.5)) - rot) * 0.25;
    } else rot *= 0.5;
    lastY = window.scrollY;
    tilt.style.transform = `rotate(${rot.toFixed(2)}deg)`;

    if (Math.abs(rot) > 0.15) requestAnimationFrame(update);
    else { ticking = false; tilt.style.transform = ""; }
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* dragging: the rose/owl follows the pointer and the page follows it, like a native scrollbar thumb */
  let dragging = false, grab = 0;
  const pFromPointer = (clientY) => {
    const r = track.getBoundingClientRect();
    const room = Math.max(r.height - THUMB, 1);
    return Math.min(Math.max((clientY - r.top - grab) / room, 0), 1);
  };
  track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    stop();
    const tr = thumb.getBoundingClientRect();
    if (e.target.closest(".scroll-thumb")) {
      dragging = true; grab = e.clientY - tr.top;
      track.setPointerCapture(e.pointerId);
      document.documentElement.classList.add("is-dragging-scroll");
    } else {
      grab = THUMB / 2;                          // click on the track: glide there
      smoothScrollTo(pFromPointer(e.clientY) * maxScroll());
    }
  });
  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    jump(pFromPointer(e.clientY) * maxScroll());
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    document.documentElement.classList.remove("is-dragging-scroll");
    window.dispatchEvent(new CustomEvent("scrollbar-release"));
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("lostpointercapture", endDrag);

  /* ---------- back to top ---------- */
  const top = document.createElement("button");
  top.type = "button";
  top.className = "to-top";
  top.setAttribute("aria-label", "Back to top");
  top.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 16V4M4.5 9.5 10 4l5.5 5.5"/></svg>`;
  document.body.appendChild(top);
  top.addEventListener("click", () => smoothScrollTo(0, Math.min(1600, Math.max(700, 500 + window.scrollY * 0.12))));
  let shown = false;
  function toggleTop() {
    const show = window.scrollY > window.innerHeight * 0.8;
    if (show !== shown) { shown = show; top.classList.toggle("is-shown", show); }
  }

  window.addEventListener("scroll", () => { schedule(); toggleTop(); }, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  schedule(); toggleTop();
})();
