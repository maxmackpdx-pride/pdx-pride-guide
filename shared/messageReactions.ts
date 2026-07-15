/**
 * DM message reactions (long-press on a bubble).
 * Social posts keep their own ♥ / 💬 engagement — not this set.
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
  /** Display token (emoji or short label). */
  label: string;
  /** Accessible name for buttons. */
  aria: string;
};

export const MESSAGE_REACTIONS: MessageReactionDef[] = [
  { code: "thumbsup", label: "👍", aria: "Thumbs up" },
  { code: "thumbsdown", label: "👎", aria: "Thumbs down" },
  { code: "laugh", label: "😂", aria: "Laugh" },
  { code: "cry", label: "😢", aria: "Cry" },
  { code: "heart", label: "❤️", aria: "Heart" },
  { code: "heartbreak", label: "💔", aria: "Heartbreak" },
  { code: "gay", label: "GAY!", aria: "GAY!" },
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
