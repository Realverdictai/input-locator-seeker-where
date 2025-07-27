import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CaseData } from "@/types/verdict";
import { caseCategoryHierarchy } from "@/utils/caseCategories";

interface CaseAndAccidentTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}
const CaseAndAccidentTypeStep = ({ formData, setFormData }: CaseAndAccidentTypeStepProps) => {
  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      caseCategory: value,
      accidentSubType: '',
      combinedCaseType: ''
    });
  };

  const handleSubTypeChange = (value: string) => {
    const category = formData.caseCategory || '';
    const categoryLabel = caseCategoryHierarchy[category]?.label || '';
    const subLabel = caseCategoryHierarchy[category]?.sub.find(s => s.value === value)?.label || '';
    setFormData({
      ...formData,
      accidentSubType: value,
      combinedCaseType: categoryLabel && subLabel ? `${categoryLabel} - ${subLabel}` : ''
    });
  };

  const subOptions = formData.caseCategory
    ? caseCategoryHierarchy[formData.caseCategory].sub
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="caseCategory">Case Category</Label>
        <Select value={formData.caseCategory || ''} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select case category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(caseCategoryHierarchy).map(([value, obj]) => (
              <SelectItem key={value} value={value}>{obj.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.caseCategory && (
        <div className="space-y-2">
          <Label htmlFor="accidentSubType">Accident Sub-Type</Label>
          <Select value={formData.accidentSubType || ''} onValueChange={handleSubTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select accident sub-type" />
            </SelectTrigger>
            <SelectContent>
              {subOptions.map(sub => (
                <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.combinedCaseType && (
        <div className="p-4 bg-amber-50 rounded border border-amber-200 text-sm text-amber-800">
          Selected: {formData.combinedCaseType}
        </div>
      )}
    </div>
  );
};

export default CaseAndAccidentTypeStep;
