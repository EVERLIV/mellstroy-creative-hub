import React, { useState, useEffect } from 'react';
import { Class, ClassType } from '../types';
import { X, Save, Building, Sun, Home, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { useAuth } from '@/src/hooks/useAuth';
import { useToast } from '@/src/hooks/use-toast';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Switch } from '@/src/components/ui/switch';
import { FormField, FormGrid } from '@/src/components/form/form-field';

interface AddEditClassModalProps {
    cls: Class | null | undefined;
    onSave: (classData: Class) => void;
    onCancel: () => void;
}

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type FormData = Omit<Class, 'id' | 'bookings'>;

const AddEditClassModal: React.FC<AddEditClassModalProps> = ({ cls, onSave, onCancel }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    
    const [formData, setFormData] = useState<FormData & { kids_friendly?: boolean; disability_friendly?: boolean }>({
        name: '',
        description: '',
        duration: 60,
        price: 150000,
        imageUrl: 'https://picsum.photos/id/119/800/600',
        capacity: 10,
        schedule: { days: [], time: '09:00' },
        classType: 'Indoor',
        language: [],
        level: '',
        kids_friendly: false,
        disability_friendly: false
    });
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', user.id)
                .single();
            if (data) {
                setIsPremium(data.is_premium || false);
            }
        };
        fetchUserProfile();
    }, [user]);
    
    useEffect(() => {
        if (cls) {
            setFormData({
                name: cls.name,
                description: cls.description,
                duration: cls.duration,
                price: cls.price,
                imageUrl: cls.imageUrl,
                capacity: cls.capacity,
                schedule: cls.schedule || { days: [], time: '09:00' },
                classType: cls.classType || 'Indoor',
                language: cls.language || [],
                level: cls.level || '',
                kids_friendly: (cls as any).kids_friendly || false,
                disability_friendly: (cls as any).disability_friendly || false
            });
            // Load existing images if available
            const dbCls = cls as any;
            if (dbCls.image_urls && dbCls.image_urls.length > 0) {
                setUploadedImages(dbCls.image_urls);
            } else if (cls.imageUrl) {
                setUploadedImages([cls.imageUrl]);
            }
        } else {
            // Reset to default for new class
            setFormData({
                name: '',
                description: '',
                duration: 60,
                price: 150000,
                imageUrl: 'https://picsum.photos/id/119/800/600',
                capacity: 10,
                schedule: { days: [], time: '09:00' },
                classType: 'Indoor',
                language: [],
                level: '',
                kids_friendly: false,
                disability_friendly: false
            });
            setUploadedImages([]);
        }
    }, [cls]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'duration' || name === 'price' || name === 'capacity') ? parseInt(value) || 0 : value
        }));
    };

    const handleScheduleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            schedule: { ...prev.schedule!, [name]: value }
        }));
    };
    
    const handleDayToggle = (day: string) => {
        setFormData(prev => {
            const currentDays = prev.schedule?.days || [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            return {
                ...prev,
                schedule: { ...prev.schedule!, days: newDays }
            };
        });
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !user) return;

        const maxPhotos = isPremium ? 6 : 1;
        const remainingSlots = maxPhotos - uploadedImages.length;

        if (files.length > remainingSlots) {
            toast({
                title: "Upload limit exceeded",
                description: `You can only upload ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}. ${isPremium ? 'Premium' : 'Basic'} users can upload up to ${maxPhotos} photo${maxPhotos !== 1 ? 's' : ''}.`,
                variant: "destructive"
            });
            return;
        }

        const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds 3MB limit. Please choose a smaller image.`,
                    variant: "destructive"
                });
                continue;
            }

            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not an image file.`,
                    variant: "destructive"
                });
                continue;
            }

            setUploading(true);
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data, error } = await supabase.storage
                    .from('class-images')
                    .upload(fileName, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('class-images')
                    .getPublicUrl(fileName);

                setUploadedImages(prev => [...prev, publicUrl]);
                
                toast({
                    title: "Image uploaded",
                    description: "Your image has been uploaded successfully.",
                });
            } catch (error) {
                toast({
                    title: "Upload failed",
                    description: "Failed to upload image. Please try again.",
                    variant: "destructive"
                });
            } finally {
                setUploading(false);
            }
        }
        
        // Reset input
        e.target.value = '';
    };

    const handleRemoveImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (uploadedImages.length === 0) {
            toast({
                title: "No images",
                description: "Please upload at least one image for your class.",
                variant: "destructive"
            });
            return;
        }
        
        const finalData: Class & { _dbId?: string; image_urls?: string[]; kids_friendly?: boolean; disability_friendly?: boolean } = {
            id: cls?.id || 0,
            bookings: cls?.bookings || [],
            ...formData,
            language: formData.language || [],
            level: formData.level || '',
            kids_friendly: formData.kids_friendly || false,
            disability_friendly: formData.disability_friendly || false,
            imageUrl: uploadedImages[0],
            image_urls: uploadedImages,
            ...(cls as any)?._dbId && { 
                _dbId: (cls as any)._dbId
            }
        };
        
        onSave(finalData);
    };
    
    const classTypeOptions: { id: ClassType, label: string, icon: React.FC<any> }[] = [
        { id: 'Indoor', label: 'Indoor', icon: Building },
        { id: 'Outdoor', label: 'Outdoor', icon: Sun },
        { id: 'Home', label: 'Home', icon: Home },
    ];

    if (cls === undefined) return null;

    const maxPhotos = isPremium ? 6 : 1;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 animate-fade-in sm:items-center sm:p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="class-modal-title"
        >
            <div
                className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl animate-slide-up sm:max-h-[88vh] sm:max-w-2xl sm:rounded-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6">
                    <h2 id="class-modal-title" className="text-base font-semibold text-foreground md:text-lg">
                        {cls ? 'Edit Class' : 'Add New Class'}
                    </h2>
                    <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
                        <X />
                    </Button>
                </div>

                <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 md:p-6">
                        <FormGrid>
                            <FormField label="Class Name" htmlFor="name" required className="md:col-span-2">
                                <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Description" htmlFor="description" required className="md:col-span-2">
                                <Textarea name="description" value={formData.description} onChange={handleChange} rows={3} required className="resize-none" />
                            </FormField>
                        </FormGrid>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-foreground">Class Type</legend>
                            <div className="grid grid-cols-3 gap-2">
                                {classTypeOptions.map(opt => {
                                    const isSelected = formData.classType === opt.id;
                                    return (
                                        <button
                                            type="button"
                                            key={opt.id}
                                            aria-pressed={isSelected}
                                            onClick={() => setFormData(prev => ({ ...prev, classType: opt.id }))}
                                            className={cn(
                                                'flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                            )}
                                        >
                                            <opt.icon className="h-5 w-5" />
                                            <span className="text-xs font-semibold">{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="grid grid-cols-3 gap-3">
                            <FormField label="Duration" htmlFor="duration" hint="minutes" required>
                                <Input type="number" name="duration" placeholder="min" value={formData.duration} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Capacity" htmlFor="capacity" required>
                                <Input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required />
                            </FormField>
                            <FormField label="Price" htmlFor="price" hint="VND" required>
                                <Input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                            </FormField>
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-foreground">Languages</legend>
                            <div className="flex flex-wrap gap-2">
                                {LANGUAGE_OPTIONS.map(lang => {
                                    const isSelected = formData.language?.includes(lang) ?? false;
                                    return (
                                        <ChoiceChip
                                            key={lang}
                                            selected={isSelected}
                                            onClick={() => {
                                                const currentLangs = formData.language || [];
                                                const newLangs = isSelected
                                                    ? currentLangs.filter(l => l !== lang)
                                                    : [...currentLangs, lang];
                                                setFormData(prev => ({ ...prev, language: newLangs }));
                                            }}
                                        >
                                            {lang}
                                        </ChoiceChip>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-foreground">Class Level</legend>
                            <div className="flex flex-wrap gap-2">
                                {LEVEL_OPTIONS.map(level => (
                                    <ChoiceChip
                                        key={level}
                                        selected={formData.level === level}
                                        onClick={() => setFormData(prev => ({ ...prev, level: level }))}
                                    >
                                        {level}
                                    </ChoiceChip>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="space-y-3 rounded-lg border border-border p-3 md:p-4">
                            <legend className="px-1 text-sm font-medium text-foreground">Recurring Schedule</legend>
                            <FormField label="Time" htmlFor="time">
                                <Input type="time" name="time" value={formData.schedule?.time} onChange={handleScheduleChange} className="md:max-w-[12rem]" />
                            </FormField>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Repeats on</p>
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                                    {dayOptions.map(day => (
                                        <ChoiceChip
                                            key={day}
                                            selected={formData.schedule?.days.includes(day) ?? false}
                                            onClick={() => handleDayToggle(day)}
                                            className="rounded-lg font-bold"
                                        >
                                            {day}
                                        </ChoiceChip>
                                    ))}
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium text-foreground">Additional Options</legend>
                            <div className="grid gap-2 md:grid-cols-2">
                                <ToggleRow
                                    id="kids-friendly-toggle"
                                    emoji="👶"
                                    label="Kids Friendly"
                                    checked={formData.kids_friendly || false}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, kids_friendly: checked }))}
                                />
                                <ToggleRow
                                    id="disability-friendly-toggle"
                                    emoji="♿"
                                    label="Disability Friendly"
                                    checked={formData.disability_friendly || false}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, disability_friendly: checked }))}
                                />
                            </div>
                        </fieldset>

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                                Class Photos ({uploadedImages.length}/{maxPhotos})
                                <span className="ml-2 text-xs font-normal text-muted-foreground">Max 3MB</span>
                            </p>

                            {uploadedImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {uploadedImages.map((url, index) => (
                                        <div key={index} className="group relative">
                                            <img
                                                src={url}
                                                alt={`Class photo ${index + 1}`}
                                                className="aspect-square w-full rounded-lg object-cover"
                                            />
                                            {/* Always visible on touch; hover-reveal on md+ */}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleRemoveImage(index)}
                                                aria-label={`Remove photo ${index + 1}`}
                                                className="absolute right-1 top-1 h-7 w-7 rounded-full transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 [&_svg]:size-3.5"
                                            >
                                                <Trash2 />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadedImages.length < maxPhotos && (
                                <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {uploading ? 'Uploading...' : 'Click to upload'}
                                    </span>
                                    <input
                                        type="file"
                                        className="sr-only"
                                        accept="image/*"
                                        multiple={isPremium}
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                            )}

                            {!isPremium && (
                                <p className="text-xs text-primary">💎 Upgrade to Premium for up to 6 photos</p>
                            )}
                        </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:flex md:justify-end md:px-6 md:pb-3">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Save />
                            Save
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LANGUAGE_OPTIONS = ['English', 'Vietnamese', 'Chinese', 'Korean', 'Japanese', 'French', 'Spanish'];
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced', 'Beginner to Intermediate', 'Intermediate to Advanced'];

interface ChoiceChipProps {
    selected: boolean;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}

function ChoiceChip({ selected, onClick, className, children }: ChoiceChipProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                'min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted',
                className
            )}
        >
            {children}
        </button>
    );
}

interface ToggleRowProps {
    id: string;
    emoji: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({ id, emoji, label, checked, onCheckedChange }: ToggleRowProps) {
    return (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
        >
            <span className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{emoji}</span>
                <span className="text-sm font-medium text-foreground">{label}</span>
            </span>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
        </label>
    );
}

export default AddEditClassModal;