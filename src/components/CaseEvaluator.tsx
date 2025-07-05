import { useState } from 'react';
import { generateValuation } from '@/utils/generateValuation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

interface FormData {
  Venue: string;
  Surgery: string;
  Injuries: string;
  LiabPct: string;
  AccType: string;
  PolLim: string;
  medicalSpecials?: string;
  howellSpecials?: string;
  surgeryType?: string;
  injectionType?: string;
  surgeries?: string;
  injections?: string;
  tbiSeverity?: string;
}

interface ValuationResult {
  proposal: string;
  rationale: string;
  sourceCaseID: number;
  expiresOn: string;
  confidence?: number;
  valueFactors?: {
    increasing: string[];  
    decreasing: string[];
  };
  comparableCases?: Array<{
    case_id: number;
    settlement_amount: number;
    similarity_reason: string;
  }>;
  settlementRange?: {
    low: number;
    high: number;
  };
  policyExceedanceRisk?: number;
  policyLimit?: number;
  settlementAmount?: number;
}

interface ComparableCase {
  CaseID: number;
  Settle: string;
}

const CaseEvaluator = () => {
  const [formData, setFormData] = useState<FormData>({
    Venue: '',
    Surgery: '',
    Injuries: '',
    LiabPct: '',
    AccType: '',
    PolLim: '',
    medicalSpecials: '',
    howellSpecials: '',
    surgeryType: '',
    injectionType: '',
    surgeries: '',
    injections: '',
    tbiSeverity: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [comparableCases, setComparableCases] = useState<ComparableCase[]>([]);
  const [showComparables, setShowComparables] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setComparableCases([]);

    try {
      // Call data-driven valuation using database patterns
      const valuation = await generateValuation({
        Venue: formData.Venue,
        Surgery: formData.Surgery,
        Injuries: formData.Injuries,
        LiabPct: formData.LiabPct,
        AccType: formData.AccType,
        PolLim: formData.PolLim,
        medicalSpecials: formData.medicalSpecials ? parseInt(formData.medicalSpecials) : undefined,
        howellSpecials: formData.howellSpecials ? parseInt(formData.howellSpecials) : undefined,
        tbiSeverity: formData.tbiSeverity,
        surgeryType: formData.surgeryType,
        injectionType: formData.injectionType,
        surgeries: formData.surgeries ? parseInt(formData.surgeries) : undefined,
        injections: formData.injections ? parseInt(formData.injections) : undefined
      });
      
      // Set results - use AI comparable cases, not separate findComparables call
      setResult(valuation);
      
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (risk: number) => {
    if (risk > 85) return { label: 'CRITICAL', color: 'destructive', icon: AlertCircle };
    if (risk > 60) return { label: 'HIGH', color: 'destructive', icon: AlertTriangle };
    if (risk > 30) return { label: 'MODERATE', color: 'warning', icon: AlertTriangle };
    return { label: 'LOW', color: 'success', icon: CheckCircle };
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">⚖️ Verdict AI Case Evaluator</h1>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Using Linear Model Analysis of 313 Real Settlement Cases
        </Badge>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Case Information</CardTitle>
          <CardDescription>Enter case details for data-driven settlement analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.Venue}
                  onChange={(e) => handleInputChange('Venue', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="acctype">Accident Type</Label>
                <Input
                  id="acctype"
                  value={formData.AccType}
                  onChange={(e) => handleInputChange('AccType', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="surgery">Surgery (or "None")</Label>
                <Input
                  id="surgery"
                  value={formData.Surgery}
                  onChange={(e) => handleInputChange('Surgery', e.target.value)}
                  placeholder="None"
                  required
                />
              </div>

              <div>
                <Label htmlFor="liabpct">Liability % (0-100)</Label>
                <Input
                  id="liabpct"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.LiabPct}
                  onChange={(e) => handleInputChange('LiabPct', e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="injuries">Injuries</Label>
                <Textarea
                  id="injuries"
                  value={formData.Injuries}
                  onChange={(e) => handleInputChange('Injuries', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="medicalSpecials">Medical Specials ($)</Label>
                <Input
                  id="medicalSpecials"
                  type="number"
                  value={formData.medicalSpecials}
                  onChange={(e) => handleInputChange('medicalSpecials', e.target.value)}
                  placeholder="150000"
                />
              </div>

              <div>
                <Label htmlFor="howellSpecials">Howell Specials ($)</Label>
                <Input
                  id="howellSpecials"
                  type="number"
                  value={formData.howellSpecials}
                  onChange={(e) => handleInputChange('howellSpecials', e.target.value)}
                  placeholder="125000"
                />
              </div>

              <div>
                <Label htmlFor="surgeryType">Surgery Type</Label>
                <Input
                  id="surgeryType"
                  value={formData.surgeryType}
                  onChange={(e) => handleInputChange('surgeryType', e.target.value)}
                  placeholder="e.g., ACDF, Lumbar Fusion"
                />
              </div>

              <div>
                <Label htmlFor="surgeries">Number of Surgeries</Label>
                <Input
                  id="surgeries"
                  type="number"
                  min="0"
                  value={formData.surgeries}
                  onChange={(e) => handleInputChange('surgeries', e.target.value)}
                  placeholder="1"
                />
              </div>

              <div>
                <Label htmlFor="injectionType">Injection Type</Label>
                <Input
                  id="injectionType"
                  value={formData.injectionType}
                  onChange={(e) => handleInputChange('injectionType', e.target.value)}
                  placeholder="e.g., Epidural Steroid"
                />
              </div>

              <div>
                <Label htmlFor="injections">Number of Injections</Label>
                <Input
                  id="injections"
                  type="number"
                  min="0"
                  value={formData.injections}
                  onChange={(e) => handleInputChange('injections', e.target.value)}
                  placeholder="3"
                />
              </div>

              <div>
                <Label htmlFor="tbiSeverity">TBI Severity</Label>
                <Select value={formData.tbiSeverity} onValueChange={(value) => handleInputChange('tbiSeverity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select TBI severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Defense perspective: Mild=minor symptoms, Severe=significant ongoing symptoms
                </p>
              </div>

              <div>
                <Label htmlFor="pollim">Policy Limits ($)</Label>
                <Input
                  id="pollim"
                  value={formData.PolLim}
                  onChange={(e) => handleInputChange('PolLim', e.target.value)}
                  placeholder="$250,000"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Analyzing Case...' : 'Evaluate Case'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Main Settlement Result */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-700">
                ⚖️ Settlement Analysis: {result.proposal}
              </CardTitle>
              <CardDescription className="text-base">
                {result.rationale}
              </CardDescription>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>Case #{result.sourceCaseID}</span>
                <span>•</span>
                <span className="text-red-600 font-medium">Expires: {result.expiresOn}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Policy Exceedance Risk Analysis */}
          {result.policyExceedanceRisk !== undefined && result.policyLimit && result.policyLimit > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRiskLevel(result.policyExceedanceRisk).icon === AlertCircle && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {getRiskLevel(result.policyExceedanceRisk).icon === AlertTriangle && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                  {getRiskLevel(result.policyExceedanceRisk).icon === CheckCircle && <CheckCircle className="w-5 h-5 text-green-500" />}
                  Policy Limit Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Policy Limit:</span>
                    <p className="text-lg font-bold">${result.policyLimit.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Settlement:</span>
                    <p className="text-lg font-bold">{result.proposal}</p>
                  </div>
                  <div>
                    <span className="font-medium">Coverage Ratio:</span>
                    <p className="text-lg font-bold">
                      {((result.settlementAmount || 0) / result.policyLimit * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Exceedance Risk</span>
                    <Badge variant={getRiskLevel(result.policyExceedanceRisk).color as any}>
                      {getRiskLevel(result.policyExceedanceRisk).label} RISK
                    </Badge>
                  </div>
                  <Progress value={result.policyExceedanceRisk} className="h-3" />
                  <p className="text-center text-sm text-muted-foreground mt-1">
                    {result.policyExceedanceRisk}% chance of exceeding policy limits
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Risk Assessment:</span>{' '}
                    {result.policyExceedanceRisk > 85 ? 'CRITICAL - Settlement likely exceeds policy limits. Significant excess exposure risk.' :
                     result.policyExceedanceRisk > 60 ? 'HIGH RISK - Settlement approaching policy limits. Monitor for excess exposure.' :
                     result.policyExceedanceRisk > 30 ? 'MODERATE RISK - Settlement within reasonable range of policy limits.' :
                     'LOW RISK - Settlement well within policy limits.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Value Factors Analysis */}
          {result.valueFactors && (
            <Card>
              <CardHeader>
                <CardTitle>Settlement Factor Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.valueFactors.increasing.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                        📈 Value Increasing Factors
                      </h4>
                      <ul className="space-y-1">
                        {result.valueFactors.increasing.map((factor, index) => (
                          <li key={index} className="text-sm text-green-700 pl-2 border-l-2 border-green-200">
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.valueFactors.decreasing.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                        📉 Value Decreasing Factors
                      </h4>
                      <ul className="space-y-1">
                        {result.valueFactors.decreasing.map((factor, index) => (
                          <li key={index} className="text-sm text-red-700 pl-2 border-l-2 border-red-200">
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparable Cases */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Comparable Cases</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowComparables(!showComparables)}
                >
                  {showComparables ? 'Hide' : 'Show'} Similar Cases
                </Button>
              </div>
            </CardHeader>
            {showComparables && result.comparableCases && result.comparableCases.length > 0 && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border rounded-lg">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-3 text-left border border-border font-semibold">
                          Case ID
                        </th>
                        <th className="p-3 text-left border border-border font-semibold">
                          Settlement Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.comparableCases.map((caseItem, index) => (
                        <tr key={caseItem.case_id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="p-3 border border-border">
                            {caseItem.case_id}
                          </td>
                          <td className="p-3 border border-border font-medium">
                            ${caseItem.settlement_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default CaseEvaluator;