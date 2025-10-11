import { useState } from "react";
import { Calculator, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ManualOverrideProps {
  aiEstimate: string;
  onOverride: (estimate: number, rationale: string) => void;
  traditionalEstimate?: {
    estimatedValue: number;
    method: string;
    factors: string[];
  };
}

export function ManualOverride({ aiEstimate, onOverride, traditionalEstimate }: ManualOverrideProps) {
  const [manualEstimate, setManualEstimate] = useState("");
  const [rationale, setRationale] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    const estimate = parseFloat(manualEstimate.replace(/[$,]/g, ""));
    if (estimate > 0 && rationale.trim()) {
      onOverride(estimate, rationale);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const useTraditionalEstimate = () => {
    if (traditionalEstimate) {
      setManualEstimate(traditionalEstimate.estimatedValue.toString());
      setRationale(`Traditional valuation using ${traditionalEstimate.method}:\n\n${traditionalEstimate.factors.join('\n')}`);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="border-dashed border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Calculator className="h-8 w-8 mx-auto text-primary" />
            <div>
              <h3 className="font-semibold">Manual Override Available</h3>
              <p className="text-sm text-muted-foreground">
                Not confident in the AI estimate? Provide your own professional assessment.
              </p>
            </div>
            <Button onClick={() => setIsExpanded(true)} variant="outline">
              Enter Manual Estimate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Manual Case Valuation Override
        </CardTitle>
        <CardDescription>
          Override the AI prediction with your professional judgment. This will be used for all calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reference Values */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Reference Estimates</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Prediction</span>
                <Badge variant="secondary">AI</Badge>
              </div>
              <p className="text-lg font-semibold">{aiEstimate}</p>
            </div>
            
            {traditionalEstimate && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Traditional Method</span>
                  <Badge variant="outline">Traditional</Badge>
                </div>
                <p className="text-lg font-semibold">{formatCurrency(traditionalEstimate.estimatedValue)}</p>
                <Button 
                  onClick={useTraditionalEstimate}
                  variant="ghost" 
                  size="sm" 
                  className="mt-1 h-6 text-xs"
                >
                  Use This Estimate
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Manual Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-estimate" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Your Professional Estimate
            </Label>
            <Input
              id="manual-estimate"
              type="text"
              placeholder="$750,000"
              value={manualEstimate}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (value) {
                  const formatted = parseInt(value).toLocaleString();
                  setManualEstimate(formatted);
                } else {
                  setManualEstimate("");
                }
              }}
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rationale" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Rationale for Your Estimate
            </Label>
            <Textarea
              id="rationale"
              placeholder="Explain your reasoning for this valuation (e.g., similar cases, jury verdicts, unique factors...)"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        {/* Traditional Method Details */}
        {traditionalEstimate && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Traditional Method Breakdown</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {traditionalEstimate.factors.map((factor, index) => (
                <div key={index}>• {factor}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSubmit}
            disabled={!manualEstimate || !rationale.trim()}
            className="flex-1"
          >
            Apply Manual Override
          </Button>
          <Button 
            onClick={() => setIsExpanded(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}