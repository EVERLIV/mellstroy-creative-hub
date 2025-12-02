import React, { useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image_url: '',
        event_type: 'general',
        sport_category: '',
        district: '',
        price: '0',
        max_participants: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('events').insert({
                title: formData.title,
                description: formData.description,
                date: formData.date,
                time: formData.time,
                location: formData.location,
                image_url: formData.image_url || null,
                event_type: formData.event_type,
                sport_category: formData.sport_category || null,
                district: formData.district || null,
                price: parseFloat(formData.price) || 0,
                max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
                organizer_id: user.id,
                status: 'approved',
            });

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
                    <div>
                        <label htmlFor="image_url" className="block text-xs font-medium text-foreground mb-1">Image URL (optional)</label>
                        <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm placeholder:text-muted-foreground" />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className="w-full flex items-center justify-center bg-primary text-primary-foreground font-semibold h-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</>
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