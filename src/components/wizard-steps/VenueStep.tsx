
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface VenueStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const VenueStep = ({ formData, setFormData }: VenueStepProps) => {
  const californiaCounties = [
    "Los Angeles", "San Francisco", "Orange", "San Diego", "Santa Clara", "Alameda",
    "Riverside", "Sacramento", "San Bernardino", "Contra Costa", "Fresno", "Kern",
    "Ventura", "San Joaquin", "Sonoma", "Tulare", "Santa Barbara", "Solano", 
    "Monterey", "Placer", "San Mateo", "Merced", "Stanislaus", "Santa Cruz", "Napa", "Marin"
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="venue">Venue/County</Label>
        <Select 
          value={formData.venue || ''} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select county" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {californiaCounties.map(county => (
              <SelectItem key={county} value={county.toLowerCase().replace(/\s+/g, '-')}>
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 text-sm">
          The venue can significantly impact case valuation. Different counties have varying jury demographics and verdict tendencies.
        </p>
      </div>
    </div>
  );
};

export default VenueStep;
