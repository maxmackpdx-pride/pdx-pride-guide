import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type UserResult = {
  username: string;
  displayName: string | null;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
  inputStyle?: React.CSSProperties;
};

export default function UsernameAutocomplete({ value, onChange, placeholder = "@username", style, className, inputStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const q = value.replace(/^@/, "").trim();

  const { data: results = [] } = useQuery<UserResult[]>({
    queryKey: ["/api/users/search", q],
    queryFn: () => apiRequest("GET", `/api/users/search?q=${encodeURIComponent(q)}`).then(r => r.json()),
    enabled: focused && q.length >= 2,
    staleTime: 10_000,
  });

  useEffect(() => {
    setOpen(focused && q.length >= 2 && results.length > 0);
  }, [focused, q, results.length]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", ...style }} className={className}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        style={inputStyle}
      />
      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#111",
          border: "1px solid #333",
          zIndex: 200,
          maxHeight: 220,
          overflowY: "auto",
        }}>
          {results.map(u => (
            <button
              key={u.username}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                onChange(`@${u.username}`);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "8px 12px",
                background: "none",
                border: "none",
                borderBottom: "1px solid #1a1a1a",
                color: "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.82rem",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <span style={{ color: "#aaa" }}>@{u.username}</span>
              {u.displayName && (
                <span style={{ color: "#555", fontSize: "0.75rem" }}>{u.displayName}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
