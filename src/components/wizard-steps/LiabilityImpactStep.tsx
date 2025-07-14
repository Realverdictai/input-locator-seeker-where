
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CaseData } from "@/types/verdict";

interface LiabilityImpactStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const LiabilityImpactStep = ({ formData, setFormData }: LiabilityImpactStepProps) => {
  const showImpact = formData.caseType !== 'dog-bite';
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="liabilityDisputed">Is Liability Disputed?</Label>
        <Select 
          value={formData.liabilityDisputed || ''} 
          onValueChange={(value) => setFormData({...formData, liabilityDisputed: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select liability status" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="no">No - Clear Liability</SelectItem>
            <SelectItem value="partial">Partial - Comparative Fault</SelectItem>
            <SelectItem value="yes">Yes - Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Liability % Attributed to Plaintiff: {formData.liabilityPercentage || 0}%</Label>
        <Slider
          value={[formData.liabilityPercentage || 0]}
          onValueChange={(value) => setFormData({...formData, liabilityPercentage: value[0]})}
          max={100}
          min={0}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0% (No fault)</span>
          <span>50% (Equal fault)</span>
          <span>100% (Full fault)</span>
        </div>
      </div>

      {showImpact && (
        <div className="space-y-2">
          <Label>Severity of Impact (1-10): {formData.impactSeverity || 5}</Label>
          <Slider
            value={[formData.impactSeverity || 5]}
            onValueChange={(value) => setFormData({...formData, impactSeverity: value[0]})}
            max={10}
            min={1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 (Minor)</span>
            <span>5 (Moderate)</span>
            <span>10 (Severe)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiabilityImpactStep;
