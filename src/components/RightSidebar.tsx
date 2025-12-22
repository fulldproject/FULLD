import React, { useState } from "react";
import type { MapEvent } from "../data/events";

export const RightSidebar: React.FC<{
    activeGroup: string;
    events: MapEvent[];
    onSelectEvent: (ev: MapEvent) => void;
}> = ({ activeGroup, events, onSelectEvent }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <aside
            className={`h-full bg-black/80 border-l border-white/10 transition-all duration-300 relative
      ${isOpen ? "w-80" : "w-[12px]"}`}
        >
            {/* Tirador */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute left-[-10px] top-1/2 -translate-y-1/2
                   w-5 h-16 bg-black text-white rounded-l-lg flex items-center justify-center
                   hover:bg-white/20 transition"
            >
                {isOpen ? "<" : ">"}
            </button>

            {isOpen && (
                <div className="p-4 text-white overflow-y-auto h-full">
                    <h1 className="text-xl font-bold">TENDENCIAS</h1>
                    <p className="text-sm opacity-70 mt-1">{activeGroup}</p>

                    <div className="mt-4">
                        <h2 className="text-lg font-semibold mb-2">Eventos</h2>

                        {events.length === 0 && (
                            <p className="text-sm opacity-60">
                                No hay eventos en esta categoría.
                            </p>
                        )}

                        {events.map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => onSelectEvent(ev)}
                                className="p-2 bg-white/10 rounded-lg mb-2 hover:bg-white/20 transition cursor-pointer"
                            >
                                <div className="text-sm font-semibold">{ev.name}</div>
                                <div className="text-xs opacity-70">
                                    {ev.city} • {ev.venue}
                                </div>
                                <div className="text-[11px] opacity-60">
                                    {ev.date_text ?? "Por confirmar"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};
