/* Flip postcard: hover flips on desktop (CSS). On touch screens, tap flips it.
   Keyboard: tabbing into the back of the card flips it (CSS :focus-within). */
(() => {
  if (window.matchMedia("(hover: hover)").matches) return;
  document.querySelectorAll(".flip").forEach((flip) => {
    flip.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      flip.classList.toggle("is-flipped");
    });
  });
})();
