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
      { value: "auto-accident", label: "Auto Accident" },
      { value: "motorcycle-accident", label: "Motorcycle Accident" },
      { value: "truck-accident", label: "Commercial Truck Accident" },
      { value: "bicycle-accident", label: "Bicycle Accident" },
      { value: "pedestrian-accident", label: "Pedestrian Accident" },
      { value: "rideshare-accident", label: "Rideshare Accident" },
      { value: "boating-accident", label: "Boating/Maritime Accident" },
      { value: "aviation-accident", label: "Aviation Accident" },
      { value: "train-accident", label: "Train/Railroad Accident" },
      { value: "dog-bite", label: "Dog Bite" },
      { value: "assault-battery", label: "Assault/Battery" },
      { value: "sports-injury", label: "Sports/Recreation Injury" },
      { value: "school-daycare", label: "School or Daycare Incident" },
      { value: "government-liability", label: "Government Liability" },
      { value: "defamation-libel", label: "Defamation/Libel" },
      { value: "wrongful-death", label: "Wrongful Death" },
      { value: "other-personal", label: "Other" }
    ]
  },
  "workers-compensation": {
    label: "Workers Compensation",
    sub: [
      { value: "workplace-accident", label: "Workplace Accident" },
      { value: "construction-accident", label: "Construction Accident" },
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
      { value: "medication-error", label: "Medication Error" },
      { value: "anesthesia-error", label: "Anesthesia Error" },
      { value: "nursing-home-neglect", label: "Nursing Home Neglect" },
      { value: "nursing-home-abuse", label: "Nursing Home Abuse" },
      { value: "hospital-negligence", label: "Hospital Negligence" }
    ]
  },
  "product-liability": {
    label: "Product Liability",
    sub: [
      { value: "defective-auto-part", label: "Defective Auto Part" },
      { value: "consumer-product", label: "Consumer Product" },
      { value: "pharmaceutical", label: "Pharmaceutical" },
      { value: "medical-device", label: "Defective Medical Device" },
      { value: "toxic-exposure", label: "Toxic Exposure" },
      { value: "food-poisoning", label: "Food Poisoning" }
    ]
  },
  "premises-liability": {
    label: "Premises Liability",
    sub: [
      { value: "slip-fall", label: "Slip and Fall" },
      { value: "trip-fall", label: "Trip and Fall" },
      { value: "dangerous-condition", label: "Dangerous Condition" },
      { value: "negligent-security", label: "Negligent Security" },
      { value: "homeowner-premises", label: "Homeowner Premises" }
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
