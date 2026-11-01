import type {ReactNode} from 'react';
/** The approved shaped portrait bezel is the light network's source. */
export function ProfilePortrait({username,children,compact=false}:{username:string;children:ReactNode;compact?:boolean}){return <div className={`profile-portrait-bezel${compact?' is-compact':''}`} data-profile-portrait-frame><div className="profile-portrait-bezel__screen">{children}</div><span className="profile-portrait-username">@{username}</span><span className="profile-portrait-contact" data-profile-portrait-contact data-thread-contact="portrait" aria-hidden="true"/></div>;}
