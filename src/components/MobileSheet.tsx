// src/components/MobileSheet.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

type Snap = 0 | 1 | 2;

type Props = {
    snap: Snap;
    onSnapChange: (s: Snap) => void;
    title?: string;
    children: React.ReactNode;
    onDraggingChange?: (dragging: boolean) => void;
};

const SNAP_TO_VH: Record<Snap, number> = {
    0: 25, // panel pequeño (mapa grande)
    1: 60, // default: panel 60% + mapa 40%
    2: 85, // panel grande (mapa pequeño)
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
    const stateRef = useRef<"IDLE" | "CHECKING" | "DRAGGING" | "LOCKED">("IDLE");

    const [dragging, setDragging] = useState(false);
    const [vh, setVh] = useState<number>(SNAP_TO_VH[snap]);

    // reflect parent snap when not dragging
    useEffect(() => {
        if (!dragging) setVh(SNAP_TO_VH[snap]);
    }, [snap, dragging]);

    useEffect(() => {
        onDraggingChange?.(dragging);
    }, [dragging, onDraggingChange]);

    const nearestSnap = (value: number): Snap => {
        const candidates: Array<[Snap, number]> = [
            [0, SNAP_TO_VH[0]],
            [1, SNAP_TO_VH[1]],
            [2, SNAP_TO_VH[2]],
        ];
        let best: Snap = 1;
        let bestDist = Infinity;
        for (const [s, p] of candidates) {
            const d = Math.abs(value - p);
            if (d < bestDist) {
                bestDist = d;
                best = s;
            }
        }
        return best;
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

        startYRef.current = e.clientY;
        startXRef.current = e.clientX;
        startVhRef.current = vh;

        stateRef.current = "CHECKING";
        setDragging(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = stateRef.current;
        if (state === "IDLE" || state === "LOCKED") return;
        if (startYRef.current == null || startXRef.current == null) return;

        const dy = e.clientY - startYRef.current;
        const dx = e.clientX - startXRef.current;

        if (state === "CHECKING") {
            const TH = 8;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            if (absX < TH && absY < TH) return;

            // lock horizontal gestures (so swipe doesn't break layout)
            if (absX > absY) {
                stateRef.current = "LOCKED";
                setDragging(false);
                return;
            }

            stateRef.current = "DRAGGING";
        }

        if (stateRef.current === "DRAGGING") {
            const viewport = Math.max(window.innerHeight, 1);
            const deltaVh = (-dy / viewport) * 100; // drag up => more vh
            const next = clamp(startVhRef.current + deltaVh, 25, 85);
            setVh(next);
        }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        try {
            (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
        } catch { }

        const state = stateRef.current;

        startYRef.current = null;
        startXRef.current = null;
        stateRef.current = "IDLE";
        setDragging(false);

        if (state === "DRAGGING") {
            const s = nearestSnap(vh);
            onSnapChange(s);
            setVh(SNAP_TO_VH[s]);
        }
    };

    const indicator = useMemo(() => {
        if (snap === 0) return "▼";
        if (snap === 2) return "▲";
        return "↕";
    }, [snap]);

    return (
        <div
            className="absolute left-0 right-0 top-0 z-30 bg-[#0f0f10] text-white border-b border-white/10 flex flex-col"
            style={{ height: `${vh}vh`, willChange: dragging ? "height" : undefined }}
        >
            {/* Handle */}
            <div
                className={`h-[56px] shrink-0 px-4 flex items-center justify-between select-none ${dragging ? "cursor-grabbing" : "cursor-grab"
                    }`}
                style={{ touchAction: "pan-y" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-1.5 rounded-full ${dragging ? "bg-white" : "bg-white/20"}`} />
                    <div className="text-sm font-semibold">{title}</div>
                </div>
                <div className="text-xs text-white/60">{indicator}</div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </div>
    );
};
