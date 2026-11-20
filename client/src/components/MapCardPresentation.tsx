import { useModalA11y } from '@/hooks/useModalA11y';
import { CardStage } from './cards/CardStage';
import NativePlacezFace from './placez/NativePlacezFace';
import type { Business } from '@/pages/Directory';
import './cards/CardStage.css';

export function MapPlacePreview({ place, onExpand, onClose, onRequireAuth }: {
  place: Business; onExpand: () => void; onClose: () => void; onRequireAuth: () => void;
}) {
  const dialog = useModalA11y({ onClose });
  return <CardStage front onClose={onClose}>
    <div role="dialog" aria-modal="true" aria-label={place.name} ref={dialog} className="map-place-preview">
      <NativePlacezFace place={place} size="wide" onOpen={onExpand} onRequireAuth={onRequireAuth} />
      <div className="event-front-controls">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  </CardStage>;
}
