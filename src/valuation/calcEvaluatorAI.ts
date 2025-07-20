/**
 * AI-First Case Evaluator with Smart Deductions
 */

import { supabase } from '@/integrations/supabase/client';
import { getEmbedding, serializeCaseForEmbedding } from './getEmbeddings';
import { extractFeatures, serializeFeaturesForEmbedding, CaseFeatures } from './featureExtractor';
import { fitRidgeRegression, RegressionResult } from './ridgeRegression';
import { applyDeductions, DeductionResult } from './deductionEngine';
import { calculateTraditionalValuation, TraditionalValuationResult } from './traditionalValuation';
import { StrategyAssessment } from '@/types/verdict';
import { INJURY_TYPE_MULTIPLIERS, INJURY_CATEGORY_WEIGHTS } from './weights';

export interface AIEvaluationResult {
  evaluator: string;
  deductions: Array<{ name: string; pct: number }>;
  evaluatorNet: string;
  mediatorProposal: string;
  expiresOn: string;
  settlementRangeLow: string;
  settlementRangeHigh: string;
  confidence: number;
  nearestCases: number[];
  rationale: string;
  isNovelCase: boolean;
  traditionalValuation?: TraditionalValuationResult;
  injuryAnalysis: {
    primary: string;
    count: number;
    severityScore: number;
    categories: string[];
  };
  method: 'ai' | 'traditional' | 'hybrid';
  strategyAssessment?: StrategyAssessment;
}

interface SettlementStrategy {
  plaintiffBottomLine?: number;
  defenseAuthority?: number;
  defenseRangeLow?: number;
  defenseRangeHigh?: number;
}

interface StrategyAssessmentInternal extends StrategyAssessment {
  alignmentBonus: number;
}

interface WeightsData {
  defaultInjectionValue: number;
  surgeryWeights: Record<string, number>;
  tbiWeights: Record<string, number>;
}

/**
 * Calculate case evaluation using AI-first approach with smart deductions
 */
export async function calcEvaluatorAI(
  newCase: any,
  narrativeText?: string,
  strategy?: SettlementStrategy
): Promise<AIEvaluationResult> {
  try {
    console.log('🤖 Starting AI-first case evaluation...');
    
    // Check if weights should be ignored
    const ignoreWeights = process.env.IGNORE_WEIGHTS === 'true';
    
    // Step 1: Extract enhanced features including injuries
    const targetFeatures = extractFeatures(newCase, narrativeText);
    console.log('📊 Extracted features:', targetFeatures);

    const injuryCategories: string[] = [];
    if (targetFeatures.hasSoftTissue) injuryCategories.push('soft_tissue');
    if (targetFeatures.hasSpinalInjury) injuryCategories.push('spinal');
    if (targetFeatures.hasBrainInjury) injuryCategories.push('neurological');
    if (targetFeatures.hasFracture) injuryCategories.push('orthopedic');

    if (process.env.OFFLINE_MODE === 'true') {
      console.warn('⚠️  OFFLINE_MODE enabled - using traditional valuation only');
      return await createTraditionalEvaluation(newCase, targetFeatures, narrativeText, strategy);
    }

    // Step 2: Get embedding for similarity search
    const featureString = serializeFeaturesForEmbedding(targetFeatures);
    let embedding: number[];
    
    try {
      embedding = await getEmbedding(featureString);
    } catch (embeddingError) {
      console.warn('⚠️ Embedding failed, using fallback similarity:', embeddingError);
      // Fallback to database-only approach
      return await fallbackEvaluation(newCase, targetFeatures, narrativeText, strategy);
    }

    // Step 3: Find top-K (25) similar cases using hybrid search
    const similarCases = await findSimilarCasesWithFeatures(embedding, targetFeatures, 25);
    
    if (similarCases.length === 0) {
      console.warn('No similar cases found, using traditional valuation');
      return await createTraditionalEvaluation(newCase, targetFeatures, narrativeText, strategy);
    }

    console.log(`🔍 Found ${similarCases.length} similar cases`);

    // Step 4: Fit ridge regression (α = 0.3 for less aggressive regularization)
    const regressionResult = fitRidgeRegression(targetFeatures, similarCases, 0.3);
    console.log('📈 Ridge regression prediction:', regressionResult.prediction);
    console.log('🔬 Target features debug:', {
      injectionCount: targetFeatures.injectionCount,
      tbiSeverity: targetFeatures.tbiSeverity,
      surgeryCount: targetFeatures.surgeryCount
    });

    // Check if this is a novel case (low confidence or few similar cases)
    const isNovelCase = regressionResult.confidence < 70 || similarCases.length < 10;
    let traditionalValuation: TraditionalValuationResult | undefined;
    
    if (isNovelCase) {
      console.log('📋 Novel case detected, calculating traditional valuation for comparison');
      traditionalValuation = calculateTraditionalValuation(newCase, narrativeText);
    }

    // Step 4.5: Apply weights from weights.json (if not ignored)
    let weightedPrediction = regressionResult.prediction;
    if (!ignoreWeights) {
      const weightsBoost = await applyWeightsBoost(newCase, targetFeatures);
      weightedPrediction += weightsBoost;
      console.log(`💰 Added weights boost: $${weightsBoost.toLocaleString()}, new total: $${weightedPrediction.toLocaleString()}`);
    }

    // Step 5: Apply smart deductions  
    const deductionResult = applyDeductions(weightedPrediction, newCase, narrativeText);
    console.log('⚖️ Applied deductions:', deductionResult);

    // Step 6: Calculate mediator proposal
    const policyLimits = newCase.policyLimits || newCase.policy_limits_num || 0;
    const { mediator, expiresOn, rangeLow, rangeHigh } = calculateMediatorProposal(
      deductionResult.evaluatorAfterDeductions,
      policyLimits,
      strategy
    );

    const aiLowNum = parseFloat(rangeLow.replace(/[$,]/g, '')) || 0;
    const aiHighNum = parseFloat(rangeHigh.replace(/[$,]/g, '')) || 0;
    const strategyAssessment = assessStrategy(aiLowNum, aiHighNum, strategy);
    let adjustedConfidence = regressionResult.confidence;
    if (strategyAssessment) {
      adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence + strategyAssessment.alignmentBonus));
    }

    // Step 7: Generate rationale
    const rationale = generateRationale(
      regressionResult,
      deductionResult,
      similarCases.length,
      ignoreWeights,
      targetFeatures
    );
    const injuryAnalysis = {
      primary: targetFeatures.primaryInjuryType,
      count: targetFeatures.injuryTypeCount,
      severityScore: targetFeatures.injurySeverityScore,
      categories: injuryCategories
    };

    return {
      evaluator: `$${weightedPrediction.toLocaleString()}`,
      deductions: deductionResult.deductions.map(d => ({ name: d.name, pct: d.pct })),
      evaluatorNet: `$${deductionResult.evaluatorAfterDeductions.toLocaleString()}`,
      mediatorProposal: mediator,
      expiresOn,
      settlementRangeLow: rangeLow,
      settlementRangeHigh: rangeHigh,
      confidence: adjustedConfidence,
      nearestCases: regressionResult.nearestCaseIds.slice(0, 5), // Top 5 for display
      rationale,
      isNovelCase,
      traditionalValuation,
      injuryAnalysis,
      method: isNovelCase ? 'hybrid' : 'ai',
      strategyAssessment: strategyAssessment && {
        plaintiffDiffPct: strategyAssessment.plaintiffDiffPct,
        defenseDiffPct: strategyAssessment.defenseDiffPct,
        plaintiffAlignment: strategyAssessment.plaintiffAlignment,
        defenseAlignment: strategyAssessment.defenseAlignment,
        recommendation: strategyAssessment.recommendation
      }
    };

  } catch (error) {
    console.error('❌ AI evaluation failed:', error);
    throw new Error(`AI evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Apply weights boost from weights.json
 */
async function applyWeightsBoost(newCase: any, features: CaseFeatures): Promise<number> {
  try {
    // Import weights dynamically
    const weights = (await import('../valuation/weights.json')).default as WeightsData;
    let boost = 0;
    
    // Add injection value
    const injectionCount = features.injectionCount || newCase.injections || newCase.injection_count || 0;
    if (injectionCount > 0) {
      boost += injectionCount * weights.defaultInjectionValue;
      console.log(`💉 Injection boost: ${injectionCount} × $${weights.defaultInjectionValue.toLocaleString()} = $${(injectionCount * weights.defaultInjectionValue).toLocaleString()}`);
    }
    
    // Add TBI value
    const tbiLevel = features.tbiSeverity || newCase.tbiLevel || 0;
    const tbiLabels = ['None', 'Mild', 'Moderate', 'Severe'];
    const tbiLabel = tbiLabels[tbiLevel] || 'None';
    if (weights.tbiWeights[tbiLabel]) {
      boost += weights.tbiWeights[tbiLabel];
      console.log(`🧠 TBI boost (${tbiLabel}): $${weights.tbiWeights[tbiLabel].toLocaleString()}`);
    }
    
    // Add surgery weights if available  
    const surgeryCount = features.surgeryCount || newCase.surgeries || 0;
    const surgeryType = newCase.surgeryType || newCase.Surgery || '';
    if (surgeryCount > 0 && surgeryType) {
      const surgeryKey = Object.keys(weights.surgeryWeights).find(key =>
        surgeryType.toLowerCase().includes(key.toLowerCase())
      );
      if (surgeryKey) {
        const surgeryBoost = surgeryCount * weights.surgeryWeights[surgeryKey];
        boost += surgeryBoost;
        console.log(`🔧 Surgery boost (${surgeryKey}): ${surgeryCount} × $${weights.surgeryWeights[surgeryKey].toLocaleString()} = $${surgeryBoost.toLocaleString()}`);
      }
    }

    // Injury severity multipliers
    if (features.injurySeverityScore > 0) {
      let injuryBoost = features.injurySeverityScore * 10000;
      const primaryMult = INJURY_TYPE_MULTIPLIERS[features.primaryInjuryType] || 1;
      injuryBoost *= primaryMult;
      if (features.hasSpinalInjury) injuryBoost *= INJURY_CATEGORY_WEIGHTS.spinal;
      if (features.hasBrainInjury) injuryBoost *= INJURY_CATEGORY_WEIGHTS.neurological;
      if (features.hasFracture) injuryBoost *= INJURY_CATEGORY_WEIGHTS.orthopedic;
      if (features.hasSoftTissue) injuryBoost *= INJURY_CATEGORY_WEIGHTS.soft_tissue;
      boost += injuryBoost;
      console.log(`🩻 Injury boost (${features.primaryInjuryType}): $${injuryBoost.toLocaleString()}`);
    }
    
    return boost;
  } catch (error) {
    console.warn('Failed to load weights, skipping boost:', error);
    return 0;
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
    query_primary_injury: targetFeatures.primaryInjuryType,
    query_has_spinal: targetFeatures.hasSpinalInjury > 0,
    query_has_brain: targetFeatures.hasBrainInjury > 0,
    query_has_fracture: targetFeatures.hasFracture > 0,
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

  // Convert to format expected by regression and apply injury weighting
  const mapped = data.map((row: any) => {
    const features = extractFeaturesFromDbRow(row);
    let score = row.score || 0;
    if (features.primaryInjuryType === targetFeatures.primaryInjuryType) {
      score *= 1.3;
    } else if (
      (features.hasSpinalInjury && targetFeatures.hasSpinalInjury) ||
      (features.hasBrainInjury && targetFeatures.hasBrainInjury) ||
      (features.hasFracture && targetFeatures.hasFracture) ||
      (features.hasSoftTissue && targetFeatures.hasSoftTissue)
    ) {
      score *= 1.15;
    }
    return {
      features,
      settlement: parseFloat(row.settle?.replace(/[$,]/g, '') || '0') || 0,
      case_id: row.case_id,
      score
    };
  }).filter(caseItem => caseItem.settlement > 0);

  return mapped.sort((a, b) => (b.score || 0) - (a.score || 0));
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
    narrative: row.narrative,
    damageScore: 0
  }, row.narrative);
}

/**
 * Fallback evaluation when embedding fails
 */
async function fallbackEvaluation(
  newCase: any,
  targetFeatures: CaseFeatures,
  narrativeText?: string,
  strategy?: SettlementStrategy
): Promise<AIEvaluationResult> {
  console.log('🔄 Using fallback evaluation method...');
  
  const ignoreWeights = process.env.IGNORE_WEIGHTS === 'true';
  
  const similarCases = await fallbackSimilarCases(targetFeatures, 25);
  const regressionResult = fitRidgeRegression(targetFeatures, similarCases, 0.8);
  
  // Apply weights boost (same as main path)
  let weightedPrediction = regressionResult.prediction;
  if (!ignoreWeights) {
    const weightsBoost = await applyWeightsBoost(newCase, targetFeatures);
    weightedPrediction += weightsBoost;
    console.log(`💰 Fallback: Added weights boost: $${weightsBoost.toLocaleString()}, new total: $${weightedPrediction.toLocaleString()}`);
  }
  
  const deductionResult = applyDeductions(weightedPrediction, newCase, narrativeText);
  
  const policyLimits = newCase.policyLimits || newCase.policy_limits_num || 0;
  const { mediator, expiresOn, rangeLow, rangeHigh } = calculateMediatorProposal(
    deductionResult.evaluatorAfterDeductions,
    policyLimits,
    strategy
  );
  const injuryCategories: string[] = [];
  if (targetFeatures.hasSoftTissue) injuryCategories.push('soft_tissue');
  if (targetFeatures.hasSpinalInjury) injuryCategories.push('spinal');
  if (targetFeatures.hasBrainInjury) injuryCategories.push('neurological');
  if (targetFeatures.hasFracture) injuryCategories.push('orthopedic');

  const aiLowNum = parseFloat(rangeLow.replace(/[$,]/g, '')) || 0;
  const aiHighNum = parseFloat(rangeHigh.replace(/[$,]/g, '')) || 0;
  const strategyAssessment = assessStrategy(aiLowNum, aiHighNum, strategy);
  let adjustedConfidence = regressionResult.confidence;
  if (strategyAssessment) {
    adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence + strategyAssessment.alignmentBonus));
  }

    return {
      evaluator: `$${weightedPrediction.toLocaleString()}`,
      deductions: deductionResult.deductions.map(d => ({ name: d.name, pct: d.pct })),
      evaluatorNet: `$${deductionResult.evaluatorAfterDeductions.toLocaleString()}`,
      mediatorProposal: mediator,
      expiresOn,
      settlementRangeLow: rangeLow,
      settlementRangeHigh: rangeHigh,
      confidence: adjustedConfidence,
      nearestCases: regressionResult.nearestCaseIds.slice(0, 5),
      rationale: generateRationale(regressionResult, deductionResult, similarCases.length, ignoreWeights, targetFeatures),
      isNovelCase: regressionResult.confidence < 70,
      traditionalValuation: undefined,
      injuryAnalysis: {
        primary: targetFeatures.primaryInjuryType,
        count: targetFeatures.injuryTypeCount,
        severityScore: targetFeatures.injurySeverityScore,
        categories: injuryCategories
      },
      method: 'ai',
      strategyAssessment: strategyAssessment && {
        plaintiffDiffPct: strategyAssessment.plaintiffDiffPct,
        defenseDiffPct: strategyAssessment.defenseDiffPct,
        plaintiffAlignment: strategyAssessment.plaintiffAlignment,
        defenseAlignment: strategyAssessment.defenseAlignment,
        recommendation: strategyAssessment.recommendation
      }
    };
  }

/**
 * Calculate mediator proposal
 */
function calculateMediatorProposal(
  evaluatorAfterDeductions: number,
  policyLimits: number,
  strategy?: SettlementStrategy
): { mediator: string; expiresOn: string; rangeLow: string; rangeHigh: string } {
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
  if (strategy?.defenseAuthority && proposalAmount > strategy.defenseAuthority) {
    proposalAmount = strategy.defenseAuthority;
  }
  
  // Calculate expiration (7 days from now)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  
  const expiresOn = expirationDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const rangeLow = Math.round(proposalAmount * 0.95 / 500) * 500;
  let rangeHigh = Math.round(proposalAmount * 1.05 / 500) * 500;
  if (policyLimits > 0 && rangeHigh > policyLimits) {
    rangeHigh = policyLimits;
  }
  if (strategy?.defenseAuthority && rangeHigh > strategy.defenseAuthority) {
    rangeHigh = strategy.defenseAuthority;
  }

  const rangeLowStr = `$${rangeLow.toLocaleString()}`;
  const rangeHighStr = `$${rangeHigh.toLocaleString()}`;

  return {
    mediator: `$${proposalAmount.toLocaleString()}`,
    expiresOn,
    rangeLow: rangeLowStr,
    rangeHigh: rangeHighStr
  };
}

/**
 * Generate evaluation rationale
 */
function generateRationale(
  regressionResult: RegressionResult,
  deductionResult: DeductionResult,
  caseCount: number,
  ignoreWeights: boolean,
  features?: CaseFeatures
): string {
  const parts = [
    `AI analysis of ${caseCount} similar cases using 22-factor regression model.`,
    `Base prediction: $${regressionResult.prediction.toLocaleString()} (${regressionResult.confidence}% confidence).`
  ];

  if (deductionResult.deductions.length > 0) {
    const deductionNames = deductionResult.deductions.map(d => d.name).join(', ');
    parts.push(`Applied ${deductionResult.totalDeductionPct}% deduction for: ${deductionNames}.`);
  }

  if (ignoreWeights) {
    parts.push('Surgery/injection weights disabled for testing.');
  }

  if (features) {
    parts.push(`Primary injury type '${features.primaryInjuryType}' and severity score ${features.injurySeverityScore} influenced the valuation.`);
  }

  return parts.join(' ');
}

/**
 * Assess settlement strategy versus AI range
 */
function assessStrategy(aiLow: number, aiHigh: number, strategy?: SettlementStrategy): StrategyAssessmentInternal | undefined {
  if (!strategy) return undefined;

  let plaintiffDiffPct: number | undefined;
  let defenseDiffPct: number | undefined;
  let plaintiffAlignment: 'green' | 'yellow' | 'red' = 'green';
  let defenseAlignment: 'green' | 'yellow' | 'red' = 'green';
  let alignmentBonus = 0;

  if (strategy.plaintiffBottomLine !== undefined) {
    plaintiffDiffPct = ((strategy.plaintiffBottomLine - aiHigh) / aiHigh) * 100;
    if (strategy.plaintiffBottomLine <= aiHigh) {
      plaintiffAlignment = 'green';
    } else if (strategy.plaintiffBottomLine <= aiHigh * 1.2) {
      plaintiffAlignment = 'yellow';
    } else {
      plaintiffAlignment = 'red';
    }
  }

  const defenseTarget = strategy.defenseAuthority ?? strategy.defenseRangeHigh;
  if (defenseTarget !== undefined) {
    defenseDiffPct = ((aiLow - defenseTarget) / aiLow) * 100;
    if (defenseTarget >= aiLow) {
      defenseAlignment = 'green';
    } else if ((strategy.defenseRangeHigh ?? defenseTarget) >= aiLow) {
      defenseAlignment = 'yellow';
    } else {
      defenseAlignment = 'red';
    }
  }

  if (plaintiffAlignment === 'green' && defenseAlignment === 'green') {
    alignmentBonus = 10;
  } else if (plaintiffAlignment === 'red' || defenseAlignment === 'red') {
    alignmentBonus = -10;
  }

  const recommendationParts: string[] = [];
  if (plaintiffAlignment === 'red') {
    recommendationParts.push('Plaintiff expectations exceed likely range.');
  } else if (plaintiffAlignment === 'yellow') {
    recommendationParts.push('Plaintiff bottom line slightly high.');
  }

  if (defenseAlignment === 'red') {
    recommendationParts.push('Defense authority below expected value.');
  } else if (defenseAlignment === 'yellow') {
    recommendationParts.push('Defense range may be too low.');
  }

  const recommendation = recommendationParts.length > 0 ? recommendationParts.join(' ') : 'Strategy aligns with AI analysis.';

  return {
    plaintiffDiffPct,
    defenseDiffPct,
    plaintiffAlignment,
    defenseAlignment,
    recommendation,
    alignmentBonus
  };
}

/**
 * Create traditional evaluation when AI fails or has low confidence
 */
async function createTraditionalEvaluation(
  newCase: any,
  targetFeatures: CaseFeatures,
  narrativeText?: string,
  strategy?: SettlementStrategy
): Promise<AIEvaluationResult> {
  console.log('📋 Creating traditional evaluation fallback...');
  
  const traditionalResult = calculateTraditionalValuation(newCase, narrativeText);
  const deductionResult = applyDeductions(traditionalResult.estimatedValue, newCase, narrativeText);
  
  const policyLimits = newCase.policyLimits || newCase.policy_limits_num || 0;
  const { mediator, expiresOn, rangeLow, rangeHigh } = calculateMediatorProposal(
    deductionResult.evaluatorAfterDeductions,
    policyLimits,
    strategy
  );

  const aiLowNum = parseFloat(rangeLow.replace(/[$,]/g, '')) || 0;
  const aiHighNum = parseFloat(rangeHigh.replace(/[$,]/g, '')) || 0;
  const strategyAssessment = assessStrategy(aiLowNum, aiHighNum, strategy);
  let adjustedConfidence = traditionalResult.confidence;
  if (strategyAssessment) {
    adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence + strategyAssessment.alignmentBonus));
  }

  const rationale = `Traditional valuation method used due to limited historical data. ${traditionalResult.method} applied with factors: ${traditionalResult.factors.join(', ')}.`;

  return {
    evaluator: `$${traditionalResult.estimatedValue.toLocaleString()}`,
    deductions: deductionResult.deductions.map(d => ({ name: d.name, pct: d.pct })),
    evaluatorNet: `$${deductionResult.evaluatorAfterDeductions.toLocaleString()}`,
    mediatorProposal: mediator,
    expiresOn,
    settlementRangeLow: rangeLow,
    settlementRangeHigh: rangeHigh,
    confidence: adjustedConfidence,
    nearestCases: [],
    rationale,
    isNovelCase: true,
    traditionalValuation: traditionalResult,
    method: 'traditional',
    strategyAssessment: strategyAssessment && {
      plaintiffDiffPct: strategyAssessment.plaintiffDiffPct,
      defenseDiffPct: strategyAssessment.defenseDiffPct,
      plaintiffAlignment: strategyAssessment.plaintiffAlignment,
      defenseAlignment: strategyAssessment.defenseAlignment,
      recommendation: strategyAssessment.recommendation
    }
  };
}

