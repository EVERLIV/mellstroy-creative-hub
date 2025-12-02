import React, { useState, useCallback } from 'react';
import { Trainer, MealPlan, DietaryPreferences, Duration, EatingStyle, DietType } from '../types';
import { ArrowLeft, UtensilsCrossed, Sparkles, Loader, AlertTriangle, ChevronDown, Save, FilePlus } from 'lucide-react';
import { generateMealPlan } from '../utils/ai';
import { EATING_STYLES, DIET_TYPES } from '../constants';


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

    const handlePrefChange = useCallback((field: keyof DietaryPreferences, value: string) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleGeneratePlan = useCallback(async () => {
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
    }, [user, preferences]);
    
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

    return (
        <div className="bg-background min-h-screen flex flex-col pb-32">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-accent px-4 py-4 relative">
                <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-card/20 hover:bg-card/30 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-primary-foreground" />
                </button>
                <h1 className="text-lg font-semibold text-primary-foreground text-center">AI Meal Planner</h1>
            </div>

            <main className="flex-1 px-4 space-y-4 mt-4 overflow-y-auto">
                {/* Preferences Form */}
                <div className="bg-card p-4 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-foreground mb-3">1. Select Duration</h3>
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

                <div className="bg-card p-4 rounded-2xl shadow-lg space-y-4">
                    <h3 className="font-bold text-foreground">2. Refine Details</h3>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Eating Style</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {EATING_STYLES.map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => handlePrefChange('eatingStyle', style.id)} 
                                    className={`flex-1 text-center px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${preferences.eatingStyle === style.id ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-muted text-foreground'}`}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Dietary Needs</label>
                        <select 
                            value={preferences.dietType} 
                            onChange={(e) => handlePrefChange('dietType', e.target.value)} 
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        >
                            {DIET_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="allergies" className="block text-sm font-medium text-foreground mb-1">Allergies (e.g., peanuts, shellfish)</label>
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
                        <label htmlFor="dislikes" className="block text-sm font-medium text-foreground mb-1">Dislikes (e.g., cilantro, mushrooms)</label>
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
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <> <Loader className="w-5 h-5 mr-2 animate-spin" /> Generating... </>
                    ) : (
                        <> <Sparkles className="w-5 h-5 mr-2" /> Generate My Plan </>
                    )}
                </button>

                {/* Results */}
                <div className="flex-1 pb-6">
                    {error && (
                        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {generatedPlan && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-card p-4 rounded-2xl shadow-lg">
                                <h2 className="text-lg font-bold text-foreground mb-3">Your Meal Plan</h2>
                                <div className="space-y-2">
                                    <label htmlFor="planName" className="block text-sm font-medium text-foreground">Plan Name</label>
                                    <input 
                                        type="text" 
                                        id="planName" 
                                        value={planNameToSave} 
                                        onChange={(e) => setPlanNameToSave(e.target.value)} 
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground" 
                                    />
                                </div>
                                <button 
                                    onClick={handleSavePlan} 
                                    className="mt-3 w-full flex items-center justify-center bg-primary text-primary-foreground font-bold py-2.5 rounded-xl transition-colors hover:bg-primary/90"
                                >
                                    <Save className="w-5 h-5 mr-2" /> Save This Plan
                                </button>
                            </div>
                            {generatedPlan.plan.map((dailyPlan) => (
                                <div key={dailyPlan.day} className="bg-card rounded-2xl shadow-md overflow-hidden">
                                    <button 
                                        onClick={() => toggleDay(dailyPlan.day)} 
                                        className="w-full flex justify-between items-center p-4 font-bold text-foreground hover:bg-muted transition-colors"
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
                                                        <h4 className="font-semibold text-foreground capitalize">{mealType}</h4>
                                                        <div className="text-sm p-3 bg-muted rounded-lg mt-1 border border-border">
                                                            <p className="font-bold text-foreground">{meal.name}</p>
                                                            <p className="text-muted-foreground mt-0.5">{meal.description}</p>
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
