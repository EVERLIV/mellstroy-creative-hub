import React, { useState } from 'react';
import { Trainer, Class, UserRole, ClassType } from '../types';
import { HCMC_DISTRICTS, FITNESS_ACTIVITIES, FITNESS_GOALS } from '../constants';
import { User, Briefcase, ArrowRight, type LucideIcon } from 'lucide-react';
import rhinoLogo from '../src/assets/rhino-logo.png';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { NativeSelect } from '@/src/components/ui/native-select';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/src/components/ui/field';
import { AppScreen, ScreenBody, ScreenSection } from '@/src/components/layout/screen';


interface OnboardingPageProps {
    currentUser: Trainer;
    onComplete: (updatedUser: Trainer) => void;
}

type Step = 'role' | 'student-form' | 'trainer-profile' | 'trainer-class';

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_GOALS = 5;
const MAX_SPECIALTIES = 3;

/** Step number shown to the user, and how many steps the chosen path has. */
const STEP_PROGRESS: Record<Step, { index: number; total: number }> = {
    'role': { index: 1, total: 2 },
    'student-form': { index: 2, total: 2 },
    'trainer-profile': { index: 2, total: 3 },
    'trainer-class': { index: 3, total: 3 },
};

const OnboardingPage: React.FC<OnboardingPageProps> = ({ currentUser, onComplete }) => {
    const [step, setStep] = useState<Step>('role');
    const [formData, setFormData] = useState<Trainer>(currentUser);
    const [classData, setClassData] = useState({
        name: '', description: '', duration: 60, price: 150000, capacity: 10, classType: 'Indoor' as ClassType,
        schedule: { days: [] as string[], time: '09:00' }
    });

    const handleRoleSelect = (role: UserRole) => {
        setFormData(prev => ({ ...prev, role }));
        if (role === 'student') {
            setStep('student-form');
        } else {
            setStep('trainer-profile');
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['age', 'height', 'weight', 'price'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? undefined : parseInt(value)) : value
        }));
    };

    const handleClassFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setClassData(prev => ({
            ...prev,
            [name]: ['duration', 'price', 'capacity'].includes(name) ? parseInt(value) || 0 : value
        }));
    };

    const handleDayToggle = (day: string) => {
        setClassData(prev => {
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

    const handleScheduleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setClassData(prev => ({
            ...prev,
            schedule: { ...prev.schedule!, time: value }
        }));
    };

    const handleToggle = (field: 'goals' | 'interests' | 'specialty', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field] || [];
            const isSelected = currentValues.includes(value);
            const maxSelections = field === 'specialty' ? MAX_SPECIALTIES : MAX_GOALS;

            if (isSelected) {
                return { ...prev, [field]: currentValues.filter(v => v !== value) };
            } else if (currentValues.length < maxSelections) {
                return { ...prev, [field]: [...currentValues, value] };
            }
            return prev;
        });
    };

    const handleStudentSubmit = () => {
        onComplete({ ...formData, onboardingCompleted: true });
    };

    const handleTrainerProfileSubmit = () => {
        setStep('trainer-class');
    };

    const handleTrainerClassSubmit = () => {
        const newClass: Class = {
            id: Date.now(),
            name: classData.name,
            description: classData.description,
            duration: classData.duration,
            price: classData.price,
            imageUrl: 'https://picsum.photos/id/119/800/600',
            capacity: classData.capacity,
            schedule: classData.schedule,
            classType: classData.classType,
            bookings: [],
        };
        onComplete({ ...formData, classes: [newClass], onboardingCompleted: true });
    };

    const renderRoleSelection = () => (
        <div className="flex flex-col gap-8">
            <StepHeading title="Welcome to RhinoFit!" description="First, tell us what brings you here. Do you want to teach or learn?" />
            <div className="grid gap-4 sm:grid-cols-2">
                <RoleCard icon={User} title="I want to learn" description="Find trainers and book fitness classes" onClick={() => handleRoleSelect('student')} />
                <RoleCard icon={Briefcase} title="I want to teach" description="Offer classes and manage students" onClick={() => handleRoleSelect('trainer')} />
            </div>
            <p className="text-center text-xs text-muted-foreground">You can only choose one role per account.</p>
        </div>
    );

    const renderStudentForm = () => (
        <div className="flex flex-col gap-8">
            <StepHeading title="Tell us about yourself" description="This helps us recommend the best trainers for you." />
            <form onSubmit={(e) => { e.preventDefault(); handleStudentSubmit(); }} className="flex flex-col gap-6">
                <ScreenSection title="Personal info" variant="panel">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="name">Full name</FieldLabel>
                            <Input id="name" type="text" name="name" value={formData.name} onChange={handleFormChange} required />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field>
                                <FieldLabel htmlFor="age">Age</FieldLabel>
                                <Input id="age" type="number" name="age" inputMode="numeric" value={formData.age || ''} onChange={handleFormChange} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="height">Height (cm)</FieldLabel>
                                <Input id="height" type="number" name="height" inputMode="numeric" value={formData.height || ''} onChange={handleFormChange} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="weight">Weight (kg)</FieldLabel>
                                <Input id="weight" type="number" name="weight" inputMode="numeric" value={formData.weight || ''} onChange={handleFormChange} />
                            </Field>
                        </div>
                    </FieldGroup>
                </ScreenSection>

                <ScreenSection title="My fitness goals" description={`Pick up to ${MAX_GOALS}`} variant="panel">
                    <ChipGroup
                        options={FITNESS_GOALS}
                        selected={formData.goals || []}
                        onToggle={(goal) => handleToggle('goals', goal)}
                        label="Fitness goals"
                    />
                </ScreenSection>

                <StepSubmit>Finish & find trainers</StepSubmit>
            </form>
        </div>
    );

    const renderTrainerProfileForm = () => (
        <div className="flex flex-col gap-8">
            <StepHeading title="Set up your trainer profile" description="This is how students will see you." />
            <form onSubmit={(e) => { e.preventDefault(); handleTrainerProfileSubmit(); }} className="flex flex-col gap-6">
                <ScreenSection title="Profile" variant="panel">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="name">Full name</FieldLabel>
                            <Input id="name" type="text" name="name" value={formData.name} onChange={handleFormChange} required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="location">Location</FieldLabel>
                            <NativeSelect id="location" name="location" value={formData.location} onChange={handleFormChange}>
                                {HCMC_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </NativeSelect>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="bio">About me</FieldLabel>
                            <Textarea id="bio" name="bio" value={formData.bio} onChange={handleFormChange} rows={4} placeholder="Your experience, qualifications, teaching style..." />
                            <FieldDescription>Shown on your public profile.</FieldDescription>
                        </Field>
                    </FieldGroup>
                </ScreenSection>

                <ScreenSection title="Specialties" description={`Pick up to ${MAX_SPECIALTIES}`} variant="panel">
                    <ChipGroup
                        options={FITNESS_ACTIVITIES}
                        selected={formData.specialty || []}
                        onToggle={(activity) => handleToggle('specialty', activity)}
                        label="Specialties"
                    />
                </ScreenSection>

                <StepSubmit>Next: create first class</StepSubmit>
            </form>
        </div>
    );

    const renderTrainerClassForm = () => (
        <div className="flex flex-col gap-8">
            <StepHeading title="Create your first class" description="You can add more later from your profile." />
            <form onSubmit={(e) => { e.preventDefault(); handleTrainerClassSubmit(); }} className="flex flex-col gap-6">
                <ScreenSection title="Class details" variant="panel">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="className">Class name</FieldLabel>
                            <Input id="className" type="text" name="name" value={classData.name} onChange={handleClassFormChange} required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="classDesc">Description</FieldLabel>
                            <Textarea id="classDesc" name="description" value={classData.description} onChange={handleClassFormChange} required rows={3} />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field>
                                <FieldLabel htmlFor="duration">Duration (min)</FieldLabel>
                                <Input id="duration" type="number" name="duration" inputMode="numeric" value={classData.duration} onChange={handleClassFormChange} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
                                <Input id="capacity" type="number" name="capacity" inputMode="numeric" value={classData.capacity} onChange={handleClassFormChange} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="price">Price (VND)</FieldLabel>
                                <Input id="price" type="number" name="price" inputMode="numeric" value={classData.price} onChange={handleClassFormChange} />
                            </Field>
                        </div>
                    </FieldGroup>
                </ScreenSection>

                <ScreenSection title="Schedule" variant="panel">
                    <FieldGroup>
                        <Field className="max-w-48">
                            <FieldLabel htmlFor="time">Time</FieldLabel>
                            <Input id="time" type="time" name="time" value={classData.schedule.time} onChange={handleScheduleTimeChange} />
                        </Field>
                        <FieldSet>
                            <FieldLegend variant="label">Repeats on</FieldLegend>
                            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                                {dayOptions.map(day => (
                                    <ChipButton key={day} isSelected={classData.schedule.days.includes(day)} onClick={() => handleDayToggle(day)} className="rounded-lg">
                                        {day}
                                    </ChipButton>
                                ))}
                            </div>
                        </FieldSet>
                    </FieldGroup>
                </ScreenSection>

                <StepSubmit>Complete setup & view profile</StepSubmit>
            </form>
        </div>
    );


    const renderContent = () => {
        switch (step) {
            case 'student-form': return renderStudentForm();
            case 'trainer-profile': return renderTrainerProfileForm();
            case 'trainer-class': return renderTrainerClassForm();
            case 'role':
            default: return renderRoleSelection();
        }
    }

    const progress = STEP_PROGRESS[step];

    return (
        <AppScreen>
            <ScreenBody width="form" className="md:pt-12">
                <div className="flex items-center gap-4">
                    <img src={rhinoLogo} alt="RhinoFit" className="size-12 object-contain" />
                    <div className="flex flex-1 flex-col gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground">
                            Step {progress.index} of {progress.total}
                        </p>
                        <div
                            className="h-1.5 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuemin={1}
                            aria-valuemax={progress.total}
                            aria-valuenow={progress.index}
                            aria-label="Onboarding progress"
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${(progress.index / progress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
                <div key={step} className="animate-fade-in">
                    {renderContent()}
                </div>
            </ScreenBody>
        </AppScreen>
    );
};

/* ------------------------------------------------------------------ */

function StepHeading({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}

interface RoleCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    onClick: () => void;
}

function RoleCard({ icon: Icon, title, description, onClick }: RoleCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-border bg-card p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-6" />
            </div>
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </button>
    );
}

interface ChipButtonProps {
    isSelected: boolean;
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
}

function ChipButton({ isSelected, onClick, className, children }: ChipButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            className={cn(
                'min-h-10 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                className
            )}
        >
            {children}
        </button>
    );
}

interface ChipGroupProps {
    options: readonly string[];
    selected: readonly string[];
    onToggle: (value: string) => void;
    label: string;
}

function ChipGroup({ options, selected, onToggle, label }: ChipGroupProps) {
    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-2">
            {options.map(option => (
                <ChipButton key={option} isSelected={selected.includes(option)} onClick={() => onToggle(option)}>
                    {option}
                </ChipButton>
            ))}
        </div>
    );
}

function StepSubmit({ children }: { children: React.ReactNode }) {
    return (
        <Button type="submit" size="lg" className="w-full text-base font-semibold">
            {children}
            <ArrowRight />
        </Button>
    );
}

export default OnboardingPage;
