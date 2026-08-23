import { useState, useCallback, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, AtSign, Eye, EyeClosed, Lock, Mail, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModalA11y } from "@/hooks/useModalA11y";
import { prefersStillMotion } from "@/lib/motion";
import { CommunityStandardsSignupBlock } from "@/components/CommunityStandardsGate";
import {
  COMMUNITY_STANDARDS_GATE_ENABLED,
  COMMUNITY_STANDARDS_VERSION,
  GUEST_STANDARDS_STORAGE_KEY,
} from "@shared/communityStandards";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "login" | "register";
}

/** The four seam colours, so the beams read as the site's rainbow rule. */
const BEAM = ["#19e3ff", "#c8fa3c", "#ff1fa0", "#ff6600"] as const;

/**
 * One field: icon on the left, dark glass well, accent edge on focus.
 * The accent is passed in so the form reads as the same per-item palette the
 * nav uses rather than one flat colour.
 */
function Field({
  icon,
  accent = "#19e3ff",
  focused,
  trailing,
  ...input
}: {
  icon: ReactNode;
  accent?: string;
  focused: boolean;
  trailing?: ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative flex items-center overflow-hidden rounded-xl">
      <span
        className="pointer-events-none absolute left-3 z-10 flex h-4 w-4 items-center justify-center transition-colors duration-300"
        style={{ color: focused ? accent : "rgba(255,255,255,.4)" }}
        aria-hidden
      >
        {icon}
      </span>
      <input
        {...input}
        className="h-11 w-full rounded-xl border-2 bg-white/[0.04] pl-10 pr-10 text-[0.95rem] text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:bg-white/[0.07]"
        style={{
          borderColor: focused ? accent : "rgba(255,255,255,.09)",
          boxShadow: focused
            ? `0 0 5px ${accent}, 0 0 12px color-mix(in srgb, ${accent} 45%, transparent)`
            : "none",
          fontFamily: "var(--font-body)",
        }}
      />
      {trailing}
    </div>
  );
}

export default function AuthModal({ onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedStandards, setAgreedStandards] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { login, register } = useAuth();
  const handleClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useModalA11y({ onClose: handleClose });

  /* Calm Mode and reduced motion hold the card flat and stop the beams. */
  const still = useMemo(() => prefersStillMotion(), []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (still) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (COMMUNITY_STANDARDS_GATE_ENABLED && !agreedStandards) {
      setError("You must agree to the Community Standards and legal terms to join.");
      return;
    }
    setLoading(true);
    try {
      await register(
        username,
        email,
        password,
        displayName || undefined,
        COMMUNITY_STANDARDS_GATE_ENABLED
          ? {
              agreedToCommunityStandards: true,
              communityStandardsVersion: COMMUNITY_STANDARDS_VERSION,
            }
          : undefined,
      );
      if (COMMUNITY_STANDARDS_GATE_ENABLED) {
        try {
          localStorage.setItem(GUEST_STANDARDS_STORAGE_KEY, COMMUNITY_STANDARDS_VERSION);
        } catch {
          /* ignore */
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Could not request a reset link. Try again shortly.");
      setResetRequested(true);
    } catch (err: any) {
      setError(err.message || "Could not request a reset link. Try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(v => !v)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="absolute right-3 z-10 flex h-6 w-6 items-center justify-center border-0 bg-transparent p-0 text-white/40 transition-colors duration-300 hover:text-white"
    >
      {showPassword ? <Eye className="h-4 w-4" /> : <EyeClosed className="h-4 w-4" />}
    </button>
  );

  const submitLabel = (idle: string, busy: string) => (loading ? busy : idle);

  // Always portal to body so login is never trapped inside event cards / modals
  // that use transform, overflow, or stacking contexts (claim-this-event flow).
  return createPortal(
    <div
      className="pdx-auth-scrim fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-[6px]"
      onClick={handleClose}
    >
      {/* Zaylist ground: cyan above, magenta below, instead of one flat scrim. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(120vh 60vh at 50% 0%, rgba(25,227,255,.16), transparent 70%), radial-gradient(90vh 50vh at 50% 100%, rgba(255,31,160,.14), transparent 70%)",
        }}
      />

      <motion.div
        initial={still ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pdx-auth-shell relative z-10 w-full max-w-[440px]"
        style={{ perspective: 1500 }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          className="relative"
          style={still ? undefined : { rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Beams travelling the four edges, one seam colour each. */}
          {!still && (
            <div className="pointer-events-none absolute -inset-[1px] overflow-hidden rounded-2xl" aria-hidden>
              <motion.div
                className="absolute left-0 top-0 h-[2px] w-1/2"
                style={{ background: `linear-gradient(90deg, transparent, ${BEAM[0]}, transparent)`, filter: "blur(1px)" }}
                animate={{ left: ["-50%", "100%"] }}
                transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.div
                className="absolute right-0 top-0 h-1/2 w-[2px]"
                style={{ background: `linear-gradient(180deg, transparent, ${BEAM[1]}, transparent)`, filter: "blur(1px)" }}
                animate={{ top: ["-50%", "100%"] }}
                transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.65 }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[2px] w-1/2"
                style={{ background: `linear-gradient(90deg, transparent, ${BEAM[2]}, transparent)`, filter: "blur(1px)" }}
                animate={{ right: ["-50%", "100%"] }}
                transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.3 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-1/2 w-[2px]"
                style={{ background: `linear-gradient(180deg, transparent, ${BEAM[3]}, transparent)`, filter: "blur(1px)" }}
                animate={{ bottom: ["-50%", "100%"] }}
                transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.95 }}
              />
            </div>
          )}

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={forgotPassword ? "Reset password" : tab === "login" ? "Log in" : "Join"}
            tabIndex={-1}
            className="pdx-auth-panel relative max-h-[92vh] overflow-y-auto rounded-2xl border border-white/[0.07] p-7 backdrop-blur-xl"
            style={{
              background: "radial-gradient(120% 140% at 50% 0%, rgba(18,18,26,.94) 0%, rgba(5,5,6,.97) 72%)",
              boxShadow:
                "0 0 0 1px #000, inset 0 1px 0 rgba(255,255,255,.07), 0 40px 90px -30px rgba(0,0,0,.9), 0 0 44px -18px rgba(25,227,255,.35)",
            }}
          >
            {/* Rainbow seam across the head, same rule as the nav. */}
            <span
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
              aria-hidden
              style={{ background: `linear-gradient(90deg, ${BEAM[0]}, ${BEAM[1]}, ${BEAM[2]}, ${BEAM[3]}, ${BEAM[0]})` }}
            />

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors duration-200 hover:border-white/25 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Head */}
            <div className="mb-6 text-center">
              <p
                className="m-0 text-[11px] uppercase tracking-[0.2em]"
                style={{ color: "var(--panel-lime, #c8fa3c)", fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
              >
                Portland · All year
              </p>
              <h2
                className="m-0 mt-2 text-[1.9rem] uppercase leading-none text-white"
                style={{ fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: "0.01em" }}
              >
                {forgotPassword ? "Reset your password" : tab === "login" ? "Welcome back" : "Join Zaylist"}
              </h2>
              <p className="mx-auto mt-2 max-w-[34ch] text-[0.82rem] leading-relaxed text-white/55">
                {forgotPassword
                  ? "Enter the email on your Zaylist account. We will send a one-time link if it matches."
                  : tab === "login"
                    ? "Find the party, back the rooms that host it."
                    : "One account for events, boards, and the whole namespace."}
              </p>
            </div>

            {/* Tabs */}
            {!forgotPassword && (
              <div className="mb-6 flex gap-2" role="group" aria-label="Account">
                {(["login", "register"] as const).map(t => {
                  const on = tab === t;
                  const accent = t === "login" ? "#19e3ff" : "#c8fa3c";
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setTab(t); setError(""); setConfirmPassword(""); }}
                      aria-pressed={on}
                      className="flex-1 rounded-full border-2 bg-transparent px-4 py-[10px] text-[0.78rem] uppercase transition-all duration-200"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        borderColor: on ? accent : "#333",
                        color: on ? accent : "var(--text-body, #e6e2d9)",
                        boxShadow: on
                          ? `0 0 6px ${accent}, 0 0 14px color-mix(in srgb, ${accent} 55%, transparent)`
                          : "none",
                      }}
                    >
                      {t === "login" ? "Log in" : "Join"}
                    </button>
                  );
                })}
              </div>
            )}

            {forgotPassword ? (
              resetRequested ? (
                <div aria-live="polite" className="space-y-4">
                  <p className="text-[0.9rem] leading-relaxed text-white/70">
                    If that address is registered, a one-time reset link is on its way. It expires in 60 minutes.
                  </p>
                  <SubmitButton
                    type="button"
                    onClick={() => { setForgotPassword(false); setResetRequested(false); setError(""); }}
                  >
                    Back to log in
                  </SubmitButton>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Field
                    icon={<Mail className="h-4 w-4" />}
                    focused={focusedInput === "email"}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {error && <ErrorNote>{error}</ErrorNote>}
                  <SubmitButton type="submit" disabled={loading}>
                    {submitLabel("Send reset link", "Sending...")}
                  </SubmitButton>
                  <TextButton onClick={() => { setForgotPassword(false); setError(""); }}>
                    Back to log in
                  </TextButton>
                </form>
              )
            ) : (
              <>
                {/*
                  Google CTA sits outside <form> so Android Chrome does not treat
                  it as a submit and swallow the navigation.
                */}
                <a
                  href="/api/auth/google"
                  data-testid="auth-google"
                  onClick={(e) => {
                    // Full top-level navigation (not SPA), so OAuth completes in Custom Tabs.
                    e.preventDefault();
                    window.location.assign("/api/auth/google");
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-[0.82rem] uppercase text-white/80 no-underline transition-all duration-200 hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                  style={{ fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.05em" }}
                >
                  <span aria-hidden className="text-[0.95rem] font-bold">G</span>
                  {tab === "login" ? "Continue with Google" : "Join with Google"}
                </a>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span
                    className="text-[10px] uppercase tracking-[0.16em] text-white/35"
                    style={{ fontFamily: "var(--font-mono, ui-monospace, monospace)" }}
                  >
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                {tab === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      focused={focusedInput === "id"}
                      onFocus={() => setFocusedInput("id")}
                      onBlur={() => setFocusedInput(null)}
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="Username or email"
                      autoComplete="username"
                    />
                    <Field
                      icon={<Lock className="h-4 w-4" />}
                      focused={focusedInput === "password"}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Password"
                      autoComplete="current-password"
                      trailing={eyeToggle}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setForgotPassword(true); setResetRequested(false); setError(""); }}
                        className="border-0 bg-transparent p-0 text-[0.78rem] text-white/55 transition-colors duration-200 hover:text-white"
                      >
                        Forgot password?
                      </button>
                    </div>
                    {error && <ErrorNote>{error}</ErrorNote>}
                    <SubmitButton type="submit" disabled={loading}>
                      {submitLabel("Log in", "Logging in...")}
                    </SubmitButton>
                    <SwapNote
                      question="No account?"
                      action="Join free"
                      accent="#c8fa3c"
                      onClick={() => { setTab("register"); setError(""); }}
                    />
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <Field
                      icon={<AtSign className="h-4 w-4" />}
                      accent="#c8fa3c"
                      focused={focusedInput === "username"}
                      onFocus={() => setFocusedInput("username")}
                      onBlur={() => setFocusedInput(null)}
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      placeholder="Username"
                      minLength={3}
                    />
                    <Field
                      icon={<User className="h-4 w-4" />}
                      accent="#c8fa3c"
                      focused={focusedInput === "displayName"}
                      onFocus={() => setFocusedInput("displayName")}
                      onBlur={() => setFocusedInput(null)}
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Display name (optional)"
                    />
                    <Field
                      icon={<Mail className="h-4 w-4" />}
                      accent="#c8fa3c"
                      focused={focusedInput === "email"}
                      onFocus={() => setFocusedInput("email")}
                      onBlur={() => setFocusedInput(null)}
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <Field
                      icon={<Lock className="h-4 w-4" />}
                      accent="#c8fa3c"
                      focused={focusedInput === "password"}
                      onFocus={() => setFocusedInput("password")}
                      onBlur={() => setFocusedInput(null)}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Password (6+ characters)"
                      minLength={6}
                      autoComplete="new-password"
                      trailing={eyeToggle}
                    />
                    <Field
                      icon={<Lock className="h-4 w-4" />}
                      accent="#c8fa3c"
                      focused={focusedInput === "confirm"}
                      onFocus={() => setFocusedInput("confirm")}
                      onBlur={() => setFocusedInput(null)}
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      minLength={6}
                      autoComplete="new-password"
                    />
                    {COMMUNITY_STANDARDS_GATE_ENABLED ? (
                      <div className="pt-1 [&_a]:text-[color:var(--panel-cyan,#19e3ff)]">
                        <CommunityStandardsSignupBlock
                          agreed={agreedStandards}
                          onAgreedChange={setAgreedStandards}
                        />
                      </div>
                    ) : null}
                    {error && <ErrorNote>{error}</ErrorNote>}
                    <SubmitButton
                      type="submit"
                      accent="#c8fa3c"
                      disabled={loading || (COMMUNITY_STANDARDS_GATE_ENABLED && !agreedStandards)}
                    >
                      {submitLabel("Join Zaylist", "Joining...")}
                    </SubmitButton>
                    <SwapNote
                      question="Already have an account?"
                      action="Log in"
                      accent="#19e3ff"
                      onClick={() => { setTab("login"); setError(""); }}
                    />
                  </form>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}

/** Filled accent action. Cyan for log in, lime for join. */
function SubmitButton({
  accent = "#19e3ff",
  children,
  ...props
}: { accent?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="group/submit mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-0 text-[0.85rem] uppercase transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background: accent,
        color: "#050506",
        fontFamily: "var(--font-display)",
        fontWeight: 900,
        letterSpacing: "0.06em",
        boxShadow: `0 0 8px color-mix(in srgb, ${accent} 55%, transparent), 0 0 22px -6px ${accent}`,
      }}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/submit:translate-x-1" />
    </button>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border px-3 py-2 text-[0.8rem]"
      style={{
        borderColor: "color-mix(in srgb, var(--panel-magenta, #ff1fa0) 55%, transparent)",
        background: "color-mix(in srgb, var(--panel-magenta, #ff1fa0) 12%, transparent)",
        color: "#ffd6ec",
      }}
    >
      {children}
    </div>
  );
}

function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto block min-h-[44px] border-0 bg-transparent px-3 text-[0.82rem] text-white/55 transition-colors duration-200 hover:text-white"
    >
      {children}
    </button>
  );
}

function SwapNote({
  question,
  action,
  accent,
  onClick,
}: { question: string; action: string; accent: string; onClick: () => void }) {
  return (
    <p className="mt-4 text-center text-[0.8rem] text-white/55">
      {question}{" "}
      <button
        type="button"
        onClick={onClick}
        className="border-0 bg-transparent p-0 font-bold transition-opacity duration-200 hover:opacity-75"
        style={{ color: accent }}
      >
        {action}
      </button>
    </p>
  );
}
