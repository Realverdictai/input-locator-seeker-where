
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CaseData, PolicyInfo } from "@/types/verdict";
import { Plus, X } from "lucide-react";

interface InsuranceInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const InsuranceInfoStep = ({ formData, setFormData }: InsuranceInfoStepProps) => {
  // Helper function to format numbers with commas
  const formatNumberWithCommas = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('en-US');
  };

  // Helper function to parse formatted number string back to number
  const parseFormattedNumber = (value: string): number | undefined => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const cleanedValue = value.replace(/,/g, '');
    const numValue = Number(cleanedValue);
    return isNaN(numValue) ? undefined : numValue;
  };

  // Helper function to handle formatted number input change
  const handleFormattedNumberChange = (field: keyof CaseData, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setFormData({...formData, [field]: numericValue});
  };

  const addDefendantPolicy = () => {
    const newPolicies = [...(formData.defendantPolicies || []), { defendantName: "", policyLimit: 0 }];
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  const removeDefendantPolicy = (index: number) => {
    const newPolicies = formData.defendantPolicies?.filter((_, i) => i !== index) || [];
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  const updateDefendantPolicy = (index: number, field: keyof PolicyInfo, value: string | number) => {
    const newPolicies = [...(formData.defendantPolicies || [])];
    if (field === 'policyLimit') {
      newPolicies[index] = { ...newPolicies[index], [field]: typeof value === 'string' ? parseFormattedNumber(value) || 0 : value };
    } else {
      newPolicies[index] = { ...newPolicies[index], [field]: value as string };
    }
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="multipleDefendants"
          checked={formData.multipleDefendants || false}
          onCheckedChange={(checked) => setFormData({...formData, multipleDefendants: !!checked})}
        />
        <Label htmlFor="multipleDefendants">Multiple Defendants</Label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Defendant Policies</Label>
          <Button type="button" onClick={addDefendantPolicy} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </Button>
        </div>
        
        {formData.defendantPolicies?.map((policy, index) => (
          <div key={index} className="flex items-center space-x-2 p-4 border rounded">
            <div className="flex-1">
              <Input
                placeholder="Defendant name"
                value={policy.defendantName}
                onChange={(e) => updateDefendantPolicy(index, 'defendantName', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Policy limit"
                value={formatNumberWithCommas(policy.policyLimit)}
                onChange={(e) => updateDefendantPolicy(index, 'policyLimit', e.target.value)}
              />
            </div>
            {formData.defendantPolicies!.length > 1 && (
              <Button type="button" onClick={() => removeDefendantPolicy(index)} size="sm" variant="outline">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="umUimCoverage">UM/UIM Coverage ($)</Label>
        <Input
          id="umUimCoverage"
          type="text"
          value={formatNumberWithCommas(formData.umUimCoverage)}
          onChange={(e) => handleFormattedNumberChange('umUimCoverage', e.target.value)}
          placeholder="Enter UM/UIM coverage"
        />
      </div>
    </div>
  );
};

export default InsuranceInfoStep;
