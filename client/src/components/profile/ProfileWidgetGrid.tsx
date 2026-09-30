import { useState, type ReactNode } from "react";
import { DraggableWidgetGrid, type WidgetItem } from "@/components/ui/draggable-widget-grid";

export type ProfileSection = WidgetItem & { content: ReactNode };

export default function ProfileWidgetGrid({ username, sections }: { username: string; sections: ProfileSection[] }) {
  const storageKey = `zaylist:profile-layout:v1:${username}`;
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? [...new Set(saved.filter((id): id is string => typeof id === "string"))] : [];
    } catch { return []; }
  });
  const byId = new Map(sections.map(section => [section.id, section]));
  const ids = [...order.filter(id => byId.has(id)), ...sections.map(s => s.id).filter(id => !order.includes(id))];
  const items = ids.map(id => { const { content, ...item } = byId.get(id)!; return item; });
  function save(next: WidgetItem[]) {
    const ids = next.map(item => item.id);
    setOrder(ids);
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
      setNotice("Layout saved on this device.");
    } catch { setNotice("Layout updated for this visit. Device storage is unavailable."); }
  }
  if (!sections.length) return null;
  return (
    <section className="pp-widget-board" aria-label="Profile sections">
      <div className="pp-widget-board__toolbar">
        <p>{editing ? "Drag a section heading to move it. On touch, press and hold. Keyboard: Alt + arrow keys." : "Arrange this profile view. Saved on this device."}</p>
        <div>
          {editing && <button type="button" onClick={() => { save(sections); setRevision(v => v + 1); }}>Reset layout</button>}
          <button type="button" aria-pressed={editing} onClick={() => setEditing(v => !v)}>{editing ? "Done arranging" : "Arrange view"}</button>
        </div>
      </div>
      <span className="sr-only" role="status">{notice}</span>
      <DraggableWidgetGrid
        key={`${revision}:${sections.map(s => s.id).join(",")}`}
        items={items}
        onChange={save}
        editable={editing}
        maxColumns={2}
        cellSize={420}
        gap={24}
        radius={18}
        contentSized
        className={`pp-widget-grid${editing ? " is-editing" : ""}`}
        renderItem={item => byId.get(item.id)?.content}
      />
    </section>
  );
}
