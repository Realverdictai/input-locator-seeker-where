
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
      if (description.includes("los angeles") || description.includes("la") || description.includes("hollywood") || description.includes("beverly hills") ||
          description.includes("compton") || description.includes("long beach") || description.includes("inglewood") || 
          description.includes("santa monica") || description.includes("pasadena") || description.includes("burbank") ||
          description.includes("glendale") || description.includes("torrance") || description.includes("el segundo") ||
          description.includes("carson") || description.includes("hawthorne") || description.includes("redondo beach") ||
          description.includes("manhattan beach") || description.includes("hermosa beach") || description.includes("culver city") ||
          description.includes("west hollywood") || description.includes("century city") || description.includes("downtown la") ||
          description.includes("koreatown") || description.includes("westwood") || description.includes("brentwood") ||
          description.includes("venice") || description.includes("marina del rey") || description.includes("playa del rey") ||
          description.includes("lax") || description.includes("watts") || description.includes("south la") ||
          description.includes("east la") || description.includes("boyle heights") || description.includes("highland park") ||
          description.includes("eagle rock") || description.includes("silver lake") || description.includes("echo park") ||
          description.includes("los feliz") || description.includes("griffith park") || description.includes("dodger stadium") ||
          description.includes("staples center") || description.includes("crypto.com arena")) {
        suggestedVenue = "Los Angeles County Superior Court";
      } else if (description.includes("san francisco") || description.includes("sf") || description.includes("bay area") ||
                 description.includes("mission district") || description.includes("castro") || description.includes("soma") ||
                 description.includes("financial district") || description.includes("chinatown sf") || description.includes("nob hill") ||
                 description.includes("russian hill") || description.includes("pacific heights") || description.includes("marina sf")) {
        suggestedVenue = "San Francisco County Superior Court";
      } else if (description.includes("orange") || description.includes("anaheim") || description.includes("newport") ||
                 description.includes("huntington beach") || description.includes("irvine") || description.includes("santa ana") ||
                 description.includes("costa mesa") || description.includes("fullerton") || description.includes("garden grove") ||
                 description.includes("orange county") || description.includes("disneyland") || description.includes("oc")) {
        suggestedVenue = "Orange County Superior Court";
      } else if (description.includes("san diego") || description.includes("chula vista") || description.includes("oceanside") ||
                 description.includes("escondido") || description.includes("carlsbad") || description.includes("el cajon") ||
                 description.includes("vista") || description.includes("san marcos") || description.includes("encinitas") ||
                 description.includes("la mesa") || description.includes("national city") || description.includes("imperial beach")) {
        suggestedVenue = "San Diego County Superior Court";
      } else if (description.includes("sacramento") || description.includes("capital") || description.includes("elk grove") ||
                 description.includes("roseville") || description.includes("folsom") || description.includes("citrus heights")) {
        suggestedVenue = "Sacramento County Superior Court";
      } else if (description.includes("riverside") || description.includes("corona") || description.includes("moreno valley") ||
                 description.includes("palm springs") || description.includes("hemet") || description.includes("perris") ||
                 description.includes("temecula") || description.includes("murrieta") || description.includes("desert hot springs")) {
        suggestedVenue = "Riverside County Superior Court";
      } else if (description.includes("san bernardino") || description.includes("inland empire") || description.includes("fontana") ||
                 description.includes("rancho cucamonga") || description.includes("ontario") || description.includes("chino") ||
                 description.includes("upland") || description.includes("rialto") || description.includes("colton") ||
                 description.includes("redlands") || description.includes("victorville") || description.includes("hesperia")) {
        suggestedVenue = "San Bernardino County Superior Court";
      } else if (description.includes("fresno") || description.includes("central valley") || description.includes("clovis") ||
                 description.includes("madera") || description.includes("selma") || description.includes("fowler")) {
        suggestedVenue = "Fresno County Superior Court";
      } else if (description.includes("santa clara") || description.includes("san jose") || description.includes("silicon valley") ||
                 description.includes("sunnyvale") || description.includes("mountain view") || description.includes("palo alto") ||
                 description.includes("cupertino") || description.includes("santa clara") || description.includes("milpitas") ||
                 description.includes("fremont") || description.includes("union city") || description.includes("newark")) {
        suggestedVenue = "Santa Clara County Superior Court";
      } else if (description.includes("alameda") || description.includes("oakland") || description.includes("berkeley") ||
                 description.includes("hayward") || description.includes("fremont") || description.includes("san leandro") ||
                 description.includes("union city") || description.includes("pleasanton") || description.includes("livermore") ||
                 description.includes("dublin") || description.includes("emeryville") || description.includes("albany")) {
        suggestedVenue = "Alameda County Superior Court";
      } else if (description.includes("contra costa") || description.includes("concord") || description.includes("richmond") ||
                 description.includes("antioch") || description.includes("pittsburg") || description.includes("walnut creek") ||
                 description.includes("martinez") || description.includes("brentwood") || description.includes("oakley")) {
        suggestedVenue = "Contra Costa County Superior Court";
      } else if (description.includes("ventura") || description.includes("oxnard") || description.includes("thousand oaks") ||
                 description.includes("simi valley") || description.includes("camarillo") || description.includes("moorpark") ||
                 description.includes("fillmore") || description.includes("ojai")) {
        suggestedVenue = "Ventura County Superior Court";
      } else if (description.includes("santa barbara") || description.includes("goleta") || description.includes("carpinteria") ||
                 description.includes("santa maria") || description.includes("lompoc") || description.includes("buellton")) {
        suggestedVenue = "Santa Barbara County Superior Court";
      } else if (description.includes("kern") || description.includes("bakersfield") || description.includes("delano") ||
                 description.includes("ridgecrest") || description.includes("tehachapi") || description.includes("arvin")) {
        suggestedVenue = "Kern County Superior Court";
      } else if (description.includes("san mateo") || description.includes("daly city") || description.includes("san bruno") ||
                 description.includes("south san francisco") || description.includes("redwood city") || description.includes("burlingame") ||
                 description.includes("san carlos") || description.includes("foster city") || description.includes("belmont")) {
        suggestedVenue = "San Mateo County Superior Court";
      } else if (description.includes("monterey") || description.includes("salinas") || description.includes("seaside") ||
                 description.includes("marina") || description.includes("carmel") || description.includes("pacific grove")) {
        suggestedVenue = "Monterey County Superior Court";
      } else if (description.includes("sonoma") || description.includes("santa rosa") || description.includes("petaluma") ||
                 description.includes("rohnert park") || description.includes("sebastopol") || description.includes("healdsburg")) {
        suggestedVenue = "Sonoma County Superior Court";
      } else if (description.includes("placer") || description.includes("roseville") || description.includes("rocklin") ||
                 description.includes("lincoln") || description.includes("auburn") || description.includes("colfax")) {
        suggestedVenue = "Placer County Superior Court";
      } else if (description.includes("san joaquin") || description.includes("stockton") || description.includes("lodi") ||
                 description.includes("manteca") || description.includes("tracy") || description.includes("ripon")) {
        suggestedVenue = "San Joaquin County Superior Court";
      } else if (description.includes("tulare") || description.includes("visalia") || description.includes("porterville") ||
                 description.includes("tulare") || description.includes("dinuba") || description.includes("exeter")) {
        suggestedVenue = "Tulare County Superior Court";
      } else if (description.includes("santa cruz") || description.includes("watsonville") || description.includes("capitola") ||
                 description.includes("scotts valley") || description.includes("santa cruz boardwalk")) {
        suggestedVenue = "Santa Cruz County Superior Court";
      } else if (description.includes("merced") || description.includes("los banos") || description.includes("atwater") ||
                 description.includes("livingston") || description.includes("gustine")) {
        suggestedVenue = "Merced County Superior Court";
      } else if (description.includes("stanislaus") || description.includes("modesto") || description.includes("turlock") ||
                 description.includes("ceres") || description.includes("oakdale") || description.includes("newman")) {
        suggestedVenue = "Stanislaus County Superior Court";
      } else if (description.includes("solano") || description.includes("vallejo") || description.includes("fairfield") ||
                 description.includes("vacaville") || description.includes("benicia") || description.includes("suisun city")) {
        suggestedVenue = "Solano County Superior Court";
      } else if (description.includes("napa") || description.includes("wine country") || description.includes("calistoga") ||
                 description.includes("st helena") || description.includes("yountville") || description.includes("american canyon")) {
        suggestedVenue = "Napa County Superior Court";
      } else if (description.includes("marin") || description.includes("san rafael") || description.includes("novato") ||
                 description.includes("mill valley") || description.includes("tiburon") || description.includes("sausalito") ||
                 description.includes("corte madera") || description.includes("larkspur")) {
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
              placeholder="Describe the accident location (e.g., 'Hit on the 405 freeway in Compton' or 'Rear-ended on PCH in Long Beach' or 'Accident at LAX in Inglewood')"
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
