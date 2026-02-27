
import React, { useState, useEffect } from 'react';
import { Footer } from '../components/Footer';
import { useAuth } from '../features/auth/AuthContext';
import { UserRole } from '../types';
import { Link } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please log in to view your profile.</h1>
          <Link to="/" className="inline-block px-6 py-2 bg-white text-black font-bold rounded-lg">Go Home</Link>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ username, avatarUrl });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full mb-12">
        <div className="flex items-center gap-4 mb-12">
          <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">← Back to Map</Link>
        </div>

        <h1 className="text-4xl font-black mb-8">Profile Settings</h1>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
              <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow space-y-4 w-full">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Avatar URL (Dicebear seed or direct link)</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-[10px] text-gray-500">Leave empty to generate from username.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Username</label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-white/20"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Email Address (Read Only)</label>
              <input
                type="text"
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
                value={user.email}
              />
            </div>
          </div>

          <div className="space-y-2 opacity-50">
            <label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Assigned Role (Read Only - Managed by Admin)</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-mono uppercase">
              {user.role}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Save Changes
            </button>
            {saved && (
              <span className="text-green-500 text-sm font-bold animate-pulse">Saved successfully!</span>
            )}
          </div>
        </form>
      </div>
      <Footer />
    </div >
  );
};
