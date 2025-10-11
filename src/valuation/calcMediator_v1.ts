interface MediatorResult {
  mediator: string;
  expiresOn: string;
  rangeLow: string;
  rangeHigh: string;
}

/**
 * Calculate Mediator's Proposal based on Evaluator Number and Policy Limits
 * Updated for AI-first system compatibility
 */
export function calcMediator(evaluatorString: string, policyLimits?: number): MediatorResult {
  // Parse evaluator amount (handle both string and number formats)
  const evaluatorAmount = typeof evaluatorString === 'string' 
    ? parseFloat(evaluatorString.replace(/[$,]/g, '')) || 0
    : evaluatorString || 0;
  
  let proposalAmount: number;
  
  if (policyLimits && policyLimits > 0) {
    const policyLimit90Percent = policyLimits * 0.90;
    
    // If evaluator exceeds 90% of policy limits, cap at 90%
    if (evaluatorAmount >= policyLimit90Percent) {
      proposalAmount = policyLimit90Percent;
    } else {
      // Otherwise, apply 95% of evaluator (slightly plaintiff-unfriendly)
      proposalAmount = evaluatorAmount * 0.95;
    }
  } else {
    // No policy limits known, apply 95% discount
    proposalAmount = evaluatorAmount * 0.95;
  }
  
  // Round to nearest $500
  proposalAmount = Math.round(proposalAmount / 500) * 500;
  
  // Ensure we don't exceed policy limits
  if (policyLimits && proposalAmount > policyLimits) {
    proposalAmount = policyLimits;
  }
  
  // Calculate expiration date (7 days from now)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  
  const expiresOn = expirationDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Settlement range around proposal (±5%)
  const rangeLow = Math.round(proposalAmount * 0.95 / 500) * 500;
  let rangeHigh = Math.round(proposalAmount * 1.05 / 500) * 500;
  if (policyLimits && rangeHigh > policyLimits) {
    rangeHigh = policyLimits;
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
