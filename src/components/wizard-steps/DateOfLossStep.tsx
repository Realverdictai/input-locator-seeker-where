import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CaseData } from "@/types/verdict";
import { format, differenceInDays, isValid, parseISO } from "date-fns";

interface DateOfLossStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const DateOfLossStep = ({ formData, setFormData }: DateOfLossStepProps) => {
  // Enhanced statute of limitations checker
  const checkStatuteOfLimitations = (dateOfLoss: string, caseType: string) => {
    // Return early if no date or unsupported case type
    if (!dateOfLoss) return { expired: false, message: "" };
    
    // Parse the date and validate
    const dolDate = parseISO(dateOfLoss);
    if (!isValid(dolDate)) {
      return { expired: false, message: "Invalid date format" };
    }
    
    const today = new Date();
    const daysSinceLoss = differenceInDays(today, dolDate);
    
    // Check if date is in the future
    if (daysSinceLoss < 0) {
      return { 
        expired: false, 
        message: "Date of loss cannot be in the future" 
      };
    }
    
    // Different SOL periods for different case types
    let solDays = 730; // Default 2 years for most cases
    let solDescription = "2 years";
    
    switch (caseType?.toLowerCase()) {
      case "auto-accident":
      case "motorcycle-accident":
      case "bicycle-accident":
      case "pedestrian-accident":
        solDays = 730; // 2 years
        solDescription = "2 years";
        break;
      case "medical-malpractice":
        solDays = 365; // 1 year in CA
        solDescription = "1 year";
        break;
      case "product-liability":
        solDays = 730; // 2 years
        solDescription = "2 years";
        break;
      case "premises-liability":
      case "slip-and-fall":
      case "trip-and-fall":
        solDays = 730; // 2 years
        solDescription = "2 years";
        break;
      case "wrongful-death":
        solDays = 730; // 2 years
        solDescription = "2 years";
        break;
      default:
        solDays = 730; // Default 2 years
        solDescription = "2 years";
    }
    
    // Add COVID toll period for cases that were affected
    // CA Emergency Rule: 4 Apr 2020 – 1 Oct 2020 (178 days)
    const covidTollDays = 178;
    const totalSolDays = solDays + covidTollDays;
    
    const isExpired = daysSinceLoss > totalSolDays;
    const daysRemaining = Math.max(0, totalSolDays - daysSinceLoss);
    
    if (isExpired) {
      return {
        expired: true,
        message: `Statute of limitations (${solDescription} + COVID toll) appears to have expired ${daysSinceLoss - totalSolDays} days ago.`
      };
    } else if (daysRemaining < 90) {
      return {
        expired: false,
        message: `Statute of limitations expires in ${daysRemaining} days. Consider filing soon.`
      };
    }
    
    return { expired: false, message: "" };
  };

  const solCheck = checkStatuteOfLimitations(formData.dateOfLoss || '', formData.caseType || '');
  const hasWarning = solCheck.expired || solCheck.message.includes("expires in");
  const hasError = solCheck.expired || solCheck.message.includes("future") || solCheck.message.includes("Invalid");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dateOfLoss">Date of Loss (Required)</Label>
        <Input
          id="dateOfLoss"
          type="date"
          value={formData.dateOfLoss || ''}
          onChange={(e) => setFormData({...formData, dateOfLoss: e.target.value})}
          max={format(new Date(), 'yyyy-MM-dd')} // Prevent future dates
          className={hasError ? "border-destructive" : ""}
        />
        <p className="text-sm text-muted-foreground">
          Enter the date when the incident occurred
        </p>
      </div>
      
      {solCheck.message && (
        <Alert variant={hasError ? "destructive" : "default"}>
          <AlertDescription>
            {hasError ? "⚠️" : "ℹ️"} {solCheck.message}
            {solCheck.expired && (
              <div className="mt-2 text-sm">
                <strong>Important:</strong> This may affect the viability of your case. 
                Consult with an attorney immediately to explore any possible exceptions or extensions.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {formData.dateOfLoss && (
        <div className="text-sm text-muted-foreground">
          Date entered: {format(parseISO(formData.dateOfLoss), 'MMMM d, yyyy')}
        </div>
      )}
    </div>
  );
};

export default DateOfLossStep;