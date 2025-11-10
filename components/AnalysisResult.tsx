
import React, { useState, useEffect, useRef } from 'react';
import { LandmarkAnalysis } from '../types';
import { decodeAudioData, createWavBlobFromBase64 } from '../utils/audio';
import { PlayIcon, PauseIcon, DownloadIcon, ShareIcon } from './icons';

interface AnalysisResultProps {
    analysis: LandmarkAnalysis;
    onNewAnalysis: () => void;
    onShare: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, onNewAnalysis, onShare }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        // Initialize AudioContext. It must be created after a user interaction on some browsers.
        // We create it here, and playback is triggered by a button click.
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const setupAudio = async () => {
            if (analysis.audioData && audioContextRef.current) {
                try {
                    const buffer = await decodeAudioData(analysis.audioData, audioContextRef.current);
                    setAudioBuffer(buffer);
                } catch (error) {
                    console.error("Failed to decode audio data:", error);
                }
            }
        };

        setupAudio();

        // Cleanup function
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
        };
    }, [analysis.audioData]);

    const togglePlayback = () => {
        if (!audioContextRef.current || !audioBuffer) return;

        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
        } else {
            // Ensure context is running
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume();
            }
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
            };
            audioSourceRef.current = source;
            setIsPlaying(true);
        }
    };
    
    const handleDownloadAudio = () => {
        if (analysis.audioData) {
            const blob = createWavBlobFromBase64(analysis.audioData);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${analysis.name.replace(/\s+/g, '_')}_narration.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="md:grid md:grid-cols-2">
                    <div className="relative">
                         <img 
                            src={`data:${analysis.imageMimeType};base64,${analysis.imageBase64}`} 
                            alt={analysis.name}
                            className="w-full h-64 md:h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r"></div>
                    </div>

                    <div className="p-6 flex flex-col">
                        <h2 className="text-3xl font-bold text-white mb-4">{analysis.name}</h2>
                        <div className="flex-grow overflow-y-auto max-h-[40vh] md:max-h-none pr-2 custom-scrollbar">
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis.history}</p>
                            
                            {analysis.sources && analysis.sources.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sources</h3>
                                    <ul className="mt-2 space-y-2">
                                        {analysis.sources.map((source, index) => (
                                            source.web?.uri &&
                                            <li key={index} className="flex items-start">
                                                <span className="text-cyan-400 mr-2 mt-1">&#8226;</span>
                                                <a 
                                                    href={source.web.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-gray-300 hover:text-cyan-400 text-sm transition-colors break-all"
                                                >
                                                    {source.web.title || source.web.uri}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {analysis.audioData && (
                            <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={togglePlayback}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-cyan-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400"
                                >
                                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                                    {isPlaying ? 'Pause Narration' : 'Play Narration'}
                                </button>
                                <div className="flex items-center gap-2">
                                     <button onClick={handleDownloadAudio} aria-label="Download audio" className="p-3 bg-gray-700/60 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                                        <DownloadIcon className="w-6 h-6"/>
                                    </button>
                                    <button onClick={onShare} aria-label="Share result" className="p-3 bg-gray-700/60 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                                        <ShareIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <div className="mt-8 text-center">
                <button 
                    onClick={onNewAnalysis}
                    className="bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm hover:bg-gray-600 transition-colors duration-300"
                >
                    Analyze Another Landmark
                </button>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #2d3748; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #718096; }
            `}</style>
        </div>
    );
};
