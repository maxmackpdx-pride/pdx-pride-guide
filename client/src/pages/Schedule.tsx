/* ============================================================
   Zaylist | Schedule
   Festival-timeline redesign of /schedule. The whole week side by
   side; packed days widen and scroll horizontally instead of
   squishing text; the day-color system carries the meaning.

   Ported from the Claude Design handoff (Schedule.dc.html) into an
   idiomatic React + TS component. Behavior and pixels match the
   prototype 1:1. Depends on the DS tokens (fonts, colors, effects)
   being loaded globally via client/src/index.css.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ADM,
  DAYS,
  TYPE_LABEL,
  fmtClock,
  fmtHour,
  hexA,
  layoutDay,
  type AdmKey,
  type EventType,
  type LaneInfo,
} from "@shared/eventWeek";
import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import { pacificTodayDate, parsePacificDateTime } from "@shared/missedConnections";
import {
  DEFAULT_ATTENDANCE_PHRASE_KEY,
  attendancePhraseLabel,
} from "@shared/attendancePhrases";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  buildScheduleEvents,
  isBeachScheduleEvent,
  type BeachCheckinScheduleRow,
  type ScheduleEvent,
} from "@/lib/scheduleEvents";
import AuthModal from "@/components/AuthModal";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScheduleHero from "@/components/ScheduleHero";
import ScrollReveal from "@/components/ScrollReveal";
import { spawnRsvpSparks } from "@/components/RsvpSparks";
import { Button } from "@/components/ds";
import { Download } from "lucide-react";
import "./Schedule.css";
import "./ScheduleToolbar.css";
import { shareCardUrl } from "@shared/shareCards";

// ---- Year-round week model (the grid navigates by real week, not a fixed Jul 13–19) ----
const SCHED_PACIFIC = "America/Los_Angeles";
const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
/** YYYY-MM-DD → epoch-ms at Pacific noon (offset-safe for date math). */
function ymdMs(ymd: string): number {
  return parsePacificDateTime(`${ymd}T12:00:00`) ?? Date.parse(`${ymd}T12:00:00-07:00`);
}
/** epoch-ms → Pacific YYYY-MM-DD. */
function msYmd(ms: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SCHED_PACIFIC, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}
/** Pacific weekday code (MON…SUN) for a YYYY-MM-DD. */
function ymdWeekday(ymd: string): string {
  const s = new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, weekday: "short" }).format(new Date(ymdMs(ymd)));
  return WEEKDAY_CODES[["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(s)] ?? "MON";
}
/** Monday (YYYY-MM-DD) of the week containing `ymd`. */
function mondayOf(ymd: string): string {
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, weekday: "short" }).format(new Date(ymdMs(ymd))),
  );
  const backToMon = (dow + 6) % 7; // days since Monday (Mon=0 … Sun=6)
  return msYmd(ymdMs(ymd) - backToMon * 86400000);
}
/** "JUL 20" style label for a YYYY-MM-DD. */
function ymdDayLabel(ymd: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, month: "short", day: "numeric" }).format(new Date(ymdMs(ymd))).toUpperCase();
}
/** Day-of-month number ("20") for a YYYY-MM-DD. */
function ymdDayNum(ymd: string): string {
  return String(Number(ymd.slice(8, 10)));
}
type WeekColumn = { key: string; short: string; date: string; ymd: string; color: string; text: string };
/** The 7 columns (Mon→Sun) for the week starting `weekStartYmd`, colored by weekday. */
function buildWeekColumns(weekStartYmd: string): WeekColumn[] {
  return Array.from({ length: 7 }, (_, i) => {
    const ymd = msYmd(ymdMs(weekStartYmd) + i * 86400000);
    const code = ymdWeekday(ymd);
    const def = DAYS.find(d => d.key === code);
    return { key: code, short: code, date: ymdDayLabel(ymd), ymd, color: def?.color ?? "#19e3ff", text: def?.text ?? "#19e3ff" };
  });
}
/** "Jul 20 – 26" range label for the week header. */
function weekRangeLabel(weekStartYmd: string): string {
  const endYmd = msYmd(ymdMs(weekStartYmd) + 6 * 86400000);
  const startMs = ymdMs(weekStartYmd);
  const endMs = ymdMs(endYmd);
  const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, month: "short", day: "numeric" });
  const dayFmt = new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, day: "numeric" });
  const sameMonth = new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, month: "short" }).format(new Date(startMs)) ===
    new Intl.DateTimeFormat("en-US", { timeZone: SCHED_PACIFIC, month: "short" }).format(new Date(endMs));
  return `${monthFmt.format(new Date(startMs))} – ${(sameMonth ? dayFmt : monthFmt).format(new Date(endMs))}`;
}

/** Legacy prop - event blocks always use full-bleed flyer backgrounds. */
export type PosterStyle = 'Color blocks' | 'Poster chip' | 'Poster peek';
/** Row density - vertical scale of the grid. */
export type Density = 'Comfortable' | 'Compact';

export interface ScheduleProps {
  /** default "Color blocks" (cleanest, most legible) */
  posterStyle?: PosterStyle;
  /** default "Comfortable" */
  density?: Density;
  /** Home embed: horizontal week grid only (no hero, toolbar, or filters). */
  embed?: boolean;
}

type View = 'mine' | 'all';
type FilterMap = Record<string, boolean>;

interface SelRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  w: number;
  h: number;
}

const S = (o: React.CSSProperties) => o; // literal-preserving style helper

/** minutes-past-midnight "now" in Pacific time, pushed past 24h for the small-hours tail */
function nowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  let t = hour * 60 + minute;
  if (hour < 4) t += 1440;
  return t;
}

export default function Schedule({
  density = 'Comfortable',
  embed = false,
}: ScheduleProps) {
  const { user } = useAuth();
  const [view, setViewState] = useState<View>('all');
  const [viewBootstrapped, setViewBootstrapped] = useState(false);
  const [fAdm, setFAdm] = useState<FilterMap>({});
  const [fType, setFType] = useState<FilterMap>({});
  const [fAge, setFAge] = useState<FilterMap>({});
  const { calmMode: calm } = useTheme();
  const [selKey, setSelKey] = useState<string | null>(null);
  const [selRect, setSelRect] = useState<SelRect | null>(null);
  const [now, setNow] = useState<number>(nowMinutes);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  // Selected week (Monday YYYY-MM-DD); null = follow the auto default (week of next event).
  const [weekStart, setWeekStart] = useState<string | null>(null);

  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePageSeo(
    "Schedule | Zaylist",
    "Portland nights, laid out side by side. Build your week.",
    embed
      ? { skip: true }
      : {
          image: shareCardUrl("schedule"),
          imageAlt: "Events schedule on Zaylist",
        },
  );

  useAttendanceSummariesLive();

  const { data: listings = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
  });

  const { data: myCheckIns = [] } = useQuery<{ eventId: number }[]>({
    queryKey: ["/api/events/mine/check-ins"],
    queryFn: () => apiRequest("GET", "/api/events/mine/check-ins").then(r => r.json()),
    enabled: !!user,
  });

  const { data: myBeachCheckIns = [] } = useQuery<BeachCheckinScheduleRow[]>({
    queryKey: ["/api/river-brats/checkins/mine"],
    queryFn: () => apiRequest("GET", "/api/river-brats/checkins/mine").then(r => r.json()),
    enabled: !!user,
  });

  const myEventIds = useMemo(
    () => new Set(myCheckIns.map(c => c.eventId)),
    [myCheckIns],
  );

  /** Beach blocks always count as “mine” (personal River Brats plans). */
  const myScheduleIds = useMemo(() => {
    const s = new Set(myEventIds);
    for (const b of myBeachCheckIns) {
      if (b?.id != null) s.add(-Math.abs(Number(b.id)));
    }
    return s;
  }, [myEventIds, myBeachCheckIns]);

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(listings, attendanceSummaries, user ? myBeachCheckIns : []),
    [listings, attendanceSummaries, myBeachCheckIns, user],
  );

  // Week the grid opens on: the week of the next upcoming event, else the current week.
  const defaultWeekStart = useMemo(() => {
    const nowMs = Date.now();
    const upcoming = scheduleEvents
      .filter(e => e.endMs >= nowMs && e.calendarDate)
      .sort((a, b) => a.startMs - b.startMs)[0];
    const anchor = upcoming?.calendarDate ?? pacificTodayDate(nowMs);
    return mondayOf(anchor);
  }, [scheduleEvents]);
  const activeWeekStart = weekStart ?? defaultWeekStart;
  const weekColumns = useMemo(() => buildWeekColumns(activeWeekStart), [activeWeekStart]);
  const shiftWeek = useCallback(
    (deltaWeeks: number) => setWeekStart(msYmd(ymdMs(activeWeekStart) + deltaWeeks * 7 * 86400000)),
    [activeWeekStart],
  );

  const rsvpMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest("POST", `/api/events/${eventId}/attendance`, {
        message: attendancePhraseLabel(DEFAULT_ATTENDANCE_PHRASE_KEY),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
    },
  });

  const unrsvpMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest("DELETE", `/api/events/${eventId}/attendance`),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/mine/check-ins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/attendance-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "attendance"] });
    },
  });

  const withdrawBeachMutation = useMutation({
    mutationFn: (checkinId: number) =>
      apiRequest("DELETE", `/api/river-brats/checkins/${checkinId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      setSelKey(null);
      setSelRect(null);
      setToast("Removed beach day from your schedule");
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(""), 3200);
    },
  });

  useEffect(() => {
    if (viewBootstrapped || !user) return;
    if (myEventIds.size > 0 || myBeachCheckIns.length > 0) {
      setViewState('mine');
      setViewBootstrapped(true);
    }
  }, [user, myEventIds.size, myBeachCheckIns.length, viewBootstrapped]);

  /* ---- lifecycle -------------------------------------------------- */

  // tick the NOW line every minute
  useEffect(() => {
    const t = setInterval(() => setNow(nowMinutes()), 60000);
    return () => clearInterval(t);
  }, []);

  // Escape closes the popover
  const closeEvent = useCallback(() => {
    setSelKey(null);
    setSelRect(null);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEvent();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeEvent]);

  // Grid scroll-to-now lives after the day columns are built (year-round
  // week, not a hardcoded Pride-week Friday).

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /* ---- actions ---------------------------------------------------- */

  const setView = useCallback((v: View) => {
    setViewState(v);
    setSelKey(null);
    setSelRect(null);
  }, []);

  const toggleRsvp = useCallback((eventId: number) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    // Negative ids are synthetic beach schedule blocks - uncheck via River Brats.
    if (eventId < 0) {
      const checkinId = Math.abs(eventId);
      if (checkinId > 0) withdrawBeachMutation.mutate(checkinId);
      return;
    }
    if (myEventIds.has(eventId)) {
      unrsvpMutation.mutate(eventId);
      return;
    }
    rsvpMutation.mutate(eventId);
  }, [user, myEventIds, rsvpMutation, unrsvpMutation, withdrawBeachMutation]);

  const toggleFilter = useCallback((group: 'fAdm' | 'fType' | 'fAge', key: string) => {
    const setter = group === 'fAdm' ? setFAdm : group === 'fType' ? setFType : setFAge;
    setter((m) => ({ ...m, [key]: !m[key] }));
  }, []);

  const clearFilters = useCallback(() => {
    setFAdm({});
    setFType({});
    setFAge({});
  }, []);

  const openEvent = useCallback((key: string, rect: DOMRect) => {
    setSelKey(key);
    setSelRect({
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      w: rect.width,
      h: rect.height,
    });
  }, []);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const matchFilters = useCallback(
    (e: ScheduleEvent) => {
      const anyAdm = Object.keys(fAdm).some((k) => fAdm[k]);
      if (anyAdm && !fAdm[e.adm]) return false;
      const anyType = Object.keys(fType).some((k) => fType[k]);
      if (anyType && !e.types.some((t) => fType[t])) return false;
      const anyAge = Object.keys(fAge).some((k) => fAge[k]);
      if (anyAge && !fAge[e.age]) return false;
      return true;
    },
    [fAdm, fType, fAge],
  );

  /* ---- Export to Instagram Stories (real 1080×1920 PNG) ---------- */

  const exportStories = useCallback(async () => {
    if (exporting) return;
    const mine = scheduleEvents.filter((e) => myScheduleIds.has(e.id) || isBeachScheduleEvent(e));
    const list = mine.length ? mine : scheduleEvents.filter((e) => e.feat);
    const dayOrder: Record<string, number> = {};
    DAYS.forEach((d, i) => (dayOrder[d.key] = i));
    list.sort((a, b) => dayOrder[a.day] - dayOrder[b.day] || a.s - b.s);
    setExporting(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const W = 1080;
      const H = 1920;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const x = c.getContext('2d');
      if (!x) throw new Error('no 2d context');
      x.fillStyle = '#0a0a0a';
      x.fillRect(0, 0, W, H);
      const rb = x.createLinearGradient(0, 0, W, 0);
      rb.addColorStop(0, '#00FFFF');
      rb.addColorStop(0.34, '#CCFF00');
      rb.addColorStop(0.67, '#FF00CC');
      rb.addColorStop(1, '#FF6600');
      x.fillStyle = rb;
      x.fillRect(0, 0, W, 16);
      x.fillRect(0, H - 16, W, 16);
      x.textBaseline = 'alphabetic';
      x.fillStyle = '#00FFFF';
      x.font = '700 34px "Barlow Condensed", sans-serif';
      x.fillText('PORTLAND PRIDE WEEK 2026 · JUL 13–19', 74, 118);
      x.fillStyle = '#fff';
      x.font = '900 150px "Barlow Condensed", sans-serif';
      x.fillText(mine.length ? 'MY PRIDE' : 'PRIDE WEEK', 70, 250);
      x.fillText(mine.length ? 'WEEK' : 'PICKS', 70, 388);
      x.fillStyle = 'rgba(230,227,218,.7)';
      x.font = '500 30px Inter, sans-serif';
      x.fillText(
        mine.length
          ? mine.length + (mine.length === 1 ? ' event you’re going to' : ' events you’re going to')
          : 'The weekend’s headliners',
        74,
        452,
      );
      let y = 540;
      const dayColor: Record<string, string> = {};
      DAYS.forEach((d) => (dayColor[d.key] = d.color));
      const rows = list.slice(0, 12);
      for (const e of rows) {
        const dc = dayColor[e.day];
        x.fillStyle = dc;
        x.fillRect(74, y - 34, 8, 78);
        x.fillStyle = dc;
        x.font = '700 27px "Barlow Condensed", sans-serif';
        const short = DAYS.find((d) => d.key === e.day)!.short;
        x.fillText(short + '  ' + fmtClock(e.s).toUpperCase(), 104, y - 4);
        x.fillStyle = '#fff';
        x.font = '800 40px "Barlow Condensed", sans-serif';
        let t = e.title.toUpperCase();
        while (x.measureText(t).width > W - 200 && t.length > 4) t = t.slice(0, -2);
        if (t !== e.title.toUpperCase()) t += '…';
        x.fillText(t, 104, y + 38);
        x.fillStyle = 'rgba(230,227,218,.6)';
        x.font = '400 26px Inter, sans-serif';
        x.fillText(e.venue + ' · ' + e.hood, 104, y + 74);
        y += 108;
      }
      if (list.length > rows.length) {
        x.fillStyle = '#CCFF00';
        x.font = '700 30px "Barlow Condensed", sans-serif';
        x.fillText('+ ' + (list.length - rows.length) + ' MORE ON ZAYLIST.COM', 104, y + 6);
      }
      x.fillStyle = '#fff';
      x.font = '900 40px "Barlow Condensed", sans-serif';
      x.fillText('ZAYLIST', 74, H - 96);
      x.fillStyle = '#FF00CC';
      x.font = '700 27px "Barlow Condensed", sans-serif';
      x.fillText('PRIDE IS A PROTEST. TAKE CARE OF EACH OTHER. ✦', 74, H - 56);
      const blob: Blob | null = await new Promise((res) => c.toBlob(res, 'image/png'));
      if (!blob) throw new Error('toBlob failed');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pdx-pride-schedule.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      flashToast('Saved to downloads ✦ ready for Stories');
    } catch {
      flashToast('Export hit a snag. Try again');
    } finally {
      setExporting(false);
    }
  }, [exporting, scheduleEvents, myScheduleIds, flashToast]);

  /* ---- derived layout constants ----------------------------------- */

  const compact = density === 'Compact';
  const HOUR_H = embed ? 42 : compact ? 58 : 74;
  const MIN_LANE = embed ? 104 : compact ? 124 : 152;
  const BASE_DAY = embed ? 156 : compact ? 230 : 290;
  const MIN_H = embed ? 24 : compact ? 36 : 44;
  const START = 10;
  const END = 27;
  const HEADER_H = embed ? 34 : 56;
  const AXIS_W = embed ? 44 : 62;
  const TOTAL_H = (END - START) * HOUR_H;
  const hourBg =
    'repeating-linear-gradient(to bottom, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, transparent 1px, transparent ' +
    HOUR_H +
    'px)';

  const inView = useCallback(
    (e: ScheduleEvent) =>
      embed || view === 'all' || myScheduleIds.has(e.id) || isBeachScheduleEvent(e),
    [embed, view, myScheduleIds],
  );
  const pass = useCallback((e: ScheduleEvent) => inView(e) && matchFilters(e), [inView, matchFilters]);
  const viewSet = useMemo(() => scheduleEvents.filter(inView), [scheduleEvents, inView]);

  /* ---- time axis labels ------------------------------------------- */

  const timeLabels = useMemo(() => {
    const arr: { key: number; label: string; style: React.CSSProperties }[] = [];
    for (let i = START; i < END; i++) {
      arr.push({
        key: i,
        label: fmtHour(i),
        style: S({
          position: 'absolute',
          right: embed ? '4px' : '8px',
          top: (i - START) * HOUR_H + (embed ? 2 : 4) + 'px',
          fontFamily: 'var(--font-body)',
          fontSize: embed ? '9px' : '10.5px',
          fontWeight: 600,
          color: 'rgba(230,227,218,.4)',
          whiteSpace: 'nowrap',
          letterSpacing: '.03em',
        }),
      });
    }
    return arr;
  }, [HOUR_H, embed]);

  /* ---- days (headers + packed blocks) ----------------------------- */

  type BlockVM = {
    id: number;
    onClick: (ev: React.MouseEvent<HTMLDivElement>) => void;
    onQuick: (ev: React.MouseEvent<HTMLButtonElement>) => void;
    style: React.CSSProperties;
    time: string;
    title: string;
    venue: string;
    showVenue: boolean;
    showQuick: boolean;
    showCheck: boolean;
    live: boolean;
    overlayStyle: React.CSSProperties;
    quickIcon: string;
    timeStyle: React.CSSProperties;
    titleStyle: React.CSSProperties;
    venueStyle: React.CSSProperties;
    liveDotStyle: React.CSSProperties;
    checkStyle: React.CSSProperties;
    quickStyle: React.CSSProperties;
    contentStyle: React.CSSProperties;
  };
  type DayVM = {
    key: string;
    short: string;
    date: string;
    width: number;
    headStyle: React.CSSProperties;
    nameStyle: React.CSSProperties;
    dateStyle: React.CSSProperties;
    countStyle: React.CSSProperties;
    countLabel: string;
    blocks: BlockVM[];
  };

  const days: DayVM[] = useMemo(() => {
    return weekColumns.map((d) => {
      const dc = calm ? '#7d7d82' : d.color;
      const dt = calm ? '#c8c8cc' : d.text;
      // Bucket by real calendar date within the selected week (not just weekday code).
      const list = scheduleEvents.filter((e) => e.calendarDate === d.ymd && pass(e));
      const { res, maxCols } = layoutDay(list);
      const dayW = Math.max(BASE_DAY, maxCols * MIN_LANE);
      const blocks: BlockVM[] = list.map((e) => {
        const L: LaneInfo = res[e.id] || { col: 0, totalCols: 1 };
        const laneW = dayW / L.totalCols;
        const left = L.col * laneW + 3;
        const width = laneW - 6;
        const top = ((e.s - START * 60) / 60) * HOUR_H;
        const height = Math.max(((e.e - e.s) / 60) * HOUR_H, MIN_H);
        const isBeach = isBeachScheduleEvent(e);
        const rsvp = isBeach || myEventIds.has(e.id);
        const live = now != null && e.s <= now && now < e.e;
        const twoLine = height >= (embed ? 40 : 54);
        const showVenue = height >= (embed ? 56 : 74) && width >= (embed ? 96 : 116);
        const showQuick = !embed && !isBeach && height >= 56 && width >= 100;
        const style = S({
          position: 'absolute',
          top: top + 'px',
          left: left + 'px',
          width: width + 'px',
          height: height + 'px',
          borderRadius: '6px',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid ' + hexA(dc, rsvp ? 0.6 : 0.22),
          borderLeft: '3px solid ' + dc,
          backgroundColor: 'var(--ink-800)',
          backgroundImage: 'url(' + e.posterUrl + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            rsvp && !calm ? '0 0 16px -3px ' + hexA(dc, 0.75) : '0 2px 10px -5px rgba(0,0,0,.7)',
        });
        return {
          id: e.id,
          onClick: (ev) => openEvent(e.scheduleKey, ev.currentTarget.getBoundingClientRect()),
          onQuick: (ev) => {
            ev.stopPropagation();
            toggleRsvp(e.id);
          },
          style,
          time: height >= (embed ? 40 : 54) ? fmtClock(e.s) + ' – ' + fmtClock(e.e) : fmtClock(e.s),
          title: e.title,
          venue: e.venue,
          showVenue,
          showQuick,
          showCheck: rsvp && !showQuick,
          live,
          quickIcon: rsvp ? '♥' : '♡',
          overlayStyle: S({
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(11,11,14,0.78) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }),
          timeStyle: S({
            fontFamily: 'var(--font-body)',
            fontSize: (embed ? 9 : compact ? 10 : 11) + 'px',
            fontWeight: 600,
            color: dt,
            whiteSpace: 'nowrap',
            letterSpacing: '.01em',
            textShadow: calm ? 'none' : '0 0 8px ' + hexA(dc, 0.4),
          }),
          titleStyle: S({
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            textTransform: 'uppercase',
            lineHeight: 1.02,
            color: 'var(--text-hi)',
            fontSize: (embed ? 11 : compact ? 12.5 : 14.5) + 'px',
            letterSpacing: '.01em',
            display: '-webkit-box',
            WebkitLineClamp: twoLine ? 2 : 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            marginTop: '1px',
            textShadow: '0 1px 8px rgba(0,0,0,.75)',
          }),
          venueStyle: S({
            fontFamily: 'var(--font-body)',
            fontSize: (embed ? 9 : compact ? 10 : 11) + 'px',
            color: 'rgba(230,227,218,.6)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '3px',
          }),
          liveDotStyle: S({
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            flex: 'none',
            background: 'var(--neon-magenta)',
            boxShadow: calm ? 'none' : '0 0 7px var(--neon-magenta)',
          }),
          checkStyle: S({
            marginLeft: 'auto',
            fontSize: '10px',
            color: 'var(--text-inverse)',
            background: dc,
            borderRadius: '3px',
            width: '15px',
            height: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            flex: 'none',
          }),
          quickStyle: S({
            position: 'absolute',
            top: '5px',
            right: '5px',
            zIndex: 4,
            width: '21px',
            height: '21px',
            borderRadius: '6px',
            border: '1px solid ' + hexA(dc, 0.55),
            background: rsvp ? dc : 'rgba(0,0,0,.45)',
            color: rsvp ? 'var(--text-inverse)' : dc,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            lineHeight: 1,
            padding: 0,
          }),
          contentStyle: S({
            position: 'relative',
            zIndex: 2,
            padding: embed ? '3px 5px' : compact ? '4px 7px' : '6px 9px',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
          }),
        };
      });
      const headStyle = S({
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--ink-900)',
        padding: embed ? '5px 8px 5px' : '9px 10px 9px',
        borderBottom: embed ? '2px solid ' + dc : '3px solid ' + dc,
        display: 'flex',
        flexDirection: 'column',
        gap: embed ? '2px' : '3px',
        boxShadow: calm ? 'none' : '0 3px 12px -7px ' + hexA(dc, 0.9),
      });
      const cnt = list.length;
      const countLabel = cnt
        ? cnt + (cnt === 1 ? ' EVENT' : ' EVENTS')
        : view === 'mine'
          ? 'NONE RSVP’D'
          : 'QUIET DAY';
      return {
        key: d.key,
        short: d.short,
        date: d.date,
        width: dayW,
        headStyle,
        nameStyle: S({
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: embed ? '13px' : '17px',
          letterSpacing: '.04em',
          color: dt,
          lineHeight: 1,
          textTransform: 'uppercase',
        }),
        dateStyle: S({
          fontFamily: 'var(--font-body)',
          fontSize: embed ? '9px' : '10.5px',
          fontWeight: 600,
          color: 'rgba(230,227,218,.48)',
          letterSpacing: '.02em',
        }),
        countStyle: S({
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: embed ? '8.5px' : '10.5px',
          letterSpacing: '.09em',
          color: cnt ? dt : 'rgba(255,255,255,.26)',
          textTransform: 'uppercase',
        }),
        countLabel,
        blocks,
      };
    });
  }, [
    calm,
    pass,
    BASE_DAY,
    MIN_LANE,
    HOUR_H,
    MIN_H,
    compact,
    embed,
    scheduleEvents,
    weekColumns,
    myEventIds,
    now,
    view,
    openEvent,
    toggleRsvp,
  ]);

  const todayYmd = pacificTodayDate(Date.now());
  const thisWeekStart = mondayOf(todayYmd);
  const isThisWeek = activeWeekStart === thisWeekStart;
  const weekEventCount = days.reduce((n, d) => n + d.blocks.length, 0);

  const daysRef = useRef(days);
  daysRef.current = days;
  const weekColumnsRef = useRef(weekColumns);
  weekColumnsRef.current = weekColumns;

  const scrollDayIntoView = useCallback((idx: number) => {
    const el = scrollElRef.current;
    if (!el) return;
    const ds = daysRef.current;
    let left = AXIS_W;
    for (let i = 0; i < idx; i++) left += ds[i]?.width ?? BASE_DAY;
    el.scrollTo({ left: Math.max(0, left - 8), behavior: "smooth" });
  }, [AXIS_W, BASE_DAY]);

  const goThisWeek = useCallback(() => {
    const start = mondayOf(pacificTodayDate(Date.now()));
    if (activeWeekStart !== start) setWeekStart(start);
    const today = pacificTodayDate(Date.now());
    const idx = weekColumnsRef.current.findIndex((c) => c.ymd === today);
    requestAnimationFrame(() => {
      if (idx >= 0) scrollDayIntoView(idx);
    });
  }, [activeWeekStart, scrollDayIntoView]);

  // Open on today when this week is on screen; otherwise the first busy day
  // (year-round). Pride-week prototype always jumped to Friday 3pm.
  useEffect(() => {
    const id = setTimeout(() => {
      const el = scrollElRef.current;
      if (!el) return;
      const cols = weekColumnsRef.current;
      const ds = daysRef.current;
      const today = pacificTodayDate(Date.now());
      const todayIdx = cols.findIndex((c) => c.ymd === today);
      const firstBusy = ds.findIndex((d) => d.blocks.length > 0);
      const idx = todayIdx >= 0 ? todayIdx : (firstBusy >= 0 ? firstBusy : 0);
      let left = AXIS_W;
      for (let i = 0; i < idx; i++) left += ds[i]?.width ?? BASE_DAY;
      el.scrollLeft = Math.max(0, left - 8);
      if (todayIdx >= 0) {
        el.scrollTop = Math.max(0, ((nowMinutes() / 60) - START) * HOUR_H - 8);
      } else {
        el.scrollTop = Math.max(0, (15 - START) * HOUR_H - 8);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [activeWeekStart, AXIS_W, BASE_DAY, HOUR_H]);

  /* ---- now line --------------------------------------------------- */

  const nowShown = now != null && now >= START * 60 && now <= END * 60;
  const nowTop = nowShown ? ((now - START * 60) / 60) * HOUR_H : 0;
  const nowLineStyle = S({
    position: 'absolute',
    left: 0,
    right: 0,
    top: nowTop + 'px',
    height: '2px',
    background: 'var(--neon-magenta)',
    boxShadow: calm ? 'none' : '0 0 8px var(--neon-magenta)',
    zIndex: 9,
    pointerEvents: 'none',
  });
  const nowAxisStyle = S({
    position: 'absolute',
    right: '6px',
    top: nowTop - 7 + 'px',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '9px',
    letterSpacing: '.08em',
    color: 'var(--neon-magenta)',
    background: 'var(--ink-900)',
    padding: '1px 3px',
    borderRadius: '2px',
  });

  /* ---- filter chips ----------------------------------------------- */

  const chipStyleOf = (active: boolean, accent: string): React.CSSProperties =>
    S({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 11px 5px',
      fontFamily: 'var(--font-display)',
      fontWeight: 700,
      fontSize: '12.5px',
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      borderRadius: '4px',
      cursor: 'pointer',
      border: '2px solid ' + (active ? accent : 'var(--ink-border-strong)'),
      color: active ? accent : '#c9c9c9',
      background: 'transparent',
      boxShadow: active && !calm ? '0 0 13px -4px ' + accent : 'none',
    });
  const countStyleOf = (active: boolean, accent: string): React.CSSProperties =>
    S({
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '10.5px',
      color: active ? accent : 'var(--text-faint)',
    });

  type ChipVM = {
    key: string;
    label: string;
    count: number;
    style: React.CSSProperties;
    countStyle: React.CSSProperties;
    toggle: () => void;
  };
  const chips: ChipVM[] = [];
  const admDefs: [AdmKey, string, string][] = [
    ['FREE', 'Free', 'var(--neon-yellow)'],
    ['TICKETED', 'Ticketed', 'var(--neon-cyan)'],
    ['SUGGESTED_DONATION', 'Donation', 'var(--amber)'],
  ];
  admDefs.forEach(([k, label, accent]) => {
    const active = !!fAdm[k];
    const count = viewSet.filter((e) => e.adm === k).length;
    chips.push({
      key: 'adm' + k,
      label,
      count,
      style: chipStyleOf(active, calm ? '#c8c8cc' : accent),
      countStyle: countStyleOf(active, calm ? '#c8c8cc' : accent),
      toggle: () => toggleFilter('fAdm', k),
    });
  });
  const typeDefs: [EventType, string][] = [
    ['drag', 'Drag'],
    ['dance', 'Dance'],
    ['music', 'Music'],
    ['sports', 'Sports'],
    ['outdoor', 'Outdoor'],
    ['march', 'Marches'],
    ['community', 'Community'],
  ];
  typeDefs.forEach(([k, label]) => {
    const active = !!fType[k];
    const accent = calm ? '#c8c8cc' : 'var(--neon-yellow)';
    const count = viewSet.filter((e) => e.types.indexOf(k) >= 0).length;
    chips.push({
      key: 'type' + k,
      label,
      count,
      style: chipStyleOf(active, accent),
      countStyle: countStyleOf(active, accent),
      toggle: () => toggleFilter('fType', k),
    });
  });
  const ageDefs: [string, string][] = [
    ['all-ages', 'All ages'],
    ['21+', '21+'],
  ];
  ageDefs.forEach(([k, label]) => {
    const active = !!fAge[k];
    const accent = calm ? '#c8c8cc' : 'var(--neon-cyan)';
    const count = viewSet.filter((e) => e.age === k).length;
    chips.push({
      key: 'age' + k,
      label,
      count,
      style: chipStyleOf(active, accent),
      countStyle: countStyleOf(active, accent),
      toggle: () => toggleFilter('fAge', k),
    });
  });
  const anyFilter =
    Object.keys(fAdm).some((k) => fAdm[k]) ||
    Object.keys(fType).some((k) => fType[k]) ||
    Object.keys(fAge).some((k) => fAge[k]);

  /* ---- toggle + counts -------------------------------------------- */

  const totalVisible = scheduleEvents.filter(pass).length;
  const myCount = myEventIds.size + myBeachCheckIns.length;
  const countPillLabel =
    view === 'mine' ? myCount + ' in my schedule' : totalVisible + ' events';

  const heroStats = useMemo(
    () => [
      { num: scheduleEvents.length, label: "Events on the grid", color: "#19e3ff" },
      { num: myCount, label: "In your schedule", color: "#ccff00" },
      { num: 7, label: "Days, one timeline", color: "#ff1fa0" },
    ],
    [scheduleEvents.length, myCount],
  );

  /* ---- empty banner ----------------------------------------------- */

  type EmptyBanner = { copy: string; actions: ReactNode };
  let emptyBanner: EmptyBanner | null = null;
  if (view === "mine" && !user) {
    emptyBanner = {
      copy: "Sign in and tap “I’ll be there” on events to build your schedule.",
      actions: (
        <>
          <Button type="button" variant="solid" accent="cyan" size="sm" className="pdx-glass-rebind" onClick={() => setShowAuth(true)}>
            Sign in
          </Button>
          <Link href="/events">
            <Button as="span" variant="neon" accent="cyan" size="sm" className="pdx-glass-rebind">
              Browse events
            </Button>
          </Link>
        </>
      ),
    };
  } else if (view === "mine" && myCount === 0) {
    emptyBanner = {
      copy: "Your week is wide open. Tap the heart on events - or plan a River Brats beach day - and it lands here.",
      actions: (
        <>
          <Link href="/events">
            <Button as="span" variant="solid" accent="cyan" size="sm" className="pdx-glass-rebind">
              Browse events
            </Button>
          </Link>
          <Link href="/submit">
            <Button as="span" variant="neon" accent="cyan" size="sm" className="pdx-glass-rebind">
              Submit
            </Button>
          </Link>
        </>
      ),
    };
  } else if (totalVisible === 0) {
    emptyBanner = {
      copy: "Nothing found. Check the spelling, or drop a word.",
      actions: (
        <>
          <Button type="button" variant="solid" accent="cyan" size="sm" className="pdx-glass-rebind" onClick={clearFilters}>
            Clear filters
          </Button>
          <Link href="/events">
            <Button as="span" variant="neon" accent="cyan" size="sm" className="pdx-glass-rebind">
              Browse events
            </Button>
          </Link>
        </>
      ),
    };
  } else if (weekEventCount === 0) {
    emptyBanner = {
      copy: view === "mine" ? "Nothing of yours this week." : "Quiet week on the grid.",
      actions: (
        <>
          {!isThisWeek && (
            <Button type="button" variant="solid" accent="cyan" size="sm" className="pdx-glass-rebind" onClick={goThisWeek}>
              This week
            </Button>
          )}
          <Button type="button" variant="neon" accent="cyan" size="sm" className="pdx-glass-rebind" onClick={() => shiftWeek(1)}>
            Next week
          </Button>
          <Link href="/events">
            <Button as="span" variant="neon" accent="cyan" size="sm" className="pdx-glass-rebind">
              Browse events
            </Button>
          </Link>
        </>
      ),
    };
  }

  /* ---- selected popover ------------------------------------------- */

  const selected = useMemo(() => {
    if (selKey == null) return null;
    const e = scheduleEvents.find((x) => x.scheduleKey === selKey);
    if (!e) return null;
    const isBeach = isBeachScheduleEvent(e);
    const listing = isBeach
      ? undefined
      : listings.find(l => (l.listingInstanceKey ?? String(l.id)) === selKey);
    const d = DAYS.find((x) => x.key === e.day)!;
    const dc = calm ? '#7d7d82' : d.color;
    const dt = calm ? '#c8c8cc' : d.text;
    const adm = ADM[e.adm];
    const rsvp = isBeach || myEventIds.has(e.id);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const POP_W = Math.min(344, vw - 20);
    let popStyle: React.CSSProperties;
    if (embed) {
      // Home embed: the anchor math above assumes the block's on-screen
      // rect is stable, but ScrollReveal's reveal transform (and the
      // embed's own horizontal scroll container) can put the click point
      // anywhere - including off the edge of a narrow viewport. Skip the
      // anchor math entirely and center the popover in a fixed overlay,
      // same idiom as AuthModal / MissedConnectionsPanel.
      const maxH = Math.min(vh - 40, 640);
      popStyle = S({
        position: 'relative',
        width: POP_W + 'px',
        maxHeight: maxH + 'px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 120,
        background: 'var(--ink-800)',
        border: '2px solid ' + hexA(dc, 0.6),
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow:
          '0 24px 60px -12px rgba(0,0,0,.8)' + (calm ? '' : ', 0 0 30px -6px ' + hexA(dc, 0.5)),
      });
    } else {
      const r = selRect || ({} as Partial<SelRect>);
      let left = (r.right != null ? r.right : vw / 2) + 12;
      if (left + POP_W > vw - 10) left = (r.left != null ? r.left : vw / 2) - POP_W - 12;
      if (left < 10) left = Math.max(10, (vw - POP_W) / 2);
      let top = r.top != null ? r.top : vh / 2 - 180;
      top = Math.max(64, Math.min(top, vh - 420));
      // Cap the panel to the viewport - long event descriptions scroll inside
      // the popover instead of growing it into a several-thousand-pixel-tall
      // fixed layer (which iOS Safari can't composite: the panel background
      // drops out and raw text bleeds over the page underneath).
      const maxH = Math.max(320, vh - top - 14);
      popStyle = S({
        position: 'fixed',
        top: top + 'px',
        left: left + 'px',
        width: POP_W + 'px',
        maxHeight: maxH + 'px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 120,
        background: 'var(--ink-800)',
        border: '2px solid ' + hexA(dc, 0.6),
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow:
          '0 24px 60px -12px rgba(0,0,0,.8)' + (calm ? '' : ', 0 0 30px -6px ' + hexA(dc, 0.5)),
      });
    }
    const badge = (bg: string): React.CSSProperties =>
      S({
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: 'var(--text-inverse)',
        background: bg,
        padding: '4px 8px 3px',
        borderRadius: '3px',
      });
    const beachTags = isBeach
      ? [
          {
            label: "River Brats",
            style: S({
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: ".05em",
              textTransform: "uppercase",
              color: dt,
              border: "1px solid " + hexA(dc, 0.5),
              padding: "3px 8px 2px",
              borderRadius: "3px",
            }) as React.CSSProperties,
          },
          {
            label: "Beach day",
            style: S({
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: ".05em",
              textTransform: "uppercase",
              color: "rgba(230,227,218,.65)",
              border: "1px solid var(--ink-border-strong)",
              padding: "3px 8px 2px",
              borderRadius: "3px",
            }) as React.CSSProperties,
          },
        ]
      : null;

    return {
      id: e.id,
      isBeach,
      eventHref: isBeach
        ? e.href || "/z/out/rooster-rock"
        : eventPath(
            e.id,
            listing?.title ?? e.title,
            listing?.dayOfWeek ?? e.day,
          ),
      title: e.title,
      venue: e.venue,
      hood: e.hood,
      blurb: e.blurb,
      going: e.going,
      dt,
      dayShort: d.short,
      dayDate: d.date,
      admLabel: isBeach ? "Free" : adm.label,
      timeRange: fmtClock(e.s) + " – " + fmtClock(e.e),
      popStyle,
      posterStyle: S({
        position: "relative",
        flex: "none",
        height: "128px",
        backgroundColor: "var(--ink-800)",
        backgroundImage: "url(" + e.posterUrl + ")",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }),
      dayBadgeStyle: badge(dc),
      admBadgeStyle: badge(isBeach ? "#FF8C00" : adm.color),
      tags: beachTags
        ? beachTags
        : e.types
            .map((t) => ({
              label: TYPE_LABEL[t] || t,
              style: S({
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "11px",
                letterSpacing: ".05em",
                textTransform: "uppercase",
                color: dt,
                border: "1px solid " + hexA(dc, 0.5),
                padding: "3px 8px 2px",
                borderRadius: "3px",
              }) as React.CSSProperties,
            }))
            .concat([
              {
                label: e.age,
                style: S({
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  color: "rgba(230,227,218,.65)",
                  border: "1px solid var(--ink-border-strong)",
                  padding: "3px 8px 2px",
                  borderRadius: "3px",
                }),
              },
            ]),
      rsvp,
      rsvpLabel: isBeach
        ? "Remove beach day"
        : rsvp
          ? "You’re going ✓"
          : "I’ll be there",
      rsvpBtnStyle: S({
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        fontSize: "14px",
        letterSpacing: ".04em",
        textTransform: "uppercase",
        cursor: "pointer",
        padding: "11px 18px",
        borderRadius: "8px",
        border: "2px solid " + (isBeach ? "var(--neon-magenta)" : rsvp ? dc : "var(--neon-yellow)"),
        color: "var(--text-inverse)",
        background: isBeach ? "transparent" : rsvp ? dc : "var(--neon-yellow)",
        boxShadow: calm
          ? "none"
          : isBeach
            ? "none"
            : rsvp
              ? "0 0 16px -4px " + hexA(dc, 0.8)
              : "4px 4px 0 rgba(255,0,204,.3)",
      }),
      dc,
      detailLinkLabel: isBeach ? "Beach page →" : "Event page →",
      goingLabel: isBeach ? "On your list" : null as string | null,
    };
  }, [selKey, selRect, calm, myEventIds, scheduleEvents, listings, embed]);

  const scrollStyle = S({
    overflow: 'auto',
    maxHeight: embed
      ? TOTAL_H + HEADER_H + 4 + 'px'
      : 'min(80vh, ' + (TOTAL_H + HEADER_H + 4) + 'px)',
    border: embed ? '1px solid var(--ink-border)' : '2px solid var(--ink-border)',
    borderRadius: embed ? '6px' : '8px',
    background: 'var(--ink-900)',
    position: 'relative',
  });

  /* ---- Detail popover panel (shared markup, positioning branches on
     `embed` via `selected.popStyle` computed above) ------------------ */
  const popPanel = selected && (
    <div
      className="sch-pop"
      style={selected.popStyle}
      onClick={embed ? (ev) => ev.stopPropagation() : undefined}
    >
      <div style={selected.posterStyle}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg,rgba(11,11,14,.15),rgba(11,11,14,.9))',
          }}
        />
        <div style={{ position: 'absolute', left: '16px', right: '52px', bottom: '12px' }}>
          <div style={{ display: 'flex', gap: '7px', marginBottom: '7px' }}>
            <span style={selected.dayBadgeStyle}>
              {selected.dayShort} · {selected.dayDate}
            </span>
            <span style={selected.admBadgeStyle}>{selected.admLabel}</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 1,
              color: 'var(--text-hi)',
              fontSize: '26px',
              textShadow: '0 2px 10px rgba(0,0,0,.6)',
            }}
          >
            {selected.title}
          </div>
        </div>
        <button
          onClick={closeEvent}
          style={{
            position: 'absolute',
            top: '11px',
            right: '11px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,.55)',
            color: 'var(--text-hi)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '15px 17px 17px', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '15px',
            letterSpacing: '.03em',
            textTransform: 'uppercase',
            color: selected.dt,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 14" />
          </svg>
          {selected.timeRange}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            color: 'var(--text-mid)',
            fontSize: '14px',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(230,227,218,.55)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flex: 'none' }}
          >
            <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            <span style={{ color: 'var(--text-hi)', fontWeight: 600 }}>{selected.venue}</span> · {selected.hood}
          </span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '13.5px', lineHeight: 1.55, color: 'var(--text-mid)' }}>
          {selected.blurb}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '13px' }}>
          {selected.tags.map((tg, i) => (
            <span key={i} style={tg.style}>
              {tg.label}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={(e) => {
              if (!selected.isBeach && !selected.rsvp) spawnRsvpSparks(e.currentTarget);
              toggleRsvp(selected.id);
            }}
            style={{ ...selected.rsvpBtnStyle, position: "relative", overflow: "visible" }}
            disabled={selected.isBeach && withdrawBeachMutation.isPending}
          >
            {selected.isBeach && withdrawBeachMutation.isPending
              ? "Removing…"
              : selected.rsvpLabel}
          </button>
          <span style={{ fontSize: '12.5px', color: 'var(--text-meta)', fontFamily: 'var(--font-body)' }}>
            {selected.goingLabel ? (
              <span style={{ color: selected.dt, fontWeight: 700 }}>{selected.goingLabel}</span>
            ) : (
              <>
                <span style={{ color: selected.dt, fontWeight: 700 }}>{selected.going}</span> going
              </>
            )}
          </span>
          <div style={{ flex: 1 }} />
          <Link
            href={selected.eventHref}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '12.5px',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'var(--text-lo)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {selected.detailLinkLabel}
          </Link>
        </div>
      </div>
    </div>
  );

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  return (
    <div
      className={[
        'sch-root',
        embed ? 'sch-root--embed' : 'zine-page schedule-page board-page board-page--makeover',
        calm ? 'calm' : '',
      ].filter(Boolean).join(' ')}
      style={{
        minHeight: embed ? undefined : '100vh',
        background: embed ? 'transparent' : undefined,
        color: 'var(--text-mid)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {!embed && (
      <>
      <ScheduleHero stats={heroStats} />

      {/* ---- Sticky toolbar ---- */}
      <ScrollReveal delay={30}>
      <div className="schedule-toolbar">
        <div className="schedule-toolbar__inner">
          <div className="schedule-toolbar__row">
            <Link href="/events" className="schedule-toolbar__back">
              <Button as="span" variant="neon" accent="cyan" size="sm">
                ← Back to events
              </Button>
            </Link>
            <div className="schedule-seg" role="group" aria-label="Schedule view">
              <button
                type="button"
                className={`schedule-seg__btn${view === 'mine' ? ' is-active' : ''}`}
                onClick={() => setView('mine')}
              >
                My Schedule
              </button>
              <button
                type="button"
                className={`schedule-seg__btn${view === 'all' ? ' is-active' : ''}`}
                onClick={() => setView('all')}
              >
                All Events
              </button>
            </div>
            <span className={`schedule-count-pill${view === 'mine' ? ' schedule-count-pill--mine' : ''}`}>
              {countPillLabel}
            </span>
            <div className="schedule-toolbar__spacer" />
            <Button
              type="button"
              variant="solid"
              accent="pink"
              size="md"
              className="schedule-toolbar__export sch-export"
              onClick={exportStories}
              disabled={exporting}
            >
              <Download size={16} aria-hidden />
              {exporting ? "Exporting…" : "Export to Stories"}
            </Button>
          </div>
          <div className="schedule-toolbar__filters">
            <span className="schedule-toolbar__filter-label">Filter</span>
            {chips.map((c) => (
              <button key={c.key} type="button" className="sch-chip" onClick={c.toggle} style={c.style}>
                {c.label}
                <span style={c.countStyle}>{c.count}</span>
              </button>
            ))}
            {anyFilter && (
              <button type="button" className="sch-chip events-clear-filters" onClick={clearFilters}>
                Clear ×
              </button>
            )}
          </div>
        </div>
      </div>
      </ScrollReveal>
      </>
      )}

      {/* ---- Empty banner ---- */}
      {!embed && emptyBanner && (
        <div className="schedule-empty-banner">
          <div className="schedule-empty-banner__inner board-empty board-empty--prototype" style={{ marginTop: 0 }}>
            <p className="board-copy-sm">{emptyBanner.copy}</p>
            <div className="board-empty__actions">{emptyBanner.actions}</div>
          </div>
        </div>
      )}

      {/* ---- Week navigator ---- */}
      {!embed && (
        <div className="sch-weeknav" role="navigation" aria-label="Schedule week">
          <div className="sch-weeknav__period">
            <button type="button" className="sch-weeknav__arrow" onClick={() => shiftWeek(-1)} aria-label="Previous week">‹</button>
            <div className="sch-weeknav__label">
              <span className="sch-weeknav__range">{weekRangeLabel(activeWeekStart)}</span>
            </div>
            <button type="button" className="sch-weeknav__arrow" onClick={() => shiftWeek(1)} aria-label="Next week">›</button>
            <button
              type="button"
              className={`sch-weeknav__today${isThisWeek ? " is-current" : ""}`}
              onClick={goThisWeek}
              aria-current={isThisWeek ? "date" : undefined}
            >
              This week
            </button>
          </div>
          <div className="sch-weeknav__days" role="group" aria-label="Days this week">
            {weekColumns.map((col, i) => {
              const count = days[i]?.blocks.length ?? 0;
              const isToday = col.ymd === todayYmd;
              const dc = calm ? "#7d7d82" : col.color;
              const dt = calm ? "#c8c8cc" : col.text;
              return (
                <button
                  key={col.ymd}
                  type="button"
                  className={`sch-weeknav__day${count ? " has-events" : ""}${isToday ? " is-today" : ""}`}
                  style={{
                    color: dt,
                    borderColor: count || isToday ? dc : "#2a2a32",
                    background: count ? hexA(dc, 0.22) : "transparent",
                  }}
                  onClick={() => scrollDayIntoView(i)}
                  aria-label={`${col.short} ${col.date}${isToday ? ", today" : ""}${count ? `, ${count} event${count === 1 ? "" : "s"}` : ", no events"}`}
                  aria-current={isToday ? "date" : undefined}
                >
                  <span className="sch-weeknav__dow">{col.short.slice(0, 1)}</span>
                  <span className="sch-weeknav__dom">{ymdDayNum(col.ymd)}</span>
                  <span className="sch-weeknav__mark" aria-hidden>
                    {count > 0 ? (
                      <span className="sch-weeknav__count">{count}</span>
                    ) : (
                      <span className="sch-weeknav__idle" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Grid ---- */}
      {(() => {
        const grid = (
          <div className={embed ? undefined : 'schedule-grid-shell'} style={embed ? { maxWidth: '100%', margin: '0 auto', padding: '0' } : undefined}>
            <div className="sch-scroll" ref={scrollElRef} style={scrollStyle}>
              <div style={{ display: 'flex', width: 'max-content', minWidth: '100%' }}>
                {/* time axis */}
                <div
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 6,
                    flex: 'none',
                    width: AXIS_W + 'px',
                    background: 'var(--ink-900)',
                  }}
                >
                  <div
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 7,
                      height: HEADER_H + 'px',
                      background: 'var(--ink-900)',
                      borderBottom: '1px solid #202020',
                    }}
                  />
                  <div style={{ position: 'relative', height: TOTAL_H + 'px', backgroundImage: hourBg }}>
                    {timeLabels.map((t) => (
                      <div key={t.key} style={t.style}>
                        {t.label}
                      </div>
                    ))}
                    {nowShown && <div style={nowAxisStyle}>NOW</div>}
                  </div>
                </div>
                {/* day columns */}
                {days.map((day) => (
                  <div
                    key={day.key}
                    style={{ flex: 'none', width: day.width + 'px', borderLeft: '1px solid rgba(255,255,255,.05)' }}
                  >
                    <div style={day.headStyle}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={day.nameStyle}>{day.short}</span>
                        <span style={day.dateStyle}>{day.date}</span>
                      </div>
                      <div style={day.countStyle}>{day.countLabel}</div>
                    </div>
                    <div style={{ position: 'relative', height: TOTAL_H + 'px', backgroundImage: hourBg }}>
                      {nowShown && <div style={nowLineStyle} />}
                      {day.blocks.map((b) => (
                        <div key={b.id} className="sch-block" onClick={b.onClick} style={b.style}>
                          <div style={b.overlayStyle} aria-hidden />
                          {b.showQuick && (
                            <button onClick={b.onQuick} style={b.quickStyle}>
                              {b.quickIcon}
                            </button>
                          )}
                          <div style={b.contentStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {b.live && <span className="sch-livedot" style={b.liveDotStyle} />}
                              <span style={b.timeStyle}>{b.time}</span>
                              {b.showCheck && <span style={b.checkStyle}>✓</span>}
                            </div>
                            <div style={b.titleStyle}>{b.title}</div>
                            {b.showVenue && <div style={b.venueStyle}>{b.venue}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        return embed ? grid : <ScrollReveal delay={50}>{grid}</ScrollReveal>;
      })()}

      {/* ---- Detail popover ----
          Home embed: fixed-overlay flex-center wrapper (same idiom as
          AuthModal / MissedConnectionsPanel) - the panel is centered
          and click-outside-to-close happens on the overlay itself.
          Full /schedule page: unchanged anchored positioning, overlay is
          just a click-catching backdrop behind the absolutely-positioned
          panel. */}
      {selected && (
        embed ? (
          <div
            onClick={closeEvent}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              background: 'rgba(4,4,6,.55)',
              backdropFilter: 'blur(1.5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            {popPanel}
          </div>
        ) : (
          <>
            <div
              onClick={closeEvent}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 110,
                background: 'rgba(4,4,6,.55)',
                backdropFilter: 'blur(1.5px)',
              }}
            />
            {popPanel}
          </>
        )
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {!embed && (
        <BoardCloseSeam
          line="Build your week. Take care of each other."
          url="zaylist.com/schedule"
        />
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div className="sch-toast">
          {toast}
        </div>
      )}
    </div>
  );
}
