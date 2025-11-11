import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS } from '../constants';
import { Save, Camera, Loader } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';

interface EditAboutMePageProps {
    user: Trainer;
    onSave: (updatedUser: Trainer) => void;
    onCancel: () => void;
}

const EditAboutMePage: React.FC<EditAboutMePageProps> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Trainer>(user);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Image upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };


    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="bg-background h-full overflow-y-auto animate-fade-in relative">
            <button onClick={onCancel} className="absolute top-4 left-4 z-10 font-semibold text-foreground/60 hover:text-foreground text-sm px-3 py-2 rounded-full bg-muted/70 backdrop-blur-sm hover:bg-muted transition-colors">Cancel</button>
            <button 
                onClick={handleSave}
                className="absolute top-4 right-4 z-10 flex items-center bg-primary text-primary-foreground font-bold py-2 px-4 rounded-full hover:bg-primary/90 transition-colors duration-200 text-sm"
            >
                <Save className="w-4 h-4 mr-1.5" />
                Save
            </button>
            
            <form className="p-4 space-y-4 pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]" onSubmit={handleSave}>
                <h1 className="text-2xl font-bold text-foreground text-center mb-2">Edit Profile</h1>
                
                <div className="flex justify-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="relative w-28 h-28 rounded-full group">
                        <img 
                            src={formData.imageUrl} 
                            alt={formData.name} 
                            className="w-full h-full rounded-full object-cover border-4 border-border shadow-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {isUploading ? <Loader className="w-8 h-8 animate-spin"/> : <Camera className="w-8 h-8" />}
                        </div>
                    </button>
                </div>


                {/* Basic Info */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                     <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Public Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-1">My Bio</label>
                            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tell others a bit about yourself..." className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">Location</label>
                            <select id="location" name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                                {HCMC_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Fitness Stats */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                     <h3 className="font-bold text-foreground mb-4">Fitness Stats</h3>
                    <div className="grid grid-cols-3 gap-3">
                         <div>
                            <label htmlFor="age" className="block text-sm font-medium text-muted-foreground mb-1 text-center">Age</label>
                            <input type="number" id="age" name="age" value={formData.age || ''} onChange={handleChange} className="w-full text-center px-2 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label htmlFor="height" className="block text-sm font-medium text-muted-foreground mb-1 text-center">Height (cm)</label>
                            <input type="number" id="height" name="height" value={formData.height || ''} onChange={handleChange} className="w-full text-center px-2 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                         <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-muted-foreground mb-1 text-center">Weight (kg)</label>
                            <input type="number" id="weight" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full text-center px-2 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-foreground">My Fitness Goals</h3>
                         <p className="text-sm text-muted-foreground">Choose up to 5</p>
                    </div>
                     <div className="flex flex-wrap gap-2">
                        {FITNESS_GOALS.map(goal => {
                            const isSelected = formData.goals?.includes(goal);
                            return (
                                <button type="button" key={goal} onClick={() => handleToggle('goals', goal)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:bg-muted'}`}>
                                    {goal}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Interests */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-foreground">My Sport Interests</h3>
                         <p className="text-sm text-muted-foreground">Choose up to 5</p>
                    </div>
                     <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(interest => {
                            const isSelected = formData.interests?.includes(interest);
                            return (
                                <button type="button" key={interest} onClick={() => handleToggle('interests', interest)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${isSelected ? 'bg-secondary border-secondary text-secondary-foreground' : 'bg-background border-border text-foreground hover:bg-muted'}`}>
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