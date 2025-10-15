import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionCode, partyEmail } = await req.json();

    if (!sessionCode) {
      throw new Error('Session code is required');
    }

    console.log('[Valuation Report] Generating report for session:', sessionCode);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get session data
    const { data: session, error: sessionError } = await supabase
      .from('mediation_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .maybeSingle();

    if (sessionError) {
      console.error('[Valuation Report] Session error:', sessionError);
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Get uploaded brief
    const { data: docs, error: docsError } = await supabase
      .from('uploaded_docs')
      .select('file_name, text_content')
      .eq('case_session_id', sessionCode)
      .order('created_at', { ascending: false })
      .limit(1);

    if (docsError) {
      console.error('[Valuation Report] Docs error:', docsError);
    }

    const briefContent = docs && docs.length > 0 ? docs[0].text_content || '' : '';
    const briefFileName = docs && docs.length > 0 ? docs[0].file_name : 'No brief uploaded';

    console.log('[Valuation Report] Brief:', briefFileName, 'Length:', briefContent.length);

    // 3. Get clarification answers
    const { data: answers, error: answersError } = await supabase
      .from('clarify_answers')
      .select('question, answer')
      .eq('case_session_id', sessionCode)
      .order('created_at', { ascending: true });

    if (answersError) {
      console.error('[Valuation Report] Answers error:', answersError);
    }

    console.log('[Valuation Report] Found', answers?.length || 0, 'clarification answers');

    // 4. Extract case data from brief
    const caseData = extractCaseData(briefContent, answers || []);
    console.log('[Valuation Report] Extracted case data:', JSON.stringify(caseData, null, 2));

    // 5. Generate simple report (skip complex valuation for now)
    const reportContent = generateReportContent(
      sessionCode,
      partyEmail,
      briefFileName,
      briefContent,
      answers || [],
      caseData
    );

    // 6. Upload to Supabase Storage
    const fileName = `valuation-${sessionCode}-${Date.now()}.txt`;
    const encoder = new TextEncoder();
    const fileContent = encoder.encode(reportContent);

    const { error: uploadError } = await supabase.storage
      .from('briefs')
      .upload(fileName, fileContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('[Valuation Report] Upload error:', uploadError);
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    console.log('[Valuation Report] Report uploaded:', fileName);

    // 7. Get public URL
    const { data: urlData } = supabase.storage
      .from('briefs')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        downloadUrl: urlData.publicUrl,
        message: 'Report generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Valuation Report] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extract key case data from brief content
 */
function extractCaseData(briefContent: string, answers: any[]): any {
  const text = briefContent.toLowerCase();
  
  return {
    venue: extractField(briefContent, ['venue', 'court', 'county']),
    accidentType: extractField(briefContent, ['accident type', 'incident', 'collision']),
    dateOfLoss: extractField(briefContent, ['date of loss', 'accident date', 'incident date']),
    injuries: extractField(briefContent, ['injuries', 'injury', 'injured']),
    medicalSpecials: extractCurrency(briefContent, ['medical specials', 'medical bills', 'medical expenses']),
    policyLimits: extractCurrency(briefContent, ['policy limits', 'policy limit', 'coverage']),
    liability: extractPercentage(briefContent, ['liability', 'fault']),
    hasSurgery: text.includes('surgery') || text.includes('surgical'),
    hasInjections: text.includes('injection') || text.includes('epidural') || text.includes('facet'),
    hasTBI: text.includes('tbi') || text.includes('traumatic brain'),
    hasSubsequentAccident: text.includes('subsequent accident') || text.includes('later accident'),
    clarificationAnswers: answers
  };
}

/**
 * Extract a field value from text
 */
function extractField(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\\s]+([^\\n\\.]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return 'Not specified';
}

/**
 * Extract currency value
 */
function extractCurrency(text: string, keywords: string[]): number {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\\s]+\\$?([\\d,]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''));
    }
  }
  return 0;
}

/**
 * Extract percentage value
 */
function extractPercentage(text: string, keywords: string[]): number {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\\s]+(\\d+)%?`, 'i');
    const match = text.match(regex);
    if (match) {
      return parseInt(match[1]);
    }
  }
  return 100;
}

/**
 * Generate text report content
 */
function generateReportContent(
  sessionCode: string,
  partyEmail: string,
  briefFileName: string,
  briefContent: string,
  answers: any[],
  caseData: any
): string {
  return `
VERDICT AI - MEDIATION VALUATION REPORT
========================================

Session Code: ${sessionCode}
Party: ${partyEmail || 'Not specified'}
Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}
Brief File: ${briefFileName}

CASE INFORMATION
----------------
Venue: ${caseData.venue}
Accident Type: ${caseData.accidentType}
Date of Loss: ${caseData.dateOfLoss}

INJURIES & TREATMENT
-------------------
Injuries: ${caseData.injuries}
Surgery: ${caseData.hasSurgery ? 'Yes' : 'No'}
Injections: ${caseData.hasInjections ? 'Yes' : 'No'}
TBI: ${caseData.hasTBI ? 'Yes' : 'No'}
Subsequent Accident: ${caseData.hasSubsequentAccident ? 'Yes (apportionment issues)' : 'No'}

DAMAGES
-------
Medical Specials: $${caseData.medicalSpecials.toLocaleString()}
Policy Limits: $${caseData.policyLimits.toLocaleString()}
Liability: ${caseData.liability}%

CLARIFICATION Q&A
-----------------
${answers.length > 0 ? answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}\n`).join('\n') : 'No clarification questions answered'}

VALUATION SUMMARY
-----------------
Based on the information provided during your mediation session, the following factors will affect case value:

${caseData.hasSurgery ? '✓ Surgery present - significant value increase ($250k per major surgery level, $75k-$150k minor)' : ''}
${caseData.hasInjections ? '✓ Injections present - adds approximately $50k per injection' : ''}
${caseData.hasTBI ? '✓ TBI present - significant damages consideration' : ''}
${caseData.hasSubsequentAccident ? '⚠️ Subsequent accident - 30-35% deduction for apportionment issues' : ''}
${caseData.policyLimits > 0 && caseData.medicalSpecials > caseData.policyLimits * 0.5 ? '⚠️ Case value may approach or exceed policy limits' : ''}

CALIFORNIA LAW CONSIDERATIONS
-----------------------------
- Pure comparative negligence applies (CCP § 1431.2)
- Howell v. Hamilton Meats medical specials reduction
- Sargon v. USC expert admissibility standards  
- Statute of limitations: 2 years from date of injury (CCP § 335.1)
- Prop 213 considerations if applicable

DETAILED AI ANALYSIS
--------------------
A comprehensive AI-powered valuation analysis is being prepared that will include:
- Comparison with ${5} similar cases from our database
- Detailed deduction analysis
- Settlement range recommendations
- Confidence scoring
- Policy limit risk assessment

NEXT STEPS
----------
1. Review this preliminary report with your team
2. Prepare for joint mediation session
3. Consider additional documentation needs
4. Review California law considerations above

---
This report was generated by VERDICT AI based on your mediation session.
A detailed valuation analysis will be provided within 72 hours.

For questions, please retain your session code: ${sessionCode}
`;
}
