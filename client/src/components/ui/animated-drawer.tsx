"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BannedIcon,
  DangerIcon,
  FaceIDIcon,
  LockIcon,
  PassIcon,
  PhraseIcon,
  RecoveryPhraseIcon,
  ShieldIcon,
  WarningIcon,
} from "@/components/ui/animated-drawer-utils/demo-icons";

type DrawerView = "default" | "remove" | "phrase" | "key";

function useMeasuredHeight() {
  const [node, ref] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    if (!node) return;
    const measure = () => setHeight(node.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref, height };
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label="Close drawer"
      className="size-11 shrink-0 rounded-full border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
      onClick={onClose}
    >
      <X aria-hidden="true" size={18} />
    </Button>
  );
}

function Guidance() {
  return (
    <div className="space-y-5 border-t border-white/10 pt-5 text-base text-neutral-400">
      <div className="flex items-center gap-4"><ShieldIcon /><span>Store it in a secure location</span></div>
      <div className="flex items-center gap-4"><PhraseIcon /><span>Never share with anyone</span></div>
      <div className="flex items-center gap-4"><BannedIcon /><span>We cannot recover it for you</span></div>
    </div>
  );
}

function Actions({ onCancel, primary, tone = "cyan" }: { onCancel: () => void; primary: ReactNode; tone?: "cyan" | "red" }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-1">
      <Button type="button" variant="secondary" className="min-h-11 rounded-full px-6" onClick={onCancel}>Cancel</Button>
      <Button
        type="button"
        className={`min-h-11 rounded-full px-6 text-black ${tone === "red" ? "bg-red-500 hover:bg-red-400" : "bg-cyan-300 hover:bg-cyan-200"}`}
        onClick={onCancel}
      >
        {primary}
      </Button>
    </div>
  );
}

export function AnimatedDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<DrawerView>("default");
  const { ref, height } = useMeasuredHeight();
  const closingRef = useRef(false);
  const close = () => {
    closingRef.current = true;
    setIsOpen(false);
    window.setTimeout(() => { closingRef.current = false; }, 250);
  };
  useEffect(() => {
    if (!isOpen) setView("default");
  }, [isOpen]);

  const content = useMemo(() => {
    if (view === "default") {
      return (
        <div>
          <div className="flex w-full items-center justify-between gap-4">
            <Drawer.Title className="text-lg font-semibold text-white">Wallet settings</Drawer.Title>
            <CloseButton onClose={close} />
          </div>
          <Drawer.Description className="mt-2 text-sm text-neutral-400">Manage this wallet and its recovery credentials.</Drawer.Description>
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={() => setView("key")} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left font-medium text-white transition-colors hover:border-cyan-300/50 hover:bg-white/10"><LockIcon />View private key</button>
            <button type="button" onClick={() => setView("phrase")} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left font-medium text-white transition-colors hover:border-cyan-300/50 hover:bg-white/10"><PassIcon />View recovery phrase</button>
            <button type="button" onClick={() => setView("remove")} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-left font-medium text-red-300 transition-colors hover:border-red-400 hover:bg-red-950/50"><WarningIcon />Remove wallet</button>
          </div>
        </div>
      );
    }

    if (view === "remove") {
      return (
        <div className="space-y-4">
          <div className="flex justify-between text-red-400"><DangerIcon /><CloseButton onClose={close} /></div>
          <Drawer.Title className="text-xl font-semibold text-white">Remove wallet?</Drawer.Title>
          <Drawer.Description className="text-base leading-7 text-neutral-400">This cannot be undone. Back up your recovery phrase first or you may lose access to your funds.</Drawer.Description>
          <Actions onCancel={() => setView("default")} tone="red" primary="Remove" />
        </div>
      );
    }

    const phrase = view === "phrase";
    return (
      <div className="space-y-4">
        <div className="flex justify-between text-cyan-300"><RecoveryPhraseIcon /><CloseButton onClose={close} /></div>
        <Drawer.Title className="text-xl font-semibold text-white">{phrase ? "Recovery phrase" : "Private key"}</Drawer.Title>
        <Drawer.Description className="text-base leading-7 text-neutral-400">
          {phrase ? "Your recovery phrase is the master key to your wallet." : "Your private key proves ownership of your wallet."} Keep it private and store it securely.
        </Drawer.Description>
        <Guidance />
        <Actions onCancel={() => setView("default")} primary={<><FaceIDIcon />Show {phrase ? "phrase" : "key"}</>} />
      </div>
    );
  }, [view]);

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (closingRef.current && nextOpen) return;
        setIsOpen(nextOpen);
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Trigger asChild>
        <Button type="button" className="min-h-11 rounded-full border border-cyan-300/60 bg-black px-6 text-cyan-200 hover:bg-cyan-300 hover:text-black">Open animated drawer</Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Drawer.Content asChild>
          <div
            aria-describedby={undefined}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto rounded-[2rem] border border-cyan-300/25 bg-neutral-950/90 text-white shadow-[0_0_50px_rgba(0,255,255,.12)] outline-none backdrop-blur-2xl transition-[height] [transition-duration:420ms] ease-out motion-reduce:transition-none"
            style={{ height }}
          >
            <div ref={ref} className="p-6">
              <div key={view} className="animate-in fade-in-0 slide-in-from-bottom-2.5 [animation-duration:160ms] motion-reduce:animate-none">
                {content}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default AnimatedDrawer;
