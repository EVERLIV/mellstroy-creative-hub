import React, { useState, useRef } from 'react';
import { ArrowLeft, Save, Loader2, Upload, X, Image, Crown, Lock } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { FITNESS_ACTIVITIES, HCMC_DISTRICTS } from '../constants';

interface CreateEventPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

const CreateEventPage: React.FC<CreateEventPageProps> = ({ onBack, onSuccess }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        event_type: 'general',
        sport_category: '',
        district: '',
        price: '0',
        max_participants: '',
        premium_only: false,
        event_password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file',
                description: 'Please select an image file (JPG, PNG, WEBP)',
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Image must be less than 5MB',
                variant: 'destructive',
            });
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            setImagePreview(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async (userId: string): Promise<string | null> => {
        if (!imageFile) return null;

        setUploadingImage(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('event-photos')
            .upload(fileName, imageFile, { contentType: imageFile.type });

        if (uploadError) {
            throw new Error('Failed to upload image');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('event-photos')
            .getPublicUrl(fileName);

        setUploadingImage(false);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload image if selected
            let imageUrl: string | null = null;
            if (imageFile) {
                imageUrl = await uploadImage(user.id);
            }

            const { error } = await supabase.from('events').insert({
                title: formData.title,
                description: formData.description,
                date: formData.date,
                time: formData.time,
                location: formData.location,
                image_url: imageUrl,
                event_type: formData.event_type,
                sport_category: formData.sport_category || null,
                district: formData.district || null,
                price: parseFloat(formData.price) || 0,
                max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
                organizer_id: user.id,
                status: 'approved',
                premium_only: formData.premium_only,
                event_password: formData.event_password || null,
            } as any);

            if (error) throw error;

            toast({
                title: 'Event created!',
                description: 'Your event has been published successfully.',
            });
            onSuccess();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create event',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    const isFormValid = formData.title && formData.description && formData.date && formData.time && formData.location;

    return (
        <div className="bg-background h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-accent px-4 h-14 flex items-center relative">
                <button onClick={onBack} className="absolute left-4 p-2 rounded-full bg-card/20 hover:bg-card/30 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-primary-foreground" />
                </button>
                <h1 className="text-xl font-semibold text-primary-foreground text-center w-full">Create New Event</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                <div className="bg-card p-4 rounded-2xl shadow-lg space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-xs font-medium text-foreground mb-1">Event Title</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sport_category" className="block text-xs font-medium text-foreground mb-1">Sport Category</label>
                            <select id="sport_category" name="sport_category" value={formData.sport_category} onChange={handleChange} className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm">
                                <option value="">Select sport</option>
                                {FITNESS_ACTIVITIES.map(activity => (
                                    <option key={activity} value={activity}>{activity}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="district" className="block text-xs font-medium text-foreground mb-1">District</label>
                            <select id="district" name="district" value={formData.district} onChange={handleChange} className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm">
                                <option value="">Select district</option>
                                {HCMC_DISTRICTS.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="event_type" className="block text-xs font-medium text-foreground mb-1">Event Type</label>
                        <select id="event_type" name="event_type" value={formData.event_type} onChange={handleChange} className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm">
                            <option value="general">General</option>
                            <option value="partner_search">Looking for Partner</option>
                            <option value="sparring">Sparring Session</option>
                            <option value="group_class">Group Class</option>
                            <option value="ride">Ride/Run</option>
                            <option value="competition">Local Competition</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-xs font-medium text-foreground mb-1">Description</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-xs font-medium text-foreground mb-1">Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-xs font-medium text-foreground mb-1">Time</label>
                            <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="location" className="block text-xs font-medium text-foreground mb-1">Location / Address</label>
                        <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., Le Van Tam Park, District 1" className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm placeholder:text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-xs font-medium text-foreground mb-1">Price (VND)</label>
                            <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} min="0" step="1000" placeholder="0 for free" className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm placeholder:text-muted-foreground" />
                        </div>
                        <div>
                            <label htmlFor="max_participants" className="block text-xs font-medium text-foreground mb-1">Max Participants</label>
                            <input type="number" id="max_participants" name="max_participants" value={formData.max_participants} onChange={handleChange} min="1" placeholder="No limit" className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm placeholder:text-muted-foreground" />
                        </div>
                    </div>
                    
                    {/* Event Privacy Options */}
                    <div className="space-y-3 p-3 bg-muted/50 rounded-xl border border-border">
                        <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            Event Privacy (optional)
                        </p>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="premium_only"
                                checked={formData.premium_only}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="flex items-center gap-1.5 text-sm text-foreground">
                                <Crown className="w-4 h-4 text-primary" />
                                Premium users only
                            </span>
                        </label>
                        
                        <div>
                            <label htmlFor="event_password" className="block text-xs text-muted-foreground mb-1">
                                Or set a password to join
                            </label>
                            <input
                                type="text"
                                id="event_password"
                                name="event_password"
                                value={formData.event_password}
                                onChange={handleChange}
                                placeholder="Leave empty for no password"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    
                    {/* Image Upload */}
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Event Cover Image (optional)</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-40 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                                <Image className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload image</span>
                                <span className="text-xs text-muted-foreground">Max 5MB • JPG, PNG, WEBP</span>
                            </button>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className="w-full flex items-center justify-center bg-primary text-primary-foreground font-semibold h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{uploadingImage ? 'Uploading image...' : 'Submitting...'}</>
                        ) : (
                            <><Save className="w-5 h-5 mr-2" />Submit Event</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateEventPage;