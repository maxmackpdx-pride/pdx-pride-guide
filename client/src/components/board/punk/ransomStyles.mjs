import polarity from './glyph-polarity.mjs';
const styles = ['Regular', 'Mixed', 'Rough', 'Reverse', 'Paper', 'Worn', 'Tall', 'Ransom', 'Distressed', 'Loose'];
function hash(value) {
  return Array.from(String(value)).reduce((n, char) => Math.imul(n ^ char.codePointAt(0), 16777619) >>> 0, 2166136261);
}
// Contrast belongs to the complete field. Line breaks never choose a new polarity.
export function ransomContrast(seed) { return hash(`${seed}:contrast`) % 2 ? 'light' : 'dark'; }
export function ransomLetters(text, seed = text, contrast = ransomContrast(seed)) {
  let previous = -1;
  return Array.from(String(text)).map((char, i) => {
    const n = hash(`${seed}:${i}:${char}`);
    let variant = n % styles.length;
    if (variant === previous) variant = (variant + 1 + (n >>> 8) % (styles.length - 1)) % styles.length;
    if (!/\s/.test(char)) previous = variant;
    const style = styles[variant];
    const sourceDark = polarity[style]?.[String(char.codePointAt(0))] === true;
    return { char, style, contrast, palette: sourceDark === (contrast === 'dark') ? 'normal' : 'inverted' };
  });
}
