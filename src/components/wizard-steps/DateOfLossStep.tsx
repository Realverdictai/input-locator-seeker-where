import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CaseData } from "@/types/verdict";

interface DateOfLossStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const DateOfLossStep = ({ formData, setFormData }: DateOfLossStepProps) => {
  // Check statute of limitations for auto accidents
  const checkStatuteOfLimitations = (dateOfLoss: string, caseType: string) => {
    if (caseType !== "auto-accident" || !dateOfLoss) return false;

    const dolDate = new Date(dateOfLoss);
    const today = new Date();
    const covidTollDays = 178; // CA Emergency Rule: 4 Apr 2020 – 1 Oct 2020
    const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
    const covidTollMs = covidTollDays * 24 * 60 * 60 * 1000;

    const timeDiff = today.getTime() - dolDate.getTime();
    return timeDiff > twoYearsInMs + covidTollMs;
  };

  const isSOLExpired = checkStatuteOfLimitations(
    formData.dateOfLoss || "",
    formData.caseType || "",
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dateOfLoss">Date of Loss</Label>
        <Input
          id="dateOfLoss"
          type="date"
          value={formData.dateOfLoss || ""}
          onChange={(e) =>
            setFormData({ ...formData, dateOfLoss: e.target.value })
          }
        />
      </div>

      {isSOLExpired && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠️ Statute of limitations may have expired.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DateOfLossStep;
