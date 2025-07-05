
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

  // Calculate policy exceedance based on high verdict vs policy limits
  const calculatePolicyExceedance = () => {
    if (!policyLimits || policyLimits <= 0) return 0;
    if (estimate.highVerdict <= policyLimits) return 0;
    
    // Calculate percentage of exceedance
    const exceedanceAmount = estimate.highVerdict - policyLimits;
    const exceedancePercentage = (exceedanceAmount / policyLimits) * 100;
    
    // Cap at 100% for display purposes
    return Math.min(100, exceedancePercentage);
  };

  const policyExceedancePercentage = calculatePolicyExceedance();
  const riskLevel = getRiskLevel(policyExceedancePercentage);

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


      {/* Policy Exceedance Risk */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Policy Limits Exceedance Risk</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Risk Level</span>
              <Badge className={`${riskLevel.color} text-white`}>
                {riskLevel.label}
              </Badge>
            </div>
            <Progress value={policyExceedancePercentage} className="mb-2" />
            <p className="text-center text-sm text-gray-600">
              {policyLimits ? (
                policyExceedancePercentage > 0 ? 
                  `High verdict (${formatCurrency(estimate.highVerdict)}) exceeds policy limits (${formatCurrency(policyLimits)}) by ${Math.round(policyExceedancePercentage)}%`
                  : `Case value within policy limits (${formatCurrency(policyLimits)})`
              ) : 'Policy limits not specified'}
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
