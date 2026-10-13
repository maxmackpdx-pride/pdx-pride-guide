import { ChevronDown, ChevronUp, PanelTop } from "lucide-react";
import { ButtonGlassOptics } from "@/components/ui/button-glass-optics";
import "./hub-trigger.css";

/** One disclosure treatment shared by the header and the mobile dock. */
export default function HubTriggerContent({ dock = false, hasNewActivity = false }: { dock?: boolean; hasNewActivity?: boolean }) {
  if (dock) return <>
    <span className="znav-icon-row hub-disclosure__dock-icon"><PanelTop size={22} strokeWidth={1.8} aria-hidden /><ChevronUp className="hub-disclosure__chevron" size={12} aria-hidden /></span>
    <span className="znav-caption">Hub</span>
    {hasNewActivity && <span className="hub-disclosure__dot" aria-hidden />}
  </>;
  return <>
    <ButtonGlassOptics />
    <PanelTop className="hub-disclosure__glyph" size={19} strokeWidth={1.8} aria-hidden />
    <span className="znav-caption">Hub</span>
    {hasNewActivity && <span className="hub-disclosure__dot" aria-hidden />}
    <span className="hub-disclosure__caret"><ChevronDown className="hub-disclosure__chevron" size={15} aria-hidden /></span>
  </>;
}
