import React, { useState } from 'react';
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
        <div className="bg-slate-50 min-h-screen flex flex-col pb-24">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-pink-500 pt-6 pb-8 px-4 relative">
                <button onClick={onClose} className="absolute top-6 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div className="max-w-2xl mx-auto pt-8">
                    <h1 className="text-2xl font-bold text-white flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 mr-2" />
                        AI Meal Planner
                    </h1>
                    <p className="text-white/90 text-sm mt-1 text-center">Create personalized meal plans with AI</p>
                </div>
            </div>

            <main className="flex-1 px-4 space-y-4 -mt-4 overflow-y-auto">
                {/* Preferences Form */}
                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60">
                    <h3 className="font-bold text-slate-900 mb-3">1. Select Duration</h3>
                    <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
                        {(['day', 'week', 'month'] as Duration[]).map(d => (
                            <button
                                key={d}
                                onClick={() => handlePrefChange('duration', d)}
                                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${preferences.duration === d ? 'bg-[#FF6B35] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                {d === 'day' && '1 Day'}
                                {d === 'week' && '1 Week'}
                                {d === 'month' && '1 Month'}
                            </button>
                        ))}
                    </div>
                    {preferences.duration === 'month' && (
                        <p className="text-xs text-slate-500 mt-2 text-center">We'll generate a sample 1-week plan for you to follow.</p>
                    )}
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60 space-y-4">
                    <h3 className="font-bold text-slate-900">2. Refine Details</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Eating Style</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {EATING_STYLES.map(style => (
                                <button 
                                    key={style.id} 
                                    onClick={() => handlePrefChange('eatingStyle', style.id)} 
                                    className={`flex-1 text-center px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-colors ${preferences.eatingStyle === style.id ? 'bg-orange-50 border-[#FF6B35] text-[#FF6B35]' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Needs</label>
                        <select 
                            value={preferences.dietType} 
                            onChange={(e) => handlePrefChange('dietType', e.target.value)} 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-slate-900"
                        >
                            {DIET_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="allergies" className="block text-sm font-medium text-slate-700 mb-1">Allergies (e.g., peanuts, shellfish)</label>
                        <input 
                            type="text" 
                            id="allergies" 
                            value={preferences.allergies} 
                            onChange={(e) => handlePrefChange('allergies', e.target.value)} 
                            placeholder="Comma-separated" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-slate-900 placeholder:text-slate-400" 
                        />
                    </div>
                    <div>
                        <label htmlFor="dislikes" className="block text-sm font-medium text-slate-700 mb-1">Dislikes (e.g., cilantro, mushrooms)</label>
                        <input 
                            type="text" 
                            id="dislikes" 
                            value={preferences.dislikes} 
                            onChange={(e) => handlePrefChange('dislikes', e.target.value)} 
                            placeholder="Comma-separated" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-slate-900 placeholder:text-slate-400" 
                        />
                    </div>
                </div>
                
                <button 
                    onClick={handleGeneratePlan} 
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    {generatedPlan && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/60">
                                <h2 className="text-lg font-bold text-slate-900 mb-3">Your Meal Plan</h2>
                                <div className="space-y-2">
                                    <label htmlFor="planName" className="block text-sm font-medium text-slate-700">Plan Name</label>
                                    <input 
                                        type="text" 
                                        id="planName" 
                                        value={planNameToSave} 
                                        onChange={(e) => setPlanNameToSave(e.target.value)} 
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] text-slate-900" 
                                    />
                                </div>
                                <button 
                                    onClick={handleSavePlan} 
                                    className="mt-3 w-full flex items-center justify-center bg-[#FF6B35] text-white font-bold py-2.5 rounded-xl transition-colors hover:bg-orange-600"
                                >
                                    <Save className="w-5 h-5 mr-2" /> Save This Plan
                                </button>
                            </div>
                            {generatedPlan.plan.map((dailyPlan) => (
                                <div key={dailyPlan.day} className="bg-white rounded-2xl shadow-md shadow-slate-200/60 overflow-hidden">
                                    <button 
                                        onClick={() => toggleDay(dailyPlan.day)} 
                                        className="w-full flex justify-between items-center p-4 font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                                    >
                                        <span>{dailyPlan.day}</span>
                                        <div className="flex items-center text-xs text-slate-500 font-medium">
                                            <span>{dailyPlan.daily_summary.calories}</span>
                                            <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${activeDay === dailyPlan.day ? 'rotate-180' : ''}`}/>
                                        </div>
                                    </button>
                                    {activeDay === dailyPlan.day && (
                                        <div className="p-4 border-t border-slate-200 space-y-3 animate-fade-in">
                                            {Object.keys(dailyPlan.meals).map((mealType) => {
                                                const meal = dailyPlan.meals[mealType as keyof typeof dailyPlan.meals];
                                                return (
                                                    <div key={mealType}>
                                                        <h4 className="font-semibold text-slate-700 capitalize">{mealType}</h4>
                                                        <div className="text-sm p-3 bg-slate-50 rounded-lg mt-1 border border-slate-200">
                                                            <p className="font-bold text-slate-900">{meal.name}</p>
                                                            <p className="text-slate-600 mt-0.5">{meal.description}</p>
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
