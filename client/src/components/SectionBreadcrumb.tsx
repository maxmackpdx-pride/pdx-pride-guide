import { Link } from "wouter";
import "./BrowseContinuity.css";
export default function SectionBreadcrumb({ section, parent }: { section: string; parent?: { label: string; href: string } }) {
  return <nav className="section-breadcrumb" aria-label="Breadcrumb">
    <Link href="/">Zaylist</Link><span aria-hidden="true">/</span>
    {parent && <><Link href={parent.href}>{parent.label}</Link><span aria-hidden="true">/</span></>}
    <span aria-current="page">{section}</span>
  </nav>;
}
