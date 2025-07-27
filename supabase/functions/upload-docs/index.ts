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

  console.log("upload-docs function called");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    
    console.log("Environment variables check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenaiKey: !!openaiKey
    });

    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const form = await req.formData();
    const caseSessionId = form.get("caseSessionId")?.toString() ?? "";
    const files = form.getAll("files") as File[];
    
    console.log("Processing upload:", {
      caseSessionId,
      fileCount: files.length,
      fileNames: files.map(f => f.name)
    });

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const path = `${caseSessionId}/${Date.now()}-${file.name}`;

        const uploadRes = await supabase.storage
          .from("case_uploads")
          .upload(path, buffer, { contentType: file.type });

        if (uploadRes.error) {
          console.error("Storage upload error", uploadRes.error.message);
          return new Response(
            JSON.stringify({ error: "Failed to upload file" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const text = await extractText(buffer, file.type);

        let embedding: number[] | null = null;
        try {
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

          if (!embedRes.ok) {
            const errText = await embedRes.text();
            console.error("OpenAI API error details:", {
              status: embedRes.status,
              statusText: embedRes.statusText,
              response: errText,
              hasApiKey: !!openaiKey,
              keyPrefix: openaiKey ? openaiKey.substring(0, 10) + '...' : 'no key'
            });
            return new Response(
              JSON.stringify({ error: `OpenAI embedding request failed: ${embedRes.status} ${embedRes.statusText} - ${errText}` }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          const embedData = await embedRes.json();
          if (embedData?.data && Array.isArray(embedData.data) && embedData.data[0]?.embedding) {
            embedding = embedData.data[0].embedding as number[];
          } else {
            console.error("Invalid OpenAI embedding response", embedData);
            return new Response(
              JSON.stringify({ error: "Invalid embedding response" }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        } catch (err) {
          console.error("Error calling OpenAI API", err);
          return new Response(
            JSON.stringify({ error: "Error generating embeddings" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        const { error } = await supabase.from("uploaded_docs").insert({
          case_session_id: caseSessionId,
          file_name: file.name,
          storage_path: path,
          mime_type: file.type,
          // Remove control characters from the extracted text
          text_content: text
            .slice(0, 1000)
            // eslint-disable-next-line no-control-regex
            .replace(/[\x00-\x1F\x7F-\x9F]/g, ""),
          embedding, // Keep as array for vector operations
        });

        if (error) {
          console.error("Database insert error", error.message);
          return new Response(
            JSON.stringify({ error: "Failed to save document" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } catch (err) {
        console.error("Error processing file", file.name, err);
        return new Response(
          JSON.stringify({ error: "Failed processing file" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
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
