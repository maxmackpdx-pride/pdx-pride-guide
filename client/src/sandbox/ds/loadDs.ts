import type { ComponentType, ReactNode } from "react";
import { createElement } from "react";

/** Placeholder when a sandbox component fails to load or render. */
export function DsPlaceholder({ name }: { name: string }) {
  return createElement(
    "div",
    { className: "ds-sandbox__placeholder", role: "status" },
    `${name} — not available in sandbox yet`,
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DsRegistry = Record<string, ComponentType<any> | undefined>;

/**
 * Try to import a sandbox component module; returns undefined on failure
 * so the preview page still renders.
 */
export async function tryLoadComponent<T>(
  loader: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await loader();
  } catch {
    return undefined;
  }
}