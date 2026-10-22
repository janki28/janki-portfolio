/* Images: (1) a missing image quietly removes itself, or swaps to its fallback, so the placeholder shows;
   (2) light deterrents against saving photos: no right-click "save / open in new tab", no dragging out.
   These stop casual saving only. Anything a browser shows can still be captured (screenshots, dev tools). */
(() => {
  function fail(img) {
    const fb = img.dataset.fallback;
    if (fb && !img.dataset.tried) { img.dataset.tried = "1"; img.src = fb; }
    else img.remove();
  }

  // error events do not bubble, so listen while they travel down
  document.addEventListener("error", (e) => { if (e.target && e.target.tagName === "IMG") fail(e.target); }, true);

  // images that already failed before this script ran: probe them again (served from cache)
  document.querySelectorAll("img").forEach((img) => {
    img.draggable = false;
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      const probe = new Image();
      probe.onerror = () => fail(img);
      probe.src = img.currentSrc || img.src;
    }
  });

  const imageUnder = (x, y) => document.elementsFromPoint(x, y).some((el) => el.tagName === "IMG");
  document.addEventListener("contextmenu", (e) => {
    if ((e.target && e.target.tagName === "IMG") || imageUnder(e.clientX, e.clientY)) e.preventDefault();
  });
  document.addEventListener("dragstart", (e) => { if (e.target && e.target.tagName === "IMG") e.preventDefault(); });
})();
