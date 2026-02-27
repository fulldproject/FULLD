import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

// Shared styles
const labelStyles = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1 block mb-1.5";
const inputStyles = "w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all disabled:opacity-50 disabled:cursor-not-allowed";
const errorInputStyles = "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]";
const errorTextStyles = "text-xs text-[var(--danger)] pl-1 mt-1 font-medium";
const helperTextStyles = "text-[10px] text-[var(--text-muted)] pl-1 mt-1 font-medium";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && <label className={labelStyles}>{label}</label>}
                <input
                    ref={ref}
                    className={`${inputStyles} ${error ? errorInputStyles : ""} ${className}`}
                    {...props}
                />
                {error ? (
                    <p className={errorTextStyles}>{error}</p>
                ) : helperText ? (
                    <p className={helperTextStyles}>{helperText}</p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ label, error, helperText, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && <label className={labelStyles}>{label}</label>}
                <textarea
                    ref={ref}
                    className={`${inputStyles} resize-none ${error ? errorInputStyles : ""} ${className}`}
                    {...props}
                />
                {error ? (
                    <p className={errorTextStyles}>{error}</p>
                ) : helperText ? (
                    <p className={helperTextStyles}>{helperText}</p>
                ) : null}
            </div>
        );
    }
);

TextArea.displayName = "TextArea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helperText?: string;
    options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, helperText, options, className = "", ...props }, ref) => {
        return (
            <div className="w-full">
                {label && <label className={labelStyles}>{label}</label>}
                <div className="relative">
                    <select
                        ref={ref}
                        className={`${inputStyles} appearance-none ${error ? errorInputStyles : ""} ${className}`}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[var(--bg-tertiary)]">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <svg
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M1 1L5 5L9 1"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
                {error ? (
                    <p className={errorTextStyles}>{error}</p>
                ) : helperText ? (
                    <p className={helperTextStyles}>{helperText}</p>
                ) : null}
            </div>
        );
    }
);

Select.displayName = "Select";
