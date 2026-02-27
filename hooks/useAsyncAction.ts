import { useState, useCallback } from "react";
import { useToast } from "../components/ToastContext";

interface UseAsyncActionOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
}

interface AsyncActionState<T> {
    isLoading: boolean;
    error: Error | null;
    data: T | null;
}

/**
 * Hook to manage async actions (like form submissions) with:
 * - Loading state
 * - Error handling
 * - Automatic Toast notifications
 * - Double-submit prevention (via isLoading)
 */
export function useAsyncAction<T = any, A extends any[] = any[]>(
    action: (...args: A) => Promise<T>,
    options: UseAsyncActionOptions = {}
) {
    const [state, setState] = useState<AsyncActionState<T>>({
        isLoading: false,
        error: null,
        data: null,
    });

    const { showToast } = useToast();

    const execute = useCallback(
        async (...args: A) => {
            // Prevent double submission
            if (state.isLoading) return;

            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                const result = await action(...args);
                setState({ isLoading: false, error: null, data: result });

                if (options.successMessage) {
                    showToast(options.successMessage, "success");
                }

                options.onSuccess?.(result);
                return result;
            } catch (error: any) {
                const err = error instanceof Error ? error : new Error(String(error || "Unknown error"));
                setState({ isLoading: false, error: err, data: null });

                const msg = options.errorMessage || err.message || "Something went wrong";
                showToast(msg, "error");

                options.onError?.(err);
                // We don't re-throw by default to avoid crashing the UI, 
                // relying on the error state/toast instead.
            }
        },
        [action, options, state.isLoading, showToast]
    );

    const reset = useCallback(() => {
        setState({ isLoading: false, error: null, data: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
}
