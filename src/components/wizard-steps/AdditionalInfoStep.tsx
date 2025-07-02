
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";

interface AdditionalInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const AdditionalInfoStep = ({ formData, setFormData }: AdditionalInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="additionalFactors">Additional Factors</Label>
        <Textarea
          id="additionalFactors"
          value={formData.additionalFactors || ''}
          onChange={(e) => setFormData({...formData, additionalFactors: e.target.value})}
          placeholder="Any additional factors that may affect the case value"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="medicalRecordsAnalysis">Medical Records Analysis</Label>
        <Textarea
          id="medicalRecordsAnalysis"
          value={formData.medicalRecordsAnalysis || ''}
          onChange={(e) => setFormData({...formData, medicalRecordsAnalysis: e.target.value})}
          placeholder="Summary of medical records and treatment history"
          rows={4}
        />
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Review Your Information</h4>
        <p className="text-blue-700 text-sm">
          Please review all the information you've entered before proceeding with the case evaluation. 
          You can use the "Back" button to make any necessary changes to previous sections.
        </p>
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
