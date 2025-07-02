
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CaseData } from "@/types/verdict";

interface LegalFactorsStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const LegalFactorsStep = ({ formData, setFormData }: LegalFactorsStepProps) => {
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

  // Helper function to handle formatted number input change
  const handleFormattedNumberChange = (field: keyof CaseData, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setFormData({...formData, [field]: numericValue});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="prop213Applicable"
          checked={formData.prop213Applicable || false}
          onCheckedChange={(checked) => setFormData({...formData, prop213Applicable: !!checked})}
        />
        <Label htmlFor="prop213Applicable">Proposition 213 Applicable (Uninsured Driver)</Label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="priorWorkersComp"
            checked={formData.priorWorkersComp || false}
            onCheckedChange={(checked) => setFormData({...formData, priorWorkersComp: !!checked})}
          />
          <Label htmlFor="priorWorkersComp">Prior Workers' Compensation</Label>
        </div>

        {formData.priorWorkersComp && (
          <div className="space-y-2 ml-6">
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
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="priorAccident"
            checked={formData.priorAccident || false}
            onCheckedChange={(checked) => setFormData({...formData, priorAccident: !!checked})}
          />
          <Label htmlFor="priorAccident">Prior Accident</Label>
        </div>

        {formData.priorAccident && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="priorAccidentDetails">Prior Accident Details</Label>
            <Textarea
              id="priorAccidentDetails"
              value={formData.priorAccidentDetails || ''}
              onChange={(e) => setFormData({...formData, priorAccidentDetails: e.target.value})}
              placeholder="Describe prior accident"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="subsequentAccident"
            checked={formData.subsequentAccident || false}
            onCheckedChange={(checked) => setFormData({...formData, subsequentAccident: !!checked})}
          />
          <Label htmlFor="subsequentAccident">Subsequent Accident</Label>
        </div>

        {formData.subsequentAccident && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="subsequentAccidentDetails">Subsequent Accident Details</Label>
            <Textarea
              id="subsequentAccidentDetails"
              value={formData.subsequentAccidentDetails || ''}
              onChange={(e) => setFormData({...formData, subsequentAccidentDetails: e.target.value})}
              placeholder="Describe subsequent accident"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};

export default LegalFactorsStep;
