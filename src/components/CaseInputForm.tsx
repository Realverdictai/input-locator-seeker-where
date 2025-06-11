import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CaseData, PolicyInfo } from "@/types/verdict";
import { Plus, X, ChevronDown } from "lucide-react";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
}

const CaseInputForm = ({ onSubmit, isLoading }: CaseInputFormProps) => {
  const [formData, setFormData] = useState<Partial<CaseData>>({
    liabilityPercentage: 100,
    medicalSpecials: 0,
    surgeries: 0,
    surgeryTypes: [],
    injections: 0,
    injectionTypes: [],
    physicalTherapySessions: 0,
    chiropracticSessions: 0,
    daysBetweenAccidentAndTreatment: 0,
    wageLoss: 0,
    plaintiffAge: 35,
    policyLimits: 0,
    howellHanifDeductions: 0,
    futureMedicals: 0,
    futureEarningsLoss: 0,
    prop213Applicable: false,
    priorWorkersComp: false,
    priorWorkersCompAmount: 0,
    priorAccident: false,
    subsequentAccident: false,
    multipleDefendants: false,
    defendantPolicies: [{ defendantName: "Primary Defendant", policyLimit: 0 }],
    umUimCoverage: 0,
    impactSeverity: 5,
    annualIncome: 0,
    futureSurgeryRecommended: false,
    treatmentGaps: 0,
  });

  const orthopedicSurgeries = [
    "ACL Reconstruction", "Meniscus Repair", "Rotator Cuff Repair", "Hip Replacement",
    "Knee Replacement", "Spinal Fusion", "Laminectomy", "Arthroscopy", "Fracture Repair",
    "Carpal Tunnel Release", "Shoulder Replacement", "Ankle Fusion", "Disc Replacement",
    "Cervical Fusion", "Lumbar Fusion", "Hardware Removal", "Tendon Repair",
    "Spinal Cord Stimulator Trial", "Spinal Cord Stimulator Permanent", "Shoulder Debridement",
    "Microdiscectomy", "Artificial Disc Replacement", "Kyphoplasty", "Vertebroplasty",
    "Nerve Decompression", "Facet Joint Injection", "Radiofrequency Ablation"
  ];

  const injectionTypes = [
    "Epidural Steroid Injection", "Facet Joint Injection", "Trigger Point Injection",
    "Cortisone Injection - Shoulder", "Cortisone Injection - Knee", "Cortisone Injection - Hip",
    "Hyaluronic Acid Injection", "PRP - Platelet Rich Plasma - Shoulder", "PRP - Knee",
    "PRP - Hip", "PRP - Elbow", "PRP - Ankle", "PRP - Back", "PRP - Neck",
    "Nerve Block", "SI Joint Injection", "Bursa Injection", "Tendon Sheath Injection"
  ];

  const californiaCounties = [
    "los-angeles", "san-francisco", "orange", "san-diego", "santa-clara", "alameda",
    "riverside", "sacramento", "san-bernardino", "contra-costa", "fresno", "kern",
    "ventura", "san-joaquin", "sonoma", "tulare", "santa-barbara", "solano", "monterey",
    "placer", "san-mateo", "merced", "stanislaus", "santa-cruz", "napa", "marin"
  ];

  const accidentTypes = [
    "rear-end", "head-on", "broadside", "sideswipe", "rollover", "pedestrian",
    "bicycle", "motorcycle", "truck", "multi-vehicle", "hit-and-run", "parking-lot"
  ];

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
           formData.plaintiffOccupation &&
           formData.dateOfLoss;
  };

  const calculateDaysBetween = (dateOfLoss: string, firstTreatment: string) => {
    if (dateOfLoss && firstTreatment) {
      const lossDate = new Date(dateOfLoss);
      const treatmentDate = new Date(firstTreatment);
      const diffTime = treatmentDate.getTime() - lossDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  const addDefendant = () => {
    const newDefendants = [...(formData.defendantPolicies || []), 
      { defendantName: `Defendant ${(formData.defendantPolicies?.length || 0) + 1}`, policyLimit: 0 }];
    setFormData({...formData, defendantPolicies: newDefendants});
  };

  const removeDefendant = (index: number) => {
    const newDefendants = formData.defendantPolicies?.filter((_, i) => i !== index) || [];
    setFormData({...formData, defendantPolicies: newDefendants});
  };

  const updateDefendant = (index: number, field: keyof PolicyInfo, value: string | number) => {
    const newDefendants = formData.defendantPolicies?.map((def, i) => 
      i === index ? { ...def, [field]: value } : def
    ) || [];
    setFormData({...formData, defendantPolicies: newDefendants});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date of Loss */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfLoss">Date of Loss (Accident Date)</Label>
              <Input
                id="dateOfLoss"
                type="date"
                value={formData.dateOfLoss}
                onChange={(e) => {
                  const newFormData = {...formData, dateOfLoss: e.target.value};
                  newFormData.daysBetweenAccidentAndTreatment = calculateDaysBetween(
                    e.target.value, 
                    formData.firstTreatmentDate || ''
                  );
                  setFormData(newFormData);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstTreatmentDate">First Treatment Date</Label>
              <Input
                id="firstTreatmentDate"
                type="date"
                value={formData.firstTreatmentDate}
                onChange={(e) => {
                  const newFormData = {...formData, firstTreatmentDate: e.target.value};
                  newFormData.daysBetweenAccidentAndTreatment = calculateDaysBetween(
                    formData.dateOfLoss || '', 
                    e.target.value
                  );
                  setFormData(newFormData);
                }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Days Between Accident and First Treatment: {formData.daysBetweenAccidentAndTreatment || 0} days</Label>
            <div className="text-xs text-gray-500">
              {(formData.daysBetweenAccidentAndTreatment || 0) > 30 && 
                "Treatment gap may affect case value"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Case Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Case Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="accidentType">Type of Accident</Label>
            <Select 
              value={formData.accidentType} 
              onValueChange={(value) => setFormData({...formData, accidentType: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select accident type" />
              </SelectTrigger>
              <SelectContent>
                {accidentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Impact Severity: {formData.impactSeverity}/10</Label>
            <Slider
              value={[formData.impactSeverity || 5]}
              onValueChange={(value) => setFormData({...formData, impactSeverity: value[0]})}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-500">1 = Slight, 5 = Moderate, 10 = Severe</div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              <Label htmlFor="howellHanifDeductions">Howell/Hanif Deductions</Label>
              <Input
                id="howellHanifDeductions"
                type="number"
                value={formData.howellHanifDeductions}
                onChange={(e) => setFormData({...formData, howellHanifDeductions: Number(e.target.value)})}
                placeholder="$0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="futureMedicals">Future Medical Costs</Label>
              <Input
                id="futureMedicals"
                type="number"
                value={formData.futureMedicals}
                onChange={(e) => setFormData({...formData, futureMedicals: Number(e.target.value)})}
                placeholder="$0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatmentGaps">Longest Treatment Gap (days)</Label>
              <Input
                id="treatmentGaps"
                type="number"
                value={formData.treatmentGaps}
                onChange={(e) => setFormData({...formData, treatmentGaps: Number(e.target.value)})}
                placeholder="0"
              />
            </div>
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

          <div className="space-y-2">
            <Label>Surgery Types</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {orthopedicSurgeries.map(surgery => (
                <div key={surgery} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.surgeryTypes?.includes(surgery)}
                    onCheckedChange={(checked) => {
                      const current = formData.surgeryTypes || [];
                      if (checked) {
                        setFormData({...formData, surgeryTypes: [...current, surgery]});
                      } else {
                        setFormData({...formData, surgeryTypes: current.filter(s => s !== surgery)});
                      }
                    }}
                  />
                  <Label className="text-sm">{surgery}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="injections">Number of Injections</Label>
            <Input
              id="injections"
              type="number"
              value={formData.injections}
              onChange={(e) => setFormData({...formData, injections: Number(e.target.value)})}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Injection Types</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {injectionTypes.map(injection => (
                <div key={injection} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.injectionTypes?.includes(injection)}
                    onCheckedChange={(checked) => {
                      const current = formData.injectionTypes || [];
                      if (checked) {
                        setFormData({...formData, injectionTypes: [...current, injection]});
                      } else {
                        setFormData({...formData, injectionTypes: current.filter(i => i !== injection)});
                      }
                    }}
                  />
                  <Label className="text-sm">{injection}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="physicalTherapySessions">Physical Therapy Sessions</Label>
              <Input
                id="physicalTherapySessions"
                type="number"
                value={formData.physicalTherapySessions}
                onChange={(e) => setFormData({...formData, physicalTherapySessions: Number(e.target.value)})}
                min="0"
                placeholder="Number of PT sessions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chiropracticSessions">Chiropractic Sessions</Label>
              <Input
                id="chiropracticSessions"
                type="number"
                value={formData.chiropracticSessions}
                onChange={(e) => setFormData({...formData, chiropracticSessions: Number(e.target.value)})}
                min="0"
                placeholder="Number of chiropractic visits"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.futureSurgeryRecommended}
              onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
            />
            <Label>Future Surgery Recommended</Label>
          </div>

          {formData.futureSurgeryRecommended && (
            <div className="space-y-2">
              <Label htmlFor="futureSurgeryDetails">Future Surgery Details</Label>
              <Textarea
                id="futureSurgeryDetails"
                value={formData.futureSurgeryDetails}
                onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
                placeholder="Describe recommended future surgeries..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="priorConditions">Prior Medical Conditions</Label>
            <Textarea
              id="priorConditions"
              value={formData.priorConditions}
              onChange={(e) => setFormData({...formData, priorConditions: e.target.value})}
              placeholder="Any pre-existing conditions that may affect case value..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Economic Damages */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Damages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wageLoss">Past Wage Loss</Label>
              <Input
                id="wageLoss"
                type="number"
                value={formData.wageLoss}
                onChange={(e) => setFormData({...formData, wageLoss: Number(e.target.value)})}
                placeholder="$0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="futureEarningsLoss">Future Earnings Loss</Label>
              <Input
                id="futureEarningsLoss"
                type="number"
                value={formData.futureEarningsLoss}
                onChange={(e) => setFormData({...formData, futureEarningsLoss: Number(e.target.value)})}
                placeholder="$0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualIncome">Annual Income</Label>
            <Input
              id="annualIncome"
              type="number"
              value={formData.annualIncome}
              onChange={(e) => setFormData({...formData, annualIncome: Number(e.target.value)})}
              placeholder="$0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plaintiff Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Plaintiff Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                {californiaCounties.map(county => (
                  <SelectItem key={county} value={county}>
                    {county.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Legal Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Legal Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.prop213Applicable}
              onCheckedChange={(checked) => setFormData({...formData, prop213Applicable: !!checked})}
            />
            <Label>Proposition 213 Applicable (Uninsured Driver)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.priorWorkersComp}
              onCheckedChange={(checked) => setFormData({...formData, priorWorkersComp: !!checked})}
            />
            <Label>Prior Workers' Compensation Case</Label>
          </div>

          {formData.priorWorkersComp && (
            <div className="space-y-2">
              <Label htmlFor="priorWorkersCompAmount">Workers' Comp Settlement Amount</Label>
              <Input
                id="priorWorkersCompAmount"
                type="number"
                value={formData.priorWorkersCompAmount}
                onChange={(e) => setFormData({...formData, priorWorkersCompAmount: Number(e.target.value)})}
                placeholder="$0"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.priorAccident}
              onCheckedChange={(checked) => setFormData({...formData, priorAccident: !!checked})}
            />
            <Label>Prior Accident/Injury</Label>
          </div>

          {formData.priorAccident && (
            <div className="space-y-2">
              <Label htmlFor="priorAccidentDetails">Prior Accident Details</Label>
              <Textarea
                id="priorAccidentDetails"
                value={formData.priorAccidentDetails}
                onChange={(e) => setFormData({...formData, priorAccidentDetails: e.target.value})}
                placeholder="Describe prior accidents or injuries..."
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.subsequentAccident}
              onCheckedChange={(checked) => setFormData({...formData, subsequentAccident: !!checked})}
            />
            <Label>Subsequent Accident/Injury</Label>
          </div>

          {formData.subsequentAccident && (
            <div className="space-y-2">
              <Label htmlFor="subsequentAccidentDetails">Subsequent Accident Details</Label>
              <Textarea
                id="subsequentAccidentDetails"
                value={formData.subsequentAccidentDetails}
                onChange={(e) => setFormData({...formData, subsequentAccidentDetails: e.target.value})}
                placeholder="Describe subsequent accidents or injuries..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.multipleDefendants}
              onCheckedChange={(checked) => setFormData({...formData, multipleDefendants: !!checked})}
            />
            <Label>Multiple Defendants</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Defendant Policy Limits</Label>
              <Button type="button" onClick={addDefendant} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Defendant
              </Button>
            </div>
            
            {formData.defendantPolicies?.map((defendant, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded">
                <Input
                  placeholder="Defendant name"
                  value={defendant.defendantName}
                  onChange={(e) => updateDefendant(index, 'defendantName', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Policy limit"
                  value={defendant.policyLimit}
                  onChange={(e) => updateDefendant(index, 'policyLimit', Number(e.target.value))}
                  className="flex-1"
                />
                {formData.defendantPolicies!.length > 1 && (
                  <Button type="button" onClick={() => removeDefendant(index)} size="sm" variant="destructive">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="umUimCoverage">UM/UIM Coverage</Label>
            <Input
              id="umUimCoverage"
              type="number"
              value={formData.umUimCoverage}
              onChange={(e) => setFormData({...formData, umUimCoverage: Number(e.target.value)})}
              placeholder="$0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="medicalRecordsAnalysis">Medical Records Analysis</Label>
            <Textarea
              id="medicalRecordsAnalysis"
              value={formData.medicalRecordsAnalysis}
              onChange={(e) => setFormData({...formData, medicalRecordsAnalysis: e.target.value})}
              placeholder="Upload and analyze medical records (manual entry for now)..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

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
