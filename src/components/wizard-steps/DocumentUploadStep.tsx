import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CaseData } from "@/types/verdict";
import { parseFileToText } from "@/lib/documentParser";

interface DocumentUploadStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
  onQuickEvaluate: () => void;
}

const DocumentUploadStep = ({ formData, setFormData, onQuickEvaluate }: DocumentUploadStepProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      let text = "";
      for (const file of Array.from(files)) {
        text += await parseFileToText(file) + "\n";
      }
      setFormData({ ...formData, narrative: text.trim() });
    } catch (err) {
      console.error(err);
      setError("Failed to read documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="documentUpload">Upload Letters or Demands</Label>
        <Input id="documentUpload" type="file" multiple accept=".pdf,.doc,.docx,.txt" onChange={handleFiles} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {formData.narrative && (
        <div className="space-y-2">
          <Label htmlFor="narrative">Extracted Text</Label>
          <Textarea
            id="narrative"
            rows={8}
            value={formData.narrative}
            onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
          />
        </div>
      )}

      {formData.narrative && (
        <Button type="button" onClick={onQuickEvaluate} disabled={loading}>
          Evaluate with Uploaded Docs
        </Button>
      )}
    </div>
  );
};

export default DocumentUploadStep;
