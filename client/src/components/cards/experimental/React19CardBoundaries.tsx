import { useDeferredValue, useMemo, type ReactNode } from "react";

/**
 * Experimental, opt-in React 19 rendering boundaries.
 * No existing component imports this file. This does not alter the card design,
 * expansion mechanics, API contracts, or map lifecycle.
 */
export type CardRecord = { id: string; title: string; category: string };

export type CardRenderMetrics = {
  sourceCount: number;
  visibleCount: number;
  deferred: boolean;
};

export function useDeferredCardCollection<T extends CardRecord>(
  records: readonly T[],
  query: string,
  matches: (record: T, normalizedQuery: string) => boolean,
): { records: readonly T[]; metrics: CardRenderMetrics } {
  "use memo";\n  const normalizedQuery = query.trim().toLocaleLowerCase();
  const deferredQuery = useDeferredValue(normalizedQuery);
  const filtered = useMemo(
    () => deferredQuery ? records.filter(record => matches(record, deferredQuery)) : records,
    [records, deferredQuery, matches],
  );
  return {
    records: filtered,
    metrics: {
      sourceCount: records.length,
      visibleCount: filtered.length,
      deferred: normalizedQuery !== deferredQuery,
    },
  };
}

export type CardSurfaceProps<T extends CardRecord> = {
  record: T;
  render: (record: T) => ReactNode;
};

/** React can skip a stable item when its record and renderer are unchanged. */
function CardSurfaceInner<T extends CardRecord>({ record, render }: CardSurfaceProps<T>) {
  "use memo";\n  return <>{render(record)}</>;
}
export const ExperimentalCardSurface = CardSurfaceInner;

export type CardCollectionProps<T extends CardRecord> = {
  records: readonly T[];
  render: (record: T) => ReactNode;
  empty?: ReactNode;
};

/** Caller owns virtualization, accessibility, and layout. No new visual styling. */
export function ExperimentalCardCollection<T extends CardRecord>({
  records, render, empty = null,
}: CardCollectionProps<T>) {
  "use memo";\n  if (records.length === 0) return <>{empty}</>;
  return <>{records.map(record =>
    <ExperimentalCardSurface key={record.id} record={record} render={render} />
  )}</>;
}
