import React, { useState, useMemo } from 'react';
import { useEvents } from '../../events/EventsContext';
import { StatusModeration } from '../../../types';
import { SearchIcon, FilterIcon, EditIcon, CheckIcon, TrashIcon, RotateCcwIcon } from '../../../components/Icons';
import { useAsyncAction } from '../../../hooks/useAsyncAction';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors: Record<string, string> = {
        [StatusModeration.APPROVED]: "bg-green-500/10 text-green-500 border-green-500/20",
        [StatusModeration.PENDING]: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        [StatusModeration.REJECTED]: "bg-red-500/10 text-red-500 border-red-500/20",
        [StatusModeration.ARCHIVED]: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${colors[status] || "bg-white/5 text-white"}`}>
            {status}
        </span>
    );
};

export const EventsManager: React.FC = () => {
    const { events, updateEventStatus, deleteEvent } = useEvents();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    const filtered = useMemo(() => {
        return events.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.city?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = filterStatus === "ALL" || e.status_moderation === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [events, searchTerm, filterStatus]);

    const { execute: removeEvent } = useAsyncAction(async (id: string) => {
        if (confirm("Permanently delete this event?")) {
            await deleteEvent(id);
        }
    }, { successMessage: "Event deleted" });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">Events Manager</h1>
                    <p className="text-sm text-gray-500">Manage visibility and content.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/20 w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-[#111] border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/20 appearance-none"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="ALL">All Status</option>
                        {Object.values(StatusModeration).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs font-black uppercase tracking-widest text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Event</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                        <SearchIcon className="w-12 h-12 mb-4" />
                                        <p className="font-bold">No events matching "{searchTerm}"</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(event => (
                                <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{event.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{event.group_key} • {event.category}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {event.city}, {event.province}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={event.status_moderation} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => updateEventStatus(event.id, StatusModeration.APPROVED)}
                                                className={`p-2 rounded-lg transition-colors ${event.status_moderation === StatusModeration.APPROVED
                                                    ? 'bg-green-500 text-black'
                                                    : 'hover:bg-green-500/10 text-gray-400 hover:text-green-500'
                                                    }`}
                                                title="Approve"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => updateEventStatus(event.id, StatusModeration.ARCHIVED)}
                                                className={`p-2 rounded-lg transition-colors ${event.status_moderation === StatusModeration.ARCHIVED
                                                    ? 'bg-gray-500 text-white'
                                                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                                                    }`}
                                                title="Archive"
                                            >
                                                <RotateCcwIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removeEvent(event.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
