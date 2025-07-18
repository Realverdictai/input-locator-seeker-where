
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { CaseData } from "@/types/verdict";
import { analyzeDamageMedia } from "@/lib/damageAnalyzer";

interface LiabilityImpactStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const LiabilityImpactStep = ({ formData, setFormData }: LiabilityImpactStepProps) => {
  const showImpact = !formData.caseType?.includes('dog-bite');
  const [previews, setPreviews] = useState<string[]>(formData.damageMedia || []);

  const handleMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArr = Array.from(files);
    const urls: string[] = [];
    for (const file of fileArr) {
      urls.push(URL.createObjectURL(file));
    }
    setPreviews(urls);
    const score = await analyzeDamageMedia(fileArr);
    setFormData({ ...formData, damageMedia: urls, damageScore: score });
  };
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

          <div className="space-y-2 pt-4">
            <Label htmlFor="damageMedia">Upload Damage Photos or Videos</Label>
            <Input id="damageMedia" type="file" multiple accept="image/*,video/*" onChange={handleMedia} />
            {formData.damageScore !== undefined && (
              <p className="text-sm text-gray-600">AI Damage Score: {formData.damageScore}</p>
            )}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {previews.map((src, idx) => (
                  <img key={idx} src={src} alt="damage" className="h-24 w-full object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiabilityImpactStep;
