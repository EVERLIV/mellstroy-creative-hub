import React from 'react';
import { Trainer } from '../types';
import { ArrowLeft, MapPin, Scale, Ruler, Cake, TrendingUp, HeartPulse, Pencil } from 'lucide-react';

interface AboutMePageProps {
    user: Trainer;
    onBack: () => void;
    onEdit: () => void;
}

const StatCard: React.FC<{ icon: React.FC<any>, label: string, value: string | number | undefined, unit?: string }> = ({ icon: Icon, label, value, unit }) => (
    <div className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg text-center">
        <Icon className="w-6 h-6 text-[#FF6B35] mb-2" />
        <p className="text-sm font-bold text-gray-900">
            {value ? `${value}${unit || ''}` : 'N/A'}
        </p>
        <p className="text-xs text-gray-600">{label}</p>
    </div>
);

const AboutMePage: React.FC<AboutMePageProps> = ({ user, onBack, onEdit }) => {
    return (
        <div className="bg-white h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-20 flex-shrink-0">
                <button 
                    onClick={onBack} 
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Go back"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-base font-bold text-gray-900">About Me</h1>
                <button 
                    onClick={onEdit} 
                    className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    aria-label="Edit profile"
                >
                    <Pencil className="w-4 h-4 text-gray-800" />
                    <span className="text-xs font-semibold text-gray-900 hidden sm:inline">Edit</span>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50 pb-safe-nav">
                    {/* Profile Card */}
                    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <img 
                                src={user.imageUrl} 
                                alt={user.name} 
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100 mb-3"
                            />
                            <h2 className="text-lg font-bold text-gray-900 mb-1">{user.name}</h2>
                            {user.location && (
                                <div className="flex items-center text-gray-600 text-xs">
                                    <MapPin className="w-3.5 h-3.5 mr-1" />
                                    <span>{user.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-2">My Bio</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {user.bio || "A fitness enthusiast looking to connect with great trainers!"}
                        </p>
                    </div>

                    {/* Fitness Stats */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Fitness Stats</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard icon={Cake} label="Age" value={user.age} />
                            <StatCard icon={Ruler} label="Height" value={user.height} unit=" cm" />
                            <StatCard icon={Scale} label="Weight" value={user.weight} unit=" kg" />
                        </div>
                    </div>

                    {/* Goals & Interests */}
                    <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                        <div className="mb-3">
                            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1.5 text-[#FF6B35]" />
                                My Fitness Goals
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.goals && user.goals.length > 0 ? (
                                    user.goals.map(goal => (
                                        <span 
                                            key={goal} 
                                            className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full"
                                        >
                                            {goal}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500">No goals set yet.</p>
                                )}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-3">
                            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                                <HeartPulse className="w-4 h-4 mr-1.5 text-[#FF6B35]" />
                                My Sport Interests
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.interests && user.interests.length > 0 ? (
                                    user.interests.map(interest => (
                                        <span 
                                            key={interest} 
                                            className="text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full"
                                        >
                                            {interest}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500">No interests set yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutMePage;