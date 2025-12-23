// src/components/MobileSheet.tsx
import React, { useEffect, useRef, useState } from "react";

type Snap = 0 | 1 | 2;

type Props = {
    snap: Snap;
    onSnapChange: (s: Snap) => void;
    title?: string;
    children: React.ReactNode;
    onDraggingChange?: (dragging: boolean) => void;
};

// 0: pequeño (25%), 1: medio (60%), 2: grande (85%)
// 0: pequeño (25%), 1: medio (60%), 2: grande (85%)
export const SNAP_TO_VH: Record<Snap, number> = {
    0: 25,
    1: 60,
    2: 85,
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export const MobileSheet: React.FC<Props> = ({
    snap,
    onSnapChange,
    title,
    children,
    onDraggingChange,
}) => {
    const startYRef = useRef<number | null>(null);
    const startXRef = useRef<number | null>(null);
    const startVhRef = useRef<number>(SNAP_TO_VH[snap]);

    // State machine for drag gesture
    const stateRef = useRef<"IDLE" | "CHECKING" | "DRAGGING" | "LOCKED">("IDLE");

    const [dragging, setDragging] = useState(false);
    const [vh, setVh] = useState<number>(SNAP_TO_VH[snap]);

    // Sync with parent snap prop
    useEffect(() => {
        if (!dragging) {
            setVh(SNAP_TO_VH[snap]);
        }
    }, [snap, dragging]);

    // Notify parent about dragging state
    useEffect(() => {
        onDraggingChange?.(dragging);
    }, [dragging, onDraggingChange]);

    const nearestSnap = (currentVh: number): Snap => {
        // 0=25, 1=60, 2=85
        const candidates: Array<[Snap, number]> = [
            [0, SNAP_TO_VH[0]],
            [1, SNAP_TO_VH[1]],
            [2, SNAP_TO_VH[2]],
        ];

        let best: Snap = 1;
        let minDiff = Infinity;

        for (const [s, targetVh] of candidates) {
            const diff = Math.abs(currentVh - targetVh);
            if (diff < minDiff) {
                minDiff = diff;
                best = s;
            }
        }
        return best;
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Only allow left click or touch
        if (e.button !== 0) return;

        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

        startYRef.current = e.clientY;
        startXRef.current = e.clientX;
        startVhRef.current = vh; // Capture current height at start of drag

        stateRef.current = "CHECKING";
        setDragging(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = stateRef.current;
        if (state === "IDLE" || state === "LOCKED") return;
        if (startYRef.current == null || startXRef.current == null) return;

        const dy = e.clientY - startYRef.current; // Positive = Down
        const dx = e.clientX - startXRef.current;

        // CHECKING phase: decide if vertical drag or horizontal swipe
        if (state === "CHECKING") {
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const THRESHOLD = 8; // px

            if (absX < THRESHOLD && absY < THRESHOLD) return; // Wait for more movement

            // If checks horizontal more than vertical => Lock it (don't drag panel)
            if (absX > absY) {
                stateRef.current = "LOCKED";
                setDragging(false); // Cancel "dragging" visual state
                return;
            }

            // Otherwise confirm vertical drag
            stateRef.current = "DRAGGING";
        }

        // DRAGGING phase: update height
        if (stateRef.current === "DRAGGING") {
            e.preventDefault(); // Prevent unexpected browser behaviors

            const viewportH = window.innerHeight || 1;

            // Calculate delta percentage
            // Dragging DOWN (dy > 0) increases top panel height?
            // WAIT: The panel is at the TOP. `height: vh`.
            // The handle is at the BOTTOM of the panel.
            // So dragging DOWN (dy > 0) INCREASES the height.
            const deltaVh = (dy / viewportH) * 100;

            const newVh = clamp(startVhRef.current + deltaVh, 25, 85);
            setVh(newVh);
        }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        try {
            (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        } catch { }

        const finalState = stateRef.current;

        // Reset interaction refs
        startYRef.current = null;
        startXRef.current = null;
        stateRef.current = "IDLE";
        setDragging(false);

        // If we were effectively dragging, snap to nearest
        if (finalState === "DRAGGING") {
            // 1. Deadzone / Resistance: If moved less than threshold, snap back to start
            const dist = Math.abs(vh - startVhRef.current);
            const MIN_DRAG_THRESHOLD_VH = 5;

            let s: Snap;
            if (dist < MIN_DRAG_THRESHOLD_VH) {
                s = nearestSnap(startVhRef.current); // Use start, effectively "snap back"
            } else {
                s = nearestSnap(vh);
            }

            onSnapChange(s);
            // We also verify snap immediately to avoid visual glitch until effect runs
            setVh(SNAP_TO_VH[s]);
        }
    };

    return (
        <div
            className="absolute top-0 left-0 right-0 z-30 flex flex-col bg-[#0f0f10] border-b border-white/10"
            // Apply height. Use will-change to notify browser of optimization.
            style={{
                height: `${vh}vh`,
                willChange: dragging ? "height" : "auto",
                transition: dragging ? "none" : "height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
            }}
        >
            {/* 1. Header (Static, Non-draggable) */}
            <div className="flex-none h-14 px-4 flex items-center border-b border-white/5 bg-[#0f0f10]">
                <div className="font-semibold text-white text-sm truncate">
                    {title}
                </div>
            </div>

            {/* 2. Content (Scrollable) */}
            <div
                className={`
                    flex-1 overflow-y-auto overscroll-contain bg-[#0f0f10] 
                    transition-all duration-500 ease-out
                    ${snap === 0 ? "opacity-40 grayscale blur-[1px]" : "opacity-100 grayscale-0 blur-0"}
                `}
            >
                {children}
            </div>

            {/* 3. Resize Handle (Bottom, Draggable) */}
            <div
                className="flex-none h-9 flex items-center justify-center cursor-row-resize touch-none bg-zinc-900 border-t border-white/10 active:bg-zinc-800 transition-colors z-40 relative"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                {/* Visual Pill */}
                <div
                    className={`
                        w-16 h-1.5 rounded-full transition-all duration-300
                        ${dragging ? "bg-white scale-x-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "bg-white/20"}
                    `}
                />
            </div>
        </div>
    );
};
