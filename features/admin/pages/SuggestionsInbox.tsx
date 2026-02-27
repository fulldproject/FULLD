import React, { useMemo } from 'react';
import { useEvents } from '../../events/EventsContext';
import { StatusModeration } from '../../../types';
import { CheckIcon, CloseIcon } from '../../../components/Icons';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { EmptyState } from '../../../components/ui/EmptyState';

export const SuggestionsInbox: React.FC = () => {
    const { events, updateEventStatus, deleteEvent } = useEvents();

    const pendingFn = () => events.filter(e => e.status_moderation === StatusModeration.PENDING);
    const pending = useMemo(pendingFn, [events]);

    const { execute: approve } = useAsyncAction(async (id: string) => {
        await updateEventStatus(id, StatusModeration.APPROVED);
    }, { successMessage: "Suggestion approved" });

    const { execute: reject } = useAsyncAction(async (id: string) => {
        await updateEventStatus(id, StatusModeration.REJECTED);
    }, { successMessage: "Suggestion rejected" });

    if (pending.length === 0) {
        return (
            <EmptyState
                icon={<CheckIcon />}
                title="All Caught Up"
                description="No pending suggestions to review. Great job!"
            />
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white">Suggestions Inbox</h1>
                <p className="text-sm text-gray-500">Review and moderate community submissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pending.map(event => (
                    <div key={event.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col group hover:border-white/20 transition-all">
                        <div className="aspect-video relative bg-white/5">
                            <img src={event.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                            <div className="absolute top-4 left-4">
                                <span className="bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                                    {event.group_key}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 flex-grow flex flex-col space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight mb-1">{event.name}</h3>
                                <p className="text-xs text-gray-400">{event.city}, {event.province}</p>
                            </div>

                            <div className="mt-auto flex gap-2 pt-4">
                                <button
                                    onClick={() => approve(event.id)}
                                    className="flex-grow bg-white text-black font-bold py-2 rounded-xl text-xs hover:bg-green-500 transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => reject(event.id)}
                                    className="flex-grow bg-white/5 text-gray-400 font-bold py-2 rounded-xl text-xs hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
