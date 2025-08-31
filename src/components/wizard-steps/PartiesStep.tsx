import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CaseData } from "@/types/verdict";

interface PartiesStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const PartiesStep = ({ formData, setFormData }: PartiesStepProps) => {
  const numberOfPlaintiffs = formData.numberOfPlaintiffs || 1;
  const numberOfDefendants = formData.numberOfDefendants || 1;

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

  const handleNumberOfPlaintiffsChange = (count: number) => {
    const plaintiffNames = Array(count).fill('').map((_, i) => 
      formData.plaintiffNames?.[i] || ''
    );
    setFormData({
      ...formData, 
      numberOfPlaintiffs: count,
      plaintiffNames
    });
  };

  const handleNumberOfDefendantsChange = (count: number) => {
    const defendantNames = Array(count).fill('').map((_, i) => 
      formData.defendantNames?.[i] || ''
    );
    setFormData({
      ...formData, 
      numberOfDefendants: count,
      defendantNames
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
            value={numberOfPlaintiffs}
            onChange={(e) => handleNumberOfPlaintiffsChange(parseInt(e.target.value) || 1)}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numberOfDefendants">Number of Defendants</Label>
          <Input
            id="numberOfDefendants"
            type="number"
            min="1"
            value={numberOfDefendants}
            onChange={(e) => handleNumberOfDefendantsChange(parseInt(e.target.value) || 1)}
            placeholder="1"
          />
        </div>
      </div>

      {/* Plaintiff Names */}
      {numberOfPlaintiffs > 0 && (
        <div className="space-y-4">
          <Label className="text-lg font-medium">Plaintiff Names</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: numberOfPlaintiffs }, (_, index) => (
              <div key={`plaintiff-${index}`} className="space-y-2">
                <Label htmlFor={`plaintiff-${index}`}>
                  Plaintiff {index + 1}
                </Label>
                <Input
                  id={`plaintiff-${index}`}
                  value={formData.plaintiffNames?.[index] || ''}
                  onChange={(e) => updatePlaintiffName(index, e.target.value)}
                  placeholder={`e.g., John D., Plaintiff ${index + 1}, etc.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defendant Names */}
      {numberOfDefendants > 0 && (
        <div className="space-y-4">
          <Label className="text-lg font-medium">Defendant Names</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: numberOfDefendants }, (_, index) => (
              <div key={`defendant-${index}`} className="space-y-2">
                <Label htmlFor={`defendant-${index}`}>
                  Defendant {index + 1}
                </Label>
                <Input
                  id={`defendant-${index}`}
                  value={formData.defendantNames?.[index] || ''}
                  onChange={(e) => updateDefendantName(index, e.target.value)}
                  placeholder={`e.g., ABC Company, Driver A, etc.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartiesStep;