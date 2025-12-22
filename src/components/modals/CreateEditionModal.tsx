import React, { useMemo, useState } from "react";
import type { Event, DateMode } from "../../data/events";
import { DATE_MODE_NONE, DATE_MODE_APPROX, DATE_MODE_EXACT } from "../../data/events";
import { createEdition } from "../../services/events";

type ModeUI = "NONE" | "DATE" | "TEXT";

type Props = {
    open: boolean;
    event: Event | null;
    onClose: () => void;
    onSaved: (updated: { eventId: string; date_mode: DateMode; date_text: string | null }) => void;
};

function formatIsoDate(iso: string): string {
    // iso might be "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss..." -> keep date part
    return iso.slice(0, 10);
}

export const CreateEditionModal: React.FC<Props> = ({ open, event, onClose, onSaved }) => {
    const [mode, setMode] = useState<ModeUI>("NONE");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [dateText, setDateText] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const title = useMemo(() => {
        if (!event) return "Add edition";
        return `Add edition — ${event.name}`;
    }, [event]);

    if (!open) return null;

    const canSubmit =
        !!event &&
        !loading &&
        (mode === "NONE" ||
            (mode === "DATE" && !!dateStart) ||
            (mode === "TEXT" && dateText.trim().length > 0));

    const closeAndReset = () => {
        setMode("NONE");
        setDateStart("");
        setDateEnd("");
        setDateText("");
        setErr(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!event) return;
        if (!canSubmit) return;

        setErr(null);
        setLoading(true);

        try {
            if (mode === "NONE") {
                await createEdition({
                    evento_id: event.id,
                    date_mode: "NONE",
                    date_start: null,
                    date_end: null,
                    date_text: null,
                } as any);

                onSaved({ eventId: event.id, date_mode: DATE_MODE_NONE, date_text: null });
                closeAndReset();
                return;
            }

            if (mode === "TEXT") {
                const text = dateText.trim();

                await createEdition({
                    evento_id: event.id,
                    date_mode: "TEXT",
                    date_start: null,
                    date_end: null,
                    date_text: text,
                } as any);

                onSaved({ eventId: event.id, date_mode: DATE_MODE_APPROX, date_text: text });
                closeAndReset();
                return;
            }

            // DATE
            const start = formatIsoDate(dateStart);
            const end = dateEnd ? formatIsoDate(dateEnd) : "";

            await createEdition({
                evento_id: event.id,
                date_mode: "DATE",
                date_start: start,
                date_end: end || null,
                date_text: null,
            } as any);

            const label = end ? `${start} → ${end}` : start;
            onSaved({ eventId: event.id, date_mode: DATE_MODE_EXACT, date_text: label });
            closeAndReset();
        } catch (e: any) {
            setErr(e?.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
            {/* backdrop */}
            <button
                className="absolute inset-0 bg-black/70"
                onClick={closeAndReset}
                aria-label="Close modal"
            />

            {/* panel */}
            <div className="relative w-[92%] max-w-md rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold">{title}</h2>
                        <p className="text-xs text-white/50 mt-1">
                            Add a date (exact) or a text (approx). Or set as “none”.
                        </p>
                    </div>

                    <button
                        onClick={closeAndReset}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition"
                        disabled={loading}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    <label className="block text-sm text-white/70">Edition type</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as ModeUI)}
                        className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                        disabled={loading}
                    >
                        <option value="NONE">None (no date)</option>
                        <option value="DATE">Exact date</option>
                        <option value="TEXT">Approx text</option>
                    </select>

                    {mode === "DATE" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-white/70 mb-1">Start date *</label>
                                <input
                                    type="date"
                                    value={dateStart}
                                    onChange={(e) => setDateStart(e.target.value)}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/70 mb-1">End date</label>
                                <input
                                    type="date"
                                    value={dateEnd}
                                    onChange={(e) => setDateEnd(e.target.value)}
                                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {mode === "TEXT" && (
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Text *</label>
                            <input
                                type="text"
                                value={dateText}
                                onChange={(e) => setDateText(e.target.value)}
                                placeholder='e.g. "Last weekend of August"'
                                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {err && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {err}
                        </div>
                    )}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={closeAndReset}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm font-semibold"
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 transition text-sm font-semibold disabled:opacity-60"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};
