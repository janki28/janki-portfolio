/* Custom cursor: a sun (light) or moon (dark) that leaves a sparkle / star trail.
   - Only on devices with a real mouse; touch devices get the trail under the finger.
   - Rays expand (sun) or brightness rises (moon) over anything clickable.
   - Trail is one canvas capped at 40 particles; the loop sleeps when nothing is animating.
   - Disabled when the visitor prefers reduced motion. */
(() => {
  const root = document.documentElement;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const HOT = 'a[href], button, [role="button"], input, textarea, select, label, summary, .is-clickable';
  const MAX_PARTICLES = 40;
  const SPACING = 14; // px of travel between spawned particles

  /* ---------- cursor element ---------- */
  let cursor = null;
  if (fine) {
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a);
      rays += `<line x1="${(c * 12).toFixed(2)}" y1="${(s * 12).toFixed(2)}" x2="${(c * 16.5).toFixed(2)}" y2="${(s * 16.5).toFixed(2)}"/>`;
    }
    cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = `
      <svg viewBox="-30 -30 60 60">
        <g class="sun">
          <circle class="glow" r="20" fill="#F2C46B" opacity="0.16"/>
          <g class="sun-rays" stroke="#D9A441" stroke-width="2.2" stroke-linecap="round">${rays}</g>
          <circle r="8" fill="#F2C46B" stroke="#D9A441" stroke-width="1"/>
        </g>
        <g class="moon">
          <mask id="moon-cut"><rect x="-30" y="-30" width="60" height="60" fill="#fff"/><circle cx="5" cy="-3" r="9.5" fill="#000"/></mask>
          <circle class="glow" r="24" fill="#B8C8FF" opacity="0.14"/>
          <circle class="moon-body" r="11" fill="#EDEBE4" mask="url(#moon-cut)"/>
        </g>
      </svg>`;
    document.body.appendChild(cursor);
    document.body.classList.add("has-custom-cursor");
  }

  /* ---------- trail canvas ---------- */
  const canvas = document.createElement("canvas");
  canvas.id = "trail";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const sparkle = new Path2D("M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z");
  const starPath = (() => {
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 5.5 : 2.3, a = (Math.PI / 5) * i - Math.PI / 2;
      i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
    return p;
  })();

  let color = "#D9A441";
  let dark = false;
  const readTheme = () => {
    color = getComputedStyle(root).getPropertyValue("--trail").trim() || color;
    dark = root.dataset.theme === "dark";
  };
  readTheme();
  window.addEventListener("themechange", readTheme);

  const particles = [];
  let running = false, last = 0;

  function spawn(x, y) {
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (dark ? 0.012 : 0.03) + Math.random() * 0.03,
      life: 1,
      decay: 0.0011 + Math.random() * 0.0009,
      s: 0.6 + Math.random() * 0.8,
      r: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.004,
    });
    if (particles.length > MAX_PARTICLES) particles.shift();
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
  }

  function frame(now) {
    const dt = Math.min(now - last, 50);
    last = now;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay * dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.spin * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.scale(p.s, p.s);
      ctx.globalAlpha = Math.min(1, p.life * 1.1) * 0.9;
      ctx.fill(dark ? starPath : sparkle);
      ctx.restore();
    }
    if (particles.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  let lx = -999, ly = -999;
  function trailTo(x, y) {
    if (reduce.matches) return;
    if (Math.hypot(x - lx, y - ly) >= SPACING) { lx = x; ly = y; spawn(x, y); }
  }

  /* ---------- input ---------- */
  let px = 0, py = 0, queued = false;
  function place() {
    queued = false;
    cursor.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    if (cursor) {
      px = e.clientX; py = e.clientY;
      cursor.classList.add("is-visible");
      if (!queued) { queued = true; requestAnimationFrame(place); }
    }
    trailTo(e.clientX, e.clientY);
  }, { passive: true });

  // touch: the trail follows the finger, even while scrolling
  const touch = (e) => { const t = e.touches[0]; if (t) trailTo(t.clientX, t.clientY); };
  window.addEventListener("touchstart", touch, { passive: true });
  window.addEventListener("touchmove", touch, { passive: true });

  if (cursor) {
    document.addEventListener("pointerover", (e) => {
      const hot = e.target.closest && e.target.closest(HOT);
      cursor.classList.toggle("is-hot", !!hot);
    }, { passive: true });
    document.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    root.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
    root.addEventListener("mouseenter", () => cursor.classList.add("is-visible"));
  }
})();
