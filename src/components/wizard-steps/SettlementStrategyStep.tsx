import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CaseData } from "@/types/verdict";
import { UserType } from "@/types/auth";

interface SettlementStrategyStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
  userType: UserType;
}

const formatNumber = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  return value.toLocaleString("en-US");
};

const parseNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const num = Number(value.replace(/,/g, ""));
  return isNaN(num) ? undefined : num;
};

const SettlementStrategyStep = ({ formData, setFormData, userType }: SettlementStrategyStepProps) => {
  const handleChange = (field: keyof CaseData, value: string) => {
    setFormData({ ...formData, [field]: parseNumber(value) });
  };

  return (
    <div className="space-y-6">
      {userType === 'pi_lawyer' ? (
        <div className="space-y-2">
          <Label htmlFor="plaintiffBottomLine">Plaintiff Bottom Line ($)</Label>
          <Input
            id="plaintiffBottomLine"
            type="text"
            value={formatNumber(formData.plaintiffBottomLine)}
            onChange={(e) => handleChange('plaintiffBottomLine', e.target.value)}
            placeholder="Enter minimum acceptable amount"
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="defenseAuthority">Defense Authority ($)</Label>
            <Input
              id="defenseAuthority"
              type="text"
              value={formatNumber(formData.defenseAuthority)}
              onChange={(e) => handleChange('defenseAuthority', e.target.value)}
              placeholder="Enter maximum authority"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defenseRangeLow">Target Range Low ($)</Label>
              <Input
                id="defenseRangeLow"
                type="text"
                value={formatNumber(formData.defenseRangeLow)}
                onChange={(e) => handleChange('defenseRangeLow', e.target.value)}
                placeholder="Low end"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defenseRangeHigh">Target Range High ($)</Label>
              <Input
                id="defenseRangeHigh"
                type="text"
                value={formatNumber(formData.defenseRangeHigh)}
                onChange={(e) => handleChange('defenseRangeHigh', e.target.value)}
                placeholder="High end"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SettlementStrategyStep;
