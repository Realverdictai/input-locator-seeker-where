import { supabase } from "@/integrations/supabase/client";

interface EnhancedCaseInput {
  venue: string;
  surgery: string;
  injuries: string;
  injuryTypes?: string[];
  liabPct: string;
  accType: string;
  polLim: string;
  medicalSpecials?: number;
  age?: number;
  narrative?: string;
  tbiSeverity?: number;
}

interface EnhancedSettlementResult {
  settlement_recommendation: number;
  confidence_score: number;
  top_comparable_cases: Array<{
    case_id: number;
    similarity_score: number;
    settlement_amount: number;
    key_similarities: string[];
  }>;
  value_factors: {
    increasing: string[];
    decreasing: string[];
  };
  reasoning: string;
  traditional_score_validation: any;
  source_case_count: number;
}

/**
 * Get AI-enhanced settlement recommendation using the 313 cases + AI analysis
 */
export async function getEnhancedSettlement(caseInput: EnhancedCaseInput): Promise<EnhancedSettlementResult> {
  try {
    const { data, error } = await supabase.functions.invoke('enhanced-case-matching', {
      body: {
        ...caseInput,
        injuries: caseInput.injuryTypes ? caseInput.injuryTypes.join(', ') : caseInput.injuries
      }
    });

    if (error) {
      console.error('Error calling enhanced case matching:', error);
      throw error;
    }

    return data as EnhancedSettlementResult;
  } catch (error) {
    console.error('Error in getEnhancedSettlement:', error);
    
    // Fallback to basic settlement if AI fails
    return {
      settlement_recommendation: 0,
      confidence_score: 0,
      top_comparable_cases: [],
      value_factors: { increasing: [], decreasing: [] },
      reasoning: "AI analysis failed, falling back to basic calculation",
      traditional_score_validation: null,
      source_case_count: 0
    };
  }
}

/**
 * Format the enhanced settlement result for display
 */
export function formatEnhancedResult(result: any) {
  return {
    proposal: `$${result.settlement_recommendation.toLocaleString()}`,
    rationale: result.reasoning,
    sourceCaseID: result.top_comparable_cases[0]?.case_id || 0,
    expiresOn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric', 
      year: 'numeric'
    }),
    confidence: result.confidence_score,
    comparableCases: result.top_comparable_cases || [],
    valueFactors: result.value_factors,
    settlementRange: {
      low: result.settlement_range_low,
      high: result.settlement_range_high
    },
    policyExceedanceRisk: result.policy_exceedance_risk || 0
  };
}