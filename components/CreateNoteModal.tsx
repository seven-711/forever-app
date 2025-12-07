
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Loader2, PenTool, Image as ImageIcon, Trash2, User as UserIcon, Lock } from 'lucide-react';
import { Coordinates } from '../types';
import { enhanceNote } from '../services/geminiService';

interface CreateNoteModalProps {
  location: Coordinates;
  onClose: () => void;
  onSubmit: (text: string, authorName: string, imageUrl?: string) => void;
  isLoggedIn: boolean;
  defaultName?: string;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ location, onClose, onSubmit, isLoggedIn, defaultName = 'Anonymous' }) => {
  const [text, setText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [authorName, setAuthorName] = useState(defaultName);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize author name from prop
  useEffect(() => {
    setAuthorName(defaultName);
  }, [defaultName]);

  const handleEnhance = async () => {
    if (!text) return;
    setIsEnhancing(true);
    const enhanced = await enhanceNote(text);
    setText(enhanced);
    setIsEnhancing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      // If user cleared the name, default to Anonymous
      const finalName = authorName.trim() || 'Anonymous';
      onSubmit(text, finalName, selectedImage || undefined);
    }
  };

  const handlePhotoClick = () => {
      if (isLoggedIn) {
          fileInputRef.current?.click();
      }
  };

  return (
    // Mobile: Bottom Sheet, Desktop: Side Panel
    <div className="absolute bottom-0 left-0 right-0 z-[1000] p-0 md:p-6 md:w-[450px] md:top-0 md:bottom-auto md:left-auto md:h-screen animate-fade-in flex items-end md:items-center pointer-events-none">
      <div className="bg-white/95 md:bg-white/90 backdrop-blur-xl border-t md:border border-white/50 rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-2xl md:shadow-purple-900/10 overflow-hidden w-full max-h-[85vh] md:max-h-full flex flex-col transition-all pointer-events-auto">
        
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Header - Simplified */}
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-100 bg-white/50">
          <div className="flex-1 pr-4 min-w-0">
            <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-slate-800 font-serif tracking-tight">
                <PenTool size={18} className="text-purple-600 flex-shrink-0" />
                <span>New Memory</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 flex-1 flex flex-col gap-4 md:gap-5 overflow-y-auto">
          
          <div className="flex-1 relative flex flex-col gap-4">
             {/* Text Area */}
             <div className="relative min-h-[120px] md:min-h-[140px] flex-1">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Leave a part of yourself here..."
                  className="w-full h-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pb-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none transition-all font-serif text-base md:text-lg leading-relaxed shadow-inner"
                />
                
                <div className="absolute bottom-4 right-4 flex gap-2">
                   {/* Enhance Button */}
                  <button
                    type="button"
                    onClick={handleEnhance}
                    disabled={!text || isEnhancing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-purple-100 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    <span className="hidden sm:inline">Poetic Polish</span>
                  </button>
                </div>
             </div>

             {/* Image Preview Area */}
             {selectedImage && (
                <div className="relative w-full h-32 md:h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={selectedImage} alt="Memory preview" className="w-full h-full object-cover opacity-90" />
                    <button 
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-500 transition-colors backdrop-blur-sm"
                    >
                        <Trash2 size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 text-white text-[10px] rounded-md backdrop-blur-sm">
                        Attached Memory
                    </div>
                </div>
             )}
          </div>

          <div className="space-y-4 pb-safe md:pb-0">
            {/* Action Bar */}
            <div className="flex gap-3">
                 {/* Photo Button (Conditioned on Login) */}
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange}
                />
                <button
                    type="button"
                    onClick={handlePhotoClick}
                    disabled={!isLoggedIn}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                        isLoggedIn 
                        ? (selectedImage ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                    }`}
                    title={isLoggedIn ? "Attach a photo" : "Log in to attach photos to your notes"}
                >
                    {isLoggedIn ? <ImageIcon size={20} /> : <Lock size={16} />}
                    <span className="text-sm font-semibold hidden sm:inline">
                        {isLoggedIn ? (selectedImage ? 'Change' : 'Photo') : 'Photo'}
                    </span>
                    {/* Mobile Only Icon fallback */}
                    <span className="sm:hidden">
                        {isLoggedIn ? <ImageIcon size={20} /> : <Lock size={16} />}
                    </span>
                </button>

                {/* Name / Identity Input */}
                <div 
                    className={`flex-1 flex items-center px-3 py-2 rounded-2xl border transition-all ${isLoggedIn ? 'bg-slate-50 border-slate-200 focus-within:ring-2 focus-within:ring-purple-200 focus-within:border-purple-300' : 'bg-slate-100 border-slate-200 opacity-80 cursor-not-allowed'}`}
                    title={!isLoggedIn ? "Log in to customize your signature" : "Edit your signature"}
                >
                   <div className="mr-2 text-slate-400 flex-shrink-0">
                      <UserIcon size={16} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                        {isLoggedIn ? 'Signed As' : 'Anonymous Alias'}
                      </label>
                      <input 
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Anonymous"
                        className={`w-full bg-transparent border-none p-0 text-sm font-semibold placeholder-slate-400 focus:ring-0 leading-tight truncate ${isLoggedIn ? 'text-slate-700' : 'text-slate-500'}`}
                        maxLength={25}
                        disabled={!isLoggedIn}
                      />
                   </div>
                   <div className="ml-2 text-slate-400 flex-shrink-0 opacity-50">
                      {isLoggedIn ? <PenTool size={12} className="text-purple-400" /> : <Lock size={12} />}
                   </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className="w-full py-3.5 md:py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
            >
              <Send size={18} />
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoteModal;
