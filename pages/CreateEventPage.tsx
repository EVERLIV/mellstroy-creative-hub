import React, { useState } from 'react';
import { Save, Info, ArrowLeft } from 'lucide-react';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';
import { AppScreen, ScreenSection, ScreenStickyBar } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader } from '@/src/components/layout/stitch-page';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/src/components/ui/field';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import ParticleButton from '@/src/components/kokonutui/particle-button';

interface CreateEventPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

const RequiredMark = () => (
    <span className="text-destructive" aria-hidden="true">*</span>
);

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
        <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
            <StitchCanvas className="max-w-3xl">
                <div className="space-y-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        Back
                    </Button>
                    <StitchPageHeader
                        title="Create new event"
                        description="Events are published after an admin approves them."
                    />
                </div>
                <Alert>
                    <Info />
                    <AlertDescription>
                        Your event will be visible only to you until an admin approves it.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:gap-8">
                    <ScreenSection title="Event details" variant="panel">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="title">Event title <RequiredMark /></FieldLabel>
                                <Input id="title" type="text" name="title" value={formData.title} onChange={handleChange} required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="description">Description <RequiredMark /></FieldLabel>
                                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} required />
                                <FieldDescription>What will happen, who it's for, what to bring.</FieldDescription>
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection title="When and where" variant="panel">
                        <FieldGroup>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="date">Date <RequiredMark /></FieldLabel>
                                    <Input id="date" type="date" name="date" value={formData.date} onChange={handleChange} required />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="time">Time <RequiredMark /></FieldLabel>
                                    <Input id="time" type="time" name="time" value={formData.time} onChange={handleChange} required />
                                </Field>
                            </FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="location">Location <RequiredMark /></FieldLabel>
                                <Input
                                    id="location"
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Le Van Tam Park, District 1"
                                />
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection title="Cover image" description="Optional" variant="panel">
                        <FieldGroup>
                            {formData.image_url && (
                                <img
                                    src={formData.image_url}
                                    alt="Cover preview"
                                    className="aspect-[16/9] w-full rounded-xl border border-border bg-muted object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={(e) => {
                                        e.currentTarget.style.display = '';
                                    }}
                                />
                            )}
                            <Field>
                                <FieldLabel htmlFor="image_url">Image URL</FieldLabel>
                                <Input
                                    id="image_url"
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                />
                                <FieldDescription>A direct link to a JPG or PNG.</FieldDescription>
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenStickyBar width="form">
                        <Button type="button" variant="outline" size="lg" onClick={onBack} disabled={loading} className="hidden md:inline-flex">
                            Cancel
                        </Button>
                        <ParticleButton
                            type="submit"
                            size="lg"
                            className="w-full bg-[#fd651e] text-white hover:bg-[#a73a00] md:w-auto"
                            disabled={!isFormValid || loading}
                            status={loading ? 'pending' : 'idle'}
                            pendingLabel="Submitting..."
                            icon={<Save />}
                        >
                            Submit event
                        </ParticleButton>
                    </ScreenStickyBar>
                </form>
            </StitchCanvas>
        </AppScreen>
    );
};

export default CreateEventPage;
