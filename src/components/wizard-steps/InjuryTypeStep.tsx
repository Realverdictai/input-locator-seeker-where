import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CaseData } from "@/types/verdict";

interface InjuryTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const InjuryTypeStep = ({ formData, setFormData }: InjuryTypeStepProps) => {
  // Expanded list of injury categories
  const injuryTypes = [
    "soft-tissue",
    "fracture",
    "whiplash",
    "concussion",
    "traumatic-brain-injury",
    "spinal-cord-injury",
    "herniated-disc",
    "nerve-damage",
    "paralysis",
    "internal-organ-damage",
    "vision-loss",
    "hearing-loss",
    "scarring-disfigurement",
    "laceration",
    "psychological-trauma",
    "ptsd",
    "burn",
    "amputation",
    "crush-injury",
    "dental-injury",
    "chronic-pain",
    "infection",
    "wrongful-death",
    "other"
  ];

  const injuryLabels: Record<string, string> = {
    "soft-tissue": "Soft Tissue",
    "fracture": "Fracture",
    "whiplash": "Whiplash",
    "concussion": "Concussion",
    "traumatic-brain-injury": "Traumatic Brain Injury",
    "spinal-cord-injury": "Spinal Cord Injury",
    "herniated-disc": "Herniated Disc",
    "nerve-damage": "Nerve Damage",
    "paralysis": "Paralysis",
    "internal-organ-damage": "Internal Organ Damage",
    "vision-loss": "Vision Loss",
    "hearing-loss": "Hearing Loss",
    "scarring-disfigurement": "Scarring/Disfigurement",
    "laceration": "Laceration",
    "psychological-trauma": "Psychological Trauma",
    "ptsd": "PTSD",
    "burn": "Burn Injury",
    "amputation": "Amputation",
    "crush-injury": "Crush Injury",
    "dental-injury": "Dental Injury",
    "chronic-pain": "Chronic Pain",
    "infection": "Infection",
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