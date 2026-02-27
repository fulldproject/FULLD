import React, { ReactNode } from "react";
import { ToastProvider } from "./ToastContext";
import ErrorBoundary from "./ErrorBoundary";
import { CookieBanner } from "../features/legal/CookieBanner";

interface LayoutProps {
    children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <ErrorBoundary>
            <ToastProvider>
                <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased">
                    {children}
                    <CookieBanner />
                </div>
            </ToastProvider>
        </ErrorBoundary>
    );
};
