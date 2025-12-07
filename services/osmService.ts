
import { PlaceSearchResult } from '../types';

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!query || query.length < 2) return [];

  try {
    // Using OpenStreetMap Nominatim API
    // https://nominatim.org/release-docs/develop/api/Search/
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
    
    const response = await fetch(url, {
        headers: {
            'Accept-Language': 'en-US,en;q=0.9' // Prefer English results
        }
    });
    
    if (!response.ok) {
      throw new Error(`OSM Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      // Nominatim returns a long display_name, let's try to extract the specific name
      // If 'name' property is empty, grab the first part of the display name
      const shortName = item.name || (item.display_name ? item.display_name.split(',')[0] : 'Unknown Location');
      
      return {
        placeId: item.place_id?.toString() || crypto.randomUUID(),
        name: shortName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        description: item.display_name // e.g. "Eiffel Tower, 5, Avenue Anatole France, Gros-Caillou, 7th Arrondissement, Paris, Île-de-France, Metropolitan France, 75007, France"
      };
    });

  } catch (error) {
    console.error("OSM search failed", error);
    return [];
  }
};
