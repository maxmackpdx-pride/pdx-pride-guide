// A placement picker covers the retained map without replacing its route or camera.
const pickers = new Set<symbol>();
const listeners = new Set<() => void>();
export const isBoardMapPickerOpen = () => pickers.size > 0;
export const subscribeBoardMapPicker = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export function acquireBoardMapPicker() {
  const picker = Symbol("board-map-picker");
  pickers.add(picker);
  listeners.forEach(listener => listener());
  return () => {
    if (!pickers.delete(picker)) return;
    listeners.forEach(listener => listener());
  };
}
