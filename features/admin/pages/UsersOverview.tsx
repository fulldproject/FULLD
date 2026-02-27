import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '../../../types';

export const UsersOverview: React.FC = () => {
    const { users, loading, error } = useUsers();

    if (loading) return <div className="p-8 text-center animate-pulse">Loading profiles...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white">Users Directory</h1>
                <p className="text-sm text-gray-500">{users.length} registered accounts.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs font-black uppercase tracking-widest text-gray-500">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            user.username?.[0]?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <span className="font-bold text-white">{user.username || "Unknown"}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${user.role === UserRole.ADMIN ? "bg-red-500/20 text-red-500" :
                                            user.role === UserRole.ORGANIZER ? "bg-blue-500/20 text-blue-500" :
                                                "bg-white/5 text-gray-500"
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                    {user.email}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
