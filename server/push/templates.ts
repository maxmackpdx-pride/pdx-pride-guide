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
    title = "Gigz message";
  } else if (ctx === "GIFTING") {
    title = "GiftZ update";
  } else if (ctx === "CHECK_IN") {
    title = "Check-in message";
  } else if (ctx === "EVENT_HOST") {
    title = label ? `Event: ${label}` : "Event message";
  } else if (ctx === "EVENT_TALENT" || ctx === "EVENT_TALENT_REQUEST") {
    title = ctx === "EVENT_TALENT_REQUEST" ? "Lineup request" : "Lineup update";
  } else if (ctx === "RIVER_BRATS_CHECKIN") {
    title = "River Brats check-in";
  } else if (ctx === "BEACH_CARPOOL") {
    title = "Carpool message";
  } else if (ctx === "ADMIN_ALERT") {
    title = message.subject?.trim() || "Admin alert";
    return buildDeclarativePayload({
      title,
      body: message.body || undefined,
      navigate: "/dashboard",
      badge: unreadCount,
      tag: `msg-${message.id || "new"}`,
    });
  } else if (ctx === "SUBMISSION" || ctx === "EVENT_CLAIM" || ctx === "PROMOTER" || ctx === "GUIDE_UPDATE") {
    title = message.subject?.trim() || "Zaylist update";
    const navigate = ctx === "PROMOTER" ? "/submit" : "/dashboard";
    return buildDeclarativePayload({
      title,
      body: message.body || undefined,
      navigate,
      badge: unreadCount,
      tag: `msg-${message.id || "new"}`,
    });
  }

  return buildDeclarativePayload({
    title,
    body: message.body || undefined,
    navigate,
    badge: unreadCount,
    tag: `msg-${message.id || "new"}`,
  });
}