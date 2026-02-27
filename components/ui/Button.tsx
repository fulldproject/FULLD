import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    icon,
    className = "",
    disabled,
    ...props
}) => {
    const baseStyles =
        "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
        primary: "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-lg hover:shadow-xl border border-transparent",
        secondary: "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)]",
        danger: "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 hover:bg-[var(--danger)]/20",
        ghost: "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4 py-2 text-sm rounded-xl",
        lg: "h-12 px-8 text-base rounded-2xl",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                icon && <span className="mr-2">{icon}</span>
            )}
            {children}
        </button>
    );
};
