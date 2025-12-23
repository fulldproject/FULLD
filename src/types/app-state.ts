import type { Event } from "../data/events";
import type { GroupKey } from "../components/Navbar";
import type { User } from "../App";

export type FilterState = {
    group: GroupKey;
    // Future: dateRange, etc.
};

export type EventsState = {
    allItems: Event[];
    loading: boolean;
};

export type UIState = {
    selectedEventId: string | null;
    mobileSnapIndex: 0 | 1 | 2;
    showLoginModal: boolean;

    // Create Flow
    pickLocationMode: boolean;
    pickedCoords: { lat: number; lon: number } | null;
    showAdminPanel: boolean;

    // Edition Flow
    showEditionModal: boolean;
    eventForEditionId: string | null; // storing ID is safer for serialization
};

export type GlobalState = {
    user: User | null;
};
