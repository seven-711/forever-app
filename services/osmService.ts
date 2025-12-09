import { PlaceSearchResult } from '../types';

const CACHE_PREFIX = 'forever_osm_v1_';

// Simple in-memory / local storage cache to be polite to OSM servers
const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (item) {
      const { data, timestamp } = JSON.parse(item);
      // Cache valid for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) { }
  return null;
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) { }
};

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!query || query.length < 2) return [];

  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = getFromCache<PlaceSearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    // Using OpenStreetMap Nominatim API (Free, no key required)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    
    const response = await fetch(url, {
        headers: {
            'Accept-Language': 'en-US,en;q=0.9'
        }
    });
    
    if (!response.ok) return [];

    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    const results = data.map((item: any) => {
      // Extract the most relevant name
      const displayName = item.display_name || '';
      const parts = displayName.split(',');
      const shortName = item.name || parts[0] || 'Unknown Location';
      
      // Construct a shorter description from the remaining parts
      const description = parts.slice(1, 4).join(',').trim();

      return {
        placeId: item.place_id?.toString() || crypto.randomUUID(),
        name: shortName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        description: description || 'Location'
      };
    });

    saveToCache(cacheKey, results);
    return results;

  } catch (error) {
    console.error("OSM search failed", error);
    return [];
  }
};

export const suggestLocationName = async (lat: number, lng: number): Promise<string> => {
    const latKey = lat.toFixed(4);
    const lngKey = lng.toFixed(4);
    const cacheKey = `loc_name_${latKey}_${lngKey}`;

    const cached = getFromCache<string>(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const response = await fetch(url, {
            headers: { 
                'Accept-Language': 'en-US,en;q=0.9' 
            }
        });
        
        if (!response.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const data = await response.json();
        const a = data.address || {};
        
        // Priority list for a good "Location Name"
        const name = data.name || // Specific POI name if available
                     a.amenity || 
                     a.shop || 
                     a.tourism || 
                     a.historic ||
                     a.leisure ||
                     a.building || 
                     a.office ||
                     (a.road ? `${a.house_number ? a.house_number + ' ' : ''}${a.road}` : null) ||
                     a.park ||
                     a.village ||
                     a.suburb ||
                     `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        const cleanName = name.split(',')[0]; // Ensure it's short
        saveToCache(cacheKey, cleanName);
        return cleanName;
    } catch (e) {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}
