
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VerdictEstimate } from "@/types/verdict";

interface VerdictResultsProps {
  estimate: VerdictEstimate;
}

const VerdictResults = ({ estimate }: VerdictResultsProps) => {
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

  const riskLevel = getRiskLevel(estimate.policyExceedanceChance);

  return (
    <div className="space-y-6">
      {/* Verdict Estimates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Verdict Estimates</h3>
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Low Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(estimate.lowVerdict)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600">Mid Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(estimate.midVerdict)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">High Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(estimate.highVerdict)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settlement Range */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Suggested Settlement Range</h3>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(estimate.settlementRangeLow)} - {formatCurrency(estimate.settlementRangeHigh)}
              </p>
              <p className="text-sm text-blue-600 mt-1">Recommended negotiation range</p>
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
            <Progress value={estimate.policyExceedanceChance} className="mb-2" />
            <p className="text-center text-sm text-gray-600">
              {estimate.policyExceedanceChance}% chance of exceeding policy limits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rationale */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Exposure Rationale</h3>
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
