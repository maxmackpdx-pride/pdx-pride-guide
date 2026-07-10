import type { ReactNode } from "react";

type Props = {
  kicker: string;
  title: string;
  kickerColor?: string;
  action?: ReactNode;
};

export default function ProfileSectionHeader({ kicker, title, kickerColor, action }: Props) {
  return (
    <div className="pp-section-head">
      <div>
        <div className="display pp-section-kicker" style={kickerColor ? { color: kickerColor } : undefined}>
          {kicker}
        </div>
        <h2 className="display pp-section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}