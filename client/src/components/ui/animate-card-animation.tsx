"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props<T> = {
  items: T[];
  active: number;
  renderCard: (item: T) => ReactNode;
  getKey: (item: T) => string | number;
  onAdvance?: () => void;
};

/** Three visible sleeves; advancing drops the front record and reveals the next. */
export default function AnimatedCardStack<T>({ items, active, renderCard, getKey, onAdvance }: Props<T>) {
  const reducedMotion = useReducedMotion();
  const visible = Array.from({ length: Math.min(3, items.length) }, (_, offset) => ({
    item: items[(active + offset) % items.length],
    offset,
  }));

  return (
    <div className="record-stack" aria-live="off">
      <AnimatePresence initial={false}>
        {visible.map(({ item, offset }) => (
          <motion.div
            key={getKey(item)}
            className="record-stack__sleeve"
            initial={reducedMotion ? false : { y: -34, scale: 0.9, opacity: 0 }}
            animate={{ y: offset * -25, scale: 1 - offset * 0.045, opacity: 1 }}
            exit={reducedMotion ? undefined : { y: 300, scale: 1.02, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
            style={{ zIndex: 3 - offset, pointerEvents: offset === 0 ? "auto" : "none" }}
            drag={offset === 0 && items.length > 1 && !reducedMotion ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => { if (Math.abs(info.offset.y) > 65) onAdvance?.(); }}
            aria-hidden={offset !== 0}
          >
            {renderCard(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
