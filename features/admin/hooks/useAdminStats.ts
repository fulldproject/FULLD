import { useMemo } from 'react';
import { useEvents } from '../../events/EventsContext';
import { StatusModeration } from '../../../types';

export const useAdminStats = () => {
    const { events, editions } = useEvents();

    const stats = useMemo(() => {
        const totalEvents = events.length;
        const pendingEvents = events.filter(e => e.status_moderation === StatusModeration.PENDING).length;
        const activeEditions = editions.length; // Simplified active logic

        // Group distribution
        const byGroup = events.reduce((acc, curr) => {
            acc[curr.group_key] = (acc[curr.group_key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalEvents,
            pendingEvents,
            activeEditions,
            byGroup
        };
    }, [events, editions]);

    return stats;
};
