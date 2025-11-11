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
        <div className="bg-background min-h-screen overflow-y-auto">
            {/* Fixed Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="flex items-center justify-between p-4">
                    <button 
                        type="button"
                        onClick={onCancel} 
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                        <span className="font-medium">Cancel</span>
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Edit Profile</h1>
                    <button 
                        type="button"
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
            
            <form className="p-4 space-y-6 pb-32" onSubmit={handleSave}>
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3 py-4">
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
                            className="w-32 h-32 rounded-full object-cover border-4 border-border shadow-lg"
                        />
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {isUploading ? <Loader className="w-5 h-5 animate-spin"/> : <Camera className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground">Tap to change photo</p>
                </div>

                {/* Basic Info */}
                <div className="bg-card p-5 rounded-xl border border-border space-y-4">
                    <h3 className="font-bold text-foreground text-lg">Basic Information</h3>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                            Full Name
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            placeholder="Enter your name"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                            About Me
                        </label>
                        <textarea 
                            id="bio" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            rows={4}
                            placeholder="Tell others about yourself, your fitness journey, and goals..."
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                            Location
                        </label>
                        <select 
                            id="location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select district</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Fitness Stats */}
                <div className="bg-card p-5 rounded-xl border border-border">
                    <h3 className="font-bold text-foreground text-lg mb-4">Fitness Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2 text-center">
                                Age
                            </label>
                            <input 
                                type="number" 
                                id="age" 
                                name="age" 
                                value={formData.age || ''} 
                                onChange={handleChange}
                                placeholder="--"
                                className="w-full text-center px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="height" className="block text-sm font-medium text-foreground mb-2 text-center">
                                Height
                            </label>
                            <input 
                                type="number" 
                                id="height" 
                                name="height" 
                                value={formData.height || ''} 
                                onChange={handleChange}
                                placeholder="cm"
                                className="w-full text-center px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium text-foreground mb-2 text-center">
                                Weight
                            </label>
                            <input 
                                type="number" 
                                id="weight" 
                                name="weight" 
                                value={formData.weight || ''} 
                                onChange={handleChange}
                                placeholder="kg"
                                className="w-full text-center px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-foreground text-lg">Fitness Goals</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
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
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all border-2 ${
                                        isSelected 
                                            ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105' 
                                            : 'bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted'
                                    }`}
                                >
                                    {goal}
                                </button>
                            );
                        })}
                    </div>
                </div>
                
                {/* Interests */}
                <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-foreground text-lg">Sport Interests</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
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
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all border-2 ${
                                        isSelected 
                                            ? 'bg-secondary border-secondary text-secondary-foreground shadow-md scale-105' 
                                            : 'bg-background border-border text-foreground hover:border-secondary/50 hover:bg-muted'
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