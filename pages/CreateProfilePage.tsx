import React, { useState } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { ArrowLeft, Save } from 'lucide-react';

interface CreateProfilePageProps {
    trainer: Trainer;
    onSave: (updatedTrainer: Trainer) => void;
    onCancel: () => void;
}

const CreateProfilePage: React.FC<CreateProfilePageProps> = ({ trainer, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Trainer>(trainer);

    const handleSpecialtyToggle = (specialty: string) => {
        setFormData(prev => {
            const currentSpecialties = prev.specialty || [];
            const isSelected = currentSpecialties.includes(specialty);
            
            if (isSelected) {
                // Deselect
                return { ...prev, specialty: currentSpecialties.filter(s => s !== specialty) };
            } else if (currentSpecialties.length < 3) {
                // Select if under limit
                return { ...prev, specialty: [...currentSpecialties, specialty] };
            }
            // Do nothing if at limit and trying to select a new one
            return prev;
        });
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? parseInt(value) || 0 : value
        }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <div className="bg-slate-100 h-full overflow-y-auto relative">
            <button onClick={onCancel} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <button 
                onClick={handleSave}
                className="absolute top-4 right-4 z-10 flex items-center bg-[#FF6B35] text-white font-bold py-2 px-4 rounded-full hover:bg-orange-600 transition-colors duration-200 text-sm"
            >
                <Save className="w-4 h-4 mr-1.5" />
                Save
            </button>
            
            <div className="p-4">
                <form className="space-y-6 pb-20 pt-16" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">Edit Profile</h1>
                    {/* Basic Info */}
                    <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60">
                         <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Basic Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                                <input 
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                     {/* Specialty */}
                    <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-slate-800">Specialties</h3>
                             <p className="text-sm text-slate-500">Choose up to 3</p>
                        </div>
                         <div className="flex flex-wrap gap-2">
                            {FITNESS_ACTIVITIES.map(activity => {
                                const isSelected = formData.specialty.includes(activity);
                                return (
                                    <button
                                        type="button"
                                        key={activity}
                                        onClick={() => handleSpecialtyToggle(activity)}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border
                                            ${isSelected 
                                                ? 'bg-blue-500 border-blue-500 text-white' 
                                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                                            }
                                            ${!isSelected && formData.specialty.length >=3 && 'opacity-50 cursor-not-allowed'}
                                        `}
                                    >
                                        {activity}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60">
                        <h3 className="font-bold text-slate-800 mb-2">About Me</h3>
                         <div>
                            <label htmlFor="bio" className="sr-only">Bio</label>
                            <textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                rows={5}
                                placeholder="Tell clients a bit about your experience, qualifications, and teaching style."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    {/* Location and Price */}
                     <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Class Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                                <select
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {HCMC_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="price" className="block text-sm font-medium text-slate-600 mb-1">Starting Price (per class)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        id="price"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-500">VND</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateProfilePage;
