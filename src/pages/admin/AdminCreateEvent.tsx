import React, { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type GroupKey = "FULLDFIESTA" | "FULLDMOTOR" | "FULLDFREESTYLE";
type EventType = "fixed" | "itinerant";
type EventStatus = "draft" | "published" | "pending_poster" | "cancelled" | "archived";

const GROUPS: GroupKey[] = ["FULLDFIESTA", "FULLDMOTOR", "FULLDFREESTYLE"];
const TYPES: EventType[] = ["fixed", "itinerant"];
const STATUSES: EventStatus[] = ["pending_poster", "published", "draft", "cancelled", "archived"];

export default function AdminCreateEvent() {
    const [name, setName] = useState("");
    const [groupKey, setGroupKey] = useState<GroupKey>("FULLDFIESTA");
    const [eventType, setEventType] = useState<EventType>("fixed");
    const [status, setStatus] = useState<EventStatus>("pending_poster");
    const [shortDescription, setShortDescription] = useState("");
    const [lat, setLat] = useState("");
    const [lon, setLon] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const pointWkt = useMemo(() => {
        const la = Number(lat);
        const lo = Number(lon);
        if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
        return `POINT(${lo} ${la})`;
    }, [lat, lon]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setMsg("");

        if (!name.trim()) return setMsg("❌ Missing event name.");
        if (!pointWkt) return setMsg("❌ Invalid coordinates (lat/lon).");

        setLoading(true);
        try {
            const payload = {
                name: name.trim(),
                group_key: groupKey,
                event_type: eventType,
                status,
                short_description: shortDescription.trim() || null,
                location: pointWkt,
            };

            const { error } = await supabase.from("events").insert(payload);
            if (error) throw error;

            setMsg("✅ Event created.");
            setName("");
            setShortDescription("");
            setLat("");
            setLon("");
            setEventType("fixed");
            setStatus("pending_poster");
            setGroupKey("FULLDFIESTA");
        } catch (err: any) {
            setMsg(`❌ Error: ${err?.message ?? "unknown"}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-semibold">Admin · Create event</h1>

                <form onSubmit={handleCreate} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-300">Name</label>
                        <input
                            className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Fiestas de Llodio"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm text-zinc-300">Group</label>
                            <select
                                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2"
                                value={groupKey}
                                onChange={(e) => setGroupKey(e.target.value as GroupKey)}
                            >
                                {GROUPS.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-300">Type</label>
                            <select
                                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value as EventType)}
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-300">Status</label>
                            <select
                                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as EventStatus)}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-300">Short description</label>
                        <textarea
                            className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none"
                            rows={3}
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm text-zinc-300">Latitude</label>
                            <input
                                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder="43.143..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300">Longitude</label>
                            <input
                                className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none"
                                value={lon}
                                onChange={(e) => setLon(e.target.value)}
                                placeholder="-2.963..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-white text-black px-4 py-2 font-semibold disabled:opacity-60"
                    >
                        {loading ? "Creating..." : "Create event"}
                    </button>

                    {msg && <div className="text-sm mt-2 text-zinc-200">{msg}</div>}
                </form>
            </div>
        </div>
    );
}
