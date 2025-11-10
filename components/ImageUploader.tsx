import React, { useRef, useState, useCallback } from 'react';
import { UploadIcon, CameraIcon } from './icons';
import { CameraCapture } from './CameraCapture';

interface ImageUploaderProps {
    onImageChange: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onImageChange(event.target.files[0]);
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            onImageChange(event.dataTransfer.files[0]);
        }
    }, [onImageChange]);

    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleCapture = (file: File) => {
        onImageChange(file);
        setIsCameraOpen(false);
    };

    return (
        <div className="w-full flex flex-col items-center">
            <div className={`w-full p-4 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600'}`}>
                <label
                    htmlFor="image-upload"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    className="w-full h-48 flex flex-col justify-center items-center cursor-pointer rounded-lg hover:bg-gray-700/30"
                >
                    <input
                        id="image-upload"
                        type="file"
                        ref={inputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    <div className="text-center">
                        <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                        <p className="font-semibold text-lg text-gray-300">
                            <span className="text-cyan-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG, or WEBP</p>
                    </div>
                </label>
                
                <div className="flex items-center my-4">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-400"
                >
                    <CameraIcon className="w-6 h-6"/>
                    Take a Photo
                </button>
            </div>
            {isCameraOpen && (
                <CameraCapture
                    onCapture={handleCapture}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}
        </div>
    );
};