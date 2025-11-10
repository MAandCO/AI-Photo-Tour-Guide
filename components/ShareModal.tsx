
import React, { useState, useEffect } from 'react';
import { LandmarkAnalysis } from '../types';
import { CloseIcon, CopyIcon, CheckIcon } from './icons';

interface ShareModalProps {
    analysis: LandmarkAnalysis;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ analysis, onClose }) => {
    const [shareUrl, setShareUrl] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        // In a real app, you might generate a unique URL that points to a page
        // displaying this result. For this example, we'll just use the current URL.
        setShareUrl(window.location.href);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };
    
    // Summary for sharing
    const shareText = `Check out this landmark: ${analysis.name}. Here's a brief history: ${analysis.history.substring(0, 150)}...`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-modal-title" onClick={onClose}>
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 id="share-modal-title" className="text-lg font-bold text-white">Share this Landmark</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Close share modal"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-300 mb-4">Share a link to this discovery with your friends!</p>
                    
                    <div className="flex items-center space-x-2">
                        <label htmlFor="share-link" className="sr-only">Shareable Link</label>
                        <input
                            id="share-link"
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        <button
                            onClick={handleCopy}
                            className="flex-shrink-0 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold p-2.5 rounded-lg transition-colors duration-200"
                            aria-live="polite"
                        >
                            {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                            <span className="sr-only">{isCopied ? 'Copied!' : 'Copy link'}</span>
                        </button>
                    </div>

                    <div className="mt-6 flex justify-center space-x-4">
                        {/* Example social share links */}
                         <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-blue-500 hover:text-white transition-colors">
                             <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </a>
                         <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-blue-700 hover:text-white transition-colors">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"></path></svg>
                        </a>
                         <a href={`mailto:?subject=Check out this landmark: ${analysis.name}&body=${encodeURIComponent(shareText)}%0A%0A${encodeURIComponent(shareUrl)}`} className="p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-colors">
                             <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5l-8-5h16zm0 12H4V8l8 5l8-5v10z"></path></svg>
                        </a>
                    </div>
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
