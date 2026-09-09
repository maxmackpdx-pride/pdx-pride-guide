"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type StateIconProps = { size?: number; className?: string };
const ease = [0.32, 0.72, 0, 1] as const;

export function MenuCloseIcon({ open, size = 28, className }: StateIconProps & { open: boolean }) {
  const still = useReducedMotion();
  const transition = { duration: still ? 0 : 0.28, ease };
  return <svg viewBox="0 0 40 40" fill="none" className={cn("animated-state-icon", className)} style={{ width: size, height: size }} aria-hidden="true">
    <motion.line x1="10" y1="12" x2="30" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={false} animate={open ? { y1: 20, y2: 20, rotate: 45 } : { y1: 12, y2: 12, rotate: 0 }} transition={transition} style={{ transformOrigin: "20px 20px" }} />
    <motion.line x1="10" y1="20" x2="30" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} transition={{ duration: still ? 0 : 0.16 }} style={{ transformOrigin: "20px 20px" }} />
    <motion.line x1="10" y1="28" x2="30" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" initial={false} animate={open ? { y1: 20, y2: 20, rotate: -45 } : { y1: 28, y2: 28, rotate: 0 }} transition={transition} style={{ transformOrigin: "20px 20px" }} />
  </svg>;
}

export function EyeToggleIcon({ visible, size = 16, className }: StateIconProps & { visible: boolean }) {
  const still = useReducedMotion();
  return <svg viewBox="0 0 40 40" fill="none" className={cn("animated-state-icon", className)} style={{ width: size, height: size }} aria-hidden="true">
    <motion.path d="M4 20s6-10 16-10 16 10 16 10-6 10-16 10S4 20 4 20z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" animate={{ opacity: visible ? 1 : 0.34 }} transition={{ duration: still ? 0 : 0.2 }} />
    <motion.circle cx="20" cy="20" r="5" stroke="currentColor" strokeWidth="2.2" animate={visible ? { scale: 1, opacity: 1 } : { scale: 0.65, opacity: 0.25 }} transition={{ duration: still ? 0 : 0.24 }} style={{ transformOrigin: "20px 20px" }} />
    <motion.line x1="6" y1="34" x2="34" y2="6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" animate={{ pathLength: visible ? 0 : 1, opacity: visible ? 0 : 1 }} transition={{ duration: still ? 0 : 0.24 }} />
  </svg>;
}

export function CopyStateIcon({ copied, size = 18, className }: StateIconProps & { copied: boolean }) {
  const still = useReducedMotion();
  return <svg viewBox="0 0 40 40" fill="none" className={cn("animated-state-icon", className)} style={{ width: size, height: size }} aria-hidden="true">
    <rect x="12" y="8" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="2.2" />
    <path d="M9 13H8a2 2 0 00-2 2v19h19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity=".36" />
    <AnimatePresence mode="wait" initial={false}>
      {copied ? <motion.path key="check" d="M16 20l4 4 7-9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={still ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: still ? 0 : 0.28 }} /> : <motion.path key="lines" d="M17 17h10M17 22h8M17 27h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".58" initial={still ? false : { opacity: 0 }} animate={{ opacity: .58 }} />}
    </AnimatePresence>
  </svg>;
}

export function NotificationStateIcon({ active, size = 20, className }: StateIconProps & { active: boolean }) {
  const still = useReducedMotion();
  return <motion.svg key={active ? "active" : "quiet"} viewBox="0 0 40 40" fill="none" className={cn("animated-state-icon", className)} style={{ width: size, height: size, transformOrigin: "20px 7px" }} initial={false} animate={active && !still ? { rotate: [0, 8, -8, 5, -5, 0] } : { rotate: 0 }} transition={{ duration: 0.52 }} aria-hidden="true">
    <path d="M28 16a8 8 0 00-16 0c0 8-4 10-4 10h24s-4-2-4-10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.5 30a3 3 0 005 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    {active ? <motion.circle cx="29" cy="10" r="4" fill="currentColor" initial={still ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ duration: still ? 0 : 0.25, ease }} style={{ transformOrigin: "29px 10px" }} /> : null}
  </motion.svg>;
}

export function DownloadStateIcon({ busy, size = 18, className }: StateIconProps & { busy: boolean }) {
  const still = useReducedMotion();
  return <svg viewBox="0 0 40 40" fill="none" className={cn("animated-state-icon", className)} style={{ width: size, height: size }} aria-hidden="true">
    <path d="M8 28v4a2 2 0 002 2h20a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <motion.path d="M20 6v18M14 18l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" animate={busy && !still ? { y: [0, 6, 0], opacity: [1, .35, 1] } : { y: 0, opacity: 1 }} transition={{ duration: .8, repeat: busy && !still ? Infinity : 0, ease: "easeInOut" }} />
  </svg>;
}
