import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { Save, Camera, Loader, X } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

interface EditTrainerProfilePageProps {
    user: Trainer;
    onSave: (updatedUser: Trainer) => void;
    onCancel: () => void;
}

const EditTrainerProfilePage: React.FC<EditTrainerProfilePageProps> = ({ user, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Trainer>(user);
    const [isUploading, setIsUploading] = useState(false);
    const [phoneError, setPhoneError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const validatePhoneNumber = (phone: string): boolean => {
        if (!phone || phone.trim() === '') {
            setPhoneError('');
            return true; // Optional field
        }

        // Remove all spaces, dashes, and parentheses for validation
        const cleanPhone = phone.replace(/[\s\-()]/g, '');
        
        // Vietnam phone format: +84 followed by 9-10 digits
        const vietnamPhoneRegex = /^\+84[0-9]{9,10}$/;
        
        if (!vietnamPhoneRegex.test(cleanPhone)) {
            setPhoneError('Invalid format. Use: +84 xxx xxx xxx (9-10 digits after +84)');
            return false;
        }
        
        setPhoneError('');
        return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['price'].includes(name);
        
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? 0 : parseFloat(value)) : value
        }));

        // Validate phone number on change
        if (name === 'phone') {
            validatePhoneNumber(value);
        }
    };

    const handleToggleSpecialty = (specialty: string) => {
        setFormData(prev => {
            const currentSpecialties = prev.specialty || [];
            const isSelected = currentSpecialties.includes(specialty);
            const maxSelections = 5;

            if (isSelected) {
                return { ...prev, specialty: currentSpecialties.filter(s => s !== specialty) };
            } else if (currentSpecialties.length < maxSelections) {
                return { ...prev, specialty: [...currentSpecialties, specialty] };
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
                title: "Invalid file type",
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
                title: "Image uploaded",
                description: "Profile picture updated successfully.",
            });
        } catch (error) {
            console.error("Failed to upload image:", error);
            toast({
                variant: "destructive",
                title: "Upload failed",
                description: "Failed to upload image. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name?.trim()) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Full name is required.",
            });
            return;
        }

        if (!formData.location) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Location is required.",
            });
            return;
        }

        if (!formData.specialty || formData.specialty.length === 0) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please select at least one specialty.",
            });
            return;
        }

        if (!formData.price || formData.price <= 0) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please enter a valid hourly rate.",
            });
            return;
        }

        // Validate phone number if provided
        if (formData.phone && !validatePhoneNumber(formData.phone)) {
            toast({
                variant: "destructive",
                title: "Validation error",
                description: "Please enter a valid Vietnam phone number.",
            });
            return;
        }

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
                    <h1 className="text-lg font-bold text-foreground">Edit Trainer Profile</h1>
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
                            Full Name <span className="text-destructive">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                            placeholder="Enter your full name"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                            Professional Bio
                        </label>
                        <textarea 
                            id="bio" 
                            name="bio" 
                            value={formData.bio} 
                            onChange={handleChange} 
                            rows={4}
                            placeholder="Share your experience, certifications, and training philosophy..."
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
                            Location <span className="text-destructive">*</span>
                        </label>
                        <select 
                            id="location" 
                            name="location" 
                            value={formData.location} 
                            onChange={handleChange} 
                            required
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Select district</option>
                            {HCMC_DISTRICTS.map(district => (
                                <option key={district} value={district}>{district}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                            Phone Number
                        </label>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleChange} 
                            placeholder="+84 xxx xxx xxx"
                            className={`w-full px-4 py-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 transition-all ${
                                phoneError 
                                    ? 'border-destructive focus:ring-destructive' 
                                    : 'border-border focus:ring-primary'
                            }`}
                        />
                        {phoneError && (
                            <p className="text-xs text-destructive mt-2 flex items-start gap-1">
                                <span className="mt-0.5">⚠️</span>
                                <span>{phoneError}</span>
                            </p>
                        )}
                        {!phoneError && (
                            <p className="text-xs text-muted-foreground mt-2">Format: +84 followed by 9-10 digits</p>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-card p-5 rounded-xl border border-border">
                    <h3 className="font-bold text-foreground text-lg mb-4">Pricing</h3>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                            Hourly Rate (VND) <span className="text-destructive">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="price" 
                            name="price" 
                            value={formData.price || ''} 
                            onChange={handleChange} 
                            min="0"
                            step="10000"
                            required
                            placeholder="300000"
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        />
                        <p className="text-xs text-muted-foreground mt-2">Your standard rate per hour of training</p>
                    </div>
                </div>
                
                {/* Specialties */}
                <div className="bg-card p-5 rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-foreground text-lg">
                            Training Specialties <span className="text-destructive">*</span>
                        </h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            Max 5
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(specialty => {
                            const isSelected = formData.specialty?.includes(specialty);
                            return (
                                <button 
                                    type="button" 
                                    key={specialty} 
                                    onClick={() => handleToggleSpecialty(specialty)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full transition-all border-2 ${
                                        isSelected 
                                            ? 'bg-primary border-primary text-primary-foreground shadow-md scale-105' 
                                            : 'bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted'
                                    }`}
                                >
                                    {specialty}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default EditTrainerProfilePage;
