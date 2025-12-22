import React, { useMemo, useState } from "react";
import type { MapEvent } from "../data/events";

interface BottomEventCardProps {
    event: MapEvent | null;
    onClose: () => void;
    canDelete?: boolean;
    onDelete?: (id: string) => Promise<void>;
    onAddEdition?: () => void; // New prop
}

export const BottomEventCard: React.FC<BottomEventCardProps> = ({
    event,
    onClose,
    canDelete = false,
    onDelete,
    onAddEdition
}) => {
    const [deleting, setDeleting] = useState(false);

    // ✅ Hook SIEMPRE se ejecuta (aunque event sea null)
    const dateLabel = useMemo(() => {
        if (!event) return "";

        const mode = event.date_mode ?? "none";
        const text = (event.date_text ?? "").trim();

        if (mode === "none") return "";
        if (mode === "exact") {
            // If looks like ISO YYYY-MM-DD, format it? 
            // For now just return raw text or basic format
            return text;
        }

        if (mode === "approx") return `Aprox: ${text}`;
        return text; // exact
    }, [event?.date_mode, event?.date_text, event]);

    // ✅ Después de los hooks, ya podemos salir si no hay event
    if (!event) return null;

    const canShowDelete = canDelete && typeof onDelete === "function";

    return (
        <div className="absolute bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-xl font-bold text-white leading-tight">
                        {event.name}
                    </h3>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-1">
                        {event.group}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
                >
                    ✕
                </button>
            </div>

            <p className="text-sm text-white/80 mb-4">
                {event.venue && <span className="block opacity-70">📍 {event.venue}</span>}
                {event.city && <span className="block opacity-70">🏙 {event.city}</span>}
            </p>

            <p className="text-sm text-white mb-4">
                <span className="font-semibold text-white/60">Fecha:</span> <span className="text-yellow-400 font-medium ml-1">{dateLabel || "Por confirmar"}</span>
            </p>

            <div className="flex gap-2 justify-end">
                {onAddEdition && (
                    <button
                        onClick={onAddEdition}
                        className="bg-white/10 text-white py-2 px-4 rounded-md hover:bg-white/20 transition font-semibold text-sm"
                    >
                        + Edición
                    </button>
                )}

                {canShowDelete && (
                    <button
                        onClick={async () => {
                            if (deleting) return;
                            const ok = confirm("¿Borrar este evento?");
                            if (!ok) return;

                            try {
                                setDeleting(true);
                                await onDelete!(event.id);
                                onClose();
                            } finally {
                                setDeleting(false);
                            }
                        }}
                        className="bg-red-500/90 text-white py-2 px-4 rounded-md hover:bg-red-500 transition font-semibold disabled:opacity-60 text-sm"
                        disabled={deleting}
                    >
                        {deleting ? "..." : "Borrar"}
                    </button>
                )}
            </div>
        </div>
    );
};
