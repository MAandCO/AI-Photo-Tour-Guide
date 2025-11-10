
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { identifyLandmark, fetchLandmarkHistory, narrateText } from './services/geminiService';
import { AnalysisResult } from './components/AnalysisResult';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { HistoryPanel } from './components/HistoryPanel';
import { LandmarkAnalysis, AppState, ProcessState, VoiceOption } from './types';
import { decodeAudioData, createWavBlobFromBase64 } from './utils/audio';
import { base64toFile } from './utils/image';
import { HistoryIcon } from './components/icons';

const AVAILABLE_VOICES: VoiceOption[] = [
    { id: 'Kore', name: 'Kore' },
    { id: 'Puck', name: 'Puck' },
    { id: 'Charon', name: 'Charon' },
    { id: 'Fenrir', name: 'Fenrir' },
    { id: 'Zephyr', name: 'Zephyr' },
];

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
    const [history, setHistory] = useState<LandmarkAnalysis[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<string>(AVAILABLE_VOICES[0].id);
    const [isRegeneratingAudio, setIsRegeneratingAudio] = useState<boolean>(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('landmarkHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
            localStorage.removeItem('landmarkHistory');
        }
    }, []);


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
            
            const landmarkName = await identifyLandmark(base64Image, appState.imageFile.type);
            if (!landmarkName) throw new Error("Could not identify the landmark.");
            
            setAppState(prev => ({ ...prev, loadingMessage: `Identified: ${landmarkName}. Fetching history...` }));

            const { text: historyText, sources } = await fetchLandmarkHistory(landmarkName);

            setAppState(prev => ({ ...prev, loadingMessage: 'Generating audio narration...' }));

            const audioData = await narrateText(historyText, selectedVoice);
            
            const newAnalysis: LandmarkAnalysis = {
                name: landmarkName,
                history: historyText,
                sources,
                audioData,
                imageBase64: base64Image,
                imageMimeType: appState.imageFile.type,
            };

            setAppState(prev => ({
                ...prev,
                processState: ProcessState.Done,
                analysis: newAnalysis,
                loadingMessage: ''
            }));
            
            setHistory(prevHistory => {
                const updatedHistory = [newAnalysis, ...prevHistory.filter(h => h.name !== newAnalysis.name)];
                 try {
                    localStorage.setItem('landmarkHistory', JSON.stringify(updatedHistory));
                } catch (error) {
                    console.error("Failed to save history to localStorage", error);
                }
                return updatedHistory;
            });

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setAppState(prev => ({ ...prev, processState: ProcessState.Error, error: `Analysis failed: ${errorMessage}` }));
        }
    }, [appState.imageFile, selectedVoice]);

    const playNarration = async () => {
        if (!appState.analysis?.audioData || isPlaying) return;

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            const audioContext = audioContextRef.current;
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
        }
    };

    const handleReset = () => {
        stopNarration();
        if (appState.imageDataUrl && appState.imageDataUrl.startsWith('blob:')) {
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

    const handleDownload = useCallback(() => {
        if (!appState.analysis?.audioData) return;

        try {
            const blob = createWavBlobFromBase64(appState.analysis.audioData);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${appState.analysis.name.replace(/\s/g, '_')}_narration.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to create download link:", error);
            setAppState(prev => ({ ...prev, error: "Could not prepare the audio for download."}));
        }
    }, [appState.analysis]);

     const handleShare = useCallback(async () => {
        if (!appState.analysis || !navigator.share) {
            console.warn("Sharing not supported or no analysis available.");
            return;
        }

        const { name, history, imageBase64, imageMimeType } = appState.analysis;

        try {
            const shareText = `Check out this landmark: ${name}!\n\nHere's a brief history:\n${history}`;
            const filename = `${name.replace(/\s/g, '_')}.${imageMimeType.split('/')[1] || 'jpeg'}`;
            const imageFile = base64toFile(imageBase64, filename, imageMimeType);

            const shareData: ShareData = {
                title: `Photo Tour Guide: ${name}`,
                text: shareText,
            };
            
            if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                shareData.files = [imageFile];
            }

            await navigator.share(shareData);

        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                 console.error("Error sharing:", error);
                 setAppState(prev => ({ ...prev, error: "Could not share the analysis." }));
            }
        }
    }, [appState.analysis]);

    const handleVoiceChange = async (newVoice: string) => {
        setSelectedVoice(newVoice);
    
        if (appState.analysis) {
            stopNarration();
            setIsRegeneratingAudio(true);
            try {
                const newAudioData = await narrateText(appState.analysis.history, newVoice);
                const updatedAnalysis = { ...appState.analysis, audioData: newAudioData };
    
                setAppState(prev => ({
                    ...prev,
                    analysis: updatedAnalysis,
                }));
    
                setHistory(prevHistory => {
                    const updatedHistory = prevHistory.map(h => 
                        h.name === updatedAnalysis.name ? updatedAnalysis : h
                    );
                    try {
                        localStorage.setItem('landmarkHistory', JSON.stringify(updatedHistory));
                    } catch (error) {
                        console.error("Failed to update history in localStorage", error);
                    }
                    return updatedHistory;
                });
            } catch (err) {
                console.error("Failed to regenerate audio:", err);
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                setAppState(prev => ({ ...prev, error: `Failed to generate new narration: ${errorMessage}` }));
            } finally {
                setIsRegeneratingAudio(false);
            }
        }
    };
    

    const handleSelectHistoryItem = (item: LandmarkAnalysis) => {
        stopNarration();
        if (appState.imageDataUrl && appState.imageDataUrl.startsWith('blob:')) {
            URL.revokeObjectURL(appState.imageDataUrl);
        }
    
        setAppState({
            processState: ProcessState.Done,
            imageFile: null,
            imageDataUrl: `data:${item.imageMimeType};base64,${item.imageBase64}`,
            analysis: item,
            error: null,
            loadingMessage: ''
        });
        setIsHistoryPanelOpen(false);
    };

    const handleClearHistory = () => {
        setHistory([]);
        try {
            localStorage.removeItem('landmarkHistory');
        } catch (error) {
            console.error("Failed to clear history from localStorage", error);
        }
    };


    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col items-center p-4 selection:bg-teal-400 selection:text-gray-900">
            <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
                 <header className="mb-8 w-full flex justify-between items-start">
                    <div className="text-left">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-500">
                            Photo Tour Guide
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">Upload a landmark photo and discover its story.</p>
                    </div>
                    <button
                        onClick={() => setIsHistoryPanelOpen(true)}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 flex-shrink-0 ml-4"
                        aria-label="View history"
                    >
                        <HistoryIcon className="w-7 h-7" />
                    </button>
                </header>

                <main className="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 text-center">
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
                            onDownload={handleDownload}
                            onShare={handleShare}
                            voices={AVAILABLE_VOICES}
                            selectedVoice={selectedVoice}
                            onVoiceChange={handleVoiceChange}
                            isRegeneratingAudio={isRegeneratingAudio}
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
            {isHistoryPanelOpen && (
                <HistoryPanel
                    history={history}
                    onSelect={handleSelectHistoryItem}
                    onClose={() => setIsHistoryPanelOpen(false)}
                    onClearHistory={handleClearHistory}
                />
            )}
        </div>
    );
};

export default App;
