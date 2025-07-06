
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VerdictEstimate } from "@/types/verdict";

interface VerdictResultsProps {
  estimate: VerdictEstimate;
  policyLimits?: number;
  mediatorProposal?: number;
}

const VerdictResults = ({ estimate, policyLimits, mediatorProposal }: VerdictResultsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRiskLevel = (percentage: number) => {
    if (percentage < 25) return { label: 'Low', color: 'bg-green-500' };
    if (percentage < 50) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (percentage < 75) return { label: 'High', color: 'bg-orange-500' };
    return { label: 'Very High', color: 'bg-red-500' };
  };

  // Enhanced risk assessment for policy exceedance
  const calculateComprehensiveRisk = () => {
    if (!policyLimits || policyLimits <= 0) {
      return {
        exceedanceRisk: 0,
        reserveAdequacy: 'Unknown',
        badFaithRisk: 'Low',
        recommendation: 'Set policy limits to enable risk analysis',
        riskFactors: []
      };
    }

    const midpoint = (estimate.settlementRangeLow + estimate.settlementRangeHigh) / 2;
    const evaluatorAmount = estimate.highVerdict; // Using high verdict as evaluator
    
    // Calculate probability of exceeding policy limits
    let exceedanceRisk = 0;
    const riskFactors = [];
    
    // Risk based on evaluator vs policy limits
    const evaluatorRatio = evaluatorAmount / policyLimits;
    if (evaluatorRatio > 1.0) {
      exceedanceRisk = 85; // High risk if evaluator exceeds limits
      riskFactors.push('Evaluator exceeds policy limits');
    } else if (evaluatorRatio > 0.9) {
      exceedanceRisk = 65; // High risk if close to limits
      riskFactors.push('Evaluator near policy limits (>90%)');
    } else if (evaluatorRatio > 0.8) {
      exceedanceRisk = 45; // Moderate risk
      riskFactors.push('Evaluator at 80-90% of limits');
    } else if (evaluatorRatio > 0.6) {
      exceedanceRisk = 25; // Low-moderate risk
      riskFactors.push('Evaluator at 60-80% of limits');
    } else {
      exceedanceRisk = 10; // Low risk
    }

    // Adjust for settlement range volatility
    const rangeSpread = estimate.settlementRangeHigh - estimate.settlementRangeLow;
    const volatilityFactor = rangeSpread / midpoint;
    if (volatilityFactor > 0.5) {
      exceedanceRisk += 15;
      riskFactors.push('High settlement range volatility');
    } else if (volatilityFactor > 0.3) {
      exceedanceRisk += 8;
      riskFactors.push('Moderate settlement volatility');
    }

    // Policy exceedance chance from verdict estimate
    if (estimate.policyExceedanceChance && estimate.policyExceedanceChance > 0) {
      exceedanceRisk = Math.max(exceedanceRisk, estimate.policyExceedanceChance);
      riskFactors.push(`${estimate.policyExceedanceChance}% statistical exceedance chance`);
    }

    // Cap at 95%
    exceedanceRisk = Math.min(95, exceedanceRisk);

    // Reserve adequacy assessment
    let reserveAdequacy = 'Adequate';
    if (evaluatorRatio > 0.95) reserveAdequacy = 'Critically Inadequate';
    else if (evaluatorRatio > 0.85) reserveAdequacy = 'Inadequate';  
    else if (evaluatorRatio > 0.75) reserveAdequacy = 'Marginal';
    else if (evaluatorRatio > 0.6) reserveAdequacy = 'Adequate';
    else reserveAdequacy = 'Conservative';

    // Bad faith risk assessment
    let badFaithRisk = 'Low';
    if (evaluatorRatio > 0.9 && exceedanceRisk > 60) badFaithRisk = 'High';
    else if (evaluatorRatio > 0.8 && exceedanceRisk > 40) badFaithRisk = 'Moderate';
    else if (evaluatorRatio > 0.7) badFaithRisk = 'Low-Moderate';

    // Risk management recommendations
    let recommendation = '';
    if (exceedanceRisk > 70) {
      recommendation = 'URGENT: Consider excess carrier notification and aggressive settlement';
    } else if (exceedanceRisk > 50) {
      recommendation = 'Consider increased reserves and proactive settlement discussions';
    } else if (exceedanceRisk > 30) {
      recommendation = 'Monitor closely and maintain adequate reserves';
    } else {
      recommendation = 'Continue standard case management protocols';
    }

    return {
      exceedanceRisk,
      reserveAdequacy,
      badFaithRisk,
      recommendation,
      riskFactors,
      evaluatorRatio
    };
  };

  const riskAssessment = calculateComprehensiveRisk();
  const riskLevel = getRiskLevel(riskAssessment.exceedanceRisk);

  return (
    <div className="space-y-6">
      {/* Free Model Status */}
      {estimate.isFreeModel && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className="bg-blue-500 text-white mb-2">Free Evaluation</Badge>
              <p className="text-sm text-blue-700">
                Case {estimate.casesEvaluated} of 10 free evaluations
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Upgrade for unlimited access and advanced features
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!estimate.isFreeModel && estimate.casesEvaluated > 10 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Badge className="bg-orange-500 text-white mb-2">Free Limit Reached</Badge>
              <p className="text-sm text-orange-700">
                You've used all 10 free evaluations
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Upgrade to continue with unlimited evaluations
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement Range */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Suggested Settlement Range</h3>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(estimate.settlementRangeLow)} - {formatCurrency(estimate.settlementRangeHigh)}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {mediatorProposal ? 
                  `Midpoint target: ${formatCurrency(mediatorProposal)}` : 
                  'Recommended negotiation range'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mediation Notice */}
      <div className="space-y-3">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-amber-700 font-medium">
                📧 A mediator's proposal will be emailed to you once the other side has completed their session.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Both parties must complete their evaluations before the mediation proposal is sent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Risk Assessment */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Comprehensive Risk Assessment</h3>
        
        {/* Policy Exceedance Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Policy Limits Exceedance Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Risk Level</span>
              <Badge className={`${riskLevel.color} text-white`}>
                {riskLevel.label} ({riskAssessment.exceedanceRisk}%)
              </Badge>
            </div>
            <Progress value={riskAssessment.exceedanceRisk} className="mb-2" />
            <p className="text-center text-sm text-gray-600">
              {policyLimits ? (
                `Evaluator: ${formatCurrency(estimate.highVerdict)} vs Policy Limits: ${formatCurrency(policyLimits)} (${Math.round(riskAssessment.evaluatorRatio * 100)}% of limits)`
              ) : 'Policy limits not specified'}
            </p>
          </CardContent>
        </Card>

        {/* Reserve Adequacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reserve Adequacy Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Reserve Status</span>
              <Badge className={
                riskAssessment.reserveAdequacy === 'Critically Inadequate' ? 'bg-red-500' :
                riskAssessment.reserveAdequacy === 'Inadequate' ? 'bg-orange-500' :
                riskAssessment.reserveAdequacy === 'Marginal' ? 'bg-yellow-500' :
                riskAssessment.reserveAdequacy === 'Adequate' ? 'bg-green-500' :
                'bg-blue-500'
              }>
                {riskAssessment.reserveAdequacy}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Bad Faith Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bad Faith Exposure Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bad Faith Risk Level</span>
              <Badge className={
                riskAssessment.badFaithRisk === 'High' ? 'bg-red-500' :
                riskAssessment.badFaithRisk === 'Moderate' ? 'bg-orange-500' :
                riskAssessment.badFaithRisk === 'Low-Moderate' ? 'bg-yellow-500' :
                'bg-green-500'
              }>
                {riskAssessment.badFaithRisk}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        {riskAssessment.riskFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {riskAssessment.riskFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Risk Management Recommendation */}
        <Card className={
          riskAssessment.exceedanceRisk > 70 ? 'bg-red-50 border-red-200' :
          riskAssessment.exceedanceRisk > 50 ? 'bg-orange-50 border-orange-200' :
          riskAssessment.exceedanceRisk > 30 ? 'bg-yellow-50 border-yellow-200' :
          'bg-green-50 border-green-200'
        }>
          <CardHeader>
            <CardTitle className="text-base">Risk Management Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {riskAssessment.recommendation}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rationale */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Comprehensive Exposure Analysis</h3>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              {estimate.rationale}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerdictResults;
