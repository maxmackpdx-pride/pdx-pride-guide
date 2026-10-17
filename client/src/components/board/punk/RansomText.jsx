import React from 'react';

const styles = ['Paper', 'Mixed', 'Rough', 'Reverse', 'Loose', 'Ransom'];
function hash(value) {
  return Array.from(value).reduce((n, char) => Math.imul(n ^ char.codePointAt(0), 16777619) >>> 0, 2166136261);
}

// Stable per field and character position: repeated letters can wear different scraps,
// without changing styles when a photo advances or a button is pressed.
export function ransomLetters(text, seed = text) {
  let previous = -1;
  return Array.from(String(text)).map((char, i) => {
    const n = hash(`${seed}:${i}:${char}`);
    let variant = n % styles.length;
    if (variant === previous) variant = (variant + 1 + (n >>> 8) % (styles.length - 1)) % styles.length;
    if (!/\s/.test(char)) previous = variant;
    return { char, style: styles[variant], angle: ((n >>> 5) % 9 - 4) * .8, lift: ((n >>> 13) % 5 - 2) * .013, stretch: .96 + ((n >>> 20) % 6) * .02 };
  });
}

export function RansomText({ text, seed = text }) {
  return <span className="ransom-copy" aria-label={String(text)}>{ransomLetters(text, seed).map((letter, i) => /\s/.test(letter.char) ? ' ' : <em key={i} className="ransom-letter" data-cut-style={letter.style} style={{fontFamily:`CutMix${letter.style}, BoardzHouzText, sans-serif`,fontPalette:`--cut-mix-${letter.style.toLowerCase()}`,'--cut-angle':`${letter.angle}deg`,'--cut-lift':`${letter.lift}em`,'--cut-stretch':letter.stretch}}>{letter.char}</em>)}</span>;
}
