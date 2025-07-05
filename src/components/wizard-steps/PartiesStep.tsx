import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CaseData } from "@/types/verdict";

interface PartiesStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const PartiesStep = ({ formData, setFormData }: PartiesStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numberOfPlaintiffs">Number of Plaintiffs</Label>
          <Input
            id="numberOfPlaintiffs"
            type="number"
            min="1"
            value={formData.numberOfPlaintiffs || 1}
            onChange={(e) => setFormData({...formData, numberOfPlaintiffs: parseInt(e.target.value) || 1})}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfDefendants">Number of Defendants</Label>
          <Input
            id="numberOfDefendants"
            type="number"
            min="1"
            value={formData.numberOfDefendants || 1}
            onChange={(e) => setFormData({...formData, numberOfDefendants: parseInt(e.target.value) || 1})}
            placeholder="1"
          />
        </div>
      </div>
    </div>
  );
};

export default PartiesStep;