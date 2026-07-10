import { Link } from "wouter";

export default function ProfileTopBar() {
  return (
    <header className="pp-topbar">
      <div className="pp-topbar__left">
        <Link href="/" className="pp-topbar__back" aria-label="Back home">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <span className="pp-topbar__wordmark display">
          PDX Pride <span className="pp-topbar__accent">Guide</span>
        </span>
      </div>
      <span className="pp-topbar__label display">Public profile</span>
    </header>
  );
}