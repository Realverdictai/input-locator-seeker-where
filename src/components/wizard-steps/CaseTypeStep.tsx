
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";
import { caseCategories } from "@/utils/caseCategories";

interface CaseTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const CaseTypeStep = ({ formData, setFormData }: CaseTypeStepProps) => {

  const toggleCaseType = (value: string) => {
    const current = formData.caseType || [];
    const newTypes = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFormData({ ...formData, caseType: newTypes });
  };

  const selected = formData.caseType || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Case Type (Select all that apply)</Label>
        <div className="grid grid-cols-1 gap-3">
          {caseCategories.map(cat => (
            <div key={cat.value} className="flex items-center space-x-2">
              <Checkbox
                id={cat.value}
                checked={selected.includes(cat.value)}
                onCheckedChange={() => toggleCaseType(cat.value)}
              />
              <Label htmlFor={cat.value} className="text-sm">{cat.label}</Label>
            </div>
          ))}
        </div>
      </div>

      {selected.includes('other') && (
        <div className="space-y-2">
          <Label htmlFor="otherCaseType">Please specify case type</Label>
          <Input
            id="otherCaseType"
            type="text"
            value={formData.otherCaseType || ''}
            onChange={(e) => setFormData({...formData, otherCaseType: e.target.value})}
            placeholder="Enter case type"
          />
        </div>
      )}
    </div>
  );
};

export default CaseTypeStep;
