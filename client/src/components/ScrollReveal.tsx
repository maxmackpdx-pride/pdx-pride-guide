import type { ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, className: revealClass, style } = useScrollReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={`${revealClass}${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </div>
  );
}