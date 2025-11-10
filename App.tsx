
import React, { useState, useCallback, useRef } from 'react';
import { identifyLandmark, fetchLandmarkHistory, narrateText } from './services/geminiService';
import { AnalysisResult } from './components/AnalysisResult';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { LandmarkAnalysis, AppState, ProcessState } from './types';
import { decodeAudioData } from './utils/audio';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove 'data:image/jpeg;base64,' from the start
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>({
        processState: ProcessState.Idle,
        imageFile: null,
        imageDataUrl: null,
        analysis: null,
        error: null,
        loadingMessage: ''
    });

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleImageChange = (file: File | null) => {
        if (file) {
            const dataUrl = URL.createObjectURL(file);
            setAppState({
                processState: ProcessState.ImageUploaded,
                imageFile: file,
                imageDataUrl: dataUrl,
                analysis: null,
                error: null,
                loadingMessage: ''
            });
        }
    };

    const handleAnalyzeClick = useCallback(async () => {
        if (!appState.imageFile) return;

        setAppState(prev => ({ ...prev, processState: ProcessState.Loading, error: null, loadingMessage: 'Analyzing image to identify landmark...' }));
        
        try {
            const base64Image = await fileToBase64(appState.imageFile);
            
            // Step 1: Identify Landmark
            const landmarkName = await identifyLandmark(base64Image, appState.imageFile.type);
            if (!landmarkName) throw new Error("Could not identify the landmark.");
            
            setAppState(prev => ({ ...prev, loadingMessage: `Identified: ${landmarkName}. Fetching history...` }));

            // Step 2: Fetch History
            const { text: history, sources } = await fetchLandmarkHistory(landmarkName);

            setAppState(prev => ({ ...prev, loadingMessage: 'Generating audio narration...' }));

            // Step 3: Narrate Text
            const audioData = await narrateText(history);
            
            const newAnalysis: LandmarkAnalysis = {
                name: landmarkName,
                history,
                sources,
                audioData,
            };

            setAppState(prev => ({
                ...prev,
                processState: ProcessState.Done,
                analysis: newAnalysis,
                loadingMessage: ''
            }));

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setAppState(prev => ({ ...prev, processState: ProcessState.Error, error: `Analysis failed: ${errorMessage}` }));
        }
    }, [appState.imageFile]);

    const playNarration = async () => {
        if (!appState.analysis?.audioData || isPlaying) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            const audioContext = audioContextRef.current;
            // Resume context if it's suspended
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const audioBuffer = await decodeAudioData(appState.analysis.audioData, audioContext);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };

            source.start();
            audioSourceRef.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("Failed to play audio:", error);
            setAppState(prev => ({ ...prev, error: "Could not play the audio narration."}));
        }
    };
    
    const stopNarration = () => {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            // onended will set isPlaying to false
        }
    };

    const handleReset = () => {
        if (audioSourceRef.current) {
             audioSourceRef.current.stop();
        }
        if (appState.imageDataUrl) {
            URL.revokeObjectURL(appState.imageDataUrl);
        }
        setAppState({
            processState: ProcessState.Idle,
            imageFile: null,
            imageDataUrl: null,
            analysis: null,
            error: null,
            loadingMessage: ''
        });
        setIsPlaying(false);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col items-center justify-center p-4 selection:bg-teal-400 selection:text-gray-900">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-500">
                        AI Photo Tour Guide
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Upload a landmark photo and discover its story.</p>
                </header>

                <main className="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
                    {appState.processState === ProcessState.Loading && <Loader message={appState.loadingMessage} />}

                    {appState.processState !== ProcessState.Loading && !appState.imageDataUrl && (
                        <ImageUploader onImageChange={handleImageChange} />
                    )}

                    {appState.imageDataUrl && appState.processState !== ProcessState.Loading && (
                        <AnalysisResult
                            imageDataUrl={appState.imageDataUrl}
                            analysis={appState.analysis}
                            onAnalyze={handleAnalyzeClick}
                            onPlay={playNarration}
                            onStop={stopNarration}
                            isPlaying={isPlaying}
                            showAnalyzeButton={appState.processState === ProcessState.ImageUploaded}
                            onReset={handleReset}
                        />
                    )}
                    
                    {appState.error && (
                        <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                            <p className="font-semibold">Error</p>
                            <p>{appState.error}</p>
                            <button onClick={handleReset} className="mt-2 text-sm text-white underline">Try again</button>
                        </div>
                    )}
                </main>
                 <footer className="text-center mt-8 text-gray-500 text-sm">
                    <p>Powered by Google Gemini</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
