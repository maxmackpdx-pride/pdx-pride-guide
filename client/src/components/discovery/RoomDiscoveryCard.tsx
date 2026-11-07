import {type CSSProperties,type ReactNode,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import BoardShareButton from '@/components/BoardShareButton';
import {rememberCardOrigin} from '@/components/cards/CardAPI';
/** Presentation adapter only: the parent supplies real records and native heart/open actions. */
export default function RoomDiscoveryCard({name,category,accent,logo,fallback,description,tags,meta,href,onOpen,heart,room}:{name:string;category:string;accent:string;logo?:string|null;fallback:ReactNode;description?:string|null;tags:string[];meta?:string|null;href:string;onOpen:(element:HTMLElement)=>void;heart:ReactNode;room:'needz'|'placez'}){
 const[failed,setFailed]=useState(false);
 return <article className="rd-card pdx-glass-rebind" data-card-size="tall" data-card-category={room} style={{'--c':accent} as CSSProperties} onClickCapture={rememberCardOrigin} onClick={event=>{if((event.target as HTMLElement).closest('button,a,input'))return;onOpen(event.currentTarget);}}>
  <div className="rd-card-media"><span className="rd-card-category">{category}</span><BoardShareButton title={name} path={href}/>{logo&&!failed?<img src={logo} alt={`${name} logo`} loading="lazy" onError={()=>setFailed(true)}/>:<div className="rd-card-fallback">{fallback}</div>}</div>
  <div className="rd-card-copy">{meta&&<p className="rd-card-meta">{meta}</p>}<h3>{name}</h3><div className="rd-card-tags">{tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div><p className="rd-card-description">{description}</p><div className="rd-card-footer"><button type="button" className="rd-card-open" aria-label={`View details for ${name}`} onClick={event=>onOpen(event.currentTarget.closest<HTMLElement>('.rd-card')!)}>View details <ArrowUpRight size={17}/></button>{heart}</div></div>
 </article>;
}
