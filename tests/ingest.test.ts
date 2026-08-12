import { describe, expect, it } from "vitest";
import { parseIcs } from "../server/ingest/parseIcs";
import { assertSafePublicUrl } from "../server/ingest/ssrf";
import { isPastEventListing } from "../server/ingest/dates";

describe("event ingestion and QSearch safety", () => {
  it("parses a minimal calendar event with source provenance", () => {
    const rows = parseIcs([
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:coverage-1",
      "DTSTART:20260815T040000Z",
      "DTEND:20260815T060000Z",
      "SUMMARY:Coverage Pride Night",
      "LOCATION:Portland OR",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n"), "https://example.com/events.ics");
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Coverage Pride Night");
    expect(rows[0].sourceUrl).toBe("https://example.com/events.ics");
  });

  it.each(["http://127.0.0.1/private", "http://169.254.169.254/latest", "file:///etc/passwd", "https://user:pass@example.com/"])(
    "rejects unsafe fetch target %s",
    async (url) => expect(assertSafePublicUrl(url)).rejects.toThrow(),
  );

  it("uses event end time before declaring a listing past", () => {
    const now = Date.parse("2026-08-15T05:00:00Z");
    expect(isPastEventListing({ dateStart: "2026-08-15T03:00:00Z", dateEnd: "2026-08-15T06:00:00Z" }, now)).toBe(false);
    expect(isPastEventListing({ dateStart: "2026-08-15T01:00:00Z", dateEnd: "2026-08-15T02:00:00Z" }, now)).toBe(true);
  });
});
