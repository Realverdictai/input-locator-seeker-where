
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseData, PolicyInfo } from "@/types/verdict";
import { Plus, X } from "lucide-react";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
}

const CaseInputForm = ({ onSubmit, isLoading }: CaseInputFormProps) => {
  console.log("CaseInputForm rendering");
  
  const [formData, setFormData] = useState<Partial<CaseData>>({
    liabilityPercentage: 100,
    plaintiffAge: 35,
    prop213Applicable: false,
    priorWorkersComp: false,
    priorAccident: false,
    subsequentAccident: false,
    multipleDefendants: false,
    defendantPolicies: [{ defendantName: "Primary Defendant", policyLimit: 0 }],
    impactSeverity: 5,
    futureSurgeryRecommended: false,
    daysBetweenAccidentAndTreatment: 0,
    surgeryTypes: [],
    injectionTypes: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    
    if (isFormValid()) {
      onSubmit(formData as CaseData);
    } else {
      console.log("Form is not valid");
    }
  };

  const isFormValid = () => {
    const isValid = !!(formData.injuryType && formData.venue && formData.dateOfLoss);
    console.log("Form validation:", { 
      injuryType: formData.injuryType, 
      venue: formData.venue, 
      dateOfLoss: formData.dateOfLoss,
      isValid 
    });
    return isValid;
  };

  const californiaCounties = [
    "los-angeles", "san-francisco", "orange", "san-diego", "santa-clara", "alameda",
    "riverside", "sacramento", "san-bernardino", "contra-costa", "fresno", "kern"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfLoss">Date of Loss (Required)</Label>
            <Input
              id="dateOfLoss"
              type="date"
              value={formData.dateOfLoss || ''}
              onChange={(e) => setFormData({...formData, dateOfLoss: e.target.value})}
              required
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
            <Label htmlFor="venue">Venue/County (Required)</Label>
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
            <Label htmlFor="medicalSpecials">Medical Specials ($)</Label>
            <Input
              id="medicalSpecials"
              type="number"
              value={formData.medicalSpecials || ''}
              onChange={(e) => setFormData({...formData, medicalSpecials: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plaintiffAge">Plaintiff Age</Label>
            <Input
              id="plaintiffAge"
              type="number"
              value={formData.plaintiffAge || ''}
              onChange={(e) => setFormData({...formData, plaintiffAge: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Enter age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="plaintiffGender">Plaintiff Gender</Label>
            <Select 
              value={formData.plaintiffGender || ''} 
              onValueChange={(value) => setFormData({...formData, plaintiffGender: value as 'male' | 'female'})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plaintiffOccupation">Plaintiff Occupation</Label>
            <Input
              id="plaintiffOccupation"
              type="text"
              value={formData.plaintiffOccupation || ''}
              onChange={(e) => setFormData({...formData, plaintiffOccupation: e.target.value})}
              placeholder="Enter occupation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="policyLimits">Policy Limits ($)</Label>
            <Input
              id="policyLimits"
              type="number"
              value={formData.policyLimits || ''}
              onChange={(e) => setFormData({...formData, policyLimits: e.target.value ? Number(e.target.value) : undefined})}
              placeholder="Enter policy limits"
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !isFormValid()}
      >
        {isLoading ? "Evaluating..." : "Evaluate Case"}
      </Button>
    </form>
  );
};

export default CaseInputForm;
