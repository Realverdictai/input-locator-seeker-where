interface MediatorResult {
  mediatorProposal: string;
  expiresOn: string;
}

/**
 * Calculate Mediator's Proposal based on Evaluator Number
 */
export function calcMediatorProposal(
  evaluatorString: string, 
  policyLimits?: number
): MediatorResult {
  // Parse evaluator amount
  const evaluatorAmount = parseFloat(evaluatorString.replace(/[$,]/g, '')) || 0;
  
  let proposalAmount: number;
  
  if (policyLimits && policyLimits > 0) {
    const policyLimit90Percent = policyLimits * 0.90;
    
    // If evaluator exceeds 90% of policy limits, cap at 90%
    if (evaluatorAmount > policyLimit90Percent) {
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
  
  return {
    mediatorProposal: `$${proposalAmount.toLocaleString()}`,
    expiresOn
  };
}
