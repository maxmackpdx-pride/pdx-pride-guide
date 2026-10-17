import type {GigPost} from '@/pages/PrideWork';
import BoardPostFace from './BoardPostFace';
export type GigPreviewPost=Pick<GigPost,'id'|'title'|'postType'|'createdAt'>&Partial<GigPost>;
export default function GigPreviewCard({post,onOpen}:{post:GigPreviewPost;selected?:boolean;onOpen:()=>void}){return <BoardPostFace category="gigz" post={{description:'',status:'LIVE',...post}} onOpen={onOpen}/>;}
