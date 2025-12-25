import { GoogleGenAI } from "@google/genai";
import { Source } from "../types";

declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string | undefined>;
    }
  }
}

let ai: GoogleGenAI | null = null;
let apiKeyPromise: Promise<string | undefined> | null = null;

const getApiKey = (): Promise<string | undefined> => {
  if (!apiKeyPromise) {
    apiKeyPromise = window.electronAPI.getApiKey();
  }
  return apiKeyPromise;
};

const getAiClient = async (): Promise<GoogleGenAI> => {
    if (ai) return ai;
    const apiKey = await getApiKey();
    if (!apiKey) {
        throw new Error("API key not found. Please add it to the .env file.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
}

const handleApiError = (error: unknown, context: string) => {
    console.error(`Error calling Gemini API for ${context}:`, error);
    return `I'm sorry, I encountered an error while trying to answer your question. Please try again.`;
};

export const askBookQuestion = async (context: string, question: string): Promise<string> => {
  try {
    const genAI = await getAiClient();
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
    const genAI = await getAiClient();
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
