/* Tilted, auto-scrolling photo band (case study pages).
   Markup:  <div class="band" data-dir="../assets/images/projects/foo/gallery/" data-count="12"></div>
   Put images named 01.jpg, 02.jpg ... in that folder. Missing files show a placeholder.
   Rows loop forever and alternate direction. They keep moving on hover (they only stop for reduced-motion users). */
(() => {
  const WIDTHS = [240, 300, 220, 320, 260, 230, 300, 280];
  const ROWS = 4;
  const PER_ROW = 9;

  document.querySelectorAll(".band").forEach((band) => {
    const dir = band.dataset.dir || "";
    const count = parseInt(band.dataset.count || "12", 10);
    const stage = document.createElement("div");
    stage.className = "band-stage";
    stage.setAttribute("aria-hidden", "true");

    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement("div");
      row.className = "band-row";
      row.style.setProperty("--dur", 60 + r * 9 + "s");
      row.style.marginLeft = [0, -130, -60, -190][r] + "px";

      const makeSet = () => {
        const frag = document.createDocumentFragment();
        for (let i = 0; i < PER_ROW; i++) {
          const n = ((r * 3 + i) % count) + 1;
          const tile = document.createElement("div");
          tile.className = "band-tile ph";
          tile.dataset.label = "Image";
          tile.style.setProperty("--w", WIDTHS[(i + r * 2) % WIDTHS.length] + "px");
          const img = document.createElement("img");
          img.src = `${dir}${String(n).padStart(2, "0")}.jpg`;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.addEventListener("error", () => img.remove());
          tile.appendChild(img);
          frag.appendChild(tile);
        }
        return frag;
      };
      row.appendChild(makeSet());
      row.appendChild(makeSet()); // second copy makes the -50% loop seamless
      stage.appendChild(row);
    }
    band.appendChild(stage);
  });
})();
