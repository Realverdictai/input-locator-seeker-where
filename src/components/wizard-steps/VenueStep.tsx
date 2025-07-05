
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

  // Complete list of California Superior Courts (civil courts)
  const californiaCivilCourts = [
    "Alameda County Superior Court",
    "Alpine County Superior Court", 
    "Amador County Superior Court",
    "Butte County Superior Court",
    "Calaveras County Superior Court",
    "Colusa County Superior Court",
    "Contra Costa County Superior Court",
    "Del Norte County Superior Court",
    "El Dorado County Superior Court",
    "Fresno County Superior Court",
    "Glenn County Superior Court",
    "Humboldt County Superior Court",
    "Imperial County Superior Court",
    "Inyo County Superior Court",
    "Kern County Superior Court",
    "Kings County Superior Court",
    "Lake County Superior Court",
    "Lassen County Superior Court",
    "Los Angeles County Superior Court",
    "Madera County Superior Court",
    "Marin County Superior Court",
    "Mariposa County Superior Court",
    "Mendocino County Superior Court",
    "Merced County Superior Court",
    "Modoc County Superior Court",
    "Mono County Superior Court",
    "Monterey County Superior Court",
    "Napa County Superior Court",
    "Nevada County Superior Court",
    "Orange County Superior Court",
    "Placer County Superior Court",
    "Plumas County Superior Court",
    "Riverside County Superior Court",
    "Sacramento County Superior Court",
    "San Benito County Superior Court",
    "San Bernardino County Superior Court",
    "San Diego County Superior Court",
    "San Francisco County Superior Court",
    "San Joaquin County Superior Court",
    "San Luis Obispo County Superior Court",
    "San Mateo County Superior Court",
    "Santa Barbara County Superior Court",
    "Santa Clara County Superior Court",
    "Santa Cruz County Superior Court",
    "Shasta County Superior Court",
    "Sierra County Superior Court",
    "Siskiyou County Superior Court",
    "Solano County Superior Court",
    "Sonoma County Superior Court",
    "Stanislaus County Superior Court",
    "Sutter County Superior Court",
    "Tehama County Superior Court",
    "Trinity County Superior Court",
    "Tulare County Superior Court",
    "Tuolumne County Superior Court",
    "Ventura County Superior Court",
    "Yolo County Superior Court",
    "Yuba County Superior Court"
  ];

  const analyzeVenueWithAI = async () => {
    if (!aiDescription.trim()) return;
    
    setIsAnalyzing(true);
    try {
      // Simple AI interpretation logic - in a real app, this would call an AI API
      const description = aiDescription.toLowerCase();
      let suggestedVenue = "";

      // Basic keyword matching for court interpretation
      if (description.includes("los angeles") || description.includes("la") || description.includes("hollywood") || description.includes("beverly hills")) {
        suggestedVenue = "Los Angeles County Superior Court";
      } else if (description.includes("san francisco") || description.includes("sf") || description.includes("bay area")) {
        suggestedVenue = "San Francisco County Superior Court";
      } else if (description.includes("orange") || description.includes("anaheim") || description.includes("newport")) {
        suggestedVenue = "Orange County Superior Court";
      } else if (description.includes("san diego") || description.includes("chula vista")) {
        suggestedVenue = "San Diego County Superior Court";
      } else if (description.includes("sacramento") || description.includes("capital")) {
        suggestedVenue = "Sacramento County Superior Court";
      } else if (description.includes("riverside") || description.includes("corona")) {
        suggestedVenue = "Riverside County Superior Court";
      } else if (description.includes("san bernardino") || description.includes("inland empire")) {
        suggestedVenue = "San Bernardino County Superior Court";
      } else if (description.includes("fresno") || description.includes("central valley")) {
        suggestedVenue = "Fresno County Superior Court";
      } else if (description.includes("santa clara") || description.includes("san jose") || description.includes("silicon valley")) {
        suggestedVenue = "Santa Clara County Superior Court";
      } else if (description.includes("alameda") || description.includes("oakland") || description.includes("berkeley")) {
        suggestedVenue = "Alameda County Superior Court";
      } else if (description.includes("contra costa") || description.includes("concord") || description.includes("richmond")) {
        suggestedVenue = "Contra Costa County Superior Court";
      } else if (description.includes("ventura") || description.includes("oxnard")) {
        suggestedVenue = "Ventura County Superior Court";
      } else if (description.includes("santa barbara") || description.includes("goleta")) {
        suggestedVenue = "Santa Barbara County Superior Court";
      } else if (description.includes("kern") || description.includes("bakersfield")) {
        suggestedVenue = "Kern County Superior Court";
      } else if (description.includes("san mateo") || description.includes("palo alto")) {
        suggestedVenue = "San Mateo County Superior Court";
      } else if (description.includes("monterey") || description.includes("salinas")) {
        suggestedVenue = "Monterey County Superior Court";
      } else if (description.includes("sonoma") || description.includes("santa rosa")) {
        suggestedVenue = "Sonoma County Superior Court";
      } else if (description.includes("placer") || description.includes("roseville")) {
        suggestedVenue = "Placer County Superior Court";
      } else if (description.includes("san joaquin") || description.includes("stockton")) {
        suggestedVenue = "San Joaquin County Superior Court";
      } else if (description.includes("tulare") || description.includes("visalia")) {
        suggestedVenue = "Tulare County Superior Court";
      } else if (description.includes("santa cruz") || description.includes("watsonville")) {
        suggestedVenue = "Santa Cruz County Superior Court";
      } else if (description.includes("merced") || description.includes("los banos")) {
        suggestedVenue = "Merced County Superior Court";
      } else if (description.includes("stanislaus") || description.includes("modesto")) {
        suggestedVenue = "Stanislaus County Superior Court";
      } else if (description.includes("solano") || description.includes("vallejo")) {
        suggestedVenue = "Solano County Superior Court";
      } else if (description.includes("napa") || description.includes("wine country")) {
        suggestedVenue = "Napa County Superior Court";
      } else if (description.includes("marin") || description.includes("san rafael")) {
        suggestedVenue = "Marin County Superior Court";
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
        <Label htmlFor="venue">Venue/Court (California Superior Courts)</Label>
        <Select 
          value={formData.venue || ''} 
          onValueChange={(value) => setFormData({...formData, venue: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select superior court" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50 max-h-60">
            {californiaCivilCourts.map(court => (
              <SelectItem key={court} value={court}>
                {court}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-700 text-sm">
          <strong>Court Impact:</strong> The specific superior court can significantly impact case valuation. Different courts have varying jury demographics and verdict tendencies. Use the AI interpreter above for location-based court suggestions.
        </p>
      </div>
    </div>
  );
};

export default VenueStep;
