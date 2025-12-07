import React, { useState } from 'react';
import { X, Lock, KeyRound, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { User } from '../types';
import { verifyAdminCredentials } from '../services/authService';

interface AdminLoginModalProps {
  onClose: () => void;
  onLoginSuccess: (adminUser: User) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Artificial delay to make it feel like a secure system check
    await new Promise(resolve => setTimeout(resolve, 1000));

    const admin = verifyAdminCredentials(username, password);
    
    if (admin) {
        onLoginSuccess(admin);
    } else {
        setError('Access Denied: Invalid credentials.');
        setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
            <X size={20} />
        </button>

        <div className="p-8">
            <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                    <ShieldCheck size={32} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">Restricted Access</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">System Administrator</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm"
                            placeholder="Enter username"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 text-slate-500" size={16} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-sm"
                            placeholder="••••••••••••"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-lg font-bold shadow-lg shadow-amber-900/20 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Authenticate'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

// Helper icon
const UserIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

export default AdminLoginModal;