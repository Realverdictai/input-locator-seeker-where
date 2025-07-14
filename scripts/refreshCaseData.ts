import { createClient } from '@supabase/supabase-js';
import { serializeCaseForEmbedding, getEmbedding } from '../src/valuation/getEmbeddings';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hueccsiuyxjqupxkfhkl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY env var required');
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error('OPENAI_API_KEY or VITE_OPENAI_API_KEY env var required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function refreshCases() {
  console.log('🔄 Fetching cases without embeddings...');
  const { data: cases, error } = await supabase
    .from('cases_master')
    .select('*')
    .is('embedding', null);

  if (error) throw error;
  if (!cases || cases.length === 0) {
    console.log('✅ No cases need refresh');
    return;
  }

  console.log(`Found ${cases.length} cases to update`);

  for (const row of cases) {
    try {
      console.log(`Processing case ${row.case_id}...`);
      // Normalize data via RPC
      await supabase.rpc('fn_normalize_case', { p_case_id: row.case_id });

      const text = serializeCaseForEmbedding(row);
      const embedding = await getEmbedding(text);

      await supabase
        .from('cases_master')
        .update({ embedding })
        .eq('case_id', row.case_id);

      console.log(`✓ Case ${row.case_id} updated`);
    } catch (err) {
      console.error(`Failed to process case ${row.case_id}:`, err);
    }
  }
}

refreshCases().then(() => {
  console.log('🎉 Refresh complete');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
