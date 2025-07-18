import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ConfidenceWarningProps {
  confidence: number;
  isNovelCase?: boolean;
  caseType?: string[];
}

export function ConfidenceWarning({ confidence, isNovelCase, caseType }: ConfidenceWarningProps) {
  if (confidence >= 70) return null;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return "secondary";
    if (conf >= 50) return "outline";
    return "destructive";
  };

  const getWarningLevel = (conf: number) => {
    if (conf >= 50) return "moderate";
    return "high";
  };

  const warningLevel = getWarningLevel(confidence);

  return (
    <Alert className={`border-2 ${warningLevel === 'high' ? 'border-destructive' : 'border-orange-500'}`}>
      <AlertTriangle className={`h-4 w-4 ${warningLevel === 'high' ? 'text-destructive' : 'text-orange-600'}`} />
      <AlertTitle className="flex items-center gap-2">
        Low Confidence Prediction
        <Badge variant={getConfidenceColor(confidence)}>
          {confidence}% Confidence
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          {warningLevel === 'high' 
            ? "⚠️ This case type has very limited historical data. The AI prediction may be significantly inaccurate."
            : "⚡ This case has some novel characteristics. Consider the prediction with caution."
          }
        </p>
        
        {isNovelCase && (
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Novel Case Detected</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Case type: <span className="font-medium">{caseType?.join(', ')}</span> has limited matches in our database.
              Consider using manual override or consulting with colleagues.
            </p>
          </div>
        )}
        
        <div className="text-sm space-y-1">
          <p><strong>Recommendations:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Review the AI rationale carefully</li>
            <li>Consider manual override with your own estimate</li>
            <li>Cross-reference with traditional valuation methods</li>
            <li>Consult recent jury verdicts for similar cases</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}