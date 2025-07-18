import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CaseData } from "@/types/verdict";
import FileDropZone from "@/components/FileDropZone";
import { supabase } from "@/integrations/supabase/client";
import ClarifyModal from "@/components/ClarifyModal";

interface DocumentUploadStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
  onQuickEvaluate: () => void;
}

const DocumentUploadStep = ({ formData, setFormData, onQuickEvaluate }: DocumentUploadStepProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docsUploaded, setDocsUploaded] = useState(false);
  const [clarifyQuestion, setClarifyQuestion] = useState<string | null>(null);

  const handleUploadDocs = async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const sessionId = formData.caseSessionId || crypto.randomUUID();
      const form = new FormData();
      form.append('caseSessionId', sessionId);
      files.forEach(f => form.append('files', f));
      const { error } = await supabase.functions.invoke('upload-docs', {
        body: form
      });
      if (error) throw error;
      setFormData({ ...formData, caseSessionId: sessionId });
      setDocsUploaded(true);
      if ((formData.clarifyMode || 'ask') === 'ask') {
        const { data, error: qErr } = await supabase.functions.invoke('get-clarify-question', {
          body: { sessionId, formData }
        });
        if (!qErr) setClarifyQuestion((data as any).question);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  const handleClarifySubmit = async (answer: string) => {
    const sessionId = formData.caseSessionId!;
    await supabase.functions.invoke('clarify-answer', {
      body: { sessionId, question: clarifyQuestion, answer }
    });
    const { data, error } = await supabase.functions.invoke('get-clarify-question', {
      body: { sessionId, formData }
    });
    if (!error) {
      const q = (data as any).question as string;
      if (q === 'NO_MORE_QUESTIONS') {
        setClarifyQuestion(null);
      } else {
        setClarifyQuestion(q);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Upload Letters or Demands</Label>
        <FileDropZone accept=".pdf,.docx,.txt,.eml,.rtf" multiple onUpload={handleUploadDocs} />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <RadioGroup
        className="flex gap-4"
        value={formData.clarifyMode || 'ask'}
        onValueChange={(v) => setFormData({ ...formData, clarifyMode: v as any })}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="ask" id="ask" />
          <Label htmlFor="ask">Ask any follow-up questions first</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="skip" id="skip" />
          <Label htmlFor="skip">Skip questions, go straight to valuation</Label>
        </div>
      </RadioGroup>

      {docsUploaded && (
        <Button type="button" onClick={onQuickEvaluate} disabled={loading}>
          Evaluate Case
        </Button>
      )}
      {clarifyQuestion && (
        <ClarifyModal
          open={!!clarifyQuestion}
          question={clarifyQuestion}
          onSubmit={handleClarifySubmit}
        />
      )}
    </div>
  );
};

export default DocumentUploadStep;
