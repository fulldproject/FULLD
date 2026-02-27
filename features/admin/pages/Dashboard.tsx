import React from 'react';
import { useAdminStats } from '../hooks/useAdminStats';
import { useUsers } from '../hooks/useUsers';
import { MapPinIcon, UserIcon, CheckIcon, CalendarIcon } from '../../../components/Icons';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; trend?: string }> = ({ label, value, icon, trend }) => (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/5 rounded-xl text-white group-hover:scale-110 transition-transform duration-500">
                    {icon}
                </div>
                {trend && (
                    <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-1 rounded-lg uppercase tracking-widest">
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{value}</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        </div>
    </div>
);

export const Dashboard: React.FC = () => {
    const stats = useAdminStats();
    const { users } = useUsers();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Dashboard Overview</h1>
                <p className="text-sm text-gray-500">Welcome back to the command center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Events"
                    value={stats.totalEvents}
                    icon={<MapPinIcon className="w-6 h-6" />}
                    trend="+12% this week"
                />
                <StatCard
                    label="Active Editions"
                    value={stats.activeEditions}
                    icon={<CalendarIcon className="w-6 h-6" />}
                />
                <StatCard
                    label="Pending Review"
                    value={stats.pendingEvents}
                    icon={<CheckIcon className="w-6 h-6" />}
                    trend={stats.pendingEvents > 0 ? "Action Required" : "All Clear"}
                />
                <StatCard
                    label="Total Users"
                    value={users.length}
                    icon={<UserIcon className="w-6 h-6" />}
                />
            </div>

            {/* Activity Graph Placeholder */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-8 h-96 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-full max-w-md h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="w-2/3 h-full bg-blue-600 rounded-full animate-pulse" />
                </div>
                <p className="text-xs font-mono text-gray-600 uppercase tracking-widest">System Activity • Live Monitoring</p>
            </div>
        </div>
    );
};
