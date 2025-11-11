import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryModalProps {
    images: string[];
    startIndex: number;
    onClose: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const goToPrevious = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === images.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious();
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);


    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
                    aria-label="Close gallery"
                >
                    <X className="w-7 h-7" />
                </button>
                
                {/* Left Arrow */}
                <button 
                    onClick={goToPrevious}
                    className="absolute top-1/2 left-4 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
                
                {/* Right Arrow */}
                <button 
                    onClick={goToNext}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Image Container */}
                <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center p-4">
                    <img 
                        src={images[currentIndex]} 
                        alt={`Gallery image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    <div className="absolute bottom-4 text-white bg-black/50 px-3 py-1 rounded-full text-sm font-semibold">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;