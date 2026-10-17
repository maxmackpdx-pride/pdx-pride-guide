import { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import type { BoardCategory } from '@/lib/allBoards';
import BoardPostFace from './BoardPostFace';
import BoardComposerPreview from './BoardComposerPreview';
import './BoardzComponentSpecimen.css';

const choices = [
  ['housing:OFFERING','Hoüz · Join our Hoüz'], ['housing:LOOKING','Hoüz · Looking to rent'],
  ['housing:FORMING','Hoüz · Building a Hoüz'], ['housing:MANAGED','Hoüz · Managed rental'],
  ['gigz:LOOKING_FOR_WORK','Gigz · Available for work'], ['gigz:HIRING','Gigz · Hiring'],
  ['giftz:ISO','Giftz · In search of'], ['giftz:GIFT','Giftz · Giving away'],
  ['sellz:SELL','Sellz · For sale'], ['mizzed:CONNECTION','Mizzed · Looking for you'],
] as const;

/** Read-only fixtures exercise production components; no specimen creates or changes a post. */
export default function BoardzComponentSpecimen({componentId}:{componentId:string}) {
  return <AuthProvider><BoardzExamples componentId={componentId}/></AuthProvider>;
}

function BoardzExamples({componentId}:{componentId:string}) {
  const [choice,setChoice]=useState<string>('housing:OFFERING');
  const [category,type]=choice.split(':') as [BoardCategory,string];
  const title=category==='housing'?'Sunny room in a shared Portland home':category==='gigz'?'Community event sound and lighting':category==='giftz'?'A small desk for a new home':category==='sellz'?'A pair of solid wood bar stools':'We met beside the record crates';
  const fields={id:910000+choices.findIndex(c=>c[0]===choice),isDemo:true,createdAt:'2026-10-16T12:00:00Z',status:category==='gigz'?'LIVE':category==='giftz'?'OPEN':'ACTIVE',
    type,postType:type,title,headline:title,description:'A read-only component example. Full details remain available in the opened card.',body:'A read-only component example. Full details remain available in the opened card.',
    areas:['Southeast'],neighborhood:'Southeast',location:'Southeast',placeName:'Southeast',photos:[],photoUrls:[],rent:'900',budget:'3795',priceCents:6000,compensation:'125/HR',skills:'Sound setup, lighting',
    displayName:'Example poster',author:{userId:910000,displayName:'Example poster',photoUrl:'/boardz/punk/profile-placeholder.svg'},
    household:type==='LOOKING'?[]:[{kind:'OFFPLATFORM',role:'MEMBER',name:'Housemate',photoUrl:'/boardz/punk/profile-placeholder.svg'}],openSlots:type==='LOOKING'||type==='MANAGED'?0:2};
  return <section className="boardz-specimen" aria-label="Boardz component examples">
    <label>Post type<select value={choice} onChange={e=>setChoice(e.target.value)}>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    <p>Read-only examples. Pins and split background motifs appear inside their real card context. Saving and posting are disabled.</p>
    {componentId==='component:forms/BoardComposerPreview'
      ?<BoardComposerPreview category={category} fields={fields}/>
      :<div className="boardz-specimen__pair"><BoardPostFace category={category} post={fields}/><BoardPostFace category={category} post={fields} small/></div>}
  </section>;
}
