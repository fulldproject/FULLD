import React, { useEffect } from "react";
import { CloseIcon, MusicIcon, CarIcon, ActivityIcon, ChevronRightIcon } from "../../components/Icons";
import { GROUPS } from "../../constants";
import type { GroupKey } from "../../types";

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: GroupKey;
  onSelectMode: (mode: GroupKey) => void;
}

type ModeMeta = { description: string; icon: React.ReactNode };

const MODE_META: Partial<Record<GroupKey, ModeMeta>> = {
  FULLDFIESTA: {
    description: "Nightlife, festivals, concerts and exclusive clubs.",
    icon: <MusicIcon className="w-6 h-6" />,
  },
  FULLDMOTOR: {
    description: "Car meets, circuit races and tuning exhibitions.",
    icon: <CarIcon className="w-6 h-6" />,
  },
  FULLDFREESTYLE: {
    description: "Rap battles, cyphers and freestyle culture.",
    icon: <MusicIcon className="w-6 h-6" />,
  },
  FULLDURBAN: {
    description: "Skate, BMX and urban sports culture.",
    icon: <ActivityIcon className="w-6 h-6" />,
  },
};

const FALLBACK_META: ModeMeta = {
  description: "Explore this mode",
  icon: <ActivityIcon className="w-6 h-6" />,
};

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choose Mode"
    >
      <div
        className="bg-[#121212] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black">Choose Mode</h2>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">
              Explore by category group
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {GROUPS.map((group) => {
            const meta = MODE_META[group.key as GroupKey] ?? FALLBACK_META;
            const isActive = activeMode === (group.key as GroupKey);

            return (
              <button
                key={group.key}
                onClick={() => {
                  onSelectMode(group.key as GroupKey);
                  onClose();
                }}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl text-left border transition-all active:scale-[0.98] ${isActive
                  ? "bg-white/10 border-white/30 ring-2 ring-white/5 shadow-xl"
                  : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? "bg-white text-black" : "bg-white/5 text-white/40"
                    }`}
                >
                  {meta.icon}
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="font-black text-sm tracking-tight">{group.label}</h3>
                  <p className="text-xs text-gray-500 truncate">{meta.description}</p>
                </div>

                <div className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-700"}`}>
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 text-center">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Modes filter the map and sidebar events
          </p>
        </div>
      </div>
    </div>
  );
};
