import React, { useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

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
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                ...formData,
                organizer_id: user.id,
                status: 'pending',
            });

            if (error) throw error;

            toast({
                title: 'Event submitted',
                description: 'Your event is pending admin approval',
            });
            onSuccess();
        } catch (error: any) {
            console.error('Error creating event:', error);
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
        <div className="bg-slate-100 h-full flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 pt-20">
                <h1 className="text-2xl font-bold text-slate-800 text-center mb-4">Create New Event</h1>
                <div className="bg-white p-4 rounded-2xl shadow-md shadow-slate-200/60 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">Event Title</label>
                        <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-slate-600 mb-1">Time</label>
                            <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="location" className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                        <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="e.g., Le Van Tam Park, District 1" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="image_url" className="block text-sm font-medium text-slate-600 mb-1">Image URL (optional)</label>
                        <input type="url" id="image_url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
            </form>

            <footer className="px-4 pt-4 bg-white border-t border-gray-200 flex-shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={!isFormValid || loading}
                    className="w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</>
                    ) : (
                        <><Save className="w-5 h-5 mr-2" />Submit Event</>
                    )}
                </button>
            </footer>
        </div>
    );
};

export default CreateEventPage;