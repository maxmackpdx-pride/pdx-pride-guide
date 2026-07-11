import { useState } from "react";
import { Button } from "@/components/ds";

type PostType = "photo" | "video" | "update" | "checkin";

const POST_TYPES: Array<{ key: PostType; label: string }> = [
  { key: "photo", label: "Photo" },
  { key: "video", label: "Video" },
  { key: "update", label: "Update" },
  { key: "checkin", label: "Check-in" },
];

const PROMPTS: Record<PostType, string> = {
  photo: "Say something about your photo...",
  video: "Say something about your video...",
  update: "What's happening in the scene?",
  checkin: "How is it? Tell people what they are missing...",
};

const DROP_LABELS: Partial<Record<PostType, string>> = {
  photo: "Drop a photo or tap to upload",
  video: "Drop a video or tap to upload",
};

type Props = {
  initialType?: PostType;
};

export default function HubPost({ initialType = "update" }: Props) {
  const [postType, setPostType] = useState<PostType>(initialType);

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Share with the scene
      </div>
      <h1 className="h1">Post Something</h1>
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", marginBottom: 18 }}>
          {POST_TYPES.map((pt) => (
            <button
              key={pt.key}
              type="button"
              className={`seg${postType === pt.key ? " on" : ""}`}
              onClick={() => setPostType(pt.key)}
            >
              {pt.label}
            </button>
          ))}
        </div>
        <textarea className="fin" rows={3} placeholder={PROMPTS[postType]} style={{ resize: "vertical", marginBottom: 14 }} />
        {(postType === "photo" || postType === "video") && (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              border: "1px dashed var(--panel-border-2)",
              borderRadius: 10,
              padding: 32,
              cursor: "pointer",
              color: "var(--board-muted)",
              marginBottom: 16,
            }}
          >
            <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="var(--panel-cyan)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <path d="M12 3v13" />
              <path d="M7 8l5-5 5 5" />
            </svg>
            <span className="kick" style={{ letterSpacing: ".12em" }}>
              {DROP_LABELS[postType]}
            </span>
          </label>
        )}
        {postType === "checkin" && (
          <input className="fin" placeholder="Search a venue or event to check in..." style={{ marginBottom: 16 }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="kick" style={{ letterSpacing: ".1em" }}>
            Public
          </span>
          <div style={{ flex: 1 }} />
          <Button variant="neon" accent="cyan">
            Post it
          </Button>
        </div>
      </div>

      <div className="kick" style={{ margin: "30px 0 16px" }}>
        Your recent posts
      </div>
      <div className="card" style={{ padding: "28px 20px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--board-muted)" }}>
          Nothing posted yet. What you share will show up here.
        </p>
      </div>
    </div>
  );
}