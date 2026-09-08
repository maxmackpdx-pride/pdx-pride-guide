import { useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { formatBeachCheckinDateLabel } from "@shared/riverBrats";
import type { OutzFeedKind, OutzFeedPayload } from "@shared/outzFeed";
import "./OutzNewsFeed.css";

const types = { weather: { label: "Weather alerts", color: "#ff8c00" }, post: { label: "Outdoor posts", color: "#39ff14" },
  checkin: { label: "Check-ins", color: "#00ffff" }, carpool: { label: "Carpools", color: "#ff00cc" } };
const stamp = (date: string) => new Date(date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export default function OutzNewsFeed() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<OutzFeedKind | "all">("all");
  const [limit, setLimit] = useState(12);
  const query = useQuery<OutzFeedPayload>({ queryKey: ["/api/outz/feed", user?.id ?? "public"],
    queryFn: () => apiRequest("GET", "/api/outz/feed").then(r => r.json()), refetchInterval: 60_000 });
  const items = (query.data?.items || []).filter(item => filter === "all" || item.kind === filter);
  return <section className="outz-news" aria-labelledby="outz-news-heading">
    <div className="section-title"><div><span className="kicker">From the community + National Weather Service</span><h2 id="outz-news-heading">Outdoor updates</h2></div></div>
    <p className="outz-news__intro">Trip notes, rides, and plans for the week ahead. Major weather alerts cover Oregon and Washington.</p>
    <div className="categories outz-news__filters" role="group" aria-label="Outdoor update type">
      {(["all", "post", "weather", "checkin", "carpool"] as const).map(kind => <button type="button" className="pdx-glass-rebind" key={kind}
        aria-pressed={filter === kind} onClick={() => { setFilter(kind); setLimit(12); }}>{kind === "all" ? "All updates" : types[kind].label}</button>)}
    </div>
    {query.data?.weatherUnavailable && <p className="outz-news__notice" role="status">Weather alerts could not refresh.{query.data.weatherUpdatedAt ? ` Last checked ${stamp(query.data.weatherUpdatedAt)}.` : ""} <a href="https://www.weather.gov/alerts" target="_blank" rel="noopener noreferrer">Check the National Weather Service ↗</a></p>}
    {query.isPending ? <p role="status">Loading outdoor updates…</p> : query.isError ? <div role="status"><p>Outdoor updates couldn’t load.</p><button type="button" onClick={() => query.refetch()}>Try again</button></div> : <>
      <p className="outz-news__meta" role="status">{items.length} {items.length === 1 ? "update" : "updates"} · Posts from the last 30 days · Check-ins and rides for the next week</p>
      {items.length ? <div className="outz-news__list">{items.slice(0, limit).map(item => <article key={item.id} className="outz-news__item pdx-glass-rebind" style={{ "--c": types[item.kind].color } as CSSProperties}>
        <header><span className="kicker">{types[item.kind].label}</span><time dateTime={item.tripDate || item.createdAt}>{item.tripDate ? formatBeachCheckinDateLabel(item.tripDate) : stamp(item.createdAt)}</time></header>
        <h3>{item.title}</h3><p className="outz-news__place">{item.placeName}</p><p className="outz-news__body">{item.body}</p>
        <footer><span>{item.kind === "weather" ? "National Weather Service" : item.author || "Community plans"}{item.endsAt ? ` · Ends ${stamp(item.endsAt)}` : ""}</span>
          {item.kind === "weather" ? <a href={item.href} target="_blank" rel="noopener noreferrer">Read warning ↗</a> : <Link href={item.href}>{item.kind === "checkin" ? "View plans" : item.kind === "carpool" ? "View ride" : "Open post"} →</Link>}</footer>
      </article>)}</div> : <p className="outz-news__empty">{filter === "weather" && !query.data?.weatherUnavailable ? "No active major weather alerts in this feed." : "No updates to show here yet. Open a destination to share a trip note, arrange a ride, or check in."}</p>}
      {items.length > limit && <button type="button" onClick={() => setLimit(n => n + 12)}>Show more updates</button>}
    </>}
  </section>;
}
