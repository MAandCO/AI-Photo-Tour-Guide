import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CloseIcon, CameraIcon } from './icons';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    const cleanupCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);
    
    useEffect(() => {
        const openCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                if (err instanceof Error) {
                    if(err.name === "NotAllowedError") {
                        setError("Camera access was denied. Please allow camera permissions in your browser settings.");
                    } else if (err.name === "NotFoundError") {
                        setError("No camera found. Please ensure a camera is connected and enabled.");
                    } else {
                        setError("Could not access the camera. Please check your browser permissions.");
                    }
                } else {
                    setError("An unknown error occurred while trying to access the camera.");
                }
            }
        };

        openCamera();

        return () => {
            cleanupCamera();
        };
    }, [cleanupCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                        cleanupCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };
    
    const handleClose = () => {
        cleanupCamera();
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-gray-900/90 z-50 flex flex-col items-center justify-center" role="dialog" aria-modal="true">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                aria-label="Live camera feed"
            />
            <canvas ref={canvasRef} className="hidden" />

            {error && (
                <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-red-400 font-semibold mb-4">{error}</p>
                    <button
                        onClick={handleClose}
                        className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                       Close
                    </button>
                </div>
            )}

            {!error && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center">
                    <button
                        onClick={handleCapture}
                        className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 ring-4 ring-white/30 focus:outline-none focus:ring-cyan-500/50 flex items-center justify-center transition-transform transform hover:scale-105"
                        aria-label="Capture photo"
                    >
                        <CameraIcon className="w-10 h-10 text-gray-800"/>
                    </button>
                </div>
            )}

            <button
                onClick={handleClose}
                className="absolute top-4 right-4 bg-gray-900/70 p-2 rounded-full text-white hover:bg-red-600/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500"
                aria-label="Close camera"
            >
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
    );
};
