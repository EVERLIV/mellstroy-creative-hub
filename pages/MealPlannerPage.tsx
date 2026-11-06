import React, { useState } from 'react';
import { Trainer, MealPlan, DietaryPreferences, Duration } from '../types';
import { UtensilsCrossed, Sparkles, ChevronDown, Save, Flame } from 'lucide-react';
import { generateMealPlan } from '../utils/ai';
import { EATING_STYLES, DIET_TYPES } from '../constants';
import { AppScreen } from '@/src/components/layout/screen';
import { StitchCanvas, StitchPageHeader, StitchPanel } from '@/src/components/layout/stitch-page';
import { EmptyState, ErrorState, PageLoader } from '@/src/components/layout/states';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '@/src/components/ui/field';
import { Input } from '@/src/components/ui/input';
import { NativeSelect } from '@/src/components/ui/native-select';
import { Button } from '@/src/components/ui/button';
import ParticleButton from '@/src/components/kokonutui/particle-button';
import { cn } from '@/src/lib/utils';

const DURATIONS: ReadonlyArray<{ id: Duration; label: string }> = [
    { id: 'day', label: '1 day' },
    { id: 'week', label: '1 week' },
    { id: 'month', label: '1 month' },
];

interface MealPlannerPageProps {
    user: Trainer;
    onClose: () => void;
    onSavePlan: (plan: Omit<MealPlan, 'id' | 'createdAt'>) => void;
}

const MealPlannerPage: React.FC<MealPlannerPageProps> = ({ user, onClose, onSavePlan }) => {
    const [preferences, setPreferences] = useState<DietaryPreferences>({
        duration: 'day',
        eatingStyle: 'Cooking',
        dietType: 'Anything',
        allergies: '',
        dislikes: '',
    });
    const [generatedPlan, setGeneratedPlan] = useState<Omit<MealPlan, 'id' | 'createdAt' | 'preferences'> | null>(null);
    const [planNameToSave, setPlanNameToSave] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState<string | null>(null);

    const handlePrefChange = (field: keyof DietaryPreferences, value: string) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
    };

    const handleGeneratePlan = async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedPlan(null);
        setActiveDay(null);

        try {
            const plan = await generateMealPlan(user, preferences);
            if (plan) {
                setGeneratedPlan(plan);
                setPlanNameToSave(plan.name); // Pre-fill with AI-generated name
                if (plan.plan.length > 0) {
                    setActiveDay(plan.plan[0].day);
                }
            } else {
                setError("Sorry, we couldn't generate a meal plan. Please try again.");
            }
        } catch (e) {
            setError("An unexpected error occurred. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePlan = () => {
        if (generatedPlan && planNameToSave.trim()) {
            onSavePlan({
                ...generatedPlan,
                name: planNameToSave.trim(),
                preferences,
            });
        }
    };

    const toggleDay = (day: string) => {
        setActiveDay(prev => (prev === day ? null : day));
    };

    return (
        <AppScreen className="min-w-0 bg-[#f9fafb] dark:bg-background">
            <StitchCanvas>
                <StitchPageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <span className="grid size-8 place-items-center rounded-lg bg-orange-50 text-[#fd651e]">
                                <Sparkles className="size-4" aria-hidden />
                            </span>
                            AI meal planner
                        </span>
                    }
                    description="Tell us how you eat and get a personalised plan in seconds"
                    actions={
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-5 lg:items-start lg:gap-8">
                    <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:col-span-2">
                        <StitchPanel className="p-4">
                            <h2 className="mb-3 text-sm font-semibold text-foreground">1. How long?</h2>
                            <div role="radiogroup" aria-label="Plan duration" className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/60 p-1">
                                {DURATIONS.map(({ id, label }) => {
                                    const isSelected = preferences.duration === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            role="radio"
                                            aria-checked={isSelected}
                                            onClick={() => handlePrefChange('duration', id)}
                                            className={cn(
                                                'rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd651e]/40',
                                                isSelected
                                                    ? 'bg-card text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            {preferences.duration === 'month' && (
                                <p className="mt-3 text-center text-xs text-muted-foreground">
                                    We'll generate a sample 1-week plan for you to follow.
                                </p>
                            )}
                        </StitchPanel>

                        <StitchPanel className="p-4">
                            <h2 className="mb-3 text-sm font-semibold text-foreground">2. Your diet</h2>
                            <FieldGroup>
                                <Field>
                                    <FieldTitle id="eating-style-label">Eating style</FieldTitle>
                                    <div role="radiogroup" aria-labelledby="eating-style-label" className="grid grid-cols-3 gap-2">
                                        {EATING_STYLES.map((style) => {
                                            const isSelected = preferences.eatingStyle === style.id;
                                            return (
                                                <button
                                                    key={style.id}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    onClick={() => handlePrefChange('eatingStyle', style.id)}
                                                    className={cn(
                                                        'rounded-xl border px-2 py-2.5 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fd651e]/40',
                                                        isSelected
                                                            ? 'border-[#fd651e] bg-orange-50 text-[#fd651e]'
                                                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                                                    )}
                                                >
                                                    {style.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="dietType">Dietary needs</FieldLabel>
                                    <NativeSelect
                                        id="dietType"
                                        value={preferences.dietType}
                                        onChange={(e) => handlePrefChange('dietType', e.target.value)}
                                    >
                                        {DIET_TYPES.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
                                    <Input
                                        id="allergies"
                                        type="text"
                                        value={preferences.allergies}
                                        onChange={(e) => handlePrefChange('allergies', e.target.value)}
                                        placeholder="None"
                                    />
                                    <FieldDescription>Comma-separated, e.g. peanuts, shellfish</FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="dislikes">Dislikes</FieldLabel>
                                    <Input
                                        id="dislikes"
                                        type="text"
                                        value={preferences.dislikes}
                                        onChange={(e) => handlePrefChange('dislikes', e.target.value)}
                                        placeholder="None"
                                    />
                                    <FieldDescription>Comma-separated, e.g. cilantro, mushrooms</FieldDescription>
                                </Field>
                            </FieldGroup>
                        </StitchPanel>

                        <ParticleButton
                            size="lg"
                            className="w-full bg-[#fd651e] hover:bg-[#a73a00]"
                            onClick={handleGeneratePlan}
                            disabled={isLoading}
                            status={isLoading ? 'pending' : error ? 'error' : 'idle'}
                            pendingLabel="Generating..."
                            errorLabel="Try again"
                            icon={<Sparkles />}
                        >
                            Generate my plan
                        </ParticleButton>
                    </div>

                    <div className="flex flex-col gap-4 lg:col-span-3">
                        {error && (
                            <ErrorState title="Couldn't generate a plan" description={error} onRetry={handleGeneratePlan} />
                        )}

                        {isLoading && (
                            <PageLoader title="Generating your plan…" subtitle="This usually takes a few seconds" className="min-h-[30vh]" />
                        )}

                        {!generatedPlan && !isLoading && !error && (
                            <StitchPanel className="hidden p-6 lg:block">
                                <EmptyState
                                    icon={UtensilsCrossed}
                                    title="Your plan will appear here"
                                    description="Pick your preferences and press Generate."
                                />
                            </StitchPanel>
                        )}

                        {generatedPlan && (
                            <div className="flex animate-fade-in flex-col gap-4">
                                <StitchPanel className="p-4">
                                    <h2 className="text-sm font-semibold text-foreground">3. Your meal plan</h2>
                                    <p className="mb-3 text-xs text-muted-foreground">Name it, then save it to My meal plans</p>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                        <Field className="flex-1">
                                            <FieldLabel htmlFor="planName">Plan name</FieldLabel>
                                            <Input id="planName" type="text" value={planNameToSave} onChange={(e) => setPlanNameToSave(e.target.value)} />
                                        </Field>
                                        <ParticleButton
                                            onClick={handleSavePlan}
                                            disabled={!planNameToSave.trim()}
                                            icon={<Save />}
                                            pendingLabel="Saving"
                                            successLabel="Saved"
                                            className="h-11 bg-[#fd651e] hover:bg-[#a73a00] md:h-10"
                                        >
                                            Save this plan
                                        </ParticleButton>
                                    </div>
                                </StitchPanel>

                                <ul className="flex flex-col gap-3">
                                    {generatedPlan.plan.map((dailyPlan, index) => {
                                        const isOpen = activeDay === dailyPlan.day;
                                        return (
                                            <li key={dailyPlan.day} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDay(dailyPlan.day)}
                                                    aria-expanded={isOpen}
                                                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fd651e]/40"
                                                >
                                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange-50 text-sm font-semibold tabular-nums text-[#fd651e]">
                                                        {index + 1}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{dailyPlan.day}</span>
                                                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                        <Flame className="size-3.5 text-[#fd651e]" aria-hidden />
                                                        {dailyPlan.daily_summary.calories}
                                                    </span>
                                                    <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} aria-hidden />
                                                </button>
                                                {isOpen && (
                                                    <div className="grid animate-fade-in gap-3 border-t border-border p-4 sm:grid-cols-2">
                                                        {Object.keys(dailyPlan.meals).map((mealType) => {
                                                            const meal = dailyPlan.meals[mealType as keyof typeof dailyPlan.meals];
                                                            return (
                                                                <div key={mealType} className="flex flex-col gap-1 rounded-xl bg-muted/60 p-3">
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mealType}</h4>
                                                                    <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                                                                    <p className="text-sm text-muted-foreground">{meal.description}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </StitchCanvas>
        </AppScreen>
    );
};

export default MealPlannerPage;
