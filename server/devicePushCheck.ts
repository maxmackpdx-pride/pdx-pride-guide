import type { Express, RequestHandler } from "express";
import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { buildDeclarativePayload, sendPushToSubscription } from "./push/send";
import { isPushConfigured } from "./push/vapid";

type Subscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};
type Store = {
  getActivePushSubscriptions: (userId: number) => Subscription[];
  deactivatePushSubscription: (id: number) => void;
  touchPushSubscription: (id: number) => void;
};
export function supportsDeviceCheck(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return false;
    return (
      url.hostname === "fcm.googleapis.com" ||
      url.hostname === "push.apple.com" ||
      url.hostname.endsWith(".push.apple.com") ||
      url.hostname === "push.services.mozilla.com" ||
      url.hostname.endsWith(".push.services.mozilla.com") ||
      url.hostname.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}
export function registerDevicePushCheck(
  app: Express,
  db: Database.Database,
  auth: RequestHandler,
  store: Store,
) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS push_device_checks(user_id INTEGER PRIMARY KEY,last_requested_at INTEGER NOT NULL)",
  );
  app.post("/api/push/device-status", auth, (req, res) => {
    const endpoint = String(req.body?.endpoint ?? "");
    const sub = store
      .getActivePushSubscriptions(req.session.userId!)
      .find((row) => row.endpoint === endpoint);
    res
      .set("Cache-Control", "private, no-store")
      .json({
        registered: !!sub,
        canTest: !!sub && supportsDeviceCheck(endpoint) && isPushConfigured(),
      });
  });
  app.post("/api/push/device-check", auth, async (req, res) => {
    if (
      !req.is("application/json") ||
      req.get("Sec-Fetch-Site") === "cross-site"
    )
      return res
        .status(403)
        .json({ error: "Open notification settings on this device." });
    const userId = req.session.userId!,
      endpoint = String(req.body?.endpoint ?? "");
    const target = store
      .getActivePushSubscriptions(userId)
      .find((row) => row.endpoint === endpoint);
    if (!target || !supportsDeviceCheck(target.endpoint))
      return res
        .status(400)
        .json({ error: "Enable a supported device subscription first." });
    if (!isPushConfigured())
      return res
        .status(503)
        .json({ error: "Device alerts are temporarily unavailable." });
    const now = Date.now();
    const changed = db
      .prepare(
        `INSERT INTO push_device_checks(user_id,last_requested_at) VALUES(?,?)
      ON CONFLICT(user_id) DO UPDATE SET last_requested_at=excluded.last_requested_at WHERE push_device_checks.last_requested_at<=?`,
      )
      .run(userId, now, now - 60_000).changes;
    if (!changed)
      return res
        .status(429)
        .json({ error: "Wait one minute before sending another test." });
    const checkId = randomUUID();
    const payload = buildDeclarativePayload({
      title: "Zaylist test alert",
      body: "Tap to confirm this device received your alert.",
      navigate: "/dashboard?section=settings&pushCheck=" + checkId,
      tag: "zaylist-device-check",
    });
    const result = await sendPushToSubscription(target, payload);
    if (!result.ok) {
      if (result.gone) store.deactivatePushSubscription(target.id);
      return res
        .status(502)
        .json({
          error:
            "Your push service did not accept this test. Check your device settings.",
        });
    }
    store.touchPushSubscription(target.id);
    res
      .set("Cache-Control", "private, no-store")
      .json({ accepted: true, checkId });
  });
}
