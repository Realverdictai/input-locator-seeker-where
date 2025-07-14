
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";

interface CaseTypeStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const CaseTypeStep = ({ formData, setFormData }: CaseTypeStepProps) => {
  // Expanded list of personal injury case categories
  const caseTypes = [
    "Auto Accident",
    "Motorcycle Accident",
    "Commercial Truck Accident",
    "Bus Accident",
    "Bicycle Accident",
    "Pedestrian Accident",
    "Uber/Lyft/Rideshare",
    "Boating/Maritime Accident",
    "Aviation Accident",
    "Train/Railroad Accident",
    "Workplace Accident",
    "Toxic Exposure",
    "School or Daycare Incident",
    "Sports/Recreation Injury",
    "Government Liability",
    "Defamation/Libel",
    "Assault/Sexual Abuse",
    "Dog Bite",
    "Slip and Fall",
    "Trip and Fall",
    "Homeowner Premises",
    "Premises Liability",
    "Construction Injury",
    "Product Liability",
    "Medical Malpractice",
    "Nursing Home Neglect",
    "Nursing Home Abuse",
    "Assault/Battery",
    "Food Poisoning",
    "Wrongful Death",
    "Other"
  ];

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
            {caseTypes.map(type => (
              <SelectItem key={type} value={type.toLowerCase().replace(/[^a-z0-9]/g, '-')}>
                {type}
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
