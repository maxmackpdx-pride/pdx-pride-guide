import { boardMotifOptions, type BoardMotifCategory } from "@shared/boardMotifs";

/** A single optional choice; Mizzed keeps its permanent speech-bubble artwork. */
export default function BoardMotifSetting({ category, value, onChange }: {
  category: BoardMotifCategory;
  value: string;
  onChange: (value: string) => void;
}) {
  if (category === "mizzed") return null;
  return <label className="span">
    {category === "housing" ? "Portland landmark" : "Card artwork"}
    <select className="board-text-field" value={value} onChange={event => onChange(event.target.value)}>
      {boardMotifOptions[category].map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select>
  </label>;
}
