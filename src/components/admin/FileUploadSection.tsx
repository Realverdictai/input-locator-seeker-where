
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  csvDataLength: number;
}

const FileUploadSection = ({ onFileUpload, csvDataLength }: FileUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    console.log('Button clicked, triggering file input');
    
    if (fileInputRef.current) {
      console.log('Clicking file input programmatically');
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Select CSV File</label>
      
      {/* Mac Users Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <div className="font-semibold text-yellow-800 mb-2">📱 Mac Users with Numbers:</div>
        <ol className="list-decimal list-inside space-y-1 text-yellow-700">
          <li>Open your Numbers file</li>
          <li>Go to <strong>File → Export To → CSV</strong></li>
          <li>Save the CSV file to your desktop</li>
          <li>Then upload the CSV file here</li>
        </ol>
        <div className="mt-2 text-yellow-600">
          ⚠️ <strong>.numbers files won't work</strong> - you must export as CSV first!
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={triggerFileInput}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Choose CSV File
        </Button>
        {csvDataLength > 0 && (
          <span className="text-sm text-green-600">
            ✓ {csvDataLength} cases loaded
          </span>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/csv"
        onChange={onFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploadSection;
