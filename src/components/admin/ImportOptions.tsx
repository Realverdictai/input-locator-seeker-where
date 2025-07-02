
import { Checkbox } from "@/components/ui/checkbox";

interface ImportOptionsProps {
  replaceExisting: boolean;
  onReplaceExistingChange: (checked: boolean) => void;
}

const ImportOptions = ({ replaceExisting, onReplaceExistingChange }: ImportOptionsProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="replace"
        checked={replaceExisting}
        onCheckedChange={(checked) => onReplaceExistingChange(checked as boolean)}
      />
      <label htmlFor="replace" className="text-sm font-medium">
        Replace existing data (truncate then import)
      </label>
    </div>
  );
};

export default ImportOptions;
