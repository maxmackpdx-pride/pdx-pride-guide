import { Link } from "wouter";
import { Divider } from "@/components/ds";

export default function ProfileFooter() {
  return (
    <footer className="profile-footer">
      <Divider seam />
      <p className="profile-footer__signoff">Pride is a protest. Take care of each other.</p>
      <Link href="/contact" className="profile-footer__report">
        Report this profile
      </Link>
    </footer>
  );
}
