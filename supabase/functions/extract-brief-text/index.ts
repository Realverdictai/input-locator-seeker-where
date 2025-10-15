import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { path, filename, partyEmail, side } = await req.json();

    if (!path || !filename || !partyEmail || !side) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download file from briefs bucket
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('briefs')
      .download(path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text based on file type
    let briefText = '';
    const ext = filename.toLowerCase().split('.').pop();

    if (ext === 'pdf') {
      // For PDFs, use file size as a proxy for content
      // In production, you'd integrate with a PDF parsing service or library
      const arrayBuffer = await fileData.arrayBuffer();
      briefText = `[PDF Document: ${filename}, Size: ${arrayBuffer.byteLength} bytes]\n\nThis PDF has been uploaded and will be processed. Please provide a summary or key points from your document.`;
    } else if (ext === 'docx' || ext === 'doc') {
      // For DOCX, we'll need to call an external service or use a different approach
      const arrayBuffer = await fileData.arrayBuffer();
      briefText = `[DOCX Document: ${filename}, Size: ${arrayBuffer.byteLength} bytes]\n\nThis document has been uploaded and will be processed. Please provide a summary or key points from your document.`;
    } else {
      // Plain text files
      try {
        briefText = await fileData.text();
      } catch {
        briefText = `[Document: ${filename}]\n\nUnable to extract text. Please provide a summary of your document.`;
      }
    }

    // Truncate to ~25,000 chars
    if (briefText.length > 25000) {
      briefText = briefText.substring(0, 25000);
    }

    // Generate sessionId: one_<timestamp>_<random>
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sessionId = `one_${timestamp}_${random}`;

    // Upsert into briefs_one_side
    const { error: upsertError } = await supabase
      .from('briefs_one_side')
      .upsert({
        session_id: sessionId,
        party_email: partyEmail,
        side,
        filename,
        brief_text: briefText,
      }, {
        onConflict: 'session_id'
      });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to save brief data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        ok: true, 
        sessionId, 
        briefText, 
        filename 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});