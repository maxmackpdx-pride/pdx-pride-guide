import type {BoardPost} from '@/lib/allBoards';
import type {ReactElement} from 'react';
export default function PunkBoardCard(props:{post:BoardPost;small?:boolean;saved?:boolean;saveDisabled?:boolean;onSave?:()=>void;onOpen?:(target:HTMLButtonElement)=>void;showStatus?:boolean;calm?:boolean}):ReactElement;
