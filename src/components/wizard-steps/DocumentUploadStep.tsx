import { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DocumentUploadStepProps {
  narrativeText: string;
  setNarrativeText: (text: string) => void;
}

const DocumentUploadStep = ({ narrativeText, setNarrativeText }: DocumentUploadStepProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    let combined = "";
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        combined += `\n${text}`;
      } catch (err) {
        console.error('Failed to read file', err);
      }
    }
    if (combined.trim()) {
      setNarrativeText(combined.trim());
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="caseDocs">Upload Case Documents</Label>
        <Input
          id="caseDocs"
          type="file"
          multiple
          accept=".txt,.pdf,.doc,.docx"
          ref={fileRef}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {narrativeText && (
        <div className="p-4 bg-gray-50 border rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
          {narrativeText}
        </div>
      )}
      <div className="text-gray-500 text-sm">
        Upload pleadings or medical summaries. Text is parsed automatically and remaining questions will be asked in the wizard.
      </div>
    </div>
  );
};

export default DocumentUploadStep;
