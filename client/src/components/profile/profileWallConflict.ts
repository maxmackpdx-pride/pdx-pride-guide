import type {ProfileLayout} from '@shared/profileLayout';
/** Reapply only fields that did not change concurrently. Removal is an edit too. */
export function reapplyProfileDraft(saved:ProfileLayout,draft:ProfileLayout,current:ProfileLayout):ProfileLayout|null{
 const serialize=(v:unknown)=>JSON.stringify(v),ids=new Set([...saved.widgets,...draft.widgets].map(w=>w.id)),changed=new Set([...ids].filter(id=>serialize(saved.widgets.find(w=>w.id===id))!==serialize(draft.widgets.find(w=>w.id===id))));
 if([...changed].some(id=>serialize(saved.widgets.find(w=>w.id===id))!==serialize(current.widgets.find(w=>w.id===id))))return null;
 for(const key of ['motion','palette'] as const)if(draft[key]!==saved[key]&&current[key]!==saved[key]&&current[key]!==draft[key])return null;
 return {...current,motion:draft.motion!==saved.motion?draft.motion:current.motion,palette:draft.palette!==saved.palette?draft.palette:current.palette,widgets:[...current.widgets.filter(w=>!changed.has(w.id)),...draft.widgets.filter(w=>changed.has(w.id))]};
}
