
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CaseData } from "@/types/verdict";
import { useState } from "react";
import { Brain } from "lucide-react";

interface VenueStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const VenueStep = ({ formData, setFormData }: VenueStepProps) => {
  const [aiDescription, setAiDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Complete list of all 58 California counties
  const californiaCounties = [
    "Alameda", "Alpine", "Amador", "Butte", "Calaveras", "Colusa", "Contra Costa", "Del Norte",
    "El Dorado", "Fresno", "Glenn", "Humboldt", "Imperial", "Inyo", "Kern", "Kings",
    "Lake", "Lassen", "Los Angeles", "Madera", "Marin", "Mariposa", "Mendocino", "Merced",
    "Modoc", "Mono", "Monterey", "Napa", "Nevada", "Orange", "Placer", "Plumas",
    "Riverside", "Sacramento", "San Benito", "San Bernardino", "San Diego", "San Francisco",
    "San Joaquin", "San Luis Obispo", "San Mateo", "Santa Barbara", "Santa Clara", "Santa Cruz",
    "Shasta", "Sierra", "Siskiyou", "Solano", "Sonoma", "Stanislaus", "Sutter", "Tehama",
    "Trinity", "Tulare", "Tuolumne", "Ventura", "Yolo", "Yuba"
  ];

  const analyzeVenueWithAI = async () => {
    if (!aiDescription.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // Simple AI interpretation logic - in a real app, this would call an AI API
      const description = aiDescription.toLowerCase();
      let suggestedVenue = "";

      // Basic keyword matching for venue interpretation
      if (description.includes("los angeles") || description.includes("la") || description.includes("hollywood") || description.includes("beverly hills")) {
        suggestedVenue = "los-angeles";
      } else if (description.includes("san francisco") || description.includes("sf") || description.includes("bay area")) {
        suggestedVenue = "san-francisco";
      } else if (description.includes("orange") || description.includes("anaheim") || description.includes("newport")) {
        suggestedVenue = "orange";
      } else if (description.includes("san diego") || description.includes("chula vista")) {
        suggestedVenue = "san-diego";
      } else if (description.includes("sacramento") || description.includes("capital")) {
        suggestedVenue = "sacramento";
      } else if (description.includes("riverside") || description.includes("corona")) {
        suggestedVenue = "riverside";
      } else if (description.includes("san bernardino") || description.includes("inland empire")) {
        suggestedVenue = "san-bernardino";
      } else if (description.includes("fresno") || description.includes("central valley")) {
        suggestedVenue = "fresno";
      } else if (description.includes("santa clara") || description.includes("san jose") || description.includes("silicon valley")) {
        suggestedVenue = "santa-clara";
      } else if (description.includes("alameda") || description.includes("oakland") || description.includes("berkeley")) {
        suggestedVenue = "alameda";
      } else if (description.includes("contra costa") || description.includes("concord") || description.includes("richmond")) {
        suggestedVenue = "contra-costa";
      } else if (description.includes("ventura") || description.includes("oxnard")) {
        suggestedVenue = "ventura";
      } else if (description.includes("santa barbara") || description.includes("goleta")) {
        suggestedVenue = "santa-barbara";
      } else if (description.includes("kern") || description.includes("bakersfield")) {
        suggestedVenue = "kern";
      } else if (description.includes("san mateo") || description.includes("palo alto")) {
        suggestedVenue = "san-mateo";
      } else if (description.includes("monterey") || description.includes("salinas")) {
        suggestedVenue = "monterey";
      } else if (description.includes("sonoma") || description.includes("santa rosa")) {
        suggestedVenue = "sonoma";
      } else if (description.includes("placer") || description.includes("roseville")) {
        suggestedVenue = "placer";
      } else if (description.includes("san joaquin") || description.includes("stockton")) {
        suggestedVenue = "san-joaquin";
      } else if (description.includes("tulare") || description.includes("visalia")) {
        suggestedVenue = "tulare";
      } else if (description.includes("santa cruz") || description.includes("watsonville")) {
        suggestedVenue = "santa-cruz";
      } else if (description.includes("merced") || description.includes("los banos")) {
        suggestedVenue = "merced";
      } else if (description.includes("stanislaus") || description.includes("modesto")) {
        suggestedVenue = "stanislaus";
      } else if (description.includes("solano") || description.includes("vallejo")) {
        suggestedVenue = "solano";
      } else if (description.includes("napa") || description.includes("wine country")) {
        suggestedVenue = "napa";
      } else if (description.includes("marin") || description.includes("san rafael")) {
        suggestedVenue = "marin";
      }

      if (suggestedVenue) {
        setFormData({...formData, venue: suggestedVenue});
      }
    } catch (error) {
      console.error("Error analyzing venue:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Venue Interpreter */}
      <div className="space-y-3">
        <Label htmlFor="ai-venue">AI Venue Interpreter</Label>
        <div className="space-y-2">
          <Textarea
            id="ai-venue"
            placeholder="Describe the accident location (e.g., 'Hit on the 405 freeway in West LA near Beverly Hills' or 'Rear-ended on Highway 101 in downtown San Francisco')"
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={analyzeVenueWithAI}
            disabled={!aiDescription.trim() || isAnalyzing}
            className="w-full"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze & Suggest Venue"}
          </Button>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-700 text-sm">
            <strong>AI Tip:</strong> Describe the accident location with landmarks, highways, or cities. The AI will suggest the most appropriate venue/county for your case.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="venue">Venue/County (All 58 CA Counties)</Label>
        <Select 
          value={formData.venue || ''} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select county" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 max-h-60">
            {californiaCounties.map(county => (
              <SelectItem key={county} value={county.toLowerCase().replace(/\s+/g, '-')}>
                {county} County
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 text-sm">
          <strong>Venue Impact:</strong> The venue can significantly impact case valuation. Different counties have varying jury demographics and verdict tendencies. Use the AI interpreter above for location-based suggestions.
        </p>
      </div>
    </div>
  );
};

export default VenueStep;
