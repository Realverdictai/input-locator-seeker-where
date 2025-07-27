import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface CaseAndAccidentTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const hierarchy: Record<string, { label: string; sub: { value: string; label: string }[] }> = {
  "personal-injury": {
    label: "Personal Injury",
    sub: [
      { value: "motor-vehicle", label: "Motor Vehicle" },
      { value: "dog-bite", label: "Dog Bite" },
      { value: "assault-battery", label: "Assault/Battery" }
    ]
  },
  "workers-compensation": {
    label: "Workers Compensation",
    sub: [
      { value: "industrial-accident", label: "Industrial Accident" },
      { value: "repetitive-stress", label: "Repetitive Stress" },
      { value: "chemical-exposure", label: "Chemical Exposure" }
    ]
  },
  "medical-malpractice": {
    label: "Medical Malpractice",
    sub: [
      { value: "surgical-error", label: "Surgical Error" },
      { value: "misdiagnosis", label: "Misdiagnosis" },
      { value: "birth-injury", label: "Birth Injury" },
      { value: "medication-error", label: "Medication Error" }
    ]
  },
  "product-liability": {
    label: "Product Liability",
    sub: [
      { value: "defective-auto-part", label: "Defective Auto Part" },
      { value: "pharmaceutical", label: "Pharmaceutical" },
      { value: "consumer-product", label: "Consumer Product" }
    ]
  },
  "premises-liability": {
    label: "Premises Liability",
    sub: [
      { value: "slip-trip-fall", label: "Slip/Trip & Fall" },
      { value: "negligent-security", label: "Negligent Security" },
      { value: "dangerous-condition", label: "Dangerous Condition" }
    ]
  }
};

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
    const categoryLabel = hierarchy[category]?.label || '';
    const subLabel = hierarchy[category]?.sub.find(s => s.value === value)?.label || '';
    setFormData({
      ...formData,
      accidentSubType: value,
      combinedCaseType: categoryLabel && subLabel ? `${categoryLabel} - ${subLabel}` : ''
    });
  };

  const subOptions = formData.caseCategory ? hierarchy[formData.caseCategory].sub : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="caseCategory">Case Category</Label>
        <Select value={formData.caseCategory || ''} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select case category" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(hierarchy).map(([value, obj]) => (
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
