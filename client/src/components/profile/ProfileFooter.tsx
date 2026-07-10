import { Divider } from "@/components/ds";

export default function ProfileFooter() {
  return (
    <footer className="pp-footer">
      <Divider variant="rainbow" seam />
      <p className="pp-footer__signoff">Pride is a protest. Take care of each other.</p>
      <a href="/contact" className="pp-footer__report">Report this profile</a>
    </footer>
  );
}