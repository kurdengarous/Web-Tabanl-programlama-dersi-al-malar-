
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async suggestTagsAndSummary(content: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiz et ve kısa bir özet ile 3 anahtar kelime (tag) çıkar: ${content}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Kısa özet" },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Etiketler" 
              }
            },
            required: ["summary", "tags"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Error:", error);
      return { summary: "", tags: [] };
    }
  }
}

export const geminiService = new GeminiService();
