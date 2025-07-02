
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CaseData } from "@/types/verdict";

interface BasicInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const BasicInfoStep = ({ formData, setFormData }: BasicInfoStepProps) => {
  const californiaCounties = [
    "los-angeles", "san-francisco", "orange", "san-diego", "santa-clara", "alameda",
    "riverside", "sacramento", "san-bernardino", "contra-costa", "fresno", "kern",
    "ventura", "san-joaquin", "sonoma", "tulare", "santa-barbara", "solano", 
    "monterey", "placer", "san-mateo", "merced", "stanislaus", "santa-cruz", "napa", "marin"
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dateOfLoss">Date of Loss</Label>
        <Input
          id="dateOfLoss"
          type="date"
          value={formData.dateOfLoss || ''}
          onChange={(e) => setFormData({...formData, dateOfLoss: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="injuryType">Injury Type (Required)</Label>
        <Select 
          value={formData.injuryType || ''} 
          onValueChange={(value) => setFormData({...formData, injuryType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select injury type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="soft-tissue">Soft Tissue</SelectItem>
            <SelectItem value="fracture">Fracture</SelectItem>
            <SelectItem value="spinal-injury">Spinal Injury</SelectItem>
            <SelectItem value="traumatic-brain-injury">Traumatic Brain Injury</SelectItem>
            <SelectItem value="burn">Burn Injury</SelectItem>
            <SelectItem value="amputation">Amputation</SelectItem>
            <SelectItem value="wrongful-death">Wrongful Death</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">Venue/County</Label>
        <Select 
          value={formData.venue || ''} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent>
            {californiaCounties.map(county => (
              <SelectItem key={county} value={county}>
                {county.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accidentType">Accident Type</Label>
        <Select 
          value={formData.accidentType || ''} 
          onValueChange={(value) => setFormData({...formData, accidentType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select accident type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rear-end">Rear-End Collision</SelectItem>
            <SelectItem value="head-on">Head-On Collision</SelectItem>
            <SelectItem value="broadside">Broadside/T-Bone</SelectItem>
            <SelectItem value="sideswipe">Sideswipe</SelectItem>
            <SelectItem value="rollover">Rollover</SelectItem>
            <SelectItem value="pedestrian">Pedestrian Accident</SelectItem>
            <SelectItem value="bicycle">Bicycle Accident</SelectItem>
            <SelectItem value="motorcycle">Motorcycle Accident</SelectItem>
            <SelectItem value="truck">Truck Accident</SelectItem>
            <SelectItem value="multi-vehicle">Multi-Vehicle</SelectItem>
            <SelectItem value="hit-and-run">Hit and Run</SelectItem>
            <SelectItem value="parking-lot">Parking Lot Accident</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Liability Percentage: {formData.liabilityPercentage}%</Label>
        <Slider
          value={[formData.liabilityPercentage || 100]}
          onValueChange={(value) => setFormData({...formData, liabilityPercentage: value[0]})}
          max={100}
          min={0}
          step={5}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Impact Severity (1-10): {formData.impactSeverity}</Label>
        <Slider
          value={[formData.impactSeverity || 5]}
          onValueChange={(value) => setFormData({...formData, impactSeverity: value[0]})}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default BasicInfoStep;
