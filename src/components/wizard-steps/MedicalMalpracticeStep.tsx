import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";

interface MedicalMalpracticeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const MedicalMalpracticeStep = ({ formData, setFormData }: MedicalMalpracticeStepProps) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="providerName">Provider Name</Label>
      <Input
        id="providerName"
        value={formData.providerName || ''}
        onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
        placeholder="Hospital or doctor"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="malpracticeDetails">Malpractice Details</Label>
      <Textarea
        id="malpracticeDetails"
        value={formData.malpracticeDetails || ''}
        onChange={(e) => setFormData({ ...formData, malpracticeDetails: e.target.value })}
        placeholder="Explain the alleged negligence"
        rows={4}
      />
    </div>
  </div>
);

export default MedicalMalpracticeStep;
