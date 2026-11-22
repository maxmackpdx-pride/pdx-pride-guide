import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MobileDockShell } from '@/components/ui/mobile-dock-shell';
import '@/fonts.css';
import '@/index.css';
import '@/layout-end.css';
import '@/components/hub/hub-shell.css';
import '@/components/ds/tokens/index.css';
import '@/components/nav.css';

function Fixture() {
  const [active, setActive] = useState(2);
  return (
    <MobileDockShell activeIndex={active} location="/">
      {['Eventz', 'Placez', 'Home', 'Boardz', 'Account'].map((label, index) => (
        <button
          key={label}
          type="button"
          className={`hub-mobile-tab znav-control${index === 2 ? ' hub-mobile-tab--center hub-mobile-tab--hub-icon' : ''}${active === index ? ' is-active' : ''}`}
          aria-label={label}
          onClick={() => setActive(index)}
        >
          <span className="znav-icon-row" aria-hidden="true">{label.slice(0, 1)}</span>
        </button>
      ))}
    </MobileDockShell>
  );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
