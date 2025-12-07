import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Note, Report, Feedback } from '../types';

// ==================================================================================
// 🟢 CONFIGURATION SECTION
// ==================================================================================

// 1. PASTE YOUR PROJECT URL INSIDE THE QUOTES:
const YOUR_SUPABASE_URL = 'https://xbqdsptcdweteaslhrtp.supabase.co';

// 2. PASTE YOUR ANON / PUBLIC KEY INSIDE THE QUOTES:
const YOUR_SUPABASE_ANON_KEY = 'sb_publishable_QltFhrFMa5Bdy0YdCWbdeA_Q8Utc96X';

// ==================================================================================

const NOTES_CACHE_KEY = 'forever_notes_cache';

// Simple check: Does it look like a real configuration?
const isConfigured = YOUR_SUPABASE_URL.includes('supabase.co') && YOUR_SUPABASE_ANON_KEY.length > 20;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(YOUR_SUPABASE_URL, YOUR_SUPABASE_ANON_KEY) 
  : null;


// --- DATA FUNCTIONS ---

// Mock in-memory storage for reports and feedback (Fallback)
let MOCK_REPORTS: Report[] = [];
let MOCK_FEEDBACK: Feedback[] = [];

const mapToDb = (note: Note) => {
  return {
    id: note.id,
    lat: note.lat,
    lng: note.lng,
    content: note.content,
    location_name: note.locationName,
    created_at: note.createdAt,
    is_anonymous: note.isAnonymous,
    author_name: note.authorName,
    color: note.color,
    image_url: note.imageUrl, 
    is_admin: note.isAdmin || false,
  };
};

const mapFromDb = (data: any): Note => ({
  id: data.id,
  lat: data.lat,
  lng: data.lng,
  content: data.content,
  locationName: data.location_name,
  createdAt: data.created_at,
  isAnonymous: data.is_anonymous,
  authorName: data.author_name,
  color: data.color,
  isAdmin: data.is_admin || false,
  imageUrl: data.image_url
});

export const fetchNotes = async (): Promise<Note[]> => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedNotes = data.map(mapFromDb);
        try {
          localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(mappedNotes));
        } catch (e) {}
        return mappedNotes;
      }
    } catch (err) {
      console.warn('Network error fetching notes, falling back to cache');
    }
  }

  // Fallback to Local Cache
  try {
    const cached = localStorage.getItem(NOTES_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  return [];
};

export const saveNote = async (note: Note): Promise<Note | null> => {
  updateLocalCache(note); 
  
  if (!supabase) {
      return note;
  }

  try {
    const payload = mapToDb(note);
    const { data, error } = await supabase
      .from('notes')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase save warning (using local cache):', JSON.stringify(error));
      return note;
    }

    const savedNote = mapFromDb(data);
    updateLocalCache(savedNote);
    return savedNote;

  } catch (e) {
    return note;
  }
};

const updateLocalCache = (note: Note) => {
  try {
    const cached = localStorage.getItem(NOTES_CACHE_KEY);
    const currentNotes = cached ? JSON.parse(cached) : [];
    const filtered = currentNotes.filter((n: Note) => n.id !== note.id);
    const updatedNotes = [note, ...filtered];
    localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(updatedNotes));
  } catch (e) {}
};

// --- REPORTING LOGIC ---

export const reportNote = async (noteId: string, reason: string): Promise<boolean> => {
  MOCK_REPORTS.push({
    id: crypto.randomUUID(),
    noteId,
    reason,
    createdAt: Date.now(),
    status: 'pending'
  });
  return true;
};

export const getPendingReportCount = async (): Promise<number> => {
  return MOCK_REPORTS.filter(r => r.status === 'pending').length;
};

export const fetchReportedNotes = async (): Promise<{ report: Report, note: Note }[]> => {
    const allNotes = await fetchNotes();
    const activeReports = MOCK_REPORTS.filter(r => r.status === 'pending');
    
    return activeReports.map(report => {
        const note = allNotes.find(n => n.id === report.noteId);
        if (note) return { report, note };
        return null;
    }).filter(item => item !== null) as { report: Report, note: Note }[];
};

export const dismissReport = async (reportId: string): Promise<void> => {
    const report = MOCK_REPORTS.find(r => r.id === reportId);
    if (report) report.status = 'dismissed';
};

export const deleteNote = async (noteId: string): Promise<boolean> => {
    try {
        const cached = localStorage.getItem(NOTES_CACHE_KEY);
        if (cached) {
            const notes = JSON.parse(cached) as Note[];
            const updated = notes.filter(n => n.id !== noteId);
            localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(updated));
        }
    } catch (e) {}

    if (!supabase) return true;
    
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    return !error;
};

// --- FEEDBACK LOGIC ---

export const submitFeedback = async (content: string): Promise<boolean> => {
  MOCK_FEEDBACK.push({
    id: crypto.randomUUID(),
    content,
    createdAt: Date.now(),
    status: 'pending'
  });
  return true;
};

export const fetchFeedback = async (): Promise<Feedback[]> => {
  return [...MOCK_FEEDBACK].sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteFeedback = async (id: string): Promise<void> => {
  MOCK_FEEDBACK = MOCK_FEEDBACK.filter(f => f.id !== id);
};

export const getPendingFeedbackCount = async (): Promise<number> => {
  return MOCK_FEEDBACK.filter(f => f.status === 'pending').length;
};

// Helper to aggregate all dashboard alerts
export const getAdminNotificationCount = async (): Promise<number> => {
  const reports = await getPendingReportCount();
  const feedback = await getPendingFeedbackCount();
  return reports + feedback;
};