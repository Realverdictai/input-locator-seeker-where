
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CaseData } from "@/types/verdict";

interface SpecialsEarningsStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const SpecialsEarningsStep = ({ formData, setFormData }: SpecialsEarningsStepProps) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="medicalSpecials">Medical Specials ($)</Label>
          <Input
            id="medicalSpecials"
            type="text"
            value={formatNumberWithCommas(formData.medicalSpecials)}
            onChange={(e) => handleFormattedNumberChange('medicalSpecials', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="futureMedicals">Future Specials ($)</Label>
          <Input
            id="futureMedicals"
            type="text"
            value={formatNumberWithCommas(formData.futureMedicals)}
            onChange={(e) => handleFormattedNumberChange('futureMedicals', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plaintiffAge">Age</Label>
          <Input
            id="plaintiffAge"
            type="text"
            value={formatNumberWithCommas(formData.plaintiffAge)}
            onChange={(e) => handleFormattedNumberChange('plaintiffAge', e.target.value)}
            placeholder="35"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plaintiffOccupation">Occupation</Label>
          <Input
            id="plaintiffOccupation"
            type="text"
            value={formData.plaintiffOccupation || ''}
            onChange={(e) => setFormData({...formData, plaintiffOccupation: e.target.value})}
            placeholder="Enter occupation"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="annualIncome">Annual Income ($)</Label>
        <Input
          id="annualIncome"
          type="text"
          value={formatNumberWithCommas(formData.annualIncome)}
          onChange={(e) => handleFormattedNumberChange('annualIncome', e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="wageLoss">Wage Loss ($)</Label>
          <Input
            id="wageLoss"
            type="text"
            value={formatNumberWithCommas(formData.wageLoss)}
            onChange={(e) => handleFormattedNumberChange('wageLoss', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="futureEarningsLoss">Future Loss of Earnings ($)</Label>
          <Input
            id="futureEarningsLoss"
            type="text"
            value={formatNumberWithCommas(formData.futureEarningsLoss)}
            onChange={(e) => handleFormattedNumberChange('futureEarningsLoss', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default SpecialsEarningsStep;
