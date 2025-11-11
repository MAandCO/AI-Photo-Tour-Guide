import React, { useState, useEffect } from 'react';
import { generateVideoSocialPost } from '../services/geminiService';
import { CloseIcon, ShareIcon, DownloadIcon, CopyIcon, CheckIcon } from './icons';

interface VideoShareModalProps {
    landmarkName: string;
    videoBlob: Blob;
    videoUrl: string;
    onClose: () => void;
}

export const VideoShareModal: React.FC<VideoShareModalProps> = ({ landmarkName, videoBlob, videoUrl, onClose }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [canShareFiles, setCanShareFiles] = useState(false);

    useEffect(() => {
        const videoFile = new File([videoBlob], `${landmarkName}.mp4`, { type: 'video/mp4' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
            setCanShareFiles(true);
        }
    }, [videoBlob, landmarkName]);

    useEffect(() => {
        const fetchSocialPost = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const post = await generateVideoSocialPost(landmarkName);
                setTitle(post.title);
                setDescription(post.description);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not generate post text.');
                setTitle(`A video tour of ${landmarkName}`);
                setDescription(`#${landmarkName.replace(/\s+/g, '')} #Travel #Landmark`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSocialPost();
    }, [landmarkName]);

    const handleShare = async () => {
        if (!canShareFiles) return;

        const videoFile = new File([videoBlob], `${landmarkName.replace(/\s+/g, '_')}_tour.mp4`, {
            type: videoBlob.type || 'video/mp4',
        });

        try {
            await navigator.share({
                title: title,
                text: description,
                files: [videoFile],
            });
            onClose();
        } catch (err) {
            console.error('Error sharing video:', err);
            // User might have cancelled the share, so we don't need to show an error.
        }
    };
    
    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `${landmarkName.replace(/\s+/g, '_')}_tour.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyDetails = () => {
        const textToCopy = `Title: ${title}\n\nDescription: ${description}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-video-modal-title" onClick={onClose}>
            <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 id="share-video-modal-title" className="text-lg font-bold text-white">Share Your Video Tour</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close share modal">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <video src={videoUrl} controls muted className="w-full rounded-lg mb-4 bg-black" />

                    {isLoading && (
                        <div className="text-center p-4">
                            <p className="text-gray-400">Generating a catchy title and description...</p>
                        </div>
                    )}
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    
                    {!isLoading && (
                         <div className="space-y-4">
                            <div>
                                <label htmlFor="video-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                                <input
                                    id="video-title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    readOnly={!canShareFiles}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 read-only:opacity-70"
                                />
                            </div>
                             <div>
                                <label htmlFor="video-description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea
                                    id="video-description"
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    readOnly={!canShareFiles}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 read-only:opacity-70 custom-scrollbar"
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6">
                        {canShareFiles ? (
                            <button
                                onClick={handleShare}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
                            >
                                <ShareIcon className="w-6 h-6"/>
                                Share Now
                            </button>
                        ) : (
                            <div className="text-center p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                                <p className="text-sm text-gray-400 mb-4">Your browser doesn't support direct video sharing. Please download the video and upload it to your favorite social media platform.</p>
                                <div className="flex items-center gap-4">
                                     <button
                                        onClick={handleDownload}
                                        className="w-full flex items-center justify-center gap-2 bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-cyan-600 transition-colors"
                                    >
                                        <DownloadIcon className="w-5 h-5"/>
                                        Download Video
                                    </button>
                                     <button
                                        onClick={handleCopyDetails}
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                                    >
                                        {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                        {isCopied ? 'Copied!' : 'Copy Details'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1a202c; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4a5568; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #718096; }
            `}</style>
        </div>
    );
};