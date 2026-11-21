import { useRef, type CSSProperties, type KeyboardEvent } from "react";
import "./ridez.css";

export type CircleOption<Value extends string = string> = {
  value: Value;
  label: string;
  short: string;
};

/**
 * Shared segmented circle / audience toggle. Ridez uses the three-way
 * Everybody / Friends / Friends of friends preset. Afterz passes an extra
 * option so Everybody splits into open join vs request invite.
 */
export default function CircleToggle<Value extends string>({
  value,
  onChange,
  options,
  label,
  accent,
  testId,
}: {
  value: Value;
  onChange: (value: Value) => void;
  options: readonly CircleOption<Value>[];
  label: string;
  accent?: string;
  testId?: string;
}) {
  "use memo";
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    const to = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : step ? (index + step + options.length) % options.length : -1;
    if (to < 0) return;
    event.preventDefault();
    onChange(options[to].value);
    refs.current[to]?.focus();
  };
  return (
    <div
      className="zrc"
      role="radiogroup"
      aria-label={label}
      data-testid={testId ?? "circle-toggle"}
      data-circle={value}
      style={accent ? { "--zrc-c": accent } as CSSProperties : undefined}
    >
      {options.map((option, index) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            ref={node => { refs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            className={`zrc-opt${on ? " is-on" : ""}`}
            title={option.label}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            onKeyDown={event => onKey(event, index)}
          >
            {option.short}
          </button>
        );
      })}
    </div>
  );
}
