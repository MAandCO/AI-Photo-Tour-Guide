
import React, { useState, useEffect, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { AnalysisResult } from './components/AnalysisResult';
import { HistoryPanel } from './components/HistoryPanel';
import { ShareModal } from './components/ShareModal';
import { AppState, ProcessState, LandmarkAnalysis, VoiceOption } from './types';
import { identifyLandmark, fetchLandmarkHistory, narrateText } from './services/geminiService';
import { HistoryIcon, ChevronDownIcon, UploadIcon, BrainIcon, BookIcon, SoundWaveIcon } from './components/icons';

const App: React.FC = () => {
    const initialState: AppState = {
        processState: ProcessState.Idle,
        imageFile: null,
        imageDataUrl: null,
        analysis: null,
        error: null,
        loadingMessage: '',
    };
    
    const [state, setState] = useState<AppState>(initialState);
    const [history, setHistory] = useState<LandmarkAnalysis[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    const voiceOptions: VoiceOption[] = [
        { id: 'Kore', name: 'Kore (Female)' },
        { id: 'Puck', name: 'Puck (Male)' },
        { id: 'Charon', name: 'Charon (Male)' },
        { id: 'Zephyr', name: 'Zephyr (Female)' },
        { id: 'Fenrir', name: 'Fenrir (Male)' },
    ];
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(voiceOptions[0]);

    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('landmarkHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error("Could not load history from localStorage:", error);
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('landmarkHistory', JSON.stringify(history));
        } catch (error) {
            console.error("Could not save history to localStorage:", error);
        }
    }, [history]);

    const handleImageChange = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setState({
                ...initialState,
                processState: ProcessState.ImageUploaded,
                imageFile: file,
                imageDataUrl: e.target?.result as string,
            });
        };
        reader.readAsDataURL(file);
    };

    const startAnalysis = useCallback(async () => {
        if (!state.imageFile || !state.imageDataUrl) return;
        
        const imageMimeType = state.imageFile.type;
        const imageBase64 = state.imageDataUrl.split(',')[1];
        
        try {
            setState(s => ({ ...s, processState: ProcessState.Loading, loadingMessage: 'Identifying landmark...' }));

            const identification = await identifyLandmark(imageBase64, imageMimeType);
            
            if (!identification.isLandmark) {
                const nonLandmarkAnalysis: LandmarkAnalysis = {
                    name: "Not a Landmark",
                    history: identification.description || "The image uploaded does not appear to contain a recognizable landmark.",
                    sources: [],
                    audioData: null,
                    imageBase64,
                    imageMimeType,
                    isLandmark: false,
                };
                setState(s => ({ 
                    ...s, 
                    processState: ProcessState.Done,
                    analysis: nonLandmarkAnalysis,
                }));
                // Do not add non-landmarks to history
                return;
            }

            const landmarkName = identification.name!;
            setState(s => ({ ...s, loadingMessage: `Found ${landmarkName}. Fetching history...`}));

            const { text: historyText, sources } = await fetchLandmarkHistory(landmarkName);

            setState(s => ({ ...s, loadingMessage: `Generating audio narration with ${selectedVoice.name} voice...` }));

            const audioData = await narrateText(historyText, selectedVoice.id);

            const finalAnalysis: LandmarkAnalysis = {
                name: landmarkName,
                history: historyText,
                sources: sources,
                audioData,
                imageBase64,
                imageMimeType,
                isLandmark: true,
            };

            setState(s => ({ ...s, processState: ProcessState.Done, analysis: finalAnalysis }));
            setHistory(prevHistory => [finalAnalysis, ...prevHistory.filter(item => item.name !== finalAnalysis.name)]);

        } catch (err) {
            console.error("Analysis failed:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during analysis.";
            setState(s => ({ ...s, processState: ProcessState.Error, error: errorMessage }));
        }
    }, [state.imageFile, state.imageDataUrl, selectedVoice]);
    
    const handleReset = () => {
        setState(initialState);
    };

    const handleSelectHistoryItem = (item: LandmarkAnalysis) => {
        setState({
            ...initialState,
            processState: ProcessState.Done,
            analysis: item,
            imageDataUrl: `data:${item.imageMimeType};base64,${item.imageBase64}`
        });
        setIsHistoryPanelOpen(false);
    };

    const handleClearHistory = () => {
        setHistory([]);
        setIsHistoryPanelOpen(false);
    };
    
    const renderContent = () => {
        switch (state.processState) {
            case ProcessState.Idle:
                return (
                     <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto animate-fade-in">
                        <ImageUploader onImageChange={handleImageChange} />
                        <div className="mt-16 w-full text-center">
                            <h2 className="text-2xl font-bold text-white mb-8 tracking-wide">How It Works</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="flex flex-col items-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-700 rounded-full">
                                        <UploadIcon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <h3 className="font-semibold mb-2">1. Add an Image</h3>
                                    <p className="text-sm text-gray-400">Upload or snap a photo of a landmark.</p>
                                </div>
                                <div className="flex flex-col items-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-700 rounded-full">
                                        <BrainIcon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <h3 className="font-semibold mb-2">2. Identification</h3>
                                    <p className="text-sm text-gray-400">Recognises the landmark in your photo.</p>
                                </div>
                                <div className="flex flex-col items-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-700 rounded-full">
                                        <BookIcon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <h3 className="font-semibold mb-2">3. Fetch History</h3>
                                    <p className="text-sm text-gray-400">It finds its history using Google Search.</p>
                                </div>
                                <div className="flex flex-col items-center p-6 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-center w-16 h-16 mb-4 bg-gray-700 rounded-full">
                                        <SoundWaveIcon className="w-8 h-8 text-cyan-400" />
                                    </div>
                                    <h3 className="font-semibold mb-2">4. Listen & Learn</h3>
                                    <p className="text-sm text-gray-400">Get an audio narration of the story behind it.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case ProcessState.ImageUploaded:
                return (
                    <div className="text-center animate-fade-in w-full max-w-lg mx-auto">
                        {state.imageDataUrl && <img src={state.imageDataUrl} alt="Uploaded preview" className="rounded-xl shadow-lg mb-6 w-full object-contain max-h-80"/>}
                         <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                             <div className="relative group mb-4">
                                 <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-1">Narration Voice</label>
                                 <select 
                                    id="voice-select"
                                    value={selectedVoice.id} 
                                    onChange={(e) => setSelectedVoice(voiceOptions.find(v => v.id === e.target.value)!)}
                                    className="w-full appearance-none bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    {voiceOptions.map(voice => <option key={voice.id} value={voice.id}>{voice.name}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <ChevronDownIcon className="w-5 h-5"/>
                                </div>
                            </div>
                            <button 
                                onClick={startAnalysis} 
                                className="w-full bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105"
                            >
                                Analyze Landmark
                            </button>
                        </div>
                        <button onClick={handleReset} className="mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                            Choose a different image
                        </button>
                    </div>
                );
            case ProcessState.Loading:
                return <Loader message={state.loadingMessage} />;
            case ProcessState.Done:
                return state.analysis && <AnalysisResult analysis={state.analysis} onNewAnalysis={handleReset} onShare={() => setIsShareModalOpen(true)} />;
            case ProcessState.Error:
                return (
                     <div className="text-center animate-fade-in p-8 bg-red-900/20 border border-red-500/50 rounded-lg max-w-lg mx-auto">
                        <h3 className="text-2xl font-bold text-red-400 mb-4">Analysis Failed</h3>
                        <p className="text-red-200 mb-6">{state.error}</p>
                        <button onClick={handleReset} className="bg-red-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors">
                            Try Again
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col">
            <header className="flex justify-between items-center p-4 border-b border-gray-800 shadow-md flex-shrink-0">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                    Landmark<span className="text-cyan-400">Lens</span>
                </h1>
                {history.length > 0 && (
                     <button 
                        onClick={() => setIsHistoryPanelOpen(true)}
                        className="flex items-center gap-2 bg-gray-700 text-sm text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-600 transition-colors duration-200"
                        aria-label="Open analysis history"
                    >
                         <HistoryIcon className="w-5 h-5" />
                         History
                    </button>
                )}
            </header>
            
            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                {renderContent()}
            </main>

            {isHistoryPanelOpen && (
                <HistoryPanel 
                    history={history} 
                    onSelect={handleSelectHistoryItem} 
                    onClose={() => setIsHistoryPanelOpen(false)}
                    onClearHistory={handleClearHistory}
                />
            )}

            {isShareModalOpen && state.analysis && (
                <ShareModal 
                    analysis={state.analysis}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
            
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default App;
