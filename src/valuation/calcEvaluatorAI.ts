/**
 * AI-First Case Evaluator with Smart Deductions
 */

import { supabase } from '@/integrations/supabase/client';
import { getEmbedding, serializeCaseForEmbedding } from './getEmbeddings';
import { extractFeatures, serializeFeaturesForEmbedding, CaseFeatures } from './featureExtractor';
import { fitRidgeRegression, RegressionResult } from './ridgeRegression';
import { applyDeductions, DeductionResult } from './deductionEngine';

export interface AIEvaluationResult {
  evaluator: string;
  deductions: Array<{ name: string; pct: number }>;
  evaluatorNet: string;
  mediatorProposal: string;
  expiresOn: string;
  confidence: number;
  nearestCases: number[];
  rationale: string;
}

/**
 * Calculate case evaluation using AI-first approach with smart deductions
 */
export async function calcEvaluatorAI(
  newCase: any,
  narrativeText?: string
): Promise<AIEvaluationResult> {
  try {
    console.log('🤖 Starting AI-first case evaluation...');
    
    // Check if weights should be ignored
    const ignoreWeights = process.env.IGNORE_WEIGHTS === 'true';
    
    // Step 1: Extract enhanced features (16 features)
    const targetFeatures = extractFeatures(newCase, narrativeText);
    console.log('📊 Extracted 16 features:', targetFeatures);

    // Step 2: Get embedding for similarity search
    const featureString = serializeFeaturesForEmbedding(targetFeatures);
    let embedding: number[];
    
    try {
      embedding = await getEmbedding(featureString);
    } catch (embeddingError) {
      console.warn('⚠️ Embedding failed, using fallback similarity:', embeddingError);
      // Fallback to database-only approach
      return await fallbackEvaluation(newCase, targetFeatures, narrativeText);
    }

    // Step 3: Find top-K (25) similar cases using hybrid search
    const similarCases = await findSimilarCasesWithFeatures(embedding, targetFeatures, 25);
    
    if (similarCases.length === 0) {
      throw new Error('No similar cases found in database');
    }

    console.log(`🔍 Found ${similarCases.length} similar cases`);

    // Step 4: Fit ridge regression (α = 0.8)
    const regressionResult = fitRidgeRegression(targetFeatures, similarCases, 0.8);
    console.log('📈 Ridge regression prediction:', regressionResult.prediction);

    // Step 5: Apply smart deductions
    const deductionResult = applyDeductions(regressionResult.prediction, newCase, narrativeText);
    console.log('⚖️ Applied deductions:', deductionResult);

    // Step 6: Calculate mediator proposal
    const policyLimits = newCase.policyLimits || newCase.policy_limits_num || 0;
    const { mediator, expiresOn } = calculateMediatorProposal(
      deductionResult.evaluatorAfterDeductions,
      policyLimits
    );

    // Step 7: Generate rationale
    const rationale = generateRationale(
      regressionResult,
      deductionResult,
      similarCases.length,
      ignoreWeights
    );

    return {
      evaluator: `$${regressionResult.prediction.toLocaleString()}`,
      deductions: deductionResult.deductions.map(d => ({ name: d.name, pct: d.pct })),
      evaluatorNet: `$${deductionResult.evaluatorAfterDeductions.toLocaleString()}`,
      mediatorProposal: mediator,
      expiresOn,
      confidence: regressionResult.confidence,
      nearestCases: regressionResult.nearestCaseIds.slice(0, 5), // Top 5 for display
      rationale
    };

  } catch (error) {
    console.error('❌ AI evaluation failed:', error);
    throw new Error(`AI evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Find similar cases with extracted features
 */
async function findSimilarCasesWithFeatures(
  embedding: number[],
  targetFeatures: CaseFeatures,
  limit: number = 25
): Promise<Array<{ features: CaseFeatures; settlement: number; case_id: number }>> {
  // Use hybrid similarity search
  const embeddingVector = `[${embedding.join(',')}]`;
  
  const { data, error } = await supabase.rpc('hybrid_case_similarity', {
    query_embedding: embeddingVector,
    query_liab_pct: targetFeatures.liabilityPct,
    query_policy_bucket: targetFeatures.policyLimitRatio > 0.5 ? 'high' : 'low',
    query_tbi_level: targetFeatures.tbiSeverity,
    query_has_surgery: targetFeatures.surgeryCount > 0,
    result_limit: limit
  });

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.warn('No cases returned from hybrid search, trying fallback...');
    return await fallbackSimilarCases(targetFeatures, limit);
  }

  // Convert to format expected by regression
  return data.map((row: any) => ({
    features: extractFeaturesFromDbRow(row),
    settlement: parseFloat(row.settle?.replace(/[$,]/g, '') || '0') || 0,
    case_id: row.case_id
  })).filter(caseItem => caseItem.settlement > 0);
}

/**
 * Fallback similarity search without embeddings
 */
async function fallbackSimilarCases(
  targetFeatures: CaseFeatures,
  limit: number
): Promise<Array<{ features: CaseFeatures; settlement: number; case_id: number }>> {
  const { data, error } = await supabase
    .from('v_case_flat')
    .select('*')
    .not('settlement', 'is', null)
    .gt('settlement', 0)
    .eq('is_outlier', false) // Exclude outliers
    .limit(limit * 2); // Get more for filtering

  if (error) throw error;

  return (data || [])
    .map(row => ({
      features: extractFeaturesFromDbRow(row),
      settlement: row.settlement || 0,
      case_id: row.case_id
    }))
    .filter(caseItem => caseItem.settlement > 0)
    .slice(0, limit);
}

/**
 * Extract features from database row
 */
function extractFeaturesFromDbRow(row: any): CaseFeatures {
  const structuredData = row.structured_data || {};
  
  return extractFeatures({
    howell_num: structuredData.howellSpecials || 0,
    surgery_count: row.surgery_count || 0,
    surgery_list: row.surgery_list || [],
    injection_count: row.injection_count || 0,
    injection_list: row.injection_list || [],
    tbiLevel: 0, // Will be extracted from narrative
    liab_pct_num: row.liab_pct || 100,
    policy_limits_num: row.policy_limits || 0,
    settlement: row.settlement || 0,
    venue: row.venue,
    dol: row.dol,
    narrative: row.narrative
  }, row.narrative);
}

/**
 * Fallback evaluation when embedding fails
 */
async function fallbackEvaluation(
  newCase: any,
  targetFeatures: CaseFeatures,
  narrativeText?: string
): Promise<AIEvaluationResult> {
  console.log('🔄 Using fallback evaluation method...');
  
  const similarCases = await fallbackSimilarCases(targetFeatures, 25);
  const regressionResult = fitRidgeRegression(targetFeatures, similarCases, 0.8);
  const deductionResult = applyDeductions(regressionResult.prediction, newCase, narrativeText);
  
  const policyLimits = newCase.policyLimits || newCase.policy_limits_num || 0;
  const { mediator, expiresOn } = calculateMediatorProposal(
    deductionResult.evaluatorAfterDeductions,
    policyLimits
  );

  return {
    evaluator: `$${regressionResult.prediction.toLocaleString()}`,
    deductions: deductionResult.deductions.map(d => ({ name: d.name, pct: d.pct })),
    evaluatorNet: `$${deductionResult.evaluatorAfterDeductions.toLocaleString()}`,
    mediatorProposal: mediator,
    expiresOn,
    confidence: regressionResult.confidence,
    nearestCases: regressionResult.nearestCaseIds.slice(0, 5),
    rationale: generateRationale(regressionResult, deductionResult, similarCases.length, false)
  };
}

/**
 * Calculate mediator proposal
 */
function calculateMediatorProposal(
  evaluatorAfterDeductions: number,
  policyLimits: number
): { mediator: string; expiresOn: string } {
  let proposalAmount: number;
  
  if (policyLimits > 0) {
    const policyLimit90Percent = policyLimits * 0.90;
    
    if (evaluatorAfterDeductions >= policyLimit90Percent) {
      proposalAmount = policyLimit90Percent;
    } else {
      proposalAmount = evaluatorAfterDeductions * 0.95;
    }
  } else {
    proposalAmount = evaluatorAfterDeductions * 0.95;
  }
  
  // Round to nearest $500
  proposalAmount = Math.round(proposalAmount / 500) * 500;
  
  if (policyLimits > 0 && proposalAmount > policyLimits) {
    proposalAmount = policyLimits;
  }
  
  // Calculate expiration (7 days from now)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  
  const expiresOn = expirationDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  return {
    mediator: `$${proposalAmount.toLocaleString()}`,
    expiresOn
  };
}

/**
 * Generate evaluation rationale
 */
function generateRationale(
  regressionResult: RegressionResult,
  deductionResult: DeductionResult,
  caseCount: number,
  ignoreWeights: boolean
): string {
  const parts = [
    `AI analysis of ${caseCount} similar cases using 16-factor regression model.`,
    `Base prediction: $${regressionResult.prediction.toLocaleString()} (${regressionResult.confidence}% confidence).`
  ];

  if (deductionResult.deductions.length > 0) {
    const deductionNames = deductionResult.deductions.map(d => d.name).join(', ');
    parts.push(`Applied ${deductionResult.totalDeductionPct}% deduction for: ${deductionNames}.`);
  }

  if (ignoreWeights) {
    parts.push('Surgery/injection weights disabled for testing.');
  }

  return parts.join(' ');
}