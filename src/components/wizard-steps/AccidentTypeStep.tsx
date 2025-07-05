
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface AccidentTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const AccidentTypeStep = ({ formData, setFormData }: AccidentTypeStepProps) => {
  const autoAccidentTypes = [
    "Rear-End Collision",
    "T-Bone/Broadside", 
    "Head-On Collision",
    "Sideswipe",
    "Multi-Vehicle Pileup",
    "Hit and Run",
    "Rollover",
    "Pedestrian Strike",
    "Bicycle vs Auto"
  ];

  const nonAutoAccidentTypes = [
    "Dog Bite/Attack",
    "Fall from Ladder", 
    "Falling Object",
    "Slip on Wet Surface",
    "Trip on Uneven Surface",
    "Stairway Fall",
    "Escalator/Elevator",
    "Swimming Pool Incident",
    "Construction Site Accident"
  ];

  const isAutoCase = formData.caseType === 'auto-accident';
  const accidentTypes = isAutoCase ? autoAccidentTypes : nonAutoAccidentTypes;
  
  // Auto-set rear-end for motor vehicle accidents if not already set
  useEffect(() => {
    if (isAutoCase && !formData.accidentType) {
      setFormData({...formData, accidentType: 'rear-end-collision'});
    }
  }, [isAutoCase, formData.accidentType, formData, setFormData]);
  
  // Auto-hide for Motor Vehicle + Rear-End
  const isRearEndAuto = isAutoCase && formData.accidentType === 'rear-end-collision';

  // Skip this step entirely for rear-end auto accidents
  // Temporarily disabled to debug dropdown issue
  // if (isRearEndAuto) {
  //   return null;
  // }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="accidentType">
          {isAutoCase ? 'Auto Accident Type' : 'Accident Type'}
        </Label>
        <Select 
          value={formData.accidentType || ''} 
          onValueChange={(value) => setFormData({...formData, accidentType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select accident type" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-md z-50">
            {accidentTypes.map(type => (
              <SelectItem key={type} value={type.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-amber-700 text-sm">
          The type of accident affects liability determination and damage calculations. 
          {isAutoCase ? ' Traffic accident specifics help determine fault percentages.' : ' Premises liability cases depend heavily on the specific circumstances.'}
        </p>
      </div>
    </div>
  );
};

export default AccidentTypeStep;
