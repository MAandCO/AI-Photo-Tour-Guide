import React from 'react';
import { CloseIcon } from './icons';

interface VeoApiKeyModalProps {
    onClose: () => void;
    onSelectKey: () => void;
}

export const VeoApiKeyModal: React.FC<VeoApiKeyModalProps> = ({ onClose, onSelectKey }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="veo-modal-title" onClick={onClose}>
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 id="veo-modal-title" className="text-lg font-bold text-white">API Key Required</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-gray-300 mb-4">
                        To use the experimental video generation feature, you need to select an API key associated with a project that has billing enabled.
                    </p>
                    <p className="text-sm text-gray-400 mb-6">
                        This feature uses the Veo model, which is a premium service. For more details, please review the 
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline mx-1">
                            billing documentation
                        </a>.
                    </p>
                    <button
                        onClick={onSelectKey}
                        className="w-full bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105"
                    >
                        Select API Key
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
