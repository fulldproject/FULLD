import React, { useState, useMemo, useEffect } from 'react';
import { Footer } from '../components/Footer';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatEventDate } from '../lib/dateUtils';
import { CONFIG } from '../lib/config';
import { useEvents } from '../features/events/EventsContext';
import {
  CloseIcon,
  MapPinIcon,
  CalendarIcon,
  ShareIcon,
  HeartIcon,
  RotateCcwIcon,
  CheckIcon,
  ExpandIcon
} from '../components/Icons';
import { useAuth } from '../features/auth/AuthContext';
import { useAttendance } from '../features/attendance/useAttendance';
import { UserRole, StatusModeration } from '../types';
import { Toast } from '../components/Toast';
import { getActiveEdition, getPosterUrl, getEditionStatus } from '../lib/editionUtils';
import { ModalShell } from '../components/ui/ModalShell';


const EventCountdown: React.FC<{ edition: any }> = ({ edition }) => {
  const [timeLeft, setTimeLeft] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!edition || edition.date_mode !== 'date' || !edition.date_start) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const status = getEditionStatus(edition);
      if (status === 'past' || status === 'tba') {
        setTimeLeft(null);
        return;
      }

      if (status === 'live') {
        setTimeLeft('Happening now');
        return;
      }

      // Upcoming
      const now = new Date();
      const start = new Date(edition.date_start);
      const diffMs = start.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft('Happening now'); // Fallback if status was slightly off
        return;
      }

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays >= 1) {
        setTimeLeft(`Starts in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`);
      } else {
        setTimeLeft(`Starts in ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [edition]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
        {timeLeft}
      </span>
    </div>
  );
};

const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'status' | 'warning' | 'blue' | 'red' | 'gray' | 'neutral' }> = ({ children, variant = 'default' }) => {
  const styles = {
    default: 'bg-white text-black',
    status: 'bg-green-500/10 text-green-500 border border-green-500/20',
    warning: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border border-red-500/20',
    gray: 'bg-white/5 text-gray-500 border border-white/10',
    neutral: 'bg-white/10 text-gray-300 border border-white/5'
  };
  return (
    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, editions, categories } = useEvents();
  const { getStatus, setStatus } = useAttendance();
  const [isSaved, setIsSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxPoster, setLightboxPoster] = useState<{ url: string; title: string } | null>(null);

  const event = events.find(e => e.id === id);

  // Visibility check: Only admins/organizers can see non-approved events
  const isAuthorized = user && (user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER);
  const isVisible = event?.status_moderation === StatusModeration.APPROVED || isAuthorized;

  // ✅ Centralized logic for the most relevant edition
  const edition = useMemo(() => {
    const eventEditions = editions.filter(ed => ed.event_id === id);
    return getActiveEdition(eventEditions);
  }, [editions, id]);

  const posterUrl = useMemo(() => getPosterUrl(edition?.poster_url), [edition]);

  // ✅ Past Editions Logic
  const pastEditions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const eventEditions = editions.filter(ed => ed.event_id === id);

    return eventEditions
      .filter(ed => {
        // Exclude current active edition
        if (ed.id === edition?.id) return false;
        // Must have a poster
        if (!ed.poster_url) return false;
        // Must be in the past
        const endOrStart = ed.date_end || ed.date_start;
        return ed.date_mode === 'date' && endOrStart && endOrStart < today;
      })
      .sort((a, b) => (b.date_start || '').localeCompare(a.date_start || ''))
      .slice(0, 6);
  }, [editions, id, edition?.id]);

  const categoryLabel = useMemo(() => {
    const cat = categories.find(c => c.id === event.category);
    return cat?.label || 'EVENTO';
  }, [categories, event.category]);

  const attendanceStatus = edition ? getStatus(edition.id) : null;
  const isParticipant = user?.role === UserRole.PARTICIPANT;

  const handleShare = async () => {
    if (!event) return;
    const url = `${CONFIG.APP_URL}${window.location.pathname}#/event/${event.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setShowToast(true);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShowToast(true);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert(`Share this link: ${url}`);
    }
  };

  if (!event || !isVisible) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
          <RotateCcwIcon className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl font-black">Event not found</h1>
        <p className="text-gray-500 max-w-xs">The event you are looking for might have been cancelled, archived, or is awaiting moderation.</p>
        <Link to="/" className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Return to Map
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] text-white flex flex-col overflow-x-hidden text-pretty">
      <Toast
        message="Link copied"
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Lightbox for Poster */}
      {(showLightbox || lightboxPoster) && (
        <ModalShell
          isOpen={true}
          onClose={() => {
            setShowLightbox(false);
            setLightboxPoster(null);
          }}
          title={lightboxPoster?.title || edition?.title || event.name}
          subtitle="Official Poster"
          size="md"
        >
          <div className="flex justify-center">
            <img
              src={lightboxPoster?.url || posterUrl}
              alt="Edition Poster"
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </ModalShell>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 h-[64px] flex items-center justify-between px-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-xl rounded-full border border-white/10 text-white transition-all pointer-events-auto active:scale-95"
          title="Go back"
        >
          <span className="font-bold text-sm px-1">← Back</span>
        </button>
        <div className="flex gap-3 pointer-events-auto">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-3 rounded-full border backdrop-blur-xl transition-all active:scale-90 ${isSaved ? 'bg-red-500 border-red-500 text-white' : 'bg-black/50 border-white/10 text-white hover:bg-black/80'
              }`}
          >
            <HeartIcon className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-3 bg-black/50 border border-white/10 backdrop-blur-xl rounded-full text-white hover:bg-black/80 transition-all active:scale-90"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative w-full h-[50vh] min-h-[400px]">
        <img
          src={event.image_url}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 space-y-4 max-w-5xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-600 text-[10px] font-black uppercase rounded-md tracking-widest shadow-lg">
              {event.group_key}
            </span>
            <span className="px-3 py-1 bg-white text-black text-[10px] font-black uppercase rounded-md tracking-widest shadow-lg">
              {categoryLabel}
            </span>
            {attendanceStatus && (
              <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-md tracking-widest shadow-lg ${attendanceStatus === 'going' ? 'bg-green-500 text-black' : 'bg-orange-500 text-black'
                }`}>
                {attendanceStatus}
              </span>
            )}
            {event.status_moderation !== StatusModeration.APPROVED && (
              <span className="px-3 py-1 bg-yellow-500 text-black text-[10px] font-black uppercase rounded-md tracking-widest shadow-lg">
                Status: {event.status_moderation}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            {event.name}
          </h1>
        </div>
      </div>

      <main className="flex-grow bg-black pb-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-bold border-l-4 border-white pl-4 uppercase tracking-widest">About this Event</h2>
              <div className="text-gray-400 leading-relaxed text-lg space-y-4 text-pretty">
                <p className="text-white font-semibold">{event.short_description}</p>
                <p>
                  Experience the pulse of the city at {event.name}. This exclusive {event.category} gathering within the {event.group_key} community brings together creators, enthusiasts, and innovators for an unforgettable session.
                </p>
                <p>
                  Join us at {event.city}, {event.province} for a curated experience that blends high-energy atmosphere with the unique cultural identity of our movement.
                </p>
              </div>
            </section>

            <section className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
              <h3 className="text-sm font-black uppercase text-gray-500 tracking-widest">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Province</span>
                  <span className="text-white">{event.province}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Community</span>
                  <span className="text-white">{event.community}</span>
                </div>
              </div>
            </section>

            {/* PAST EDITIONS GALLERY */}
            {pastEditions.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-xl font-bold border-l-4 border-white pl-4 uppercase tracking-widest">Past Editions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {pastEditions.map((ed) => {
                    const url = getPosterUrl(ed.poster_url);
                    const year = ed.date_start ? new Date(ed.date_start).getFullYear() : '—';

                    return (
                      <div key={ed.id} className="group space-y-2">
                        <div
                          className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-white/5 cursor-pointer transform hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 ease-out group"
                          onClick={() => url && setLightboxPoster({ url, title: ed.title || `${event.name} ${year}` })}
                        >
                          <img
                            src={url || CONFIG.IMAGES.EVENT_PLACEHOLDER}
                            alt={`Edition ${year}`}
                            className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                          />
                        </div>
                        <p className="text-center text-xs font-black text-gray-500 tracking-widest">{year}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
              {/* EDITION POSTER SECTION */}
              {posterUrl && (
                <div
                  className="group relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/5 cursor-pointer transform hover:scale-[1.02] transition-all duration-200 ease-out hover:shadow-[0_40px_80px_-12px_rgba(0,0,0,0.9)]"
                  onClick={() => setShowLightbox(true)}
                >
                  <img
                    src={posterUrl}
                    alt="Edition Poster"
                    className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-200 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white text-black text-[10px] font-black uppercase rounded-full tracking-wider">
                      <ExpandIcon className="w-3 h-3" /> View Large
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center text-center space-y-6">
                {/* STATUS & COUNTDOWN */}
                <div className="flex flex-col items-center gap-3">
                  {edition && (
                    <Badge variant={
                      getEditionStatus(edition) === 'upcoming' ? 'blue' :
                        getEditionStatus(edition) === 'live' ? 'red' :
                          getEditionStatus(edition) === 'tba' ? 'neutral' : 'gray'
                    }>
                      {getEditionStatus(edition) === 'upcoming' ? 'PRÓXIMAMENTE' :
                        getEditionStatus(edition) === 'live' ? 'EN CURSO' :
                          getEditionStatus(edition) === 'past' ? 'FINALIZADO' : 'TBA'}
                    </Badge>
                  )}
                  <EventCountdown edition={edition} />
                </div>

                {/* DATE & TIME (EMPHASIZED) */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">When</h4>
                  <p className="text-2xl font-black text-white tracking-tight">
                    {edition ? formatEventDate(edition) : "Dates TBA"}
                  </p>
                </div>

                {/* LOCATION (SECONDARY) */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Where</h4>
                  <p className="text-sm font-bold text-gray-400">
                    {event.city}, {event.province}
                  </p>
                  {event.venue && (
                    <p className="text-xs text-gray-500">{event.venue}</p>
                  )}
                </div>

                <div className="h-px bg-white/5 w-1/4 mx-auto" />

                {/* PRIMARY ACTIONS */}
                <div className="w-full space-y-3">
                  {isParticipant && edition ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setStatus(edition.id, attendanceStatus === 'going' ? null : 'going')}
                        className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 ${attendanceStatus === 'going' ? 'bg-green-500 text-black' : 'bg-white text-black hover:bg-gray-200 active:scale-95'
                          }`}
                      >
                        {attendanceStatus === 'going' && <CheckIcon className="w-5 h-5" />}
                        {attendanceStatus === 'going' ? 'Confirmed Going' : 'Mark as Going'}
                      </button>
                      <button
                        onClick={() => setStatus(edition.id, attendanceStatus === 'interested' ? null : 'interested')}
                        className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border ${attendanceStatus === 'interested'
                          ? 'bg-orange-500 border-orange-500 text-black'
                          : 'bg-transparent border-white/20 text-white hover:bg-white/5 active:scale-95'
                          }`}
                      >
                        {attendanceStatus === 'interested' && <CheckIcon className="w-5 h-5" />}
                        {attendanceStatus === 'interested' ? 'Interested' : 'Maybe Interested'}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={!edition}
                      className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {edition ? "Register Interest" : "No upcoming dates"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/60 backdrop-blur-2xl border-t border-white/5 md:hidden z-50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Edition Date</span>
              <span className="text-sm font-bold text-white">{edition ? formatEventDate(edition) : "Dates TBA"}</span>
            </div>
            {edition && (
              <Badge variant={
                getEditionStatus(edition) === 'upcoming' ? 'blue' :
                  getEditionStatus(edition) === 'live' ? 'red' : 'gray'
              }>
                {getEditionStatus(edition) === 'upcoming' ? 'PRÓXIMAMENTE' :
                  getEditionStatus(edition) === 'live' ? 'EN CURSO' : 'FINALIZADO'}
              </Badge>
            )}
          </div>

          {isParticipant && edition ? (
            <div className="flex gap-2">
              <button
                onClick={() => setStatus(edition.id, attendanceStatus === 'going' ? null : 'going')}
                className={`flex-grow font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${attendanceStatus === 'going' ? 'bg-green-500 text-black' : 'bg-white text-black'
                  }`}
              >
                {attendanceStatus === 'going' ? 'Going' : 'Going'}
              </button>
              <button
                onClick={() => setStatus(edition.id, attendanceStatus === 'interested' ? null : 'interested')}
                className={`flex-grow font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 border ${attendanceStatus === 'interested' ? 'bg-orange-500 border-orange-500 text-black' : 'bg-transparent border-white/20 text-white'
                  }`}
              >
                {attendanceStatus === 'interested' ? 'Interested' : 'Interested'}
              </button>
            </div>
          ) : (
            <button
              disabled={!edition}
              className="w-full bg-white text-black font-black py-4 rounded-xl shadow-2xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {edition ? "Register Interest" : "No upcoming dates"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
