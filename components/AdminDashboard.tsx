import React, { useEffect, useState } from 'react';
import { Note, Report, Feedback } from '../types';
import { fetchReportedNotes, dismissReport, deleteNote, fetchFeedback, deleteFeedback } from '../services/supabaseService';
import { ShieldAlert, CheckCircle, Trash2, X, MapPin, MessageSquare, Mail, Archive } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onDeleteNote: (noteId: string) => void; // Callback to update parent state
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onDeleteNote }) => {
  const [activeView, setActiveView] = useState<'reports' | 'feedback'>('reports');
  const [reportItems, setReportItems] = useState<{ report: Report, note: Note }[]>([]);
  const [feedbackItems, setFeedbackItems] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setIsLoading(true);
    if (activeView === 'reports') {
        const data = await fetchReportedNotes();
        setReportItems(data);
    } else {
        const data = await fetchFeedback();
        setFeedbackItems(data);
    }
    setIsLoading(false);
  };

  const handleKeepNote = async (reportId: string) => {
    await dismissReport(reportId);
    setReportItems(prev => prev.filter(i => i.report.id !== reportId));
  };

  const handleDeleteNote = async (noteId: string, reportId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
        await dismissReport(reportId); // Clean up the report too
        onDeleteNote(noteId);
        setReportItems(prev => prev.filter(i => i.note.id !== noteId));
    }
  };

  const handleDeleteFeedback = async (id: string) => {
      await deleteFeedback(id);
      setFeedbackItems(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-4xl bg-white border border-white/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-900 p-6 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="text-amber-500" size={24} />
                    <h2 className="text-white font-serif font-bold text-lg">Admin</h2>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden text-white/50 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
            <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                <button 
                    onClick={() => setActiveView('reports')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeView === 'reports' ? 'bg-amber-500 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <ShieldAlert size={18} />
                    Reported Memories
                </button>
                <button 
                    onClick={() => setActiveView('feedback')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeView === 'feedback' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <MessageSquare size={18} />
                    User Feedback
                </button>
            </nav>

            <div className="mt-auto hidden md:block">
                <p className="text-slate-500 text-xs">Logged in as System Admin</p>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden relative">
            
            {/* Desktop Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white text-slate-400 hover:text-slate-800 rounded-full transition-colors hidden md:block">
                <X size={20} />
            </button>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                
                <h3 className="text-2xl font-serif font-bold text-slate-800 mb-6">
                    {activeView === 'reports' ? 'Reported Memories' : 'User Suggestions'}
                </h3>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                   <>
                     {/* REPORTS VIEW */}
                     {activeView === 'reports' && (
                         reportItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <CheckCircle size={48} className="mb-4 text-green-500 opacity-50" />
                                <p className="text-lg font-medium">All Clear</p>
                                <p className="text-sm">No reported notes pending review.</p>
                            </div>
                         ) : (
                             <div className="grid grid-cols-1 gap-4">
                                {reportItems.map(({ report, note }) => (
                                    <div key={report.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                        {report.reason}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h4 className="font-serif font-bold text-slate-800 flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-slate-400" />
                                                    {note.locationName}
                                                </h4>
                                            </div>
                                        </div>
                                        
                                        <p className="text-slate-600 italic text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            "{note.content}"
                                        </p>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                                            <span className="text-xs text-slate-400">
                                                Author: {note.isAnonymous ? 'Anonymous' : note.authorName}
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleKeepNote(report.id)}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                                                >
                                                    Dismiss
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteNote(note.id, report.id)}
                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <Trash2 size={12} />
                                                    Delete Note
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         )
                     )}

                     {/* FEEDBACK VIEW */}
                     {activeView === 'feedback' && (
                         feedbackItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Mail size={48} className="mb-4 text-indigo-300 opacity-50" />
                                <p className="text-lg font-medium">Inbox Empty</p>
                                <p className="text-sm">No new feedback from users.</p>
                            </div>
                         ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {feedbackItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border border-indigo-50 hover:border-indigo-100 transition-colors flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                                    <MessageSquare size={14} />
                                                </div>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteFeedback(item.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                title="Delete Feedback"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        </div>
                                        
                                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap mb-4 flex-1">
                                            {item.content}
                                        </p>
                                        
                                        <div className="pt-3 border-t border-slate-50 flex justify-end">
                                             <button 
                                                onClick={() => handleDeleteFeedback(item.id)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                             >
                                                Mark as Resolved
                                             </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                         )
                     )}
                   </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;