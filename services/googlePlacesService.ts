import { GoogleGenAI, Type } from "@google/genai";
import { PlaceSearchResult, Coordinates } from '../types';

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to clean JSON from potential markdown blocks and ensure valid JSON bounds
const cleanJson = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  // Remove any text before the first [ or { and after the last ] or }
  const firstChar = cleaned.match(/^[^[{]*([[{])/);
  if (firstChar) {
      const startIdx = cleaned.indexOf(firstChar[1]);
      cleaned = cleaned.substring(startIdx);
  }
  
  const lastChar = cleaned.match(/([\]}])[^\]}]*$/);
  if (lastChar) {
      const endIdx = cleaned.lastIndexOf(lastChar[1]);
      cleaned = cleaned.substring(0, endIdx + 1);
  }
  
  return cleaned;
};

// Fallback: Use Gemini to generate place suggestions if Places API fails
const searchWithGemini = async (query: string): Promise<PlaceSearchResult[]> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Suggest 5 real-world places that match the search query: "${query}".`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The specific name of the place" },
              description: { type: Type.STRING, description: "A short context (City, Country)" }
            },
            required: ["name", "description"]
          }
        }
      }
    });

    const text = cleanJson(response.text || '[]');
    const items = JSON.parse(text);

    if (!Array.isArray(items)) return [];

    return items.map((item: any) => ({
      // Create a virtual ID that encodes the name for the details step
      placeId: `gemini-${encodeURIComponent(item.name)}`,
      name: item.name,
      description: item.description,
    }));
  } catch (e) {
    console.error("Gemini search fallback failed", e);
    return [];
  }
};

// Fallback: Use Gemini to find coordinates for a place name
const getCoordinatesWithGemini = async (placeName: string): Promise<Coordinates | null> => {
    try {
        const modelId = 'gemini-2.5-flash';
        
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Return the exact latitude and longitude for the place: "${placeName}".`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER }
                    },
                    required: ["lat", "lng"]
                }
            }
        });
        
        const text = cleanJson(response.text || '{}');
        const data = JSON.parse(text);
        
        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
            return { lat: data.lat, lng: data.lng };
        }
        return null;
    } catch (e) {
        console.error("Gemini geocoding fallback failed", e);
        return null;
    }
}

export const getPlacePredictions = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!API_KEY) return [];

  try {
    // Attempt to use Google Places API (New)
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input: query,
      }),
    });

    if (!response.ok) {
        // If API is not enabled or key is invalid for Maps, switch to AI fallback immediately
        return await searchWithGemini(query);
    }

    const data = await response.json();

    if (!data.suggestions) return [];

    return data.suggestions.map((item: any) => {
      const prediction = item.placePrediction;
      return {
        placeId: prediction.placeId,
        name: prediction.structuredFormat?.mainText?.text || prediction.text.text,
        description: prediction.structuredFormat?.secondaryText?.text || prediction.text.text,
      };
    });

  } catch (error) {
    // Silently fallback to Gemini to ensure user experience isn't broken
    return await searchWithGemini(query);
  }
};

export const getPlaceDetails = async (placeId: string, placeName?: string): Promise<Coordinates | null> => {
    if (!API_KEY) return null;

    try {
        // Detect if this is a fallback ID from Gemini
        if (placeId.startsWith('gemini-')) {
            const name = decodeURIComponent(placeId.replace('gemini-', ''));
            return await getCoordinatesWithGemini(name);
        }

        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            method: 'GET',
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'location'
            }
        });

        if (!response.ok) {
            // If details fails (e.g. 403), fallback to Gemini immediately
             if (placeName) {
                return await getCoordinatesWithGemini(placeName);
            }
            throw new Error("Failed to fetch place details");
        }

        const data = await response.json();
        
        if (data.location) {
            return {
                lat: data.location.latitude,
                lng: data.location.longitude
            };
        }
        return null;

    } catch (error) {
        console.error("Google Place Details failed, attempting fallback", error);
        // Fallback to Gemini if provided with a name
        if (placeName) {
            return await getCoordinatesWithGemini(placeName);
        }
        return null;
    }
}