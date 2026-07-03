import type { ChangeEventHandler, InputHTMLAttributes } from "react";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  size?: "sm" | "md";
}

function SearchGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search events, venues, DJs…",
  label,
  size = "md",
  id,
  ...rest
}: SearchInputProps) {
  const hasValue = value != null && value !== "";

  return (
    <div className="pdxField">
      {label && (
        <label className="pdxField__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`pdxSearch ${size === "sm" ? "pdxSearch--sm" : ""}`}>
        <span className="pdxSearch__icon">
          <SearchGlyph />
        </span>
        <input
          id={id}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
        {hasValue && onClear && (
          <button
            type="button"
            className="pdxSearch__clear"
            aria-label="Clear search"
            onClick={onClear}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}