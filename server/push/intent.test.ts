import assert from "node:assert/strict";
import test from "node:test";
import type { Message } from "@shared/schema";
import { appDestination } from "@shared/appDestination";
import { messageNotificationIntent } from "./intent";
import { buildPushPayloadForMessage } from "./templates";

test("message intent gives web and a future app the same destination", () => {
  const message = {
    id: 42, threadId: "room & hall", contextType: "GIG", body: "Hello", toUserId: 3, fromUserId: 2,
  } as Message;
  const intent = messageNotificationIntent(message, 3);
  const web = buildPushPayloadForMessage(message, 3);
  assert.equal(intent.destination, "/inbox?thread=room%20%26%20hall");
  assert.equal(web.notification.navigate, `https://www.zaylist.com${intent.destination}`);
  assert.equal(web.notification.title, intent.title);
  assert.equal(web.notification.app_badge, "3");
});

test("admin and promoter messages retain their existing destinations", () => {
  const message = { id: 8, threadId: "one", contextType: "ADMIN_ALERT", subject: "Alert" } as Message;
  assert.equal(messageNotificationIntent(message, 1).destination, "/dashboard");
  assert.equal(messageNotificationIntent({ ...message, contextType: "PROMOTER" }, 1).destination, "/submit");
});

test("app destinations remain on the Zaylist site", () => {
  assert.equal(appDestination("/events/2?ref=push#details"), "/events/2?ref=push#details");
  assert.throws(() => appDestination("//another.example/path"));
  assert.throws(() => appDestination("https://another.example/path"));
});
