import { supabase } from '@/integrations/supabase/client';
import { getEmbedding } from '@/valuation/getEmbeddings';

export async function queryDocs(caseSessionId: string, question: string) {
  const embedding = await getEmbedding(question);
  const { data, error } = await supabase.rpc('match_uploaded_docs', {
    query_embedding: embedding,
    match_count: 4,
    p_session: caseSessionId
  });
  if (error) throw error;
  return data as Array<{ file_name: string; snippet: string; similarity: number }>;
}
