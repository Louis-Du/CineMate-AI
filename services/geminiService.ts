import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { StructuredResponse, ResponseType, Movie } from "../types";

let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

// Function to generate a poster image using Nano Banana (gemini-2.5-flash-image)
const generatePosterImage = async (movie: Movie): Promise<string> => {
    try {
        const ai = getClient();
        // Construct a descriptive prompt for the poster
        const prompt = `Movie poster for "${movie.title}" (${movie.year}). Directed by ${movie.director}. Genres: ${movie.genres.join(', ')}. High quality, cinematic, official style, vertical orientation.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Nano Banana
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "3:4" // Standard poster ratio
                }
            }
        });

        // Extract image data
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return "";
    } catch (e: any) {
        // Graceful handling for Quota Exceeded (429) errors
        if (e.toString().includes('429') || e.message?.includes('quota')) {
            console.warn(`Poster generation quota exceeded for "${movie.title}". Skipping generation.`);
        } else {
            console.error(`Failed to generate poster for ${movie.title}:`, e);
        }
        // Return empty string to let UI handle fallback
        return "";
    }
};

export const sendMessageToGemini = async (
  userMessage: string,
  chatHistory: { role: string; parts: { text: string }[] }[]
): Promise<StructuredResponse> => {
  try {
    const ai = getClient();
    
    // Config: Enable Google Search tool for grounding (news/details), but NOT for posters anymore.
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{googleSearch: {}}], 
      },
      history: chatHistory
    });

    const result: GenerateContentResponse = await chat.sendMessage({
        message: userMessage
    });

    let responseText = result.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    // Robust JSON Extraction Strategy
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        responseText = jsonMatch[1];
    } else {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            responseText = responseText.substring(firstBrace, lastBrace + 1);
        }
    }

    // Parse the JSON output
    let parsed: StructuredResponse;
    try {
        parsed = JSON.parse(responseText) as StructuredResponse;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response.");
        console.error("Raw Response:", result.text);
        
        return {
            type: ResponseType.TEXT,
            message: result.text || "Error parsing response.", 
            data: null
        };
    }

    // Post-process: Generate Images if needed
    if (parsed.type === ResponseType.RECOMMENDATIONS && Array.isArray(parsed.data)) {
        const movies = parsed.data as Movie[];
        
        // EXECUTE SEQUENTIALLY to avoid hitting rate limits (429)
        // Previous Promise.all caused burst requests that exceeded quota
        for (const movie of movies) {
            if (!movie.posterUrl) {
                // Generate and assign. If it fails, it returns ""
                movie.posterUrl = await generatePosterImage(movie);
            }
        }
    } else if (parsed.type === ResponseType.DETAILS && parsed.data) {
        const movie = parsed.data as Movie;
        // Generate main movie poster
        if (!movie.posterUrl) {
            movie.posterUrl = await generatePosterImage(movie);
        }
        // Generate posters for related movies if they exist
        if (movie.relatedMovies && Array.isArray(movie.relatedMovies)) {
             for (const relMovie of movie.relatedMovies) {
                 if (!relMovie.posterUrl) {
                     relMovie.posterUrl = await generatePosterImage(relMovie);
                 }
             }
        }
    }

    return parsed;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      type: ResponseType.TEXT,
      message: "Lo siento, hubo un error conectando con el servicio de IA. Por favor intenta de nuevo.",
    };
  }
};