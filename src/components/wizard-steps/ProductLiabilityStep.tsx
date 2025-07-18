import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";

interface ProductLiabilityStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const ProductLiabilityStep = ({ formData, setFormData }: ProductLiabilityStepProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="productName">Product Name</Label>
        <Input
          id="productName"
          value={formData.productName || ''}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          placeholder="Product or device name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defectDescription">Alleged Defect</Label>
        <Textarea
          id="defectDescription"
          value={formData.defectDescription || ''}
          onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
          placeholder="Describe the defect or failure"
          rows={4}
        />
      </div>
    </div>
  );
};

export default ProductLiabilityStep;
