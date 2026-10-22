/* Home page scroll story: sticky header, reveal-on-scroll, nav highlight. */
(() => {
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // reveal elements as they enter the viewport
  const items = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  // highlight the nav link of the section in view (a section can point at another link via data-nav)
  const links = [...document.querySelectorAll(".nav-links a[data-section]")];
  const sections = [...document.querySelectorAll("main > section[id]")];
  if ("IntersectionObserver" in window && links.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const key = e.target.dataset.nav || e.target.id;
        links.forEach((l) => {
          if (l.dataset.section === key) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach((s) => io2.observe(s));
  }
})();
