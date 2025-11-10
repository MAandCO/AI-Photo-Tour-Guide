
import React, { useState } from 'react';
import { LandmarkAnalysis } from '../types';
import { SearchIcon, CloseIcon, TrashIcon } from './icons';

interface HistoryPanelProps {
    history: LandmarkAnalysis[];
    onSelect: (item: LandmarkAnalysis) => void;
    onClose: () => void;
    onClearHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClose, onClearHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = history.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="history-panel-title">
            <div className="w-full max-w-md bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-700 animate-slide-in-right">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 id="history-panel-title" className="text-xl font-bold text-white">Analysis History</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close history panel"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Search and Clear */}
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="relative">
                        <label htmlFor="search-history" className="sr-only">Search by landmark</label>
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        <input
                            id="search-history"
                            type="search"
                            placeholder="Search by landmark..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    {history.length > 0 && (
                        <button 
                            onClick={onClearHistory} 
                            className="text-sm text-red-400 hover:text-red-300 hover:underline mt-3 flex items-center gap-1.5 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Clear All History
                        </button>
                    )}
                </div>

                {/* History List */}
                <div className="flex-grow overflow-y-auto">
                    {filteredHistory.length > 0 ? (
                        <ul aria-label="Analysis history list">
                            {filteredHistory.map((item, index) => (
                                <li key={`${item.name}-${index}`} className="border-b border-gray-800">
                                    <button onClick={() => onSelect(item)} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-800/50 transition-colors duration-200">
                                        <img src={`data:${item.imageMimeType};base64,${item.imageBase64}`} alt={item.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-700" />
                                        <span className="font-semibold text-gray-200">{item.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            <p>{history.length === 0 ? "Your analysis history is empty." : "No results found for your search."}</p>
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};
