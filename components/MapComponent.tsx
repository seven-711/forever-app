import React, { useEffect, useRef, useState, useCallback, useMemo, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { Flag, AlertTriangle, Check, ShieldCheck, User, Loader2 } from 'lucide-react';
import { Note, Coordinates } from '../types';
import { reportNote } from '../services/supabaseService';

// Dynamically import Globe to prevent load-time errors if WebGL or dependency fails
const Globe = React.lazy(() => import('react-globe.gl'));

// Create a custom icon with explicit dimensions and visual precision cues
const createCustomIcon = (color: string, isAdmin?: boolean, isSpiderfied?: boolean, content?: string) => {
  // Truncate content for preview if spiderfied
  const previewText = isSpiderfied && content 
    ? `<div class="spider-preview-text">"${content.substring(0, 15)}${content.length > 15 ? '...' : ''}"</div>` 
    : '';

  if (isAdmin) {
    // Standout Admin Marker: Golden, Glowing, with the Forever Infinity Logo
    return L.divIcon({
      className: `admin-icon ${isSpiderfied ? 'spider-marker-container' : ''} leaflet-interactive`,
      html: `<div style="position: relative; width: 50px; height: 50px; display: flex; justify-content: center; align-items: center;">
               <!-- Pulsing Glow Effect -->
               <div style="position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0) 70%); border-radius: 50%; animation: pulse-glow 2s infinite;"></div>
               
               <!-- Drop Shadow -->
               <div style="position: absolute; bottom: 8px; width: 24px; height: 6px; background: rgba(0,0,0,0.4); border-radius: 50%; filter: blur(3px);"></div>
               
               <!-- Admin Infinity SVG (Forever Logo) -->
               <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 10; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.2));">
                 <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"></path>
               </svg>
               
               <!-- Precision Dot -->
               <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: 3px; height: 3px; background: #78350f; border-radius: 50%; z-index: 20;"></div>
               
               ${previewText}

               <style>
                 @keyframes pulse-glow {
                   0% { transform: scale(0.85); opacity: 0.6; }
                   50% { transform: scale(1.15); opacity: 0.9; }
                   100% { transform: scale(0.85); opacity: 0.6; }
                 }
               </style>
             </div>`,
      iconSize: [50, 50],
      iconAnchor: [25, 40], 
      popupAnchor: [0, -40]
    });
  }

  // Standard User Marker
  return L.divIcon({
    className: `custom-icon ${isSpiderfied ? 'spider-marker-container' : ''} leaflet-interactive`,
    html: `<div style="position: relative; width: 40px; height: 40px; display: flex; justify-content: center;">
             <!-- Drop Shadow on Ground for depth -->
             <div style="position: absolute; bottom: 2px; width: 14px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px);"></div>
             
             <!-- Pin SVG -->
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="position: relative; z-index: 10; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.15)); transition: transform 0.2s ease;">
               <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
               <circle cx="12" cy="10" r="3" fill="white"></circle>
             </svg>
             
             <!-- Precision Dot at the very tip -->
             <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 2px; height: 2px; background: ${color}; border-radius: 50%; z-index: 20;"></div>

             ${previewText}
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 38], // Calibrated to match the SVG path tip
    popupAnchor: [0, -38]
  });
};

// Function to create custom cluster icons (Memory Orbs)
const createClusterCustomIcon = function (count: number) {
  let size = 'small';
  let dims = 48; // Increased slightly for better touch target

  if (count > 10 && count <= 50) {
    size = 'medium';
    dims = 58;
  } else if (count > 50) {
    size = 'large';
    dims = 68;
  }

  // Calculate center anchor to ensure the orb sits exactly on the point
  // IMPORTANT: iconAnchor MUST be exactly half of dimensions to center it.
  const anchor = [dims / 2, dims / 2] as [number, number];

  return L.divIcon({
    // Inline styles in HTML for robustness: force Flexbox centering to fix "upper left" issue
    html: `
      <div class="cluster-pulse-ring"></div>
      <div class="cluster-inner" style="width: ${dims}px; height: ${dims}px; display: flex; justify-content: center; align-items: center;">
        <span>${count}</span>
      </div>
    `,
    className: `marker-cluster-custom cluster-${size} leaflet-interactive`,
    iconSize: L.point(dims, dims, true),
    iconAnchor: anchor, // Centers the icon on the map coordinate
    popupAnchor: [0, 0]
  });
};

interface MapEventsProps {
  onMapClick: (coords: Coordinates) => void;
  onZoomChange: (zoom: number) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick, onZoomChange }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    zoomend(e) {
      onZoomChange(e.target.getZoom());
    }
  });
  return null;
};

// Tracks the map center and reports it back to parent
const MapCenterTracker: React.FC<{ onCenterChange: (coords: Coordinates) => void }> = ({ onCenterChange }) => {
  const map = useMap();
  
  // Report initial center
  useEffect(() => {
    onCenterChange(map.getCenter());
  }, [map]); // Dependency on map is stable

  useMapEvents({
    moveend: () => {
      onCenterChange(map.getCenter());
    }
  });
  return null;
};

// Component to handle Map Invalidation logic to prevent missing tiles
const MapRevalidator: React.FC<{ is3DMode: boolean }> = ({ is3DMode }) => {
  const map = useMap();
  
  useEffect(() => {
    // Force Leaflet to check container size and load tiles
    // This fixes the gray area / missing tiles issue on initial load
    map.invalidateSize();
    
    // Also invalidate when switching modes
    if (!is3DMode) {
        // Slight delay to allow transition to complete or DOM to settle
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [map, is3DMode]);

  return null;
};

// Controls map movement programmatically
const MapController = ({ 
  activeNoteId, 
  notes, 
  focusLocation,
  selectedLocation
}: { 
  activeNoteId: string | null, 
  notes: Note[],
  focusLocation: Coordinates | null,
  selectedLocation: Coordinates | null
}) => {
  const map = useMap();
  
  // Fly to Active Note
  useEffect(() => {
    if (activeNoteId) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note) {
        map.flyTo([note.lat, note.lng], 18, {
          animate: true,
          duration: 2.0, 
          easeLinearity: 0.25
        });
      }
    }
  }, [activeNoteId, notes, map]);

  // Fly to Search Result
  useEffect(() => {
    if (focusLocation) {
      map.flyTo([focusLocation.lat, focusLocation.lng], 15, { // Zoom 15 for search results gives context
        animate: true,
        duration: 2.5,
        easeLinearity: 0.25
      });
    }
  }, [focusLocation, map]);

  // Auto-Zoom to Creation Pin for Precision
  useEffect(() => {
    if (selectedLocation) {
      // Zoom in deep (18) so user can see exactly where they placed the pin
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 18, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [selectedLocation, map]);

  return null;
};

// Stateful Component for the Popup Content to handle Reporting Flow
const NotePopup: React.FC<{ note: Note }> = ({ note }) => {
  const [view, setView] = useState<'read' | 'report' | 'success'>('read');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async (reason: string) => {
    setIsSubmitting(true);
    await reportNote(note.id, reason);
    setIsSubmitting(false);
    setView('success');
  };

  if (view === 'report') {
    return (
      <div className="p-1 min-w-[220px]">
        <div className="flex items-center gap-2 mb-3 text-rose-600">
           <AlertTriangle size={16} />
           <h3 className="text-sm font-bold font-serif">Report Note</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">Why are you reporting this?</p>
        <div className="flex flex-col gap-2">
            <button 
                onClick={() => handleReport('Spam or Advertising')}
                className="text-left px-3 py-2 text-xs bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg transition-colors border border-slate-100"
            >
                Spam or Advertising
            </button>
            <button 
                onClick={() => handleReport('Inappropriate Content')}
                className="text-left px-3 py-2 text-xs bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg transition-colors border border-slate-100"
            >
                Inappropriate Content
            </button>
            <button 
                onClick={() => handleReport('Private Information')}
                className="text-left px-3 py-2 text-xs bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg transition-colors border border-slate-100"
            >
                Private Information
            </button>
        </div>
        <button 
            onClick={() => setView('read')}
            className="mt-3 w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
        >
            Cancel
        </button>
        {isSubmitting && (
             <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                 <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
        )}
      </div>
    );
  }

  if (view === 'success') {
      return (
        <div className="p-3 min-w-[200px] flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <Check size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Thanks for reporting</h3>
            <p className="text-xs text-slate-500 mb-3">We will review this note shortly.</p>
            <button 
                onClick={() => setView('read')}
                className="text-xs text-purple-600 font-semibold hover:underline"
            >
                Back to Note
            </button>
        </div>
      )
  }

  // Default 'read' view
  return (
    <div className="min-w-[250px] max-w-[300px]">
        
        {/* Attached Image (if exists) */}
        {note.imageUrl && (
            <div className="mx-3 mt-3 mb-2 rounded-lg overflow-hidden shadow-sm border border-slate-100 relative">
                 <div className="aspect-[4/3] bg-slate-100">
                    <img 
                        src={note.imageUrl} 
                        alt="Memory capture" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                 </div>
                 {/* Decorative glint */}
                 <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/30 to-transparent pointer-events-none"></div>
            </div>
        )}

        {/* Content with Decorative Quotes */}
        <div className="relative mb-6 mt-4 mx-3">
            <span className="absolute -top-6 -left-2 text-6xl leading-none text-indigo-100/60 font-serif select-none">"</span>
            <p className={`text-lg italic relative z-10 leading-relaxed font-serif px-6 py-2 text-center ${note.isAdmin ? 'text-amber-900/90 font-medium' : 'text-slate-700'}`}>
                {note.content}
            </p>
            <span className="absolute -bottom-8 right-0 text-6xl leading-none text-indigo-100/60 font-serif transform rotate-180 select-none">"</span>
        </div>
        
        {/* Minimal Footer */}
        <div className={`flex justify-between items-end pt-5 mt-3 border-t ${note.isAdmin ? 'border-amber-100' : 'border-slate-100/80'} mx-4 mb-2`}>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                    {note.isAdmin ? (
                        <ShieldCheck size={12} className="text-amber-500" />
                    ) : (
                        <User size={12} className="text-slate-400" />
                    )}
                    <span className={`text-[11px] uppercase tracking-wider font-bold ${note.isAdmin ? 'text-amber-700' : 'text-slate-500'}`}>
                        {note.authorName || 'Anonymous'}
                    </span>
                </div>
                <span className="text-[10px] text-slate-300 pl-4.5">
                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>
            
            {!note.isAdmin && (
                <button 
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setView('report');
                    }}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-2 -m-1 rounded-full hover:bg-rose-50 group relative z-10 cursor-pointer focus:outline-none"
                    title="Report this note"
                >
                    <Flag size={14} className="group-hover:fill-rose-100" />
                </button>
            )}
        </div>
    </div>
  );
};

interface ClusterLayerProps {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
  activeNoteId: string | null;
}

// Data structure for the spiderfy effect
interface SpiderfyData {
  clusterId: number;
  center: { lat: number, lng: number };
  leaves: any[];
  positions: { lat: number, lng: number }[];
}

// Helper to calculate pixel offsets for animation
const getSpiderOffset = (map: L.Map, centerLatLng: {lat: number, lng: number}, markerLatLng: {lat: number, lng: number}) => {
    const centerPoint = map.latLngToLayerPoint(centerLatLng);
    const markerPoint = map.latLngToLayerPoint(markerLatLng);
    return {
        x: centerPoint.x - markerPoint.x,
        y: centerPoint.y - markerPoint.y
    };
}

const ClusterLayer: React.FC<ClusterLayerProps> = ({ notes, onNoteSelect, activeNoteId }) => {
  const map = useMap();
  const [clusters, setClusters] = useState<any[]>([]);
  const [spiderfyData, setSpiderfyData] = useState<SpiderfyData | null>(null);
  const markerRefs = useRef<{ [key: string]: L.Marker | null }>({});
  
  // Initialize supercluster lazily
  const superclusterRef = useRef<Supercluster | null>(null);
  if (!superclusterRef.current) {
    superclusterRef.current = new Supercluster({
      radius: 60,
      maxZoom: 17
    });
  }

  const updateClusters = useCallback(() => {
    if (!map || !superclusterRef.current) return;
    
    // If we are currently spiderfied, do not update clusters to avoid flickering
    if (spiderfyData) {
        return; 
    }

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const integerZoom = Math.floor(zoom);
    
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];

    try {
        const result = superclusterRef.current.getClusters(bbox, integerZoom);
        setClusters(result);
    } catch (e) {
        console.warn("Cluster calculation issue", e);
    }
  }, [map, spiderfyData]);

  useEffect(() => {
    if (!superclusterRef.current) return;

    const points = notes.map(note => ({
      type: 'Feature' as const,
      properties: { 
        cluster: false, 
        noteId: note.id,
        content: note.content,
        locationName: note.locationName,
        createdAt: note.createdAt,
        isAnonymous: note.isAnonymous,
        authorName: note.authorName,
        color: note.color,
        lat: note.lat,
        lng: note.lng,
        isAdmin: note.isAdmin,
        imageUrl: note.imageUrl
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [note.lng, note.lat]
      }
    }));

    superclusterRef.current.load(points);
    updateClusters();
  }, [notes, updateClusters]);

  // Hook to handle map events for clearing spiderfy
  useMapEvents({
    moveend: updateClusters,
    zoomend: updateClusters,
    zoomstart: () => setSpiderfyData(null), // Clear spiderfy immediately on zoom
    click: () => setSpiderfyData(null),     // Clear on map click
  });

  const handleClusterClick = (cluster: any) => {
      const { id, geometry, properties } = cluster;
      const [lng, lat] = geometry.coordinates;
      const pointCount = properties.point_count;
      
      if (!superclusterRef.current) return;

      const expansionZoom = Math.min(
        superclusterRef.current.getClusterExpansionZoom(id),
        18
      );
      
      const currentZoom = map.getZoom();

      // SPIDERFY Logic:
      // Trigger if we are close to max zoom (16+) OR if expansion zoom is already reached
      if (expansionZoom <= currentZoom || currentZoom >= 16) {
          // Breakdown into pieces
          const leaves = superclusterRef.current.getLeaves(id, Infinity);
          const center = { lat, lng };
          const centerPoint = map.latLngToLayerPoint(center);
          
          // Calculate circle layout
          const angleStep = (2 * Math.PI) / leaves.length;
          // Leg length scales slightly with number of items
          const legLength = 65 + Math.min(leaves.length * 3, 60); 
          
          const positions = leaves.map((_, i) => {
              const angle = i * angleStep - (Math.PI / 2); // Start from top
              const point = L.point(
                  centerPoint.x + legLength * Math.cos(angle),
                  centerPoint.y + legLength * Math.sin(angle)
              );
              return map.layerPointToLatLng(point);
          });
          
          // Use flyTo for smoother transition than setView
          map.flyTo([lat, lng], currentZoom, { animate: true, duration: 0.8 });
          
          setSpiderfyData({
              clusterId: id,
              center,
              leaves,
              positions
          });

      } else {
          // Normal Zoom
          setSpiderfyData(null);
          map.flyTo([lat, lng], expansionZoom, { animate: true, duration: 1.0 });
      }
  };

  useEffect(() => {
    if (activeNoteId && markerRefs.current[activeNoteId]) {
      const timer = setTimeout(() => {
        const marker = markerRefs.current[activeNoteId];
        if (marker) marker.openPopup();
      }, 2100);
      return () => clearTimeout(timer);
    }
  }, [activeNoteId, clusters]);

  return (
    <>
      {/* 1. Render Normal Clusters/Markers (Hidden if Spiderfied) */}
      {clusters.map(cluster => {
        const [lng, lat] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties;
        
        // If this cluster is currently spiderfied, don't render the default cluster icon
        if (spiderfyData && spiderfyData.clusterId === cluster.id) {
            return null;
        }

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={createClusterCustomIcon(pointCount)}
              eventHandlers={{
                click: (e) => {
                    // Explicit stop propagation to ensure map click doesn't clear it immediately
                    L.DomEvent.stopPropagation(e);
                    handleClusterClick(cluster);
                }
              }}
            />
          );
        }

        const note = cluster.properties;
        
        const fullNote: Note = {
            id: note.noteId,
            lat: note.lat,
            lng: note.lng,
            content: note.content,
            locationName: note.locationName,
            createdAt: note.createdAt,
            isAnonymous: note.isAnonymous,
            authorName: note.authorName,
            color: note.color,
            isAdmin: note.isAdmin,
            imageUrl: note.imageUrl
        };

        return (
          <Marker
            key={note.noteId}
            position={[note.lat, note.lng]}
            icon={createCustomIcon(note.color, note.isAdmin)}
            ref={(el) => { if(el) markerRefs.current[note.noteId] = el; }}
            zIndexOffset={note.isAdmin ? 500 : 0} 
            eventHandlers={{
              click: () => onNoteSelect(fullNote)
            }}
          >
            <Popup closeButton={false} className="bg-transparent border-none shadow-none">
               <NotePopup note={fullNote} />
            </Popup>
          </Marker>
        );
      })}

      {/* 2. Render Spiderfied "Broken Down" Pieces */}
      {spiderfyData && spiderfyData.leaves.map((leaf, index) => {
          const pos = spiderfyData.positions[index];
          const note = leaf.properties;
          
          const fullNote: Note = {
            id: note.noteId,
            lat: note.lat, // Use original lat for data
            lng: note.lng,
            content: note.content,
            locationName: note.locationName,
            createdAt: note.createdAt,
            isAnonymous: note.isAnonymous,
            authorName: note.authorName,
            color: note.color,
            isAdmin: note.isAdmin,
            imageUrl: note.imageUrl
          };

          // Custom Icon with Spiderfy flag and content for preview
          const icon = createCustomIcon(note.color, note.isAdmin, true, note.content);
          
          return (
              <React.Fragment key={`spider-${note.noteId}`}>
                  {/* The Connecting Leg */}
                  <Polyline 
                    positions={[spiderfyData.center, pos]} 
                    pathOptions={{ 
                        color: note.color, 
                        weight: 2, 
                        opacity: 0.6,
                        className: 'spider-leg-line' 
                    }} 
                  />
                  
                  {/* The Popped Out Marker */}
                  <Marker
                    position={pos}
                    icon={icon}
                    eventHandlers={{
                        add: (e) => {
                            const marker = e.target;
                            const el = marker.getElement();
                            if (el) {
                                // Dynamic Physics Animation: 
                                // Calculate exact start position (center of cluster) relative to final position
                                const { x, y } = getSpiderOffset(map, spiderfyData.center, pos);
                                
                                // Inject variables into the specific marker element
                                el.style.setProperty('--spider-x', `${x}px`);
                                el.style.setProperty('--spider-y', `${y}px`);
                                
                                // Stagger delay: 0s, 0.05s, 0.1s... for "pieces by pieces" effect
                                el.style.animationDelay = `${index * 0.06}s`;
                                el.classList.add('spider-marker-animated');
                            }
                        },
                        click: (e) => {
                            L.DomEvent.stopPropagation(e);
                            onNoteSelect(fullNote);
                        }
                    }}
                  >
                    <Popup closeButton={false} className="bg-transparent border-none shadow-none">
                        <NotePopup note={fullNote} />
                    </Popup>
                  </Marker>
              </React.Fragment>
          );
      })}
    </>
  );
};

interface MapComponentProps {
  notes: Note[];
  selectedLocation: Coordinates | null;
  onLocationSelect: (coords: Coordinates) => void;
  onNoteSelect: (note: Note) => void;
  activeNoteId: string | null;
  focusLocation?: Coordinates | null;
  focusLocationLabel?: string;
  onCenterChange?: (coords: Coordinates) => void;
}

// Separate component for internal map layers to ensure Context is always available
const MapLayers: React.FC<MapComponentProps & { onZoomChange: (z: number) => void, is3DMode: boolean }> = ({ 
  notes, 
  selectedLocation, 
  onLocationSelect, 
  onNoteSelect, 
  activeNoteId, 
  focusLocation = null,
  focusLocationLabel = "Searched Location",
  onCenterChange,
  onZoomChange,
  is3DMode
}) => {
  const creationMarkerRef = useRef<L.Marker>(null);

  const creationEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = creationMarkerRef.current;
        if (marker) {
          const { lat, lng } = marker.getLatLng();
          onLocationSelect({ lat, lng });
        }
      },
    }),
    [onLocationSelect],
  );

  return (
    <>
       <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapRevalidator is3DMode={is3DMode} />

        <MapEvents onMapClick={onLocationSelect} onZoomChange={onZoomChange} />
        
        {onCenterChange && <MapCenterTracker onCenterChange={onCenterChange} />}
        
        <MapController 
          activeNoteId={activeNoteId} 
          notes={notes} 
          focusLocation={focusLocation}
          selectedLocation={selectedLocation} 
        />

        {focusLocation && (
          <Marker 
            position={[focusLocation.lat, focusLocation.lng]} 
            icon={createCustomIcon('#f43f5e')}
            zIndexOffset={1000}
          >
             <Tooltip 
               permanent 
               direction="top" 
               offset={[0, -38]} 
               className="font-serif font-bold text-rose-600 bg-white/95 border-rose-100 shadow-md rounded-lg px-2 py-1"
             >
                {focusLocationLabel}
             </Tooltip>
          </Marker>
        )}

        {selectedLocation && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]} 
            icon={createCustomIcon('#64748b')}
            draggable={true}
            ref={creationMarkerRef}
            eventHandlers={creationEventHandlers}
            zIndexOffset={2000}
          >
            <Tooltip direction="top" offset={[0, -38]} opacity={0.9} permanent>
              Drag to pinpoint exact spot
            </Tooltip>
          </Marker>
        )}

        <ClusterLayer 
            notes={notes} 
            activeNoteId={activeNoteId} 
            onNoteSelect={onNoteSelect} 
        />
    </>
  );
};

// Helper to generate solid color image data URI
const genColorImg = (color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return canvas.toDataURL();
    }
    return '';
}

// 3D Globe Component using react-globe.gl
const GlobeView: React.FC<{ notes: Note[], onGlobeClick: (lat: number, lng: number, zoom?: number, noteId?: string) => void }> = ({ notes, onGlobeClick }) => {
    const globeEl = useRef<any>(null);
    const [landPolygons, setLandPolygons] = useState([]);
    
    // Light Blue (Sky-100ish) Water
    const waterTexture = useMemo(() => genColorImg('#e0f2fe'), []);
    
    // Load GeoJSON for Land
    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => setLandPolygons(data.features));
    }, []);

    // Supercluster calculation for 3D View
    const superclusterRef = useRef<Supercluster | null>(null);
    if (!superclusterRef.current) {
        superclusterRef.current = new Supercluster({ radius: 40, maxZoom: 10 });
    }

    const htmlData = useMemo(() => {
        if (!superclusterRef.current) return [];
        
        const geoJSONPoints = notes.map(note => ({
            type: 'Feature' as const,
            properties: { 
                cluster: false, 
                noteId: note.id,
                color: note.color,
                isAdmin: note.isAdmin
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [note.lng, note.lat]
            }
        }));

        superclusterRef.current.load(geoJSONPoints);
        
        // Get clusters at zoom level 2 (Globe overview)
        const clusters = superclusterRef.current.getClusters([-180, -90, 180, 90], 2);

        return clusters.map(c => {
            const isCluster = !!c.properties.cluster;
            const count = c.properties.point_count || 1;
            
            // Replicate the reference image style
            // Large/Dense = Redder/Darker/Bigger
            // Small = Lighter/Smaller
            let bgColor = '#f8fafc'; // Default White/Slate-50
            let size = 30;
            
            if (isCluster) {
                if (count > 1000) {
                    bgColor = '#e11d48'; // Rose-600
                    size = 60;
                } else if (count > 100) {
                    bgColor = '#fb7185'; // Rose-400
                    size = 50;
                } else if (count > 10) {
                    bgColor = '#fbcfe8'; // Pink-200
                    size = 40;
                }
            } else {
                bgColor = c.properties.color || '#8b5cf6';
                size = 14;
            }

            return {
                lat: c.geometry.coordinates[1],
                lng: c.geometry.coordinates[0],
                alt: 0.05,
                id: c.id,
                isCluster,
                count,
                bgColor,
                size,
                noteId: c.properties.noteId
            };
        });

    }, [notes]);

    const handlePointClick = (point: any) => {
        if (!globeEl.current) return;

        // 1. Visual Feedback: Fly camera closer to the point on the Globe
        // This creates the "Zoom in" effect before entering 2D
        const currentPos = globeEl.current.pointOfView();
        globeEl.current.pointOfView({ 
            lat: point.lat, 
            lng: point.lng, 
            altitude: Math.min(currentPos.altitude, 0.5) // Zoom down to 0.5 altitude
        }, 1200);

        // 2. Wait for the animation to mostly finish, then switch to 2D
        setTimeout(() => {
            if (point.isCluster && superclusterRef.current) {
                const expansionZoom = superclusterRef.current.getClusterExpansionZoom(point.id);
                // Switch to 2D at the expansion zoom level
                onGlobeClick(point.lat, point.lng, Math.max(expansionZoom, 4));
            } else {
                onGlobeClick(point.lat, point.lng, 18, point.noteId);
            }
        }, 900); // Trigger slightly before animation ends for overlap
    };

    return (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900 to-indigo-950 animate-fade-in flex items-center justify-center">
            <Suspense fallback={
                <div className="flex flex-col items-center gap-2 text-white/50">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="text-sm font-serif">Loading World View...</span>
                </div>
            }>
               <Globe
                ref={globeEl}
                // Light Blue Water Sphere
                globeImageUrl={waterTexture}
                bumpImageUrl={null}
                backgroundColor="rgba(0,0,0,0)"
                
                // Atmosphere
                atmosphereColor="#7c3aed" // Purple glow
                atmosphereAltitude={0.15}
                
                // Land (Green Polygons)
                polygonsData={landPolygons}
                polygonCapColor={() => '#dcfce7'} // Green-100
                polygonSideColor={() => 'rgba(0,0,0,0)'}
                polygonStrokeColor={() => '#86efac'} // Green-300 borders
                polygonAltitude={0.005}
                
                // Using HTML Elements for clusters to match the reference image style
                htmlElementsData={htmlData}
                htmlLat={(d: any) => d.lat}
                htmlLng={(d: any) => d.lng}
                htmlAltitude={(d: any) => d.alt}
                htmlElement={(d: any) => {
                    const el = document.createElement('div');
                    
                    // Retain functionality: Add click listener with propagation stop
                    el.onclick = (e) => {
                        e.stopPropagation();
                        handlePointClick(d);
                    };

                    if (d.isCluster) {
                        el.className = 'globe-cluster';
                        // Add size class for gradient logic in CSS
                        if (d.count > 100) el.classList.add('large');
                        else if (d.count > 10) el.classList.add('medium');
                        else el.classList.add('small');

                        el.style.width = `${d.size}px`;
                        el.style.height = `${d.size}px`;
                        
                        // Scale font based on size, keeping it readable
                        el.style.fontSize = `${Math.max(12, d.size * 0.4)}px`;
                        
                        // Wrap number in span for z-index layering
                        const span = document.createElement('span');
                        span.innerText = d.count > 999 ? '999+' : d.count.toString();
                        el.appendChild(span);
                    } else {
                        el.className = 'globe-marker';
                        el.style.width = `${d.size}px`;
                        el.style.height = `${d.size}px`;
                        el.style.backgroundColor = d.bgColor;
                    }

                    return el;
                }}

                // General Click
                onGlobeClick={({ lat, lng }: any) => {
                    // Just rotate/center
                    globeEl.current.pointOfView({ lat, lng, altitude: globeEl.current.pointOfView().altitude }, 1000);
                }}
                
                width={window.innerWidth}
                height={window.innerHeight}
               />
            </Suspense>
            
            {/* Overlay Text */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <h2 className="text-white/60 font-serif text-xl tracking-widest uppercase">World View</h2>
                <p className="text-white/30 text-xs mt-1">Click a cluster to explore memories</p>
            </div>
        </div>
    );
};

const MapComponent: React.FC<MapComponentProps> = (props) => {
  const [is3DMode, setIs3DMode] = useState(false);
  const [mapZoom, setMapZoom] = useState(3);
  const mapRef = useRef<L.Map | null>(null);

  // Toggle 3D mode based on zoom level
  const handleZoomChange = (zoom: number) => {
      setMapZoom(zoom);
      if (zoom < 4 && !is3DMode) {
          setIs3DMode(true);
      }
  };

  const handleGlobeClick = (lat: number, lng: number, zoomLevel: number = 6, noteId?: string) => {
      setIs3DMode(false); // Immediately switch state to render 2D map
      
      // Allow the MapContainer to re-mount/become visible before flying
      setTimeout(() => {
          if (mapRef.current) {
              // Use setView for a snappier transition or flyTo for smooth
              mapRef.current.setView([lat, lng], zoomLevel); 
              
              // If a specific note was clicked, trigger selection
              if (noteId) {
                  const note = props.notes.find(n => n.id === noteId);
                  if (note) {
                      setTimeout(() => props.onNoteSelect(note), 300);
                  }
              }
          }
      }, 50);
  };

  // If search focuses a location, force 2D mode
  useEffect(() => {
      if (props.focusLocation || props.activeNoteId || props.selectedLocation) {
          setIs3DMode(false);
      }
  }, [props.focusLocation, props.activeNoteId, props.selectedLocation]);

  return (
    <div className="h-full w-full bg-indigo-50/50 z-0 relative overflow-hidden">
      
      {/* 3D Globe Layer */}
      {is3DMode && (
         <GlobeView notes={props.notes} onGlobeClick={handleGlobeClick} />
      )}

      {/* 2D Map Layer - We keep it mounted but hidden/inactive when in 3D mode to preserve state */}
      <div className={`h-full w-full absolute inset-0 transition-opacity duration-700 ease-in-out ${is3DMode ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
          <MapContainer 
            key="forever-map-container"
            center={[20, 0]} 
            zoom={3} 
            minZoom={2.5} // Allow zooming out enough to trigger 3D
            style={{ height: '100%', width: '100%' }} 
            zoomControl={false}
            className="outline-none"
            maxZoom={18} 
            scrollWheelZoom={true}
            touchZoom={true}
            zoomSnap={0.5} 
            zoomDelta={0.5} 
            wheelPxPerZoomLevel={120}
            ref={mapRef}
          >
            <MapLayers {...props} onZoomChange={handleZoomChange} is3DMode={is3DMode} />
          </MapContainer>
          
          <div className="pointer-events-none absolute inset-0 z-[400] bg-gradient-to-t from-white/40 via-transparent to-transparent"></div>
      </div>
    </div>
  );
};

export default React.memo(MapComponent);