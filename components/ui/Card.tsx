import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    variant?: "default" | "outline" | "ghost";
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = "default",
    className = "",
    ...props
}) => {
    const baseStyles = "rounded-xl overflow-hidden";

    const variants = {
        default: "bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm",
        outline: "bg-transparent border border-[var(--border)]",
        ghost: "bg-transparent border-none",
    };

    return (
        <div
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
    <div className={`p-6 pb-3 ${className}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = "", ...props }) => (
    <h3 className={`text-lg font-bold text-[var(--text-primary)] leading-none tracking-tight ${className}`} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = "", ...props }) => (
    <p className={`text-sm text-[var(--text-muted)] mt-1.5 ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
    <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", ...props }) => (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);
