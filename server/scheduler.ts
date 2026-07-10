import { storage } from "./storage";
import { isPushConfigured } from "./push/vapid";
import { sendPushToSubscription, buildDeclarativePayload } from "./push/send";
import { beachVenueLabel, formatRiverBratsHour, isValidBeachId } from "@shared/riverBrats";

// Fires persisted one-shot prompts ("you said 4pm — are you here?") and
// piggybacks the hourly chat-retention purge. Single-process by design
// (better-sqlite3, one dyno); claimDuePrompts marks rows SENT atomically.

const TICK_MS = 60_000;
const PURGE_EVERY_MS = 3_600_000;

let started = false;
let lastPurge = 0;

export function startPromptScheduler() {
  if (started) return;
  started = true;
  const timer = setInterval(() => {
    void tick().catch(err => console.error("[scheduler] tick failed:", err));
  }, TICK_MS);
  timer.unref?.();
}

async function tick() {
  const now = Date.now();
  if (now - lastPurge > PURGE_EVERY_MS) {
    lastPurge = now;
    try {
      storage.purgeExpiredChatMessages(now);
    } catch (err) {
      console.error("[scheduler] purge failed:", err);
    }
  }

  const due = storage.claimDuePrompts(new Date(now).toISOString());
  for (const prompt of due) {
    try {
      await firePrompt(prompt);
    } catch (err) {
      console.error(`[scheduler] prompt ${prompt.id} failed:`, err);
    }
  }
}

async function firePrompt(prompt: any) {
  if (prompt.kind !== "BEACH_ARRIVAL") return;
  const beachId = String(prompt.beach_id ?? prompt.beachId ?? "");
  const calendarDate = String(prompt.calendar_date ?? prompt.calendarDate ?? "");
  const userId = Number(prompt.user_id ?? prompt.userId);
  if (!isValidBeachId(beachId) || !userId) return;

  // Re-check just before sending: withdrawn or already-verified check-ins
  // don't get nagged.
  const checkin = storage.getBeachCheckinByUser(beachId, userId, calendarDate);
  if (!checkin || (checkin as any).presence === "HERE") {
    markSkipped(prompt.id);
    return;
  }
  if (!isPushConfigured()) {
    markSkipped(prompt.id);
    return;
  }
  const prefs = storage.getNotificationPrefs(userId);
  if (!prefs.my_events) {
    markSkipped(prompt.id);
    return;
  }
  const subs = storage.getActivePushSubscriptions(userId);
  if (subs.length === 0) {
    markSkipped(prompt.id);
    return;
  }

  const payload = buildDeclarativePayload({
    title: `Are you at ${beachVenueLabel(beachId)}?`,
    body: `You planned ${formatRiverBratsHour(checkin.arrivalHour)}. Tap to confirm you're here.`,
    navigate: `/nude-beaches?tab=${beachId}&verify=1`,
    tag: `beach-arrival-${prompt.id}`,
  });
  await Promise.all(subs.map(async sub => {
    const result = await sendPushToSubscription(sub, payload);
    if (result.ok) storage.touchPushSubscription(sub.id);
    else if (result.gone) storage.deactivatePushSubscription(sub.id);
  }));
  console.log(`[scheduler] beach-arrival prompt ${prompt.id} sent user=${userId} beach=${beachId}`);
}

function markSkipped(promptId: number) {
  storage.markPromptSkipped(promptId);
}
