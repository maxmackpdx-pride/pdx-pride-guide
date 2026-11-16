import {OUTZ_ALPHABET_RANGES, type OutzAlphabetRange} from '@shared/outzAlphabet';
import './OutzAlphabet.css';
export default function OutzAlphabet({value,onChange}:{value:OutzAlphabetRange;onChange:(value:OutzAlphabetRange)=>void}) {
  return <nav className="outz-alphabet" aria-label="Filter destinations by name"><span>Browse A–Z</span><div role="group" aria-label="Destination name range">{OUTZ_ALPHABET_RANGES.map(range=><button type="button" key={range} aria-pressed={value===range} onClick={()=>onChange(range)}>{range}</button>)}</div></nav>;
}
