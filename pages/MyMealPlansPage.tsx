import React, { useState } from 'react';
import { MealPlan } from '../types';
import { ArrowLeft, ChevronDown, UtensilsCrossed, Trash2, Calendar } from 'lucide-react';

interface MyMealPlansPageProps {
    plans: MealPlan[];
    onDelete: (planId: number) => void;
    onBack: () => void;
}

const MyMealPlansPage: React.FC<MyMealPlansPageProps> = ({ plans, onDelete, onBack }) => {
    const [activePlanId, setActivePlanId] = useState<number | null>(null);

    const togglePlan = (planId: number) => {
        setActivePlanId(prev => (prev === planId ? null : planId));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-slate-50 h-full animate-fade-in flex flex-col relative">
            <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>

            <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-20 pt-20">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center justify-center mb-4">
                    <UtensilsCrossed className="w-6 h-6 mr-2 text-purple-600" />
                    My Meal Plans
                </h1>

                {plans.length > 0 ? (
                    plans.map(plan => (
                        <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="p-4 flex justify-between items-start">
                                <div className="flex-1">
                                    <h2 className="font-bold text-slate-800">{plan.name}</h2>
                                    <div className="flex items-center text-xs text-slate-500 mt-1">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        <span>Saved on {formatDate(plan.createdAt)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{plan.preferences.dietType}</span>
                                        <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">{plan.preferences.eatingStyle}</span>
                                    </div>
                                </div>
                                <div className="flex items-center ml-2">
                                     <button onClick={() => onDelete(plan.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => togglePlan(plan.id)} className="p-2 text-slate-500 hover:text-slate-800">
                                        <ChevronDown className={`w-5 h-5 transition-transform ${activePlanId === plan.id ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            </div>
                            
                            {activePlanId === plan.id && (
                                <div className="p-4 border-t border-slate-200 space-y-3 animate-fade-in-fast">
                                    {plan.plan.map(dailyPlan => (
                                        <div key={dailyPlan.day} className="p-3 bg-slate-50 rounded-lg">
                                            <h3 className="font-bold text-slate-700 mb-2">{dailyPlan.day}</h3>
                                             <div className="space-y-2">
                                                {Object.keys(dailyPlan.meals).map((mealType) => {
                                                    const meal = dailyPlan.meals[mealType as keyof typeof dailyPlan.meals];
                                                    return (
                                                        <div key={mealType}>
                                                            <h4 className="font-semibold text-xs text-slate-500 capitalize">{mealType}</h4>
                                                            <div className="text-sm">
                                                                <p className="font-medium text-slate-800">{meal.name}</p>
                                                                <p className="text-slate-600 text-xs">{meal.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center mt-20">
                        <UtensilsCrossed className="w-16 h-16 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600 mt-4">No Saved Meal Plans</p>
                        <p className="text-sm text-slate-400 mt-2">
                            Generate a plan with the AI Meal Planner and save it to see it here.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyMealPlansPage;
