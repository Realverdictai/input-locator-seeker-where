
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useCsvImport } from "@/hooks/useCsvImport";
import FileUploadSection from "./admin/FileUploadSection";
import ImportOptions from "./admin/ImportOptions";
import ValidationErrors from "./admin/ValidationErrors";
import DataPreview from "./admin/DataPreview";
import ImportResult from "./admin/ImportResult";
import ImportButton from "./admin/ImportButton";

const AdminCsvImporter = () => {
  const [replaceExisting, setReplaceExisting] = useState(true);
  const {
    csvData,
    validationErrors,
    isProcessing,
    importResult,
    handleFileUpload,
    handleImport,
  } = useCsvImport();

  const onImport = () => {
    handleImport(replaceExisting);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Admin CSV Importer
          </CardTitle>
          <div className="text-sm text-red-600 font-medium">
            🚨 CONFIDENTIALITY REQUIREMENT 🚨<br />
            Real settlement data. Internal use only. Never redistribute.
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FileUploadSection 
            onFileUpload={handleFileUpload}
            csvDataLength={csvData.length}
          />

          <ImportOptions 
            replaceExisting={replaceExisting}
            onReplaceExistingChange={setReplaceExisting}
          />

          <ValidationErrors errors={validationErrors} />

          <DataPreview csvData={csvData} />

          <ImportResult result={importResult} />

          <ImportButton
            onImport={onImport}
            csvDataLength={csvData.length}
            validationErrorsLength={validationErrors.length}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCsvImporter;
