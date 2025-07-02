
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ImportButtonProps {
  onImport: () => void;
  csvDataLength: number;
  validationErrorsLength: number;
  isProcessing: boolean;
}

const ImportButton = ({ onImport, csvDataLength, validationErrorsLength, isProcessing }: ImportButtonProps) => {
  return (
    <Button
      onClick={onImport}
      disabled={csvDataLength === 0 || validationErrorsLength > 0 || isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        "Processing..."
      ) : (
        <>
          <Upload className="w-4 h-4 mr-2" />
          Import {csvDataLength} Cases
        </>
      )}
    </Button>
  );
};

export default ImportButton;
