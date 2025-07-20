import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Brain, Calculator, Clock, TrendingUp } from "lucide-react";
import { VerdictResult } from "@/types/verdict";

interface VerdictResultsAIProps {
  results: VerdictResult;
  caseData: any;
}

export function VerdictResultsAI({ results, caseData }: VerdictResultsAIProps) {
  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? 
      parseFloat(value.replace(/[$,]/g, '')) : value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 70) return "bg-blue-500";
    if (confidence >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMethodBadge = () => {
    switch (results.method) {
      case 'ai':
        return <Badge className="bg-blue-500"><Brain className="w-3 h-3 mr-1" />AI Prediction</Badge>;
      case 'traditional':
        return <Badge className="bg-green-500"><Calculator className="w-3 h-3 mr-1" />Traditional Method</Badge>;
      case 'hybrid':
        return <Badge className="bg-purple-500"><TrendingUp className="w-3 h-3 mr-1" />Hybrid Analysis</Badge>;
      default:
        return <Badge>Analysis</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Override Notice */}
      {results.manualOverride && (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Manual Override Applied:</strong> This evaluation has been professionally overridden with a custom estimate of {formatCurrency(results.manualOverride.estimate)}.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Evaluation Results */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Case Evaluation Results</CardTitle>
            {getMethodBadge()}
          </div>
          <CardDescription>
            AI-powered analysis using {results.nearestCases.length > 0 ? `${results.nearestCases.length} similar cases` : 'traditional methods'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Evaluation */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Initial Evaluation</h3>
            <p className="text-4xl font-bold text-blue-600">{results.evaluator}</p>
            {results.confidence && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-sm font-medium">Confidence:</span>
                <Badge className={`${getConfidenceColor(results.confidence)} text-white`}>
                  {results.confidence}%
                </Badge>
              </div>
            )}
          </div>

          {/* Deductions */}
          {results.deductions && results.deductions.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Applied Deductions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.deductions.map((deduction, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="font-medium">{deduction.name}</span>
                      <Badge variant="outline">{deduction.pct}%</Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Net Evaluation:</span>
                    <span className="font-bold text-xl text-green-600">{results.evaluatorNet}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mediator Proposal */}
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                Mediator's Proposal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold text-green-600">{results.mediatorProposal}</p>
                <p className="text-sm text-gray-600">Settlement Range: {results.settlementRangeLow} - {results.settlementRangeHigh}</p>
                <div className="flex items-center justify-center gap-1 text-sm text-red-600 font-medium">
                  <Clock className="w-4 h-4" />
                  Expires: {results.expiresOn} at 5:00 PM
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traditional Valuation Comparison */}
          {results.traditionalValuation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Traditional Method Comparison</CardTitle>
                <CardDescription>Alternative calculation using {results.traditionalValuation.method}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Traditional Estimate:</span>
                    <span className="font-bold text-lg">{formatCurrency(results.traditionalValuation.estimatedValue)}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-gray-700">Calculation Factors:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {results.traditionalValuation.factors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Cases */}
          {results.nearestCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Cases Analysis</CardTitle>
                <CardDescription>Cases used for AI prediction model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {results.nearestCases.map((caseId, idx) => (
                    <Badge key={idx} variant="outline" className="justify-center">
                      Case #{caseId}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Case Category Analysis */}
          {caseData.caseCategory && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Case Category Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  Selected Category: <strong>{caseData.caseCategory}</strong>
                </p>
                <p>
                  Accident Type: <strong>{caseData.accidentSubType}</strong>
                </p>
                {results.rationale && (
                  <p className="text-muted-foreground">
                    {"Case category weighting applied in valuation."}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Injury Type Analysis */}
          {results.injuryAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Injury Type Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Primary Injury: <strong>{results.injuryAnalysis.primary}</strong></p>
                <p>Categories: {results.injuryAnalysis.categories.join(', ')}</p>
                <p>Severity Score: {results.injuryAnalysis.severityScore}</p>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Analysis */}
          {results.vehicleAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Size Differential: {results.vehicleAnalysis.sizeDifferential}</p>
                <p>Risk Factor: {results.vehicleAnalysis.riskFactor}</p>
                <p>Safety Score: {results.vehicleAnalysis.safetyScore}</p>
                <p>Impact Pattern: {results.vehicleAnalysis.patternScore}</p>
              </CardContent>
            </Card>
          )}

          {/* Manual Override Details */}
          {results.manualOverride && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg">Manual Override Rationale</CardTitle>
                <CardDescription>Professional assessment by {results.manualOverride.overriddenBy}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Override Amount:</span>
                    <span className="font-bold text-lg text-purple-600">{formatCurrency(results.manualOverride.estimate)}</span>
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm leading-relaxed">{results.manualOverride.rationale}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Rationale */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-700">{results.rationale}</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
