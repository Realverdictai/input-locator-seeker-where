
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";

interface InjuryTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const InjuryTypeStep = ({ formData, setFormData }: InjuryTypeStepProps) => {
  const injuryTypes = [
    "Soft Tissue",
    "Fracture", 
    "Spinal Injury",
    "Traumatic Brain Injury",
    "Burn Injury",
    "Amputation",
    "Internal Injury",
    "Nerve Damage",
    "Psychological Injury (PTSD)",
    "Death",
    "Other"
  ];

  const toggleInjuryType = (injuryType: string) => {
    const currentTypes = formData.injuryTypes || [];
    const newTypes = currentTypes.includes(injuryType)
      ? currentTypes.filter(type => type !== injuryType)
      : [...currentTypes, injuryType];
    setFormData({...formData, injuryTypes: newTypes});
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Injury Types (Select all that apply)</Label>
        <div className="grid grid-cols-1 gap-3">
          {injuryTypes.map(injury => (
            <div key={injury} className="flex items-center space-x-2">
              <Checkbox
                id={injury}
                checked={formData.injuryTypes?.includes(injury) || false}
                onCheckedChange={() => toggleInjuryType(injury)}
              />
              <Label htmlFor={injury} className="text-sm">{injury}</Label>
            </div>
          ))}
        </div>
      </div>

      {formData.injuryTypes?.includes('Other') && (
        <div className="space-y-2">
          <Label htmlFor="otherInjuryType">Please specify other injury type</Label>
          <Input
            id="otherInjuryType"
            type="text"
            value={formData.otherInjuryType || ''}
            onChange={(e) => setFormData({...formData, otherInjuryType: e.target.value})}
            placeholder="Describe other injury type"
          />
        </div>
      )}
    </div>
  );
};

export default InjuryTypeStep;
