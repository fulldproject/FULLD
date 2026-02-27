import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { EventsManager } from './pages/EventsManager';
import { SuggestionsInbox } from './pages/SuggestionsInbox';
import { UsersOverview } from './pages/UsersOverview';

export const AdminRoutes: React.FC = () => {
    return (
        <AdminLayout>
            <Routes>
                <Route index element={<Dashboard />} />
                <Route path="events" element={<EventsManager />} />
                <Route path="suggestions" element={<SuggestionsInbox />} />
                <Route path="users" element={<UsersOverview />} />
            </Routes>
        </AdminLayout>
    );
};
