import { ChevronDown, Megaphone, type LucideIcon } from "lucide-react";
import { ButtonGlassOptics } from "@/components/ui/button-glass-optics";
import "./hub-trigger.css";

/** Matching icon-only disclosures for Hub and Inbox. */
export default function HubTriggerContent({ icon: Icon = Megaphone, hasNewActivity = false, count = 0 }: { icon?: LucideIcon; hasNewActivity?: boolean; count?: number }) {
  return <>
    <ButtonGlassOptics />
    <Icon className="hub-disclosure__glyph" size={22} strokeWidth={1.8} aria-hidden />
    {count > 0 ? <span className="hub-disclosure__count" aria-hidden>{count > 9 ? "9+" : count}</span> : hasNewActivity && <span className="hub-disclosure__dot" aria-hidden />}
    <span className="hub-disclosure__caret"><ChevronDown className="hub-disclosure__chevron" size={15} aria-hidden /></span>
  </>;
}
