import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { ResourceFilterButton } from "@/components/resources/ResourceFilterButton";
import "./FilterSurvey.css";
import "./discovery/DiscoveryFlow.css";

export type FilterSurveyOption = { value: string; label: string; color?: string; count?: number; icon?: string };

/** The ReZources choice-first pattern, adapted to a board's existing filters. */
export default function FilterSurvey({
  label, question, options, value, onChange, children, accent = "var(--neon-yellow)", surface, startStep = 1, eyebrow = "Start here",
}: {
  label: string;
  question: string;
  options: FilterSurveyOption[];
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
  accent?: string;
  surface?: "globe";
  startStep?: number;
  eyebrow?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const { calmMode } = useTheme();
  const detailId = useId();
  return <section className={surface === "globe" ? "filter-survey pdx-glass-rebind" : "filter-survey"} data-surface={surface} style={{ "--survey-accent": accent } as CSSProperties} aria-label={`${label} discovery questions`}>
    {surface === "globe" && <span className="filter-survey__top-rule pdx-rainbow-rule" aria-hidden="true" />}
    <div className="filter-survey__step">
      <span className="filter-survey__number" aria-hidden="true">{String(startStep).padStart(2, "0")}</span>
      <div className="filter-survey__content">
        <span className="filter-survey__eyebrow">{eyebrow} / {label}</span>
        <h2>{question}</h2>
        <div className="filter-survey__options" role="group" aria-label={question}>
          {options.map(option => <ResourceFilterButton
            key={option.value}
            type="button"
            className="filter-survey__option pdx-glass-rebind"
            quietMotion={Boolean(reducedMotion || calmMode)}
            style={{ "--res-accent": option.color || accent } as CSSProperties}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.icon && <span className="filter-survey__icon" aria-hidden="true"><img src={option.icon} alt="" loading="lazy" /></span>}
            <span>{option.label}</span>
            {option.count != null && <small>{option.count}</small>}
            <i aria-hidden="true">{value === option.value && <Check size={14} />}</i>
          </ResourceFilterButton>)}
        </div>
        {eyebrow === "Start here" && <button type="button" className="discovery-skip" onClick={() => onChange(options.find(option => option.value.toLowerCase() === "all")?.value ?? options[0]?.value ?? value)}>Skip to view all</button>}
      </div>
    </div>
    {children && <div className="filter-survey__step filter-survey__step--details">
      <span className="filter-survey__number" aria-hidden="true">{String(startStep + 1).padStart(2, "0")}</span>
      <div className="filter-survey__content">
        <button type="button" className="filter-survey__details-toggle" aria-expanded={detailsOpen} aria-controls={detailId} onClick={() => setDetailsOpen(open => !open)}>
          <span><span className="filter-survey__eyebrow">Make it yours</span><strong>Refine your search</strong></span>
          <ChevronDown size={18} aria-hidden="true" />
        </button>
        <AnimatePresence initial={false}>{detailsOpen && <motion.div id={detailId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: reducedMotion || calmMode ? 0 : .24, ease: "easeInOut" }} className="filter-survey__details">{children}</motion.div>}</AnimatePresence>
      </div>
    </div>}
  </section>;
}
