// src/components/MapShell.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import maplibregl, { type Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { EventGeneral, GroupKey, Edition } from "../types";
import {
  PROVINCE_CENTROIDS,
  normalizeProvince,
  UNKNOWN_PROVINCE,
} from "../lib/map-provinces";
import { CONFIG } from "../lib/config";
import { supabase } from "../lib/supabaseClient";
import { getEditionStatus } from "../lib/editionUtils";
import { ModalShell } from "./ui/ModalShell";
import { Button } from "./ui/Button";
import { Input, Select } from "./ui/Input";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { LayersIcon } from "../components/Icons";

type LngLat = { lat: number; lng: number };

interface MapShellProps {
  events: (EventGeneral & { activeEdition?: Edition; hasActiveEdition?: boolean })[];
  selectedEventId?: string;
  onMarkerClickId?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  temporaryPin?: LngLat | null;
  activeGroup?: GroupKey;
  showPastEvents?: boolean;
  onSuggestLocation?: (coords: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [-3.7038, 40.4168];
const DEFAULT_ZOOM = 5.3;

const STYLE_URL = CONFIG.MAPTILER.STYLE_URL(CONFIG.MAPTILER.KEY);

// Sources
const EVENTS_SOURCE_ID = "events-source";
const PROVINCES_SOURCE_ID = "provinces-source";
const TEMP_SOURCE_ID = "temp-pin-source";
const MUNICIPALITIES_SOURCE_ID = "municipalities-source";
const ADMIN_MOVE_SOURCE_ID = "admin-move-source";

// Layers
const LAYER_INACTIVE = "events-inactive";
const LAYER_ACTIVE = "events-active";
const LAYER_PROVINCES = "events-provinces-circle";
const LAYER_PROVINCES_COUNT = "events-provinces-count";
const TEMP_LAYER_ID = "temp-pin-layer";
const LAYER_MUNICIPALITIES = "municipalities-circle";
const ADMIN_MOVE_LAYER_ID = "admin-move-layer";



export const MapShell: React.FC<MapShellProps> = ({
  events,
  selectedEventId,
  onMarkerClickId,
  onMapClick,
  temporaryPin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // ====== ADMIN check ======
  const isAdmin = useIsAdmin();

  // 1) Events GeoJSON
  const eventsGeojson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: (events ?? [])
        .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lng))
        .map((e) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [e.lng, e.lat] },
          properties: {
            id: e.id,
            name: e.name,
            category: e.category,
            group_key: e.group_key,
            province: e.province,
            hasActiveEdition: !!e.hasActiveEdition,
            status: getEditionStatus((e as any).activeEdition),
          },
        })),
    } as GeoJSON.FeatureCollection;
  }, [events]);

  // 2) Provincias agregado
  const provincesGeojson = useMemo(() => {
    const counts = new Map<string, number>();

    for (const e of events ?? []) {
      const norm = normalizeProvince(e.province);
      if (PROVINCE_CENTROIDS[norm]) {
        counts.set(norm, (counts.get(norm) || 0) + 1);
      }
    }

    const features = Array.from(counts.entries()).map(([key, count]) => {
      const centroid = PROVINCE_CENTROIDS[key] || UNKNOWN_PROVINCE;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [centroid.lng, centroid.lat] },
        properties: {
          province_name: centroid.name,
          count,
        },
      };
    });

    return {
      type: "FeatureCollection",
      features: features as any[],
    } as GeoJSON.FeatureCollection;
  }, [events]);

  // 3) Municipios layer is fully disabled for now as it's broken
  const municipalitiesGeojson = useMemo(() => ({
    type: "FeatureCollection",
    features: [],
  } as GeoJSON.FeatureCollection), []);

  // Helper: idempotente
  // ✅ FIX: incluye showMunicipalities en deps porque se usa en layout.visibility
  const ensureResources = useCallback(
    (map: MLMap) => {
      // SOURCES
      if (!map.getSource(EVENTS_SOURCE_ID)) {
        map.addSource(EVENTS_SOURCE_ID, {
          type: "geojson",
          data: eventsGeojson as any,
          cluster: false,
        });
      }
      if (!map.getSource(PROVINCES_SOURCE_ID)) {
        map.addSource(PROVINCES_SOURCE_ID, {
          type: "geojson",
          data: provincesGeojson as any,
        });
      }
      if (!map.getSource(MUNICIPALITIES_SOURCE_ID)) {
        map.addSource(MUNICIPALITIES_SOURCE_ID, {
          type: "geojson",
          data: municipalitiesGeojson as any,
          cluster: false,
        });
      }
      if (!map.getSource(TEMP_SOURCE_ID)) {
        map.addSource(TEMP_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }
      if (!map.getSource(ADMIN_MOVE_SOURCE_ID)) {
        map.addSource(ADMIN_MOVE_SOURCE_ID, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
      }

      // LAYERS
      // Provincias (0-6)
      if (!map.getLayer(LAYER_PROVINCES)) {
        map.addLayer({
          id: LAYER_PROVINCES,
          type: "circle",
          source: PROVINCES_SOURCE_ID,
          maxzoom: 6,
          paint: {
            "circle-radius": ["step", ["get", "count"], 15, 10, 20, 50, 25, 100, 35],
            "circle-color": "#f59e0b",
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }
      if (!map.getLayer(LAYER_PROVINCES_COUNT)) {
        map.addLayer({
          id: LAYER_PROVINCES_COUNT,
          type: "symbol",
          source: PROVINCES_SOURCE_ID,
          maxzoom: 6,
          layout: {
            "text-field": ["to-string", ["get", "count"]],
            "text-size": 14,
          },
          paint: { "text-color": "#ffffff" },
        });
      }

      // Municipios (6+)
      if (!map.getLayer(LAYER_MUNICIPALITIES)) {
        const firstSymbol = map.getStyle().layers?.find((l) => l.type === "symbol")?.id;

        map.addLayer(
          {
            id: LAYER_MUNICIPALITIES,
            type: "circle",
            source: MUNICIPALITIES_SOURCE_ID,
            minzoom: 6,
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                6, 1.2,
                8, 2.0,
                10, 3.2,
                12, 4.6,
                14, 6.2,
                16, 7.5,
              ],
              "circle-color": "#64748b",
              "circle-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                6, 0.3,
                10, 0.6,
              ],
              "circle-stroke-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                6, 0.4,
                12, 0.8,
                16, 1.2,
              ],
              "circle-stroke-color": "rgba(255,255,255,0.18)",
            },
            layout: {
              visibility: "none",
            },
          },
          firstSymbol
        );
      }

      // Events (6+)
      // Instead of ACTIVE/INACTIVE layers, we now use a single dynamic layer
      // OR multiple layers for better control if needed.
      // Let's use a single layer with status-based colors.
      if (!map.getLayer(LAYER_ACTIVE)) {
        map.addLayer({
          id: LAYER_ACTIVE,
          type: "circle",
          source: EVENTS_SOURCE_ID,
          minzoom: 6,
          paint: {
            "circle-radius": [
              "case",
              ["==", ["get", "id"], selectedEventId ?? ""],
              7,
              4.5,
            ],
            "circle-color": [
              "case",
              ["==", ["get", "id"], selectedEventId ?? ""],
              "#ffffff",
              [
                "match",
                ["get", "status"],
                "upcoming",
                "#2563eb",
                "live",
                "#ef4444",
                "past",
                "#9ca3af",
                "#9ca3af", // default
              ],
            ],
            "circle-stroke-width": [
              "case",
              ["==", ["get", "id"], selectedEventId ?? ""],
              2,
              1,
            ],
            "circle-stroke-color": "#1f2937",
          },
        });
      }

      // Temp pin (externo)
      if (!map.getLayer(TEMP_LAYER_ID)) {
        map.addLayer({
          id: TEMP_LAYER_ID,
          type: "circle",
          source: TEMP_SOURCE_ID,
          paint: {
            "circle-radius": 8,
            "circle-color": "#eab308",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      // Admin move preview pin (verde)
      if (!map.getLayer(ADMIN_MOVE_LAYER_ID)) {
        map.addLayer({
          id: ADMIN_MOVE_LAYER_ID,
          type: "circle",
          source: ADMIN_MOVE_SOURCE_ID,
          paint: {
            "circle-radius": 7,
            "circle-color": "#22c55e",
            "circle-opacity": 0.9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }
    },
    [eventsGeojson, provincesGeojson, municipalitiesGeojson, selectedEventId]
  );

  // Create map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: false,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      if (onMapClick) {
        map.on("click", (e) => onMapClick(e.lngLat.lat, e.lngLat.lng));
      }

      map.on("load", () => {
        ensureResources(map);
        map.resize();
        setIsMapLoaded(true);
      });

      map.on("styledata", () => ensureResources(map));

      map.on("error", (e) => {
        console.error("❌ MapLibre error:", e);
        const msg = String(e?.error?.message || "").toLowerCase();
        if (msg.includes("context") || msg.includes("webgl")) setMapError("WebGL Context Lost");
      });

      // Click events
      const handleEventClick = (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id;
        if (id) onMarkerClickId?.(id);
      };
      map.on("click", LAYER_ACTIVE, handleEventClick);

      // Click provincias -> zoom
      map.on("click", LAYER_PROVINCES, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const coords = (f.geometry as any).coordinates;
        map.easeTo({ center: coords, zoom: 7, duration: 800 });
      });

      // Click municipio is disabled

      // Cursor pointer
      const setPointer = () => (map.getCanvas().style.cursor = "pointer");
      const unsetPointer = () => (map.getCanvas().style.cursor = "");

      [LAYER_ACTIVE, LAYER_PROVINCES, LAYER_MUNICIPALITIES].forEach((l) => {
        map.on("mouseenter", l, setPointer);
        map.on("mouseleave", l, unsetPointer);
      });

      const t = window.setTimeout(() => map.resize(), 200);

      return () => {
        window.clearTimeout(t);
        map.remove();
        mapRef.current = null;
      };
    } catch (err: any) {
      console.error("Critical Map Init Error:", err);
      setMapError(err?.message || "Failed to initialize map");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Update sources data
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    (map.getSource(EVENTS_SOURCE_ID) as any)?.setData(eventsGeojson);
    (map.getSource(PROVINCES_SOURCE_ID) as any)?.setData(provincesGeojson);
    (map.getSource(MUNICIPALITIES_SOURCE_ID) as any)?.setData(municipalitiesGeojson);
  }, [eventsGeojson, provincesGeojson, municipalitiesGeojson]);

  // Update selection paint (selectedEventId)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateLayer = (layerId: string) => {
      if (!map.getLayer(layerId)) return;

      map.setPaintProperty(layerId, "circle-radius", [
        "case",
        ["==", ["get", "id"], selectedEventId ?? ""],
        7,
        4.5,
      ]);

      map.setPaintProperty(layerId, "circle-color", [
        "case",
        ["==", ["get", "id"], selectedEventId ?? ""],
        "#ffffff",
        [
          "match",
          ["get", "status"],
          "upcoming",
          "#2563eb",
          "live",
          "#ef4444",
          "past",
          "#9ca3af",
          "#9ca3af", // default
        ],
      ]);

      map.setPaintProperty(layerId, "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], selectedEventId ?? ""],
        2,
        1,
      ]);
    };

    updateLayer(LAYER_ACTIVE);
  }, [selectedEventId]);

  // Temp pin (externo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource(TEMP_SOURCE_ID)) return;

    (map.getSource(TEMP_SOURCE_ID) as any).setData({
      type: "FeatureCollection",
      features: temporaryPin
        ? [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [temporaryPin.lng, temporaryPin.lat] },
            properties: {},
          },
        ]
        : [],
    });
  }, [temporaryPin]);

  if (mapError) {
    return (
      <div className="absolute inset-0 z-0 bg-[var(--bg-primary)] flex flex-col items-center justify-center text-[var(--text-primary)] p-6">
        <div className="text-center space-y-4">
          <p className="text-[var(--danger)] font-bold">Map failed to load</p>
          <p className="text-xs text-[var(--text-muted)]">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[var(--bg-tertiary)] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <div ref={containerRef} className="absolute inset-0 bg-[var(--bg-primary)]" />

      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-primary)]/50 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
        </div>
      )}
    </div>
  );
};
