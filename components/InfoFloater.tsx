import React, { useState } from 'react';
import { BookOpen, Shield, AlertCircle, FileText, X, Info, ChevronRight, Heart, MessageSquarePlus, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { submitFeedback } from '../services/supabaseService';

type Tab = 'guide' | 'safety' | 'rules' | 'terms' | 'feedback';

const InfoFloater: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  
  // Feedback State
  const [feedback, setFeedback] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const tabs = [
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'rules', label: 'Rules', icon: AlertCircle },
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
  ];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setFeedbackStatus('submitting');

    // Call service
    await submitFeedback(feedback.trim());
    
    // Artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    setFeedbackStatus('success');
    setFeedback('');

    // Reset to idle after 3 seconds
    setTimeout(() => {
        setFeedbackStatus('idle');
    }, 3000);
  };

  return (
    <>
      {/* Floating Trigger Button - Enhanced */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed left-4 bottom-20 md:bottom-8 z-[900] 
          flex items-center gap-2.5 px-5 py-3 md:py-3
          rounded-full shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out
          border border-white/60
          group
          ${isOpen 
            ? 'bg-white text-purple-600 ring-4 ring-purple-100/50 shadow-purple-200/50' 
            : 'bg-white/80 hover:bg-white text-slate-600 hover:text-purple-700 hover:shadow-purple-900/10 hover:-translate-y-1 hover:border-purple-100'
          }
        `}
      >
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-90' : 'group-hover:rotate-12'}`}>
           {isOpen ? <X size={18} strokeWidth={2.5} /> : <Info size={18} strokeWidth={2.5} />}
        </div>
        <span className={`font-serif font-bold tracking-wide text-sm transition-colors ${isOpen ? 'text-purple-700' : 'text-slate-700 group-hover:text-purple-700'}`}>
          {isOpen ? 'Close' : 'About & Safety'}
        </span>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className={`
            fixed z-[900] animate-fade-in flex flex-col overflow-hidden bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]
            
            /* Mobile Styles: Compact bottom sheet (55% height) instead of full screen */
            left-4 right-4 bottom-20 top-auto h-[55vh] rounded-3xl
            
            /* Desktop Styles: Floating panel */
            md:inset-auto md:left-4 md:bottom-24 md:w-96 md:h-auto md:max-h-[70vh] md:rounded-3xl md:origin-bottom-left
        `}>
          
          {/* Decorative Header */}
          <div className="relative h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shrink-0 overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/3 -translate-y-1/3">
                <Heart size={100} fill="white" />
             </div>
             <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/20 to-transparent">
                 <h2 className="text-white font-serif font-bold text-xl tracking-tight flex items-center gap-2">
                    <Info size={20} className="opacity-80" />
                    Information
                 </h2>
             </div>
             
             {/* Mobile Close Button (Top Right) */}
             <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-3 right-3 p-2 bg-black/10 rounded-full text-white backdrop-blur-sm">
                <X size={16} />
             </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between bg-slate-50/90 border-b border-slate-100 p-2 overflow-x-auto no-scrollbar shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-sm ring-1 ring-purple-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white/50">
            
            {activeTab === 'guide' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                    <h3 className="text-lg font-serif font-bold text-slate-800 mb-2">Welcome to Forever</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        A sanctuary for digital memories attached to the physical world. Leave a part of yourself in the places that matter.
                    </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-start group">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform">1</div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Explore & Search</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Find a meaningful spot using the search bar or by drifting through the map.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform">2</div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Leave a Mark</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Click <strong>"Leave a Note"</strong>. Drag the pin to the exact bench, corner, or room.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start group">
                    <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm group-hover:scale-110 transition-transform">3</div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700">Poetic Polish</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Write from the heart, then use our AI tool to refine your words into something timeless.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-5 animate-fade-in">
                <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 flex items-start gap-3">
                  <Shield className="text-teal-600 shrink-0 mt-0.5" size={18} />
                  <div>
                      <h4 className="text-sm font-bold text-teal-800">Your Safety First</h4>
                      <p className="text-xs text-teal-600 mt-1 leading-relaxed">
                        Forever is designed to be a safe, private space. We prioritize your anonymity and data security.
                      </p>
                  </div>
                </div>

                <ul className="space-y-4 text-sm text-slate-600">
                  <li className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></div>
                    <div>
                        <strong className="block text-slate-700 text-xs uppercase tracking-wider mb-1">Anonymous by Choice</strong>
                        <span className="text-slate-500 text-xs">You control your identity. Share your name only when you want to.</span>
                    </div>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></div>
                    <div>
                        <strong className="block text-slate-700 text-xs uppercase tracking-wider mb-1">No Real-time Tracking</strong>
                        <span className="text-slate-500 text-xs">We do not track or store your live location history. Only the coordinates of the notes you actively save are stored.</span>
                    </div>
                  </li>
                </ul>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-rose-900">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={16} />
                        <h4 className="font-bold text-sm">Community Guidelines</h4>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                        This is a shared space for emotional connection. Let's keep it safe and respectful for everyone.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <strong className="block mb-1 text-sm text-slate-700">🚫 Zero Tolerance</strong>
                    <p className="text-xs text-slate-500">Hate speech, bullying, doxxing, explicit content, or spam will result in immediate ban.</p>
                  </div>
                  
                  <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <strong className="block mb-1 text-sm text-slate-700">⚠️ Respect Locations</strong>
                    <p className="text-xs text-slate-500">Be mindful that public places may have different meanings for others. Keep content appropriate.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-lg font-serif font-bold text-slate-800">Terms of Service</h3>
                <div className="text-xs text-slate-500 space-y-4 leading-relaxed text-justify bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p>
                    By using <strong>Forever</strong>, you agree to these terms. This platform is provided "as is" for the purpose of sharing emotional connections to locations.
                  </p>
                  <p>
                    <strong>1. User Content:</strong> You retain ownership of the memories you post, but you grant Forever a license to display them on the platform. You are solely responsible for the content you upload.
                  </p>
                  <p>
                    <strong>2. Liability:</strong> Forever is not liable for any actions taken based on the notes found on the map. Do not use this app for emergency services.
                  </p>
                  <p>
                    <strong>3. Content Removal:</strong> We reserve the right to remove any content that violates our Community Rules or is deemed inappropriate, without prior notice.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 text-center pt-2">
                    Made with 🤍 Forever App &copy; 2025 by July
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="space-y-4 animate-fade-in h-full flex flex-col">
                 <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-indigo-900">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                        <MessageSquarePlus size={16} />
                        Help Us Improve
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                        Have a feature idea or found a bug? Your feedback helps shape the future of Forever.
                    </p>
                 </div>

                 {feedbackStatus === 'success' ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-2xl border border-green-100 animate-fade-in">
                        <CheckCircle2 size={48} className="text-green-500 mb-3" />
                        <h3 className="font-serif font-bold text-green-800 text-lg">Thank You</h3>
                        <p className="text-xs text-green-700 mt-1">Your feedback has been sent to the team.</p>
                     </div>
                 ) : (
                     <form onSubmit={handleFeedbackSubmit} className="flex-1 flex flex-col gap-3">
                        <textarea 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="I wish the app could..."
                            className="flex-1 min-h-[150px] w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none font-sans"
                            disabled={feedbackStatus === 'submitting'}
                        />
                        <button 
                            type="submit"
                            disabled={!feedback.trim() || feedbackStatus === 'submitting'}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {feedbackStatus === 'submitting' ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={16} />
                                    Submit Feedback
                                </>
                            )}
                        </button>
                     </form>
                 )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default InfoFloater;