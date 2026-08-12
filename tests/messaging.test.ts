import { describe, expect, it } from "vitest";
import { isMessageReactionCode } from "../shared/messageReactions";
import { buildPushPayloadForMessage } from "../server/push/templates";
import type { Message } from "../shared/schema";

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 44,
    senderUserId: 1,
    recipientUserId: 2,
    subject: "Hello",
    body: "Private body",
    threadId: "private/thread?one",
    contextType: "THREAD",
    contextId: null,
    contextLabel: null,
    readAt: null,
    reactions: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Message;
}

describe("messaging privacy contracts", () => {
  it("accepts only the fixed reaction vocabulary", () => {
    expect(isMessageReactionCode("heart")).toBe(true);
    expect(isMessageReactionCode("<script>")).toBe(false);
  });

  it("encodes thread identifiers in notification navigation", () => {
    const payload = buildPushPayloadForMessage(message(), 3);
    expect(payload.notification.navigate).toContain("thread=private%2Fthread%3Fone");
    expect(payload.notification.app_badge).toBe("3");
  });

  it("routes admin alerts to the dashboard rather than a private thread", () => {
    const payload = buildPushPayloadForMessage(message({ contextType: "ADMIN_ALERT" }), 1);
    expect(payload.notification.navigate).toBe("https://www.zaylist.com/dashboard");
  });
});
