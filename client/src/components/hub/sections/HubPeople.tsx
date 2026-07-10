import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";

type Person = {
  key: string;
  name: string;
  handle: string;
  venue: string;
  ring?: string | null;
  avatarChoice?: number;
};

const PEOPLE: Person[] = [
  { key: "marisolv", name: "Marisol Vega", handle: "@marisol", venue: "Ankeny Alley", ring: "lesbian" },
  { key: "devo", name: "Dev Okafor", handle: "@devo", venue: "PrideNW", ring: "gay-men" },
  { key: "junop", name: "Juno Park", handle: "@juno", venue: "CC Slaughters", ring: "nonbinary" },
  { key: "samw", name: "Sam Wu", handle: "@samwu", venue: "North Park Blocks", ring: "transgender" },
  { key: "rivercz", name: "River Cruz", handle: "@river", venue: "Stag PDX", ring: "bisexual" },
  { key: "adal", name: "Ada Lume", handle: "@adalume", venue: "NE Portland", ring: "pansexual" },
];

type PeopleTab = "following" | "followers" | "discover";

const TABS: Array<{ key: PeopleTab; label: string }> = [
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "discover", label: "Discover" },
];

export default function HubPeople() {
  const [tab, setTab] = useState<PeopleTab>("following");
  const [following, setFollowing] = useState<Record<string, boolean>>({
    marisolv: true,
    devo: true,
    junop: true,
    samw: false,
    rivercz: false,
    adal: false,
  });

  const toggleFollow = (key: string) => setFollowing((prev) => ({ ...prev, [key]: !prev[key] }));

  let peopleList = PEOPLE;
  if (tab === "following") peopleList = PEOPLE.filter((p) => following[p.key]);
  else if (tab === "discover") peopleList = PEOPLE.filter((p) => !following[p.key]);

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your community
      </div>
      <h1 className="h1">People</h1>
      <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", margin: "20px 0 22px" }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`seg${tab === t.key ? " on" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, border: "1px solid var(--panel-border)", borderRadius: 12, overflow: "hidden" }}>
        {peopleList.length === 0 && (
          <div className="kick" style={{ padding: 24, textAlign: "center" }}>
            {tab === "followers" ? "Followers coming soon." : "Nobody here yet."}
          </div>
        )}
        {peopleList.map((p) => {
          const isFollowing = following[p.key];
          return (
            <article
              key={p.key}
              className="rowin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "15px 18px",
                background: "var(--panel-card)",
                borderBottom: "1px solid var(--panel-border)",
              }}
            >
              <UserAvatar displayName={p.name} avatarRing={p.ring} avatarChoice={p.avatarChoice} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff", textTransform: "uppercase", lineHeight: 1 }}>
                  {p.name}
                </div>
                <div className="kick" style={{ letterSpacing: ".06em", marginTop: 5 }}>
                  {p.handle} · {p.venue}
                </div>
              </div>
              <button type="button" className={`foll${isFollowing ? " on" : ""}`} onClick={() => toggleFollow(p.key)}>
                {isFollowing ? "Following" : "Follow"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}