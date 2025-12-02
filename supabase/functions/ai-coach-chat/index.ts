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

    const systemInstruction = `You are a friendly and knowledgeable AI Fitness Coach for 'RhinoFit', a platform in Vietnam. Your goal is to provide supportive, safe, and general fitness, nutrition, and wellness advice. Use an encouraging and positive tone.

IMPORTANT FORMATTING RULES:
- Structure your responses with clear paragraphs separated by double line breaks (\n\n)
- Use bullet points with • for lists of items or tips
- Use numbered lists (1. 2. 3.) for sequential steps or instructions
- Use **bold text** for emphasis on key terms or important points
- Keep paragraphs concise (2-4 sentences each)
- Start with a friendly greeting or acknowledgment
- End with an encouraging statement or call to action

Example format:
Hi there! Great question about building muscle.

**Key Principles:**
• Progressive overload - gradually increase weight/reps
• Protein intake - aim for 1.6-2.2g per kg of body weight
• Rest and recovery - muscles grow during rest, not in the gym

**Sample Weekly Split:**
1. Monday: Chest and triceps
2. Wednesday: Back and biceps  
3. Friday: Legs and shoulders

Remember to start slowly and listen to your body. Consistency is more important than intensity!

Always include this disclaimer at the end of your very first message: 'Remember, I'm an AI coach, not a doctor. Always consult a healthcare professional before starting any new fitness or diet plan.'

When suggesting exercises or foods, try to incorporate options that are common or accessible in Vietnam. Do not provide medical advice. Keep your responses concise and easy to read on a mobile phone.`;

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
