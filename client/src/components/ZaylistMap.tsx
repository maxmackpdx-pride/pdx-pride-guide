import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { maplibre } from "@/lib/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { createMapWithStyleRecovery, observeMapSize } from "../../public/map-foundation/lifecycle.js";
import type { IncidentalMapMemory } from "@/hooks/useIncidentalMap";
import { cartoDarkVectorStyleUrl, cartoTransformRequest, mixHex } from "@/lib/mapTiles";
import "./ZaylistMap.css";

type Point = [longitude: number, latitude: number];
type Surface = { map: maplibre.Map; interactive: boolean };
const MapContext = createContext<Surface | null>(null);

export function useZaylistMap() {
  return useContext(MapContext)?.map ?? null;
}

interface MapProps {
  center: Point;
  zoom: number;
  ariaLabel: string;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: [Point, Point];
  allow3D?: boolean;
  interactive?: boolean;
  scrollZoom?: boolean;
  zoomControl?: boolean;
  memory?: IncidentalMapMemory;
  accent?: string | null;
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

/** A native MapLibre viewport for embedded maps. Public point props use longitude first. */
export function ZaylistMap({
  center: [longitude, latitude], zoom, minZoom, maxZoom, maxBounds, ariaLabel,
  allow3D = false, interactive = true, scrollZoom = false, zoomControl = false, memory, accent,
  className, style, children,
}: MapProps) {
  const node = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibre.Map | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const west = maxBounds?.[0][0], south = maxBounds?.[0][1];
  const east = maxBounds?.[1][0], north = maxBounds?.[1][1];

  useEffect(() => {
    if (!node.current) return;
    const saved = memory?.current;
    setFailed(false);
    const options: maplibre.MapOptions = {
      container: node.current,
      style: cartoDarkVectorStyleUrl(),
      transformRequest: cartoTransformRequest,
      center: saved ? [saved.center[1], saved.center[0]] : [longitude, latitude],
      zoom: saved?.zoom ?? zoom,
      ...(minZoom !== undefined ? { minZoom } : {}),
      ...(maxZoom !== undefined ? { maxZoom } : {}),
      ...(west !== undefined && south !== undefined && east !== undefined && north !== undefined
        ? { maxBounds: [[west, south], [east, north]] } : {}),
      interactive,
      maxPitch: allow3D ? 85 : 0,
      dragRotate: allow3D,
      touchPitch: allow3D,
      scrollZoom: interactive && scrollZoom,
      attributionControl: false,
    };
    let next: maplibre.Map;
    try {
      next = createMapWithStyleRecovery(options, { library: maplibre });
    } catch {
      setFailed(true);
      return;
    }
    next.addControl(new maplibre.AttributionControl({ compact: false }), interactive ? "bottom-right" : "top-right");
    if (interactive && zoomControl) {
      next.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-left");
    }
    const record = () => {
      if (!memory) return;
      const point = next.getCenter();
      memory.current = { center: [point.lat, point.lng], zoom: next.getZoom() };
    };
    let loaded = false;
    const timeout = window.setTimeout(() => setFailed(true), 20000);
    const ready = () => {
      loaded = true;
      window.clearTimeout(timeout);
      setFailed(false);
    };
    const unavailable = (event: maplibre.ErrorEvent) => {
      if (!loaded && !("sourceId" in event) && !("tile" in event)) setFailed(true);
    };
    next.on("moveend", record);
    next.on("load", ready);
    next.on("error", unavailable);
    if (typeof ResizeObserver !== "undefined") observeMapSize(next);
    setMap(next);
    return () => {
      window.clearTimeout(timeout);
      next.off("moveend", record);
      next.off("load", ready);
      next.off("error", unavailable);
      next.remove();
      setMap(null);
    };
  }, [longitude, latitude, zoom, minZoom, maxZoom, west, south, east, north, allow3D, interactive,
    scrollZoom, zoomControl, memory, attempt]);

  useEffect(() => {
    if (!map || !accent) return;
    const originals = new Map<string, () => void>();
    const tint = (id: string, property: "fill-color" | "text-color", value: string) => {
      if (!map.getLayer(id)) return;
      const base = map.getPaintProperty(id, property);
      originals.set(id, () => {
        if (map.getLayer(id)) map.setPaintProperty(id, property, base);
      });
      map.setPaintProperty(id, property, value);
    };
    const apply = () => {
      originals.clear();
      tint("water", "fill-color", mixHex("#2C353C", accent, 0.22));
      const park = mixHex("#0e0e0e", accent, 0.16);
      for (const id of ["park_national_park", "park_nature_reserve", "landcover"]) tint(id, "fill-color", park);
      tint("watername_lake", "text-color", mixHex("#8a8a8a", accent, 0.45));
    };
    if (map.isStyleLoaded()) apply();
    map.on("style.load", apply);
    return () => {
      map.off("style.load", apply);
      if (map.getStyle()) for (const restore of originals.values()) restore();
    };
  }, [map, accent]);

  return <div className={className ? `zaylist-map ${className}` : "zaylist-map"} style={style} role="region" aria-label={ariaLabel}>
    <div className="zaylist-map__canvas" ref={node}/>
    {map && <MapContext.Provider value={{map, interactive}}>{children}</MapContext.Provider>}
    {failed && <div className="zaylist-map__recovery" role="status">
      <span>Map unavailable.</span>
      <button type="button" onClick={() => setAttempt(n => n + 1)}>Retry map</button>
    </div>}
  </div>;
}

interface MarkerProps {
  position: Point;
  label: string;
  className?: string;
  anchor?: maplibre.MarkerOptions["anchor"];
  offset?: maplibre.MarkerOptions["offset"];
  children: ReactNode;
  popup?: ReactNode;
  popupClassName?: string;
  popupMaxWidth?: string;
}

export function ZaylistMapMarker({
  position: [longitude, latitude], label, className, anchor = "center", offset,
  children, popup, popupClassName, popupMaxWidth,
}: MarkerProps) {
  const surface = useContext(MapContext);
  const map = surface?.map;
  const active = !!surface?.interactive && popup != null;
  const [hosts, setHosts] = useState<{ pin: HTMLElement; content: HTMLElement | null } | null>(null);
  const dx = Array.isArray(offset) ? offset[0] : offset?.x ?? 0;
  const dy = Array.isArray(offset) ? offset[1] : offset?.y ?? 0;

  useEffect(() => {
    if (!map) return;
    const pin: HTMLElement = document.createElement(active ? "button" : "span");
    pin.className = className ? `zaylist-map__marker ${className}` : "zaylist-map__marker";
    if (pin instanceof HTMLButtonElement) pin.type = "button";
    const marker = new maplibre.Marker({ element: pin, anchor, offset: [dx, dy] }).setLngLat([longitude, latitude]);
    let content: HTMLDivElement | null = null;
    // Map pointer clicks check drag distance. A keyboard activation has no pointer origin.
    const activate = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) marker.togglePopup();
    };
    if (active) {
      content = document.createElement("div");
      const bubble = new maplibre.Popup({ className: popupClassName, maxWidth: popupMaxWidth ?? "280px", offset: 12 });
      const dismiss = (event: KeyboardEvent) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        bubble.remove();
        pin.focus({ preventScroll: true });
      };
      pin.setAttribute("aria-expanded", "false");
      bubble.on("open", () => {
        pin.setAttribute("aria-expanded", "true");
        pin.setAttribute("data-owns-escape", "");
        pin.addEventListener("keydown", dismiss);
        const panel = bubble.getElement();
        panel.setAttribute("data-owns-escape", "");
        panel.addEventListener("keydown", dismiss);
      });
      bubble.on("close", () => {
        pin.setAttribute("aria-expanded", "false");
        pin.removeAttribute("data-owns-escape");
        pin.removeEventListener("keydown", dismiss);
        bubble.getElement()?.removeEventListener("keydown", dismiss);
      });
      marker.setPopup(bubble.setDOMContent(content));
      pin.addEventListener("keydown", activate);
    }
    marker.addTo(map);
    // MapLibre applies its localized generic marker name when a pin joins the map.
    pin.setAttribute("aria-label", label);
    pin.setAttribute("role", active ? "button" : "img");
    setHosts({ pin, content });
    return () => {
      pin.removeEventListener("keydown", activate);
      marker.remove();
      setHosts(null);
    };
  }, [map, active, longitude, latitude, label, className, anchor, dx, dy, popupClassName, popupMaxWidth]);

  return hosts && <>{createPortal(children, hosts.pin)}{hosts.content && createPortal(popup, hosts.content)}</>;
}
