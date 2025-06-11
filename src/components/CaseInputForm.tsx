
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { CaseData } from "@/types/verdict";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
}

const CaseInputForm = ({ onSubmit, isLoading }: CaseInputFormProps) => {
  const [formData, setFormData] = useState<Partial<CaseData>>({
    liabilityPercentage: 100,
    medicalSpecials: 0,
    surgeries: 0,
    wageLoss: 0,
    plaintiffAge: 35,
    policyLimits: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onSubmit(formData as CaseData);
    }
  };

  const isFormValid = () => {
    return formData.injuryType && 
           formData.plaintiffGender && 
           formData.venue && 
           formData.plaintiffOccupation;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="injuryType">Injury Type</Label>
        <Select 
          value={formData.injuryType} 
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicalSpecials">Medical Specials</Label>
          <Input
            id="medicalSpecials"
            type="number"
            value={formData.medicalSpecials}
            onChange={(e) => setFormData({...formData, medicalSpecials: Number(e.target.value)})}
            placeholder="$0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="surgeries">Number of Surgeries</Label>
          <Input
            id="surgeries"
            type="number"
            value={formData.surgeries}
            onChange={(e) => setFormData({...formData, surgeries: Number(e.target.value)})}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wageLoss">Wage Loss</Label>
        <Input
          id="wageLoss"
          type="number"
          value={formData.wageLoss}
          onChange={(e) => setFormData({...formData, wageLoss: Number(e.target.value)})}
          placeholder="$0"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plaintiffAge">Plaintiff Age</Label>
          <Input
            id="plaintiffAge"
            type="number"
            value={formData.plaintiffAge}
            onChange={(e) => setFormData({...formData, plaintiffAge: Number(e.target.value)})}
            min="1"
            max="100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plaintiffGender">Gender</Label>
          <Select 
            value={formData.plaintiffGender} 
            onValueChange={(value: 'male' | 'female') => setFormData({...formData, plaintiffGender: value})}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="plaintiffOccupation">Plaintiff Occupation</Label>
        <Input
          id="plaintiffOccupation"
          value={formData.plaintiffOccupation}
          onChange={(e) => setFormData({...formData, plaintiffOccupation: e.target.value})}
          placeholder="e.g., Teacher, Construction Worker, etc."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">Venue (County)</Label>
        <Select 
          value={formData.venue} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select California county" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="los-angeles">Los Angeles</SelectItem>
            <SelectItem value="san-francisco">San Francisco</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
            <SelectItem value="san-diego">San Diego</SelectItem>
            <SelectItem value="santa-clara">Santa Clara</SelectItem>
            <SelectItem value="alameda">Alameda</SelectItem>
            <SelectItem value="riverside">Riverside</SelectItem>
            <SelectItem value="sacramento">Sacramento</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="policyLimits">Policy Limits</Label>
        <Input
          id="policyLimits"
          type="number"
          value={formData.policyLimits}
          onChange={(e) => setFormData({...formData, policyLimits: Number(e.target.value)})}
          placeholder="$0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalFactors">Additional Factors</Label>
        <Textarea
          id="additionalFactors"
          value={formData.additionalFactors}
          onChange={(e) => setFormData({...formData, additionalFactors: e.target.value})}
          placeholder="Any additional case details, complications, or special circumstances..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isFormValid() || isLoading}
      >
        {isLoading ? "Evaluating..." : "Evaluate Case"}
      </Button>
    </form>
  );
};

export default CaseInputForm;
