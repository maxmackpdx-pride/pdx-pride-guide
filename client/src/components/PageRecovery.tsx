import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ds";
import "./PageRecovery.css";

type Props = {
  section: string;
  title: string;
  description: string;
  href: string;
  label: string;
  retry?: () => void;
  missing?: boolean;
};

/** A common way back, with copy and a destination specific to the current room. */
export default function PageRecovery({ section, title, description, href, label, retry, missing = true }: Props) {
  return <section className="page-recovery" aria-labelledby="page-recovery-title">
    <div className="page-recovery__panel">
      <Link href="/" className="page-recovery__brand" aria-label="Zaylist home">
        <img src="/brand/family/zaylist-primary.svg" alt="Zaylist" width="180" height="64" />
      </Link>
      <p className="page-recovery__eyebrow">{section} <span aria-hidden="true">/</span> {missing ? "Not found" : "Connection interrupted"}</p>
      <h1 id="page-recovery-title">{title}</h1>
      <p className="page-recovery__copy">{description}</p>
      <div className="page-recovery__actions">
        {retry && <Button variant="solid" accent="cyan" onClick={retry}>Try again</Button>}
        <Link href={href}><Button as="span" variant={retry ? "neon" : "solid"} accent="cyan">{label}</Button></Link>
        {href !== "/" && <Link href="/" className="page-recovery__home">Back to Zaylist <span aria-hidden="true"><ArrowUpRight size={14} aria-hidden="true" /></span></Link>}
      </div>
      <p className="page-recovery__help">Followed a broken link? <Link href="/contact">Let Tucker know.</Link></p>
    </div>
  </section>;
}
