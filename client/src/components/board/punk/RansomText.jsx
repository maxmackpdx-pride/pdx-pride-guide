import React from 'react';
import { ransomLetters, ransomContrast } from './ransomStyles.mjs';
export { ransomLetters, ransomContrast } from './ransomStyles.mjs';

export function RansomText({ text, seed = text, contrast = ransomContrast(seed) }) {
  return <span className="ransom-copy" data-cut-contrast={contrast} aria-label={String(text)}>{ransomLetters(text, seed, contrast).map((letter, i) => /\s/.test(letter.char) ? ' ' : <em key={i} className="ransom-letter" data-cut-style={letter.style} data-cut-palette={letter.palette} aria-hidden="true" style={{fontFamily:`CutMix${letter.style}, BoardzHouzText, sans-serif`,fontPalette:`--cut-mix-${letter.style.toLowerCase()}-${letter.palette}`,color:contrast==='light'?'#000':'#fff'}}>{letter.char}</em>)}</span>;
}
