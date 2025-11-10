
import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function identifyLandmark(base64Image: string, mimeType: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Identify the famous landmark in this photo. Provide only the name and city/country of the landmark. If it is not a famous landmark, say 'Unknown'." },
                { inlineData: { data: base64Image, mimeType } }
            ]
        }
    });
    const text = response.text.trim();
    if (text.toLowerCase() === 'unknown') {
        throw new Error("The uploaded image does not appear to be a famous landmark.");
    }
    return text;
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
