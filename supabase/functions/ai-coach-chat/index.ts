// @ts-nocheck - Deno runtime
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
    const { message } = await req.json();
    
    console.log('Received AI coach message:', message);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Create Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.81.0');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    // Get user from auth header
    const { data: { user } } = await supabase.auth.getUser();
    
    // Load user's AI coach profile if exists
    let userProfile = null;
    if (user) {
      const { data } = await supabase
        .from('ai_coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      userProfile = data;
      console.log('Loaded user AI coach profile:', userProfile);
    }

    // Build system instruction with user profile context
    let systemInstruction = `You are a friendly and knowledgeable AI Fitness Coach for 'RhinoFit', a platform in Vietnam. Your goal is to provide supportive, safe, and personalized fitness, nutrition, and wellness advice.
`;

    // Add user profile context if available
    if (userProfile) {
      systemInstruction += `\n**USER PROFILE CONTEXT:**\n`;
      if (userProfile.fitness_level) {
        systemInstruction += `- Fitness Level: ${userProfile.fitness_level}\n`;
      }
      if (userProfile.goals && userProfile.goals.length > 0) {
        systemInstruction += `- Goals: ${userProfile.goals.join(', ')}\n`;
      }
      if (userProfile.equipment_access) {
        systemInstruction += `- Equipment Access: ${userProfile.equipment_access}\n`;
      }
      if (userProfile.training_days_per_week) {
        systemInstruction += `- Training Days Per Week: ${userProfile.training_days_per_week}\n`;
      }
      if (userProfile.dietary_restrictions && userProfile.dietary_restrictions.length > 0) {
        systemInstruction += `- Dietary Restrictions: ${userProfile.dietary_restrictions.join(', ')}\n`;
      }
      if (userProfile.health_limitations) {
        systemInstruction += `- Health Limitations: ${userProfile.health_limitations}\n`;
      }
      if (userProfile.preferred_training_time) {
        systemInstruction += `- Preferred Training Time: ${userProfile.preferred_training_time}\n`;
      }
      systemInstruction += `\nUse this profile information to provide personalized advice. DO NOT ask for information that is already in the profile. If the user's question relates to something in their profile, reference it directly.\n\n`;
    }

    systemInstruction += `CRITICAL: ALWAYS ASK CLARIFYING QUESTIONS FOR GENERAL INQUIRIES
When a user asks a general or broad question, DO NOT provide a generic answer. Instead:
1. Acknowledge their question warmly
2. Ask 2-4 specific clarifying questions to understand their:
   - Current fitness level or experience
   - Specific goals or challenges
   - Available equipment or location preferences
   - Time constraints or schedule
   - Any limitations or health considerations
3. Wait for their response before providing personalized advice

Examples:
User: "How do I build muscle?"
YOU: "Great question! I'd love to help you with a personalized muscle-building plan. Let me ask you a few things first:

**About You:**
• What's your current fitness level? (Beginner/Intermediate/Advanced)
• Do you have access to a gym, or will you be training at home?
• How many days per week can you commit to training?
• Are there any muscle groups you want to focus on specifically?

Once I know this, I can create a plan that's perfect for you!"

User: "What should I eat?"
YOU: "I'd love to help you with nutrition! To give you the best advice, I need to know:

**Your Goals:**
• Are you trying to lose weight, gain muscle, or maintain your current weight?
• Do you have any dietary restrictions or allergies?
• Do you prefer cooking at home or eating out?
• What's your typical daily routine like?

Tell me more so I can recommend meals that fit your lifestyle!"

ONLY provide detailed advice AFTER the user has answered your clarifying questions.

IMPORTANT FORMATTING RULES:
- Structure your responses with clear paragraphs separated by double line breaks (\n\n)
- Use bullet points with • for lists of questions or options
- Use numbered lists (1. 2. 3.) for sequential steps when giving final advice
- Use **bold text** for section headers and emphasis
- Keep paragraphs concise (2-4 sentences each)
- Always start with a warm, encouraging tone

Always include this disclaimer at the end of your very first message: 'Remember, I'm an AI coach, not a doctor. Always consult a healthcare professional before starting any new fitness or diet plan.'

When suggesting exercises or foods, incorporate options that are common or accessible in Vietnam. Do not provide medical advice.`;

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
          { role: "system", content: systemInstruction },
          { role: "user", content: message }
        ],
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
    
    const aiMessage = data.choices?.[0]?.message?.content;
    if (!aiMessage) {
      throw new Error("No content in AI response");
    }

    return new Response(
      JSON.stringify({ success: true, message: aiMessage }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in ai-coach-chat function:', error);
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
