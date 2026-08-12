import { describe, expect, it } from "vitest";
import { dedupeEvents, findDuplicateEventGroups } from "../shared/eventDedupe";
import { getEventChatWindow } from "../shared/eventChatWindow";
import { isEventTalentRole } from "../shared/eventTalent";

const baseEvent = {
  id: 1,
  title: "Pride Night!",
  venueName: "The Venue",
  dateStart: "2026-08-14T21:00:00-07:00",
  posterImageUrl: null,
  description: null,
  ticketUrl: null,
};

describe("event lifecycle rules", () => {
  it("collapses only same-event, same-venue, same-minute duplicates", () => {
    const richer = { ...baseEvent, id: 2, title: "pride night", posterImageUrl: "/poster.jpg" };
    const later = { ...baseEvent, id: 3, dateStart: "2026-08-14T22:00:00-07:00" };
    expect(dedupeEvents([baseEvent, richer, later]).map((event) => event.id)).toEqual([2, 3]);
    expect(findDuplicateEventGroups([baseEvent, richer, later])).toHaveLength(1);
  });

  it("opens chat 48 hours before doors and closes four hours after", () => {
    const start = Date.parse("2026-08-14T21:00:00-07:00");
    const end = Date.parse("2026-08-14T23:00:00-07:00");
    expect(getEventChatWindow(baseEvent.dateStart, "2026-08-14T23:00:00-07:00", start - 49 * 3_600_000)?.state).toBe("BEFORE");
    expect(getEventChatWindow(baseEvent.dateStart, "2026-08-14T23:00:00-07:00", start)?.state).toBe("OPEN");
    expect(getEventChatWindow(baseEvent.dateStart, "2026-08-14T23:00:00-07:00", end + 4 * 3_600_000)?.state).toBe("CLOSED");
  });

  it("accepts only canonical talent roles", () => {
    expect(isEventTalentRole("DJ")).toBe(true);
    expect(isEventTalentRole("OWNER")).toBe(false);
  });
});
