import React from 'react';


interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className
}) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 animate-in fade-in zoom-in duration-300 ${className}`}>
            {icon && (
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <div className="text-gray-500 w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                        {icon}
                    </div>
                </div>
            )}
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 mt-1 max-w-xs leading-relaxed">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
};
