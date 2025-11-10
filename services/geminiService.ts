
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { LandmarkIdentificationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const landmarkIdentificationSchema = {
    type: Type.OBJECT,
    properties: {
        isLandmark: { 
            type: Type.BOOLEAN, 
            description: 'True if the image contains a famous, identifiable landmark, false otherwise.' 
        },
        name: { 
            type: Type.STRING, 
            description: 'If a landmark is identified, this is its official name and location (e.g., "Eiffel Tower, Paris, France"). Otherwise, this is null.' 
        },
        description: { 
            type: Type.STRING, 
            description: 'If no landmark is identified, this is a brief, one-sentence description of the main subject of the image. Otherwise, this is null.' 
        },
    },
    required: ['isLandmark', 'name', 'description'],
};


export async function identifyLandmark(base64Image: string, mimeType: string): Promise<LandmarkIdentificationResult> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Analyze the image. If it contains a famous, identifiable landmark, set isLandmark to true and provide its name and location. If not, set isLandmark to false and provide a brief description of the image's subject." },
                { inlineData: { data: base64Image, mimeType } }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: landmarkIdentificationSchema,
        },
    });

    try {
        const jsonString = response.text.trim();
        const result: LandmarkIdentificationResult = JSON.parse(jsonString);
        
        if (typeof result.isLandmark !== 'boolean') {
            throw new Error("Invalid response format from identification model.");
        }
        
        return result;

    } catch (e) {
        console.error("Failed to parse landmark identification response:", e);
        console.error("Raw response text:", response.text);
        throw new Error("Could not understand the response from the identification service.");
    }
}

export async function fetchLandmarkHistory(landmarkName: string): Promise<{ text: string, sources: any[] }> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a brief, engaging history of ${landmarkName} suitable for a tourist. Keep it to one or two paragraphs.`,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    
    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
}

export async function narrateText(text: string, voiceName: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Read this in a clear, friendly tour guide voice: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                },
            },
        },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        throw new Error("Failed to generate audio from text.");
    }
    return audioData;
}