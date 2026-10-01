import { motion, useMotionTemplate, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";

/** Same restrained spring response as the cards, applied to the filter face. */
export function ResourceFilterButton({ quietMotion = false, style, onPointerMove, onPointerLeave, ...props }: HTMLMotionProps<"button"> & { quietMotion?: boolean }) {
 const springX = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const springY = useSpring(0, { stiffness: 150, damping: 24, mass: .5 });
 const shiftX = useTransform(springX, value => value * 4);
 const shiftY = useTransform(springY, value => value * 3);
 const rotateX = useTransform(springY, value => -value * 1.6);
 const rotateY = useTransform(springX, value => value * 2);
 const transform = useMotionTemplate`perspective(900px) translate3d(${shiftX}px, ${shiftY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
 return <motion.button {...props} style={{ ...style, transform: quietMotion ? "none" : transform }}
  onPointerMove={event => {
   if (!quietMotion && event.pointerType === "mouse") {
    const rect = event.currentTarget.getBoundingClientRect();
    springY.set(Math.max(-.5, Math.min(.5, (event.clientY-rect.top)/rect.height-.5)));
    springX.set(Math.max(-.5, Math.min(.5, (event.clientX-rect.left)/rect.width-.5)));
   }
   onPointerMove?.(event);
  }}
  onPointerLeave={event => { springX.set(0); springY.set(0); onPointerLeave?.(event); }}
 />;
}
