import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
      let suggestedSurgery = "";

      // AI logic to match surgery descriptions to standard types
      if (description.includes("arthroscop") || description.includes("scope")) {
        suggestedSurgery = "Arthroscopic Surgery";
      } else if (description.includes("fusion") && (description.includes("spine") || description.includes("back"))) {
        suggestedSurgery = "Spinal Fusion";
      } else if (description.includes("fusion") && description.includes("cervical")) {
        suggestedSurgery = "Cervical Fusion";
      } else if (description.includes("fusion") && description.includes("lumbar")) {
        suggestedSurgery = "Lumbar Fusion";
      } else if (description.includes("laminectomy")) {
        suggestedSurgery = "Laminectomy";
      } else if (description.includes("discectomy") || description.includes("disc")) {
        suggestedSurgery = "Discectomy";
      } else if (description.includes("rotator cuff")) {
        suggestedSurgery = "Rotator Cuff Repair";
      } else if (description.includes("shoulder")) {
        suggestedSurgery = "Shoulder Surgery";
      } else if (description.includes("knee") && !description.includes("replacement")) {
        suggestedSurgery = "Knee Surgery";
      } else if (description.includes("acl")) {
        suggestedSurgery = "ACL Reconstruction";
      } else if (description.includes("meniscus")) {
        suggestedSurgery = "Meniscus Repair";
      } else if (description.includes("hip replacement")) {
        suggestedSurgery = "Hip Replacement";
      } else if (description.includes("fracture") || description.includes("break") || description.includes("broken")) {
        suggestedSurgery = "Fracture Repair";
      } else if (description.includes("orif") || description.includes("plate") || description.includes("screw")) {
        suggestedSurgery = "ORIF (Open Reduction Internal Fixation)";
      } else if (description.includes("carpal tunnel")) {
        suggestedSurgery = "Carpal Tunnel Release";
      } else if (description.includes("hand")) {
        suggestedSurgery = "Hand Surgery";
      } else if (description.includes("wrist")) {
        suggestedSurgery = "Wrist Surgery";
      } else if (description.includes("ankle")) {
        suggestedSurgery = "Ankle Surgery";
      } else if (description.includes("foot")) {
        suggestedSurgery = "Foot Surgery";
      } else if (description.includes("back") || description.includes("spine")) {
        suggestedSurgery = "Back Surgery";
      } else if (description.includes("neck") || description.includes("cervical")) {
        suggestedSurgery = "Neck Surgery";
      } else if (description.includes("herniat")) {
        suggestedSurgery = "Herniated Disc Surgery";
      } else if (description.includes("decompress")) {
        suggestedSurgery = "Decompression Surgery";
      } else if (description.includes("replacement")) {
        suggestedSurgery = "Joint Replacement";
      } else if (description.includes("tendon")) {
        suggestedSurgery = "Tendon Repair";
      } else if (description.includes("ligament")) {
        suggestedSurgery = "Ligament Repair";
      } else if (description.includes("nerve")) {
        suggestedSurgery = "Nerve Repair";
      } else if (description.includes("plastic") || description.includes("reconstruct") || description.includes("cosmetic")) {
        suggestedSurgery = "Plastic Surgery/Reconstruction";
      } else if (description.includes("scar")) {
        suggestedSurgery = "Scar Revision";
      } else if (description.includes("multiple") || description.includes("several") || description.includes("more than one")) {
        suggestedSurgery = "Multiple Surgeries";
      }

      if (suggestedSurgery) {
        setFormData({...formData, surgeryType: suggestedSurgery});
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
      let suggestedInjection = "";

      // AI logic to match injection descriptions to standard types
      if (description.includes("epidural") && description.includes("lumbar")) {
        suggestedInjection = "Lumbar Epidural";
      } else if (description.includes("epidural") && description.includes("cervical")) {
        suggestedInjection = "Cervical Epidural";
      } else if (description.includes("epidural") && description.includes("thoracic")) {
        suggestedInjection = "Thoracic Epidural";
      } else if (description.includes("epidural")) {
        suggestedInjection = "Epidural Steroid Injection";
      } else if (description.includes("facet")) {
        suggestedInjection = "Facet Joint Injection";
      } else if (description.includes("trigger point")) {
        suggestedInjection = "Trigger Point Injection";
      } else if (description.includes("cortisone")) {
        suggestedInjection = "Cortisone Injection";
      } else if (description.includes("steroid")) {
        suggestedInjection = "Steroid Injection";
      } else if (description.includes("nerve block")) {
        suggestedInjection = "Nerve Block";
      } else if (description.includes("si joint") || description.includes("sacroiliac")) {
        suggestedInjection = "SI Joint Injection";
      } else if (description.includes("knee")) {
        suggestedInjection = "Knee Injection";
      } else if (description.includes("shoulder")) {
        suggestedInjection = "Shoulder Injection";
      } else if (description.includes("hip")) {
        suggestedInjection = "Hip Injection";
      } else if (description.includes("bursa")) {
        suggestedInjection = "Bursa Injection";
      } else if (description.includes("radiofrequency") || description.includes("ablation")) {
        suggestedInjection = "Radiofrequency Ablation";
      } else if (description.includes("medial branch")) {
        suggestedInjection = "Medial Branch Block";
      } else if (description.includes("caudal")) {
        suggestedInjection = "Caudal Epidural";
      } else if (description.includes("transforaminal")) {
        suggestedInjection = "Transforaminal Epidural";
      } else if (description.includes("prp") || description.includes("platelet")) {
        suggestedInjection = "Platelet Rich Plasma (PRP)";
      } else if (description.includes("hyaluronic") || description.includes("gel")) {
        suggestedInjection = "Hyaluronic Acid Injection";
      } else if (description.includes("botox")) {
        suggestedInjection = "Botox Injection";
      } else if (description.includes("multiple") || description.includes("several") || description.includes("different")) {
        suggestedInjection = "Multiple Injection Types";
      }

      if (suggestedInjection) {
        setFormData({...formData, injectionType: suggestedInjection});
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
          <Label htmlFor="surgeryType">Surgery Type</Label>
          
          {/* AI Surgery Interpreter */}
          <div className="space-y-2 mb-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe the surgery (e.g., 'Arthroscopic repair of torn rotator cuff' or 'L4-L5 discectomy with fusion')"
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
                {isAnalyzingSurgery ? "Analyzing..." : "AI: Match Surgery Type"}
              </Button>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-xs">
                <strong>AI Tip:</strong> Describe the surgical procedure and the AI will match it to the standard surgery categories used in case valuation.
              </p>
            </div>
          </div>

          <Select 
            value={formData.surgeryType || ''} 
            onValueChange={(value) => setFormData({...formData, surgeryType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select surgery type" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {surgeryTypes.map(surgery => (
                <SelectItem key={surgery} value={surgery}>{surgery}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label htmlFor="injectionType">Injection Type</Label>
          
          {/* AI Injection Interpreter */}
          <div className="space-y-2 mb-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Describe the injection treatment (e.g., 'Epidural steroid injection in lower back' or 'Cortisone shot in shoulder')"
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
                {isAnalyzingInjection ? "Analyzing..." : "AI: Match Injection Type"}
              </Button>
            </div>
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-700 text-xs">
                <strong>AI Tip:</strong> Describe the injection procedure and location, and the AI will categorize it properly for case evaluation.
              </p>
            </div>
          </div>

          <Select 
            value={formData.injectionType || ''} 
            onValueChange={(value) => setFormData({...formData, injectionType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select injection type" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {injectionTypes.map(injection => (
                <SelectItem key={injection} value={injection}>{injection}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <div className="space-y-2">
            <Label htmlFor="futureSurgeryDetails">Future Surgery Details</Label>
            <Textarea
              id="futureSurgeryDetails"
              value={formData.futureSurgeryDetails || ''}
              onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
              placeholder="Describe recommended future surgery"
            />
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