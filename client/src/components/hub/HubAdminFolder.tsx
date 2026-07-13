import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { ChevronDown, FolderKey } from "lucide-react";
import type { HubSection } from "./types";
import { hubAdminHref, hubAdminNavItems } from "@/lib/hubAdminNav";
import {
  HubIconAdmin,
  HubIconClaims,
  HubIconEvents,
  HubIconPeople,
  HubIconProfile,
  HubIconWerk,
} from "./hubIcons";

const ADMIN_ICONS: Partial<Record<HubSection, ReactNode>> = {
  admin: <HubIconAdmin size={16} />,
  "tbl-events": <HubIconEvents size={16} />,
  "tbl-users": <HubIconProfile size={16} />,
  "tbl-werk": <HubIconWerk size={16} />,
  "tbl-promoters": <HubIconPeople size={16} />,
  "tbl-claims": <HubIconClaims size={16} />,
  "tbl-team": <HubIconPeople size={16} />,
};

type Props = {
  variant: "rail" | "menu" | "mobile";
  canManageTeam?: boolean;
  currentSection?: HubSection;
  onNavigate?: (section: HubSection) => void;
  onClose?: () => void;
  defaultOpen?: boolean;
};

export default function HubAdminFolder({
  variant,
  canManageTeam = false,
  currentSection,
  onNavigate,
  onClose,
  defaultOpen = false,
}: Props) {
  const items = hubAdminNavItems(canManageTeam);
  const adminActive = currentSection ? items.some((item) => item.section === currentSection) : false;
  const [open, setOpen] = useState(defaultOpen || adminActive);

  const toggle = () => setOpen((v) => !v);

  const handlePick = (section: HubSection) => {
    setOpen(false);
    onNavigate?.(section);
    onClose?.();
  };

  if (variant === "mobile") {
    return (
      <>
        <button
          type="button"
          className="hub-admin-folder__mobile-trigger"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={toggle}
        >
          <FolderKey size={18} strokeWidth={2.2} aria-hidden />
          <span>Admin folder</span>
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            aria-hidden
            style={{
              marginLeft: "auto",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.15s",
            }}
          />
        </button>
        {open && createPortal(
          <>
            <div className="hub-more-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="hub-more-sheet hub-admin-folder__sheet" role="dialog" aria-label="Admin folder">
              <h3>Admin folder</h3>
              {items.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  className={`hub-more-item${currentSection === item.section ? " is-active" : ""}`}
                  onClick={() => handlePick(item.section)}
                >
                  {ADMIN_ICONS[item.section]}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
      </>
    );
  }

  if (variant === "rail") {
    return (
      <div className="hub-admin-folder hub-admin-folder--rail">
        <button
          type="button"
          className={`navi hub-admin-folder__toggle${adminActive ? " on" : ""}`}
          aria-expanded={open}
          onClick={toggle}
        >
          <FolderKey size={18} strokeWidth={2.2} aria-hidden />
          <span style={{ flex: 1 }}>Admin</span>
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            aria-hidden
            style={{
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.15s",
              opacity: 0.7,
            }}
          />
        </button>
        {open && (
          <div className="hub-admin-folder__children" role="group" aria-label="Admin sections">
            {items.map((item) => (
              <button
                key={item.section}
                type="button"
                className={`navi hub-admin-folder__child${currentSection === item.section ? " on" : ""}`}
                onClick={() => handlePick(item.section)}
              >
                {ADMIN_ICONS[item.section]}
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hub-admin-folder hub-admin-folder--menu">
      <button
        type="button"
        className="site-profile-menu__item hub-admin-folder__toggle"
        aria-expanded={open}
        onClick={toggle}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <FolderKey size={15} strokeWidth={2.2} aria-hidden />
          Admin folder
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          aria-hidden
          style={{
            float: "right",
            marginTop: 2,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        />
      </button>
      {open && (
        <div className="hub-admin-folder__children" role="group" aria-label="Admin sections">
          {items.map((item) => (
            <Link
              key={item.section}
              href={hubAdminHref(item.section)}
              role="menuitem"
              className={`site-profile-menu__item hub-admin-folder__child${currentSection === item.section ? " active" : ""}`}
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}