import { supabase } from '../integrations/supabase/client';
import { MealPlan, DailyPlan, DietaryPreferences } from '../../types';

export const saveMealPlan = async (
  userId: string,
  plan: Omit<MealPlan, 'id' | 'createdAt'>
): Promise<MealPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .insert([{
        user_id: userId,
        name: plan.name,
        plan_data: plan.plan as unknown as any,
        preferences: plan.preferences as unknown as any,
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      plan: data.plan_data as unknown as DailyPlan[],
      preferences: data.preferences as unknown as DietaryPreferences,
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

    if (error) throw error;
    if (!data) return [];

    return data.map(plan => ({
      id: plan.id,
      name: plan.name,
      createdAt: plan.created_at,
      plan: plan.plan_data as unknown as DailyPlan[],
      preferences: plan.preferences as unknown as DietaryPreferences,
    }));
  } catch (error) {
    console.error('Error loading meal plans:', error);
    return [];
  }
};

