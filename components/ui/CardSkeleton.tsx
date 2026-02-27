import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonText } from './Skeleton';

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="aspect-video w-full bg-white/5 animate-pulse relative">
                <div className="absolute top-4 left-4">
                    <Skeleton className="w-16 h-6 rounded-md" />
                </div>
            </div>
            <div className="p-6 space-y-4">
                <SkeletonText lines={2} />
                <div className="flex items-center gap-2 pt-2">
                    <SkeletonCircle size="24px" />
                    <Skeleton className="w-24 h-4" />
                </div>
            </div>
        </div>
    );
};

export const ListItemSkeleton: React.FC = () => (
    <div className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 h-24 items-center">
        <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
        <div className="flex-grow space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
        </div>
    </div>
);
