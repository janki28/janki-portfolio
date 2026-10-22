/* Work page: filter chips show/hide cards. Cards stay the same size. */
(() => {
  const chips = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-cat]")];
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      cards.forEach((card) => {
        card.hidden = !(f === "all" || card.dataset.cat.split(" ").includes(f));
      });
    });
  });
})();
