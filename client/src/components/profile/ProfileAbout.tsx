import { useState } from "react";
import { Link } from 'wouter';
import UserAvatar from '@/components/UserAvatar';
import { parseSocialLinks, socialCardsFor } from '@/pages/profile/helpers';
import type { PublicProfileData, ProfileUserChip } from './types';
import type { ProfileEmbed, ProfilePhoto } from '@/pages/profile/types';
import './ProfileAbout.css';

function publicUrl(value?: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value, "https://www.zaylist.com"); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function People({title, people}: {title:string;people?:ProfileUserChip[]}) {
  if (!people?.length) return null;
  return <div className="pp-about__group"><h3>{title}</h3><ul className="pp-about__people">{people.map(person=><li key={person.id}><Link href={`/u/${encodeURIComponent(person.username)}`}><UserAvatar photoUrl={person.photoUrl} avatarChoice={person.avatarChoice} avatarRing={person.avatarRing} displayName={person.displayName} username={person.username} size={40}/><span>{person.displayName || person.username}</span></Link></li>)}</ul></div>;
}
/** Existing public profile fields only. Private adventures and anonymous posts are not inputs. */
type AboutProps = {data:PublicProfileData;profilePhotos?:ProfilePhoto[];profileEmbeds?:ProfileEmbed[]};
export function hasProfileAboutContent(data:PublicProfileData, profilePhotos:ProfilePhoto[]=[], profileEmbeds:ProfileEmbed[]=[]) {
  return Boolean(data.roles?.length || data.talents?.length || data.standFor?.length || socialCardsFor(parseSocialLinks(data.socialLinks)).length || data.affiliatedVenues?.length || data.linkedVenues?.length || data.businessPlace || data.media || data.pup || data.packmates?.length || data.handlers?.length || profilePhotos.length || profileEmbeds.length);
}
function approvedEmbed(value:string) { try {const url=new URL(value);return url.protocol==='https:' && ['w.soundcloud.com','soundcloud.com','api.soundcloud.com'].includes(url.hostname);}catch{return false;} }
function MediaEmbed({src,title}:{src:string;title:string}) {
  const [open,setOpen]=useState(false);
  if (!publicUrl(src)) return null;
  return <details className="pp-about__disclosure" onToggle={event=>setOpen(event.currentTarget.open)}><summary>{title || 'Listen'}</summary>{open && approvedEmbed(src) ? <iframe src={src} title={title || 'SoundCloud player'} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" allow="autoplay" referrerPolicy="strict-origin-when-cross-origin" className="pp-about__embed"/> : null}<a href={publicUrl(src)!} target="_blank" rel="noopener noreferrer">Open player ↗</a></details>;
}
export default function ProfileAbout({data,profilePhotos=[],profileEmbeds=[]}:AboutProps) {
  const socials=socialCardsFor(parseSocialLinks(data.socialLinks));
  const venues=[...new Map([...(data.affiliatedVenues || []),...(data.linkedVenues || [])].map(venue=>[venue.id,venue])).values()];
  const business=data.businessPlace;
  const media=data.media;
  const hasContent=hasProfileAboutContent(data,profilePhotos,profileEmbeds);
  if (!hasContent) return null;
  return <section className="pp-about" aria-label="About and connections"><h2 className="pp-about__heading">About</h2>
    {!!data.roles?.length && <div className="pp-about__group"><h3>Community roles</h3><ul className="pp-about__tags">{data.roles.map(role=><li key={role}>{role}</li>)}</ul></div>}
    {!!data.talents?.length && <div className="pp-about__group"><h3>What I do</h3><ul className="pp-about__tags">{data.talents.map(talent=><li key={talent}>{talent}</li>)}</ul></div>}
    {!!data.standFor?.length && <div className="pp-about__group"><h3>What I stand for</h3><ul className="pp-about__tags">{data.standFor.map(value=><li key={value}>{value}</li>)}</ul></div>}
    {!!socials.length && <div className="pp-about__group"><h3>Find me</h3><ul className="pp-about__links">{socials.map(({platform,href})=><li key={platform.key}><a href={href} target={href.startsWith('mailto:')?undefined:'_blank'} rel="noopener noreferrer">{platform.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul></div>}
    {(!!venues.length || business) && <details className="pp-about__disclosure"><summary>Places and connections</summary><ul className="pp-about__links">{venues.map(venue=><li key={venue.id}><Link href={`/directory/${venue.id}`}>{venue.name}</Link></li>)}</ul>{business && <div className="pp-about__group"><h3>{business.name}</h3>{business.description && <p>{business.description}</p>}{business.neighborhood && <p>{business.neighborhood}</p>}<Link href={`/directory/${business.id}`}>View place</Link>{publicUrl(business.website) && <a href={publicUrl(business.website)!} target="_blank" rel="noopener noreferrer">Website ↗</a>}</div>}</details>}
    {media && <details className="pp-about__disclosure"><summary>{media.title || 'Music and media'}</summary>{media.blurb && <p>{media.blurb}</p>}{media.meta && <p className="pp-about__meta">{media.meta}</p>}<ul className="pp-about__links">{media.platformLinks?.map(link=>publicUrl(link.href)?<li key={link.href}><a href={publicUrl(link.href)!} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></li>:null)}</ul>{media.items?.map(item=><div className="pp-about__media" key={item.id}><h3>{item.title}</h3>{item.meta && <p className="pp-about__meta">{item.meta}</p>}{publicUrl(item.audioUrl) && <audio controls preload="none" aria-label={item.title} src={publicUrl(item.audioUrl)!}/>} {item.embedSrc && <MediaEmbed src={item.embedSrc} title={item.title}/>}</div>)}</details>}
    {!!profileEmbeds.length && <div className="pp-about__group"><h3>Players</h3>{profileEmbeds.map(embed=><MediaEmbed key={embed.id} src={embed.src} title={embed.title}/>)}</div>}
    {!!profilePhotos.length && <details className="pp-about__disclosure"><summary>Photos</summary><div className="pp-about__photos">{profilePhotos.map((photo,index)=>publicUrl(photo.url)?<figure key={`${photo.url}-${index}`}><img src={publicUrl(photo.url)!} alt={photo.caption || `Photo shared by ${data.displayName || data.username}`} loading="lazy" decoding="async" width="360" height="270"/>{photo.caption && <figcaption>{photo.caption}</figcaption>}</figure>:null)}</div></details>}
    {Boolean(data.pup || data.packmates?.length || data.handlers?.length) && <details className="pp-about__disclosure"><summary>My pack</summary>{data.pup && <div className="pp-about__group"><h3>{data.pup.name || 'Pup profile'}</h3><dl>{[['Hood',data.pup.hood],['Role',data.pup.role],['Looking for',data.pup.lookingFor]].map(([label,value])=>value?<div key={label}><dt>{label}</dt><dd>{value}</dd></div>:null)}</dl></div>}<People title="Packmates" people={data.packmates}/><People title="Handlers" people={data.handlers}/></details>}
  </section>;
}
