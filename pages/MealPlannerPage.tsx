import React, { useState, useCallback, useMemo } from 'react';
import { Trainer, MealPlan, DietaryPreferences, Duration, EatingStyle, DietType, Gender, ActivityLevel } from '../types';
import { ArrowLeft, UtensilsCrossed, Sparkles, Loader, AlertTriangle, ChevronDown, Save, Calculator } from 'lucide-react';
import { generateMealPlan } from '../utils/ai';
import { EATING_STYLES, DIET_TYPES } from '../constants';
import { calculateTDEE, getActivityLevelDescription } from '../utils/calorieCalculator';


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
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: 'male',
        activityLevel: 'moderate',
    });
    const [useManualCalories, setUseManualCalories] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<Omit<MealPlan, 'id' | 'createdAt' | 'preferences'> | null>(null);
    const [planNameToSave, setPlanNameToSave] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDay, setActiveDay] = useState<string | null>(null);

    const handlePrefChange = useCallback((field: keyof DietaryPreferences, value: string | number) => {
        setPreferences(prev => {
            // Handle numeric fields
            if (field === 'age' || field === 'weight' || field === 'height' || field === 'targetCalories') {
                const numValue = typeof value === 'string' ? parseFloat(value) : value;
                return { ...prev, [field]: isNaN(numValue) ? undefined : numValue };
            }
            // Handle string fields
            return { ...prev, [field]: value };
        });
    }, []);

    // Calculate recommended calories based on user data
    const calculatedCalories = useMemo(() => {
        if (preferences.age && preferences.weight && preferences.height && preferences.gender && preferences.activityLevel) {
            return calculateTDEE(
                preferences.weight,
                preferences.height,
                preferences.age,
                preferences.gender,
                preferences.activityLevel
            );
        }
        return null;
    }, [preferences.age, preferences.weight, preferences.height, preferences.gender, preferences.activityLevel]);

    // Use manual or calculated calories
    const effectiveCalories = useManualCalories 
        ? preferences.targetCalories 
        : calculatedCalories;

    const handleGeneratePlan = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedPlan(null);
        setActiveDay(null);
        
        try {
            // Set targetCalories based on manual or calculated
            const prefsWithCalories: DietaryPreferences = {
                ...preferences,
                targetCalories: effectiveCalories || undefined,
            };
            
            const plan = await generateMealPlan(user, prefsWithCalories);
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
    }, [user, preferences, effectiveCalories]);
    
    const handleSavePlan = useCallback(() => {
        if (generatedPlan && planNameToSave.trim()) {
            onSavePlan({
                ...generatedPlan,
                name: planNameToSave.trim(),
                preferences,
            });
        }
    }, [generatedPlan, planNameToSave, preferences, onSavePlan]);

    const toggleDay = useCallback((day: string) => {
        setActiveDay(prev => (prev === day ? null : day));
    }, []);

    const activityLevels: { id: ActivityLevel; label: string }[] = [
        { id: 'sedentary', label: 'Sedentary' },
        { id: 'light', label: 'Light' },
        { id: 'moderate', label: 'Moderate' },
        { id: 'very_active', label: 'Very Active' },
        { id: 'extremely_active', label: 'Extremely Active' },
    ];

    return (
        <div className="bg-background h-[100dvh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-accent px-4 py-4 relative flex-shrink-0">
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-card/20 hover:bg-card/30 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-primary-foreground" />
                </button>
                <h1 className="text-lg font-semibold text-primary-foreground text-center">AI Meal Planner</h1>
            </div>

            <main className="flex-1 px-4 space-y-4 py-4 overflow-y-auto min-h-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                {/* Calorie Calculator Section */}
                <div className="bg-card p-4 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Calorie Calculator</h3>
                </div>
                    
                    {/* Personal Details */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Age</label>
                            <input 
                                type="number" 
                                value={preferences.age || ''} 
                                onChange={(e) => handlePrefChange('age', e.target.value)} 
                                placeholder="25" 
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Gender</label>
                            <select 
                                value={preferences.gender || 'male'} 
                                onChange={(e) => handlePrefChange('gender', e.target.value)} 
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Weight (kg)</label>
                            <input 
                                type="number" 
                                value={preferences.weight || ''} 
                                onChange={(e) => handlePrefChange('weight', e.target.value)} 
                                placeholder="70" 
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Height (cm)</label>
                            <input 
                                type="number" 
                                value={preferences.height || ''} 
                                onChange={(e) => handlePrefChange('height', e.target.value)} 
                                placeholder="170" 
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-medium text-foreground mb-1">Activity Level</label>
                        <select 
                            value={preferences.activityLevel || 'moderate'} 
                            onChange={(e) => handlePrefChange('activityLevel', e.target.value)} 
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                        >
                            {activityLevels.map(level => (
                                <option key={level.id} value={level.id}>
                                    {level.label} - {getActivityLevelDescription(level.id)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Calculated Calories Display */}
                    {calculatedCalories && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Recommended Daily Calories</p>
                                    <p className="text-xl font-bold text-primary">{calculatedCalories} <span className="text-sm">kcal</span></p>
                                </div>
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                    )}

                    {/* Manual Override Option */}
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-foreground">Set custom calorie target</label>
                        <button
                            onClick={() => setUseManualCalories(!useManualCalories)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                useManualCalories 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            {useManualCalories ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    {useManualCalories && (
                        <div>
                            <label className="block text-xs font-medium text-foreground mb-1">Target Calories (kcal/day)</label>
                            <input 
                                type="number" 
                                value={preferences.targetCalories || ''} 
                                onChange={(e) => handlePrefChange('targetCalories', e.target.value)} 
                                placeholder={calculatedCalories?.toString() || '2000'} 
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Duration Selection */}
                <div className="bg-card p-4 rounded-2xl shadow-lg">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Plan Duration</h3>
                    <div className="bg-muted p-1 rounded-xl grid grid-cols-3 gap-1">
                        {(['day', 'week', 'month'] as Duration[]).map(d => (
                            <button
                                key={d}
                                onClick={() => handlePrefChange('duration', d)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${preferences.duration === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {d === 'day' && '1 Day'}
                                {d === 'week' && '1 Week'}
                                {d === 'month' && '1 Month'}
                            </button>
                        ))}
                    </div>
                    {preferences.duration === 'month' && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">We'll generate a sample 1-week plan for you to follow.</p>
                    )}
                </div>

                {/* Dietary Preferences */}
                <div className="bg-card p-4 rounded-2xl shadow-lg space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Dietary Preferences</h3>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-2">Eating Style</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {EATING_STYLES.map(style => (
                            <button 
                                key={style.id} 
                                onClick={() => handlePrefChange('eatingStyle', style.id)} 
                                className={`flex-1 text-center px-3 py-2 text-xs font-medium rounded-lg border-2 transition-colors ${preferences.eatingStyle === style.id ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-muted text-foreground'}`}
                            >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-2">Dietary Needs</label>
                        <select 
                            value={preferences.dietType} 
                            onChange={(e) => handlePrefChange('dietType', e.target.value)} 
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                        >
                            {DIET_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="allergies" className="block text-xs font-medium text-foreground mb-1">Allergies (e.g., peanuts, shellfish)</label>
                        <input 
                            type="text" 
                            id="allergies" 
                            value={preferences.allergies} 
                            onChange={(e) => handlePrefChange('allergies', e.target.value)} 
                            placeholder="Comma-separated" 
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground" 
                        />
                    </div>
                    <div>
                        <label htmlFor="dislikes" className="block text-xs font-medium text-foreground mb-1">Dislikes (e.g., cilantro, mushrooms)</label>
                        <input 
                            type="text" 
                            id="dislikes" 
                            value={preferences.dislikes} 
                            onChange={(e) => handlePrefChange('dislikes', e.target.value)} 
                            placeholder="Comma-separated" 
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground" 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleGeneratePlan} 
                    disabled={isLoading || !effectiveCalories}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <> <Loader className="w-5 h-5 mr-2 animate-spin" /> Generating... </>
                    ) : (
                        <> <Sparkles className="w-5 h-5 mr-2" /> Generate {effectiveCalories ? `${effectiveCalories} kcal` : ''} Plan </>
                    )}
                </button>
                
                {!effectiveCalories && (
                    <p className="text-xs text-destructive text-center">Please fill in your personal details to calculate calories</p>
                )}

                {/* Results */}
                <div className="flex-1">
                    {error && (
                        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {generatedPlan && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-card p-4 rounded-2xl shadow-lg">
                                <h2 className="text-base font-semibold text-foreground mb-3">Your Meal Plan</h2>
                                <div className="space-y-2">
                                    <label htmlFor="planName" className="block text-xs font-medium text-foreground">Plan Name</label>
                                    <input 
                                        type="text" 
                                        id="planName" 
                                        value={planNameToSave} 
                                        onChange={(e) => setPlanNameToSave(e.target.value)} 
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                                    />
                                </div>
                                <button 
                                    onClick={handleSavePlan} 
                                    className="mt-3 w-full flex items-center justify-center bg-primary text-primary-foreground font-semibold text-sm py-2.5 rounded-xl transition-colors hover:bg-primary/90"
                                >
                                    <Save className="w-5 h-5 mr-2" /> Save This Plan
                                </button>
                            </div>
                            {generatedPlan.plan.map((dailyPlan) => (
                                <div key={dailyPlan.day} className="bg-card rounded-2xl shadow-md overflow-hidden">
                                    <button 
                                        onClick={() => toggleDay(dailyPlan.day)} 
                                        className="w-full flex justify-between items-center p-4 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                                    >
                                        <span>{dailyPlan.day}</span>
                                        <div className="flex items-center text-xs text-muted-foreground font-medium">
                                            <span>{dailyPlan.daily_summary.calories}</span>
                                            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${activeDay === dailyPlan.day ? 'rotate-180' : ''}`}/>
                                        </div>
                                    </button>
                                    {activeDay === dailyPlan.day && (
                                        <div className="p-4 border-t border-border space-y-3 animate-fade-in">
                                            {Object.keys(dailyPlan.meals).map((mealType) => {
                                                const meal = dailyPlan.meals[mealType as keyof typeof dailyPlan.meals];
                                                return (
                                                    <div key={mealType}>
                                                        <h4 className="text-xs font-semibold text-foreground capitalize">{mealType}</h4>
                                                        <div className="text-sm p-3 bg-muted rounded-lg mt-1 border border-border">
                                                            <p className="text-sm font-semibold text-foreground">{meal.name}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MealPlannerPage;
