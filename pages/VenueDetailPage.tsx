import React, { useState } from 'react';
import { Venue } from '../types';
import { ArrowLeft, MapPin, Star, Clock, Users, Phone, Mail, Globe, Check, ShoppingCart } from 'lucide-react';
import ImageGalleryModal from '../components/ImageGalleryModal';
import MembershipPurchaseModal from '../components/MembershipPurchaseModal';

interface VenueDetailPageProps {
    venue: Venue;
    onBack: () => void;
}

const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount).replace(/\s/g, '');
};

const categoryLabels: Record<Venue['category'], string> = {
    tennis: 'Tennis',
    pickleball: 'Pickleball',
    golf: 'Golf',
    boxing: 'Boxing',
    gym: 'Gym',
    billiards: 'Billiards',
    basketball: 'Basketball',
    swimming: 'Swimming',
    yoga: 'Yoga',
    other: 'Other'
};

const VenueDetailPage: React.FC<VenueDetailPageProps> = ({ venue, onBack }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedMembershipPlan, setSelectedMembershipPlan] = useState<{
        name: string;
        duration: string;
        price: number;
        features: string[];
    } | null>(null);

    const openGallery = (index: number) => {
        setSelectedImageIndex(index);
        setIsGalleryOpen(true);
    };

    return (
        <div className="bg-white h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20 flex-shrink-0">
                <button onClick={onBack} className="p-2 -ml-2">
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-base font-bold text-gray-900">Venue Details</h1>
                <div className="w-9"></div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50">
                    {/* Image Gallery */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="relative">
                            <img 
                                src={venue.imageUrl} 
                                alt={venue.name}
                                className="w-full h-64 object-cover rounded-lg cursor-pointer"
                                onClick={() => openGallery(0)}
                            />
                            {venue.imageUrls.length > 1 && (
                                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                    +{venue.imageUrls.length} photos
                                </div>
                            )}
                        </div>
                        {venue.imageUrls.length > 1 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto">
                                {venue.imageUrls.slice(0, 5).map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`${venue.name} ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg cursor-pointer flex-shrink-0"
                                        onClick={() => openGallery(index + 1)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                                {categoryLabels[venue.category]}
                            </span>
                            {venue.trainerAvailability && (
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Trainers Available
                                </span>
                            )}
                        </div>
                        <h2 className="text-base font-bold text-gray-900 mb-2">{venue.name}</h2>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            <span>{venue.address}, {venue.district}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-gray-900">{venue.rating.toFixed(1)}</span>
                            <span className="text-xs text-gray-500 ml-1">({venue.reviews} reviews)</span>
                        </div>
                        {venue.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone className="w-3.5 h-3.5 text-blue-600" />
                                <span>{venue.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">{venue.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Pricing</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Per Hour</span>
                                <span className="text-sm font-bold text-gray-900">{formatVND(venue.pricePerHour)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Per Month</span>
                                <span className="text-sm font-bold text-gray-900">{formatVND(venue.pricePerMonth)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Membership Plans */}
                    {venue.membershipPlans.length > 0 && (
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Membership Plans</h3>
                            <div className="space-y-2">
                                {venue.membershipPlans.map((plan, index) => {
                                    const discount = plan.price * 0.1;
                                    const finalPrice = plan.price - discount;
                                    return (
                                        <div key={index} className="border border-gray-200 rounded-lg p-2.5">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900">{plan.name}</div>
                                                    <div className="text-xs text-gray-500">{plan.duration}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400 line-through">{formatVND(plan.price)}</div>
                                                    <div className="text-sm font-bold text-blue-600">{formatVND(finalPrice)}</div>
                                                </div>
                                            </div>
                                            <div className="mb-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                    <span>RhinoFit</span>
                                                    <span className="font-bold">10% OFF</span>
                                                </span>
                                            </div>
                                            {plan.features.length > 0 && (
                                                <div className="mt-2 space-y-1 mb-2">
                                                    {plan.features.map((feature, fIndex) => (
                                                        <div key={fIndex} className="flex items-center gap-1.5 text-xs text-gray-600">
                                                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                            <span>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setSelectedMembershipPlan(plan)}
                                                className="w-full flex items-center justify-center gap-2 mt-2 bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm"
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                Buy with RhinoFit - Get 10% OFF
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Amenities */}
                    {venue.amenities.length > 0 && (
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Amenities</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {venue.amenities.map((amenity, index) => (
                                    <span
                                        key={index}
                                        className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                                    >
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment */}
                    {venue.equipment.length > 0 && (
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Equipment</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {venue.equipment.map((item, index) => (
                                    <span
                                        key={index}
                                        className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Operating Hours */}
                    {venue.operatingHours.length > 0 && (
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Operating Hours</h3>
                            <div className="space-y-1.5">
                                {venue.operatingHours.map((schedule, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-700 font-medium">{schedule.day}</span>
                                        <span className="text-gray-600">{schedule.open} - {schedule.close}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Capacity */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <div>
                                <div className="text-xs font-bold text-gray-900">Capacity</div>
                                <div className="text-xs text-gray-600">{venue.capacity} people</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isGalleryOpen && (
                <ImageGalleryModal
                    images={[venue.imageUrl, ...venue.imageUrls]}
                    startIndex={selectedImageIndex}
                    onClose={() => setIsGalleryOpen(false)}
                />
            )}

            {selectedMembershipPlan && (
                <MembershipPurchaseModal
                    isOpen={!!selectedMembershipPlan}
                    onClose={() => setSelectedMembershipPlan(null)}
                    venue={venue}
                    membershipPlan={selectedMembershipPlan}
                />
            )}
        </div>
    );
};

export default VenueDetailPage;

