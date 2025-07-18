import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import { VerdictResult } from "@/types/verdict";
import { calcEvaluatorAI } from '@/valuation/calcEvaluatorAI';
import { VerdictResultsAI } from './VerdictResultsAI';
import { ConfidenceWarning } from './ConfidenceWarning';
import { ManualOverride } from './ManualOverride';

interface CaseEvaluatorAIProps {
  caseData: any;
}

export function CaseEvaluatorAI({ caseData }: CaseEvaluatorAIProps) {
  const [results, setResults] = useState<VerdictResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualOverride, setShowManualOverride] = useState(false);

  const handleEvaluate = async () => {
    if (!caseData) return;
    
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const evaluation = await calcEvaluatorAI(caseData, caseData.narrative, {
        plaintiffBottomLine: caseData.plaintiffBottomLine,
        defenseAuthority: caseData.defenseAuthority,
        defenseRangeLow: caseData.defenseRangeLow,
        defenseRangeHigh: caseData.defenseRangeHigh
      });
      setResults(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualOverride = (estimate: number, rationale: string) => {
    if (results) {
      const overriddenResults: VerdictResult = {
        ...results,
        evaluator: `$${estimate.toLocaleString()}`,
        evaluatorNet: `$${estimate.toLocaleString()}`, // Assume no deductions for manual override
        manualOverride: {
          estimate,
          rationale,
          overriddenBy: 'Attorney'
        },
        method: 'hybrid'
      };
      setResults(overriddenResults);
      setShowManualOverride(false);
    }
  };

  if (!caseData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please complete the case details to get an evaluation.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            AI Case Evaluation
          </CardTitle>
          <CardDescription>
            Advanced AI analysis using 16-factor regression model and historical case data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleEvaluate}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Case...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate AI Evaluation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* Confidence Warning */}
          <ConfidenceWarning 
            confidence={results.confidence}
            isNovelCase={results.isNovelCase}
            caseType={caseData.caseType}
          />
          
          {/* Manual Override */}
          {(results.confidence < 70 || results.isNovelCase) && !results.manualOverride && (
            <ManualOverride 
              aiEstimate={results.evaluator}
              onOverride={handleManualOverride}
              traditionalEstimate={results.traditionalValuation}
            />
          )}
          
          {/* Results */}
          <VerdictResultsAI 
            results={results}
            caseData={caseData}
          />
        </div>
      )}
    </div>
  );
}