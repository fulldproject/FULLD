import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '../../types';
import { LockIcon } from '../../components/Icons';
import { Link } from 'react-router-dom';

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * Route guard that only allows ADMIN or ORGANIZER roles.
 * Shows an "Access Denied" screen if the user doesn't have permissions.
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, isInitialLoading } = useAuth();
    const location = useLocation();

    if (isInitialLoading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse text-sm font-bold uppercase tracking-widest text-gray-500">
                    Verifying Permissions...
                </div>
            </div>
        );
    }

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.ORGANIZER)) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-white p-6">
                <div className="text-center space-y-6 max-w-sm">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10">
                        <LockIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black tracking-tighter">Access Denied</h1>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            This area is restricted to administrators and organizers only.
                            Please contact support if you believe this is an error.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-95 text-xs uppercase tracking-widest"
                        >
                            Return to Map
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
