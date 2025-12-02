import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, preferences } = await req.json();
    
    console.log('Received request:', { user, preferences });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const durationText = preferences.duration === 'day' ? '1-day' : '1-week';
    const calorieTarget = preferences.targetCalories || 2000;
    const age = preferences.age || user.age || 25;
    const height = preferences.height || user.height || 170;
    const weight = preferences.weight || user.weight || 70;

    const prompt = `You are a professional nutritionist designing a meal plan for a client in Vietnam.
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
- Eating Style: ${preferences.eatingStyle}. If "Eat Out", suggest specific types of restaurants or dishes to order. If "Cooking", provide simple meal ideas.
- Diet Type: ${preferences.dietType}.
- Allergies: ${preferences.allergies || 'None'}. CRITICAL: Do not include any of these ingredients.
- Dislikes: ${preferences.dislikes || 'None'}. Avoid these ingredients.

Create a balanced ${durationText} meal plan for them that meets the ${calorieTarget} calorie target. 
Use common Vietnamese ingredients and dishes where possible to make it practical.
Provide healthy options for breakfast, lunch, dinner, and one snack per day.
The daily_summary calories should reflect the actual total and should be close to ${calorieTarget}.

Return a JSON object with:
- name: A creative and fitting name for the meal plan (e.g., 'High-Protein Week for Muscle Gain')
- plan: An array of daily meal plans, each containing:
  - day: The day name (e.g., "Monday") or "Day 1"
  - meals: Object with breakfast, lunch, dinner, snacks (each with name and description)
  - daily_summary: Object with calories (e.g., "1800-2000 kcal") and protein (e.g., "120g")`;

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a helpful nutrition assistant. Always respond with valid JSON matching the requested schema." 
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const mealPlan = JSON.parse(content);
    console.log('Meal plan generated successfully');

    return new Response(
      JSON.stringify({ success: true, mealPlan }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
