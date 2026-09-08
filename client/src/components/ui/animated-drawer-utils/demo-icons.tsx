import {
  Ban,
  KeyRound,
  LockKeyhole,
  ScanFace,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

function DemoIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />;
}

export const BannedIcon = () => <DemoIcon icon={Ban} />;
export const DangerIcon = () => <DemoIcon icon={ShieldAlert} />;
export const FaceIDIcon = () => <DemoIcon icon={ScanFace} />;
export const LockIcon = () => <DemoIcon icon={LockKeyhole} />;
export const PassIcon = () => <DemoIcon icon={KeyRound} />;
export const PhraseIcon = () => <DemoIcon icon={ScrollText} />;
export const RecoveryPhraseIcon = () => <DemoIcon icon={KeyRound} />;
export const ShieldIcon = () => <DemoIcon icon={ShieldCheck} />;
export const WarningIcon = () => <DemoIcon icon={TriangleAlert} />;
