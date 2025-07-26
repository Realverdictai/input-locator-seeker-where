
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
  // Complete list of all 58 California counties
  const californiaCounties = [
    "alameda", "alpine", "amador", "butte", "calaveras", "colusa", "contra-costa", "del-norte",
    "el-dorado", "fresno", "glenn", "humboldt", "imperial", "inyo", "kern", "kings",
    "lake", "lassen", "los-angeles", "madera", "marin", "mariposa", "mendocino", "merced",
    "modoc", "mono", "monterey", "napa", "nevada", "orange", "placer", "plumas",
    "riverside", "sacramento", "san-benito", "san-bernardino", "san-diego", "san-francisco",
    "san-joaquin", "san-luis-obispo", "san-mateo", "santa-barbara", "santa-clara", "santa-cruz",
    "shasta", "sierra", "siskiyou", "solano", "sonoma", "stanislaus", "sutter", "tehama",
    "trinity", "tulare", "tuolumne", "ventura", "yolo", "yuba"
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
            <SelectItem value="spinal-cord-injury">Spinal Cord Injury</SelectItem>
            <SelectItem value="traumatic-brain-injury">Traumatic Brain Injury</SelectItem>
            <SelectItem value="internal-organ-damage">Internal Organ Damage</SelectItem>
            <SelectItem value="vision-loss">Vision Loss</SelectItem>
            <SelectItem value="hearing-loss">Hearing Loss</SelectItem>
            <SelectItem value="scarring-disfigurement">Scarring/Disfigurement</SelectItem>
            <SelectItem value="psychological-trauma">Psychological Trauma</SelectItem>
            <SelectItem value="burn">Burn Injury</SelectItem>
            <SelectItem value="amputation">Amputation</SelectItem>
            <SelectItem value="crush-injury">Crush Injury</SelectItem>
            <SelectItem value="wrongful-death">Wrongful Death</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">Venue/County (All 58 CA Counties)</Label>
        <Select 
          value={formData.venue || ''} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select venue" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {californiaCounties.map(county => (
              <SelectItem key={county} value={county}>
                {county.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} County
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accidentSubType">Accident Type</Label>
        <Select 
          value={formData.accidentSubType || ''} 
          onValueChange={(value) => setFormData({...formData, accidentSubType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select accident type" />
          </SelectTrigger>
        <SelectContent>
          <SelectItem value="rear-end-collision">Rear-End Collision</SelectItem>
          <SelectItem value="head-on-collision">Head-On Collision</SelectItem>
          <SelectItem value="t-bone-broadside">Broadside/T-Bone</SelectItem>
          <SelectItem value="sideswipe">Sideswipe</SelectItem>
          <SelectItem value="multi-vehicle-pileup">Multi-Vehicle Pileup</SelectItem>
          <SelectItem value="hit-and-run">Hit and Run</SelectItem>
          <SelectItem value="rollover">Rollover</SelectItem>
          <SelectItem value="drunk-driving-dui">Drunk Driving/DUI</SelectItem>
          <SelectItem value="left-turn-collision">Left-Turn Collision</SelectItem>
          <SelectItem value="merging-blind-spot">Merging/Blind Spot</SelectItem>
          <SelectItem value="pedestrian-strike">Pedestrian Strike</SelectItem>
          <SelectItem value="bicycle-vs-auto">Bicycle vs Auto</SelectItem>
          <SelectItem value="commercial-truck-big-rig">Commercial Truck/Big Rig</SelectItem>
          <SelectItem value="bus-accident">Bus Accident</SelectItem>
          <SelectItem value="motorcycle-collision">Motorcycle Collision</SelectItem>
          <SelectItem value="uber-lyft-rideshare">Uber/Lyft/Rideshare</SelectItem>
          <SelectItem value="single-vehicle-crash">Single Vehicle Crash</SelectItem>
          <SelectItem value="road-rage-incident">Road Rage Incident</SelectItem>
          <SelectItem value="dog-bite-attack">Dog Bite/Attack</SelectItem>
          <SelectItem value="fall-from-ladder">Fall from Ladder</SelectItem>
          <SelectItem value="falling-object">Falling Object</SelectItem>
          <SelectItem value="slip-on-wet-surface">Slip on Wet Surface</SelectItem>
          <SelectItem value="trip-on-uneven-surface">Trip on Uneven Surface</SelectItem>
          <SelectItem value="stairway-fall">Stairway Fall</SelectItem>
          <SelectItem value="escalator-elevator">Escalator/Elevator</SelectItem>
          <SelectItem value="swimming-pool-incident">Swimming Pool Incident</SelectItem>
          <SelectItem value="workplace-accident">Workplace Accident</SelectItem>
          <SelectItem value="sports-recreation-injury">Sports or Recreation Injury</SelectItem>
          <SelectItem value="school-daycare-incident">School or Daycare Incident</SelectItem>
          <SelectItem value="construction-site-accident">Construction Site Accident</SelectItem>
          <SelectItem value="boating-accident">Boating Accident</SelectItem>
          <SelectItem value="aviation-accident">Aviation Accident</SelectItem>
          <SelectItem value="product-defect">Product Defect</SelectItem>
          <SelectItem value="toxic-exposure">Toxic Exposure</SelectItem>
          <SelectItem value="medical-device-failure">Medical Device Failure</SelectItem>
          <SelectItem value="nursing-home-abuse">Nursing Home Abuse</SelectItem>
          <SelectItem value="assault-battery">Assault/Battery</SelectItem>
          <SelectItem value="negligent-security">Negligent Security</SelectItem>
          <SelectItem value="fire-or-explosion">Fire or Explosion</SelectItem>
          <SelectItem value="chemical-spill">Chemical Spill</SelectItem>
          <SelectItem value="parking-lot-accident">Parking Lot Accident</SelectItem>
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
