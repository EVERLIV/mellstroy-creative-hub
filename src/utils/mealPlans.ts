import { supabase } from '../integrations/supabase/client';
import { MealPlan } from '../../types';

export const saveMealPlan = async (
  userId: string,
  plan: Omit<MealPlan, 'id' | 'createdAt'>
): Promise<MealPlan | null> => {
  try {
    // Check if meal_plans table exists, if not, use localStorage as fallback
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        name: plan.name,
        plan_data: plan.plan,
        preferences: plan.preferences,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, fallback to localStorage
      if (error.code === '42P01') {
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
      }
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      plan: data.plan_data,
      preferences: data.preferences,
    };
  } catch (error) {
    console.error('Error saving meal plan:', error);
    throw error;
  }
};

export const loadMealPlans = async (userId: string): Promise<MealPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, fallback to localStorage
      if (error.code === '42P01') {
        const savedPlans = JSON.parse(localStorage.getItem(`meal_plans_${userId}`) || '[]');
        return savedPlans;
      }
      throw error;
    }

    return (data || []).map(plan => ({
      id: plan.id,
      name: plan.name,
      createdAt: plan.created_at,
      plan: plan.plan_data,
      preferences: plan.preferences,
    }));
  } catch (error) {
    console.error('Error loading meal plans:', error);
    // Fallback to localStorage
    const savedPlans = JSON.parse(localStorage.getItem(`meal_plans_${userId}`) || '[]');
    return savedPlans;
  }
};

