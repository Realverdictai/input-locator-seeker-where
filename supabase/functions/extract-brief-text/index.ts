import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as pdfjs from "https://esm.sh/pdfjs-dist@4.11.353";
import mammoth from "https://esm.sh/mammoth@1.9.1";

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
      // Extract PDF text
      const arrayBuffer = await fileData.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjs.getDocument({ data: typedArray }).promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        briefText += pageText + '\n';
      }
    } else if (ext === 'docx' || ext === 'doc') {
      // Extract DOCX text
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      briefText = result.value;
    } else {
      // Plain text
      briefText = await fileData.text();
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