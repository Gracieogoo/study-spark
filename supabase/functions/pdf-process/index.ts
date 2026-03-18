import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, action } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!pdfBase64) throw new Error("No PDF data provided");
    if (!action || !["summarize", "quiz", "flashcards"].includes(action)) {
      throw new Error("Invalid action. Must be 'summarize', 'quiz', or 'flashcards'");
    }

    let systemPrompt: string;
    if (action === "summarize") {
      systemPrompt = `You are a study assistant. Summarize the provided PDF document clearly and concisely. Structure your summary with:
- A brief overview (2-3 sentences)
- Key points as bullet points
- Important terms or concepts highlighted

Use markdown formatting for readability.`;
    } else if (action === "quiz") {
      systemPrompt = `You are a quiz generator for students. Based on the provided PDF document, create exactly 5 multiple-choice quiz questions that test understanding of the content. Each question should have 4 options with exactly one correct answer.

Return ONLY valid JSON in this exact format, no other text:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0},...]

The correctIndex is 0-based (0-3). Make questions that genuinely test comprehension, not just memorization.`;
    } else {
      systemPrompt = `You are a flashcard generator for students. Based on the provided PDF document, create 10-15 flashcards that cover the most important concepts, definitions, and facts.

Return ONLY valid JSON in this exact format, no other text:
[{"front":"Question or term","back":"Answer or definition"},...]

Make flashcards that test understanding — use clear, concise language on both sides.`;
    }

    const textPrompt = 
      action === "summarize"
        ? "Please summarize this PDF document."
        : action === "quiz"
        ? "Please generate a quiz from this PDF document."
        : "Please generate flashcards from this PDF document.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBase64
                  }
                },
                {
                  text: textPrompt
                }
              ]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status} ${t}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (action === "summarize") {
      return new Response(JSON.stringify({ summary: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON (quiz or flashcards)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    const parsed = JSON.parse(jsonStr);

    if (action === "quiz") {
      return new Response(JSON.stringify({ questions: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ flashcards: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pdf-process error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
