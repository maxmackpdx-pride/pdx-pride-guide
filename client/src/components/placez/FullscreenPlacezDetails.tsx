import type {ReactNode} from 'react';
import {CardStage} from '../cards/CardStage';
import './FullscreenPlacezDetails.css';

/** Place cards go straight to their expanded face. */
export default function FullscreenPlacezDetails({children,onClose}:{children:ReactNode;label:string;onClose:()=>void}){
 return <CardStage className="placez-stage" onClose={onClose}>{children}</CardStage>;
}

