
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";

interface DateOfLossStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const DateOfLossStep = ({ formData, setFormData }: DateOfLossStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dateOfLoss">Date of Loss</Label>
        <Input
          id="dateOfLoss"
          type="date"
          value={formData.dateOfLoss || ''}
          onChange={(e) => setFormData({...formData, dateOfLoss: e.target.value})}
        />
      </div>
      
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-700 text-sm">
          Select the date when the incident occurred. This will help determine the applicable statute of limitations and other time-sensitive factors.
        </p>
      </div>
    </div>
  );
};

export default DateOfLossStep;
