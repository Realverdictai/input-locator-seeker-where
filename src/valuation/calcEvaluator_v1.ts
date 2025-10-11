import { getWeights } from './weights';
import { getComparables } from './getComparables';
import weightsData from './weights.json';

interface NewCase {
  Venue?: string;
  Surgery?: string;
  Injuries?: string;
  LiabPct?: string;
  AccType?: string;
  howell?: number;
  medicalSpecials?: number;
  surgeryType?: string;
  surgeries?: number;
  injectionType?: string;
  injections?: number;
  tbiLevel?: number;
  age?: number;
  prior_accidents?: string;
  subsequent_accidents?: string;
  [key: string]: any;
}

interface EvaluatorResult {
  evaluator: string;
  sourceCases: number[];
  rationale: string;
}

/**
 * Parse surgery counts from surgery string
 */
function parseSurgeryVector(surgery: string | null, surgeryType?: string): Record<string, number> {
  const vector: Record<string, number> = {};
  
  if (!surgery || surgery.toLowerCase() === 'none') return vector;
  
  // Use provided surgery type or parse from surgery string
  const surgeryKey = surgeryType || surgery;
  vector[surgeryKey] = 1; // Default to 1 surgery
  
  return vector;
}

/**
 * Parse injection counts from injection string  
 */
function parseInjectionVector(inject: string | null, injectionType?: string): Record<string, number> {
  const vector: Record<string, number> = {};
  
  if (!inject || inject.toLowerCase() === 'none') return vector;
  
  // Use provided injection type or parse from inject string
  const injectionKey = injectionType || inject;
  vector[injectionKey] = 1; // Default to 1 injection
  
  return vector;
}

/**
 * Calculate the Evaluator Number using comprehensive scoring with weights and outlier filtering
 */
export async function calcEvaluator(newCase: NewCase): Promise<EvaluatorResult> {
  const weights = await getWeights();
  const ignoreWeights = process.env.IGNORE_WEIGHTS === 'true';
  
  // Get comparables with outlier filtering
  const comparables = await getComparables(newCase, 25, !ignoreWeights);
  
  // Step 1: Base calculation from Howell specials
  const howell = newCase.howell || newCase.medicalSpecials * 0.6 || 0;
  let base = howell * weights.olsSlope;
  
  const factorBreakdown: string[] = [];
  
  // Step 2: Surgery adjustments
  if (newCase.surgeries && newCase.surgeries > 0) {
    const surgVector = parseSurgeryVector(newCase.Surgery, newCase.surgeryType);
    let surgeryAdjustment = 0;
    
    Object.keys(surgVector).forEach(surgeryType => {
      const count = surgVector[surgeryType] * (newCase.surgeries || 1);
      const weight = weights.surgeryWeights[surgeryType] || 35000; // Default surgery uplift
      surgeryAdjustment += weight * count;
    });
    
    base += surgeryAdjustment;
    if (surgeryAdjustment > 1000) {
      factorBreakdown.push(`${newCase.surgeries} ${newCase.surgeryType || 'surgery'} (+$${Math.round(surgeryAdjustment).toLocaleString()})`);
    }
  }
  
  // Step 3: Injection adjustments
  if (newCase.injections && newCase.injections > 0) {
    const injVector = parseInjectionVector(newCase.Injuries, newCase.injectionType);
    let injectionAdjustment = 0;
    
    Object.keys(injVector).forEach(injectionType => {
      const count = injVector[injectionType] * (newCase.injections || 1);
      const weight = weights.injectionWeights[injectionType] || 4000; // Default injection uplift
      injectionAdjustment += weight * count * 0.3; // Diminishing returns
    });
    
    base += injectionAdjustment;
    if (injectionAdjustment > 500) {
      factorBreakdown.push(`${newCase.injections} ${newCase.injectionType || 'injection'} (+$${Math.round(injectionAdjustment).toLocaleString()})`);
    }
  }
  
  // Step 4: TBI severity adjustment
  if (newCase.tbiLevel && newCase.tbiLevel > 0) {
    const tbiAdjustment = weights.tbiSeverityWeights[newCase.tbiLevel.toString()] || 0;
    base += tbiAdjustment;
    
    if (tbiAdjustment > 0) {
      const severityLabels = ['None', 'Mild', 'Moderate', 'Severe'];
      factorBreakdown.push(`${severityLabels[newCase.tbiLevel]} TBI (+$${Math.round(tbiAdjustment).toLocaleString()})`);
    }
  }
  
  // Step 5: Liability percentage cut
  const liabilityPct = parseFloat(newCase.LiabPct || '100') || 100;
  if (liabilityPct < 100) {
    const liabilityMultiplier = liabilityPct / 100;
    base *= liabilityMultiplier;
    factorBreakdown.push(`${liabilityPct}% liability (×${liabilityMultiplier})`);
  }
  
  // Step 6: Venue adjustment
  if (newCase.Venue) {
    const venueAdjustment = weights.venueWeights[newCase.Venue] || 0;
    const venueChange = base * venueAdjustment;
    base += venueChange;
    
    if (Math.abs(venueChange) > 1000) {
      const direction = venueChange > 0 ? '+' : '';
      factorBreakdown.push(`${newCase.Venue} venue (${direction}$${Math.round(venueChange).toLocaleString()})`);
    }
  }
  
  // Step 7: Age adjustment (over 60)
  if (newCase.age && newCase.age > 60) {
    const ageReduction = Math.min(0.10, (newCase.age - 60) * 0.0025); // -0.25% per year, max -10%
    const ageAdjustment = base * -ageReduction;
    base += ageAdjustment;
    factorBreakdown.push(`Age ${newCase.age} ($${Math.round(ageAdjustment).toLocaleString()})`);
  }
  
  // Step 8: Prior/subsequent accidents
  if (newCase.prior_accidents === 'Yes' || newCase.subsequent_accidents === 'Yes') {
    const accidentReduction = base * -0.15; // -15%
    base += accidentReduction;
    factorBreakdown.push(`Prior/subsequent accident ($${Math.round(accidentReduction).toLocaleString()})`);
  }
  
  // Apply weights-based adjustments if not ignoring weights
  if (!ignoreWeights) {
    // Add injection value adjustments
    const injectionCount = newCase.injections || 0;
    if (injectionCount > 0) {
      const injectionValue = injectionCount * weightsData.defaultInjectionValue;
      base += injectionValue;
      factorBreakdown.push(`Injection weights (+$${Math.round(injectionValue).toLocaleString()})`);
    }
    
    // Add surgery weight adjustments
    const surgeryCount = newCase.surgeries || 0;
    if (surgeryCount > 0 && newCase.surgeryType) {
      const surgeryWeight = weightsData.surgeryWeights[newCase.surgeryType.toLowerCase()] || 0;
      if (surgeryWeight > 0) {
        const surgeryValue = surgeryWeight * surgeryCount;
        base += surgeryValue;
        factorBreakdown.push(`Surgery weights (+$${Math.round(surgeryValue).toLocaleString()})`);
      }
    }
    
    // Add TBI weight adjustments
    if (newCase.tbiLevel) {
      const tbiLabels = ['None', 'Mild', 'Moderate', 'Severe'];
      const tbiLabel = tbiLabels[newCase.tbiLevel] || 'None';
      const tbiWeight = weightsData.tbiWeights[tbiLabel] || 0;
      if (tbiWeight > 0) {
        base += tbiWeight;
        factorBreakdown.push(`TBI weights (+$${Math.round(tbiWeight).toLocaleString()})`);
      }
    }
  }
  
  // Round to nearest $500
  const evaluatorAmount = Math.round(base / 500) * 500;
  
  // Get source case IDs from top comparables
  const sourceCases = comparables.slice(0, 3).map(c => c.case_id);
  
  const rationale = factorBreakdown.length > 0 
    ? `Weighted by ${factorBreakdown.slice(0, 3).join(', ')}`
    : `Based on Howell specials ($${howell.toLocaleString()}) and database analysis`;
  
  return {
    evaluator: `$${evaluatorAmount.toLocaleString()}`,
    sourceCases,
    rationale
  };
}