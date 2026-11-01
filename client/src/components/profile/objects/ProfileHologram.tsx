import type {CSSProperties,ReactNode} from 'react';
import './ProfileObjects.css';
export function ProfileHologram({children,label,variant='standard',className='',contactId}:{children:ReactNode;label:string;variant?:string;className?:string;contactId?:string}){
 return <section className={`profile-hologram ${className}`} data-profile-variant={variant} aria-label={label} style={{'--holo-seed':(label.length%7)/7} as CSSProperties}><span className="profile-hologram__grain" aria-hidden="true"/><span className="profile-hologram__contact" data-thread-contact={contactId||label} aria-hidden="true"/>{children}</section>;
}
