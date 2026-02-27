import React, { useState, useEffect, useMemo } from 'react';
import { formatEventDate } from '../../lib/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EventGeneral, Edition, UserRole } from '../../types';
import { CloseIcon, MapPinIcon, CalendarIcon, ShareIcon, HeartIcon, CheckIcon, ExpandIcon } from '../../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useAttendance } from '../attendance/useAttendance';
import { useEvents } from './EventsContext';
import { Toast } from '../../components/Toast';
import { Button } from '../../components/ui/Button';
import { CONFIG } from '../../lib/config';
import { getActiveEdition, getPosterUrl, getEditionStatus } from '../../lib/editionUtils';
import { ModalShell } from '../../components/ui/ModalShell';

interface BottomEventCardProps {
  event: EventGeneral;
  onClose: () => void;
}

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


export const BottomEventCard: React.FC<BottomEventCardProps> = ({ event, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { editions, categories } = useEvents();
  const { getStatus, setStatus } = useAttendance();
  const [showToast, setShowToast] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // ✅ CENTRALIZED Logic for Active Edition
  const edition = useMemo(() => {
    const eventEditions = editions.filter(ed => ed.event_id === event.id);
    return getActiveEdition(eventEditions);
  }, [editions, event.id]);

  const posterUrl = useMemo(() => getPosterUrl(edition?.poster_url), [edition]);

  const badgeInfo = useMemo(() => {
    const status = getEditionStatus(edition);
    if (status === 'tba') return { label: 'TBA', variant: 'neutral' as const };
    if (status === 'upcoming') return { label: 'PRÓXIMAMENTE', variant: 'blue' as const };
    if (status === 'live') return { label: 'EN CURSO', variant: 'red' as const };
    return { label: 'FINALIZADO', variant: 'gray' as const };
  }, [edition]);

  const categoryLabel = useMemo(() => {
    const cat = categories.find(c => c.id === event.category);
    return cat?.label || 'EVENTO';
  }, [categories, event.category]);

  const currentStatus = edition ? getStatus(edition.id) : null;
  const isParticipant = user?.role === UserRole.PARTICIPANT;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleShare = async () => {
    const url = `${CONFIG.APP_URL}${window.location.pathname}#/event/${event.id}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setShowToast(true);
      } else {
        // Fallback
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

  return (
    <>
      <Toast
        message="Link copied"
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Lightbox for Poster */}
      {showLightbox && posterUrl && (
        <ModalShell
          isOpen={true}
          onClose={() => setShowLightbox(false)}
          title={edition?.title || event.name}
          subtitle="Official Poster"
          size="md"
        >
          <div className="flex justify-center">
            <img
              src={posterUrl}
              alt="Edition Poster"
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </ModalShell>
      )}

      <div className="bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] hover:shadow-[0_40px_80px_-12px_rgba(0,0,0,0.9)] transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-4 w-full md:w-[460px] pointer-events-auto flex flex-col max-h-[90vh] group/card">
        {/* HEADER BACKGROUND */}
        <div className="relative h-40 sm:h-44 overflow-hidden flex-shrink-0">
          <img
            src={event.image_url || CONFIG.IMAGES.EVENT_PLACEHOLDER}
            alt={event.name}
            className="w-full h-full object-cover opacity-40 grayscale-[20%] group-hover/card:brightness-110 transition-all duration-200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/5 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                {categoryLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-black/40 hover:bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/5 transition-all active:scale-95"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTERED POSTER OVERLAP */}
        <div className="relative -mt-20 flex justify-center z-20 px-6">
          <div
            className="relative w-44 sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 transform hover:scale-[1.02] transition-all duration-200 ease-out cursor-pointer group/poster hover:shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
            onClick={() => posterUrl && setShowLightbox(true)}
          >
            <img
              src={posterUrl || event.image_url || CONFIG.IMAGES.EVENT_PLACEHOLDER}
              alt="Edition Poster"
              className="w-full h-full object-cover group-hover/poster:brightness-105 transition-all duration-200"
            />
            {posterUrl && (
              <div className="absolute inset-0 bg-black/0 group-hover/poster:bg-black/20 flex items-center justify-center transition-colors">
                <ExpandIcon className="w-6 h-6 text-white opacity-0 group-hover/poster:opacity-100 transform scale-75 group-hover/poster:scale-100 transition-all" />
              </div>
            )}
          </div>
        </div>

        {/* CONTENT SECTION */}
        <div className="px-8 pb-8 pt-6 space-y-6 flex-grow flex flex-col min-h-0 text-center">
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-2">
              <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-tight text-balance">
                {event.name}
              </h3>
            </div>

            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-bold text-gray-400">
                {event.city}, {event.province}
              </p>
              <p className="text-sm font-medium text-blue-400">
                {formatEventDate(edition)}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/5 w-1/2 mx-auto" />

          <div className="space-y-3 flex-shrink-0">
            {/* Main Action */}
            <Button
              variant="primary"
              onClick={() => navigate(`/event/${event.id}`)}
              className="w-full justify-center"
            >
              View Full Event
            </Button>

            {/* Participant specific actions */}
            {isParticipant && edition && (
              <div className="flex gap-2">
                <Button
                  variant={currentStatus === 'going' ? 'primary' : 'secondary'}
                  onClick={() => setStatus(edition.id, currentStatus === 'going' ? null : 'going')}
                  className={`flex-grow justify-center ${currentStatus === 'going' ? 'bg-green-600 border-green-600 hover:bg-green-700' : ''}`}
                  icon={currentStatus === 'going' ? <CheckIcon className="w-4 h-4" /> : undefined}
                >
                  Going
                </Button>
                <Button
                  variant={currentStatus === 'interested' ? 'primary' : 'secondary'}
                  onClick={() => setStatus(edition.id, currentStatus === 'interested' ? null : 'interested')}
                  className={`flex-grow justify-center ${currentStatus === 'interested' ? 'bg-orange-500 border-orange-500 hover:bg-orange-600' : ''}`}
                  icon={currentStatus === 'interested' ? <CheckIcon className="w-4 h-4" /> : undefined}
                >
                  Interested
                </Button>
              </div>
            )}

            {/* Other quick actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="flex-grow justify-center"
                icon={<ShareIcon className="w-4 h-4" />}
              >
                Share
              </Button>
              <Button
                variant="secondary"
                className="px-3"
                icon={<HeartIcon className="w-5 h-5" />}
              >
                {/* Icon only button */}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
