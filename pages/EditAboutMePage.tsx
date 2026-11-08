import React, { useState, useRef } from 'react';
import { Trainer } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS } from '../constants';
import { Camera, Loader, Save } from 'lucide-react';
import { AppScreen, ScreenHeader, ScreenBody, ScreenSection, ScreenStickyBar } from '@/src/components/layout/screen';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/src/components/ui/field';
import { ChipGroup } from '@/src/components/form/chip-group';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { NativeSelect } from '@/src/components/ui/native-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { supabase } from '../src/integrations/supabase/client';
import { useToast } from '../src/hooks/use-toast';

const MAX_SELECTIONS = 5;

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
            const maxSelections = 5;

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

        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Invalid file",
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
        <AppScreen>
            <ScreenHeader
                title="Edit profile"
                description="Tell trainers about yourself and your goals"
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
                                    {formData.name?.charAt(0).toUpperCase() || 'U'}
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
                            <p className="text-sm text-muted-foreground">JPG, PNG or WEBP up to 3MB.</p>
                        </div>
                    </section>

                    <ScreenSection title="Basics" variant="panel">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Full name</FieldLabel>
                                <Input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="location">District</FieldLabel>
                                <NativeSelect id="location" name="location" value={formData.location || ''} onChange={handleChange} required aria-required="true">
                                    <option value="">Select district</option>
                                    {HCMC_DISTRICTS.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </NativeSelect>
                                <FieldDescription>
                                    Used to measure distance to coaches and classes.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="distanceUnit">Distance unit</FieldLabel>
                                <NativeSelect
                                    id="distanceUnit"
                                    name="distanceUnit"
                                    value={formData.distanceUnit || 'km'}
                                    onChange={handleChange}
                                >
                                    <option value="km">Kilometers (km)</option>
                                    <option value="mi">Miles (mi)</option>
                                </NativeSelect>
                                <FieldDescription>
                                    Explore and Classes filters use this unit.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bio">About me</FieldLabel>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Tell others about yourself..."
                                    className="resize-none"
                                />
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection title="Body stats" description="Helps trainers tailor sessions" variant="panel">
                        <FieldGroup className="grid grid-cols-3 gap-3 md:gap-4">
                            <Field>
                                <FieldLabel htmlFor="age">Age</FieldLabel>
                                <Input id="age" type="number" name="age" value={formData.age || ''} onChange={handleChange} placeholder="--" className="text-center" />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="height">Height</FieldLabel>
                                <Input id="height" type="number" name="height" value={formData.height || ''} onChange={handleChange} placeholder="cm" className="text-center" />
                                <FieldDescription>cm</FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="weight">Weight</FieldLabel>
                                <Input id="weight" type="number" name="weight" value={formData.weight || ''} onChange={handleChange} placeholder="kg" className="text-center" />
                                <FieldDescription>kg</FieldDescription>
                            </Field>
                        </FieldGroup>
                    </ScreenSection>

                    <ScreenSection
                        title="Fitness goals"
                        description={`${formData.goals?.length ?? 0} of ${MAX_SELECTIONS} selected`}
                        variant="panel"
                    >
                        <ChipGroup
                            label="Fitness goals"
                            options={FITNESS_GOALS}
                            selected={formData.goals}
                            max={MAX_SELECTIONS}
                            onToggle={(goal) => handleToggle('goals', goal)}
                        />
                    </ScreenSection>

                    <ScreenSection
                        title="Sport interests"
                        description={`${formData.interests?.length ?? 0} of ${MAX_SELECTIONS} selected`}
                        variant="panel"
                    >
                        <ChipGroup
                            label="Sport interests"
                            options={FITNESS_ACTIVITIES}
                            selected={formData.interests}
                            max={MAX_SELECTIONS}
                            onToggle={(interest) => handleToggle('interests', interest)}
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

export default EditAboutMePage;
