/** A readable name fallback when company artwork is unavailable. */
export function CompanyNameMark({ name }: { name: string }) {
  const words = name.trim().toUpperCase().split(/\s+/);
  const choices = words.slice(1).map((_, index) => [words.slice(0, index + 1).join(" "), words.slice(index + 1).join(" ")]);
  const lines = choices.length
    ? choices.reduce((best, next) => Math.abs(next[0].length - next[1].length) < Math.abs(best[0].length - best[1].length) ? next : best)
    : [words[0].slice(0, Math.ceil(words[0].length / 2)), words[0].slice(Math.ceil(words[0].length / 2))];
  const fontSize = Math.min(76, 330 / (Math.max(...lines.map(line => line.length)) * 0.55));
  return <svg className="pdxPlace__logo rg-name-mark" viewBox="0 0 360 180" role="img" aria-label={name}>
    {lines.map((line, index) => <text key={index} x="180" y={index ? 145 : 70} textAnchor="middle" fill="#fff" fontFamily="Barlow Condensed, sans-serif" fontWeight="900" fontSize={fontSize}>{line}</text>)}
  </svg>;
}
