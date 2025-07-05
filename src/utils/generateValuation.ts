import { getSingleSettlement } from '@/integrations/supabase/getSingleSettlement';
import { getEnhancedSettlement, formatEnhancedResult } from '@/integrations/supabase/getEnhancedSettlement';

interface NewCase {
  Venue?: string;
  Surgery?: string;
  Injuries: string;
  LiabPct?: string;
  AccType?: string;
  PolLim: string;
  medicalSpecials?: number;
  howellSpecials?: number;
  tbiSeverity?: string;
  surgeryType?: string;
  injectionType?: string;
  surgeries?: number;
  injections?: number;
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
    settlement_amount: number;
    similarity_reason: string;
  }>;
  settlementRange?: {
    low: number;
    high: number;
  };
  policyExceedanceRisk?: number;
}

/**
 * Generate valuation with single settlement proposal (basic similarity matching)
 */
export async function generateValuation(newCase: NewCase): Promise<ValuationResult> {
  try {
    // Get single settlement using new data-driven approach
    const settlement = await getSingleSettlement(newCase);
    
    // Calculate expiration date (today + 7 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const expiresOn = expiryDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    return {
      proposal: settlement.proposal,
      rationale: settlement.rationale,
      sourceCaseID: settlement.sourceCaseIDs[0] || 0,
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
 * @deprecated - Use generateValuation for data-driven approach
 */
export async function generateEnhancedValuation(newCase: NewCase): Promise<ValuationResult> {
  try {
    // Fallback to basic valuation since we're using data-driven approach
    console.log('Using data-driven valuation instead of AI-enhanced...');
    return await generateValuation(newCase);
  } catch (error) {
    console.error('Error generating enhanced valuation:', error);
    
    // Fallback to basic valuation if AI fails
    console.log('Falling back to basic valuation...');
    return await generateValuation(newCase);
  }
}