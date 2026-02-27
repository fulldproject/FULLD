import React, { useState, useMemo } from 'react';
import { Footer } from '../components/Footer';
import { formatEventDate } from '../lib/dateUtils';
import { useAuth } from '../features/auth/AuthContext';
import { useEvents } from '../features/events/EventsContext';
import { Link, Navigate } from 'react-router-dom';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { StatusModeration, EventGeneral, UserRole } from '../types';
import { CloseIcon, CheckIcon, RotateCcwIcon, MapPinIcon, CalendarIcon, MoreIcon, TrashIcon } from '../components/Icons';
import { GROUPS } from '../constants';

export const Moderation: React.FC = () => {
  const { user } = useAuth();
  const { events, editions, updateEventStatus, deleteEvent } = useEvents();
  const [reviewingEventId, setReviewingEventId] = useState<string | null>(null);

  // Filter only pending events for the moderation inbox
  const pendingEvents = useMemo(() =>
    events.filter(e => e.status_moderation === StatusModeration.PENDING),
    [events]
  );

  const reviewingEvent = useMemo(() =>
    events.find(e => e.id === reviewingEventId),
    [events, reviewingEventId]
  );

  const reviewingEdition = useMemo(() =>
    editions.find(ed => ed.event_id === reviewingEventId),
    [editions, reviewingEventId]
  );

  const isAdmin = useIsAdmin();

  // STRICT PERMISSION: Only ADMIN can moderate
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleAction = (id: string, status: StatusModeration) => {
    updateEventStatus(id, status);
    setReviewingEventId(null);
    alert(`Event status updated to: ${status.toUpperCase()}.`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this suggestion?')) {
      deleteEvent(id);
      setReviewingEventId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Header */}
      <header className="h-[64px] border-b border-white/10 px-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-white transition-colors">←</Link>
          <div>
            <h1 className="text-xl font-black tracking-tight">Moderation Inbox</h1>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Awaiting Verification</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full">
            {pendingEvents.length} PENDING
          </span>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full">
        {pendingEvents.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <CheckIcon className="w-12 h-12" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Inbox is Clear</h2>
              <p className="text-sm">No new event suggestions to moderate.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEvents.map(event => (
              <div
                key={event.id}
                className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all group flex flex-col shadow-xl"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={event.image_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border border-white/10 tracking-widest">
                      {event.group_key}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col space-y-4">
                  <div>
                    <span className="text-blue-400 text-[9px] font-black uppercase tracking-tighter">{event.category}</span>
                    <h3 className="text-lg font-bold leading-tight">{event.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPinIcon className="w-3 h-3" /> {event.city}, {event.province}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">
                    {formatEventDate(reviewingEdition)}
                  </div>
                  <div className="pt-2 mt-auto flex items-center justify-between">
                    <div className="text-[10px] text-gray-600">
                      Suggested by <span className="text-gray-400 font-bold">{event.created_by}</span>
                    </div>
                    <button
                      onClick={() => setReviewingEventId(event.id)}
                      className="text-xs font-black uppercase text-white hover:text-blue-400 transition-colors"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal Overlay */}
      {reviewingEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#121212] w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold">Review Suggestion</h2>
              <button onClick={() => setReviewingEventId(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <CloseIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar p-8 space-y-8">
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10">
                  <img src={reviewingEvent.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{reviewingEvent.group_key} • {reviewingEvent.category}</span>
                  <h3 className="text-2xl font-black">{reviewingEvent.name}</h3>
                  <p className="text-sm text-gray-400">{reviewingEvent.city}, {reviewingEvent.province}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Event Name</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/20" defaultValue={reviewingEvent.name} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Group Key</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm appearance-none" defaultValue={reviewingEvent.group_key}>
                      {GROUPS.map(g => <option key={g.key} value={g.key} className="bg-black">{g.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">City / Province</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" defaultValue={`${reviewingEvent.city}, ${reviewingEvent.province}`} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date Text</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm" defaultValue={reviewingEdition?.date_text || 'No date set'} />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Short Description</label>
                <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm resize-none" defaultValue={reviewingEvent.short_description} />
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-3">
                <div className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5">⚠️</div>
                <p className="text-[11px] text-yellow-500/80 leading-relaxed">
                  Reviewing as <span className="font-bold text-yellow-500">{user.role}</span>. Approving this event will make it instantly visible to all users on the map and event lists.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex flex-wrap gap-4">
              <button
                onClick={() => handleAction(reviewingEvent.id, StatusModeration.APPROVED)}
                className="flex-grow bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-500 transition-all active:scale-95"
              >
                <CheckIcon className="w-5 h-5" /> Approve Event
              </button>
              <button
                onClick={() => handleAction(reviewingEvent.id, StatusModeration.REJECTED)}
                className="flex-grow bg-white/5 text-red-500 border border-white/10 font-bold py-4 rounded-2xl hover:bg-red-500/10 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction(reviewingEvent.id, StatusModeration.ARCHIVED)}
                className="flex-grow bg-white/5 text-gray-400 border border-white/10 font-bold py-4 rounded-2xl hover:bg-white/10 transition-colors"
              >
                Archive
              </button>
              <button
                onClick={() => handleDelete(reviewingEvent.id)}
                className="p-4 text-gray-500 hover:text-red-500 transition-colors"
                title="Permanent delete"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};