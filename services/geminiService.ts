import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateLesson = async (): Promise<string> => {
  try {
    const ai = getClient();
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Create a single paragraph for a typing lesson.
      Constraints:
      1. Must include both uppercase and lowercase English alphabets.
      2. Must frequently use the following symbols: comma (,), colon (:), semicolon (;), period (.), single quote ('), double quote (").
      3. The text should be coherent, interesting to read, and about 40-60 words long.
      4. Do not include markdown formatting or explanations. Just the raw text.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text?.trim() || "Error generating text. Please try again.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback if API fails or key is missing
    return "The swift, brown fox jumped over the lazy dog; meanwhile, the 'sleeping' cat didn't move: a classic example of apathy. \"Why bother?\" she thought, curling up tighter.";
  }
};