import { Bug, Cat, Flame, Moon, Worm, Zap } from "lucide-react";

/** The six classic avatar choices use the same SVG icon family as site controls. */
const CHOICES = [Cat, Bug, Worm, Moon, Flame, Zap] as const;

export default function AvatarChoiceIcon({ id }: { id: number }) {
  const Icon = CHOICES[id - 1] || Cat;
  return <Icon size="60%" strokeWidth={2} aria-hidden="true" />;
}
