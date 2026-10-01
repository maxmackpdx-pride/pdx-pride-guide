import type { CSSProperties } from "react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "wouter";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import "./TodayLocationCard.css";

export type TodayLocation = { key: string; name: string; room: "OutZide" | "Placez"; detail: string; href: string };

export default function TodayLocationCard({ location }: { location: TodayLocation }) {
  return <Link href={location.href} className="today-location pdx-glass-card pdx-glass-rebind" style={{ "--c": location.room === "OutZide" ? "var(--room-outz)" : "var(--room-placez)" } as CSSProperties}>
    <div className="today-location__art" aria-hidden="true"><ResourceCardMotif name={location.name} category={location.room === "OutZide" ? "outzide" : "community"} /></div>
    <div className="today-location__body">
      <p className="today-location__room">Explore {location.room}</p>
      <h3>{location.name}</h3>
      <p className="today-location__detail"><MapPin size={18} aria-hidden="true" />{location.detail}</p>
      <span className="today-location__go">Explore this place <ArrowUpRight size={18} aria-hidden="true" /></span>
    </div>
  </Link>;
}
