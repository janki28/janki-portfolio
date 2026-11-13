/* About page, Experience section.
   A bee (light) or firefly (dark) flies a fixed path as you scroll. The path never changes;
   scrolling only decides how far along it the traveler is, and the traveler glides there
   at a gentle pace. Roles appear one at a time as it arrives. At the end it flies away.
   There are two drawings of the same route: a wide one (tablet, desktop) and a narrow one (phone). */
(() => {
  const xp = document.querySelector("[data-xp]");
  if (!xp) return;
  const cards = [...xp.querySelectorAll(".xp-card")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const phone = window.matchMedia("(max-width: 700px)");
  const HOLD = 0.3;   // share of each stretch spent resting at the last role before flying on

  function timeline(svg) {
    const route = svg.querySelector(".xp-route-fg");
    const routeBg = svg.querySelector(".xp-route-bg");
    const traveler = svg.querySelector(".xp-traveler");
    const nodes = [...svg.querySelectorAll(".xp-node")];
    const W = +svg.dataset.w;
    const total = route.getTotalLength();
    const [sx, sy] = svg.dataset.start.split(",").map(Number);
    const mapEnd = Number(svg.dataset.mapEnd);
    const pre = Number(svg.dataset.mapStart || 0);   // the traveler waits at the start while the section scrolls into view
    const pts = [{ x: sx, y: sy - pre }, ...nodes.map((n) => ({ x: +n.dataset.x, y: +n.dataset.y })), { x: 0, y: mapEnd }];

    // how far along the path each milestone sits (searched forward so loops never confuse it)
    const lens = [0];
    let from = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      let best = from, bd = Infinity;
      for (let l = from; l <= total; l += 3) {
        const q = route.getPointAtLength(l);
        const d = (q.x - pts[i].x) ** 2 + (q.y - pts[i].y) ** 2;
        if (d < bd) { bd = d; best = l; }
      }
      lens.push(best);
      from = best + 20;
    }
    lens.push(total);
    const lastNode = nodes.length;

    // the gold route is drawn by giving it the same dash pattern as the grey one, but only up to the traveler
    // (much cheaper to repaint every frame than masking the whole drawing)
    let dash = [14, 13], drawn = -1;
    function readDash() {
      const v = getComputedStyle(routeBg).strokeDasharray.split(/[\s,]+/).map(parseFloat).filter((n) => n > 0);
      if (v.length >= 2) dash = [v[0], v[1]];
      drawn = -1;
    }
    function drawRoute(len) {
      const L = Math.round(len);
      if (L === drawn) return;
      drawn = L;
      const cyc = dash[0] + dash[1], n = Math.floor(L / cyc), r = L - n * cyc;
      let s = "";
      for (let i = 0; i < n; i++) s += dash[0] + " " + dash[1] + " ";
      route.style.strokeDasharray = s + Math.min(r, dash[0]).toFixed(1) + " " + Math.ceil(total + cyc);
    }
    readDash();

    let ys = [], k = 1;
    let disp = 0, tgt = 0, face = 1, dir = 1, angle = 0, raf = 0, last = 0;

    function measure() {
      readDash();
      const r = svg.getBoundingClientRect();
      k = r.width / W || 1;
      const top = r.top + window.scrollY;
      ys = pts.map((p) => top + p.y * k);
    }

    function target() {
      const R = window.scrollY + window.innerHeight * 0.55;
      if (R <= ys[0]) return 0;
      if (R >= ys[ys.length - 1]) return total;
      let i = 0;
      while (i < ys.length - 2 && R > ys[i + 1]) i++;
      const t = (R - ys[i]) / (ys[i + 1] - ys[i]);
      const e = Math.max(0, (t - HOLD) / (1 - HOLD));
      return lens[i] + e * (lens[i + 1] - lens[i]);
    }

    function setStates(current) {
      nodes.forEach((n, i) => {
        n.classList.toggle("is-lit", i <= current);
        n.classList.toggle("is-current", i === current);
      });
      cards.forEach((c, i) => {
        c.classList.toggle("is-reached", i <= current);
        c.classList.toggle("is-current", i === current);
      });
    }

    function place() {
      const q = route.getPointAtLength(disp);
      const a = route.getPointAtLength(Math.max(0, disp - 16));
      const b = route.getPointAtLength(Math.min(total, disp + 16));
      const dx = (b.x - a.x) * dir, dy = (b.y - a.y) * dir;
      if (dx > 3) face = 1; else if (dx < -3) face = -1;
      const deg = (Math.atan2(dy, dx * face) * 180) / Math.PI;
      angle += (Math.max(-50, Math.min(50, deg)) - angle) * 0.25;

      // a little bigger when the drawing is scaled down, and smaller and fainter as it flies off at the end
      let s = Math.min(1.6, Math.max(1, 0.8 / k)), o = 1;
      if (disp > lens[lastNode]) {
        const f = (disp - lens[lastNode]) / (total - lens[lastNode]);
        const e = Math.max(0, (f - 0.45) / 0.55);
        s *= 1 - 0.45 * e; o = 1 - e;
      }
      traveler.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(${(face * s).toFixed(3)} ${s.toFixed(3)}) rotate(${angle.toFixed(1)})`);
      traveler.style.opacity = o.toFixed(3);
      drawRoute(disp);

      let current = -1;
      for (let i = 0; i < nodes.length; i++) if (disp >= lens[i + 1] - 10) current = i;
      setStates(current);
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const diff = tgt - disp;
      if (Math.abs(diff) > 1.5) {
        dir = diff >= 0 ? 1 : -1;
        disp += diff * (1 - Math.exp(-dt * 8.5));    // glide: a fast scroll never makes the traveler teleport
        place();
        raf = requestAnimationFrame(tick);
      } else {
        disp = tgt; place(); raf = 0;
      }
    }

    return {
      go() {
        tgt = target();
        const r = svg.getBoundingClientRect();
        if (r.bottom < -400 || r.top > window.innerHeight + 400) {   // off screen: no animation work at all
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
          if (Math.abs(tgt - disp) > 0.5) { disp = tgt; place(); }
          return;
        }
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
      },
      activate() {                                  // jump straight to where the page is now
        cancelAnimationFrame(raf); raf = 0;
        measure();
        if (reduce.matches) {                       // reduced motion: no flying, show the finished timeline
          disp = lens[lastNode]; dir = 1; place();
          traveler.style.opacity = "1";
          nodes.forEach((n, i) => { n.classList.add("is-lit"); n.classList.toggle("is-current", i === nodes.length - 1); });
          cards.forEach((c, i) => { c.classList.add("is-reached"); c.classList.toggle("is-current", i === cards.length - 1); });
        } else { disp = tgt = target(); place(); }
      },
      relayout() { measure(); if (reduce.matches) this.activate(); else this.go(); },
      // page scroll positions where the traveler sits exactly on each role, plus where it has flown off
      stops() {
        measure();
        const at = window.innerHeight * 0.55;
        return { roles: ys.slice(1, -1).map((y) => y - at), end: ys[ys.length - 1] - at };
      },
    };
  }

  // build each drawing's timeline only when it is on screen (some browsers can't measure a hidden SVG path)
  function lazy(svg) {
    let tl = null;
    const get = () => tl || (tl = timeline(svg));
    return { go: () => get().go(), activate: () => get().activate(), relayout: () => get().relayout(), stops: () => get().stops() };
  }
  const wide = lazy(xp.querySelector(".xp-svg--d"));
  const narrow = lazy(xp.querySelector(".xp-svg--m"));
  const active = () => (phone.matches ? narrow : wide);

  // if anything goes wrong, show the finished timeline instead of an empty section
  function safe(fn) { return () => { try { fn(); } catch (e) { xp.classList.add("xp-static"); } }; }

  // js/pager.js steps the page one role at a time using these positions
  xp.xpStops = () => { try { return active().stops(); } catch (e) { return null; } };

  // touch screens: invisible snap points, so a swipe settles on each role instead of flying past it
  const touch = window.matchMedia("(hover: none) and (pointer: coarse)");
  let snaps = [];
  function placeSnaps() {
    if (!touch.matches || reduce.matches) { snaps.forEach((s) => s.remove()); snaps = []; document.documentElement.classList.remove("has-snap"); return; }
    const s = xp.xpStops();
    if (!s) return;
    const host = xp.parentElement;    // outside .xp, which clips on phones (a clipping box would capture the snap points)
    const top = host.getBoundingClientRect().top + window.scrollY;
    const ys = [...s.roles, s.end].map((y) => y - top).filter((y) => y > 40);
    while (snaps.length < ys.length) { const d = document.createElement("div"); d.className = "xp-snap"; d.setAttribute("aria-hidden", "true"); host.appendChild(d); snaps.push(d); }
    while (snaps.length > ys.length) snaps.pop().remove();
    ys.forEach((y, i) => { snaps[i].style.top = y.toFixed(0) + "px"; });
    document.documentElement.classList.add("has-snap");
  }

  try { active().activate(); xp.classList.add("is-live"); } catch (e) { xp.classList.add("xp-static"); }
  window.addEventListener("scroll", safe(() => { if (!reduce.matches) active().go(); }), { passive: true });
  window.addEventListener("resize", safe(() => { active().relayout(); placeSnaps(); }));
  window.addEventListener("load", safe(() => { active().relayout(); placeSnaps(); }));
  safe(placeSnaps)();
  if (phone.addEventListener) phone.addEventListener("change", safe(() => active().activate()));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(safe(() => { active().relayout(); placeSnaps(); }));
})();
