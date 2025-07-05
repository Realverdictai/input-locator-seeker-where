/**
 * Local ridge regression model for case valuation
 */

interface CaseFeatures {
  howell: number;
  medSpecials: number;
  surgeryCount: number;
  injectionCount: number;
  tbiLevel: number;
  age: number;
  venueMultiplier: number;
  liabilityFactor: number;
  priorAccidents: number;
  gaps: number;
}

interface RegressionResult {
  prediction: number;
  coefficients: Record<string, number>;
  r2: number;
}

/**
 * Extract features from case data
 */
export function extractFeatures(caseData: any): CaseFeatures {
  // Parse settlement amount - use numeric columns first
  const howell = (caseData as any).howell_num || parseFloat(String(caseData.howell || caseData.Howell || '0').replace(/[$,]/g, '')) || 0;
  const medSpecials = (caseData as any).med_specials_num || parseFloat(String(caseData.medicalSpecials || caseData.MedicalSpecials || howell * 1.5).replace(/[$,]/g, '')) || 0;
  
  // Surgery count
  const surgeryCount = parseInt(String(caseData.surgeries || caseData.SurgeryCount || (caseData.surgery && caseData.surgery !== 'None' ? 1 : 0))) || 0;
  
  // Injection count  
  const injectionCount = parseInt(String(caseData.injections || caseData.InjectCount || (caseData.inject && caseData.inject !== 'None' ? 1 : 0))) || 0;
  
  // TBI level (0=none, 1=mild, 2=moderate, 3=severe)
  let tbiLevel = 0;
  const tbi = String(caseData.tbiLevel || caseData.TBI || '').toLowerCase();
  if (tbi.includes('mild')) tbiLevel = 1;
  else if (tbi.includes('moderate')) tbiLevel = 2;
  else if (tbi.includes('severe')) tbiLevel = 3;
  
  // Age
  const age = parseInt(String(caseData.age || caseData.Age || '35')) || 35;
  
  // Venue multiplier
  const venue = String(caseData.venue || caseData.Venue || '').toLowerCase();
  let venueMultiplier = 1.0;
  if (['los angeles', 'alameda', 'san francisco'].includes(venue)) {
    venueMultiplier = 1.03;
  } else if (['orange', 'kern', 'placer'].includes(venue)) {
    venueMultiplier = 0.97;
  }
  
  // Liability factor - use numeric column first
  const liabPct = (caseData as any).liab_pct_num || parseFloat(String(caseData.liab_pct || caseData.LiabPct || '100')) || 100;
  const liabilityFactor = Math.min(1.0, liabPct / 100);
  
  // Prior accidents (1 if yes, 0 if no)
  const priorAccidents = String(caseData.prior_accidents || caseData.PriorAccidents || 'No').toLowerCase().includes('yes') ? 1 : 0;
  
  // Treatment gaps (simplified: 1 if mentioned, 0 if not)
  const gapsText = String(caseData.gaps || caseData.Gaps || caseData.narrative || '').toLowerCase();
  const gaps = gapsText.includes('gap') || gapsText.includes('delay') ? 1 : 0;

  return {
    howell,
    medSpecials,
    surgeryCount,
    injectionCount,
    tbiLevel,
    age,
    venueMultiplier,
    liabilityFactor,
    priorAccidents,
    gaps
  };
}

/**
 * Fit ridge regression model on nearest cases
 */
export function fitLocalModel(nearestCases: any[], alpha: number = 0.8): RegressionResult {
  // Extract features and targets
  const X: number[][] = [];
  const y: number[] = [];
  
  for (const caseData of nearestCases) {
    const features = extractFeatures(caseData);
    const settlement = (caseData as any).settle_num || parseFloat(String(caseData.settle || '0').replace(/[$,]/g, '')) || 0;
    
    if (settlement > 0) {
      // Feature vector
      X.push([
        Math.log(Math.max(1, features.howell)),
        Math.log(Math.max(1, features.medSpecials)),
        features.surgeryCount,
        features.injectionCount,
        features.tbiLevel,
        features.age,
        features.venueMultiplier,
        features.liabilityFactor,
        features.priorAccidents,
        features.gaps
      ]);
      
      // Target (log settlement)
      y.push(Math.log(settlement));
    }
  }
  
  if (X.length === 0) {
    throw new Error('No valid cases for regression');
  }
  
  // Simple ridge regression implementation
  const coefficients = ridgeRegression(X, y, alpha);
  
  // Calculate R²
  const predictions = X.map(row => row.reduce((sum, val, i) => sum + val * coefficients[i], 0));
  const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
  const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
  const residualSumSquares = y.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0);
  const r2 = 1 - (residualSumSquares / totalSumSquares);
  
  return {
    prediction: 0, // Will be calculated when predicting
    coefficients: {
      logHowell: coefficients[0] || 0,
      logMedSpecials: coefficients[1] || 0,
      surgeryCount: coefficients[2] || 0,
      injectionCount: coefficients[3] || 0,
      tbiLevel: coefficients[4] || 0,
      age: coefficients[5] || 0,
      venueMultiplier: coefficients[6] || 0,
      liabilityFactor: coefficients[7] || 0,
      priorAccidents: coefficients[8] || 0,
      gaps: coefficients[9] || 0
    },
    r2
  };
}

/**
 * Predict settlement using fitted model
 */
export function predictSettlement(newCase: any, model: RegressionResult): number {
  const features = extractFeatures(newCase);
  
  const logPrediction = 
    (features.howell > 0 ? Math.log(features.howell) : 0) * model.coefficients.logHowell +
    (features.medSpecials > 0 ? Math.log(features.medSpecials) : 0) * model.coefficients.logMedSpecials +
    features.surgeryCount * model.coefficients.surgeryCount +
    features.injectionCount * model.coefficients.injectionCount +
    features.tbiLevel * model.coefficients.tbiLevel +
    features.age * model.coefficients.age +
    features.venueMultiplier * model.coefficients.venueMultiplier +
    features.liabilityFactor * model.coefficients.liabilityFactor +
    features.priorAccidents * model.coefficients.priorAccidents +
    features.gaps * model.coefficients.gaps;
  
  const prediction = Math.exp(logPrediction);
  
  // Round to nearest $500
  return Math.round(prediction / 500) * 500;
}

/**
 * Simple ridge regression implementation
 */
function ridgeRegression(X: number[][], y: number[], alpha: number): number[] {
  const n = X.length;
  const p = X[0].length;
  
  // Create augmented matrix [X'X + αI | X'y]
  const XtX = Array(p).fill(0).map(() => Array(p).fill(0));
  const Xty = Array(p).fill(0);
  
  // Calculate X'X
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum + (i === j ? alpha : 0); // Add ridge penalty
    }
  }
  
  // Calculate X'y
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    Xty[i] = sum;
  }
  
  // Solve using Gaussian elimination (simplified)
  return gaussianElimination(XtX, Xty);
}

/**
 * Solve linear system using Gaussian elimination
 */
function gaussianElimination(A: number[][], b: number[]): number[] {
  const n = A.length;
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    
    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[i][i]) > 1e-10) {
        const factor = A[k][i] / A[i][i];
        for (let j = i; j < n; j++) {
          A[k][j] -= factor * A[i][j];
        }
        b[k] -= factor * b[i];
      }
    }
  }
  
  // Back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      x[i] -= A[i][j] * x[j];
    }
    if (Math.abs(A[i][i]) > 1e-10) {
      x[i] /= A[i][i];
    }
  }
  
  return x;
}