
import { GoogleGenAI, Type } from "@google/genai";
import { CareGuide, PatientType, AppContent } from "../types";

export async function generateCareGuide(patientType: PatientType, fullOcrText: string, language: string): Promise<CareGuide> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      patientType: { type: Type.STRING },
      dailyCare: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING, description: "One of: CLEANING, SUCTIONING, TIES" },
              },
              required: ["title", "description", "icon"],
            },
          },
        },
      },
      livingWell: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING, description: "One of: EATING, SPEAKING, BATHING" },
              },
              required: ["title", "description", "icon"],
            },
          },
        },
      },
      emergency: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          introduction: { type: Type.STRING },
          procedures: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.STRING },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                whenToCallHelp: { type: Type.STRING },
              },
              required: ["situation", "steps", "whenToCallHelp"],
            },
          },
        },
      },
    },
  };

  const systemInstruction = `You are an expert medical writer and educator. Your task is to simplify a comprehensive medical document about tracheostomy care into a very simple, easy-to-understand guide for caregivers in low-resource settings with varying literacy levels. Use extremely simple language, short sentences, and actionable steps. The tone should be calm, clear, and reassuring. Your output must be a valid JSON object that strictly adheres to the provided schema. IMPORTANT: The entire JSON output, including all string values (titles, descriptions, etc.), MUST be translated into the target language: ${language}.`;

  const prompt = `Based *only* on the provided medical text about tracheostomy care, please generate a simplified guide in ${language} for a caregiver looking after a ${patientType} patient. Populate the JSON object according to the schema I provided.

**IMPORTANT SUCTIONING DETAILS TO INCLUDE:**
When generating the description for the "SUCTIONING" step in the dailyCare section, you MUST include the following specific instructions, simplified for a caregiver:
1. Explain the technique of using a suction catheter (e.g., how to insert it gently, for how long).
2. For pediatric/infant patients, state clearly that the suction pressure should be less than 100 mmHg.
3. Mention that a few drops of normal saline can be put in the tracheostomy tube before suctioning to help loosen mucus.
4. Recommend steam inhalation at least twice a day to help keep secretions thin.

Integrate these points naturally and simply into the suctioning description.

Medical Text:
---
${fullOcrText}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    const parsedData = JSON.parse(jsonText);
    
    // Quick validation to ensure the structure is roughly correct
    if (!parsedData.dailyCare || !parsedData.emergency) {
        throw new Error("Generated JSON is missing required fields.");
    }

    return parsedData as CareGuide;
  } catch (error) {
    console.error("Error generating care guide:", error);
    throw new Error("Failed to generate the care guide. The AI model may be temporarily unavailable.");
  }
}

export async function translateAppContent(content: AppContent, language: string): Promise<AppContent> {
  if (language === 'English') return content;
  
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `You are a professional translator. Translate the values within the following JSON object into ${language}. 
  Do not translate keys or structural elements. 
  Keep the meaning precise, especially for medical terms. 
  For the 'videoGuides' array, translate the 'title' and 'desc', but KEEP the 'url' exactly as is.
  
  JSON Input:
  ${JSON.stringify(content)}
  `;

  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
          }
      });
      
      return JSON.parse(response.text) as AppContent;
  } catch (error) {
      console.error("Error translating app content:", error);
      return content; // Fallback to English on error
  }
}
