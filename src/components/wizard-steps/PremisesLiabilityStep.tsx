import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";

interface PremisesLiabilityStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const PremisesLiabilityStep = ({ formData, setFormData }: PremisesLiabilityStepProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="premisesLocation">Incident Location</Label>
      <Input
        id="premisesLocation"
        value={formData.premisesLocation || ''}
        onChange={(e) => setFormData({ ...formData, premisesLocation: e.target.value })}
        placeholder="Property address or description"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="hazardDescription">Hazard Description</Label>
      <Textarea
        id="hazardDescription"
        value={formData.hazardDescription || ''}
        onChange={(e) => setFormData({ ...formData, hazardDescription: e.target.value })}
        placeholder="Describe the hazardous condition"
        rows={4}
      />
    </div>
  </div>
);

export default PremisesLiabilityStep;
