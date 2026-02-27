import React, { useState, useRef, useEffect } from 'react';

interface MobileSheetProps {
  children: React.ReactNode;
  snapPoints: number[]; // Pixels from bottom
  currentSnap: number;
  onSnapChange: (y: number) => void;
}

export const MobileSheet: React.FC<MobileSheetProps> = ({ 
  children, 
  snapPoints, 
  currentSnap,
  onSnapChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const sheetStartY = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    sheetStartY.current = currentSnap;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = dragStartY.current - e.clientY;
    // Allow slight bounce beyond snap points
    const newY = Math.max(snapPoints[0] - 20, Math.min(snapPoints[snapPoints.length - 1] + 20, sheetStartY.current + deltaY));
    onSnapChange(newY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap to closest point
    const closest = snapPoints.reduce((prev, curr) => {
      return Math.abs(curr - currentSnap) < Math.abs(prev - currentSnap) ? curr : prev;
    });
    onSnapChange(closest);
  };

  return (
    <div 
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 bg-[#000] rounded-t-[32px] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[40] flex flex-col overflow-hidden transition-transform duration-300 ease-out ${isDragging ? 'transition-none' : ''}`}
      style={{ 
        height: `${currentSnap}px`,
        transform: `translateY(0)` 
      }}
    >
      {/* Draggable Handle */}
      <div 
        className="w-full h-12 flex items-center justify-center cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full" />
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};
