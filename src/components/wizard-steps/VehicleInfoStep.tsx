import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface VehicleInfoStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const vehicleSizes = [
  { value: "compact", label: "Compact Car" },
  { value: "midsize", label: "Midsize Car" },
  { value: "fullsize", label: "Full-size Car" },
  { value: "suv-small", label: "Small SUV" },
  { value: "suv-midsize", label: "Midsize SUV" },
  { value: "suv-large", label: "Large SUV" },
  { value: "truck-pickup", label: "Pickup Truck" },
  { value: "truck-commercial", label: "Commercial Truck" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "pedestrian", label: "Pedestrian" },
  { value: "other", label: "Other" }
];

const VehicleInfoStep = ({ formData, setFormData }: VehicleInfoStepProps) => {
  const handleFieldChange = (field: keyof CaseData, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>
            Provide details about the vehicles involved in the accident
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plaintiff Vehicle */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plaintiff Vehicle</h3>
              
              <div className="space-y-2">
                <Label htmlFor="plaintiffVehicle">Make and Model</Label>
                <Input
                  id="plaintiffVehicle"
                  placeholder="e.g., Toyota Camry"
                  value={formData.plaintiffVehicle || ""}
                  onChange={(e) => handleFieldChange("plaintiffVehicle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plaintiffVehicleSize">Vehicle Size/Type</Label>
                <Select
                  value={formData.plaintiffVehicleSize || ""}
                  onValueChange={(value) => handleFieldChange("plaintiffVehicleSize", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle size" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Defendant Vehicle */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Defendant Vehicle</h3>
              
              <div className="space-y-2">
                <Label htmlFor="defendantVehicle">Make and Model</Label>
                <Input
                  id="defendantVehicle"
                  placeholder="e.g., Ford F-150"
                  value={formData.defendantVehicle || ""}
                  onChange={(e) => handleFieldChange("defendantVehicle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defendantVehicleSize">Vehicle Size/Type</Label>
                <Select
                  value={formData.defendantVehicleSize || ""}
                  onValueChange={(value) => handleFieldChange("defendantVehicleSize", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle size" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleInfoStep;
