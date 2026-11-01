import type {CardSize} from '@/components/cards/CardAPI';
import type {BoardPost} from '@/lib/allBoards';
import type {ReactElement} from 'react';
export default function PunkBoardCard(props:{post:BoardPost;small?:boolean;size?:CardSize;saved?:boolean;saveDisabled?:boolean;onSave?:()=>void;onOpen?:(target:HTMLButtonElement)=>void;showStatus?:boolean;calm?:boolean}):ReactElement;
export function PunkOpenHead(props:{post:BoardPost;calm?:boolean}):ReactElement;
