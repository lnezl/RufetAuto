
import { GoogleGenAI, Type } from "@google/genai";
import { DTC, AIInsight } from "../types";
import { getLocalInsight, localDecodeVin } from "./localData";

// Always use environment variable directly and check availability
const isOnline = () => navigator.onLine && !!process.env.API_KEY;

export const getDTCInsight = async (dtc: DTC, lang: 'ru' | 'az'): Promise<AIInsight> => {
  if (!isOnline()) return getLocalInsight(dtc.code, lang);

  try {
    // Create new GoogleGenAI instance right before the call to ensure fresh key access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptLang = lang === 'az' ? 'Azərbaycan dilində' : 'на русском языке';
    
    // Fix: Refactored generateContent to use a single object argument containing model, contents, and config.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Проанализируй код ошибки OBD2 ${dtc.code}: ${dtc.description}. 
        Дай краткое объяснение, список причин и примерную стоимость ремонта в AZN. 
        Язык: ${promptLang}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedRepairCost: { type: Type.STRING },
            severityAdvice: { type: Type.STRING }
          },
          required: ["explanation", "possibleCauses", "estimatedRepairCost", "severityAdvice"]
        }
      }
    });

    // Directly access text property (getter)
    const resultText = response.text;
    if (!resultText) throw new Error("No text content returned from model.");
    
    return JSON.parse(resultText.trim());
  } catch (e) {
    console.error("Gemini DTC Insight fetch failed, using local database:", e);
    return getLocalInsight(dtc.code, lang);
  }
};

export const decodeVin = async (vin: string, lang: 'ru' | 'az') => {
  // Fix: Added the missing 'lang' argument to localDecodeVin call.
  if (!isOnline() || vin === "VIN_READING_FAILED") return localDecodeVin(vin, lang);

  try {
    // Create new GoogleGenAI instance right before the call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Refactored generateContent to use a single object argument containing model, contents, and config.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify vehicle by VIN: ${vin}. Provide JSON with make, model, and manufacturing year.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            year: { type: Type.NUMBER }
          },
          required: ["make", "model", "year"]
        }
      }
    });
    
    // Directly access text property (getter)
    const resultText = response.text;
    if (!resultText) throw new Error("No text content returned from model.");

    return JSON.parse(resultText.trim());
  } catch (e) {
    console.error("Gemini VIN decode failed, using local logic:", e);
    // Fix: Added the missing 'lang' argument to localDecodeVin call.
    return localDecodeVin(vin, lang);
  }
};
