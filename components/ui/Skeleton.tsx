import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
);

export const SkeletonCircle: React.FC<{ size?: string | number; className?: string }> = ({ size = 12, className }) => (
    <div
        className={`animate-pulse bg-white/5 rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
    />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 1, className }) => (
    <div className={`space-y-2 ${className}`}>
        {[...Array(lines)].map((_, i) => (
            <Skeleton key={i} className={`h-4 w-${i === lines - 1 ? '2/3' : 'full'}`} />
        ))}
    </div>
);
