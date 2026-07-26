import React from "react";

export interface SearchInputProps {
  /** Controlled value. */
  value?: string;
  /** Change handler (native input event). */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** If provided, a clear (✕) button shows when there's a value. */
  onClear?: () => void;
  /** Placeholder copy. Default: "Search events, venues, DJs…". */
  placeholder?: string;
  /** Optional mono uppercase label above the field. */
  label?: string;
  /** `md` (48px, default) or `sm` (40px). */
  size?: "sm" | "md";
  id?: string;
}

/**
 * Rounded search field with a built-in magnifier and optional clear button.
 * Cyan glow on focus. Use to filter the event directory.
 */
export function SearchInput(props: SearchInputProps): JSX.Element;
