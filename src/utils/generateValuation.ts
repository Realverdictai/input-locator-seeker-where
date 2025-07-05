import { getSingleSettlement } from '@/integrations/supabase/getSingleSettlement';

interface NewCase {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
}

interface ValuationResult {
  proposal: string;
  rationale: string;
  sourceCaseID: number;
  expiresOn: string;
}

/**
 * Generate valuation with single settlement proposal
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