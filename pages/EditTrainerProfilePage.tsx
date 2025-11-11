import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { Save, Camera, Loader } from 'lucide-react';
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
        <div className="bg-background h-full overflow-y-auto animate-fade-in relative">
            <button 
                onClick={onCancel} 
                className="absolute top-4 left-4 z-10 font-semibold text-foreground/60 hover:text-foreground text-sm px-3 py-2 rounded-full bg-muted/70 backdrop-blur-sm hover:bg-muted transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="absolute top-4 right-4 z-10 flex items-center bg-primary text-primary-foreground font-bold py-2 px-4 rounded-full hover:bg-primary/90 transition-colors duration-200 text-sm"
            >
                <Save className="w-4 h-4 mr-1.5" />
                Save
            </button>
            
            <form className="p-4 space-y-4 pt-20 pb-[calc(5rem+env(safe-area-inset-bottom))]" onSubmit={handleSave}>
                <h1 className="text-2xl font-bold text-foreground text-center mb-2">Edit Trainer Profile</h1>
                
                {/* Avatar Upload */}
                <div className="flex justify-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading} 
                        className="relative w-28 h-28 rounded-full group"
                    >
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
                    <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Basic Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
                                Full Name *
                            </label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                            />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-muted-foreground mb-1">
                                Professional Bio
                            </label>
                            <textarea 
                                id="bio" 
                                name="bio" 
                                value={formData.bio} 
                                onChange={handleChange} 
                                rows={4} 
                                placeholder="Tell clients about your experience, certifications, and training philosophy..."
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                            />
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">
                                Location *
                            </label>
                            <select 
                                id="location" 
                                name="location" 
                                value={formData.location} 
                                onChange={handleChange} 
                                required
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select district</option>
                                {HCMC_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-1">
                                Phone Number
                            </label>
                            <input 
                                type="tel" 
                                id="phone" 
                                name="phone" 
                                value={formData.phone || ''} 
                                onChange={handleChange} 
                                placeholder="+84 xxx xxx xxx"
                                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 ${
                                    phoneError 
                                        ? 'border-destructive focus:ring-destructive' 
                                        : 'border-border focus:ring-primary'
                                }`}
                            />
                            {phoneError && (
                                <p className="text-xs text-destructive mt-1">{phoneError}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Format: +84 followed by 9-10 digits</p>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Pricing</h3>
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-muted-foreground mb-1">
                            Hourly Rate (VND) *
                        </label>
                        <input 
                            type="number" 
                            id="price" 
                            name="price" 
                            value={formData.price || ''} 
                            onChange={handleChange} 
                            min="0"
                            step="1000"
                            required
                            placeholder="300000"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" 
                        />
                        <p className="text-xs text-muted-foreground mt-1">Your standard rate per hour of training</p>
                    </div>
                </div>
                
                {/* Specialties */}
                <div className="bg-card p-4 rounded-2xl shadow-sm border border-border">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-foreground">Training Specialties *</h3>
                        <p className="text-sm text-muted-foreground">Choose up to 5</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {FITNESS_ACTIVITIES.map(specialty => {
                            const isSelected = formData.specialty?.includes(specialty);
                            return (
                                <button 
                                    type="button" 
                                    key={specialty} 
                                    onClick={() => handleToggleSpecialty(specialty)} 
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors border ${
                                        isSelected 
                                            ? 'bg-primary border-primary text-primary-foreground' 
                                            : 'bg-background border-border text-foreground hover:bg-muted'
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
