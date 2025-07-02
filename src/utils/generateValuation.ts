interface NewCase {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
}

interface Comparable {
  CaseID: number;
  CaseType: string;
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  PolLim: string;
  Settle: string;
}

interface ValuationResult {
  recommendedRange: string;
  rationale: string;
  midpoint: number;
  comparables: number[];
  proposal: string;
}

/**
 * Parse a currency string to a number
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

/**
 * Format a number as currency with commas
 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

/**
 * Calculate median from an array of numbers
 */
function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Generate valuation based on new case and comparable cases
 */
export function generateValuation(newCase: NewCase, comparables: Comparable[]): ValuationResult {
  if (!comparables || comparables.length === 0) {
    return {
      recommendedRange: "$0 – $0",
      rationale: "No comparable cases found for analysis.",
      midpoint: 0,
      comparables: [],
      proposal: "$0"
    };
  }

  // 1. Parse settle values into numbers
  const settleValues = comparables
    .map(c => parseCurrency(c.Settle))
    .filter(value => value > 0);

  if (settleValues.length === 0) {
    return {
      recommendedRange: "$0 – $0",
      rationale: "No valid settlement values found in comparable cases.",
      midpoint: 0,
      comparables: comparables.map(c => c.CaseID),
      proposal: "$0"
    };
  }

  // 2. Compute MIN, MAX, and MEDIAN
  const min = Math.min(...settleValues);
  const max = Math.max(...settleValues);
  let median = calculateMedian(settleValues);

  // 3. Apply adjustment rules
  const newCasePolLim = parseCurrency(newCase.PolLim);
  const comparablePolLims = comparables.map(c => parseCurrency(c.PolLim));
  const highestComparablePolLim = Math.max(...comparablePolLims);

  // Rule a: If newCase.PolLim > highest comparable PolLim, increase MEDIAN by 15%
  if (newCasePolLim > highestComparablePolLim) {
    median = median * 1.15;
  }

  // Rule b: If newCase.Surgery is empty/"None" AND at least 3 comparables have non-empty Surgery, decrease MEDIAN by 20%
  const newCaseSurgery = newCase.Surgery?.toLowerCase().trim();
  const hasNoSurgery = !newCaseSurgery || newCaseSurgery === 'none' || newCaseSurgery === '';
  
  const comparablesWithSurgery = comparables.filter(c => {
    const surgery = c.Surgery?.toLowerCase().trim();
    return surgery && surgery !== 'none' && surgery !== '';
  });

  if (hasNoSurgery && comparablesWithSurgery.length >= 3) {
    median = median * 0.8;
  }

  // 4. Create rationale
  const surgeryText = newCase.Surgery && newCase.Surgery.toLowerCase() !== 'none' 
    ? `with ${newCase.Surgery}` 
    : 'without surgery';
  
  const rationale = `Based on ${comparables.length} comparable cases in ${newCase.Venue} ${surgeryText}, considering policy limits of ${newCase.PolLim}.`;

  // 5. Find comparable case closest to midpoint for proposal
  const roundedMedian = Math.round(median);
  let closestSettle = settleValues[0];
  let minDistance = Math.abs(settleValues[0] - roundedMedian);
  
  for (const settle of settleValues) {
    const distance = Math.abs(settle - roundedMedian);
    if (distance < minDistance || (distance === minDistance && settle < closestSettle)) {
      closestSettle = settle;
      minDistance = distance;
    }
  }

  // 6. Return result
  return {
    recommendedRange: `${formatCurrency(min)} – ${formatCurrency(max)}`,
    rationale,
    midpoint: roundedMedian,
    comparables: comparables.map(c => c.CaseID),
    proposal: formatCurrency(closestSettle)
  };
}