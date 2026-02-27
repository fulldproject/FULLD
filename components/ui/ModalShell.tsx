import React, { useEffect, useMemo, useRef, useId } from "react";
import ReactDOM from "react-dom";
import { CloseIcon } from "../Icons";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
type ModalAlign = "center" | "top";

interface ModalShellProps {
    isOpen: boolean;
    onClose: () => void;

    title: string;
    subtitle?: string;

    children: React.ReactNode;
    footer?: React.ReactNode;

    /** Layout */
    size?: ModalSize;              // default "lg"
    align?: ModalAlign;            // default "center"
    className?: string;            // extra classes

    /** Behavior */
    closeOnOverlayClick?: boolean; // default true
    closeOnEsc?: boolean;          // default true
    showCloseButton?: boolean;     // default true

    /** UX */
    initialFocusSelector?: string; // e.g. "#first-input"
    mobileSheet?: boolean;         // default true (en móvil se siente mejor)
}

const sizeToClass: Record<ModalSize, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "max-w-none w-[min(1200px,100%)]",
};

function getFocusableElements(root: HTMLElement): HTMLElement[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    return Array.from(root.querySelectorAll<HTMLElement>(selector))
        .filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
}

export const ModalShell: React.FC<ModalShellProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,

    size = "lg",
    align = "center",
    className = "",

    closeOnOverlayClick = true,
    closeOnEsc = true,
    showCloseButton = true,

    initialFocusSelector,
    mobileSheet = true,
}) => {
    const titleId = useId();
    const subtitleId = useId();
    const portalTarget = useMemo(() => (typeof document === "undefined" ? null : document.body), []);

    const dialogRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    // Scroll lock PRO (restaura y evita jump por scrollbar)
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocused.current = document.activeElement as HTMLElement;

        const body = document.body;
        const prevOverflow = body.style.overflow;
        const prevPaddingRight = body.style.paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        body.style.overflow = "hidden";
        if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPaddingRight;
        };
    }, [isOpen]);

    // Close on ESC
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, closeOnEsc, onClose]);

    // Focus management + Focus trap
    useEffect(() => {
        if (!isOpen) return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        // Focus initial
        const toFocus =
            (initialFocusSelector ? (dialog.querySelector(initialFocusSelector) as HTMLElement | null) : null) ||
            getFocusableElements(dialog)[0] ||
            dialog;

        // tiny delay for portal render
        const t = window.setTimeout(() => {
            toFocus?.focus?.();
        }, 0);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const focusables = getFocusableElements(dialog);
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement;

            if (e.shiftKey) {
                if (active === first || !dialog.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        dialog.addEventListener("keydown", onKeyDown);

        return () => {
            window.clearTimeout(t);
            dialog.removeEventListener("keydown", onKeyDown);

            // Restore focus
            previouslyFocused.current?.focus?.();
            previouslyFocused.current = null;
        };
    }, [isOpen, initialFocusSelector]);

    if (!isOpen || !portalTarget) return null;

    const isCenter = align === "center";

    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-auto"
            role="presentation"
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
                onMouseDown={closeOnOverlayClick ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Dialog wrapper */}
            <div
                className={[
                    "relative w-full z-50 pointer-events-auto",
                    sizeToClass[size],
                    mobileSheet ? "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:p-0" : "",
                    align === "top" && !mobileSheet ? "self-start mt-10" : "",
                    className,
                ].join(" ")}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={subtitle ? subtitleId : undefined}
                    tabIndex={-1}
                    className={[
                        "bg-[var(--bg-secondary)] border border-[var(--border)] shadow-2xl overflow-hidden outline-none",
                        "flex flex-col",
                        // height
                        mobileSheet
                            ? "max-h-[85vh] max-sm:max-h-[92vh] max-sm:rounded-t-3xl max-sm:rounded-b-none"
                            : "max-h-[85vh] rounded-2xl",
                        // animation
                        "animate-in fade-in zoom-in-95 duration-200 slide-in-from-bottom-5",
                    ].join(" ")}
                >
                    {/* Header */}
                    <header className="h-16 px-5 sm:px-6 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
                        <div className="min-w-0">
                            <h2 id={titleId} className="text-lg font-black text-[var(--text-primary)] tracking-tight truncate">
                                {title}
                            </h2>
                            {subtitle && (
                                <p
                                    id={subtitleId}
                                    className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-widest mt-0.5 truncate"
                                >
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition"
                                aria-label="Close"
                                title="Close"
                                type="button"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        )}
                    </header>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-6 text-[var(--text-primary)] relative">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="p-4 px-5 sm:px-6 border-t border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-end gap-3 flex-shrink-0">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        portalTarget
    );
};
