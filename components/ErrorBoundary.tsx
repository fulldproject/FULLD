import React, { Component, ErrorInfo, ReactNode } from "react";
import { CopyIcon, CheckIcon, RotateCcwIcon, RefreshIcon } from "./Icons";

type Props = {
    children: ReactNode;
};

type State = {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    copied: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        copied: false
    };

    constructor(props: Props) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleCopyError = () => {
        const { error, errorInfo } = this.state;
        const text = `Error: ${error?.message}\n\nStack:\n${errorInfo?.componentStack || error?.stack || "No stack trace available"}`;

        navigator.clipboard.writeText(text).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        }).catch(err => console.error("Failed to copy error:", err));
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6 text-[var(--text-primary)] font-sans overflow-auto">
                    <div className="max-w-2xl w-full space-y-6 text-center animate-in fade-in duration-300 my-auto">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">
                                Something went wrong
                            </h1>
                            <p className="text-[var(--text-muted)]">
                                The application encountered an unexpected error.
                            </p>
                        </div>

                        {/* DEV ONLY: Detailed Error View */}
                        {isDev && this.state.error && (
                            <div className="bg-black/50 border border-red-500/30 rounded-xl overflow-hidden text-left shadow-2xl">
                                <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20 flex items-center justify-between">
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                                        Developer Error Details
                                    </span>
                                    <button
                                        onClick={this.handleCopyError}
                                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                    >
                                        {this.state.copied ? (
                                            <>
                                                <CheckIcon className="w-3 h-3 text-green-400" />
                                                <span className="text-green-400">Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <CopyIcon className="w-3 h-3" />
                                                <span>Copy Stack</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="p-4 space-y-3 overflow-auto max-h-[60vh]">
                                    <div>
                                        <p className="font-mono text-sm text-red-300 break-words font-bold">
                                            {this.state.error.name}: {this.state.error.message}
                                        </p>
                                    </div>
                                    {this.state.errorInfo && (
                                        <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                    {!this.state.errorInfo && this.state.error.stack && (
                                        <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">
                                            {this.state.error.stack}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isDev && (
                            <div className="p-8 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)]">
                                <p className="text-sm text-[var(--text-muted)]">
                                    Our team has been notified. Please try reloading the page.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold rounded-lg hover:bg-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshIcon className="w-4 h-4" />
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-2"
                            >
                                <RotateCcwIcon className="w-4 h-4" />
                                Try Resetting App
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
