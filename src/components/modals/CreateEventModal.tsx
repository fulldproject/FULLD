import React, { useState } from "react";
import { createEventGeneral } from "../../services/events";
import type { MapEvent } from "../../data/events";
import type { GroupKey, EventoTipo } from "../../types/db";

interface CreateEventModalProps {
    open: boolean;
    coords: { lng: number; lat: number } | null;
    defaultGroup?: GroupKey;
    onClose: () => void;
    onCreated: (created: MapEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
    open,
    coords,
    defaultGroup = "FULLDFIESTA",
    onClose,
    onCreated,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [group, setGroup] = useState<GroupKey>(defaultGroup);
    const [category, setCategory] = useState(""); // e.g. "Concierto", "Fiesta"
    const [tipo, setTipo] = useState<EventoTipo>("FIJO");
    const [city, setCity] = useState("");
    const [venue, setVenue] = useState("");

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!coords) {
            setError("No coordinates selected.");
            return;
        }

        if (!name.trim()) {
            setError("El nombre es obligatorio.");
            return;
        }
        if (!category.trim()) {
            setError("La categoría es obligatoria.");
            return;
        }

        try {
            setLoading(true);

            // 1. Call Supabase Service
            const row = await createEventGeneral({
                nombre: name,
                grupo: group,
                categoria: category,
                tipo: tipo,
                lng: coords.lng,
                lat: coords.lat,
                municipio: city || null,
                // provincia/comunidad omitted for now or inferred later
            });

            // 2. Construct UI MapEvent
            const newMapEvent: MapEvent = {
                id: row.id,
                name: row.nombre,
                group: row.grupo,
                lat: coords.lat,
                lon: coords.lng,
                city: row.municipio,
                venue: venue || null, // UI only field for now
                date_mode: "none",
                date_text: null,
            };

            // 3. Success callback
            onCreated(newMapEvent);
            onClose();
        } catch (err: any) {
            console.error("Error creating event:", err);
            setError(err.message || "Error desconocido al crear evento.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h2 className="text-white text-lg font-bold">Crear Nuevo Evento</h2>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="create-event-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Coordinates Display */}
                        <div className="text-xs text-white/50 bg-white/5 p-2 rounded border border-dashed border-white/10 font-mono">
                            📍 {coords?.lat.toFixed(6)}, {coords?.lng.toFixed(6)}
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Fiestas de San Juan"
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition placeholder:text-white/20"
                                autoFocus
                            />
                        </div>

                        {/* Group */}
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                Grupo
                            </label>
                            <select
                                value={group}
                                onChange={(e) => setGroup(e.target.value as GroupKey)}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition appearance-none"
                            >
                                <option value="FULLDFIESTA">FULLDFIESTA</option>
                                <option value="FULLDMOTOR">FULLDMOTOR</option>
                                <option value="FULLDFREESTYLE">FULLDFREESTYLE</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                Categoría
                            </label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="Ej: Popular, Rally, Exhibición..."
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition placeholder:text-white/20"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                Tipo
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="FIJO"
                                        checked={tipo === "FIJO"}
                                        onChange={() => setTipo("FIJO")}
                                        className="accent-white"
                                    />
                                    <span className="text-sm text-white">Fijo</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="ITINERANTE"
                                        checked={tipo === "ITINERANTE"}
                                        onChange={() => setTipo("ITINERANTE")}
                                        className="accent-white"
                                    />
                                    <span className="text-sm text-white">Itinerante</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* City */}
                            <div>
                                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                    Municipio (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Ej: Madrid"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition placeholder:text-white/20"
                                />
                            </div>

                            {/* Venue */}
                            <div>
                                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                                    Lugar (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                    placeholder="Ej: Plaza Mayor"
                                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 transition placeholder:text-white/20"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        form="create-event-form"
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 transition text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creando..." : "Crear Evento"}
                    </button>
                </div>
            </div>
        </div>
    );
};
