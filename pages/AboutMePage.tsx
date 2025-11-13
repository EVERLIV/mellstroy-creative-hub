import React from 'react';
import { Trainer } from '../types';
import { ArrowLeft, MapPin, Scale, Ruler, Cake, TrendingUp, HeartPulse, Pencil } from 'lucide-react';

interface AboutMePageProps {
    user: Trainer;
    onBack: () => void;
    onEdit: () => void;
}

const StatCard: React.FC<{ icon: React.FC<any>, label: string, value: string | number | undefined, unit?: string }> = ({ icon: Icon, label, value, unit }) => (
    <div className="flex flex-col items-center justify-center bg-slate-50 p-3 rounded-lg text-center">
        <Icon className="w-6 h-6 text-slate-500 mb-2" />
        <p className="text-sm font-bold text-slate-800">
            {value ? `${value}${unit || ''}` : 'N/A'}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
    </div>
);

const AboutMePage: React.FC<AboutMePageProps> = ({ user, onBack, onEdit }) => {
    return (
        <div className="bg-slate-50 h-full overflow-y-auto animate-fade-in relative">
             <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white hover:bg-gray-100 shadow-md transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <button onClick={onEdit} className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white shadow-md px-3 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-gray-100 transition-colors">
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
            </button>
            
            <div className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 space-y-4">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-4 pt-12">About Me</h1>
                {/* Profile Card */}
                <div className="bg-white p-6 rounded-2xl shadow-md shadow-slate-200/60 flex flex-col items-center text-center">
                    <img 
                        src={user.imageUrl} 
                        alt={user.name} 
                        className="w-28 h-28 rounded-full object-cover border-4 border-slate-50 shadow-lg"
                    />
                    <h2 className="text-2xl font-bold text-slate-800 mt-4">{user.name}</h2>
                    <div className="mt-2 flex items-center text-slate-500">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        <span>{user.location}</span>
                    </div>
                </div>

                {/* Bio Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="font-bold text-slate-800 mb-2">My Bio</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        {user.bio || "A fitness enthusiast looking to connect with great trainers!"}
                    </p>
                </div>

                {/* Fitness Stats */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="font-bold text-slate-800 mb-3">Fitness Stats</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard icon={Cake} label="Age" value={user.age} />
                        <StatCard icon={Ruler} label="Height" value={user.height} unit=" cm" />
                        <StatCard icon={Scale} label="Weight" value={user.weight} unit=" kg" />
                    </div>
                </div>

                {/* Goals & Interests */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-500" /> My Fitness Goals</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.goals && user.goals.length > 0 ? user.goals.map(goal => (
                                <span key={goal} className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">{goal}</span>
                            )) : <p className="text-sm text-slate-500">No goals set yet.</p>}
                        </div>
                    </div>
                     <div className="border-t pt-4">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center"><HeartPulse className="w-5 h-5 mr-2 text-rose-500" /> My Sport Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {user.interests && user.interests.length > 0 ? user.interests.map(interest => (
                                <span key={interest} className="text-sm font-semibold bg-rose-100 text-rose-800 px-3 py-1 rounded-full">{interest}</span>
                            )) : <p className="text-sm text-slate-500">No interests set yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutMePage;