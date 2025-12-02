import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Message, Trainer, MealPlan, DietaryPreferences } from '../types';

// Format chat history for the prompt
const formatChatHistory = (chatHistory: Message[]): string => {
  return chatHistory.map(msg => `${msg.sender === 'user' ? 'User' : 'Trainer'}: ${msg.text}`).join('\n');
};

// Define the expected JSON schema for the AI response
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        is_safe: {
            type: Type.BOOLEAN,
            description: "True if the conversation is safe, false otherwise."
        },
        reason: {
            type: Type.STRING,
            description: "A brief explanation if the conversation is not safe. Empty string if it is safe."
        }
    },
    required: ['is_safe', 'reason']
};

/**
 * Analyzes chat history for scams or illegal content using Gemini.
 * @param chatHistory The array of chat messages.
 * @returns A promise that resolves to an object with is_safe and reason.
 */
export async function analyzeChat(chatHistory: Message[]): Promise<{ is_safe: boolean; reason: string }> {
    if (chatHistory.length < 2) { // Don't run on very short chats
        return { is_safe: true, reason: '' };
    }

    try {
        // Assume process.env.API_KEY is available and configured elsewhere.
        // Instantiating the client here prevents issues with hot-reloading environments.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const prompt = formatChatHistory(chatHistory);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a security AI for a fitness platform. Analyze this chat for scams, fraud, illegal activities, or policy violations (like sharing personal contact info such as phone numbers or emails to transact off-platform). Respond ONLY with a JSON object: {\"is_safe\": boolean, \"reason\": \"explanation if not safe\"}. If safe, reason is an empty string.",
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // Basic validation of the parsed object
        if (typeof result.is_safe === 'boolean' && typeof result.reason === 'string') {
            return result;
        } else {
            console.error("AI response has incorrect schema:", result);
            return { is_safe: true, reason: '' }; // Default to safe on schema error
        }

    } catch (error) {
        console.error("Error analyzing chat with Gemini:", error);
        // Default to safe in case of API error to avoid false positives
        return { is_safe: true, reason: '' };
    }
}

// For Meal Plan
const mealPlanSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "A creative and fitting name for the meal plan, e.g., 'High-Protein Week for Muscle Gain'." },
        plan: {
            type: Type.ARRAY,
            description: "An array of daily meal plans.",
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "The day of the week (e.g., Monday) or Day number (e.g., Day 1)." },
                    meals: {
                        type: Type.OBJECT,
                        properties: {
                            breakfast: {
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                                required: ['name', 'description']
                            },
                            lunch: {
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                                required: ['name', 'description']
                            },
                            dinner: {
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                                required: ['name', 'description']
                            },
                            snacks: {
                                type: Type.OBJECT,
                                properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
                                required: ['name', 'description']
                            }
                        },
                        required: ['breakfast', 'lunch', 'dinner', 'snacks']
                    },
                    daily_summary: {
                        type: Type.OBJECT,
                        properties: {
                            calories: { type: Type.STRING, description: "Approximate total calories for the day (e.g., '1800-2000 kcal')." },
                            protein: { type: Type.STRING, description: "Approximate total protein for the day (e.g., '120g')." }
                        },
                        required: ['calories', 'protein']
                    }
                },
                required: ['day', 'meals', 'daily_summary']
            }
        }
    },
    required: ['name', 'plan']
};


export async function generateMealPlan(user: Trainer, preferences: DietaryPreferences): Promise<Omit<MealPlan, 'id' | 'createdAt' | 'preferences'> | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const durationText = preferences.duration === 'day' ? '1-day' : '1-week';

    // Determine calorie target
    const calorieTarget = preferences.targetCalories || 2000; // Default if not provided
    const age = preferences.age || user.age || 25;
    const height = preferences.height || user.height || 170;
    const weight = preferences.weight || user.weight || 70;

    const prompt = `
        You are a professional nutritionist designing a meal plan for a client in Vietnam.
        The client's details are:
        - Age: ${age}
        - Height: ${height} cm
        - Weight: ${weight} kg
        - Gender: ${preferences.gender || 'not specified'}
        - Activity Level: ${preferences.activityLevel || 'moderate'}
        - Primary fitness goals: ${user.goals?.join(', ') || 'general health'}

        CALORIE TARGET: ${calorieTarget} calories per day
        This is CRITICAL - the meal plan MUST be designed to match this calorie target as closely as possible.

        Their dietary preferences are:
        - Eating Style: ${preferences.eatingStyle}. If "Eating Out", suggest specific types of restaurants or dishes to order. If "Cooking", provide simple meal ideas.
        - Diet Type: ${preferences.dietType}.
        - Allergies: ${preferences.allergies || 'None'}. CRITICAL: Do not include any of these ingredients.
        - Dislikes: ${preferences.dislikes || 'None'}. Avoid these ingredients.

        Create a balanced ${durationText} meal plan for them that meets the ${calorieTarget} calorie target. 
        Use common Vietnamese ingredients and dishes where possible to make it practical.
        Provide healthy options for breakfast, lunch, dinner, and one snack per day.
        The daily_summary calories should reflect the actual total and should be close to ${calorieTarget}.
        The output must be ONLY a JSON object matching the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a helpful nutrition assistant that provides meal plans in JSON format.",
                responseMimeType: "application/json",
                responseSchema: mealPlanSchema,
            },
        });
        
        const jsonString = response.text.trim();
        const result: Omit<MealPlan, 'id' | 'createdAt' | 'preferences'> = JSON.parse(jsonString);

        if (result.plan && Array.isArray(result.plan)) {
            return result;
        } else {
            console.error("AI meal plan response has incorrect schema:", result);
            return null;
        }

    } catch (error) {
        console.error("Error generating meal plan with Gemini:", error);
        return null;
    }
}


// AI Coach Chat
let aiCoachChat: Chat | null = null;

const initializeAICoach = () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const systemInstruction = `You are a friendly and knowledgeable AI Fitness Coach for 'RhinoFit', a platform in Vietnam. Your goal is to provide supportive, safe, and general fitness, nutrition, and wellness advice. Use an encouraging and positive tone. Always include this disclaimer at the end of your very first message: 'Remember, I'm an AI coach, not a doctor. Always consult a healthcare professional before starting any new fitness or diet plan.' When suggesting exercises or foods, try to incorporate options that are common or accessible in Vietnam. Do not provide medical advice. Keep your responses concise and easy to read on a mobile phone.`;
    
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction,
        }
    });
};

export async function getAICoachResponse(message: string): Promise<string> {
    if (!aiCoachChat) {
        aiCoachChat = initializeAICoach();
    }

    try {
        const response = await aiCoachChat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error getting AI Coach response:", error);
        // Reset chat on error
        aiCoachChat = null;
        throw new Error("Failed to get response from AI Coach.");
    }
}