import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MapComponent from './components/MapComponent';
import CreateNoteModal from './components/CreateNoteModal';
import LoginPerksModal from './components/LoginPerksModal';
import AdminLoginModal from './components/AdminLoginModal';
import InfoFloater from './components/InfoFloater';
import AdminDashboard from './components/AdminDashboard';
import { Note, Coordinates, PlaceSearchResult, User } from './types';
import { LogIn, Infinity as InfinityIcon, Shuffle, Search, Loader2, MapPin, X, WifiOff, PenTool, ShieldCheck, User as UserIcon, Info, BookOpen, Shield, AlertCircle, FileText, MessageSquarePlus, Sparkles, Lightbulb, Bug, Heart, HelpCircle } from 'lucide-react';
import { suggestLocationName, searchPlaces } from './services/geminiService';
import { fetchNotes, saveNote, getAdminNotificationCount } from './services/supabaseService';

// Ethereal Color Palette for Random Note Colors
const NOTE_COLORS = [
  '#8b5cf6', // Mystic Purple
  '#ec4899', // Love Pink
  '#f43f5e', // Passion Rose
  '#f59e0b', // Warm Amber
  '#14b8a6', // Calm Teal
  '#3b82f6', // Deep Blue
  '#64748b', // Silent Slate
];

// Ancient Greek Pseudonyms for Anonymous Users
const GREEK_NAMES = [
  'Aether', 'Asteria', 'Atlas', 'Calliope', 'Calypso', 'Cassandra', 'Chronos', 
  'Circe', 'Daphne', 'Echo', 'Endymion', 'Eros', 'Gaia', 'Helios', 'Hyperion', 
  'Icarus', 'Iris', 'Leto', 'Lyra', 'Maia', 'Nyx', 'Oceanus', 'Orion', 
  'Orpheus', 'Pandora', 'Persephone', 'Phoebe', 'Prometheus', 'Rhea', 'Selene', 
  'Thales', 'Theia', 'Urania', 'Zephyr'
];

// Creative Titles for Logged In Users
const ETHEREAL_TITLES = [
  'Stardust Voyager', 'Memory Weaver', 'Timekeeper', 'Galaxy Wanderer', 
  'Horizon Seeker', 'Eternal Dreamer', 'Soul Cartographer', 'Echo Finder',
  'Lightwalker', 'Nebula Surfer'
];

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false); // New state for secret modal
  const [infoFloaterOpen, setInfoFloaterOpen] = useState(false); // Mobile info floater state
  const [activeInfoTab, setActiveInfoTab] = useState<'guide' | 'safety' | 'rules' | 'terms' | 'feedback'>('guide');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  
  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  
  // Map View State
  const [viewCenter, setViewCenter] = useState<Coordinates>({ lat: 20, lng: 0 });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [focusLocation, setFocusLocation] = useState<Coordinates | null>(null);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // UI Hints
  const [hasClickedRandom, setHasClickedRandom] = useState(false);
  const [showRandomHint, setShowRandomHint] = useState(false);

  // Ref to prevent search trigger when selecting an item
  const shouldSearchRef = useRef(true);

  // Check if current user is Admin
  const isAdmin = user?.isAdmin || false;
  const isLoggedIn = !!user;

  // Handle Intro Timer
  useEffect(() => {
    // Keep intro visible for 4.5 seconds to read the text
    const timer = setTimeout(() => {
        setShowIntro(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Monitor Online Status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Pending Reports & Feedback (Admin Only)
  useEffect(() => {
    let interval: any;
    
    if (isAdmin) {
        const checkNotifications = async () => {
            const count = await getAdminNotificationCount();
            setPendingNotifications(count);
        };
        
        checkNotifications(); // Initial check
        interval = setInterval(checkNotifications, 5000); // Poll every 5s
    }

    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isAdmin, isAdminDashboardOpen]);

  // Load Notes from Supabase
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const fetchedNotes = await fetchNotes();
        setNotes(fetchedNotes);
        
        // Show random hint after a few seconds if not clicked yet
        setTimeout(() => {
            if (fetchedNotes.length > 0) {
                setShowRandomHint(true);
            }
        }, 3000);

      } catch (error) {
        console.error("Failed to load notes", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadNotes();
  }, []);

  // Initialize from URL params for deep linking (SEO friendly)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const latParam = params.get('lat');
      const lngParam = params.get('lng');
      const nameParam = params.get('name');

      if (latParam && lngParam) {
        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);
        if (!isNaN(lat) && !isNaN(lng)) {
          setFocusLocation({ lat, lng });
          if (nameParam) {
            document.title = `Forever | ${nameParam}`;
            setSearchQuery(nameParam);
            shouldSearchRef.current = false; 
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse URL parameters", e);
    }
  }, []);

  // Debounced Search Effect using Gemini AI
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2 && shouldSearchRef.current) {
         setIsSearching(true);
         const results = await searchPlaces(searchQuery);
         setSearchResults(results);
         setIsSearching(false);
         setShowResults(true);
      } else if (searchQuery.length < 2) {
         setSearchResults([]);
         setShowResults(false);
      }
    }, 800); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const updateUrlAndTitle = (lat: number, lng: number, name?: string) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', lat.toFixed(6));
      url.searchParams.set('lng', lng.toFixed(6));
      if (name) {
        url.searchParams.set('name', name);
        document.title = `Forever | ${name}`;
      } else {
        url.searchParams.delete('name');
        document.title = 'Forever - Eternalize Your Memories';
      }
      
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', url);
      }
    } catch (e) {
      console.debug("Navigation update skipped:", e);
    }
  };

  const handleLocationSelect = (coords: Coordinates) => {
    setSelectedLocation(coords);
    setActiveNoteId(null);
    setShowResults(false);
    setFocusLocation(null); 
  };

  const handleCenterChange = useCallback((coords: Coordinates) => {
    setViewCenter(coords);
  }, []);

  const handleCreateNoteButtonClick = () => {
    handleLocationSelect(viewCenter);
  };

  const handleNoteSelect = (note: Note) => {
    setActiveNoteId(note.id);
    setShowResults(false);
    setFocusLocation(null);
    updateUrlAndTitle(note.lat, note.lng, note.locationName);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsAdminDashboardOpen(false);
  };

  const handleUserLoginSuccess = (authUser: User) => {
      // Assign an Ethereal Title if the name is generic
      const displayName = authUser.name || ETHEREAL_TITLES[Math.floor(Math.random() * ETHEREAL_TITLES.length)];
      setUser({ ...authUser, name: displayName });
      setIsLoginModalOpen(false);
  };

  const handleUpdateUserName = (newName: string) => {
    if (user) {
        setUser({ ...user, name: newName });
    }
  };

  const handleAdminLoginSuccess = (adminUser: User) => {
      setUser(adminUser);
      setIsAdminLoginOpen(false);
      setIsLoginModalOpen(false); // Also close the main modal if open
  };

  const handleCreateNote = async (text: string, authorName: string, imageUrl?: string) => {
    if (!selectedLocation) return;
    
    setIsLoading(true);

    try {
      const locName = await suggestLocationName(selectedLocation.lat, selectedLocation.lng);
      const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      
      // Determine if this is an "Anonymous" or "Verified" note based on name match
      // If the typed name matches the logged in user's real name, it's not anonymous (verified)
      // Otherwise (different alias or not logged in), it's treated as anonymous
      let isAnonymous = true;
      if (isLoggedIn && user && authorName === user.name) {
          isAnonymous = false;
      }

      const newNote: Note = {
        id: crypto.randomUUID(),
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        content: text,
        locationName: locName,
        createdAt: Date.now(),
        isAnonymous: isAnonymous,
        authorName: authorName, // Use whatever the user typed
        color: randomColor,
        isAdmin: !!isAdmin,
        imageUrl: imageUrl
      };

      const savedNote = await saveNote(newNote);
      
      if (savedNote) {
        setNotes(prev => [savedNote, ...prev]);
        setActiveNoteId(savedNote.id); 
        updateUrlAndTitle(savedNote.lat, savedNote.lng, savedNote.locationName);
      } else {
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
      }
      
      setSelectedLocation(null); 

    } catch (error) {
      console.error("Error creating note", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomNote = () => {
    setHasClickedRandom(true);
    if (notes.length === 0) return;
    
    let randomIndex = Math.floor(Math.random() * notes.length);
    let randomNote = notes[randomIndex];

    if (notes.length > 1 && randomNote.id === activeNoteId) {
      randomIndex = (randomIndex + 1) % notes.length;
      randomNote = notes[randomIndex];
    }

    // Immediate state updates - batch them for faster response
    setActiveNoteId(randomNote.id);
    setSelectedLocation(null); 
    setFocusLocation(null);
    setShowResults(false);
    
    // Update URL and title immediately
    updateUrlAndTitle(randomNote.lat, randomNote.lng, randomNote.locationName);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    shouldSearchRef.current = true;
  };

  const handleSelectSearchResult = (place: PlaceSearchResult) => {
    shouldSearchRef.current = false;
    setSearchQuery(place.name);
    setShowResults(false);
    
    if (place.lat !== undefined && place.lng !== undefined) {
        setFocusLocation({ lat: place.lat, lng: place.lng });
        setActiveNoteId(null);
        setSelectedLocation(null);
        updateUrlAndTitle(place.lat, place.lng, place.name);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    shouldSearchRef.current = false;
    setFocusLocation(null);
    
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('lat');
      url.searchParams.delete('lng');
      url.searchParams.delete('name');
      if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState({}, '', url);
      }
      document.title = 'Forever - Eternalize Your Memories';
    } catch (e) {}
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    if (activeNoteId === noteId) setActiveNoteId(null);
  };

  // Generate a random suggestion for the current session if needed
  const randomSuggestion = useMemo(() => 
     GREEK_NAMES[Math.floor(Math.random() * GREEK_NAMES.length)], 
  []);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col md:flex-row bg-transparent font-sans">
      
      {/* 
          ==================================================
          MELANCHOLIC INTRO SCREEN
          ================================================== 
      */}
      <div className={`fixed inset-0 z-[9999] bg-slate-50 flex items-center justify-center transition-all duration-1000 pointer-events-none ${showIntro ? 'opacity-100' : 'opacity-0'}`}>
         <div className="max-w-4xl px-8 text-center">
             <h1 className={`font-serif text-3xl md:text-5xl md:leading-tight text-slate-800 tracking-tight transition-all duration-1000 ${showIntro ? 'animate-melancholic-in' : ''}`}>
               Everywhere you go,<br />there’s a memory someone once made.
             </h1>
         </div>
      </div>

      {/* Navbar / Header Area */}
      <div className="absolute top-0 left-0 w-full z-[1000] p-3 md:p-4 pointer-events-none flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 md:gap-4">
        
        {/* Brand & Indicators */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div 
            onClick={() => { clearSearch(); setActiveNoteId(null); }}
            className="cursor-pointer pointer-events-auto bg-white/70 backdrop-blur-md border border-white/40 px-4 md:px-5 py-2 md:py-2.5 rounded-full flex items-center gap-2 md:gap-3 shadow-lg shadow-indigo-900/5 transition-all hover:bg-white/90"
          >
            <InfinityIcon className="text-purple-600 w-5 h-5" />
            <h1 className="font-serif font-bold text-lg tracking-wide text-slate-800">Forever</h1>
          </div>
          
          {isOffline && (
            <div className="pointer-events-auto bg-amber-50/90 backdrop-blur-md border border-amber-200/60 px-3 py-1.5 md:px-4 md:py-2.5 rounded-full flex items-center gap-2 shadow-lg animate-fade-in ml-auto md:ml-0">
              <WifiOff className="text-amber-500 w-4 h-4" />
              <span className="text-[10px] md:text-xs font-bold text-amber-700 uppercase tracking-wider">Offline</span>
            </div>
          )}

          {/* Admin Dashboard Toggle (Mobile) */}
          {isAdmin && (
             <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className="md:hidden pointer-events-auto bg-amber-500 text-white p-2 rounded-full shadow-lg relative"
             >
                 <ShieldCheck size={20} />
                 {pendingNotifications > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
                         {pendingNotifications}
                     </span>
                 )}
             </button>
          )}

          {/* Mobile Login Button / User Button */}
          <div className="md:hidden pointer-events-auto ml-2">
            {!isLoggedIn ? (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white/70 backdrop-blur-md border border-white/40 p-2 rounded-full flex items-center shadow-lg hover:bg-white transition-all"
              >
                <LogIn size={20} className="text-slate-500" />
              </button>
            ) : (
               <button
                 onClick={() => setIsLoginModalOpen(true)} 
                 className="bg-white/70 backdrop-blur-md border border-white/40 p-2 rounded-full flex items-center shadow-lg hover:bg-white transition-all"
               >
                   <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold border border-white">
                        {user?.name?.charAt(0) || 'U'}
                   </div>
               </button>
            )}
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="relative w-full md:max-w-md group pointer-events-auto flex items-center gap-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => {
                if (searchResults.length > 0 && searchQuery.length >= 2) setShowResults(true);
              }}
              placeholder="Search specific shops, orgs, or places..."
              className="w-full bg-white/70 backdrop-blur-md border border-white/40 pl-10 pr-10 py-2.5 rounded-full text-sm text-slate-800 placeholder-slate-500 shadow-lg shadow-indigo-900/5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={clearSearch}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 p-2"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl shadow-purple-900/10 overflow-hidden animate-fade-in flex flex-col p-1.5 max-h-[50vh] overflow-y-auto z-[2000]">
               <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggestions</div>
               {searchResults.map((place, i) => (
                 <button 
                    key={place.placeId} 
                    onClick={() => handleSelectSearchResult(place)} 
                    className="flex items-start gap-3 p-3 hover:bg-purple-50 rounded-xl transition-colors text-left group/item"
                 >
                    <div className="mt-1 p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover/item:text-purple-600 group-hover/item:bg-purple-100 transition-colors">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 text-sm">{place.name}</h4>
                      <p className="text-xs text-slate-500 italic font-serif mt-0.5">{place.description}</p>
                    </div>
                 </button>
               ))}
            </div>
          )}
          
          {/* Admin Dashboard Button (Desktop) */}
          {isAdmin && (
             <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className="hidden md:flex pointer-events-auto bg-amber-500 text-white px-4 py-2.5 rounded-full items-center gap-2 shadow-lg hover:bg-amber-600 transition-all font-bold text-sm relative"
             >
                <ShieldCheck size={18} />
                <span>Review</span>
                {pendingNotifications > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white border-2 border-white shadow-sm">
                        {pendingNotifications}
                    </span>
                )}
             </button>
          )}

           {/* Desktop Login Button / User Profile */}
           <div className="hidden md:block pointer-events-auto">
             {!isLoggedIn ? (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="bg-white/70 backdrop-blur-md border border-white/40 px-5 py-2.5 rounded-full flex items-center gap-3 shadow-lg shadow-indigo-900/5 hover:bg-white transition-all group hover:scale-105"
                >
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">Login</span>
                  <LogIn size={18} className="text-slate-500 group-hover:text-purple-600" />
                </button>
             ) : (
                <div onClick={() => setIsLoginModalOpen(true)} className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/40 pl-4 pr-1.5 py-1.5 rounded-full shadow-lg cursor-pointer hover:bg-white transition-colors">
                   <span className="text-sm font-semibold text-slate-700">
                      {user?.name || 'Connected'}
                   </span>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${isAdmin ? 'bg-amber-500 text-white' : 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'}`}>
                        {isAdmin ? <ShieldCheck size={14} /> : (user?.name?.charAt(0) || 'U')}
                   </div>
                </div>
             )}
           </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 h-full relative" onClick={() => setShowResults(false)}>
        <MapComponent 
          notes={notes} 
          selectedLocation={selectedLocation} 
          onLocationSelect={handleLocationSelect}
          onNoteSelect={handleNoteSelect}
          activeNoteId={activeNoteId}
          focusLocation={focusLocation}
          focusLocationLabel={searchQuery}
          onCenterChange={handleCenterChange}
        />
      </div>

      {/* Mobile Button Container - Left Side Block Layout */}
      <div className="md:hidden fixed left-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-4 pointer-events-none">
        
        {/* About Button - Mobile Version */}
        <div className="pointer-events-auto">
          <button
            onClick={() => setInfoFloaterOpen(!infoFloaterOpen)}
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-xl shadow-purple-900/20 hover:scale-110 active:scale-95 transition-all duration-300 group ring-4 ring-white/30 relative overflow-hidden ${
              infoFloaterOpen 
                ? 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 ring-4 ring-purple-200/50 shadow-purple-200/50 scale-105' 
                : 'bg-white/90 hover:bg-white text-slate-600 hover:text-purple-700 hover:shadow-purple-900/20 hover:ring-purple-100/50'
            }`}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br from-purple-400/0 to-purple-600/0 group-hover:from-purple-400/10 group-hover:to-purple-600/10 transition-all duration-300`}></div>
            
            {/* Icon container with enhanced animation */}
            <div className={`relative z-10 transition-all duration-500 ease-out ${infoFloaterOpen ? 'rotate-90 scale-110' : 'group-hover:rotate-12 group-hover:scale-105'}`}>
              {infoFloaterOpen ? (
                <X size={20} strokeWidth={2.5} className="drop-shadow-sm" />
              ) : (
                <Info size={20} strokeWidth={2.5} className="drop-shadow-sm" />
              )}
            </div>
            
            {/* Ripple effect on hover */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Pulse effect when active */}
            {infoFloaterOpen && (
              <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping"></div>
            )}
          </button>
        </div>
        
        {/* Leave a Note Button */}
        {!selectedLocation && !isInitialLoading && (
          <div className="pointer-events-auto">
            <button
              onClick={handleCreateNoteButtonClick}
              className={`flex items-center justify-center w-12 h-12 rounded-full shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all group ring-4 ring-white/30 text-white ${isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
            >
              {isAdmin ? <ShieldCheck size={20} className="fill-white/20" /> : <PenTool size={20} className="fill-white/20" />}
            </button>
          </div>
        )}
        
        {/* Random Note Button */}
        {!selectedLocation && !isInitialLoading && notes.length > 0 && (
          <div className="pointer-events-auto">
            <button
              onClick={handleRandomNote}
              className="flex items-center justify-center w-12 h-12 rounded-full shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all group ring-4 ring-white/30 text-white bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Shuffle size={20} className="fill-white/20" />
            </button>
          </div>
        )}
      </div>

      Mobile InfoFloater Modal
      {infoFloaterOpen && (
        <div className="md:hidden fixed inset-0 z-[999] animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setInfoFloaterOpen(false)}
          />
          
          {/* Floating Modal Content */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[500px] bg-white/95 backdrop-blur-2xl border border-white/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] rounded-[2rem] overflow-hidden animate-scale-in">
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
              
              {/* Floating Close Button */}
              <button 
                onClick={() => setInfoFloaterOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg shadow-purple-900/30 flex items-center justify-center text-purple-600 hover:bg-white hover:scale-110 hover:shadow-purple-900/40 transition-all duration-200 border border-purple-100/50"
              >
                <X size={16} strokeWidth={2.5} className="text-purple-600" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-slate-100 px-2 py-3 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex gap-1">
                {[
                  { id: 'guide', label: 'Guide', icon: BookOpen },
                  { id: 'safety', label: 'Safety', icon: Shield },
                  { id: 'rules', label: 'Rules', icon: AlertCircle },
                  { id: 'terms', label: 'Terms', icon: FileText },
                  { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveInfoTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-1 justify-center relative overflow-hidden ${
                      activeInfoTab === tab.id
                        ? 'bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <tab.icon size={14} className={activeInfoTab === tab.id ? 'stroke-[2.5px]' : ''} />
                    {tab.label}
                    {activeInfoTab === tab.id && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500/50 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50 max-h-[320px]">
              {/* Guide Content */}
              {activeInfoTab === 'guide' && (
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
                  <div className="text-[10px] text-slate-400 text-center pt-2">
                    Made with 🤍 Forever App &copy; 2025 by July
                  </div>
                </div>
              )}

              {/* Safety Content */}
              {activeInfoTab === 'safety' && (
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
                  <div className="text-[10px] text-slate-400 text-center pt-2">
                    Made with 🤍 Forever App &copy; 2025 by July
                  </div>                 
                </div>
              )}

              {/* Rules Content */}
              {activeInfoTab === 'rules' && (
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
                  <div className="text-[10px] text-slate-400 text-center pt-2">
                    Made with 🤍 Forever App &copy; 2025 by July
                  </div>
                </div>
              )}

              {/* Terms Content */}
              {activeInfoTab === 'terms' && (
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

              {/* Feedback Content */}
              {activeInfoTab === 'feedback' && (
                <div className="h-full flex flex-col animate-fade-in">
                  <div className="flex-1 flex flex-col p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-serif font-bold text-slate-800">Help us grow</h3>
                      <p className="text-xs text-slate-500 mt-1">We read every single note you send.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'idea', label: 'Idea', icon: Lightbulb },
                          { id: 'issue', label: 'Issue', icon: Bug },
                          { id: 'love', label: 'Love', icon: Heart },
                          { id: 'other', label: 'Other', icon: HelpCircle }
                        ].map(cat => (
                          <button
                            key={cat.id}
                            className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 ${
                              activeInfoTab === cat.id 
                                ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm ring-1 ring-purple-100' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-purple-100 hover:text-purple-600'
                            }`}
                          >
                            <cat.icon size={18} />
                            <span className="text-[10px] font-bold">{cat.label}</span>
                          </button>
                        ))}
                      </div>

                      <textarea 
                        placeholder="Share your thoughts, ideas, or report issues..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none font-sans shadow-sm transition-all min-h-[120px]"
                      />

                      <button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-900/20">
                        Send Message
                      </button>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                        <MessageSquarePlus size={12} />
                        <span>Your feedback helps us improve Forever</span>
                      </div>
                      <div className="text-[10px] text-slate-400 text-center pt-2">
                    Made with 🤍 Forever App &copy; 2025 by July
                  </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop/Tablet Button Container - Original Positions */}
      <div className="hidden md:block">
        {/* Info/Guide Floater */}
        <div className="pointer-events-auto">
          <InfoFloater />
        </div>

        {/* Create Memory Button */}
        {!selectedLocation && !isInitialLoading && (
          <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto">
            <button
              onClick={handleCreateNoteButtonClick}
              className={`flex items-center gap-2 px-5 py-3 md:px-6 md:py-3.5 rounded-full shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all group ring-4 ring-white/30 text-white ${isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
            >
              {isAdmin ? <ShieldCheck size={18} className="fill-white/20" /> : <PenTool size={18} className="fill-white/20" />}
              <span className="font-bold tracking-wide text-sm md:text-base hidden min-[350px]:inline whitespace-nowrap">
                {isAdmin ? 'Leave Admin Note' : 'Leave a Note'}
              </span>
            </button>
          </div>
        )}

        {/* Random Note Button Container with Hint */}
        {!selectedLocation && !isInitialLoading && notes.length > 0 && (
          <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-8 right-[calc(1rem+env(safe-area-inset-right))] md:right-[calc(1rem+env(safe-area-inset-right))] lg:right-8 z-[500] flex flex-col items-end gap-3 pointer-events-none">
            
            {/* Animated Hint Bubble */}
            {!hasClickedRandom && showRandomHint && (
              <div className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-white/50 animate-float origin-bottom-right mb-1 mr-1 pointer-events-auto relative">
                <div className="text-sm font-serif font-semibold text-purple-900/80 whitespace-nowrap">
                  Drift to a random memory...
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white/80 border-b border-r border-white/50 rotate-45 backdrop-blur-md"></div>
              </div>
            )}
            
            <button
              onClick={handleRandomNote}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl shadow-purple-900/20 hover:scale-105 active:scale-95 transition-all group ring-4 ring-white/30 text-white bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              <Shuffle size={16} className="fill-white/20" />
              <span className="font-bold tracking-wide text-sm whitespace-nowrap">Random Note</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {selectedLocation && (
        <CreateNoteModal 
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onSubmit={handleCreateNote}
          isLoggedIn={isLoggedIn}
          defaultName={user?.name || randomSuggestion}
        />
      )}

      {/* Login Perks Modal */}
      {isLoginModalOpen && (
        <LoginPerksModal 
            onClose={() => setIsLoginModalOpen(false)}
            onLogout={handleLogout}
            currentUser={user}
            onUserLoginSuccess={handleUserLoginSuccess}
            onUpdateName={handleUpdateUserName}
            onAdminTrigger={() => {
                setIsLoginModalOpen(false);
                setIsAdminLoginOpen(true);
            }}
        />
      )}

      {/* SECRET Admin Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
            onClose={() => setIsAdminLoginOpen(false)}
            onLoginSuccess={handleAdminLoginSuccess}
        />
      )}
      
      {/* Admin Dashboard Modal */}
      {isAdminDashboardOpen && (
        <AdminDashboard 
            onClose={() => setIsAdminDashboardOpen(false)}
            onDeleteNote={handleDeleteNote}
        />
      )}

      {/* Loading Overlay (Only show if Intro is done to avoid double overlay) */}
      {!showIntro && (isLoading || isInitialLoading) && (
        <div className="fixed inset-0 z-[3000] bg-white/60 backdrop-blur-md flex items-center justify-center">
             <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl shadow-2xl">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 font-serif font-medium tracking-wide animate-pulse">
                   {isInitialLoading ? 'Recovering memories...' : 'Eternalizing...'}
                </p>
             </div>
        </div>
      )}

    </div>
  );
};

export default App;