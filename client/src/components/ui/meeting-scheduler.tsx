import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ds";

type SchedulerDetails = {
  dates: string[];
  arrivalHour: number;
  departHour: number;
  anonymous: boolean;
};

type MeetingSchedulerProps = {
  title?: string;
  description?: string;
  allowedDates: string[];
  selectedDates: string[];
  arrivalHour: number;
  departHour: number;
  anonymous: boolean;
  formatHour: (hour: number) => string;
  onDatesChange: (dates: string[]) => void;
  onArrivalChange: (hour: number) => void;
  onDepartChange: (hour: number) => void;
  onAnonymousChange: (anonymous: boolean) => void;
  onSchedule: (details: SchedulerDetails) => void;
  pending?: boolean;
  accent?: string;
};

const ymd = (date: Date) => format(date, "yyyy-MM-dd");

export function MeetingScheduler({
  title = "Plan your check-in",
  description = "Choose up to a week ahead. A visible check-in opens this destination chat immediately.",
  allowedDates,
  selectedDates,
  arrivalHour,
  departHour,
  anonymous,
  formatHour,
  onDatesChange,
  onArrivalChange,
  onDepartChange,
  onAnonymousChange,
  onSchedule,
  pending = false,
  accent = "orange",
}: MeetingSchedulerProps) {
  const reduceMotion = useReducedMotion();
  const firstAllowed = allowedDates[0] ? new Date(`${allowedDates[0]}T12:00:00`) : new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(firstAllowed));
  const allowed = useMemo(() => new Set(allowedDates), [allowedDates]);
  const selected = useMemo(() => new Set(selectedDates), [selectedDates]);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
  });

  const toggleDate = (date: string) => {
    if (!allowed.has(date)) return;
    const next = selected.has(date)
      ? selectedDates.filter(value => value !== date)
      : [...selectedDates, date].sort();
    onDatesChange(next);
  };

  return (
    <section className="meeting-scheduler pdx-glass-rebind" aria-labelledby="meeting-scheduler-title">
      <header className="meeting-scheduler__header">
        <span className="meeting-scheduler__icon" aria-hidden="true"><Clock size={22} /></span>
        <div>
          <h3 id="meeting-scheduler-title">{title}</h3>
          <p>{description}</p>
        </div>
      </header>

      <div className="meeting-scheduler__body">
        <div className="meeting-scheduler__calendar">
          <div className="meeting-scheduler__monthbar">
            <button type="button" onClick={() => setCurrentMonth(value => subMonths(value, 1))} aria-label="Previous month"><ChevronLeft size={20} /></button>
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong key={format(currentMonth, "MMMM yyyy")} initial={reduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}>
                {format(currentMonth, "MMMM yyyy")}
              </motion.strong>
            </AnimatePresence>
            <button type="button" onClick={() => setCurrentMonth(value => addMonths(value, 1))} aria-label="Next month"><ChevronRight size={20} /></button>
          </div>
          <div className="meeting-scheduler__week" aria-hidden="true">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="meeting-scheduler__days">
            {days.map(day => {
              const value = ymd(day);
              const enabled = allowed.has(value);
              const active = selected.has(value);
              return <motion.button
                type="button"
                key={value}
                disabled={!enabled}
                aria-pressed={active}
                aria-label={`${format(day, "EEEE, MMMM d")}${active ? ", selected" : ""}`}
                onClick={() => toggleDate(value)}
                whileTap={reduceMotion || !enabled ? undefined : { scale: 0.94 }}
                className={cn(!isSameMonth(day, currentMonth) && "is-other-month", active && "is-selected", isSameDay(day, new Date()) && "is-today")}
              >{format(day, "d")}</motion.button>;
            })}
          </div>
        </div>

        <div className="meeting-scheduler__details">
          <div className="meeting-scheduler__time-grid">
            <label><span>Arriving about</span><select value={arrivalHour} onChange={event => onArrivalChange(Number(event.target.value))}>{Array.from({ length: 15 }, (_, index) => index + 7).map(hour => <option key={hour} value={hour}>{formatHour(hour)}</option>)}</select></label>
            <label><span>Leaving about</span><select value={departHour} onChange={event => onDepartChange(Number(event.target.value))}>{Array.from({ length: 15 }, (_, index) => index + 8).filter(hour => hour > arrivalHour).map(hour => <option key={hour} value={hour}>{formatHour(hour)}</option>)}</select></label>
          </div>
          <label className="meeting-scheduler__anonymous"><input type="checkbox" checked={anonymous} onChange={event => onAnonymousChange(event.target.checked)} /><span><strong>Check in anonymously</strong><small>You’ll be counted, but anonymous check-ins do not enter the chat.</small></span></label>
          <div className="meeting-scheduler__summary" aria-live="polite">
            <strong>{selectedDates.length ? `${selectedDates.length} ${selectedDates.length === 1 ? "day" : "days"} selected` : "Choose at least one day"}</strong>
            <span>{anonymous ? "Private count only" : "Chat opens immediately after check-in"}</span>
          </div>
          <Button variant="solid" accent={accent as any} disabled={pending || selectedDates.length === 0} onClick={() => onSchedule({ dates: selectedDates, arrivalHour, departHour, anonymous })}>
            {pending ? "CHECKING IN" : anonymous ? "SAVE PRIVATE CHECK-IN" : "CHECK IN · JOIN CHAT"}
          </Button>
        </div>
      </div>
    </section>
  );
}
