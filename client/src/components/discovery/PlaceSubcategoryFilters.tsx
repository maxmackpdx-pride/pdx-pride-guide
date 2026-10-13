import { type CSSProperties } from 'react';
import './PlaceSubcategoryFilters.css';

export function PlaceSubcategoryFilters({ options, selected, onSelect, color }: {
  options: Array<{ id: string; label: string; count: number }>;
  selected: string; onSelect: (id: string) => void; color: string;
}) {
  if (!options.length) return null;
  return <div className="placez-subfilters" style={{ '--c': color } as CSSProperties}>
    <span className="placez-subfilters__label">Narrow it down</span>
    <div className="placez-subfilters__options" role="group" aria-label="Place subcategories">
      <button type="button" className="eb-tool pdx-glass-rebind" aria-pressed={selected === 'ALL'} onClick={() => onSelect('ALL')}>All in this category</button>
      {options.map(option => <button type="button" className="eb-tool pdx-glass-rebind" key={option.id}
        aria-pressed={selected === option.id} onClick={() => onSelect(selected === option.id ? 'ALL' : option.id)}>
        {option.label}<span className="placez-subfilters__count">{option.count}</span>
      </button>)}
    </div>
  </div>;
}
