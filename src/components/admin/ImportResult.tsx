
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

interface ImportResultProps {
  result: { success: boolean; message: string } | null;
}

const ImportResult = ({ result }: ImportResultProps) => {
  if (!result) return null;

  return (
    <Alert variant={result.success ? "default" : "destructive"}>
      {result.success ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <AlertDescription>{result.message}</AlertDescription>
    </Alert>
  );
};

export default ImportResult;
