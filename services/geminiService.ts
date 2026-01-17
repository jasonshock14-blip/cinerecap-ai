
import { GoogleGenAI, Type } from "@google/genai";
import { MovieInfo, GeneratedRecap } from "../types";

export const generateMovieRecap = async (info: MovieInfo): Promise<GeneratedRecap> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Write a professional movie recap for the following film:
    Title: ${info.title}
    Genre: ${info.genre}
    Director: ${info.director}
    Key Plot Points: ${info.keyPlotPoints}
    Tone: ${info.tone}
    Include Spoilers: ${info.includeSpoilers ? 'Yes' : 'No'}
    Recap Length: ${info.length}

    The recap should be engaging and high-quality.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tagline: { type: Type.STRING, description: 'A catchy one-liner for the movie.' },
          summary: { type: Type.STRING, description: 'The main recap text.' },
          characterAnalysis: { type: Type.STRING, description: 'Brief analysis of the main characters.' },
          keyTakeaways: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: 'List of important themes or plot devices.' 
          },
          verdict: { type: Type.STRING, description: 'A final recommendation or rating sentence.' }
        },
        required: ["tagline", "summary", "characterAnalysis", "keyTakeaways", "verdict"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as GeneratedRecap;
};
