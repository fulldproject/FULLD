import React, { useMemo, useState } from "react";
import type { GroupKey } from "./Navbar";

export type NewEventFormData = {
    name: string;
    group: GroupKey;

    city: string;
    venue: string;

    // ✅ FECHA PRO
    date_mode: "none" | "approx" | "exact";
    date_text: string; // solo se usa si approx o exact (en exact guardamos texto o ISO simple)

    // coords vienen del mapa
    lat: number;
    lon: number;
};

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;

    pickedCoords: { lat: number; lon: number } | null;

    onCreateEvent: (data: NewEventFormData) => void | Promise<void>;
    onChangePoint?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
    isOpen,
    onClose,
    onCreateEvent,
    pickedCoords,
    onChangePoint,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        group: "FULLDFIESTA" as GroupKey,
        city: "",
        venue: "",

        date_mode: "none" as "none" | "approx" | "exact",
        date_text: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        if (!pickedCoords) return false;
        if (!formData.name.trim()) return false;
        if (!formData.city.trim()) return false;
        if (!formData.venue.trim()) return false;

        // ✅ Solo exigimos date_text si no es "none"
        if (formData.date_mode !== "none" && !formData.date_text.trim()) return false;

        return true;
    }, [pickedCoords, formData]);

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            // Si cambias date_mode a none, limpiamos date_text
            if (name === "date_mode" && value === "none") {
                return { ...prev, date_mode: "none", date_text: "" };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (loading) return;

        if (!pickedCoords) {
            setError("Primero elige un punto en el mapa.");
            return;
        }

        if (!canSubmit) {
            setError("Rellena todos los campos obligatorios.");
            return;
        }

        setLoading(true);
        try {
            await onCreateEvent({
                name: formData.name.trim(),
                group: formData.group,
                city: formData.city.trim(),
                venue: formData.venue.trim(),

                date_mode: formData.date_mode,
                date_text: formData.date_text.trim(),

                lat: pickedCoords.lat,
                lon: pickedCoords.lon,
            });
        } catch (err: any) {
            setError(err?.message ?? "Error guardando el evento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    if (!loading) onClose();
                }}
            />

            <div className="relative w-full max-w-[420px] h-full bg-zinc-950 text-white shadow-2xl flex flex-col p-6 overflow-y-auto border-l border-white/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Añadir evento</h2>
                    <button
                        onClick={() => {
                            if (!loading) onClose();
                        }}
                        className="text-gray-400 hover:text-white text-2xl"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                {/* Punto */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/70">Punto seleccionado</div>
                    {pickedCoords ? (
                        <div className="mt-1 text-sm">
                            {pickedCoords.lat.toFixed(6)}, {pickedCoords.lon.toFixed(6)}
                        </div>
                    ) : (
                        <div className="mt-1 text-sm text-red-300">
                            No hay punto seleccionado
                        </div>
                    )}

                    {onChangePoint && (
                        <button
                            type="button"
                            onClick={onChangePoint}
                            disabled={loading}
                            className="mt-2 text-xs underline text-white/80 hover:text-white disabled:opacity-60"
                        >
                            Cambiar punto en el mapa
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                    {/* Nombre */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase">
                            Nombre del evento
                        </label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                        />
                    </div>

                    {/* Grupo */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase">
                            Grupo
                        </label>
                        <select
                            name="group"
                            value={formData.group}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                        >
                            <option value="FULLDFIESTA">FULLDFIESTA</option>
                            <option value="FULLDMOTOR">FULLDMOTOR</option>
                            <option value="FULLDFREESTYLE">FULLDFREESTYLE</option>
                        </select>
                    </div>

                    {/* Ciudad */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase">
                            Ciudad
                        </label>
                        <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                        />
                    </div>

                    {/* Venue */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase">
                            Lugar (Venue)
                        </label>
                        <input
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                        />
                    </div>

                    {/* Fecha PRO */}
                    <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-xs font-semibold text-gray-400 uppercase">
                            Fecha
                        </div>

                        <select
                            name="date_mode"
                            value={formData.date_mode}
                            onChange={handleChange}
                            className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                        >
                            <option value="none">Sin fecha (evento fijo)</option>
                            <option value="approx">Aproximada</option>
                            <option value="exact">Exacta</option>
                        </select>

                        {formData.date_mode !== "none" && (
                            <input
                                name="date_text"
                                value={formData.date_text}
                                onChange={handleChange}
                                placeholder={
                                    formData.date_mode === "approx"
                                        ? "Ej: Último finde de agosto / Verano / Por confirmar"
                                        : "Ej: 2025-08-20"
                                }
                                className="w-full bg-zinc-900 border border-white/10 rounded px-3 py-2 focus:ring-2 focus:ring-white/20 outline-none"
                            />
                        )}

                        {formData.date_mode === "none" && (
                            <div className="text-xs text-white/60">
                                Perfecto para fiestas que se repiten cada año: el marcador existe aunque no haya cartel.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (!loading) onClose();
                            }}
                            className="flex-1 px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white transition disabled:opacity-60"
                            disabled={loading}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded bg-white text-black font-bold hover:bg-gray-200 transition disabled:opacity-60"
                            disabled={loading || !canSubmit}
                            title={!pickedCoords ? "Elige un punto en el mapa" : ""}
                        >
                            {loading ? "Guardando..." : "Guardar evento"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
