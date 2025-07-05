import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaseData } from "@/types/verdict";
import { Brain } from "lucide-react";

interface MedicalTreatmentStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const MedicalTreatmentStep = ({ formData, setFormData }: MedicalTreatmentStepProps) => {
  const [surgeryDescription, setSurgeryDescription] = useState("");
  const [injectionDescription, setInjectionDescription] = useState("");
  const [isAnalyzingSurgery, setIsAnalyzingSurgery] = useState(false);
  const [isAnalyzingInjection, setIsAnalyzingInjection] = useState(false);

  // Helper functions for multiple selections
  const handleSurgeryTypeChange = (surgeryType: string, checked: boolean) => {
    const currentTypes = formData.surgeryTypes || [];
    if (checked) {
      setFormData({...formData, surgeryTypes: [...currentTypes, surgeryType]});
    } else {
      setFormData({...formData, surgeryTypes: currentTypes.filter(t => t !== surgeryType)});
    }
  };

  const handleInjectionTypeChange = (injectionType: string, checked: boolean) => {
    const currentTypes = formData.injectionTypes || [];
    if (checked) {
      setFormData({...formData, injectionTypes: [...currentTypes, injectionType]});
    } else {
      setFormData({...formData, injectionTypes: currentTypes.filter(t => t !== injectionType)});
    }
  };

  // Comprehensive surgery types for personal injury cases
  const surgeryTypes = [
    "None",
    "Arthroscopic Surgery",
    "Spinal Fusion",
    "Laminectomy",
    "Discectomy", 
    "Cervical Fusion",
    "Lumbar Fusion",
    "Rotator Cuff Repair",
    "Shoulder Surgery",
    "Knee Surgery",
    "ACL Reconstruction",
    "Meniscus Repair", 
    "Hip Replacement",
    "Fracture Repair",
    "ORIF (Open Reduction Internal Fixation)",
    "Carpal Tunnel Release",
    "Hand Surgery",
    "Wrist Surgery",
    "Ankle Surgery",
    "Foot Surgery",
    "Back Surgery",
    "Neck Surgery",
    "Herniated Disc Surgery",
    "Decompression Surgery",
    "Joint Replacement",
    "Tendon Repair",
    "Ligament Repair",
    "Nerve Repair",
    "Plastic Surgery/Reconstruction",
    "Scar Revision",
    "Multiple Surgeries"
  ];

  // Comprehensive injection types for personal injury cases
  const injectionTypes = [
    "None",
    "Epidural Steroid Injection",
    "Facet Joint Injection", 
    "Trigger Point Injection",
    "Cortisone Injection",
    "Steroid Injection",
    "Nerve Block",
    "Lumbar Epidural",
    "Cervical Epidural", 
    "Thoracic Epidural",
    "SI Joint Injection",
    "Knee Injection",
    "Shoulder Injection",
    "Hip Injection",
    "Bursa Injection",
    "Radiofrequency Ablation",
    "Medial Branch Block",
    "Caudal Epidural",
    "Transforaminal Epidural",
    "Platelet Rich Plasma (PRP)",
    "Hyaluronic Acid Injection",
    "Botox Injection",
    "Multiple Injection Types"
  ];

  const analyzeSurgeryWithAI = async () => {
    if (!surgeryDescription.trim()) return;
    
    setIsAnalyzingSurgery(true);
    try {
      const description = surgeryDescription.toLowerCase();
      const suggestedSurgeries: string[] = [];

      // AI logic to match surgery descriptions to standard types (can detect multiple)
      if (description.includes("arthroscop") || description.includes("scope")) {
        suggestedSurgeries.push("Arthroscopic Surgery");
      }
      if (description.includes("fusion") && (description.includes("spine") || description.includes("back"))) {
        suggestedSurgeries.push("Spinal Fusion");
      }
      if (description.includes("fusion") && description.includes("cervical")) {
        suggestedSurgeries.push("Cervical Fusion");
      }
      if (description.includes("fusion") && description.includes("lumbar")) {
        suggestedSurgeries.push("Lumbar Fusion");
      }
      if (description.includes("laminectomy")) {
        suggestedSurgeries.push("Laminectomy");
      }
      if (description.includes("discectomy") || description.includes("disc")) {
        suggestedSurgeries.push("Discectomy");
      }
      if (description.includes("rotator cuff")) {
        suggestedSurgeries.push("Rotator Cuff Repair");
      }
      if (description.includes("shoulder") && !suggestedSurgeries.includes("Rotator Cuff Repair")) {
        suggestedSurgeries.push("Shoulder Surgery");
      }
      if (description.includes("knee") && !description.includes("replacement")) {
        suggestedSurgeries.push("Knee Surgery");
      }
      if (description.includes("acl")) {
        suggestedSurgeries.push("ACL Reconstruction");
      }
      if (description.includes("meniscus")) {
        suggestedSurgeries.push("Meniscus Repair");
      }
      if (description.includes("hip replacement")) {
        suggestedSurgeries.push("Hip Replacement");
      }
      if (description.includes("fracture") || description.includes("break") || description.includes("broken")) {
        suggestedSurgeries.push("Fracture Repair");
      }
      if (description.includes("orif") || description.includes("plate") || description.includes("screw")) {
        suggestedSurgeries.push("ORIF (Open Reduction Internal Fixation)");
      }
      if (description.includes("carpal tunnel")) {
        suggestedSurgeries.push("Carpal Tunnel Release");
      }
      if (description.includes("hand") && !suggestedSurgeries.includes("Carpal Tunnel Release")) {
        suggestedSurgeries.push("Hand Surgery");
      }
      if (description.includes("wrist")) {
        suggestedSurgeries.push("Wrist Surgery");
      }
      if (description.includes("ankle")) {
        suggestedSurgeries.push("Ankle Surgery");
      }
      if (description.includes("foot")) {
        suggestedSurgeries.push("Foot Surgery");
      }
      if (description.includes("back") || description.includes("spine")) {
        if (!suggestedSurgeries.some(s => s.includes("Fusion") || s.includes("Laminectomy") || s.includes("Discectomy"))) {
          suggestedSurgeries.push("Back Surgery");
        }
      }
      if (description.includes("neck") || description.includes("cervical")) {
        if (!suggestedSurgeries.includes("Cervical Fusion")) {
          suggestedSurgeries.push("Neck Surgery");
        }
      }
      if (description.includes("herniat")) {
        suggestedSurgeries.push("Herniated Disc Surgery");
      }
      if (description.includes("decompress")) {
        suggestedSurgeries.push("Decompression Surgery");
      }
      if (description.includes("replacement") && !suggestedSurgeries.includes("Hip Replacement")) {
        suggestedSurgeries.push("Joint Replacement");
      }
      if (description.includes("tendon")) {
        suggestedSurgeries.push("Tendon Repair");
      }
      if (description.includes("ligament")) {
        suggestedSurgeries.push("Ligament Repair");
      }
      if (description.includes("nerve")) {
        suggestedSurgeries.push("Nerve Repair");
      }
      if (description.includes("plastic") || description.includes("reconstruct") || description.includes("cosmetic")) {
        suggestedSurgeries.push("Plastic Surgery/Reconstruction");
      }
      if (description.includes("scar")) {
        suggestedSurgeries.push("Scar Revision");
      }

      if (suggestedSurgeries.length > 1) {
        suggestedSurgeries.push("Multiple Surgeries");
      }

      if (suggestedSurgeries.length > 0) {
        const currentTypes = formData.surgeryTypes || [];
        const newTypes = [...new Set([...currentTypes, ...suggestedSurgeries])];
        setFormData({...formData, surgeryTypes: newTypes});
      }
    } catch (error) {
      console.error("Error analyzing surgery:", error);
    } finally {
      setIsAnalyzingSurgery(false);
    }
  };

  const analyzeInjectionWithAI = async () => {
    if (!injectionDescription.trim()) return;
    
    setIsAnalyzingInjection(true);
    try {
      const description = injectionDescription.toLowerCase();
      const suggestedInjections: string[] = [];

      // AI logic to match injection descriptions to standard types (can detect multiple)
      if (description.includes("epidural") && description.includes("lumbar")) {
        suggestedInjections.push("Lumbar Epidural");
      }
      if (description.includes("epidural") && description.includes("cervical")) {
        suggestedInjections.push("Cervical Epidural");
      }
      if (description.includes("epidural") && description.includes("thoracic")) {
        suggestedInjections.push("Thoracic Epidural");
      }
      if (description.includes("epidural") && !suggestedInjections.some(i => i.includes("Epidural"))) {
        suggestedInjections.push("Epidural Steroid Injection");
      }
      if (description.includes("facet")) {
        suggestedInjections.push("Facet Joint Injection");
      }
      if (description.includes("trigger point")) {
        suggestedInjections.push("Trigger Point Injection");
      }
      if (description.includes("cortisone")) {
        suggestedInjections.push("Cortisone Injection");
      }
      if (description.includes("steroid") && !suggestedInjections.some(i => i.includes("Steroid") || i.includes("Cortisone"))) {
        suggestedInjections.push("Steroid Injection");
      }
      if (description.includes("nerve block")) {
        suggestedInjections.push("Nerve Block");
      }
      if (description.includes("si joint") || description.includes("sacroiliac")) {
        suggestedInjections.push("SI Joint Injection");
      }
      if (description.includes("knee")) {
        suggestedInjections.push("Knee Injection");
      }
      if (description.includes("shoulder")) {
        suggestedInjections.push("Shoulder Injection");
      }
      if (description.includes("hip")) {
        suggestedInjections.push("Hip Injection");
      }
      if (description.includes("bursa")) {
        suggestedInjections.push("Bursa Injection");
      }
      if (description.includes("radiofrequency") || description.includes("ablation")) {
        suggestedInjections.push("Radiofrequency Ablation");
      }
      if (description.includes("medial branch")) {
        suggestedInjections.push("Medial Branch Block");
      }
      if (description.includes("caudal")) {
        suggestedInjections.push("Caudal Epidural");
      }
      if (description.includes("transforaminal")) {
        suggestedInjections.push("Transforaminal Epidural");
      }
      if (description.includes("prp") || description.includes("platelet")) {
        suggestedInjections.push("Platelet Rich Plasma (PRP)");
      }
      if (description.includes("hyaluronic") || description.includes("gel")) {
        suggestedInjections.push("Hyaluronic Acid Injection");
      }
      if (description.includes("botox")) {
        suggestedInjections.push("Botox Injection");
      }

      if (suggestedInjections.length > 1) {
        suggestedInjections.push("Multiple Injection Types");
      }

      if (suggestedInjections.length > 0) {
        const currentTypes = formData.injectionTypes || [];
        const newTypes = [...new Set([...currentTypes, ...suggestedInjections])];
        setFormData({...formData, injectionTypes: newTypes});
      }
    } catch (error) {
      console.error("Error analyzing injection:", error);
    } finally {
      setIsAnalyzingInjection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TBI Severity - only show if TBI is selected in injury types */}
      {formData.injuryTypes?.includes('traumatic-brain-injury') && (
        <div className="space-y-2">
          <Label htmlFor="tbiSeverity">TBI Severity (Defense Perspective)</Label>
          <Select 
            value={formData.tbiSeverity || ''} 
            onValueChange={(value) => setFormData({...formData, tbiSeverity: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select TBI severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surgeries">Number of Surgeries</Label>
          <Input
            id="surgeries"
            type="number"
            min="0"
            value={formData.surgeries || 0}
            onChange={(e) => setFormData({...formData, surgeries: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Surgery Types (Select Multiple)</Label>
          
          {/* AI Surgery Interpreter */}
          <div className="space-y-2 mb-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe all surgeries (e.g., 'Arthroscopic rotator cuff repair and L4-L5 discectomy with fusion')"
                value={surgeryDescription}
                onChange={(e) => setSurgeryDescription(e.target.value)}
                className="min-h-[60px]"
              />
              <Button 
                onClick={analyzeSurgeryWithAI}
                disabled={!surgeryDescription.trim() || isAnalyzingSurgery}
                className="w-full"
                variant="outline"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzingSurgery ? "Analyzing..." : "AI: Match Surgery Types"}
              </Button>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-xs">
                <strong>AI Tip:</strong> Describe all surgical procedures and the AI will detect multiple surgery types automatically.
              </p>
            </div>
          </div>

          {/* Selected Surgery Types Display */}
          {formData.surgeryTypes && formData.surgeryTypes.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Selected Surgery Types:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.surgeryTypes.map(surgery => (
                  <span key={surgery} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    {surgery}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Surgery Type Checkboxes */}
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {surgeryTypes.map(surgery => (
              <div key={surgery} className="flex items-center space-x-2">
                <Checkbox
                  id={`surgery-${surgery}`}
                  checked={formData.surgeryTypes?.includes(surgery) || false}
                  onCheckedChange={(checked) => handleSurgeryTypeChange(surgery, !!checked)}
                />
                <Label htmlFor={`surgery-${surgery}`} className="text-sm">{surgery}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="injections">Number of Injections</Label>
          <Input
            id="injections"
            type="number"
            min="0"
            value={formData.injections || 0}
            onChange={(e) => setFormData({...formData, injections: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Injection Types (Select Multiple)</Label>
          
          {/* AI Injection Interpreter */}
          <div className="space-y-2 mb-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe all injection treatments (e.g., 'Multiple epidural steroid injections and cortisone shot in shoulder')"
                value={injectionDescription}
                onChange={(e) => setInjectionDescription(e.target.value)}
                className="min-h-[60px]"
              />
              <Button 
                onClick={analyzeInjectionWithAI}
                disabled={!injectionDescription.trim() || isAnalyzingInjection}
                className="w-full"
                variant="outline"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isAnalyzingInjection ? "Analyzing..." : "AI: Match Injection Types"}
              </Button>
            </div>
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 text-xs">
                <strong>AI Tip:</strong> Describe all injection procedures and the AI will detect multiple injection types automatically.
              </p>
            </div>
          </div>

          {/* Selected Injection Types Display */}
          {formData.injectionTypes && formData.injectionTypes.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Selected Injection Types:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.injectionTypes.map(injection => (
                  <span key={injection} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                    {injection}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Injection Type Checkboxes */}
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {injectionTypes.map(injection => (
              <div key={injection} className="flex items-center space-x-2">
                <Checkbox
                  id={`injection-${injection}`}
                  checked={formData.injectionTypes?.includes(injection) || false}
                  onCheckedChange={(checked) => handleInjectionTypeChange(injection, !!checked)}
                />
                <Label htmlFor={`injection-${injection}`} className="text-sm">{injection}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="futureSurgeryRecommended"
            checked={formData.futureSurgeryRecommended || false}
            onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
          />
          <Label htmlFor="futureSurgeryRecommended">Future Surgery Recommended</Label>
        </div>

        {formData.futureSurgeryRecommended && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="futureSurgeryDetails">Future Surgery Details</Label>
              <Textarea
                id="futureSurgeryDetails"
                value={formData.futureSurgeryDetails || ''}
                onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
                placeholder="Describe recommended future surgery"
              />
            </div>

            <div className="space-y-2">
              <Label>Date of Future Surgery</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.futureSurgeryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.futureSurgeryDate ? (
                      format(new Date(formData.futureSurgeryDate), "PPP")
                    ) : (
                      <span>Select future surgery date (if known)</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.futureSurgeryDate ? new Date(formData.futureSurgeryDate) : undefined}
                    onSelect={(date) => setFormData({...formData, futureSurgeryDate: date?.toISOString().split('T')[0]})}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="willGetFutureSurgery"
                checked={formData.willGetFutureSurgery || false}
                onCheckedChange={(checked) => setFormData({...formData, willGetFutureSurgery: !!checked})}
              />
              <Label htmlFor="willGetFutureSurgery">Plaintiff will definitely get this future surgery</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="willNotGetFutureSurgery"
                checked={formData.willNotGetFutureSurgery || false}
                onCheckedChange={(checked) => setFormData({...formData, willNotGetFutureSurgery: !!checked})}
              />
              <Label htmlFor="willNotGetFutureSurgery">Plaintiff will not get this future surgery</Label>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="priorConditions">Prior Conditions</Label>
          <Textarea
            id="priorConditions"
            value={formData.priorConditions || ''}
            onChange={(e) => setFormData({...formData, priorConditions: e.target.value})}
            placeholder="Describe any pre-existing conditions"
          />
        </div>
      </div>
    </div>
  );
};

export default MedicalTreatmentStep;