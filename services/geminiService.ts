import { GoogleGenAI, Type } from "@google/genai";
import { PlaceSearchResult } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean markdown code blocks from response since we can't use responseMimeType with Tools
const cleanJson = (text: string): string => {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  
  // Attempt to find the array brackets if there's extra text
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
};

export const enhanceNote = async (content: string, mood: string = 'nostalgic'): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing, returning original content");
    return content;
  }

  try {
    const modelId = 'gemini-2.5-flash'; 
    const prompt = `
      You are a poetic editor for a memory-keeping app called 'Forever'. 
      Reword the following raw user note to make it feel deep, ${mood}, and eternal. 
      Keep it concise (under 40 words). 
      Do not use quotes.
      
      Raw note: "${content}"
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini enhancement failed", error);
    return content;
  }
};

export const suggestLocationName = async (lat: number, lng: number): Promise<string> => {
   if (!apiKey) return "Unknown Coordinates";

   try {
    const modelId = 'gemini-2.5-flash';
    // Using Google Maps tool for accurate reverse geocoding with a poetic twist potential
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Identify the specific Point of Interest (POI) at coordinates ${lat}, ${lng}.
      
      STRICT RULES:
      1. Return the actual NAME of the business, resort, park, landmark, or building (e.g., "Grand Hyatt Hotel", "Central Park", "Joe's Pizza").
      2. Do NOT return a generic street address (like "123 Main St") unless it is a private residence with no other name.
      3. If the user clicked on a resort or restaurant, give me that name, not the highway number.
      4. Return ONLY the name. No period at the end.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });
    
    // Cleanup potential extra text if the model is too chatty despite instructions
    let name = response.text.trim();
    // Remove period at end if exists
    if (name.endsWith('.')) name = name.slice(0, -1);
    
    return name;
   } catch (error) {
     return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
   }
}

export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  if (!apiKey || !query) return [];

  try {
    const modelId = 'gemini-2.5-flash';
    
    // Using Google Maps Grounding to find specific real-world places
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Perform a Google Maps search for: "${query}".
      
      Task: Return a list of up to 5 highly relevant real-world results.
      Prioritize specific restaurants, businesses, resorts, or landmarks over generic cities if the query implies a specific place.
      
      For each result found by the Google Maps tool, format it into a JSON object with:
      - "name": The exact name of the place.
      - "description": The address or city/country context.
      - "lat": The latitude (number).
      - "lng": The longitude (number).
      
      Output the final answer strictly as a JSON Array string. 
      Example: [{"name": "Joe's Pizza", "description": "123 Main St, NY", "lat": 40.71, "lng": -74.00}]
      Do not add any other text outside the JSON array.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const text = response.text || '';
    const cleanedText = cleanJson(text);
    const data = JSON.parse(cleanedText);
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any, index: number) => ({
      placeId: `genai-maps-${index}-${Date.now()}`,
      name: item.name,
      description: item.description,
      lat: item.lat,
      lng: item.lng
    }));

  } catch (error) {
    console.error("Gemini search failed", error);
    return [];
  }
};