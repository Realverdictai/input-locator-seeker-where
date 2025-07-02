
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
    // Only require injury type - make other fields optional for more flexible evaluation
    const isValid = !!(formData.injuryType);
    console.log("Form validation:", { 
      injuryType: formData.injuryType, 
      venue: formData.venue, 
      dateOfLoss: formData.dateOfLoss,
      isValid 
    });
    return isValid;
  };

  // Helper function to format numbers with commas
  const formatNumberWithCommas = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('en-US');
  };

  // Helper function to parse formatted number string back to number
  const parseFormattedNumber = (value: string): number | undefined => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    const cleanedValue = value.replace(/,/g, '');
    const numValue = Number(cleanedValue);
    return isNaN(numValue) ? undefined : numValue;
  };

  // Helper function to properly handle number inputs including 0
  const handleNumberInput = (value: string) => {
    return parseFormattedNumber(value);
  };

  // Helper function to handle formatted number input change
  const handleFormattedNumberChange = (field: keyof CaseData, value: string) => {
    const numericValue = handleNumberInput(value);
    setFormData({...formData, [field]: numericValue});
  };

  const addDefendantPolicy = () => {
    const newPolicies = [...(formData.defendantPolicies || []), { defendantName: "", policyLimit: 0 }];
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  const removeDefendantPolicy = (index: number) => {
    const newPolicies = formData.defendantPolicies?.filter((_, i) => i !== index) || [];
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  const updateDefendantPolicy = (index: number, field: keyof PolicyInfo, value: string | number) => {
    const newPolicies = [...(formData.defendantPolicies || [])];
    if (field === 'policyLimit') {
      newPolicies[index] = { ...newPolicies[index], [field]: typeof value === 'string' ? handleNumberInput(value) || 0 : value };
    } else {
      newPolicies[index] = { ...newPolicies[index], [field]: value };
    }
    setFormData({...formData, defendantPolicies: newPolicies});
  };

  const toggleSurgeryType = (surgeryType: string) => {
    const currentTypes = formData.surgeryTypes || [];
    const newTypes = currentTypes.includes(surgeryType)
      ? currentTypes.filter(type => type !== surgeryType)
      : [...currentTypes, surgeryType];
    setFormData({...formData, surgeryTypes: newTypes});
  };

  const toggleInjectionType = (injectionType: string) => {
    const currentTypes = formData.injectionTypes || [];
    const newTypes = currentTypes.includes(injectionType)
      ? currentTypes.filter(type => type !== injectionType)
      : [...currentTypes, injectionType];
    setFormData({...formData, injectionTypes: newTypes});
  };

  const californiaCounties = [
    "los-angeles", "san-francisco", "orange", "san-diego", "santa-clara", "alameda",
    "riverside", "sacramento", "san-bernardino", "contra-costa", "fresno", "kern",
    "ventura", "san-joaquin", "sonoma", "tulare", "santa-barbara", "solano", 
    "monterey", "placer", "san-mateo", "merced", "stanislaus", "santa-cruz", "napa", "marin"
  ];

  const surgeryTypeOptions = [
    "Spinal Fusion", "Hip Replacement", "Knee Replacement", "Shoulder Surgery",
    "Spinal Cord Stimulator Permanent", "Spinal Cord Stimulator Trial", "Arthroscopy",
    "Disc Replacement", "Rotator Cuff Repair", "ACL Reconstruction"
  ];

  const injectionTypeOptions = [
    "Epidural Steroid", "Facet Joint", "Trigger Point", "Hyaluronic Acid",
    "PRP (Platelet Rich Plasma)", "Stem Cell", "Cortisone", "Nerve Block"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicalSpecials">Medical Specials ($)</Label>
            <Input
              id="medicalSpecials"
              type="text"
              value={formatNumberWithCommas(formData.medicalSpecials)}
              onChange={(e) => handleFormattedNumberChange('medicalSpecials', e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="howellHanifDeductions">Howell/Hanif Deductions ($)</Label>
            <Input
              id="howellHanifDeductions"
              type="text"
              value={formatNumberWithCommas(formData.howellHanifDeductions)}
              onChange={(e) => handleFormattedNumberChange('howellHanifDeductions', e.target.value)}
              placeholder="Enter deduction amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="futureMedicals">Future Medicals ($)</Label>
            <Input
              id="futureMedicals"
              type="text"
              value={formatNumberWithCommas(formData.futureMedicals)}
              onChange={(e) => handleFormattedNumberChange('futureMedicals', e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgeries">Number of Surgeries</Label>
            <Input
              id="surgeries"
              type="text"
              value={formatNumberWithCommas(formData.surgeries)}
              onChange={(e) => handleFormattedNumberChange('surgeries', e.target.value)}
              placeholder="Enter number"
            />
          </div>

          <div className="space-y-2">
            <Label>Surgery Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {surgeryTypeOptions.map(surgery => (
                <div key={surgery} className="flex items-center space-x-2">
                  <Checkbox
                    id={surgery}
                    checked={formData.surgeryTypes?.includes(surgery) || false}
                    onCheckedChange={() => toggleSurgeryType(surgery)}
                  />
                  <Label htmlFor={surgery} className="text-sm">{surgery}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="injections">Number of Injections</Label>
            <Input
              id="injections"
              type="text"
              value={formatNumberWithCommas(formData.injections)}
              onChange={(e) => handleFormattedNumberChange('injections', e.target.value)}
              placeholder="Enter number"
            />
          </div>

          <div className="space-y-2">
            <Label>Injection Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {injectionTypeOptions.map(injection => (
                <div key={injection} className="flex items-center space-x-2">
                  <Checkbox
                    id={injection}
                    checked={formData.injectionTypes?.includes(injection) || false}
                    onCheckedChange={() => toggleInjectionType(injection)}
                  />
                  <Label htmlFor={injection} className="text-sm">{injection}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalTherapySessions">Physical Therapy Sessions</Label>
            <Input
              id="physicalTherapySessions"
              type="text"
              value={formatNumberWithCommas(formData.physicalTherapySessions)}
              onChange={(e) => handleFormattedNumberChange('physicalTherapySessions', e.target.value)}
              placeholder="Enter number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chiropracticSessions">Chiropractic Sessions</Label>
            <Input
              id="chiropracticSessions"
              type="text"
              value={formatNumberWithCommas(formData.chiropracticSessions)}
              onChange={(e) => handleFormattedNumberChange('chiropracticSessions', e.target.value)}
              placeholder="Enter number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="daysBetweenAccidentAndTreatment">Days Between Accident and First Treatment</Label>
            <Input
              id="daysBetweenAccidentAndTreatment"
              type="text"
              value={formatNumberWithCommas(formData.daysBetweenAccidentAndTreatment)}
              onChange={(e) => handleFormattedNumberChange('daysBetweenAccidentAndTreatment', e.target.value)}
              placeholder="Enter days"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatmentGaps">Treatment Gaps (days)</Label>
            <Input
              id="treatmentGaps"
              type="text"
              value={formatNumberWithCommas(formData.treatmentGaps)}
              onChange={(e) => handleFormattedNumberChange('treatmentGaps', e.target.value)}
              placeholder="Enter gap days"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="futureSurgeryRecommended"
              checked={formData.futureSurgeryRecommended || false}
              onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
            />
            <Label htmlFor="futureSurgeryRecommended">Future Surgery Recommended</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="futureSurgeryDetails">Future Surgery Details</Label>
            <Textarea
              id="futureSurgeryDetails"
              value={formData.futureSurgeryDetails || ''}
              onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
              placeholder="Describe recommended future surgery"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priorConditions">Prior Conditions</Label>
            <Textarea
              id="priorConditions"
              value={formData.priorConditions || ''}
              onChange={(e) => setFormData({...formData, priorConditions: e.target.value})}
              placeholder="Describe any pre-existing conditions"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plaintiff Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plaintiffAge">Plaintiff Age</Label>
            <Input
              id="plaintiffAge"
              type="text"
              value={formatNumberWithCommas(formData.plaintiffAge)}
              onChange={(e) => handleFormattedNumberChange('plaintiffAge', e.target.value)}
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
            <Label htmlFor="annualIncome">Annual Income ($)</Label>
            <Input
              id="annualIncome"
              type="text"
              value={formatNumberWithCommas(formData.annualIncome)}
              onChange={(e) => handleFormattedNumberChange('annualIncome', e.target.value)}
              placeholder="Enter annual income"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wageLoss">Wage Loss ($)</Label>
            <Input
              id="wageLoss"
              type="text"
              value={formatNumberWithCommas(formData.wageLoss)}
              onChange={(e) => handleFormattedNumberChange('wageLoss', e.target.value)}
              placeholder="Enter wage loss"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="futureEarningsLoss">Future Earnings Loss ($)</Label>
            <Input
              id="futureEarningsLoss"
              type="text"
              value={formatNumberWithCommas(formData.futureEarningsLoss)}
              onChange={(e) => handleFormattedNumberChange('futureEarningsLoss', e.target.value)}
              placeholder="Enter future earnings loss"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prop213Applicable"
              checked={formData.prop213Applicable || false}
              onCheckedChange={(checked) => setFormData({...formData, prop213Applicable: !!checked})}
            />
            <Label htmlFor="prop213Applicable">Proposition 213 Applicable (Uninsured Driver)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="priorWorkersComp"
              checked={formData.priorWorkersComp || false}
              onCheckedChange={(checked) => setFormData({...formData, priorWorkersComp: !!checked})}
            />
            <Label htmlFor="priorWorkersComp">Prior Workers' Compensation</Label>
          </div>

          {formData.priorWorkersComp && (
            <div className="space-y-2">
              <Label htmlFor="priorWorkersCompAmount">Prior Workers' Comp Amount ($)</Label>
              <Input
                id="priorWorkersCompAmount"
                type="text"
                value={formatNumberWithCommas(formData.priorWorkersCompAmount)}
                onChange={(e) => handleFormattedNumberChange('priorWorkersCompAmount', e.target.value)}
                placeholder="Enter amount"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="priorAccident"
              checked={formData.priorAccident || false}
              onCheckedChange={(checked) => setFormData({...formData, priorAccident: !!checked})}
            />
            <Label htmlFor="priorAccident">Prior Accident</Label>
          </div>

          {formData.priorAccident && (
            <div className="space-y-2">
              <Label htmlFor="priorAccidentDetails">Prior Accident Details</Label>
              <Textarea
                id="priorAccidentDetails"
                value={formData.priorAccidentDetails || ''}
                onChange={(e) => setFormData({...formData, priorAccidentDetails: e.target.value})}
                placeholder="Describe prior accident"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="subsequentAccident"
              checked={formData.subsequentAccident || false}
              onCheckedChange={(checked) => setFormData({...formData, subsequentAccident: !!checked})}
            />
            <Label htmlFor="subsequentAccident">Subsequent Accident</Label>
          </div>

          {formData.subsequentAccident && (
            <div className="space-y-2">
              <Label htmlFor="subsequentAccidentDetails">Subsequent Accident Details</Label>
              <Textarea
                id="subsequentAccidentDetails"
                value={formData.subsequentAccidentDetails || ''}
                onChange={(e) => setFormData({...formData, subsequentAccidentDetails: e.target.value})}
                placeholder="Describe subsequent accident"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multipleDefendants"
              checked={formData.multipleDefendants || false}
              onCheckedChange={(checked) => setFormData({...formData, multipleDefendants: !!checked})}
            />
            <Label htmlFor="multipleDefendants">Multiple Defendants</Label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Defendant Policies</Label>
              <Button type="button" onClick={addDefendantPolicy} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Policy
              </Button>
            </div>
            
            {formData.defendantPolicies?.map((policy, index) => (
              <div key={index} className="flex items-center space-x-2 p-4 border rounded">
                <div className="flex-1">
                  <Input
                    placeholder="Defendant name"
                    value={policy.defendantName}
                    onChange={(e) => updateDefendantPolicy(index, 'defendantName', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Policy limit"
                    value={formatNumberWithCommas(policy.policyLimit)}
                    onChange={(e) => updateDefendantPolicy(index, 'policyLimit', e.target.value)}
                  />
                </div>
                {formData.defendantPolicies!.length > 1 && (
                  <Button type="button" onClick={() => removeDefendantPolicy(index)} size="sm" variant="outline">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="umUimCoverage">UM/UIM Coverage ($)</Label>
            <Input
              id="umUimCoverage"
              type="text"
              value={formatNumberWithCommas(formData.umUimCoverage)}
              onChange={(e) => handleFormattedNumberChange('umUimCoverage', e.target.value)}
              placeholder="Enter UM/UIM coverage"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalFactors">Additional Factors</Label>
            <Textarea
              id="additionalFactors"
              value={formData.additionalFactors || ''}
              onChange={(e) => setFormData({...formData, additionalFactors: e.target.value})}
              placeholder="Any additional factors that may affect the case value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalRecordsAnalysis">Medical Records Analysis</Label>
            <Textarea
              id="medicalRecordsAnalysis"
              value={formData.medicalRecordsAnalysis || ''}
              onChange={(e) => setFormData({...formData, medicalRecordsAnalysis: e.target.value})}
              placeholder="Summary of medical records and treatment history"
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
