
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface MedicalTreatmentStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const MedicalTreatmentStep = ({ formData, setFormData }: MedicalTreatmentStepProps) => {
  const formatNumberWithCommas = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('en-US');
  };

  const parseFormattedNumber = (value: string): number | undefined => {
    if (value === '' || value === null || value === undefined) return undefined;
    const cleanedValue = value.replace(/,/g, '');
    const numValue = Number(cleanedValue);
    return isNaN(numValue) ? undefined : numValue;
  };

  const handleFormattedNumberChange = (field: keyof CaseData, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setFormData({...formData, [field]: numericValue});
  };

  const surgeryTypeOptions = [
    "Spinal Fusion", "Hip Replacement", "Knee Replacement", "Shoulder Surgery",
    "Arthroscopy", "Rotator Cuff Repair", "ACL Reconstruction"
  ];

  const injectionTypeOptions = [
    "Epidural Steroid", "Facet Joint", "Trigger Point", "Cortisone", "PRP", "Stem Cell"
  ];

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surgeries">Number of Surgeries</Label>
          <Input
            id="surgeries"
            type="text"
            value={formatNumberWithCommas(formData.surgeries)}
            onChange={(e) => handleFormattedNumberChange('surgeries', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="injections">Number of Injections</Label>
          <Input
            id="injections"
            type="text"
            value={formatNumberWithCommas(formData.injections)}
            onChange={(e) => handleFormattedNumberChange('injections', e.target.value)}
            placeholder="0"
          />
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physicalTherapySessions">PT Sessions</Label>
          <Input
            id="physicalTherapySessions"
            type="text"
            value={formatNumberWithCommas(formData.physicalTherapySessions)}
            onChange={(e) => handleFormattedNumberChange('physicalTherapySessions', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chiropracticSessions">Chiro Sessions</Label>
          <Input
            id="chiropracticSessions"
            type="text"
            value={formatNumberWithCommas(formData.chiropracticSessions)}
            onChange={(e) => handleFormattedNumberChange('chiropracticSessions', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="treatmentGap"
          checked={formData.treatmentGap || false}
          onCheckedChange={(checked) => setFormData({...formData, treatmentGap: !!checked})}
        />
        <Label htmlFor="treatmentGap">Gap in Treatment?</Label>
      </div>

      {formData.treatmentGap && (
        <div className="space-y-2">
          <Label htmlFor="treatmentGaps">Days of Treatment Gap</Label>
          <Input
            id="treatmentGaps"
            type="text"
            value={formatNumberWithCommas(formData.treatmentGaps)}
            onChange={(e) => handleFormattedNumberChange('treatmentGaps', e.target.value)}
            placeholder="Enter number of days"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="futureSurgeryRecommended"
          checked={formData.futureSurgeryRecommended || false}
          onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
        />
        <Label htmlFor="futureSurgeryRecommended">Future Surgery Recommended?</Label>
      </div>

      {formData.futureSurgeryRecommended && (
        <div className="space-y-2">
          <Label htmlFor="futureSurgeryDetails">Future Surgery Description</Label>
          <Textarea
            id="futureSurgeryDetails"
            value={formData.futureSurgeryDetails || ''}
            onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
            placeholder="Describe recommended future surgery"
          />
        </div>
      )}
    </div>
  );
};

export default MedicalTreatmentStep;
