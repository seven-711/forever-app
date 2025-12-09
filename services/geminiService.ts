import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// ============================================================================
// 🧠 SMART CACHING LAYER
// To prevent 429 Resource Exhausted errors, we cache all AI responses locally.
// ============================================================================
const CACHE_PREFIX = 'forever_ai_v1_';

const getFromCache = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (item) {
      const { data, timestamp } = JSON.parse(item);
      // Cache valid for 48 hours to maximize "free" usage
      if (Date.now() - timestamp < 48 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null;
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn("Local storage full, skipping cache save");
  }
};

export const enhanceNote = async (content: string, mood: string = 'nostalgic'): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key missing, returning original content");
    return content;
  }
  
  // Check Cache
  const cacheKey = `enhance_${mood}_${content.trim()}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) return cached;

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

    const result = response.text.trim();
    saveToCache(cacheKey, result);
    return result;

  } catch (error) {
    console.error("Gemini enhancement failed (Quota likely exceeded)", error);
    return content; // Fallback to original
  }
};
