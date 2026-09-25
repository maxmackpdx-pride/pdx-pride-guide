/**
 * DM message reactions (long-press on a bubble).
 * Social posts keep their own ♥ / 💬 engagement - not this set.
 */

export const MESSAGE_REACTION_CODES = [
  "thumbsup",
  "thumbsdown",
  "laugh",
  "cry",
  "heart",
  "heartbreak",
  "gay",
] as const;

export type MessageReactionCode = (typeof MESSAGE_REACTION_CODES)[number];

export type MessageReactionDef = {
  code: MessageReactionCode;
  /** Text fallback; interface controls render a Lucide icon for each code. */
  label: string;
  /** Accessible name for buttons. */
  aria: string;
};

export const MESSAGE_REACTIONS: MessageReactionDef[] = [
  { code: "thumbsup", label: "Thumbs up", aria: "Thumbs up" },
  { code: "thumbsdown", label: "Thumbs down", aria: "Thumbs down" },
  { code: "laugh", label: "Laugh", aria: "Laugh" },
  { code: "cry", label: "Cry", aria: "Cry" },
  { code: "heart", label: "Heart", aria: "Heart" },
  { code: "heartbreak", label: "Heartbreak", aria: "Heartbreak" },
  { code: "gay", label: "Pride", aria: "Pride" },
];

export const MESSAGE_REACTION_BY_CODE: Record<MessageReactionCode, MessageReactionDef> =
  Object.fromEntries(MESSAGE_REACTIONS.map((r) => [r.code, r])) as Record<
    MessageReactionCode,
    MessageReactionDef
  >;

export function isMessageReactionCode(value: unknown): value is MessageReactionCode {
  return typeof value === "string" && (MESSAGE_REACTION_CODES as readonly string[]).includes(value);
}

/** Aggregated chip for one emoji on a message. */
export type MessageReactionSummary = {
  code: MessageReactionCode;
  count: number;
  /** True when the current viewer has this reaction. */
  mine: boolean;
};
