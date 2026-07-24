import type { Category } from "./types";

const QUICK: Record<Category, string[]> = {
  spotted: ["Yes, that was me", "Let us meet up", "Not sure that is me"],
  gigs: ["The slot is open", "Send the mix", "Let me check the lineup"],
  gifting: ["Still available?", "When works for pickup?", "Thanks - on my way"],
  hosts: ["Got it, thanks", "See you there", "Can I bring a plus-one?"],
  checkins: ["Home safe, thanks", "All good", "Still out, come find me"],
};

export function quickRepliesFor(cat: Category): string[] {
  return QUICK[cat] ?? ["Thanks", "Sounds good", "On my way"];
}