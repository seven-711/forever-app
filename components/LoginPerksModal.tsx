
import React, { useState } from 'react';
import { History, Sparkles, X, User as UserIcon, LogOut, Loader2, Mail, KeyRound, CheckCircle, ArrowRight, ShieldCheck, Edit2, Check, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';
import { generateOTP, sendOtpEmail } from '../services/brevoService';

interface LoginPerksModalProps {
  onClose: () => void;
  onLogout: () => void;
  currentUser: User | null;
  onUserLoginSuccess: (user: User) => void;
  onUpdateName?: (newName: string) => void;
  onAdminTrigger: () => void;
}

const LoginPerksModal: React.FC<LoginPerksModalProps> = ({ 
    onClose, 
    onLogout, 
    currentUser, 
    onUserLoginSuccess,
    onUpdateName,
    onAdminTrigger
}) => {
  // Login State
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Handle Step 1: Send Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
    }

    setIsLoading(true);
    const code = generateOTP();
    setGeneratedOtp(code);
    
    // Call Brevo Service
    const emailSent = await sendOtpEmail(email, code);
    
    setIsLoading(false);

    if (emailSent) {
        setStep('otp');
    } else {
        // Secure Fail: Do not show code, show error instead.
        setError('Could not send verification email. Please check your connection or try again later.');
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Artificial delay for effect
    await new Promise(r => setTimeout(r, 800));

    if (otp === generatedOtp) {
        const newUser: User = {
            isLoggedIn: true,
            email: email,
            name: email.split('@')[0], // Use part of email as name initially
            isPremium: false,
            isAdmin: false
        };
        onUserLoginSuccess(newUser);
    } else {
        setError('Invalid code. Please check your email and try again.');
        setIsLoading(false);
    }
  };

  const startEditing = () => {
    if (currentUser?.name) {
        setTempName(currentUser.name);
        setIsEditingName(true);
    }
  };

  const saveName = () => {
    if (onUpdateName && tempName.trim()) {
        onUpdateName(tempName.trim());
        setIsEditingName(false);
    }
  };

  // If already logged in (Admin or User), show Profile/Logout view
  if (currentUser) {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-indigo-900/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm bg-white border border-white/50 rounded-3xl shadow-2xl shadow-indigo-900/10 overflow-hidden">
                <div className={`p-8 text-center relative overflow-hidden ${currentUser.isAdmin ? 'bg-slate-900' : 'bg-gradient-to-r from-slate-800 to-slate-900'}`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                    
                    <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 border border-white/20 shadow-inner backdrop-blur-md overflow-hidden ${currentUser.isAdmin ? 'bg-amber-500/10' : 'bg-white/10'}`}>
                         {currentUser.isAdmin ? (
                            <ShieldCheck size={40} className="text-amber-500" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-3xl">
                                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon />}
                            </div>
                         )}
                    </div>
                    
                    {/* Editable Name Area */}
                    <div className="relative min-h-[32px] flex items-center justify-center gap-2 mb-1">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <input 
                                    type="text" 
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="bg-transparent border-b border-white/40 text-white font-serif font-bold text-xl text-center focus:outline-none focus:border-white w-40"
                                    autoFocus
                                    maxLength={25}
                                />
                                <button onClick={saveName} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                                    <Check size={18} />
                                </button>
                                <button onClick={() => setIsEditingName(false)} className="text-rose-400 hover:text-rose-300 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="group flex items-center justify-center gap-2">
                                <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                                    {currentUser.name}
                                </h2>
                                {!currentUser.isAdmin && (
                                    <button 
                                        onClick={startEditing} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white"
                                        title="Edit display name"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-slate-400 text-xs uppercase tracking-widest mt-1 font-semibold">
                        {currentUser.email}
                    </p>
                    {currentUser.isAdmin && (
                        <span className="inline-block mt-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            System Admin
                        </span>
                    )}
                </div>
                
                <div className="p-6">
                    <button 
                        onClick={() => { onLogout(); onClose(); }}
                        className="w-full py-3 bg-white border border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
  }

  // Custom Login View
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-indigo-900/20 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-white/50 rounded-3xl shadow-2xl shadow-indigo-900/10 overflow-hidden transition-all duration-300 max-h-[90vh] overflow-y-auto">
        
        {/* Header Section */}
        <div className="relative h-28 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl"></div>
            <div className="absolute top-4 right-4 z-20">
                <button onClick={onClose} className="text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-1 hover:bg-white/20">
                    <X size={20} />
                </button>
            </div>
            <Sparkles className="text-white/20 w-24 h-24 absolute top-2 left-4 animate-pulse" />
            <h2 className="text-2xl font-serif text-white z-10 font-bold tracking-tight">Join Forever</h2>
        </div>

        {/* Form Content */}
        <div className="p-8 animate-fade-in">
            
            {step === 'email' ? (
                <form onSubmit={handleSendCode}>
                     <p className="text-slate-600 text-center mb-6 font-medium leading-relaxed text-sm">
                        Enter your email to receive a secure login code. No passwords required.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                                required
                            />
                        </div>
                        
                        {error && <p className="text-rose-500 text-xs text-center bg-rose-50 p-2 rounded-lg">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Send Code <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerifyCode}>
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Mail size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800">Check your email</h3>
                        <p className="text-xs text-slate-500 mt-1">We sent a code to <span className="font-semibold text-purple-600">{email}</span></p>
                    </div>

                    <div className="space-y-4">
                         <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-800 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
                                required
                            />
                        </div>
                        
                        {error && <p className="text-rose-500 text-xs text-center">{error}</p>}

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Verify & Login <CheckCircle size={16} /></>}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => { setStep('email'); setError(''); }}
                            className="w-full text-xs text-slate-400 hover:text-slate-600 mt-2"
                        >
                            Change Email
                        </button>
                    </div>
                </form>
            )}

            {/* Perks Icons (Bottom) */}
            <div className="mt-8 flex justify-center gap-6 border-t border-slate-100 pt-6">
                 <div className="flex flex-col items-center gap-1 text-slate-400">
                    <History size={16} />
                    <span className="text-[10px]">History</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImageIcon size={16} />
                    <span className="text-[10px]">Photos</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Sparkles size={16} />
                    <span className="text-[10px]">AI Polish</span>
                 </div>
                 <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ShieldCheck size={16} />
                    <span className="text-[10px]">Verified</span>
                 </div>
            </div>

            {/* SECRET ADMIN TRIGGER */}
            <div className="text-center mt-4">
                <button 
                    onClick={onAdminTrigger}
                    className="text-[10px] text-slate-300 hover:text-slate-400 transition-colors cursor-default hover:cursor-text"
                >
                    Forever App &copy; 2025
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPerksModal;
