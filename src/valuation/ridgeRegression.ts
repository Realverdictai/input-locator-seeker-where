/**
 * Ridge regression implementation for case evaluation
 */

import { CaseFeatures } from './featureExtractor';

export interface RegressionResult {
  prediction: number;
  confidence: number;
  nearestCaseIds: number[];
}

/**
 * Fit ridge regression model on similar cases
 */
export function fitRidgeRegression(
  targetFeatures: CaseFeatures,
  similarCases: Array<{ features: CaseFeatures; settlement: number; case_id: number }>,
  alpha: number = 0.8
): RegressionResult {
  if (similarCases.length === 0) {
    throw new Error('No similar cases found for regression');
  }

  // Convert features to matrix format (scaled for better numerical stability)
  const X = similarCases.map(c => featuresToArray(c.features));
  const y = similarCases.map(c => c.settlement);
  const targetX = featuresToArray(targetFeatures);

  // Fit ridge regression without standardization to avoid prediction scaling issues
  const weights = solveRidgeRegression(X, y, alpha);
  
  // Make prediction
  const prediction = dotProduct([1, ...targetX], weights); // Add intercept term

  // Calculate confidence based on feature similarity
  const confidence = calculateConfidence(targetFeatures, similarCases.map(c => c.features));

  // Round to nearest $500
  const roundedPrediction = Math.round(prediction / 500) * 500;

  return {
    prediction: Math.max(roundedPrediction, 25000), // Minimum $25,000 for injury cases
    confidence,
    nearestCaseIds: similarCases.map(c => c.case_id)
  };
}

/**
 * Convert features object to array
 */
function featuresToArray(features: CaseFeatures): number[] {
  return [
    features.howellSpecials / 100000, // Scale to reasonable range
    features.surgeryCount,
    features.surgeryComplexity,
    features.injectionCount,
    features.tbiSeverity,
    features.medTreatmentGapDays / 365, // Scale to years
    features.totalTreatmentDuration / 365, // Scale to years
    features.liabilityPct / 100, // Scale to 0-1
    features.policyLimitRatio,
    features.venueCpiIndex,
    features.caseVintageYears,
    features.priorAccidentsFlag,
    features.subsequentAccidentsFlag,
    features.preExistingConditionFlag,
    features.nonComplianceFlag,
    features.conflictingMedicalOpinionsFlag
  ];
}

/**
 * Standardize features (z-score normalization)
 */
function standardizeFeatures(
  X: number[][],
  targetX: number[]
): {
  standardizedX: number[][];
  standardizedTarget: number[];
  means: number[];
  stds: number[];
} {
  const numFeatures = X[0].length;
  const means = new Array(numFeatures).fill(0);
  const stds = new Array(numFeatures).fill(1);

  // Calculate means
  for (let j = 0; j < numFeatures; j++) {
    means[j] = X.reduce((sum, row) => sum + row[j], 0) / X.length;
  }

  // Calculate standard deviations
  for (let j = 0; j < numFeatures; j++) {
    const variance = X.reduce((sum, row) => sum + Math.pow(row[j] - means[j], 2), 0) / X.length;
    stds[j] = Math.sqrt(variance) || 1; // Avoid division by zero
  }

  // Standardize training data
  const standardizedX = X.map(row =>
    row.map((val, j) => (val - means[j]) / stds[j])
  );

  // Standardize target
  const standardizedTarget = targetX.map((val, j) => (val - means[j]) / stds[j]);

  return { standardizedX, standardizedTarget, means, stds };
}

/**
 * Solve ridge regression using normal equations
 */
function solveRidgeRegression(X: number[][], y: number[], alpha: number): number[] {
  const n = X.length;
  const p = X[0].length;

  // Add intercept column
  const XWithIntercept = X.map(row => [1, ...row]);
  
  // Compute X^T * X + alpha * I
  const XTX = matrixMultiply(transpose(XWithIntercept), XWithIntercept);
  
  // Add ridge penalty (don't penalize intercept)
  for (let i = 1; i < XTX.length; i++) {
    XTX[i][i] += alpha;
  }

  // Compute X^T * y
  const XTy = matrixVectorMultiply(transpose(XWithIntercept), y);

  // Solve (X^T * X + alpha * I) * beta = X^T * y
  return solveLinearSystem(XTX, XTy);
}

/**
 * Matrix multiplication
 */
function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const result = Array(A.length).fill(null).map(() => Array(B[0].length).fill(0));
  
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < B[0].length; j++) {
      for (let k = 0; k < B.length; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return result;
}

/**
 * Matrix transpose
 */
function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map(row => row[i]));
}

/**
 * Matrix-vector multiplication
 */
function matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row => 
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

/**
 * Dot product
 */
function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * Solve linear system using Gaussian elimination
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / (augmented[i][i] || 1e-10);
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i] || 1e-10;
  }

  return x;
}

/**
 * Calculate confidence based on feature similarity
 */
function calculateConfidence(
  targetFeatures: CaseFeatures,
  similarFeatures: CaseFeatures[]
): number {
  if (similarFeatures.length === 0) return 0;

  const targetArray = featuresToArray(targetFeatures);
  const similarities = similarFeatures.map(features => {
    const featureArray = featuresToArray(features);
    return cosineSimilarity(targetArray, featureArray);
  });

  const meanSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
  return Math.round(meanSimilarity * 100);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProd = dotProduct(a, b);
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  
  if (normA === 0 || normB === 0) return 0;
  return dotProd / (normA * normB);
}