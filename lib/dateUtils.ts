import { Edition } from '../types';

/**
 * Formats a date or date range to Spanish locale.
 * Example: "12 ene 2026" or "12 – 14 ene 2026"
 */
export const formatEventDate = (edition: Edition | null | undefined): string => {
    if (!edition) return 'TBA';

    if (edition.date_mode === 'text') {
        return edition.date_text || 'TBA';
    }

    if (!edition.date_start) return 'TBA';

    const start = new Date(edition.date_start);
    const end = edition.date_end ? new Date(edition.date_end) : null;

    const dayFmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric' });
    const monthFmt = new Intl.DateTimeFormat('es-ES', { month: 'short' });
    const yearFmt = new Intl.DateTimeFormat('es-ES', { year: 'numeric' });

    if (!end || isSameDay(start, end)) {
        return `${dayFmt.format(start)} ${monthFmt.format(start).replace('.', '')} ${yearFmt.format(start)}`;
    }

    // Same month range
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${dayFmt.format(start)} – ${dayFmt.format(end)} ${monthFmt.format(start).replace('.', '')} ${yearFmt.format(start)}`;
    }

    // Different month same year
    if (start.getFullYear() === end.getFullYear()) {
        return `${dayFmt.format(start)} ${monthFmt.format(start).replace('.', '')} – ${dayFmt.format(end)} ${monthFmt.format(end).replace('.', '')} ${yearFmt.format(start)}`;
    }

    // Different year
    return `${dayFmt.format(start)} ${monthFmt.format(start).replace('.', '')} ${yearFmt.format(start)} – ${dayFmt.format(end)} ${monthFmt.format(end).replace('.', '')} ${yearFmt.format(end)}`;
};

const isSameDay = (d1: Date, d2: Date): boolean => {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
};
