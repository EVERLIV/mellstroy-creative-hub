import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES } from '../constants';
import { Camera, Loader, Save } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenStickyBar } from '@/src/components/layout/screen';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/src/components/ui/field';
import { ChipGroup } from '@/src/components/form/chip-group';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { NativeSelect } from '@/src/components/ui/native-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

const SHORT_DESCRIPTION_MAX = 150;
const MAX_SPECIALTIES = 5;

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

    const shortDescriptionLength = (formData.shortDescription || '').length;

    return (
        <AppScreen>
            <ScreenHeader
                title="Edit profile"
                description="This is what students see on your trainer card and profile"
                onBack={onCancel}
                width="form"
                breadcrumbs={[{ label: 'Profile' }, { label: 'Edit' }]}
            />

            <ScreenBody width="form">
                <form id="edit-form" onSubmit={handleSave} className="flex flex-col gap-6 md:gap-8">
                    {/* Photo */}
                    <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 md:p-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                        />
                        <div className="relative shrink-0">
                            <Avatar className="size-20 border-2 border-border md:size-24">
                                <AvatarImage src={formData.imageUrl} alt={formData.name} className="object-cover" />
                                <AvatarFallback className="text-xl font-semibold">
                                    {formData.name?.charAt(0).toUpperCase() || 'T'}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                aria-label="Change profile photo"
                                className="absolute -bottom-1 -right-1 size-8 rounded-full"
                            >
                                {isUploading ? <Loader className="animate-spin" /> : <Camera />}
                            </Button>
                        </div>
                        <div className="flex min-w-0 flex-col gap-1">
                            <h2 className="text-base font-semibold text-foreground">Profile photo</h2>
                            <p className="text-sm text-muted-foreground">A clear, friendly photo gets more bookings. Up to 3MB.</p>
                        </div>
                    </section>

                    <ScreenSection title="About you" description="Shown on your trainer card" variant="panel">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">
                                    Full name <span className="text-destructive" aria-hidden="true">*</span>
                                </FieldLabel>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="shortDescription">Short description</FieldLabel>
                                <Textarea
                                    id="shortDescription"
                                    name="shortDescription"
                                    value={formData.shortDescription || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    maxLength={SHORT_DESCRIPTION_MAX}
                                    placeholder="Brief description that appears on your trainer card..."
                                    className="resize-none"
                                />
                                <FieldDescription>
                                    {shortDescriptionLength}/{SHORT_DESCRIPTION_MAX} characters
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="bio">Professional bio</FieldLabel>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Share your experience..."
                                    className="resize-none"
                                />
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection title="Work details" variant="panel">
                        <FieldGroup>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="location">
                                        District <span className="text-destructive" aria-hidden="true">*</span>
                                    </FieldLabel>
                                    <NativeSelect id="location" name="location" value={formData.location} onChange={handleChange} required>
                                        <option value="">Select district</option>
                                        {HCMC_DISTRICTS.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="experienceYears">Years of experience</FieldLabel>
                                    <Input
                                        id="experienceYears"
                                        type="number"
                                        name="experienceYears"
                                        value={formData.experienceYears || ''}
                                        onChange={(e) => {
                                            const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                                            setFormData(prev => ({ ...prev, experienceYears: value }));
                                        }}
                                        min="0"
                                        max="50"
                                        placeholder="e.g., 5"
                                    />
                                </Field>
                            </FieldGroup>

                            <Field data-invalid={!!phoneError}>
                                <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                                <Input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    placeholder="+84 xxx xxx xxx"
                                    aria-invalid={!!phoneError}
                                />
                                {phoneError ? (
                                    <FieldError>{phoneError}</FieldError>
                                ) : (
                                    <FieldDescription>Format: +84 followed by 9-10 digits</FieldDescription>
                                )}
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection title="Pricing" variant="panel">
                        <Field>
                            <FieldLabel htmlFor="price">
                                Hourly rate (VND) <span className="text-destructive" aria-hidden="true">*</span>
                            </FieldLabel>
                            <Input
                                id="price"
                                type="number"
                                name="price"
                                value={formData.price || ''}
                                onChange={handleChange}
                                min="0"
                                step="10000"
                                required
                                placeholder="300000"
                            />
                            <FieldDescription>Your standard rate per hour</FieldDescription>
                        </Field>
                    </ScreenSection>

                    <ScreenSection
                        title={
                            <>
                                Training specialties <span className="text-destructive" aria-hidden="true">*</span>
                            </>
                        }
                        description={`${formData.specialty?.length ?? 0} of ${MAX_SPECIALTIES} selected`}
                        variant="panel"
                    >
                        <ChipGroup
                            label="Training specialties"
                            options={FITNESS_ACTIVITIES}
                            selected={formData.specialty}
                            max={MAX_SPECIALTIES}
                            onToggle={handleToggleSpecialty}
                        />
                    </ScreenSection>

                    <ScreenStickyBar width="form">
                        <Button type="button" variant="outline" size="lg" onClick={onCancel} className="hidden md:inline-flex">
                            Cancel
                        </Button>
                        <Button type="submit" size="lg" className="w-full md:w-auto">
                            <Save />
                            Save changes
                        </Button>
                    </ScreenStickyBar>
                </form>
            </ScreenBody>
        </AppScreen>
    );
};

export default EditTrainerProfilePage;
