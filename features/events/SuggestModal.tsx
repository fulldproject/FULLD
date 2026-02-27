import React, { useState, useEffect } from 'react';
import { MapIcon, CheckIcon, MapPinIcon, RotateCcwIcon, ExpandIcon } from '../../components/Icons';
import { GROUPS, DEFAULT_COORDS } from '../../constants';
import { useEvents } from './EventsContext';
import { ModalShell } from '../../components/ui/ModalShell';
import { Button } from '../../components/ui/Button';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { CONFIG } from '../../lib/config';
import { EventFormFields } from './components/EventFormFields';
import { suggestionsApi } from './suggestionsApi';
import type { SuggestionType, SuggestionPayload } from '../../types';
import { Input, Select, TextArea } from '../../components/ui/Input';

interface SuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onStartPicking: () => void;
  onStopPicking: () => void;
  onClearPicked: () => void;
  isPickingMode: boolean;
  pickedCoords: { lat: number; lng: number } | null;
  initialLocation?: {
    city?: string;
    province?: string;
  };
}

export const SuggestModal: React.FC<SuggestModalProps> = ({
  isOpen,
  onClose,
  userId,
  onStartPicking,
  onStopPicking,
  onClearPicked,
  isPickingMode,
  pickedCoords,
  initialLocation
}) => {
  const { events, categories } = useEvents();
  const [isSuccess, setIsSuccess] = useState(false);
  const [suggestionType, setSuggestionType] = useState<SuggestionType>('event');

  const [formData, setFormData] = useState({
    // Event specific
    name: '',
    group_key: GROUPS[0].key,
    category: '',
    city: '',
    province: '',
    short_description: '',
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,

    // Edition/Common specific
    title: '',
    description: '',
    date_mode: 'date' as 'date' | 'text' | 'tbd',
    date_start: '',
    date_end: '',
    date_text: '',
    notes: '',
    link: '',

    // Selection for edition mode
    event_id: ''
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && initialLocation) {
      setFormData(prev => ({
        ...prev,
        city: initialLocation.city || prev.city,
        province: initialLocation.province || prev.province
      }));
    }
  }, [isOpen, initialLocation]);

  useEffect(() => {
    if (pickedCoords && suggestionType === 'event') {
      setFormData(prev => ({
        ...prev,
        lat: pickedCoords.lat,
        lng: pickedCoords.lng
      }));
    }
  }, [pickedCoords, suggestionType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const { execute: submitSuggestion, isLoading: isSubmitting, error: submitError } = useAsyncAction(async () => {
    const payload: SuggestionPayload = {
      title: formData.title || formData.name,
      description: formData.description || formData.short_description,
      date_mode: formData.date_mode,
      date_start: formData.date_start,
      date_end: formData.date_end,
      date_text: formData.date_text,
      notes: formData.notes,
      link: formData.link,
      // Event fields
      name: formData.name,
      group_key: formData.group_key,
      category: formData.category,
      lat: formData.lat,
      lng: formData.lng,
      city: formData.city,
      province: formData.province,
      // Edition fields
      event_id: formData.event_id
    };

    await suggestionsApi.createSuggestion({
      suggestionType,
      eventId: suggestionType === 'edition' ? formData.event_id : undefined,
      payload,
      posterFile: posterFile || undefined
    });

    setIsSuccess(true);
  }, {
    errorMessage: "Failed to submit suggestion. Please try again."
  });

  const validate = () => {
    const errors: Record<string, string> = {};
    if (suggestionType === 'event') {
      if (!formData.name.trim()) errors.name = "Event name is required";
      if (!formData.category) errors.category = "Category is required";
      if (!formData.city.trim()) errors.city = "City is required";
    } else {
      if (!formData.event_id) errors.event_id = "Please select an event";
    }

    if (!formData.title.trim() && !formData.name.trim()) errors.title = "A title/name is required";

    if (formData.date_mode === 'date' && !formData.date_start) {
      errors.date_start = "Start date is required";
    }
    if (formData.date_mode === 'text' && !formData.date_text.trim()) {
      errors.date_text = "Date description is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await submitSuggestion();
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckIcon className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter">Contribution Sent!</h3>
            <p className="text-gray-400 text-sm">
              Thanks for improving the platform. Our team will review your suggestion shortly.
            </p>
          </div>
          <Button onClick={() => { setIsSuccess(false); onClose(); }} className="w-full">
            Great!
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Contribute to FULLD" className="max-w-2xl">
      <div className="space-y-8 py-2">
        {/* Type Toggle */}
        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
          <button
            onClick={() => setSuggestionType('event')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${suggestionType === 'event' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            Suggest New Event
          </button>
          <button
            onClick={() => setSuggestionType('edition')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${suggestionType === 'edition' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}`}
          >
            New Date for Event
          </button>
        </div>

        {submitError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {submitError.message}
          </div>
        )}

        <div className="space-y-6">
          {suggestionType === 'event' ? (
            <div className="space-y-6">
              <EventFormFields
                formData={formData as any}
                setFormData={setFormData}
                formErrors={formErrors}
                categories={categories}
              />

              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1 block">
                      Target Coordinates
                    </label>
                    <div className="flex items-center gap-3 text-sm font-medium text-white pl-1">
                      <MapPinIcon className="w-4 h-4 text-white/40" />
                      {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, lat: DEFAULT_COORDS.lat, lng: DEFAULT_COORDS.lng }))}
                      className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                      title="Reset position"
                    >
                      <RotateCcwIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onStartPicking}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isPickingMode
                        ? 'bg-white text-black ring-4 ring-white/20'
                        : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                      <MapIcon className="w-4 h-4" />
                      {isPickingMode ? 'Picking...' : 'Pick on Map'}
                    </button>
                  </div>
                </div>
                {isPickingMode && (
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider animate-pulse pt-1">
                    Click anywhere on the map to set location
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <Select
                label="Select Existing Event"
                value={formData.event_id}
                onChange={(e) => setFormData(prev => ({ ...prev, event_id: e.target.value }))}
                options={[
                  { label: "Choose an event...", value: "" },
                  ...events.map(e => ({ label: e.name, value: e.id }))
                ]}
                error={formErrors.event_id}
              />
              <Input
                label="Edition Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. 10th Anniversary, Winter Edition..."
                error={formErrors.title}
              />
              <TextArea
                label="Edition Description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Details about this specific date..."
              />
            </div>
          )}

          {/* SHARED DATE & IMAGE SECTION */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
            {/* Poster Upload */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
                Official Poster / Image (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/10 transition-all overflow-hidden relative group"
                  onClick={() => document.getElementById('poster-input')?.click()}
                >
                  {posterPreview ? (
                    <>
                      <img src={posterPreview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase text-white">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <ExpandIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Poster</p>
                    </>
                  )}
                  <input id="poster-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date Mode</label>
                    <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                      {['date', 'text', 'tbd'].map(m => (
                        <button
                          key={m}
                          onClick={() => setFormData(prev => ({ ...prev, date_mode: m as any }))}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${formData.date_mode === m ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.date_mode === 'date' && (
                    <div className="space-y-3">
                      <Input label="Start" type="date" value={formData.date_start} onChange={e => setFormData(prev => ({ ...prev, date_start: e.target.value }))} error={formErrors.date_start} />
                      <Input label="End (Opt)" type="date" value={formData.date_end} onChange={e => setFormData(prev => ({ ...prev, date_end: e.target.value }))} />
                    </div>
                  )}

                  {formData.date_mode === 'text' && (
                    <Input label="Date Label" value={formData.date_text} onChange={e => setFormData(prev => ({ ...prev, date_text: e.target.value }))} placeholder="e.g. July 2026" error={formErrors.date_text} />
                  )}

                  {formData.date_mode === 'tbd' && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">To be announced soon</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Notes & Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextArea
                label="Internal Notes"
                rows={2}
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes for the admin..."
              />
              <Input
                label="Official Link"
                value={formData.link}
                onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                placeholder="https://event.com"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/5 sticky bottom-0 bg-[#121212]/95 backdrop-blur-md pb-4">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1" isLoading={isSubmitting}>
            Send Suggestion
          </Button>
        </div>
      </div>
    </ModalShell>
  );
};
