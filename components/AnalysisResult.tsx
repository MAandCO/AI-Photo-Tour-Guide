
import React from 'react';
import { LandmarkAnalysis, VoiceOption } from '../types';
import { PlayIcon, PauseIcon, SparklesIcon, ResetIcon, DownloadIcon, ShareIcon, SpeakerWaveIcon, SpinnerIcon } from './icons';

interface AnalysisResultProps {
    imageDataUrl: string;
    analysis: LandmarkAnalysis | null;
    isPlaying: boolean;
    showAnalyzeButton: boolean;
    onAnalyze: () => void;
    onPlay: () => void;
    onStop: () => void;
    onReset: () => void;
    onDownload: () => void;
    onShare: () => void;
    voices: VoiceOption[];
    selectedVoice: string;
    onVoiceChange: (voice: string) => void;
    isRegeneratingAudio: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({
    imageDataUrl,
    analysis,
    isPlaying,
    showAnalyzeButton,
    onAnalyze,
    onPlay,
    onStop,
    onReset,
    onDownload,
    onShare,
    voices,
    selectedVoice,
    onVoiceChange,
    isRegeneratingAudio
}) => {
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;
    const commonButtonClasses = "bg-gray-700 text-white rounded-full p-3 shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-gray-700";

    return (
        <div className="w-full flex flex-col items-center animate-fade-in">
            <div className="relative w-full max-w-2xl group">
                <img
                    src={imageDataUrl}
                    alt="Uploaded landmark"
                    className="rounded-xl object-cover w-full shadow-lg"
                />
                <button 
                  onClick={onReset}
                  className="absolute top-3 right-3 bg-gray-900/70 p-2 rounded-full text-white hover:bg-red-600/80 transition-all duration-200 opacity-50 group-hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                  aria-label="Start over"
                >
                  <ResetIcon className="w-5 h-5"/>
                </button>
                {analysis && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6 rounded-b-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-white">{analysis.name}</h2>
                             <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={onDownload}
                                    className={commonButtonClasses}
                                    aria-label="Download narration"
                                    disabled={isRegeneratingAudio}
                                >
                                   <DownloadIcon className="w-6 h-6" />
                                </button>
                                {canShare && (
                                     <button
                                        onClick={onShare}
                                        className={commonButtonClasses}
                                        aria-label="Share analysis"
                                        disabled={isRegeneratingAudio}
                                    >
                                       <ShareIcon className="w-6 h-6" />
                                    </button>
                                )}
                                <div className="relative">
                                    <SpeakerWaveIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    <select
                                        value={selectedVoice}
                                        onChange={(e) => onVoiceChange(e.target.value)}
                                        disabled={isRegeneratingAudio}
                                        className="bg-gray-700 text-white rounded-full appearance-none pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        aria-label="Select narration voice"
                                    >
                                        {voices.map(voice => (
                                            <option key={voice.id} value={voice.id}>{voice.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={isPlaying ? onStop : onPlay}
                                    className="bg-cyan-500 text-gray-900 rounded-full p-3 shadow-lg hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400 transition-transform transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-cyan-500"
                                    aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
                                    disabled={isRegeneratingAudio}
                                >
                                    {isRegeneratingAudio 
                                        ? <SpinnerIcon className="w-6 h-6" />
                                        : (isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />)
                                    }
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-300 mt-2 text-sm leading-relaxed max-h-24 overflow-y-auto pr-2">
                           {analysis.history}
                        </p>
                    </div>
                )}
            </div>

            {showAnalyzeButton && (
                <button
                    onClick={onAnalyze}
                    className="mt-6 flex items-center gap-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400"
                >
                    <SparklesIcon className="w-5 h-5"/>
                    Discover History
                </button>
            )}

            {analysis?.sources && analysis.sources.length > 0 && (
                <div className="mt-6 w-full max-w-2xl text-left">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sources</h3>
                    <ul className="mt-2 space-y-1">
                        {analysis.sources.map((source, index) => (
                           source.web && (
                             <li key={index}>
                                 <a
                                     href={source.web.uri}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline truncate block"
                                 >
                                     {source.web.title || source.web.uri}
                                 </a>
                             </li>
                           )
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
