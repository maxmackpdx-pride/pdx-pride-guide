// Keep selected titles first; unselected events remain available as map pins.
export function visibleHologramLabels(labels, selectedKey, width, height) {
  const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const titleBox = label => ({left: label.x - label.width * label.scale / 2 - 6, right: label.x + label.width * label.scale / 2 + 6,
    top: label.y - 4, bottom: label.y + (label.width * .52 + 16) * label.scale + 4});
  const logos = labels.map(label => ({key: label.key, left: label.x - label.logoWidth / 2 - 4, right: label.x + label.logoWidth / 2 + 4,
    top: label.logoY - label.logoHeight / 2 - 4, bottom: label.logoY + label.logoHeight / 2 + 4}));
  const placed = [], visible = [];
  const ordered = [...labels].sort((a,b) => Number(b.key === selectedKey) - Number(a.key === selectedKey)
    || Math.hypot(a.x-width/2,a.y-height/2) - Math.hypot(b.x-width/2,b.y-height/2) || String(a.key).localeCompare(String(b.key)));
  for (const label of ordered) {
    if (label.opacity <= .1) continue;
    const box = titleBox(label), selected = label.key === selectedKey;
    if (!selected && (visible.length >= (width < 768 ? 5 : 10) || box.left < 0 || box.right > width || box.top < 0 || box.bottom > height
      || placed.some(other => overlap(box, other)) || logos.some(logo => logo.key !== label.key && overlap(box, logo)))) continue;
    visible.push(label); placed.push(box);
  }
  return visible;
}
