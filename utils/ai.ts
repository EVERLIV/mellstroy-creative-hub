import { Message, Trainer, MealPlan, DietaryPreferences } from '../types';
import { supabase } from '@/src/integrations/supabase/client';

// Format chat history for the prompt
const formatChatHistory = (chatHistory: Message[]): string => {
  return chatHistory.map(msg => `${msg.sender === 'user' ? 'User' : 'Trainer'}: ${msg.text}`).join('\n');
};

/**
 * Analyzes chat history for scams or illegal content.
 * Note: This function is currently not implemented with Lovable AI.
 * It returns safe by default.
 */
export async function analyzeChat(chatHistory: Message[]): Promise<{ is_safe: boolean; reason: string }> {
    if (chatHistory.length < 2) {
        return { is_safe: true, reason: '' };
    }

    // TODO: Implement with Lovable AI if needed
    return { is_safe: true, reason: '' };
}

/**
 * Generate a meal plan using Lovable AI via edge function
 */
export async function generateMealPlan(user: Trainer, preferences: DietaryPreferences): Promise<Omit<MealPlan, 'id' | 'createdAt' | 'preferences'> | null> {
    try {
        const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
            body: { user, preferences }
        });

        if (error) {
            console.error('Error calling generate-meal-plan function:', error);
            return null;
        }

        if (!data?.success || !data?.mealPlan) {
            console.error('Invalid response from generate-meal-plan:', data);
            return null;
        }

        return data.mealPlan;
    } catch (error) {
        console.error('Error generating meal plan:', error);
        return null;
    }
}

/**
 * Get AI coach response using Lovable AI via edge function
 */
export async function getAICoachResponse(message: string): Promise<string> {
    try {
        const { data, error } = await supabase.functions.invoke('ai-coach-chat', {
            body: { message }
        });

        if (error) {
            console.error('Error calling ai-coach-chat function:', error);
            throw new Error("Failed to get response from AI Coach.");
        }

        if (!data?.success || !data?.message) {
            console.error('Invalid response from ai-coach-chat:', data);
            throw new Error("Failed to get response from AI Coach.");
        }

        return data.message;
    } catch (error) {
        console.error('Error getting AI Coach response:', error);
        throw new Error("Failed to get response from AI Coach.");
    }
}
