import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-black py-8 border-t border-white/10 mt-auto">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-white/80 font-bold text-sm tracking-widest">FULLD</span>
                    <span className="text-gray-600 text-xs">© {new Date().getFullYear()}</span>
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                    <Link to="/legal" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
                        Legal Notice
                    </Link>
                    <Link to="/privacy" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
                        Privacy
                    </Link>
                    <Link to="/terms" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
                        Terms
                    </Link>
                    <Link to="/cookies" className="text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wider">
                        Cookies
                    </Link>
                </nav>
            </div>
        </footer>
    );
};
