import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { MapEvent } from "../data/events";
import type { GroupKey } from "./Navbar";

const INITIAL_CENTER: [number, number] = [-3.7, 40.4];
const INITIAL_ZOOM = 5;

const STYLE_BY_GROUP_DAY: Record<GroupKey, string> = {
    FULLDFIESTA:
        "https://api.maptiler.com/maps/streets/style.json?key=vMy2OCYCCoICMu0fKVXT",
    FULLDMOTOR:
        "https://api.maptiler.com/maps/outdoor/style.json?key=vMy2OCYCCoICMu0fKVXT",
    FULLDFREESTYLE:
        "https://api.maptiler.com/maps/basic-v2/style.json?key=vMy2OCYCCoICMu0fKVXT",
};

const STYLE_BY_GROUP_NIGHT: Record<GroupKey, string> = {
    FULLDFIESTA:
        "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=vMy2OCYCCoICMu0fKVXT",
    FULLDMOTOR:
        "https://api.maptiler.com/maps/outdoor-v2-dark/style.json?key=vMy2OCYCCoICMu0fKVXT",
    FULLDFREESTYLE:
        "https://api.maptiler.com/maps/basic-v2-dark/style.json?key=vMy2OCYCCoICMu0fKVXT",
};

function getDateLabel(ev: MapEvent): string {
    if (ev.date_mode === "approx") return `Aprox: ${ev.date_text ?? "—"}`;
    if (ev.date_mode === "exact") return ev.date_text ?? "—";
    return "Por confirmar";
}

export const Map: React.FC<{
    events: MapEvent[];
    selectedEvent: MapEvent | null;
    onMarkerClick: (ev: MapEvent) => void;
    activeGroup: GroupKey;

    pickLocationMode?: boolean;
    pickedCoords?: { lat: number; lon: number } | null;
    onPickLocation?: (coords: { lat: number; lon: number }) => void;
    onCancelPickLocation?: () => void;
}> = ({
    events,
    selectedEvent,
    onMarkerClick,
    activeGroup,
    pickLocationMode = false,
    pickedCoords = null,
    onPickLocation,
    onCancelPickLocation,
}) => {
        const mapContainerRef = useRef<HTMLDivElement | null>(null);
        const mapRef = useRef<maplibregl.Map | null>(null);
        const popupRef = useRef<maplibregl.Popup | null>(null);
        const pickMarkerRef = useRef<maplibregl.Marker | null>(null);

        // Guardamos referencias a markers para borrarlos bien
        const markersRef = useRef<maplibregl.Marker[]>([]);

        const [isNight, setIsNight] = useState(false);

        useEffect(() => {
            const checkTime = () => {
                const hour = new Date().getHours();
                setIsNight(hour < 8 || hour >= 20);
            };

            checkTime();
            const interval = setInterval(checkTime, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }, []);

        const currentStyle = isNight
            ? STYLE_BY_GROUP_NIGHT[activeGroup]
            : STYLE_BY_GROUP_DAY[activeGroup];

        // Init map
        useEffect(() => {
            if (!mapContainerRef.current) return;
            if (mapRef.current) return;

            const map = new maplibregl.Map({
                container: mapContainerRef.current,
                style: currentStyle,
                center: INITIAL_CENTER,
                zoom: INITIAL_ZOOM,
            });

            map.addControl(new maplibregl.NavigationControl(), "top-right");

            mapRef.current = map;

            return () => {
                markersRef.current.forEach((m) => m.remove());
                markersRef.current = [];
                pickMarkerRef.current?.remove();
                popupRef.current?.remove();
                map.remove();
                mapRef.current = null;
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        // Change style (y re-resize al terminar de cargar el style)
        useEffect(() => {
            const map = mapRef.current;
            if (!map) return;

            map.setStyle(currentStyle);

            // Cuando el style termina de cargar, forzamos resize (evita recortes / “negro”)
            const onStyleLoaded = () => {
                try {
                    map.resize();
                } catch {
                    // ignore
                }
            };

            map.once("idle", onStyleLoaded);

            return () => {
                map.off("idle", onStyleLoaded);
            };
        }, [currentStyle]);

        // ✅ Resize map when mobile layout changes (sheet snap/drag) + window resize
        useEffect(() => {
            const onLayout = () => {
                if (!mapRef.current) return;
                try {
                    mapRef.current.resize();
                } catch {
                    // ignore
                }
            };

            window.addEventListener("fulld:layout", onLayout);
            window.addEventListener("resize", onLayout);

            // Extra: un resize al montar por si entra “raro”
            const t = window.setTimeout(() => onLayout(), 0);

            return () => {
                window.removeEventListener("fulld:layout", onLayout);
                window.removeEventListener("resize", onLayout);
                window.clearTimeout(t);
            };
        }, []);

        // Draw markers
        useEffect(() => {
            if (!mapRef.current) return;

            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];

            events.forEach((ev) => {
                const el = document.createElement("div");
                el.className = "fulld-marker";
                el.style.width = "14px";
                el.style.height = "14px";
                el.style.borderRadius = "50%";
                el.style.backgroundColor = "#ffdd00";
                el.style.border = "2px solid black";
                el.style.cursor = "pointer";

                el.addEventListener("click", () => onMarkerClick(ev));

                const marker = new maplibregl.Marker({ element: el })
                    .setLngLat([ev.lon, ev.lat])
                    .addTo(mapRef.current!);

                markersRef.current.push(marker);
            });
        }, [events, onMarkerClick]);

        // Fly to selected
        useEffect(() => {
            if (!mapRef.current || !selectedEvent) return;

            mapRef.current.flyTo({
                center: [selectedEvent.lon, selectedEvent.lat],
                zoom: 13,
                speed: 1.5,
                curve: 1.2,
                essential: true,
            });
        }, [selectedEvent]);

        // Popup
        useEffect(() => {
            if (!mapRef.current) return;

            if (!selectedEvent) {
                popupRef.current?.remove();
                popupRef.current = null;
                return;
            }

            if (!popupRef.current) {
                popupRef.current = new maplibregl.Popup({
                    closeButton: true,
                    closeOnClick: false,
                    offset: 16,
                });
            }

            const dateLabel = getDateLabel(selectedEvent);

            const content = `
      <div style="background:#222;color:#fff;padding:8px;border-radius:8px;font-family:sans-serif;min-width:200px;">
        <h3 style="margin:0 0 4px 0;font-size:14px;font-weight:700;">${selectedEvent.name}</h3>
        <p style="margin:0 0 2px 0;font-size:12px;color:#ccc;">
          ${(selectedEvent.city ?? "—")} @ ${(selectedEvent.venue ?? "—")}
        </p>
        <p style="margin:0;font-size:11px;color:#aaa;">
          ${dateLabel}
        </p>
      </div>
    `;

            popupRef.current
                .setLngLat([selectedEvent.lon, selectedEvent.lat])
                .setHTML(content)
                .addTo(mapRef.current);
        }, [selectedEvent]);

        // ✅ Pick mode: click on map (y desactivar drag pan mientras eliges punto)
        useEffect(() => {
            if (!mapRef.current) return;

            const map = mapRef.current;

            if (!pickLocationMode) {
                map.getCanvas().style.cursor = "";
                try {
                    map.dragPan.enable();
                    map.touchZoomRotate.enable();
                } catch {
                    // ignore
                }
                return;
            }

            const handleClick = (e: maplibregl.MapMouseEvent) => {
                const { lng, lat } = e.lngLat;
                onPickLocation?.({ lat, lon: lng });
            };

            map.getCanvas().style.cursor = "crosshair";
            map.on("click", handleClick);

            // mientras está en pick mode, evitamos que el mapa “robe” gestos
            try {
                map.dragPan.disable();
                map.touchZoomRotate.disableRotation();
            } catch {
                // ignore
            }

            return () => {
                map.off("click", handleClick);
                map.getCanvas().style.cursor = "";
                try {
                    map.dragPan.enable();
                    map.touchZoomRotate.enable();
                } catch {
                    // ignore
                }
            };
        }, [pickLocationMode, onPickLocation]);

        // ✅ Green pin for picked coords
        useEffect(() => {
            if (!mapRef.current) return;

            pickMarkerRef.current?.remove();
            pickMarkerRef.current = null;

            if (!pickedCoords) return;

            const el = document.createElement("div");
            el.style.width = "18px";
            el.style.height = "18px";
            el.style.borderRadius = "50%";
            el.style.backgroundColor = "#00ff99";
            el.style.border = "2px solid black";
            el.style.boxShadow = "0 0 0 6px rgba(0,255,153,0.15)";

            pickMarkerRef.current = new maplibregl.Marker({ element: el })
                .setLngLat([pickedCoords.lon, pickedCoords.lat])
                .addTo(mapRef.current);
        }, [pickedCoords]);

        return (
            <div className="flex-1 h-full relative">
                <div ref={mapContainerRef} className="w-full h-full" />

                {pickLocationMode && (
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <div className="px-3 py-2 rounded-lg bg-black/70 text-white text-sm border border-white/10">
                            Click en el mapa para fijar el punto del evento
                        </div>

                        <button
                            onClick={onCancelPickLocation}
                            className="px-3 py-2 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition"
                        >
                            Cancelar
                        </button>

                        {pickedCoords && (
                            <div className="px-3 py-2 rounded-lg bg-black/70 text-white text-xs border border-white/10">
                                Punto: {pickedCoords.lat.toFixed(6)}, {pickedCoords.lon.toFixed(6)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
