import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdf from "npm:pdf-parse";
import mammoth from "npm:mammoth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function extractText(buffer: Uint8Array, mime: string): Promise<string> {
  if (mime.includes("pdf")) {
    const data = await pdf(buffer);
    return data.text;
  } else if (mime.includes("docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return new TextDecoder().decode(buffer);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const form = await req.formData();
    const caseSessionId = form.get("caseSessionId")?.toString() ?? "";
    const files = form.getAll("files") as File[];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const path = `${caseSessionId}/${Date.now()}-${file.name}`;

      await supabase.storage
        .from("case_uploads")
        .upload(path, buffer, { contentType: file.type });

      const text = await extractText(buffer, file.type);

      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text.slice(0, 8000),
        }),
      });

      const embedData = await embedRes.json();
      const embedding = embedData.data[0].embedding as number[];

      await supabase.from("uploaded_docs").insert({
        case_session_id: caseSessionId,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type,
        text_content: text.slice(0, 1000),
        embedding,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
