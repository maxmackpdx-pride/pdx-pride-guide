import { describe, expect, it } from "vitest";
import { parseNotificationPrefs, pushCategoryForContext } from "../shared/pushCategories";
import { buildDeclarativePayload } from "../server/push/send";

describe("push notifications", () => {
  it("does not let non-admin users enable admin notifications", () => {
    expect(parseNotificationPrefs({ messages: false, admin: true }, false)).toEqual({
      messages: false,
      my_events: true,
      account: true,
      admin: false,
    });
    expect(parseNotificationPrefs({ admin: true }, true).admin).toBe(true);
  });

  it("maps notification contexts to preference categories", () => {
    expect(pushCategoryForContext("ADMIN_ALERT")).toBe("admin");
    expect(pushCategoryForContext("HOST_UPDATE")).toBe("my_events");
    expect(pushCategoryForContext("SUBMISSION")).toBe("account");
    expect(pushCategoryForContext("THREAD")).toBe("messages");
  });

  it("normalizes, truncates, and absolutizes declarative payloads", () => {
    const payload = buildDeclarativePayload({
      title: `  ${"T".repeat(140)}  `,
      body: `Hello\n ${"world ".repeat(50)}`,
      navigate: "/events",
      badge: 2,
    });
    expect(payload.notification.title).toHaveLength(120);
    expect(payload.notification.body?.length).toBeLessThanOrEqual(180);
    expect(payload.notification.navigate).toBe("https://www.zaylist.com/events");
    expect(payload.notification.app_badge).toBe("2");
  });
});
