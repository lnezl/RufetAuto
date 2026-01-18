
import { GoogleGenAI, Type } from "@google/genai";
import { DTC, AIInsight, MaintenanceRecommendation, ChatMessage } from "../types";
import { LOCAL_DTC_DATABASE, getLocalInsight, localDecodeVin } from "./localData";

// Initialize AI only if key exists
const apiKey = process.env.API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const isOnline = () => navigator.onLine && !!ai;

export const translateDTCList = async (errors: DTC[], lang: 'ru' | 'az'): Promise<DTC[]> => {
  if (!isOnline() || !ai) {
    return errors.map(err => {
      const local = LOCAL_DTC_DATABASE[err.code];
      return local ? { ...err, description: local[lang] } : err;
    });
  }

  try {
    const promptLang = lang === 'az' ? 'Azərbaycan dilində' : 'на русском языке';
    const errorItems = errors.map(e => ({ code: e.code, description: e.description }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following OBD2 error descriptions to ${promptLang}. 
      Maintain technical accuracy for automotive terms. 
      Return a JSON array of objects with "code" and "translatedDescription".
      Errors: ${JSON.stringify(errorItems)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              translatedDescription: { type: Type.STRING }
            },
            required: ["code", "translatedDescription"]
          }
        }
      }
    });

    const translations = JSON.parse(response.text.trim());
    return errors.map(err => {
      const trans = translations.find((t: any) => t.code === err.code);
      return {
        ...err,
        description: trans ? trans.translatedDescription : err.description
      };
    });
  } catch (e) {
    console.warn("Gemini translation failed, using local fallback", e);
    return errors.map(err => {
      const local = LOCAL_DTC_DATABASE[err.code];
      return local ? { ...err, description: local[lang] } : err;
    });
  }
};

export const getDTCInsight = async (dtc: DTC, lang: 'ru' | 'az'): Promise<AIInsight> => {
  if (!isOnline() || !ai) return getLocalInsight(dtc.code, lang);

  try {
    const promptLang = lang === 'az' ? 'Azərbaycan dilində' : 'на русском языке';
    const role = lang === 'az' ? 'Sən peşəkar avtomexaniksən.' : 'Ты — профессиональный автомеханик.';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${role} OBD2 xəta kodu ${dtc.code}: ${dtc.description} analiz et. 
      Bütün JSON sahələrini (explanation, possibleCauses, severityAdvice) MÜTLƏQ ${promptLang} doldur.
      VAJİB: Təmir xərcini (estimatedRepairCost) Azərbaycan Manatı (AZN) ilə qeyd et. Cavabı yalnız təmiz JSON formatında ver.`,
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

    return JSON.parse(response.text.trim());
  } catch (e) {
    console.warn("Gemini insight failed, using local fallback", e);
    return getLocalInsight(dtc.code, lang);
  }
};

export const getReportSummary = async (errors: DTC[], lang: 'ru' | 'az'): Promise<string> => {
  if (!isOnline() || !ai) {
    return lang === 'ru' 
      ? `Обнаружено ${errors.length} ошибок. Требуется диагностика систем: ${[...new Set(errors.map(e => e.system))].join(', ')}.`
      : `${errors.length} xəta aşkarlandı. Sistemlərin diaqnostikası tələb olunur: ${[...new Set(errors.map(e => e.system))].join(', ')}.`;
  }

  try {
    const promptLang = lang === 'az' ? 'Azərbaycan dilində' : 'на русском языке';
    const errorText = errors.map(e => `${e.code}: ${e.description}`).join(', ');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Как эксперт Rufet Auto Electric, напиши краткое профессиональное резюме по следующим ошибкам: ${errorText}. Объясни клиенту понятным языком, что именно не так и насколько это критично. Язык: ${promptLang}.`,
    });

    return response.text;
  } catch (e) {
    return lang === 'ru' ? "Сводка временно недоступна." : "Xülasə müvəqqəti olaraq əlçatmazdır.";
  }
};

export const chatWithMechanic = async (history: ChatMessage[], message: string, context: string, lang: 'ru' | 'az') => {
  if (!isOnline() || !ai) return lang === 'ru' ? "Извините, чат работает только онлайн." : "Bağışlayın, çat yalnız onlayn işləyir.";

  try {
    const systemInstruction = lang === 'az' 
      ? `Sən Rufet Auto Electric-in virtual mexanikisən. Kontekst: ${context}. BÜTÜN cavablar Azərbaycan dilində olmalıdır. Maliyyə hesablamalarını AZN ilə apar. Qısa və peşəkar cavab ver.` 
      : `Ты — виртуальный механик Rufet Auto Electric. Контекст: ${context}. ВСЕ ответы должны быть на русском языке. Все финансовые расчеты веди в AZN. Отвечай кратко и профессионально.`;

    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: { systemInstruction },
    });

    return response.text;
  } catch (e) {
    return lang === 'ru' ? "Ошибка связи с ИИ." : "Süni intellektlə əlaqə xətası.";
  }
};

export const decodeVin = async (vin: string, lang: 'ru' | 'az') => {
  if (!isOnline() || !ai) return localDecodeVin(vin);

  try {
    const promptLang = lang === 'az' ? 'Azərbaycan' : 'Русский';
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify vehicle by VIN: ${vin}. Provide JSON with make, model, and manufacturing year. Language: ${promptLang}.`,
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
    return JSON.parse(response.text.trim());
  } catch (e) {
    return localDecodeVin(vin);
  }
};

export const getMaintenanceRecommendations = async (vin: string, year: number, lang: 'ru' | 'az', make?: string, model?: string): Promise<MaintenanceRecommendation> => {
  const vehicle = make ? `${make} ${model} (${year})` : `${year} model vehicle`;
  const promptLang = lang === 'az' ? 'Azərbaycan' : 'Русский';
  
  if (!isOnline() || !ai) {
    return {
      vehicleType: vehicle,
      nextProcedures: [
        { title: "Oil Change", description: "Regular interval", priority: "medium" },
        { title: "Brake Check", description: "Safety inspection", priority: "high" }
      ],
      generalAdvice: "Check owner's manual for specific details."
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Maintenance for ${vehicle}. Language: ${promptLang}. Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vehicleType: { type: Type.STRING },
            nextProcedures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING }
                }
              }
            },
            generalAdvice: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (e) {
    return {
      vehicleType: vehicle,
      nextProcedures: [],
      generalAdvice: "Error fetching data."
    };
  }
};
