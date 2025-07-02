
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ValidationErrorsProps {
  errors: string[];
}

const ValidationErrors = ({ errors }: ValidationErrorsProps) => {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium">Validation Errors:</div>
        <ul className="mt-2 list-disc list-inside">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default ValidationErrors;
