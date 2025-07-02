
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface LegalInsuranceStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const LegalInsuranceStep = ({ formData, setFormData }: LegalInsuranceStepProps) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="prop213Applicable"
          checked={formData.prop213Applicable || false}
          onCheckedChange={(checked) => setFormData({...formData, prop213Applicable: !!checked})}
        />
        <Label htmlFor="prop213Applicable">Prop 213? (Uninsured Driver)</Label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="priorWorkersComp"
            checked={formData.priorWorkersComp || false}
            onCheckedChange={(checked) => setFormData({...formData, priorWorkersComp: !!checked})}
          />
          <Label htmlFor="priorWorkersComp">Workers' Comp?</Label>
        </div>

        {formData.priorWorkersComp && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="priorWorkersCompAmount">Workers' Comp Amount ($)</Label>
            <Input
              id="priorWorkersCompAmount"
              type="text"
              value={formatNumberWithCommas(formData.priorWorkersCompAmount)}
              onChange={(e) => handleFormattedNumberChange('priorWorkersCompAmount', e.target.value)}
              placeholder="0"
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
          <Label htmlFor="priorAccident">Prior Accidents?</Label>
        </div>

        {formData.priorAccident && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="priorAccidentDetails">Prior Accident Details</Label>
            <Textarea
              id="priorAccidentDetails"
              value={formData.priorAccidentDetails || ''}
              onChange={(e) => setFormData({...formData, priorAccidentDetails: e.target.value})}
              placeholder="Describe prior accidents"
              rows={2}
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
          <Label htmlFor="subsequentAccident">Subsequent Accidents?</Label>
        </div>

        {formData.subsequentAccident && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="subsequentAccidentDetails">Subsequent Accident Details</Label>
            <Textarea
              id="subsequentAccidentDetails"
              value={formData.subsequentAccidentDetails || ''}
              onChange={(e) => setFormData({...formData, subsequentAccidentDetails: e.target.value})}
              placeholder="Describe subsequent accidents"
              rows={2}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="policyLimits">Policy Limits ($)</Label>
          <Input
            id="policyLimits"
            type="text"
            value={formatNumberWithCommas(formData.policyLimits)}
            onChange={(e) => handleFormattedNumberChange('policyLimits', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfDefendants">Number of Defendants</Label>
          <Input
            id="numberOfDefendants"
            type="text"
            value={formatNumberWithCommas(formData.numberOfDefendants)}
            onChange={(e) => handleFormattedNumberChange('numberOfDefendants', e.target.value)}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="umbrellaCoverage">Umbrella Coverage?</Label>
        <Select 
          value={formData.umbrellaCoverage || ''} 
          onValueChange={(value) => setFormData({...formData, umbrellaCoverage: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select umbrella coverage status" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.umbrellaCoverage === 'yes' && (
        <div className="space-y-2">
          <Label htmlFor="umUimCoverage">Umbrella Coverage Amount ($)</Label>
          <Input
            id="umUimCoverage"
            type="text"
            value={formatNumberWithCommas(formData.umUimCoverage)}
            onChange={(e) => handleFormattedNumberChange('umUimCoverage', e.target.value)}
            placeholder="0"
          />
        </div>
      )}
    </div>
  );
};

export default LegalInsuranceStep;
