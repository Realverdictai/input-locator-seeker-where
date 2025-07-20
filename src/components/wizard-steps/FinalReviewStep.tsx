
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CaseData } from "@/types/verdict";

interface FinalReviewStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const FinalReviewStep = ({ formData, setFormData }: FinalReviewStepProps) => {
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'Not specified';
    return `$${value.toLocaleString('en-US')}`;
  };

  const formatArray = (arr: string[] | undefined): string => {
    if (!arr || arr.length === 0) return 'None';
    return arr.join(', ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Case Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Case Category:</strong> {formData.caseCategory || 'Not specified'}
            </div>
            <div>
              <strong>Date of Loss:</strong> {formData.dateOfLoss || 'Not specified'}
            </div>
            <div>
              <strong>Venue:</strong> {formData.venue || 'Not specified'}
            </div>
            <div>
              <strong>Accident Type:</strong> {formData.accidentSubType || 'Not specified'}
            </div>
            <div>
              <strong>Injury Types:</strong> {formatArray(formData.injuryTypes)}
            </div>
            <div>
              <strong>Liability %:</strong> {formData.liabilityPercentage || 0}%
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Medical Specials:</strong> {formatCurrency(formData.medicalSpecials)}
            </div>
            <div>
              <strong>Future Medicals:</strong> {formatCurrency(formData.futureMedicals)}
            </div>
            <div>
              <strong>Wage Loss:</strong> {formatCurrency(formData.wageLoss)}
            </div>
            <div>
              <strong>Future Earnings Loss:</strong> {formatCurrency(formData.futureEarningsLoss)}
            </div>
            <div>
              <strong>Policy Limits:</strong> {formatCurrency(formData.policyLimits)}
            </div>
            <div>
              <strong>Annual Income:</strong> {formatCurrency(formData.annualIncome)}
            </div>
          </div>

          <Separator />

          <div className="text-sm">
            <div><strong>Surgeries:</strong> {formData.surgeries || 0}</div>
            <div><strong>Surgery Types:</strong> {formatArray(formData.surgeryTypes)}</div>
            <div><strong>Injections:</strong> {formData.injections || 0}</div>
            <div><strong>Injection Types:</strong> {formatArray(formData.injectionTypes)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="medicalRecordsAnalysis">Medical Records Summary</Label>
        <Textarea
          id="medicalRecordsAnalysis"
          value={formData.medicalRecordsAnalysis || ''}
          onChange={(e) => setFormData({...formData, medicalRecordsAnalysis: e.target.value})}
          placeholder="Paste medical summary or key records analysis here..."
          rows={6}
        />
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Ready for Evaluation</h4>
        <p className="text-blue-700 text-sm">
          Review all information above. Once you proceed, the case will be evaluated based on the provided data. 
          You can use the "Back" button to make any necessary changes.
        </p>
      </div>
    </div>
  );
};

export default FinalReviewStep;
