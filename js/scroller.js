/* Scroll indicator on the right edge: a red rose (light) or an owl (dark)
   slides down a thin track as you scroll, and sways a little with scroll speed.
   Native scrolling is untouched. */
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

  const track = document.createElement("div");
  track.className = "scroll-track";
  track.setAttribute("aria-hidden", "true");
  track.innerHTML = `<div class="scroll-thumb"><div class="tilt">${rose}${owl}</div></div>`;
  document.body.appendChild(track);
  const thumb = track.querySelector(".scroll-thumb");
  const tilt = track.querySelector(".tilt");

  let lastY = window.scrollY, rot = 0, ticking = false;

  function update() {
    const doc = document.documentElement;
    const max = Math.max(doc.scrollHeight - window.innerHeight, 0);
    const p = max ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    const room = Math.max(track.clientHeight - 44, 0);
    thumb.style.transform = `translate3d(-50%, ${(p * room).toFixed(1)}px, 0)`;

    if (!reduce.matches) {
      const v = window.scrollY - lastY;
      lastY = window.scrollY;
      rot += (Math.max(-14, Math.min(14, v * 0.5)) - rot) * 0.25;
    } else rot = 0;
    tilt.style.transform = `rotate(${rot.toFixed(2)}deg)`;

    if (Math.abs(rot) > 0.15) requestAnimationFrame(update);
    else { ticking = false; tilt.style.transform = ""; }
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  schedule();
})();
