import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/** Keyboard-activatable clickable card. Same contract as ListingCard. */
export function cardActivateProps(onActivate: () => void, ariaLabel?: string) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": ariaLabel,
    onClick: onActivate,
    onKeyDown: (e: ReactKeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    },
  };
}

/**
 * Arrow / Home / End for a role="tablist". Automatic activation + roving tabindex.
 * Call from the tablist's onKeyDown; tabs must be [role="tab"] descendants.
 */
export function handleTabListKeyDown(
  e: ReactKeyboardEvent<HTMLElement>,
  tabCount: number,
  selectedIndex: number,
  onSelect: (index: number) => void,
) {
  if (tabCount <= 0) return;
  let next = selectedIndex;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (selectedIndex + 1) % tabCount;
  else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (selectedIndex - 1 + tabCount) % tabCount;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = tabCount - 1;
  else return;
  e.preventDefault();
  onSelect(next);
  const tabs = e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]');
  tabs[next]?.focus();
}
