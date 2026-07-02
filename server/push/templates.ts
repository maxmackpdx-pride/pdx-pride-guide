import type { Message } from "@shared/schema";
import { buildDeclarativePayload } from "./send";

export function buildPushPayloadForMessage(message: Message, unreadCount: number) {
  const threadId = message.threadId;
  const navigate = `/inbox?thread=${encodeURIComponent(threadId)}`;
  const ctx = message.contextType || "THREAD";
  const label = message.contextLabel?.trim();

  let title = message.subject?.trim() || "New message";
  if (ctx === "HOST_UPDATE" || ctx === "HOST_MESSAGE") {
    title = label ? `Host update: ${label}` : "Host update";
  } else if (ctx === "MISSED_CONNECTION") {
    title = "Missed connection reply";
  } else if (ctx === "GIG") {
    title = "Pride Werk message";
  } else if (ctx === "GIFTING") {
    title = "Gifting update";
  } else if (ctx === "CHECK_IN") {
    title = "Check-in message";
  } else if (ctx === "EVENT_HOST") {
    title = label ? `Event: ${label}` : "Event message";
  } else if (ctx === "EVENT_TALENT" || ctx === "EVENT_TALENT_REQUEST") {
    title = ctx === "EVENT_TALENT_REQUEST" ? "Lineup request" : "Lineup update";
  } else if (ctx === "SUBMISSION" || ctx === "EVENT_CLAIM" || ctx === "PROMOTER" || ctx === "GUIDE_UPDATE") {
    title = message.subject?.trim() || "PDX Pride Guide update";
    if (ctx === "SUBMISSION" || ctx === "EVENT_CLAIM" || ctx === "PROMOTER") {
      return buildDeclarativePayload({
        title,
        body: message.body,
        navigate: ctx === "PROMOTER" ? "/submit" : "/dashboard",
        badge: unreadCount,
      });
    }
  }

  return buildDeclarativePayload({
    title,
    body: message.body,
    navigate,
    badge: unreadCount,
  });
}