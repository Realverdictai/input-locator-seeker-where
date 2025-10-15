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
      .single();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    // 2. Get uploaded brief
    const { data: docs } = await supabase
      .from('uploaded_docs')
      .select('file_name, text_content')
      .eq('case_session_id', sessionCode)
      .order('created_at', { ascending: false })
      .limit(1);

    const briefContent = docs && docs.length > 0 ? docs[0].text_content : '';
    const briefFileName = docs && docs.length > 0 ? docs[0].file_name : 'No brief uploaded';

    // 3. Get clarification answers
    const { data: answers } = await supabase
      .from('clarify_answers')
      .select('question, answer')
      .eq('case_session_id', sessionCode)
      .order('created_at', { ascending: true });

    // 4. Extract case data from brief and answers
    const caseData = extractCaseDataFromSession(briefContent, answers || []);

    // 5. Run AI valuation
    console.log('[Valuation Report] Running AI valuation...');
    const valuation = await runValuation(caseData, briefContent);

    // 6. Generate DOCX report
    console.log('[Valuation Report] Generating DOCX...');
    const docxContent = await generateDocxReport(
      sessionCode,
      partyEmail,
      briefFileName,
      briefContent,
      answers || [],
      valuation,
      caseData
    );

    // 7. Upload to Supabase Storage
    const fileName = `valuation-${sessionCode}-${Date.now()}.docx`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('briefs')
      .upload(fileName, docxContent, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload report: ${uploadError.message}`);
    }

    console.log('[Valuation Report] Report generated:', fileName);

    // 8. Get public URL for download
    const { data: urlData } = supabase.storage
      .from('briefs')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        fileName,
        downloadUrl: urlData.publicUrl,
        valuation
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Valuation Report] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extract case data from brief and clarification answers
 */
function extractCaseDataFromSession(briefContent: string, answers: any[]): any {
  // Parse brief for key information
  const caseData: any = {
    Venue: extractVenue(briefContent),
    Surgery: extractSurgery(briefContent),
    Injuries: extractInjuries(briefContent),
    LiabPct: extractLiability(briefContent),
    AccType: extractAccidentType(briefContent),
    howell: extractHowell(briefContent),
    medicalSpecials: extractMedicalSpecials(briefContent),
    policyLimits: extractPolicyLimits(briefContent),
    surgeryType: extractSurgeryType(briefContent),
    surgeries: extractSurgeryCount(briefContent),
    injectionType: extractInjectionType(briefContent),
    injections: extractInjectionCount(briefContent),
    age: extractAge(briefContent),
    tbiLevel: extractTBILevel(briefContent),
    dol: extractDateOfLoss(briefContent),
    narrative: briefContent
  };

  // Supplement with clarification answers
  answers.forEach(answer => {
    // Map common questions to case fields
    if (answer.question.toLowerCase().includes('venue')) {
      caseData.Venue = answer.answer;
    }
    if (answer.question.toLowerCase().includes('policy limit')) {
      caseData.policyLimits = parseFloat(answer.answer.replace(/[^0-9.]/g, ''));
    }
    // Add more mappings as needed
  });

  return caseData;
}

/**
 * Run AI valuation using the calcEvaluatorAI logic
 */
async function runValuation(caseData: any, narrative: string): Promise<any> {
  // This would normally call the calcEvaluatorAI function
  // For now, we'll call the existing edge function
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/enhanced-case-matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify(caseData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Valuation] Error:', errorText);
      throw new Error('Valuation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('[Valuation] Error:', error);
    throw error;
  }
}

/**
 * Generate DOCX report
 * Using simple text format for now - can be enhanced with proper DOCX library
 */
async function generateDocxReport(
  sessionCode: string,
  partyEmail: string,
  briefFileName: string,
  briefContent: string,
  answers: any[],
  valuation: any,
  caseData: any
): Promise<Uint8Array> {
  // Generate report content
  const reportContent = `
VERDICT AI - MEDIATION VALUATION REPORT
========================================

Session Code: ${sessionCode}
Party: ${partyEmail}
Generated: ${new Date().toLocaleString()}

CASE SUMMARY
------------
Brief File: ${briefFileName}
Venue: ${caseData.Venue || 'Not specified'}
Accident Type: ${caseData.AccType || 'Not specified'}
Date of Loss: ${caseData.dol || 'Not specified'}

INJURIES & TREATMENT
-------------------
Injuries: ${caseData.Injuries || 'Not specified'}
Surgeries: ${caseData.surgeryType || 'None'} (Count: ${caseData.surgeries || 0})
Injections: ${caseData.injectionType || 'None'} (Count: ${caseData.injections || 0})
TBI Level: ${caseData.tbiLevel || 'None'}

DAMAGES
-------
Medical Specials: $${(caseData.medicalSpecials || 0).toLocaleString()}
Howell Adjustment: $${(caseData.howell || 0).toLocaleString()}
Policy Limits: $${(caseData.policyLimits || 0).toLocaleString()}
Liability: ${caseData.LiabPct || 100}%

VALUATION ANALYSIS
-----------------
Recommended Settlement: ${valuation.evaluatorNet || 'N/A'}
Settlement Range: ${valuation.settlementRangeLow || 'N/A'} - ${valuation.settlementRangeHigh || 'N/A'}
Confidence Level: ${valuation.confidence || 0}%
Method: ${valuation.method || 'AI'}

DEDUCTIONS APPLIED
-----------------
${valuation.deductions?.map((d: any) => `- ${d.name}: ${d.pct}%`).join('\n') || 'None'}

COMPARABLE CASES
---------------
${valuation.nearestCases?.map((id: number) => `Case #${id}`).join(', ') || 'None'}

POLICY LIMIT ANALYSIS
--------------------
${valuation.exceedsLimits ? '⚠️ WARNING: Case value exceeds policy limits' : '✓ Case value within policy limits'}
${valuation.excessRiskWarning || ''}
${valuation.plaintiffConfirmationNeeded ? '⚠️ Plaintiff confirmation needed: Will they accept policy limits?' : ''}

CLARIFICATION QUESTIONS & ANSWERS
---------------------------------
${answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}\n`).join('\n')}

CALIFORNIA LAW CONSIDERATIONS
----------------------------
- Pure comparative negligence applies (CCP § 1431.2)
- Howell v. Hamilton Meats medical specials reduction
- Sargon v. USC expert admissibility standards
- Statute of limitations: 2 years from date of injury (CCP § 335.1)
- Prop 213 considerations if applicable

AI RATIONALE
------------
${valuation.rationale || 'No additional rationale provided'}

NEXT STEPS
----------
1. Review this valuation with your team
2. Consider strengths and weaknesses outlined above
3. Prepare counter-proposal if applicable
4. Schedule joint mediation session when both parties ready

---
This report was generated by VERDICT AI based on the information provided during your mediation session.
For questions or clarifications, please contact support.
`;

  // Convert to DOCX format (simple text for now - can enhance with proper DOCX library)
  const encoder = new TextEncoder();
  return encoder.encode(reportContent);
}

// Helper extraction functions
function extractVenue(text: string): string {
  const venueMatch = text.match(/venue[:\s]+([^\n]+)/i);
  return venueMatch ? venueMatch[1].trim() : '';
}

function extractSurgery(text: string): string {
  const surgeryPatterns = ['fusion', 'replacement', 'decompression', 'arthroscopy'];
  for (const pattern of surgeryPatterns) {
    if (text.toLowerCase().includes(pattern)) return pattern;
  }
  return 'None';
}

function extractInjuries(text: string): string {
  const injuryMatch = text.match(/injur(?:ies|y)[:\s]+([^\n]+)/i);
  return injuryMatch ? injuryMatch[1].trim() : '';
}

function extractLiability(text: string): number {
  const liabMatch = text.match(/liab(?:ility)?[:\s]+(\d+)%?/i);
  return liabMatch ? parseInt(liabMatch[1]) : 100;
}

function extractAccidentType(text: string): string {
  if (text.toLowerCase().includes('motor vehicle')) return 'Motor Vehicle';
  if (text.toLowerCase().includes('slip and fall')) return 'Slip and Fall';
  return 'Personal Injury';
}

function extractHowell(text: string): number {
  const howellMatch = text.match(/howell[:\s]+\$?([\d,]+)/i);
  return howellMatch ? parseInt(howellMatch[1].replace(/,/g, '')) : 0;
}

function extractMedicalSpecials(text: string): number {
  const specialsMatch = text.match(/medical\s+special[s]?[:\s]+\$?([\d,]+)/i);
  return specialsMatch ? parseInt(specialsMatch[1].replace(/,/g, '')) : 0;
}

function extractPolicyLimits(text: string): number {
  const policyMatch = text.match(/policy\s+limit[s]?[:\s]+\$?([\d,]+)/i);
  return policyMatch ? parseInt(policyMatch[1].replace(/,/g, '')) : 0;
}

function extractSurgeryType(text: string): string {
  if (text.toLowerCase().includes('fusion')) return 'Fusion';
  if (text.toLowerCase().includes('disc replacement')) return 'Disc Replacement';
  if (text.toLowerCase().includes('decompression')) return 'Decompression';
  return 'None';
}

function extractSurgeryCount(text: string): number {
  const levelMatch = text.match(/(\d+)\s*level/i);
  if (levelMatch) return parseInt(levelMatch[1]);
  
  const surgeryPatterns = ['fusion', 'replacement', 'decompression'];
  let count = 0;
  for (const pattern of surgeryPatterns) {
    const matches = text.toLowerCase().match(new RegExp(pattern, 'g'));
    if (matches) count += matches.length;
  }
  return count;
}

function extractInjectionType(text: string): string {
  if (text.toLowerCase().includes('epidural')) return 'Epidural';
  if (text.toLowerCase().includes('facet')) return 'Facet';
  return 'None';
}

function extractInjectionCount(text: string): number {
  const injectionMatch = text.match(/(\d+)\s*injection[s]?/i);
  return injectionMatch ? parseInt(injectionMatch[1]) : 0;
}

function extractAge(text: string): number {
  const ageMatch = text.match(/age[:\s]+(\d+)/i);
  return ageMatch ? parseInt(ageMatch[1]) : 45;
}

function extractTBILevel(text: string): number {
  if (text.toLowerCase().includes('severe tbi')) return 3;
  if (text.toLowerCase().includes('moderate tbi')) return 2;
  if (text.toLowerCase().includes('mild tbi') || text.toLowerCase().includes('tbi')) return 1;
  return 0;
}

function extractDateOfLoss(text: string): string {
  const dateMatch = text.match(/date\s+of\s+(?:loss|accident|incident)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  return dateMatch ? dateMatch[1] : '';
}
