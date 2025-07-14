/**
 * OpenAI embedding service for case similarity
 */

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

/**
 * Get text embedding from OpenAI
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data: EmbeddingResponse = await response.json();
  return data.data[0].embedding;
}

/**
 * Serialize case data into embedding text
 */
export function serializeCaseForEmbedding(caseData: any): string {
  const parts = [
    caseData.case_type || caseData.CaseType || '',
    caseData.injuries || caseData.Injuries || '',
    caseData.surgery || caseData.Surgery || '',
    caseData.inject || caseData.Inject || '',
    caseData.pol_lim || caseData.policyLimits || caseData.PolicyLimits || '',
    caseData.liab_pct || caseData.LiabPct || '',
    caseData.narrative || caseData.Narrative || '',
    caseData.venue || caseData.Venue || '',
    caseData.acc_type || caseData.AccType || ''
  ].filter(Boolean);

  return parts.join(' | ');
}