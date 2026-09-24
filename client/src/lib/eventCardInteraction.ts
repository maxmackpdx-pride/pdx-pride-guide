import type React from "react";

export type ListingCardOriginRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function cardOriginRect(element: HTMLElement): ListingCardOriginRect {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

export function eventCardA11yProps(onOpen: (rect: ListingCardOriginRect) => void, title: string) {
  return {
    role: "button" as const,
    "aria-label": `Open ${title}`,
    tabIndex: 0,
    onClick: (event: React.MouseEvent<HTMLDivElement>) => onOpen(cardOriginRect(event.currentTarget)),
    onKeyDown: (event: React.KeyboardEvent) => {
      // Nested buttons, links, and forms own their activation.
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen(cardOriginRect(event.currentTarget as HTMLElement));
      }
    },
  };
}
