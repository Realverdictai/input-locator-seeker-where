import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";

interface PartiesStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const PartiesStep = ({ formData, setFormData }: PartiesStepProps) => {
  const numberOfPlaintiffs = formData.numberOfPlaintiffs;
  const numberOfDefendants = formData.numberOfDefendants;

  const updatePlaintiffName = (index: number, name: string) => {
    const plaintiffNames = [...(formData.plaintiffNames || [])];
    plaintiffNames[index] = name;
    setFormData({...formData, plaintiffNames});
  };

  const updateDefendantName = (index: number, name: string) => {
    const defendantNames = [...(formData.defendantNames || [])];
    defendantNames[index] = name;
    setFormData({...formData, defendantNames});
  };

  const updatePlaintiffDescription = (index: number, description: string) => {
    const plaintiffDescriptions = [...(formData.plaintiffDescriptions || [])];
    plaintiffDescriptions[index] = description;
    setFormData({...formData, plaintiffDescriptions});
  };

  const updateDefendantDescription = (index: number, description: string) => {
    const defendantDescriptions = [...(formData.defendantDescriptions || [])];
    defendantDescriptions[index] = description;
    setFormData({...formData, defendantDescriptions});
  };

  const handleNumberOfPlaintiffsChange = (count: number) => {
    if (count < 1) {
      setFormData({
        ...formData, 
        numberOfPlaintiffs: undefined,
        plaintiffNames: [],
        plaintiffDescriptions: []
      });
      return;
    }
    
    const plaintiffNames = Array(count).fill('').map((_, i) => 
      formData.plaintiffNames?.[i] || ''
    );
    const plaintiffDescriptions = Array(count).fill('').map((_, i) => 
      formData.plaintiffDescriptions?.[i] || ''
    );
    setFormData({
      ...formData, 
      numberOfPlaintiffs: count,
      plaintiffNames,
      plaintiffDescriptions
    });
  };

  const handleNumberOfDefendantsChange = (count: number) => {
    if (count < 1) {
      setFormData({
        ...formData, 
        numberOfDefendants: undefined,
        defendantNames: [],
        defendantDescriptions: []
      });
      return;
    }
    
    const defendantNames = Array(count).fill('').map((_, i) => 
      formData.defendantNames?.[i] || ''
    );
    const defendantDescriptions = Array(count).fill('').map((_, i) => 
      formData.defendantDescriptions?.[i] || ''
    );
    setFormData({
      ...formData, 
      numberOfDefendants: count,
      defendantNames,
      defendantDescriptions
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Privacy Note:</strong> You do not need to include real names. You can use initials, pseudonyms, or generic labels like "Plaintiff 1" or "Defendant A" to maintain confidentiality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numberOfPlaintiffs">Number of Plaintiffs</Label>
          <Input
            id="numberOfPlaintiffs"
            type="number"
            min="1"
            value={numberOfPlaintiffs || ''}
            onChange={(e) => handleNumberOfPlaintiffsChange(parseInt(e.target.value) || 0)}
            placeholder="Enter number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfDefendants">Number of Defendants</Label>
          <Input
            id="numberOfDefendants"
            type="number"
            min="1"
            value={numberOfDefendants || ''}
            onChange={(e) => handleNumberOfDefendantsChange(parseInt(e.target.value) || 0)}
            placeholder="Enter number"
          />
        </div>
      </div>

      {/* Plaintiff Names and Descriptions */}
      {numberOfPlaintiffs > 0 && (
        <div className="space-y-4">
          <Label className="text-lg font-medium">Plaintiff Information</Label>
          <div className="space-y-6">
            {Array.from({ length: numberOfPlaintiffs }, (_, index) => (
              <div key={`plaintiff-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`plaintiff-name-${index}`}>
                      Plaintiff {index + 1} Name
                    </Label>
                    <Input
                      id={`plaintiff-name-${index}`}
                      value={formData.plaintiffNames?.[index] || ''}
                      onChange={(e) => updatePlaintiffName(index, e.target.value)}
                      placeholder={`e.g., John D., Plaintiff ${index + 1}, etc.`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`plaintiff-desc-${index}`}>
                    Description <span className="text-sm text-gray-500">(Optional - helps AI provide better analysis)</span>
                  </Label>
                  <Textarea
                    id={`plaintiff-desc-${index}`}
                    value={formData.plaintiffDescriptions?.[index] || ''}
                    onChange={(e) => updatePlaintiffDescription(index, e.target.value)}
                    placeholder="e.g., 45-year-old construction worker, passenger in vehicle, pedestrian crossing street, etc."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defendant Names and Descriptions */}
      {numberOfDefendants > 0 && (
        <div className="space-y-4">
          <Label className="text-lg font-medium">Defendant Information</Label>
          <div className="space-y-6">
            {Array.from({ length: numberOfDefendants }, (_, index) => (
              <div key={`defendant-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`defendant-name-${index}`}>
                      Defendant {index + 1} Name
                    </Label>
                    <Input
                      id={`defendant-name-${index}`}
                      value={formData.defendantNames?.[index] || ''}
                      onChange={(e) => updateDefendantName(index, e.target.value)}
                      placeholder={`e.g., ABC Company, Driver A, etc.`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`defendant-desc-${index}`}>
                    Description <span className="text-sm text-gray-500">(Optional - helps AI provide better analysis)</span>
                  </Label>
                  <Textarea
                    id={`defendant-desc-${index}`}
                    value={formData.defendantDescriptions?.[index] || ''}
                    onChange={(e) => updateDefendantDescription(index, e.target.value)}
                    placeholder="e.g., Trucking company, individual driver, property owner, government entity, etc."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartiesStep;