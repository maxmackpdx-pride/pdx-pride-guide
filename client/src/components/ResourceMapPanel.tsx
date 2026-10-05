import { useMemo, useState } from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { RESOURCE_CATEGORIES } from '@/lib/resourcesData';
import { RESOURCE_MAP_ENTRIES, resourceMapHref, resourceMapKey, type ResourceMapEntry } from '@/lib/resourceMap';
import { inMapBounds, type MapBounds } from '@/lib/mapWorlds';
import './ResourceMapPanel.css';

type Props = {
  bounds: MapBounds | null;
  query: string;
  category: string;
  onQuery: (value: string) => void;
  onCategory: (value: string) => void;
  selectedKeys: string[];
  onClearSelection: () => void;
};

export default function ResourceMapPanel({ bounds, query, category, onQuery, onCategory, selectedKeys, onClearSelection }: Props) {
  const [limit, setLimit] = useState(40);
  const matching = useMemo(() => RESOURCE_MAP_ENTRIES.filter(({ org, categories }) => {
    if (category && !categories.some(item => item.id === category || org.categoryIds?.includes(category))) return false;
    const text = [org.name, org.desc, org.scope, org.addr, ...categories.map(item => item.name), ...(org.serviceTags || [])].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [query, category]);
  const inView = matching.filter(entry => entry.locations.some((location, index) => inMapBounds(location, bounds) && (!selectedKeys.length || selectedKeys.includes(resourceMapKey(entry.org.name, index)))));
  const withoutPin = matching.filter(entry => !entry.locations.length);
  const renderEntry = (entry: ResourceMapEntry) => <a className="resource-map-result" key={entry.org.name} href={resourceMapHref(entry.org.name)}>
    <span className="resource-map-result__icon"><MapPin size={20} aria-hidden="true" /></span>
    <span className="resource-map-result__copy"><strong>{entry.org.name}</strong><small>{entry.org.scope}</small><span>{entry.categories.map(item => item.name).join(' · ')}</span></span>
    <ArrowUpRight size={19} aria-hidden="true" />
  </a>;
  return <section className="mapz-layer-panel resource-map-panel" aria-label="ReZources on this map">
    <div className="mapz-layer-panel__heading"><small>In this view</small><h2>ReZources</h2></div>
      <div className="resource-map-controls">
        <label>Search ReZources<input type="search" value={query} onChange={event => { onQuery(event.target.value); setLimit(40); }} placeholder="Organization, service, or need" /></label>
        <label>Category<select value={category} onChange={event => { onCategory(event.target.value); setLimit(40); }}>
          <option value="">All categories</option>
          {RESOURCE_CATEGORIES.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></label>
      </div>
      {selectedKeys.length > 0 && <button className="resource-map-more" type="button" onClick={onClearSelection}>Show all ReZources in view</button>}
      <p className="resource-map-count" role="status">{inView.length} organizations in view · {matching.length} matching ReZources</p>
      <div className="resource-map-results">{inView.slice(0, limit).map(renderEntry)}</div>
      {inView.length > limit && <button className="resource-map-more" type="button" onClick={() => setLimit(value => value + 40)}>Show more ({inView.length - limit})</button>}
      {!inView.length && <p className="resource-map-empty">No mapped ReZources in this view. Move the map or broaden the filters.</p>}
      {withoutPin.length > 0 && <details className="resource-map-unlocated"><summary>{withoutPin.length} more ReZources without a map pin</summary>
        <p>These providers have no verified map coordinates. Their details and contact options are still available.</p>
        <div className="resource-map-results">{withoutPin.map(renderEntry)}</div>
      </details>}
  </section>;
}
