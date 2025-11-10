
export interface LandmarkIdentificationResult {
    isLandmark: boolean;
    name: string | null;
    description: string | null;
}

export interface LandmarkAnalysis {
    name: string;
    history: string;
    sources: any[]; 
    audioData: string | null;
    imageBase64: string;
    imageMimeType: string;
    isLandmark: boolean;
}

export enum ProcessState {
    Idle,
    ImageUploaded,
    Loading,
    Done,
    Error
}

export interface AppState {
    processState: ProcessState;
    imageFile: File | null;
    imageDataUrl: string | null;
    analysis: LandmarkAnalysis | null;
    error: string | null;
    loadingMessage: string;
}

export interface VoiceOption {
    id: string;
    name: string;
}