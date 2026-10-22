/* Sticky header on every page except Home (Home does this itself in js/home.js).
   On phones the header keeps "Janki Patel" and the theme button at the top; the page links live in the bottom pill. */
(function () {
  var hdr = document.querySelector(".site-header");
  if (!hdr || document.body.classList.contains("home-page")) return;
  var stick = function () { hdr.classList.toggle("is-stuck", window.scrollY > 40); };
  window.addEventListener("scroll", stick, { passive: true });
  stick();
})();
