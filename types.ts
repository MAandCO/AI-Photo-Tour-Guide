
export interface LandmarkAnalysis {
    name: string;
    history: string;
    sources: any[]; 
    audioData: string;
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
