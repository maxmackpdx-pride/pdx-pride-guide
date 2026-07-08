import type { ReactNode } from "react";
import { Link } from "wouter";
import GlitchWord from "@/components/GlitchWord";
import type { PageHeroAccent } from "@/components/PageHero";

export type PageHeaderProps = {
  section: string;
  title: string;
  titlePrefix?: ReactNode;
  titleAccent?: PageHeroAccent;
  kicker?: string;
  lede?: string;
  tagline?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({
  section,
  title,
  titlePrefix,
  titleAccent,
  kicker,
  lede,
  tagline,
  actions,
  className = "",
}: PageHeaderProps) {
  const classes = ["page-header", className].filter(Boolean).join(" ");

  return (
    <header className={classes}>
      <div className="page-header__inner">
        <nav className="page-header__crumb" aria-label="Breadcrumb">
          <Link href="/" className="page-header__crumb-home">
            PDX Pride Guide
          </Link>
          <span className="page-header__crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="page-header__crumb-section">{section}</span>
        </nav>

        {kicker && <p className="page-header__kicker">{kicker}</p>}

        <div className="page-header__row">
          <h1 className="page-header__title">
            {titlePrefix != null && <span className="page-header__count">{titlePrefix}</span>}
            {titleAccent === "rainbow" ? (
              <span className="page-header__title-accent page-header__title-accent--rainbow">
                <GlitchWord text={title} />
              </span>
            ) : titleAccent ? (
              <span className={`page-header__title-accent page-header__title-accent--${titleAccent}`}>
                {title}
              </span>
            ) : (
              title
            )}
          </h1>
          {actions && <div className="page-header__actions">{actions}</div>}
        </div>

        {lede && <p className="page-header__lede">{lede}</p>}
        {tagline && <p className="page-header__tagline">{tagline}</p>}
      </div>
    </header>
  );
}