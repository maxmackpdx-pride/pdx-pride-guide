import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { ResourceFilterButton } from '@/components/resources/ResourceFilterButton';
import './DiscoveryFlow.css';

export type DiscoveryChoice = { id: string; label: string; description?: string; disabled?: boolean; scrollToResults?: boolean; scrollTargetId?: string; onChoose?: () => void };
/** ReZources' progressive opening, with each room retaining its own data and actions. */
export default function DiscoveryFlow({ room, accent, choices, children, initiallyOpen = false, initialChoiceId, title = 'What do you need?', kicker, intro = 'Choose a starting point. You can change it any time.', enabled = true, keepMounted = false, onViewAll }: {
  room: string; accent: string; choices: DiscoveryChoice[]; children: ReactNode;
  initiallyOpen?: boolean; initialChoiceId?: string; title?: string; kicker?: ReactNode; intro?: string; enabled?: boolean; keepMounted?: boolean; onViewAll?: () => void;
}) {
  const id = useId();
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(scrollTimer.current), []);
  const [selected, setSelected] = useState<string | null>(initiallyOpen ? initialChoiceId ?? choices[0]?.id ?? null : null);
  const reduced = useReducedMotion();
  const { calmMode } = useTheme();
  const quiet = Boolean(reduced || calmMode);
  // The next step waits below and rises in once it reaches the lower part of the screen.
  const resultsRef = useRef<HTMLDivElement>(null);
  const reached = useInView(resultsRef, { once: true, margin: '0px 0px -15% 0px' });
  const revealed = Boolean(selected) || reached;
  if (!enabled) return <>{children}</>;
  return <div className="discovery-flow" style={{ '--discovery-accent': accent, '--discovery-kicker-accent': accent } as CSSProperties}>
    <section className="discovery-survey" aria-labelledby={`${id}-title`}>
      {kicker ? <div className="discovery-kicker discovery-kicker--custom">{kicker}</div> : <p className="discovery-kicker"><span aria-hidden="true">01</span> Start here</p>}
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="discovery-intro">{intro}</p>
      <div className="discovery-choices pdx-glass-rebind" role="group" aria-label={`${room}: choose a starting point`}>
        {choices.map(choice => <ResourceFilterButton type="button" quietMotion={quiet} key={choice.id}
          disabled={choice.disabled}
          aria-pressed={selected === choice.id} aria-controls={`${id}-results`}
          onClick={() => {
            clearTimeout(scrollTimer.current);
            setSelected(choice.id);
            choice.onChoose?.();
            if (choice.scrollToResults) scrollTimer.current = setTimeout(() => {
              (document.getElementById(choice.scrollTargetId || '') || document.getElementById(`${id}-results`))
                ?.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth', block: 'start' });
            }, quiet ? 0 : 420);
          }}>
          {selected === choice.id && <motion.span className="discovery-lens" layoutId={`${id}-lens`} transition={{ duration: quiet ? 0 : .3, ease: 'easeInOut' }} aria-hidden="true" />}
          <strong>{choice.label}</strong>{choice.description && <span>{choice.description}</span>}
        </ResourceFilterButton>)}
      </div>
      <button type="button" className="discovery-skip" onClick={() => {
        clearTimeout(scrollTimer.current);
        const browse = choices.find(choice => choice.id === 'all' || choice.id === 'browse') ?? (onViewAll ? undefined : choices[0]);
        setSelected(browse?.id ?? 'all');
        if (onViewAll) onViewAll(); else browse?.onChoose?.();
        // Skip lands on the listings, with the same pause as a choice.
        scrollTimer.current = setTimeout(() => {
          document.getElementById(`${id}-results`)?.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth', block: 'start' });
        }, quiet ? 0 : 420);
      }}>Skip to view all</button>
    </section>
    <div id={`${id}-results`} ref={resultsRef} className="discovery-results">
      {<motion.div key={keepMounted ? id : 'results'} initial={quiet ? false : { opacity: 0, y: 24 }} animate={{ opacity: revealed ? 1 : 0, y: revealed || quiet ? 0 : 24 }} transition={{ duration: quiet ? 0 : .4 }} style={{ pointerEvents: revealed ? undefined : 'none' }}>
        <p className="discovery-kicker discovery-kicker--results"><span aria-hidden="true">02</span> Explore {room}</p>
        {children}
      </motion.div>}
    </div>
  </div>;
}
