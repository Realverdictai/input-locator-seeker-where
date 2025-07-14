import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface VehicleInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const VehicleInfoStep = ({ formData, setFormData }: VehicleInfoStepProps) => {
  if (!formData.caseType?.includes('accident')) {
    return null;
  }

  const sizeOptions = [
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'compact', label: 'Compact Car' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'pickup', label: 'Pickup/Van' },
    { value: 'commercial', label: 'Commercial Truck/Bus' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="plaintiffVehicle">Plaintiff Vehicle Make & Model</Label>
        <Input
          id="plaintiffVehicle"
          type="text"
          value={formData.plaintiffVehicle || ''}
          onChange={(e) => setFormData({ ...formData, plaintiffVehicle: e.target.value })}
          placeholder="e.g. Toyota Camry"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plaintiffVehicleSize">Plaintiff Vehicle Size</Label>
        <Select
          value={formData.plaintiffVehicleSize || ''}
          onValueChange={(value) => setFormData({ ...formData, plaintiffVehicleSize: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-md z-50">
            {sizeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defendantVehicle">Defendant Vehicle Make & Model</Label>
        <Input
          id="defendantVehicle"
          type="text"
          value={formData.defendantVehicle || ''}
          onChange={(e) => setFormData({ ...formData, defendantVehicle: e.target.value })}
          placeholder="e.g. Ford F-150"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defendantVehicleSize">Defendant Vehicle Size</Label>
        <Select
          value={formData.defendantVehicleSize || ''}
          onValueChange={(value) => setFormData({ ...formData, defendantVehicleSize: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border shadow-md z-50">
            {sizeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VehicleInfoStep;
