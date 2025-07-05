import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CaseData } from "@/types/verdict";

interface InjuryTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const InjuryTypeStep = ({ formData, setFormData }: InjuryTypeStepProps) => {
  const injuryTypes = [
    "soft-tissue",
    "fracture", 
    "traumatic-brain-injury",
    "burn",
    "amputation",
    "wrongful-death",
    "other"
  ];

  const injuryLabels: Record<string, string> = {
    "soft-tissue": "Soft Tissue",
    "fracture": "Fracture",
    "traumatic-brain-injury": "Traumatic Brain Injury",
    "burn": "Burn Injury",
    "amputation": "Amputation",
    "wrongful-death": "Wrongful Death",
    "other": "Other"
  };

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
              <Label htmlFor={injury} className="text-sm">{injuryLabels[injury]}</Label>
            </div>
          ))}
        </div>
      </div>

      {formData.injuryTypes?.includes('other') && (
        <div className="space-y-2">
          <Label htmlFor="otherInjuryText">Specify Other Injury</Label>
          <Input
            id="otherInjuryText"
            type="text"
            value={formData.otherInjuryText || ''}
            onChange={(e) => setFormData({...formData, otherInjuryText: e.target.value})}
            placeholder="Describe the injury type"
          />
        </div>
      )}
    </div>
  );
};

export default InjuryTypeStep;