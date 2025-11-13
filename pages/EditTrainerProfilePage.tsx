import React, { useState, useRef, useEffect } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { ArrowLeft, Camera, Loader, Save } from 'lucide-react';
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
            return true;
        }

        const cleanPhone = phone.replace(/[\s\-()]/g, '');
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

        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file type",
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
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="shortDescription" className="block text-xs font-semibold text-gray-900 mb-1">
                                        Short Description <span className="text-gray-500 font-normal">(for cards, max 150 chars)</span>
                                    </label>
                                    <textarea 
                                        id="shortDescription" 
                                        name="shortDescription" 
                                        value={formData.shortDescription || ''} 
                                        onChange={handleChange} 
                                        rows={2}
                                        maxLength={150}
                                        placeholder="Brief description that appears on your trainer card..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] resize-none"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(formData.shortDescription || '').length}/150 characters
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="bio" className="block text-xs text-gray-500 mb-1">
                                        Professional Bio
                                    </label>
                                    <textarea 
                                        id="bio" 
                                        name="bio" 
                                        value={formData.bio} 
                                        onChange={handleChange} 
                                        rows={3}
                                        placeholder="Share your experience..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] resize-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="experienceYears" className="block text-xs font-semibold text-gray-900 mb-1">
                                        Years of Experience
                                    </label>
                                    <input 
                                        type="number" 
                                        id="experienceYears" 
                                        name="experienceYears" 
                                        value={formData.experienceYears || ''} 
                                        onChange={(e) => {
                                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                            setFormData(prev => ({ ...prev, experienceYears: value }));
                                        }}
                                        min="0"
                                        max="50"
                                        placeholder="e.g., 5"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35]"
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="location" className="block text-xs text-gray-500 mb-1">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <select 
                                        id="location" 
                                        name="location" 
                                        value={formData.location} 
                                        onChange={handleChange} 
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                                    >
                                        <option value="">Select district</option>
                                        {HCMC_DISTRICTS.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label htmlFor="phone" className="block text-xs text-gray-500 mb-1">
                                        Phone Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        id="phone" 
                                        name="phone" 
                                        value={formData.phone || ''} 
                                        onChange={handleChange} 
                                        placeholder="+84 xxx xxx xxx"
                                        className={`w-full px-3 py-2 border rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                                            phoneError 
                                                ? 'border-red-500 focus:ring-red-500' 
                                                : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    />
                                    {phoneError && (
                                        <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                                    )}
                                    {!phoneError && (
                                        <p className="text-xs text-gray-500 mt-1">Format: +84 followed by 9-10 digits</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pricing Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">Pricing</h3>
                            <div>
                                <label htmlFor="price" className="block text-xs text-gray-500 mb-1">
                                    Hourly Rate (VND) <span className="text-red-500">*</span>
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
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">Your standard rate per hour</p>
                            </div>
                        </div>
                        
                        {/* Specialties Card */}
                        <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900">
                                    Training Specialties <span className="text-red-500">*</span>
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    Max 5
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {FITNESS_ACTIVITIES.map(specialty => {
                                    const isSelected = formData.specialty?.includes(specialty);
                                    return (
                                        <button 
                                            type="button" 
                                            key={specialty} 
                                            onClick={() => handleToggleSpecialty(specialty)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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

export default EditTrainerProfilePage;
