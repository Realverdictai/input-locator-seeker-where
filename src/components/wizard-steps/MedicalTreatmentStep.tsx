import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";
import { getDistinctValues } from "@/integrations/supabase/getWeights";

interface MedicalTreatmentStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const MedicalTreatmentStep = ({ formData, setFormData }: MedicalTreatmentStepProps) => {
  const [surgeries, setSurgeries] = useState<string[]>([]);
  const [injections, setInjections] = useState<string[]>([]);

  useEffect(() => {
    const loadDistinctValues = async () => {
      try {
        const { surgeries, injections } = await getDistinctValues();
        setSurgeries(surgeries);
        setInjections(injections);
      } catch (error) {
        console.error('Error loading distinct values:', error);
      }
    };
    loadDistinctValues();
  }, []);

  return (
    <div className="space-y-6">
      {/* TBI Severity - only show if TBI is selected in injury types */}
      {formData.injuryTypes?.includes('traumatic-brain-injury') && (
        <div className="space-y-2">
          <Label htmlFor="tbiSeverity">TBI Severity (Defense Perspective)</Label>
          <Select 
            value={formData.tbiSeverity || ''} 
            onValueChange={(value) => setFormData({...formData, tbiSeverity: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select TBI severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surgeries">Number of Surgeries</Label>
          <Input
            id="surgeries"
            type="number"
            min="0"
            value={formData.surgeries || 0}
            onChange={(e) => setFormData({...formData, surgeries: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surgeryType">Surgery Type</Label>
          <Select 
            value={formData.surgeryType || ''} 
            onValueChange={(value) => setFormData({...formData, surgeryType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select surgery type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {surgeries.map(surgery => (
                <SelectItem key={surgery} value={surgery}>{surgery}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injections">Number of Injections</Label>
          <Input
            id="injections"
            type="number"
            min="0"
            value={formData.injections || 0}
            onChange={(e) => setFormData({...formData, injections: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="injectionType">Injection Type</Label>
          <Select 
            value={formData.injectionType || ''} 
            onValueChange={(value) => setFormData({...formData, injectionType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select injection type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {injections.map(injection => (
                <SelectItem key={injection} value={injection}>{injection}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="futureSurgeryRecommended"
            checked={formData.futureSurgeryRecommended || false}
            onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
          />
          <Label htmlFor="futureSurgeryRecommended">Future Surgery Recommended</Label>
        </div>

        {formData.futureSurgeryRecommended && (
          <div className="space-y-2">
            <Label htmlFor="futureSurgeryDetails">Future Surgery Details</Label>
            <Textarea
              id="futureSurgeryDetails"
              value={formData.futureSurgeryDetails || ''}
              onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
              placeholder="Describe recommended future surgery"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="priorConditions">Prior Conditions</Label>
          <Textarea
            id="priorConditions"
            value={formData.priorConditions || ''}
            onChange={(e) => setFormData({...formData, priorConditions: e.target.value})}
            placeholder="Describe any pre-existing conditions"
          />
        </div>
      </div>
    </div>
  );
};

export default MedicalTreatmentStep;