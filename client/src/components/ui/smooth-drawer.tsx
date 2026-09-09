"use client";

/**
 * Smooth Drawer animation adapted from KokonutUI by @dorianbaffier.
 * Original version 1.0.0, 2025-06-26, MIT — https://github.com/kokonut-labs/kokonutui
 * Uses the app's existing Framer Motion runtime and persistent map drawer.
 */
import {
  createContext, forwardRef, useContext, useEffect, useLayoutEffect, useRef, useState,
} from "react";
import {motion, useReducedMotion, useSpring, type HTMLMotionProps, type Variants} from "framer-motion";

const spring = {type: "spring", stiffness: 300, damping: 30, mass: 0.8} as const;
const drawerVariants: Variants = {
  hidden: {y: "100%", opacity: 0, rotateX: 5},
  visible: {y: 0, opacity: 1, rotateX: 0, transition: {...spring, staggerChildren: 0.07, delayChildren: 0.2}},
};
const itemVariants: Variants = {
  hidden: {y: 20, opacity: 0},
  visible: {y: 0, opacity: 1, transition: spring},
};
const groupVariants: Variants = {
  hidden: {},
  visible: {transition: {staggerChildren: 0.07, delayChildren: 0.2}},
};
const stillVariants: Variants = {
  hidden: {opacity: 1, y: 0, rotateX: 0, transition: {duration: 0}},
  visible: {opacity: 1, y: 0, rotateX: 0, transition: {duration: 0}},
};
const MotionPreference = createContext(false);

function useDrawerMotionPreference() {
  const reduced = useReducedMotion();
  const [calm, setCalm] = useState(() => typeof document !== "undefined" && document.documentElement.matches('.calm-mode, [data-calm="true"]'));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setCalm(root.matches('.calm-mode, [data-calm="true"]')));
    observer.observe(root, {attributes: true, attributeFilter: ["class", "data-calm"]});
    return () => observer.disconnect();
  }, []);
  return Boolean(reduced || calm);
}

type SmoothDrawerProps = HTMLMotionProps<"section"> & {
  /** Pixel height of the current snap point; CSS supplies the initial size before measurement. */
  height?: number;
  /** Pointer tracking is immediate. Spring motion resumes when the user releases the handle. */
  dragging?: boolean;
};

const SmoothDrawer = forwardRef<HTMLElement, SmoothDrawerProps>(function SmoothDrawer(
  {height, dragging = false, style, children, ...props}, ref,
) {
  const still = useDrawerMotionPreference();
  const animatedHeight = useSpring(height ?? 0, spring);
  const measured = useRef(false);
  useLayoutEffect(() => {
    if (height === undefined) return;
    if (dragging || still || !measured.current) animatedHeight.jump(height);
    else animatedHeight.set(height);
    measured.current = true;
  }, [height, dragging, still, animatedHeight]);

  return <MotionPreference.Provider value={still}>
    <motion.section
      {...props}
      ref={ref}
      initial={still ? false : "hidden"}
      animate="visible"
      variants={still ? stillVariants : drawerVariants}
      style={{...style, height: height === undefined ? undefined : animatedHeight, transformOrigin: "50% 100%", transformPerspective: still ? undefined : 1200}}
    >{children}</motion.section>
  </MotionPreference.Provider>;
});

/** Stagger real content groups, without re-running the animation on search edits or feed refreshes. */
export function SmoothDrawerGroup({open = true, ...props}: HTMLMotionProps<"div"> & {open?: boolean}) {
  const still = useContext(MotionPreference);
  return <motion.div {...props} initial={still ? false : "hidden"} animate={open ? "visible" : "hidden"} variants={still ? {} : groupVariants}/>;
}

export function SmoothDrawerItem(props: HTMLMotionProps<"div">) {
  const still = useContext(MotionPreference);
  return <motion.div {...props} variants={still ? stillVariants : itemVariants}/>;
}

export default SmoothDrawer;
