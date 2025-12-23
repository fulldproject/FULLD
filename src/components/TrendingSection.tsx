// src/components/TrendingSection.tsx
import React from "react";

// Placeholder data for visual design
const TRENDING_ITEMS = [
    { id: 1, title: "Neon Nights", subtitle: "22:00 · Club Zero", image: "from-blue-600 to-purple-600" },
    { id: 2, title: "Rooftop Vibes", subtitle: "18:00 · Sky Bar", image: "from-orange-500 to-red-600" },
    { id: 3, title: "Beach Party", subtitle: "16:00 · Playa", image: "from-cyan-500 to-blue-500" },
];

export const TrendingSection: React.FC = () => {
    return (
        <div className="flex flex-col gap-3 py-2">
            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">
                    Burning Now 🔥
                </h3>
                <button className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded-full transition">
                    View all
                </button>
            </div>

            {/* Horizontal Scroll Container */}
            {/* 
         - -mx-4: Negative margin to bleed to edges 
         - px-4: Padding to align first item with content
         - snap-x: Snap physics
      */}
            <div
                className="
          flex gap-3 overflow-x-auto snap-x snap-mandatory 
          -mx-4 px-4 pb-4 no-scrollbar
        "
                style={{ scrollbarWidth: "none" }} // Firefox hide scrollbar
            >
                <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; } 
        `}</style>

                {TRENDING_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        className="group relative flex-none w-[140px] h-[180px] rounded-2xl overflow-hidden snap-start focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        {/* Background Image / Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.image} opacity-80 group-hover:opacity-100 transition duration-500`} />

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-3 text-left">
                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-auto border border-white/20">
                                <span className="text-xs">⚡</span>
                            </div>

                            <div className="font-bold text-white text-sm leading-tight mb-0.5">
                                {item.title}
                            </div>
                            <div className="text-[10px] text-white/70 font-medium">
                                {item.subtitle}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
