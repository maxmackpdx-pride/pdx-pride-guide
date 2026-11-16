import type {ReactNode} from 'react';
import {CardDetails} from '../cards/CardAPI';
import '../places/InlinePlacesDetails.css';

/** Place details share EventZ's in-flow expansion and source-card restoration. */
export default function FullscreenPlacezDetails({children,onClose}:{children:ReactNode;label:string;onClose:()=>void}){
 return <CardDetails onClose={onClose}>{children}</CardDetails>;
}
