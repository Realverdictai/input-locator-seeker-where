import { getEmbedding, serializeCaseForEmbedding } from './getEmbeddings';
import { findNearestCases } from './findNearest';
import { fitLocalModel, predictSettlement } from './fitLocalModel';

interface EvaluationResult {
  evaluator: string;
  mediatorProposal: string;
  expiresOn: string;
  nearestCases: number[];
  rationale: string;
  r2Score: number;
}

/**
 * Main case evaluation orchestration
 */
export async function evaluateCase(newCase: any): Promise<EvaluationResult> {
  try {
    console.log('🔍 Starting case evaluation...', newCase);
    
    // Step 1: Serialize and embed the new case
    const caseText = serializeCaseForEmbedding(newCase);
    console.log('📝 Case text for embedding:', caseText);
    
    let embedding: number[];
    try {
      embedding = await getEmbedding(caseText);
      console.log('🎯 Generated embedding of length:', embedding.length);
    } catch (embeddingError) {
      console.warn('⚠️ Embedding failed, using fallback similarity:', embeddingError);
      embedding = [];
    }
    
    // Step 2: Find nearest cases
    const nearestCases = await findNearestCases(embedding, newCase, 25);
    console.log(`🔎 Found ${nearestCases.length} similar cases`);
    
    if (nearestCases.length === 0) {
      throw new Error('No similar cases found for evaluation');
    }
    
    // Step 3: Fit local regression model
    const model = fitLocalModel(nearestCases, 0.8);
    console.log('📊 Fitted model with R² =', model.r2.toFixed(3));
    
    // Step 4: Predict settlement
    const evaluatorAmount = predictSettlement(newCase, model);
    console.log('💰 Predicted evaluator amount:', evaluatorAmount);
    
    // Step 5: Calculate mediator proposal
    const policyLimits = newCase.policy_limits_num || parseInt(String(newCase.PolicyLimits || '0').replace(/[$,]/g, '')) || 0;
    let mediatorAmount: number;
    
    if (policyLimits > 0 && evaluatorAmount >= (policyLimits * 0.9)) {
      mediatorAmount = Math.round((policyLimits * 0.9) / 500) * 500;
    } else {
      mediatorAmount = Math.round((evaluatorAmount * 0.95) / 500) * 500;
    }
    
    // Step 6: Generate rationale
    const rationale = generateRationale(newCase, model, nearestCases.slice(0, 3));
    
    // Step 7: Set expiration (7 days from now)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expiresOn = expirationDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    
    return {
      evaluator: `$${evaluatorAmount.toLocaleString()}`,
      mediatorProposal: `$${mediatorAmount.toLocaleString()}`,
      expiresOn,
      nearestCases: nearestCases.slice(0, 3).map(c => c.case_id),
      rationale,
      r2Score: model.r2
    };
    
  } catch (error) {
    console.error('❌ Case evaluation failed:', error);
    throw new Error(`Case evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate human-readable rationale
 */
function generateRationale(newCase: any, model: any, topCases: any[]): string {
  const factors: string[] = [];
  
  // Surgery impact
  const surgeryCount = parseInt(String(newCase.surgeries || newCase.SurgeryCount || 0)) || 0;
  if (surgeryCount > 0) {
    const surgeryImpact = surgeryCount * (model.coefficients.surgeryCount || 0) * 10000;
    if (Math.abs(surgeryImpact) > 1000) {
      factors.push(`${surgeryCount} surgery(ies) (${surgeryImpact > 0 ? '+' : ''}$${Math.round(Math.abs(surgeryImpact)).toLocaleString()})`);
    }
  }
  
  // Injection impact
  const injectionCount = parseInt(String(newCase.injections || newCase.InjectCount || 0)) || 0;
  if (injectionCount > 0) {
    const injectionImpact = injectionCount * (model.coefficients.injectionCount || 0) * 5000;
    if (Math.abs(injectionImpact) > 500) {
      factors.push(`${injectionCount} injection(s) (${injectionImpact > 0 ? '+' : ''}$${Math.round(Math.abs(injectionImpact)).toLocaleString()})`);
    }
  }
  
  // TBI impact
  const tbi = String(newCase.tbiLevel || newCase.TBI || '').toLowerCase();
  if (tbi && !tbi.includes('none') && tbi !== '0') {
    const tbiImpact = (model.coefficients.tbiLevel || 0) * 15000;
    if (Math.abs(tbiImpact) > 1000) {
      factors.push(`${tbi} TBI (${tbiImpact > 0 ? '+' : ''}$${Math.round(Math.abs(tbiImpact)).toLocaleString()})`);
    }
  }
  
  // Liability impact
  const liabPct = parseFloat(String(newCase.LiabPct || '100')) || 100;
  if (liabPct < 100) {
    factors.push(`${liabPct}% liability`);
  }
  
  // Prior accidents
  if (String(newCase.PriorAccidents || '').toLowerCase().includes('yes')) {
    factors.push('prior accidents');
  }
  
  const rationale = factors.length > 0 
    ? `Weighted by ${factors.slice(0, 3).join(', ')}`
    : `Based on ${topCases.length} similar cases with R² = ${model.r2.toFixed(2)}`;
    
  return rationale;
}