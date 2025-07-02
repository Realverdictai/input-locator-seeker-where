
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface PlaintiffInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const PlaintiffInfoStep = ({ formData, setFormData }: PlaintiffInfoStepProps) => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
};

export default PlaintiffInfoStep;
