
import React, { useMemo } from 'react';
import { formatEventDate } from '../lib/dateUtils';
import { useAuth } from '../features/auth/AuthContext';
import { useEvents } from '../features/events/EventsContext';
import { useAttendance } from '../features/attendance/useAttendance';
import { Link, Navigate } from 'react-router-dom';
import { UserRole } from '../types';
import { MapPinIcon, CalendarIcon, ChevronRightIcon, RotateCcwIcon } from '../components/Icons';

export const MyPlans: React.FC = () => {
  const { user } = useAuth();
  const { events, editions, categories } = useEvents();
  const { attendance } = useAttendance();

  const myEvents = useMemo(() => {
    return attendance.map(record => {
      const edition = editions.find(ed => ed.id === record.editionId);
      if (!edition) return null;
      const event = events.find(e => e.id === edition.event_id);
      if (!event) return null;
      return { ...event, edition, status: record.status };
    }).filter(e => e !== null);
  }, [attendance, events, editions]);

  if (!user || user.role !== UserRole.PARTICIPANT) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="h-[64px] border-b border-white/10 px-6 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <Link to="/" className="text-gray-500 hover:text-white transition-colors">←</Link>
        <div>
          <h1 className="text-xl font-black tracking-tighter">My Plans</h1>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Attendance History</p>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        {myEvents.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <RotateCcwIcon className="w-12 h-12" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">No plans yet</h2>
              <p className="text-sm">Find events on the map and mark them as Going or Interested.</p>
            </div>
            <Link to="/" className="text-blue-400 text-sm font-bold hover:underline">Explore the map →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myEvents.map((event: any) => (
              <Link
                key={event.edition.id}
                to={`/event/${event.id}`}
                className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden p-4 flex gap-4 hover:border-white/30 transition-all active:scale-[0.99]"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border ${event.status === 'going'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                        {event.status}
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        {categories.find(c => c.id === event.category)?.label || 'EVENTO'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold truncate">{event.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" /> {event.city}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {formatEventDate(event.edition)}
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
