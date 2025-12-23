import React, { useMemo, useState } from "react";
import type { Event } from "../data/events";
import type { GroupKey } from "./Navbar";

type Props = {
    activeGroup: GroupKey;
    events: Event[];
    onSelectEvent: (ev: Event) => void;
    selectedEvent?: Event | null;
};

export const MobileEventSheet: React.FC<Props> = ({
    activeGroup,
    events,
    onSelectEvent,
    selectedEvent,
}) => {
    const [expanded, setExpanded] = useState(false);

    const title = useMemo(() => {
        return `${activeGroup} · ${events.length} eventos`;
    }, [activeGroup, events.length]);

    return (
        <div className="lg:hidden">
            {/* Backdrop cuando está expandido */}
            {expanded && (
                <button
                    aria-label="Cerrar panel"
                    onClick={() => setExpanded(false)}
                    className="fixed inset-0 bg-black/50 z-30"
                />
            )}

            {/* Sheet */}
            <div
                className={[
                    "fixed left-0 right-0 bottom-0 z-40",
                    "bg-[#111] text-white border-t border-white/10",
                    "rounded-t-2xl shadow-2xl",
                    expanded ? "h-[70vh]" : "h-[72px]",
                    "transition-all duration-200",
                ].join(" ")}
            >
                {/* Handle + header */}
                <div
                    className="h-[72px] px-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded((v) => !v)}
                >
                    <div className="flex flex-col">
                        <div className="text-sm font-semibold">{title}</div>
                        <div className="text-xs text-white/60">
                            Toca para {expanded ? "cerrar" : "abrir"}
                        </div>
                    </div>

                    <div className="text-white/70 text-sm">
                        {expanded ? "▼" : "▲"}
                    </div>
                </div>

                {/* Contenido */}
                {expanded && (
                    <div className="h-[calc(70vh-72px)] overflow-y-auto px-2 pb-4">
                        {events.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-white/60">
                                No hay eventos en este grupo.
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {events.map((ev) => {
                                    const isActive = selectedEvent?.id === ev.id;
                                    return (
                                        <li key={ev.id}>
                                            <button
                                                onClick={() => {
                                                    onSelectEvent(ev);
                                                    // opcional: cerrar un poco para volver al mapa
                                                    setExpanded(false);
                                                }}
                                                className={[
                                                    "w-full text-left px-3 py-3 rounded-xl",
                                                    "border border-white/10",
                                                    isActive ? "bg-white/10" : "bg-transparent hover:bg-white/5",
                                                ].join(" ")}
                                            >
                                                <div className="text-sm font-semibold">{ev.name}</div>
                                                <div className="text-xs text-white/60">
                                                    {(ev.city ?? "Sin ciudad")} ·{" "}
                                                    {ev.date_mode === "none" || !ev.date_text
                                                        ? "Por confirmar"
                                                        : ev.date_mode === "approx"
                                                            ? `Aprox: ${ev.date_text}`
                                                            : ev.date_text}
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
