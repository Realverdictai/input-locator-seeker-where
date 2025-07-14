
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";
import { caseCategories } from "@/utils/caseCategories";

interface CaseTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const CaseTypeStep = ({ formData, setFormData }: CaseTypeStepProps) => {
  const caseTypes = caseCategories.map(c => ({ label: c.label, value: c.value }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="caseType">Case Type (Required)</Label>
        <Select 
          value={formData.caseType || ''} 
          onValueChange={(value) => setFormData({...formData, caseType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select case type" />
          </SelectTrigger>
          <SelectContent>
            {caseTypes.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.caseType === 'other' && (
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
