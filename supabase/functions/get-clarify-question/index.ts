import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sessionId, formData } = await req.json();

    const questionEmbedRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: "clarify"
      }),
    });

    const embed = await questionEmbedRes.json();

    const { data: snippets } = await supabase.rpc('match_uploaded_docs', {
      query_embedding: embed.data[0].embedding,
      match_count: 4,
      p_session: sessionId
    });

    const snippetText = (snippets || [])
      .map((s: any) => `${s.file_name} (${s.similarity.toFixed(2)}): ${s.snippet}`)
      .join("\n");

    const systemPrompt = `You are a personal-injury intake assistant.\nYou have access to the following document snippets:\n${snippetText}\n\nGiven the wizard fields already filled:\n${JSON.stringify(formData)}\n\nAsk ONE follow-up question if additional info is needed to compute damages and liability. If nothing else needed, respond with "NO_MORE_QUESTIONS".`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        temperature: 0.3
      })
    });

    const aiData = await aiRes.json();
    const assistantMsg = aiData.choices[0].message.content.trim();

    return new Response(JSON.stringify({ question: assistantMsg }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
