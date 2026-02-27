import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CookieBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('fulld_consent');
        if (!consent) {
            // Small delay for animation
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = (type: 'all' | 'essential') => {
        const consent = {
            essential: true,
            analytics: type === 'all',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('fulld_consent', JSON.stringify(consent));
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl shadow-2xl backdrop-blur-xl bg-opacity-95">
                <h3 className="text-white font-bold text-lg mb-2">Cookie Preferences</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-6">
                    We use cookies to ensure FULLD works properly. We'd also like to use analytics cookies to help us improve our map.
                    <br />
                    <Link to="/cookies" className="text-white underline underline-offset-2 hover:text-gray-300 mt-1 inline-block">
                        Read Cookie Policy
                    </Link>
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleAccept('all')}
                        className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl text-sm hover:bg-gray-200 transition-colors active:scale-[0.98]"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={() => handleAccept('essential')}
                        className="w-full bg-white/5 text-white font-medium py-3 px-4 rounded-xl text-sm hover:bg-white/10 transition-colors border border-white/10 active:scale-[0.98]"
                    >
                        Essential Only
                    </button>
                </div>
            </div>
        </div>
    );
};
