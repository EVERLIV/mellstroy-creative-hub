import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS } from '../constants';
import { ArrowLeft, Camera, Loader } from 'lucide-react';
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
            const maxSelections = 5;

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

        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file",
                description: "Please upload an image file.",
            });
            return;
        }

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
        <div className="bg-white h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm z-20">
                <button 
                    type="button"
                    onClick={onCancel} 
                    className="p-2 -ml-2"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-800" />
                </button>
                <h1 className="text-base font-bold text-gray-900">Edit Profile</h1>
                <button 
                    type="submit"
                    form="edit-form"
                    className="text-sm font-semibold text-blue-600 px-2 py-1 hover:text-blue-700"
                >
                    Save
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-3 bg-gray-50">
                    <form id="edit-form" onSubmit={handleSave} className="space-y-3">
                        {/* Avatar Upload Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex flex-col items-center gap-2">
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
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()} 
                                        disabled={isUploading}
                                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {isUploading ? <Loader className="w-3.5 h-3.5 animate-spin"/> : <Camera className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600">Tap to change photo</p>
                            </div>
                        </div>

                        {/* Basic Information Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Basic Information</h3>
                            <div className="space-y-2.5">
                                <div>
                                    <label htmlFor="name" className="block text-xs text-gray-500 mb-1">
                                        Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="bio" className="block text-xs text-gray-500 mb-1">
                                        About Me
                                    </label>
                                    <textarea 
                                        id="bio" 
                                        name="bio" 
                                        value={formData.bio} 
                                        onChange={handleChange} 
                                        rows={3}
                                        placeholder="Tell others about yourself..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="location" className="block text-xs text-gray-500 mb-1">
                                        Location
                                    </label>
                                    <select 
                                        id="location" 
                                        name="location" 
                                        value={formData.location} 
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select district</option>
                                        {HCMC_DISTRICTS.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Fitness Stats Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Fitness Stats</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label htmlFor="age" className="block text-xs text-gray-500 mb-1 text-center">
                                        Age
                                    </label>
                                    <input 
                                        type="number" 
                                        id="age" 
                                        name="age" 
                                        value={formData.age || ''} 
                                        onChange={handleChange}
                                        placeholder="--"
                                        className="w-full text-center px-2 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="height" className="block text-xs text-gray-500 mb-1 text-center">
                                        Height
                                    </label>
                                    <input 
                                        type="number" 
                                        id="height" 
                                        name="height" 
                                        value={formData.height || ''} 
                                        onChange={handleChange}
                                        placeholder="cm"
                                        className="w-full text-center px-2 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="weight" className="block text-xs text-gray-500 mb-1 text-center">
                                        Weight
                                    </label>
                                    <input 
                                        type="number" 
                                        id="weight" 
                                        name="weight" 
                                        value={formData.weight || ''} 
                                        onChange={handleChange}
                                        placeholder="kg"
                                        className="w-full text-center px-2 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Goals Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Fitness Goals</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Max 5
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {FITNESS_GOALS.map(goal => {
                                    const isSelected = formData.goals?.includes(goal);
                                    return (
                                        <button 
                                            type="button" 
                                            key={goal} 
                                            onClick={() => handleToggle('goals', goal)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {goal}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Interests Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900">Sport Interests</h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Max 5
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {FITNESS_ACTIVITIES.map(interest => {
                                    const isSelected = formData.interests?.includes(interest);
                                    return (
                                        <button 
                                            type="button" 
                                            key={interest} 
                                            onClick={() => handleToggle('interests', interest)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            </div>

            {/* Fixed Bottom Button */}
            <div className="px-4 py-3 bg-white shadow-lg">
                <button
                    type="submit"
                    form="edit-form"
                    className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default EditAboutMePage;
