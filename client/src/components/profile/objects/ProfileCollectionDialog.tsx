import {createPortal} from 'react-dom';
import type {ReactNode} from 'react';
import {useModalA11y} from '@/hooks/useModalA11y';
export default function ProfileCollectionDialog({children,label,onClose}:{children:ReactNode;label:string;onClose:()=>void}){const ref=useModalA11y({onClose});return createPortal(<div className="profile-collection-backdrop" onClick={onClose}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="profile-host-browser" onClick={e=>e.stopPropagation()}>{children}</section></div>,document.body);}
