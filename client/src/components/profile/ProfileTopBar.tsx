import { Link } from "wouter";

export default function ProfileTopBar() {
  return (
    <div className="profile-topbar">
      <Link href="/" className="profile-topbar__back">
        ← Back
      </Link>
      <Link href="/" className="profile-topbar__brand">
        PDX <span>PRIDE</span> GUIDE
      </Link>
      <span className="profile-topbar__label">Public profile</span>
    </div>
  );
}
