/** Reset vertical + horizontal scroll — fixes reload landing offset right. */
export function resetPageScroll() {
  window.scrollTo({ left: 0, top: 0, behavior: "instant" });
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
}