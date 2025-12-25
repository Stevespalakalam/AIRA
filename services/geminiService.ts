import { GoogleGenAI } from "@google/genai";
import { Source } from "../types";

// Allow reading API key from window object for local development
declare global {
  interface Window {
    GEMINI_API_KEY?: string;
  }
}

const API_KEY = window.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== "YOUR_API_KEY_HERE") {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error("API_KEY is not set. Please add it to index.html.");
}

const getAiClient = (): GoogleGenAI => {
    if (!ai) {
        throw new Error("Gemini AI client not initialized. Check API Key in index.html");
    }
    return ai;
}

const handleApiError = (error: unknown, context: string) => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    return `I'm sorry, I encountered an error while trying to answer your question. Please try again.`;
};

export const askBookQuestion = async (context: string, question: string): Promise<string> => {
  try {
    const genAI = getAiClient();
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are a friendly and insightful reading assistant. Your personality is curious and helpful. Your answers must be based *only* on the provided text from the book. Do not use any external knowledge. The user is speaking to you, so the transcription of their question might contain errors, especially for proper nouns from the book (like character names or places). Use the provided CONTEXT FROM BOOK PAGE to infer the correct word. For example, if the user says 'Tell me about airborne' and the text contains 'Aragorn', you should assume they meant 'Aragorn'. If the answer is not in the text, say "I can't find the answer to that in the text provided." Your tone should be conversational and natural. Feel free to elaborate slightly to make your answers feel more like a human conversation.`;
    
    const userPrompt = `CONTEXT FROM BOOK PAGE:\n---\n${context}\n---\nMY QUESTION: "${question}"`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4,
      },
    });
    return response.text;
  } catch (error) {
    return handleApiError(error, 'askBookQuestion');
  }
};

export const searchWebForDefinition = async (term: string): Promise<{ text: string; sources: Source[] }> => {
  try {
    const genAI = getAiClient();
    const model = 'gemini-2.5-flash';
    const userPrompt = `What is the meaning or definition of the word "${term}"? Provide a concise definition.`;

    const response = await genAI.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const text = response.text.trim();
    
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = rawChunks
      .map((chunk: any) => ({
        title: chunk.web?.title || 'Unknown Source',
        uri: chunk.web?.uri || '#',
      }))
      .filter((source: Source) => source.uri !== '#');

    const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

    return { text, sources: uniqueSources };

  } catch (error) {
    console.error("Error calling Gemini API with Google Search:", error);
    return {
      text: "I'm sorry, I encountered an error while searching the web for a definition. Please try again.",
      sources: [],
    };
  }
};