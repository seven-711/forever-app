import React, { useState } from 'react';
import { BookOpen, Shield, AlertCircle, FileText, X, Info, Heart, MessageSquarePlus, Send, CheckCircle2, Loader2, Lightbulb, Bug, HelpCircle, Sparkles } from 'lucide-react';
import { submitFeedback } from '../services/supabaseService';

type Tab = 'guide' | 'safety' | 'rules' | 'terms' | 'feedback';
type FeedbackCategory = 'idea' | 'issue' | 'love' | 'other';

const InfoFloater: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen: externalIsOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined ? onClose : setInternalIsOpen;
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  
  // Feedback State
  const [feedback, setFeedback] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('idea');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const tabs = [
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'rules', label: 'Rules', icon: AlertCircle },
    { id: 'terms', label: 'Terms', icon: FileText },
    { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus },
  ];

  const feedbackCategories: { id: FeedbackCategory; label: string; icon: React.ElementType, placeholder: string }[] = [
      { 
          id: 'idea', 
          label: 'Idea', 
          icon: Lightbulb, 
          placeholder: "I wish the app could..." 
      },
      { 
          id: 'issue', 
          label: 'Issue', 
          icon: Bug, 
          placeholder: "Something isn't working right..." 
      },
      { 
          id: 'love', 
          label: 'Love', 
          icon: Heart, 
          placeholder: "What are you enjoying the most?" 
      },
      { 
          id: 'other', 
          label: 'Other', 
          icon: HelpCircle, 
          placeholder: "Share your thoughts..." 
      }
  ];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setFeedbackStatus('submitting');

    // Call service - append category to content for context
    const fullContent = `[${feedbackCategory.toUpperCase()}] ${feedback.trim()}`;
    await submitFeedback(fullContent);
    
    // Artificial delay for UX
    await new Promise(resolve => setTimeout(resolve, 800));

    setFeedbackStatus('success');
    setFeedback('');

    // Reset to idle after 3 seconds
    setTimeout(() => {
        setFeedbackStatus('idle');
    }, 4000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed z-[910] 
          /* Mobile: Bottom Left */
          bottom-[calc(6rem+env(safe-area-inset-bottom))] left-[calc(1.25rem+env(safe-area-inset-left))] p-3.5
          /* Tablet: Bottom Left */
          md:bottom-[calc(4rem+env(safe-area-inset-bottom))] md:left-[calc(1.25rem+env(safe-area-inset-left))]
          /* Desktop: Bottom Left */
          lg:bottom-8 lg:left-4 lg:px-5 lg:py-3
          
          flex items-center gap-2.5
          rounded-full shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out
          border border-white/60
          group
          ${isOpen 
            ? 'bg-white text-purple-600 ring-4 ring-purple-100/50 shadow-purple-200/50 scale-105' 
            : 'bg-white/80 hover:bg-white text-slate-600 hover:text-purple-700 hover:shadow-purple-900/10 hover:-translate-y-1 hover:border-purple-100'
          }
        `}
      >
        <div className={`transition-transform duration-500 ${isOpen ? 'rotate-90' : 'group-hover:rotate-12'}`}>
           {isOpen ? <X size={18} strokeWidth={2.5} /> : <Info size={18} strokeWidth={2.5} />}
        </div>
        <span className={`font-serif font-bold tracking-wide text-sm transition-colors hidden md:block ${isOpen ? 'text-purple-700' : 'text-slate-700 group-hover:text-purple-700'}`}>
          {isOpen ? 'Close' : 'About & Safety'}
        </span>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className={`
            fixed z-[900] animate-fade-in flex flex-col overflow-hidden bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)]
            
            /* Mobile Styles: Safe Area Aware */
            left-4 right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] top-auto h-[60vh] rounded-[2rem]
            
            /* Desktop Styles */
            md:inset-auto md:left-4 md:bottom-24 md:w-[400px] md:h-auto md:max-h-[75vh] md:rounded-[2rem] md:origin-bottom-left
        `}>
          
          {/* Enhanced Header */}
          <div className="relative h-28 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shrink-0 overflow-hidden">
             {/* Abstract Shapes */}
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
             <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-400/20 rounded-full blur-xl"></div>
             
             {/* Pattern Overlay */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
             
             <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end h-full">
                 <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles size={12} />
                    <span>Welcome to Forever</span>
                 </div>
                 <h2 className="text-white font-serif font-bold text-2xl tracking-tight leading-none">
                    Information
                 </h2>
             </div>
             
             {/* Mobile Close Button */}
             <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white backdrop-blur-md transition-colors">
                <X size={18} />
             </button>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-slate-100 px-2 py-3 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex gap-1">
                {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center relative overflow-hidden ${
                    activeTab === tab.id
                        ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <tab.icon size={14} className={activeTab === tab.id ? 'stroke-[2.5px]' : ''} />
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500/50 rounded-full"></div>
                    )}
                </button>
                ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
            
            {activeTab === 'guide' && (
              <div className="p-6 space-y-6 animate-fade-in">
                <div className="text-center mb-2">
                    <h3 className="text-xl font-serif font-bold text-slate-800">Your Journey</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mt-2 px-2">
                        Forever is a sanctuary for digital memories attached to the physical world. Leave a part of yourself in the places that matter.
                    </p>
                </div>
                
                <div className="space-y-4">
                  {[
                      { num: 1, title: "Explore", desc: "Drift through the map or search for meaningful spots.", color: "bg-indigo-100 text-indigo-600" },
                      { num: 2, title: "Leave a Mark", desc: "Pin a memory to a specific bench, corner, or room.", color: "bg-purple-100 text-purple-600" },
                      { num: 3, title: "Poetic Polish", desc: "Let our AI refine your words into something timeless.", color: "bg-pink-100 text-pink-600" }
                  ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-start bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50 hover:border-purple-100 transition-colors">
                        <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center font-bold text-sm shrink-0`}>{step.num}</div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">{step.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="p-6 space-y-6 animate-fade-in">
                <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="text-teal-600" size={20} />
                    <h4 className="text-base font-bold text-teal-900">Safety First</h4>
                  </div>
                  <p className="text-xs text-teal-700 leading-relaxed opacity-90">
                    Forever is designed to be a safe, private space. We prioritize your anonymity and data security above all else.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 p-3 hover:bg-white rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    </div>
                    <div>
                        <strong className="block text-slate-800 text-sm font-bold mb-1">Anonymous by Choice</strong>
                        <p className="text-slate-500 text-xs leading-relaxed">You control your identity. Share your name only when you want to.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 p-3 hover:bg-white rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    </div>
                    <div>
                        <strong className="block text-slate-800 text-sm font-bold mb-1">No Tracking</strong>
                        <p className="text-slate-500 text-xs leading-relaxed">We do not store your live location history. Only the specific coordinates of notes you save.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="p-6 space-y-5 animate-fade-in">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-rose-900">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={18} />
                        <h4 className="font-bold text-sm">Community Guidelines</h4>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                        This is a shared space for emotional connection. Let's keep it safe and respectful for everyone.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <strong className="block mb-1 text-sm text-slate-800">🚫 Zero Tolerance</strong>
                    <p className="text-xs text-slate-500">Hate speech, bullying, doxxing, explicit content, or spam will result in an immediate ban.</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <strong className="block mb-1 text-sm text-slate-800">⚠️ Respect Locations</strong>
                    <p className="text-xs text-slate-500">Be mindful that public places may have different meanings for others. Keep content appropriate.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="p-6 space-y-5 animate-fade-in">
                <h3 className="text-lg font-serif font-bold text-slate-800 px-1">Terms of Service</h3>
                <div className="text-xs text-slate-500 space-y-4 leading-relaxed text-justify bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
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

            {/* UPGRADED FEEDBACK SECTION */}
            {activeTab === 'feedback' && (
              <div className="h-full flex flex-col animate-fade-in">
                 
                 {feedbackStatus === 'success' ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50 animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm animate-bounce">
                             <CheckCircle2 size={32} strokeWidth={3} />
                        </div>
                        <h3 className="font-serif font-bold text-slate-800 text-xl mb-2">Message Sent</h3>
                        <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">
                            Thank you for helping us make Forever better.
                        </p>
                        <button 
                            onClick={() => setFeedbackStatus('idle')}
                            className="mt-8 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                        >
                            Send another message
                        </button>
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col p-6">
                         
                         <div className="mb-6">
                            <h3 className="text-lg font-serif font-bold text-slate-800">Help us grow</h3>
                            <p className="text-xs text-slate-500 mt-1">We read every single note you send.</p>
                         </div>

                         <form onSubmit={handleFeedbackSubmit} className="flex-1 flex flex-col gap-5">
                            
                            {/* Category Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Topic</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {feedbackCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setFeedbackCategory(cat.id)}
                                            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 ${
                                                feedbackCategory === cat.id 
                                                ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm ring-1 ring-purple-100' 
                                                : 'bg-white border-slate-100 text-slate-500 hover:border-purple-100 hover:text-purple-600'
                                            }`}
                                        >
                                            <cat.icon size={18} />
                                            <span className="text-[10px] font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Text Input */}
                            <div className="flex-1 space-y-2 flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Details</label>
                                <textarea 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder={feedbackCategories.find(c => c.id === feedbackCategory)?.placeholder}
                                    className="flex-1 min-h-[120px] w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none font-sans shadow-sm transition-all"
                                    disabled={feedbackStatus === 'submitting'}
                                    autoFocus
                                />
                            </div>
                            
                            {/* Privacy Note */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                                <Shield size={10} />
                                <span>Your feedback is anonymous and secure.</span>
                            </div>

                            <button 
                                type="submit"
                                disabled={!feedback.trim() || feedbackStatus === 'submitting'}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                            >
                                {feedbackStatus === 'submitting' ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>Send Feedback</span>
                                    </>
                                )}
                            </button>
                         </form>
                     </div>
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