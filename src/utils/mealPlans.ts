import { supabase } from '../integrations/supabase/client';
import { MealPlan } from '../../types';

export const saveMealPlan = async (
  userId: string,
  plan: Omit<MealPlan, 'id' | 'createdAt'>
): Promise<MealPlan | null> => {
  try {
    // Using localStorage fallback as meal_plans table doesn't exist yet
    const savedPlans = JSON.parse(localStorage.getItem(`meal_plans_${userId}`) || '[]');
    const newPlan: MealPlan = {
      id: Date.now(),
      name: plan.name,
      createdAt: new Date().toISOString(),
      plan: plan.plan,
      preferences: plan.preferences,
    };
    savedPlans.push(newPlan);
    localStorage.setItem(`meal_plans_${userId}`, JSON.stringify(savedPlans));
    return newPlan;
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

export const loadMealPlans = async (userId: string): Promise<MealPlan[]> => {
  try {
    // Using localStorage as meal_plans table doesn't exist yet
    const savedPlans = JSON.parse(localStorage.getItem(`meal_plans_${userId}`) || '[]');
    return savedPlans;
  } catch (error) {
    console.error('Error loading meal plans:', error);
    return [];
  }
};

