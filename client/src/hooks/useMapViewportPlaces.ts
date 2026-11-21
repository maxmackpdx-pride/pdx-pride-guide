import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Business } from "@/pages/Directory";
import {
  cameraToBounds,
  debounceMs,
  pointInBounds,
  type MapBounds,
  type MapCamera,
} from "@shared/placezEventsDrawer";

type DiagnosticsSnapshot = {
  mode?: string;
  center?: [number, number] | { lng: number; lat: number };
  zoom?: number;
  pitch?: number;
  bearing?: number;
};

function readDiagnostics(): MapCamera | null {
  const snapshot = (window as unknown as { __mapReleaseDiagnostics?: { snapshot?: () => DiagnosticsSnapshot } })
    .__mapReleaseDiagnostics?.snapshot?.();
  if (!snapshot || snapshot.mode === "afterz" || snapshot.mode === "zaydark") return null;
  const center = Array.isArray(snapshot.center)
    ? snapshot.center
    : snapshot.center && Number.isFinite(snapshot.center.lng)
      ? [snapshot.center.lng, snapshot.center.lat] as [number, number]
      : null;
  if (!center || !Number.isFinite(snapshot.zoom)) return null;
  return { center, zoom: snapshot.zoom!, pitch: snapshot.pitch, bearing: snapshot.bearing };
}

function mapSize(): { width: number; height: number } {
  const node = document.querySelector<HTMLElement>(".maplibregl-map, .zaylist-unified-map");
  const width = node?.clientWidth || window.innerWidth;
  const height = node?.clientHeight || window.innerHeight;
  return { width, height };
}

export function useMapViewportPlaces(enabled: boolean) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const places = useQuery<Business[]>({
    queryKey: ["/api/directory", "placez-map-in-view"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    let timer = 0;
    const wait = debounceMs();
    const sample = () => {
      const camera = readDiagnostics();
      const { width, height } = mapSize();
      const next = camera ? cameraToBounds(camera, width, height) : null;
      setBounds(current => {
        if (!next && !current) return current;
        if (!next) return current;
        if (
          current &&
          current.west === next.west &&
          current.east === next.east &&
          current.north === next.north &&
          current.south === next.south
        ) return current;
        return next;
      });
    };
    const debounced = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sample, wait);
    };
    sample();
    const id = window.setInterval(debounced, 400);
    window.addEventListener("resize", debounced);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(id);
      window.removeEventListener("resize", debounced);
    };
  }, [enabled]);

  const inView = useMemo(() => {
    const list = places.data ?? [];
    if (!bounds) return [];
    return list.filter(place => {
      if (pointInBounds(place.lat, place.lng, bounds)) return true;
      return (place.locations ?? []).some(location => pointInBounds(location.lat, location.lng, bounds));
    });
  }, [places.data, bounds]);

  return {
    inView,
    bounds,
    loading: enabled && places.isPending,
    error: enabled && places.isError,
    retry: places.refetch,
  };
}
