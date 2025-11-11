import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS } from '../constants';
import { Save, Camera, Loader, X } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

interface EditAboutMePageProps {
    user: Trainer;
    onSave: (updatedUser: Trainer) => void;
    onCancel: () => void;
}

const EditAboutMePage: React.FC<EditAboutMePageProps> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Trainer>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['age', 'height', 'weight'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? undefined : parseInt(value)) : value
        }));
    };

    const handleToggle = (field: 'goals' | 'interests', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] || [];
            const isSelected = currentValues.includes(value);
            const maxSelections = field === 'goals' ? 5 : 5;

            if (isSelected) {
                return { ...prev, [field]: currentValues.filter(v => v !== value) };
            } else if (currentValues.length < maxSelections) {
                return { ...prev, [field]: [...currentValues, value] };
            }
            return prev;
        });
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file",
                description: "Please upload an image file.",
            });
            return;
        }

        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            toast({
                variant: "destructive",
                title: "File too large",
                description: "Image must be less than 3MB.",
            });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
            
            toast({
                title: "Success",
                description: "Profile picture updated!",
            });
        } catch (error) {
            console.error("Failed to upload image:", error);
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: "Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };


    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-slate-50 min-h-screen overflow-y-auto scroll-smooth">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
                <div className="flex items-center justify-between p-4">
                    <button 
                        type="button"
                        onClick={onCancel} 
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                        <span className="font-medium">Cancel</span>
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">Edit Profile</h1>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-full hover:bg-orange-600 transition-all duration-200 font-semibold shadow-md"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
            
            <form className="p-4 space-y-4 pb-32" onSubmit={handleSave}>
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3 py-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                    <div className="relative">
                        <img 
                            src={formData.imageUrl} 
                            alt={formData.name} 
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-50"
                        >
                            {isUploading ? <Loader className="w-5 h-5 animate-spin"/> : <Camera className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-sm text-slate-600">Tap to change photo</p>
                </div>

                {/* Basic Info */}
                <div id="basic-info" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 space-y-4 scroll-mt-20">
                    <h3 className="font-bold text-slate-900 text-base">Basic Information</h3>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Full Name
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            placeholder="Enter your name"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1.5">
                            About Me
                        </label>
                        <textarea 
                            id="bio" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            rows={4}
                            placeholder="Tell others about yourself, your fitness journey, and goals..."
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Location
                        </label>
                        <select 
                            id="location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select district</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Fitness Stats */}
                <div id="fitness-stats" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 scroll-mt-20">
                    <h3 className="font-bold text-slate-900 text-base mb-3">Fitness Stats</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                                Age
                            </label>
                            <input 
                                type="number" 
                                id="age" 
                                name="age" 
                                value={formData.age || ''} 
                                onChange={handleChange}
                                placeholder="--"
                                className="w-full text-center px-2 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="height" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                                Height
                            </label>
                            <input 
                                type="number" 
                                id="height" 
                                name="height" 
                                value={formData.height || ''} 
                                onChange={handleChange}
                                placeholder="cm"
                                className="w-full text-center px-2 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
                                Weight
                            </label>
                            <input 
                                type="number" 
                                id="weight" 
                                name="weight" 
                                value={formData.weight || ''} 
                                onChange={handleChange}
                                placeholder="kg"
                                className="w-full text-center px-2 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div id="goals" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 scroll-mt-20">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-900 text-base">Fitness Goals</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Max 5
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FITNESS_GOALS.map(goal => {
                            const isSelected = formData.goals?.includes(goal);
                            return (
                                <button 
                                    type="button" 
                                    key={goal} 
                                    onClick={() => handleToggle('goals', goal)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out ${
                                        isSelected 
                                            ? 'bg-[#FF6B35] text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {goal}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Interests */}
                <div id="interests" className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 scroll-mt-20">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-900 text-base">Sport Interests</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                            Max 5
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(interest => {
                            const isSelected = formData.interests?.includes(interest);
                            return (
                                <button 
                                    type="button" 
                                    key={interest} 
                                    onClick={() => handleToggle('interests', interest)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out ${
                                        isSelected 
                                            ? 'bg-[#FF6B35] text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    {interest}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditAboutMePage;