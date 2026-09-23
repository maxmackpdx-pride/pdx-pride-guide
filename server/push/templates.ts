import type { Message } from "@shared/schema";
import { messageNotificationIntent } from "./intent";
import { buildDeclarativePayload } from "./send";

export function buildPushPayloadForMessage(message: Message, unreadCount: number) {
  const intent = messageNotificationIntent(message, unreadCount);
  return buildDeclarativePayload({
    title: intent.title,
    body: intent.body,
    navigate: intent.destination,
    badge: intent.badge,
    tag: intent.tag,
  });
}
