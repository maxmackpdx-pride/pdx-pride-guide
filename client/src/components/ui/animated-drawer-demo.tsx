"use client";

import { AnimatedDrawer } from "@/components/ui/animated-drawer";

export default function AnimatedDrawerDemo() {
  return (
    <div className="relative flex min-h-40 w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6">
      <AnimatedDrawer />
    </div>
  );
}
