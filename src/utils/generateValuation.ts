import { getSingleSettlement } from '@/integrations/supabase/getSingleSettlement';
import { getEnhancedSettlement, formatEnhancedResult } from '@/integrations/supabase/getEnhancedSettlement';

interface NewCase {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
  medicalSpecials?: number;
  age?: number;
  narrative?: string;
}

interface ValuationResult {
  proposal: string;
  rationale: string;
  sourceCaseID: number;
  expiresOn: string;
  confidence?: number;
  valueFactors?: {
    increasing: string[];  
    decreasing: string[];
  };
  comparableCases?: Array<{
    case_id: number;
    similarity_score: number;
    settlement_amount: number;
    key_similarities: string[];
  }>;
}

/**
 * Generate valuation with single settlement proposal (basic similarity matching)
 */
export async function generateValuation(newCase: NewCase): Promise<ValuationResult> {
  try {
    // Get single settlement from most similar cases
    const settlement = await getSingleSettlement(newCase);
    
    // Create rationale
    const surgeryText = newCase.Surgery && newCase.Surgery.toLowerCase() !== 'none' 
      ? `with ${newCase.Surgery}` 
      : 'without surgery';
    
    const rationale = `Based on analysis of comparable cases in ${newCase.Venue} ${surgeryText}, considering policy limits of ${newCase.PolLim}.`;

    // Calculate expiration date (today + 7 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const expiresOn = expiryDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return {
      proposal: settlement.amount,
      rationale,
      sourceCaseID: settlement.sourceCaseID,
      expiresOn
    };

  } catch (error) {
    console.error('Error generating valuation:', error);
    return {
      proposal: "$0",
      rationale: "Unable to generate valuation due to data access error.",
      sourceCaseID: 0,
      expiresOn: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    };
  }
}

/**
 * Generate AI-enhanced valuation using 313 cases + GPT-4 analysis
 */
export async function generateEnhancedValuation(newCase: NewCase): Promise<ValuationResult> {
  try {
    // Get AI-enhanced settlement analysis
    const enhancedResult = await getEnhancedSettlement({
      venue: newCase.Venue,
      surgery: newCase.Surgery,
      injuries: newCase.Injuries,
      liabPct: newCase.LiabPct,
      accType: newCase.AccType,
      polLim: newCase.PolLim,
      medicalSpecials: newCase.medicalSpecials,
      age: newCase.age,
      narrative: newCase.narrative
    });

    // Format the result
    const formatted = formatEnhancedResult(enhancedResult);

    return {
      proposal: formatted.proposal,
      rationale: formatted.rationale,
      sourceCaseID: formatted.sourceCaseID,
      expiresOn: formatted.expiresOn,
      confidence: formatted.confidence,
      valueFactors: formatted.valueFactors,
      comparableCases: formatted.comparableCases
    };

  } catch (error) {
    console.error('Error generating enhanced valuation:', error);
    
    // Fallback to basic valuation if AI fails
    console.log('Falling back to basic valuation...');
    return await generateValuation(newCase);
  }
}