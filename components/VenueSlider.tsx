import React, { useState, useRef, useEffect } from 'react';
import { Venue } from '../types';
import VenueCard from './VenueCard';

interface VenueSliderProps {
    venues: Venue[];
    onSelectVenue: (venue: Venue) => void;
    onViewAll: () => void;
}

const VenueSlider: React.FC<VenueSliderProps> = ({ venues, onSelectVenue, onViewAll }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const minSwipeDistance = 50;

    const goToSlide = (index: number) => {
        if (index < 0) {
            setCurrentIndex(venues.length - 1);
        } else if (index >= venues.length) {
            setCurrentIndex(0);
        } else {
            setCurrentIndex(index);
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(0);
        setTouchStart(e.targetTouches[0].clientX);
        setIsDragging(true);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToSlide(currentIndex + 1);
        } else if (isRightSwipe) {
            goToSlide(currentIndex - 1);
        }
        
        setIsDragging(false);
    };


    return (
        <div className="relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-3 px-4">
                <h2 className="text-base font-bold text-gray-900">Sports Venues</h2>
                <button
                    onClick={onViewAll}
                    className="text-xs font-semibold text-[#FF6B35] hover:text-orange-600 transition-colors"
                >
                    View All
                </button>
            </div>

            {/* Slider */}
            <div 
                ref={sliderRef}
                className="relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {venues.map((venue) => (
                        <div key={venue.id} className="flex-shrink-0 w-full px-4">
                            <VenueCard venue={venue} onSelect={() => onSelectVenue(venue)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Dots Indicator */}
            {venues.length > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    {venues.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${
                                index === currentIndex
                                    ? 'w-8 h-2 bg-[#FF6B35]'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VenueSlider;
