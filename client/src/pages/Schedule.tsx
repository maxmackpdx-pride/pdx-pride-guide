/* ============================================================
   PDX Pride Guide — Schedule
   Festival-timeline redesign of /schedule. The whole week side by
   side; packed days widen and scroll horizontally instead of
   squishing text; the day-color system carries the meaning.

   Ported from the Claude Design handoff (Schedule.dc.html) into an
   idiomatic React + TS component. Behavior and pixels match the
   prototype 1:1. Depends on the DS tokens (fonts, colors, effects)
   being loaded globally via client/src/index.css.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  posterBg,
  type AdmKey,
  type EventType,
  type LaneInfo,
} from "@shared/prideWeek";
import type { EventListing } from "@shared/multiDayEvents";
import { eventPath } from "@shared/eventSlug";
import {
  DEFAULT_ATTENDANCE_PHRASE_KEY,
  attendancePhraseLabel,
} from "@shared/attendancePhrases";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { buildScheduleEvents, type ScheduleEvent } from "@/lib/scheduleEvents";
import AuthModal from "@/components/AuthModal";
import heroUrl from "@/assets/hero-collage.png";
import "./Schedule.css";

/** Poster treatment — how event blocks render their day poster. */
export type PosterStyle = 'Color blocks' | 'Poster chip' | 'Poster peek';
/** Row density — vertical scale of the grid. */
export type Density = 'Comfortable' | 'Compact';

export interface ScheduleProps {
  /** default "Color blocks" (cleanest, most legible) */
  posterStyle?: PosterStyle;
  /** default "Comfortable" */
  density?: Density;
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

/** minutes-past-midnight "now", pushed past 24h for the small-hours tail */
function nowMinutes(): number {
  const d = new Date();
  let t = d.getHours() * 60 + d.getMinutes();
  if (d.getHours() < 4) t += 1440;
  return t;
}

export default function Schedule({
  posterStyle = 'Color blocks',
  density = 'Comfortable',
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

  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePageSeo(
    "Schedule — Portland Pride 2026 | PDX Pride Guide",
    "Your full Pride Week schedule, July 13–19, side by side.",
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

  const myEventIds = useMemo(
    () => new Set(myCheckIns.map(c => c.eventId)),
    [myCheckIns],
  );

  const scheduleEvents = useMemo(
    () => buildScheduleEvents(listings, attendanceSummaries),
    [listings, attendanceSummaries],
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

  useEffect(() => {
    if (viewBootstrapped || !user) return;
    if (myEventIds.size > 0) {
      setViewState('mine');
      setViewBootstrapped(true);
    }
  }, [user, myEventIds.size, viewBootstrapped]);

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

  // open on the evening + weekend once mounted (the packed part of the grid)
  useEffect(() => {
    const id = setTimeout(() => {
      const el = scrollElRef.current;
      if (!el) return;
      const compact = density === 'Compact';
      const HH = compact ? 58 : 74;
      const BASE = compact ? 230 : 290;
      el.scrollTop = Math.max(0, (13 - 11) * HH - 8);
      el.scrollLeft = Math.round(3.15 * BASE);
    }, 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (myEventIds.has(eventId)) {
      unrsvpMutation.mutate(eventId);
      return;
    }
    rsvpMutation.mutate(eventId);
  }, [user, myEventIds, rsvpMutation, unrsvpMutation]);

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
    const mine = scheduleEvents.filter((e) => myEventIds.has(e.id));
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
        x.fillText('+ ' + (list.length - rows.length) + ' MORE ON PRIDEGUIDEPDX.COM', 104, y + 6);
      }
      x.fillStyle = '#fff';
      x.font = '900 40px "Barlow Condensed", sans-serif';
      x.fillText('PDX PRIDE GUIDE', 74, H - 96);
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
      flashToast('Export hit a snag — try again');
    } finally {
      setExporting(false);
    }
  }, [exporting, scheduleEvents, myEventIds, flashToast]);

  /* ---- derived layout constants ----------------------------------- */

  const mode = ({ 'Color blocks': 'none', 'Poster chip': 'chip', 'Poster peek': 'peek' } as const)[
    posterStyle
  ];
  const compact = density === 'Compact';
  const HOUR_H = compact ? 58 : 74;
  const MIN_LANE = compact ? 124 : 152;
  const BASE_DAY = compact ? 230 : 290;
  const MIN_H = compact ? 36 : 44;
  const START = 11;
  const END = 27;
  const HEADER_H = 56;
  const AXIS_W = 62;
  const TOTAL_H = (END - START) * HOUR_H;
  const hourBg =
    'repeating-linear-gradient(to bottom, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, transparent 1px, transparent ' +
    HOUR_H +
    'px)';

  const inView = useCallback(
    (e: ScheduleEvent) => view === 'all' || myEventIds.has(e.id),
    [view, myEventIds],
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
          right: '8px',
          top: (i - START) * HOUR_H + 4 + 'px',
          fontFamily: 'var(--font-body)',
          fontSize: '10.5px',
          fontWeight: 600,
          color: 'rgba(230,227,218,.4)',
          whiteSpace: 'nowrap',
          letterSpacing: '.03em',
        }),
      });
    }
    return arr;
  }, [HOUR_H]);

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
    chip: boolean;
    showPeek: boolean;
    live: boolean;
    quickIcon: string;
    chipInitial: string;
    timeStyle: React.CSSProperties;
    titleStyle: React.CSSProperties;
    venueStyle: React.CSSProperties;
    chipStyle: React.CSSProperties;
    liveDotStyle: React.CSSProperties;
    checkStyle: React.CSSProperties;
    quickStyle: React.CSSProperties;
    peekStyle: React.CSSProperties;
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
    return DAYS.map((d) => {
      const dc = calm ? '#7d7d82' : d.color;
      const dt = calm ? '#c8c8cc' : d.text;
      const list = scheduleEvents.filter((e) => e.day === d.key && pass(e));
      const { res, maxCols } = layoutDay(list);
      const dayW = Math.max(BASE_DAY, maxCols * MIN_LANE);
      const blocks: BlockVM[] = list.map((e) => {
        const L: LaneInfo = res[e.id] || { col: 0, totalCols: 1 };
        const laneW = dayW / L.totalCols;
        const left = L.col * laneW + 3;
        const width = laneW - 6;
        const top = ((e.s - START * 60) / 60) * HOUR_H;
        const height = Math.max(((e.e - e.s) / 60) * HOUR_H, MIN_H);
        const rsvp = myEventIds.has(e.id);
        const live = now != null && e.s <= now && now < e.e;
        const twoLine = height >= 54;
        const showVenue = height >= 74 && width >= 116;
        const showQuick = height >= 56 && width >= 100;
        const showPeek = mode === 'peek' && height >= 96;
        const chip = mode === 'chip' && width >= 88;
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
          background:
            'linear-gradient(180deg,' +
            hexA(dc, rsvp ? 0.32 : 0.14) +
            ',' +
            hexA(dc, rsvp ? 0.14 : 0.05) +
            '), #0b0b0e',
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
          time: height >= 54 ? fmtClock(e.s) + ' – ' + fmtClock(e.e) : fmtClock(e.s),
          title: e.title,
          venue: e.venue,
          showVenue,
          showQuick,
          showCheck: rsvp && !showQuick,
          chip,
          showPeek,
          live,
          quickIcon: rsvp ? '♥' : '♡',
          chipInitial: e.title.charAt(0),
          timeStyle: S({
            fontFamily: 'var(--font-body)',
            fontSize: (compact ? 10 : 11) + 'px',
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
            color: '#fff',
            fontSize: (compact ? 12.5 : 14.5) + 'px',
            letterSpacing: '.01em',
            display: '-webkit-box',
            WebkitLineClamp: twoLine ? 2 : 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            marginTop: '1px',
          }),
          venueStyle: S({
            fontFamily: 'var(--font-body)',
            fontSize: (compact ? 10 : 11) + 'px',
            color: 'rgba(230,227,218,.6)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '3px',
          }),
          chipStyle: S({
            width: (compact ? 18 : 22) + 'px',
            height: (compact ? 18 : 22) + 'px',
            borderRadius: '4px',
            flex: 'none',
            background: posterBg(dc),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: (compact ? 10 : 12) + 'px',
            color: '#fff',
            border: '1px solid ' + hexA(dc, 0.5),
          }),
          liveDotStyle: S({
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            flex: 'none',
            background: '#FF00CC',
            boxShadow: calm ? 'none' : '0 0 7px #FF00CC',
          }),
          checkStyle: S({
            marginLeft: 'auto',
            fontSize: '10px',
            color: '#000',
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
            color: rsvp ? '#000' : dc,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            lineHeight: 1,
            padding: 0,
          }),
          peekStyle: S({
            position: 'absolute',
            inset: 0,
            background: posterBg(dc),
            opacity: 0.42,
          }),
          contentStyle: S({
            position: 'relative',
            zIndex: 2,
            padding: compact ? '4px 7px' : '6px 9px',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            background: showPeek
              ? 'linear-gradient(180deg,rgba(11,11,14,.1),rgba(11,11,14,.86))'
              : 'transparent',
          }),
        };
      });
      const headStyle = S({
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: '#0a0a0a',
        padding: '9px 10px 9px',
        borderBottom: '3px solid ' + dc,
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
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
          fontSize: '17px',
          letterSpacing: '.04em',
          color: dt,
          lineHeight: 1,
          textTransform: 'uppercase',
        }),
        dateStyle: S({
          fontFamily: 'var(--font-body)',
          fontSize: '10.5px',
          fontWeight: 600,
          color: 'rgba(230,227,218,.48)',
          letterSpacing: '.02em',
        }),
        countStyle: S({
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '10.5px',
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
    mode,
    scheduleEvents,
    myEventIds,
    now,
    view,
    openEvent,
    toggleRsvp,
  ]);

  /* ---- now line --------------------------------------------------- */

  const nowShown = now != null && now >= START * 60 && now <= END * 60;
  const nowTop = nowShown ? ((now - START * 60) / 60) * HOUR_H : 0;
  const nowLineStyle = S({
    position: 'absolute',
    left: 0,
    right: 0,
    top: nowTop + 'px',
    height: '2px',
    background: '#FF00CC',
    boxShadow: calm ? 'none' : '0 0 8px #FF00CC',
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
    color: '#FF00CC',
    background: '#0a0a0a',
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
      border: '2px solid ' + (active ? accent : '#333'),
      color: active ? accent : '#c9c9c9',
      background: 'transparent',
      boxShadow: active && !calm ? '0 0 13px -4px ' + accent : 'none',
    });
  const countStyleOf = (active: boolean, accent: string): React.CSSProperties =>
    S({
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: '10.5px',
      color: active ? accent : '#666',
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
    ['FREE', 'Free', '#CCFF00'],
    ['TICKETED', 'Ticketed', '#00FFFF'],
    ['SUGGESTED_DONATION', 'Donation', '#FFB23D'],
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
    const accent = calm ? '#c8c8cc' : '#CCFF00';
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
    const accent = calm ? '#c8c8cc' : '#00FFFF';
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
  const myCount = myEventIds.size;
  const segBtn = (active: boolean): React.CSSProperties =>
    S({
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: '13.5px',
      letterSpacing: '.03em',
      textTransform: 'uppercase',
      color: active ? '#000' : '#8a8a8a',
      background: active ? '#CCFF00' : 'transparent',
      border: 'none',
      padding: '11px 17px',
      cursor: 'pointer',
    });
  const countPillStyle = S({
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '.07em',
    textTransform: 'uppercase',
    color: '#0a0a0a',
    background: view === 'mine' ? '#39FF14' : '#00FFFF',
    padding: '6px 11px',
    borderRadius: '999px',
  });
  const countPillLabel =
    view === 'mine' ? myCount + ' in my schedule' : totalVisible + ' events';

  /* ---- empty banner ----------------------------------------------- */

  let emptyBanner: string | false = false;
  if (view === 'mine' && !user)
    emptyBanner =
      'Sign in and tap “I’ll be there” on events to build your schedule.';
  else if (view === 'mine' && myCount === 0)
    emptyBanner =
      'Your schedule is empty. Switch to All Events and tap the heart on anything you want to catch.';
  else if (totalVisible === 0) emptyBanner = 'No events match those filters. Try clearing one.';

  /* ---- selected popover ------------------------------------------- */

  const selected = useMemo(() => {
    if (selKey == null) return null;
    const e = scheduleEvents.find((x) => x.scheduleKey === selKey);
    if (!e) return null;
    const listing = listings.find(
      l => (l.listingInstanceKey ?? String(l.id)) === selKey,
    );
    const d = DAYS.find((x) => x.key === e.day)!;
    const dc = calm ? '#7d7d82' : d.color;
    const dt = calm ? '#c8c8cc' : d.text;
    const adm = ADM[e.adm];
    const rsvp = myEventIds.has(e.id);
    const POP_W = 344;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const r = selRect || ({} as Partial<SelRect>);
    let left = (r.right != null ? r.right : vw / 2) + 12;
    if (left + POP_W > vw - 10) left = (r.left != null ? r.left : vw / 2) - POP_W - 12;
    if (left < 10) left = Math.max(10, (vw - POP_W) / 2);
    let top = r.top != null ? r.top : vh / 2 - 180;
    top = Math.max(64, Math.min(top, vh - 420));
    const badge = (bg: string): React.CSSProperties =>
      S({
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: '#000',
        background: bg,
        padding: '4px 8px 3px',
        borderRadius: '3px',
      });
    return {
      id: e.id,
      eventHref: eventPath(
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
      admLabel: adm.label,
      timeRange: fmtClock(e.s) + ' – ' + fmtClock(e.e),
      popStyle: S({
        position: 'fixed',
        top: top + 'px',
        left: left + 'px',
        width: POP_W + 'px',
        zIndex: 120,
        background: '#0b0b0e',
        border: '2px solid ' + hexA(dc, 0.6),
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow:
          '0 24px 60px -12px rgba(0,0,0,.8)' + (calm ? '' : ', 0 0 30px -6px ' + hexA(dc, 0.5)),
      }),
      posterStyle: S({ position: 'relative', height: '128px', background: posterBg(dc) }),
      dayBadgeStyle: badge(dc),
      admBadgeStyle: badge(adm.color),
      tags: e.types
        .map((t) => ({
          label: TYPE_LABEL[t] || t,
          style: S({
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            color: dt,
            border: '1px solid ' + hexA(dc, 0.5),
            padding: '3px 8px 2px',
            borderRadius: '3px',
          }) as React.CSSProperties,
        }))
        .concat([
          {
            label: e.age,
            style: S({
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              color: 'rgba(230,227,218,.65)',
              border: '1px solid #333',
              padding: '3px 8px 2px',
              borderRadius: '3px',
            }),
          },
        ]),
      rsvp,
      rsvpLabel: rsvp ? 'You’re going ✓' : 'I’ll be there',
      rsvpBtnStyle: S({
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '14px',
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        padding: '11px 18px',
        borderRadius: '8px',
        border: '2px solid ' + (rsvp ? dc : '#CCFF00'),
        color: '#000',
        background: rsvp ? dc : '#CCFF00',
        boxShadow: calm
          ? 'none'
          : rsvp
            ? '0 0 16px -4px ' + hexA(dc, 0.8)
            : '4px 4px 0 rgba(255,0,204,.3)',
      }),
      dc,
    };
  }, [selKey, selRect, calm, myEventIds, scheduleEvents, listings]);

  const scrollStyle = S({
    overflow: 'auto',
    maxHeight: 'min(80vh, ' + (TOTAL_H + HEADER_H + 4) + 'px)',
    border: '2px solid #2b2b2b',
    borderRadius: '8px',
    background: '#0a0a0a',
    position: 'relative',
  });

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  return (
    <div
      className={calm ? 'sch-root calm' : 'sch-root'}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: 'var(--text-mid)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* ---- Hero ---- */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${heroUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: '72% 40%',
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg,#0a0a0a 25%,rgba(10,10,10,.5) 60%,rgba(10,10,10,.82))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(150% 130% at -5% 115%,rgba(10,10,10,.92),transparent 55%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '32px clamp(16px,4vw,40px) 28px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: '#00FFFF',
              marginBottom: '14px',
            }}
          >
            PDX Pride Guide <span style={{ color: 'rgba(255,255,255,.32)', margin: '0 4px' }}>/</span> Events
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '.17em',
              textTransform: 'uppercase',
              color: 'rgba(230,227,218,.72)',
              marginBottom: '4px',
            }}
          >
            Portland Pride Week 2026 · July 13 to 19
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(3rem,7vw,5rem)',
              lineHeight: 0.9,
              letterSpacing: '.01em',
              textTransform: 'uppercase',
              color: '#00FFFF',
              margin: 0,
              textShadow: '0 0 34px rgba(0,255,255,.32)',
            }}
          >
            Schedule
          </h1>
          <p
            style={{
              maxWidth: '46ch',
              margin: '13px 0 0',
              color: 'var(--text-mid)',
              fontSize: '16px',
              lineHeight: 1.5,
            }}
          >
            The whole week, side by side. Flip to just your RSVPs, filter by vibe, and build your nights. Pride is a
            protest. Take care of each other.
          </p>
        </div>
        <div style={{ height: '3px', background: 'var(--grad-flag)', position: 'relative', zIndex: 1 }} />
      </section>

      {/* ---- Sticky toolbar ---- */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 55,
          background: 'rgba(9,9,11,.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1f1f1f',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px clamp(16px,4vw,40px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                border: '2px solid rgba(255,255,255,.16)',
                borderRadius: '10px',
                overflow: 'hidden',
                flex: 'none',
              }}
            >
              <button onClick={() => setView('mine')} style={segBtn(view === 'mine')}>
                My Schedule
              </button>
              <button onClick={() => setView('all')} style={segBtn(view === 'all')}>
                All Events
              </button>
            </div>
            <span style={countPillStyle}>{countPillLabel}</span>
            <div style={{ flex: 1, minWidth: '12px' }} />
            <button
              className="sch-export"
              onClick={exportStories}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '13.5px',
                letterSpacing: '.05em',
                textTransform: 'uppercase',
                color: '#000',
                background: '#FF00CC',
                border: 'none',
                borderRadius: '11px',
                padding: '11px 19px',
                cursor: 'pointer',
                flex: 'none',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{exporting ? 'Exporting…' : 'Export to Instagram Stories'}</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '11px' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '.13em',
                color: '#6a6a6a',
                textTransform: 'uppercase',
                marginRight: '3px',
                flex: 'none',
              }}
            >
              Filter
            </span>
            {chips.map((c) => (
              <button key={c.key} className="sch-chip" onClick={c.toggle} style={c.style}>
                {c.label}
                <span style={c.countStyle}>{c.count}</span>
              </button>
            ))}
            {anyFilter && (
              <button
                className="sch-chip"
                onClick={clearFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 11px 5px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: '2px solid ' + hexA('#FF00CC', 0.6),
                  color: '#FF3AD6',
                  background: 'transparent',
                }}
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- Empty banner ---- */}
      {emptyBanner && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
          <div
            style={{
              marginTop: '18px',
              border: '1px dashed rgba(255,255,255,.2)',
              borderRadius: '10px',
              padding: '16px 20px',
              color: 'var(--text-meta)',
              fontSize: '14px',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
            }}
          >
            {emptyBanner}
          </div>
        </div>
      )}

      {/* ---- Grid ---- */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '18px clamp(16px,4vw,40px) 40px' }}>
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
                background: '#0a0a0a',
              }}
            >
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 7,
                  height: HEADER_H + 'px',
                  background: '#0a0a0a',
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
                      {b.showPeek && <div style={b.peekStyle} />}
                      {b.showQuick && (
                        <button onClick={b.onQuick} style={b.quickStyle}>
                          {b.quickIcon}
                        </button>
                      )}
                      <div style={b.contentStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {b.chip && <div style={b.chipStyle}>{b.chipInitial}</div>}
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

      {/* ---- Footer ---- */}
      <footer style={{ background: '#0a0a0a', marginTop: '8px' }}>
        <div style={{ height: '3px', background: 'var(--grad-flag)' }} />
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '24px clamp(16px,4vw,40px)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                lineHeight: 0.82,
                textTransform: 'uppercase',
                fontSize: '15px',
              }}
            >
              <span style={{ color: '#fff' }}>PDX</span>
              <span
                style={{
                  background: 'var(--grad-rainbow)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                PRIDE
              </span>
              <span style={{ color: '#fff' }}>GUIDE</span>
            </span>
            <span style={{ color: 'var(--text-faint)', fontSize: '12.5px', maxWidth: '34ch', lineHeight: 1.4 }}>
              Independently built directory. No sponsors, no logins, no cover charge.
            </span>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'var(--text-meta)',
            }}
          >
            Pride is a protest. Take care of each other. <span style={{ color: '#FF00CC' }}>✦</span>
          </span>
        </div>
      </footer>

      {/* ---- Detail popover ---- */}
      {selected && (
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
          <div className="sch-pop" style={selected.popStyle}>
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
                    color: '#fff',
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
                  color: '#fff',
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
            <div style={{ padding: '15px 17px 17px' }}>
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
                  <span style={{ color: '#fff', fontWeight: 600 }}>{selected.venue}</span> · {selected.hood}
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
                <button onClick={() => toggleRsvp(selected.id)} style={selected.rsvpBtnStyle}>
                  {selected.rsvpLabel}
                </button>
                <span style={{ fontSize: '12.5px', color: 'var(--text-meta)', fontFamily: 'var(--font-body)' }}>
                  <span style={{ color: selected.dt, fontWeight: 700 }}>{selected.going}</span> going
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
                  Event page →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* ---- Toast ---- */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: '28px',
            transform: 'translateX(-50%)',
            zIndex: 130,
            background: '#111',
            border: '2px solid #39FF14',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            fontSize: '13.5px',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 0 24px -4px rgba(57,255,20,.6)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
