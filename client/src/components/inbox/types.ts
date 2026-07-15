import type { InboxPartyAvatar } from "@/lib/inboxAvatar";
import type { MessageReactionCode } from "@shared/messageReactions";

export type Category = "spotted" | "gigs" | "gifting" | "hosts" | "checkins";
export type Folder = "inbox" | "sent" | "deleted";
/** Admin account sub-views: moderation queue + shared guide-admin mailboxes. */
export type QueueFolder = "active" | "completed" | "inbox" | "sent";
export type LineupDecision = "APPROVED" | "DENIED";

/** Aggregated emoji reaction chip on a DM bubble. */
export interface ThreadMessageReaction {
  code: MessageReactionCode | string;
  count: number;
  mine: boolean;
}

export interface ThreadMessage {
  id: string;
  body: string;
  at: string;
  self: boolean;
  party?: InboxPartyAvatar;
  reactions?: ThreadMessageReaction[];
}

export interface ThreadReveal {
  iRevealed: boolean;
  theyRevealed: boolean;
}

export interface ThreadLineup {
  status: "PENDING" | "APPROVED" | "DENIED";
  role: string;
  eventTitle: string;
}

export interface Thread {
  id: string;
  folder: Folder;
  archived: boolean;
  unread: boolean;
  cat: Category;
  name: string;
  handle: string;
  subject: string;
  contextLabel: string;
  contextType?: string | null;
  contextId?: number | null;
  at: string;
  ring: string;
  anonymous: boolean;
  party: InboxPartyAvatar;
  reveal?: ThreadReveal;
  lineup?: ThreadLineup;
  lineupRequestId?: number | null;
  messages: ThreadMessage[];
  latestMessageId?: number;
}

export type ApiMessageRow = {
  id: number;
  fromUserId: number;
  toUserId: number;
  subject: string;
  body: string;
  isRead?: boolean;
  is_read?: boolean;
  threadId?: string;
  thread_id?: string;
  contextType?: string;
  context_type?: string;
  contextId?: number | null;
  context_id?: number | null;
  contextLabel?: string | null;
  context_label?: string | null;
  createdAt?: string;
  created_at?: string;
  from_username?: string;
  from_display_name?: string;
  from_photo_url?: string | null;
  from_avatar_choice?: number | null;
  from_avatar_ring?: string | null;
  to_username?: string;
  to_display_name?: string;
  to_photo_url?: string | null;
  to_avatar_choice?: number | null;
  to_avatar_ring?: string | null;
  masked?: boolean;
  reactions?: ThreadMessageReaction[];
};