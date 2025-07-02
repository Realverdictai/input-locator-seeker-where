
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
    console.log('File input ref:', fileInputRef.current);
    
    if (fileInputRef.current) {
      console.log('Clicking file input programmatically');
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select CSV File</label>
      <div className="text-xs text-gray-600 mb-2">
        📝 <strong>Mac Users:</strong> If using Numbers, export as CSV first: File → Export To → CSV
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
        accept=".csv,text/csv"
        onChange={onFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUploadSection;
