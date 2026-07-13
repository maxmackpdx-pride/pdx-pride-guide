import { RIVER_BRATS_HOURS, formatRiverBratsHour } from "@shared/riverBrats";

type Props = {
  value: number | null;
  onChange: (hour: number) => void;
  accent: "cyan" | "orange" | "green";
  /** Override default 7am–9pm arrival list (e.g. leave-until chips). */
  hours?: number[];
  "aria-label"?: string;
};

export default function RiverBratsHourChips({
  value,
  onChange,
  accent,
  hours = RIVER_BRATS_HOURS,
  "aria-label": ariaLabel = "Arrival time",
}: Props) {
  return (
    <div className={`rb-hour-chips rb-hour-chips--${accent}`} role="group" aria-label={ariaLabel}>
      {hours.map(hour => (
        <button
          key={hour}
          type="button"
          className={`rb-hour-chip cv-chip${value === hour ? " active" : ""}`}
          onClick={() => onChange(hour)}
        >
          {formatRiverBratsHour(hour)}
        </button>
      ))}
    </div>
  );
}
