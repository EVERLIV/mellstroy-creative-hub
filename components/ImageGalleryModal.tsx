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
            className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/90"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label="Close gallery"
                >
                    <X className="h-6 w-6 md:h-7 md:w-7" />
                </button>

                {/* Left Arrow */}
                <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-4"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-4"
                    aria-label="Next image"
                >
                    <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </button>

                {/* Image Container */}
                <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col items-center justify-center p-4 md:p-12">
                    <img
                        src={images[currentIndex]}
                        alt={`Gallery image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    <div className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGalleryModal;