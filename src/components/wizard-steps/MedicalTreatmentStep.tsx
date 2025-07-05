
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaseData } from "@/types/verdict";

interface MedicalTreatmentStepProps {
  formData: Partial<CaseData>;
  setFormData: (data: Partial<CaseData>) => void;
}

const MedicalTreatmentStep = ({ formData, setFormData }: MedicalTreatmentStepProps) => {
  const formatNumberWithCommas = (value: number | undefined): string => {
    if (value === undefined || value === null) return '';
    return value.toLocaleString('en-US');
  };

  const parseFormattedNumber = (value: string): number | undefined => {
    if (value === '' || value === null || value === undefined) return undefined;
    const cleanedValue = value.replace(/,/g, '');
    const numValue = Number(cleanedValue);
    return isNaN(numValue) ? undefined : numValue;
  };

  const handleFormattedNumberChange = (field: keyof CaseData, value: string) => {
    const numericValue = parseFormattedNumber(value);
    setFormData({...formData, [field]: numericValue});
  };

  const surgeryTypeOptions = [
    // Spinal Surgeries (Based on actual case data)
    "Anterior Cervical Discectomy and Fusion (ACDF)", "Anterior Cervical Decompression & Artificial Disc Replacement",
    "Cervical Artificial Disc Replacement", "Two-Level Cervical Artificial Disc Replacement", 
    "Posterior Cervical Laminectomy and Fusion", "Cervical Microdiscectomy Fusion",
    "Anterior Lumbar Interbody Fusion (ALIF)", "Posterior Lumbar Decompression and Instrumented Fusion",
    "Lumbar Disc Replacement", "Anterior Lumbar Interbody Fusion + Total Disc Replacement",
    "Hemilaminectomy/Foraminotomy", "Bilateral Hemilaminectomy/Foraminotomy", "Laminotomy",
    "Microdiscectomy", "Hemilaminotomy, Bilateral Decompression & Interspinous Fusion",
    "Lumbar Fusion", "Thoraco-lumbar Posterior Fusion", "Spinal Cord Stimulator - Trial", 
    "Spinal Cord Stimulator - Permanent", "Spinal Cord Stimulator Removal",
    
    // Arthroscopic Shoulder Procedures (Highly detailed based on data)
    "Arthroscopic Shoulder Surgery - General", "Arthroscopic Rotator Cuff Repair",
    "Arthroscopic Rotator Cuff Repair with Subacromial Decompression", 
    "Arthroscopic Shoulder Decompression & Debridement", "Arthroscopic Bankart Repair with Debridement",
    "Arthroscopic Labral Repair/Subacromial Decompression/Mumford/Biceps Tenodesis",
    "Reverse Total Shoulder Arthroplasty", "AC Joint Reconstruction", "AC Joint Reconstruction - Revision",
    
    // Joint Replacements
    "Total Hip Replacement", "Total Knee Replacement", "Complex Total Knee Arthroplasty",
    "Shoulder Replacement - Total", "Shoulder Replacement - Reverse",
    
    // Knee Procedures
    "Knee Arthroscopy", "Arthroscopic Knee Meniscectomy", "Arthroscopic Partial Meniscectomy & Chondroplasty",
    "Knee Arthroscopy with Bone Marrow Stem Cell Injection",
    
    // Fracture Repairs (ORIF - Open Reduction Internal Fixation)
    "ORIF - Patella", "ORIF - Tibial Plateau", "ORIF - Calcaneus", "ORIF - Femur", 
    "ORIF - Femoral Neck Fracture", "ORIF - Distal Radius", "ORIF - Olecranon Fracture",
    "ORIF - Ankle", "ORIF - Pelvis/Acetabulum with Cannulated Screws",
    
    // Hand/Wrist Surgeries
    "Carpal Tunnel Release", "Bilateral Carpal Tunnel Releases", "Trigger Finger Release",
    "Wrist Central Denervation", "Scaphocapitate Fusion",
    
    // Hardware/Revision Procedures
    "Hardware Removal", "Hardware Removal/Dynamization", "Manipulation Under Anesthesia with Capsular Release",
    
    // Ankle/Foot Procedures
    "Ankle Reconstruction with Posterior Tibial Tendon Advancement",
    
    // Other Procedures
    "Femoral Intramedullary Nailing", "Closed Reduction & Percutaneous Fixation",
    "Amputation/Ablation of Distal Phalanx"
  ];

  const injectionTypeOptions = [
    // Spinal Injections
    "Epidural Steroid - Cervical", "Epidural Steroid - Thoracic", "Epidural Steroid - Lumbar",
    "Facet Joint - Cervical", "Facet Joint - Thoracic", "Facet Joint - Lumbar",
    "Trigger Point - Cervical", "Trigger Point - Thoracic", "Trigger Point - Lumbar",
    "Nerve Block - Cervical", "Nerve Block - Lumbar", "Selective Nerve Root Block",
    "Caudal Epidural", "Transforaminal Epidural", "Interlaminar Epidural",
    "Medial Branch Block", "Radiofrequency Ablation",
    
    // Joint Injections
    "Cortisone - Shoulder", "Cortisone - Hip", "Cortisone - Knee", "Cortisone - Ankle",
    "Cortisone - Elbow", "Cortisone - Wrist", "Cortisone - SI Joint",
    "Hyaluronic Acid - Knee", "Hyaluronic Acid - Hip", "Hyaluronic Acid - Shoulder",
    
    // Regenerative Medicine
    "PRP - Knee", "PRP - Hip", "PRP - Shoulder", "PRP - Elbow", "PRP - Ankle",
    "PRP - Plantar Fascia", "PRP - Achilles", "PRP - Rotator Cuff",
    "Stem Cell - Knee", "Stem Cell - Hip", "Stem Cell - Shoulder", "Stem Cell - Spine",
    "Bone Marrow Aspirate", "Prolotherapy",
    
    // Muscle/Soft Tissue Injections  
    "Trigger Point - Trapezius", "Trigger Point - Piriformis", "Trigger Point - Quadratus Lumborum",
    "Trigger Point - Levator Scapulae", "Trigger Point - Rhomboid", "Trigger Point - Gluteal",
    "Botox - Muscle Spasm", "Myofascial Release Injection",
    
    // Peripheral Nerve Injections
    "Occipital Nerve Block", "Suprascapular Nerve Block", "Lateral Femoral Cutaneous Nerve Block",
    "Pudendal Nerve Block", "Intercostal Nerve Block", "Stellate Ganglion Block",
    
    // Other Specialized Injections
    "Bursa - Shoulder", "Bursa - Hip", "Bursa - Knee", "Bursa - Elbow",
    "Ganglion Cyst Aspiration", "Joint Aspiration", "Tendon Sheath Injection",
    "Carpal Tunnel Injection", "Plantar Fascia Injection"
  ];

  const toggleSurgeryType = (surgeryType: string) => {
    const currentTypes = formData.surgeryTypes || [];
    const newTypes = currentTypes.includes(surgeryType)
      ? currentTypes.filter(type => type !== surgeryType)
      : [...currentTypes, surgeryType];
    setFormData({...formData, surgeryTypes: newTypes});
  };

  const toggleInjectionType = (injectionType: string) => {
    const currentTypes = formData.injectionTypes || [];
    const newTypes = currentTypes.includes(injectionType)
      ? currentTypes.filter(type => type !== injectionType)
      : [...currentTypes, injectionType];
    setFormData({...formData, injectionTypes: newTypes});
  };

  const diagnosticTestOptions = [
    // Neurological Testing (Especially important for TBI cases)
    "EMG (Electromyography)", "Nerve Conduction Study (NCS)", "EMG/NCS Combined Study",
    "EEG (Electroencephalogram)", "Neuropsychological Testing", "Cognitive Testing",
    
    // Advanced Imaging
    "MRI - Brain", "MRI - Cervical Spine", "MRI - Thoracic Spine", "MRI - Lumbar Spine",
    "MRI - Shoulder", "MRI - Hip", "MRI - Knee", "MRI - Ankle", "MRI - Wrist",
    "CT Scan - Head", "CT Scan - Spine", "CT Myelogram",
    "Discogram", "Bone Scan", "SPECT Scan",
    
    // Functional Testing
    "Functional Capacity Evaluation (FCE)", "Vocational Assessment",
    "Neuropsychological Assessment", "Memory Testing", "Visual Field Testing",
    
    // Specialized Studies
    "Sleep Study", "Balance Testing", "Vestibular Testing",
    "Swallow Study", "Pulmonary Function Test",
    
    // Diagnostic Injections/Procedures
    "Diagnostic Nerve Block", "Diagnostic Facet Block", "Discogram"
  ];

  const toggleDiagnosticTest = (test: string) => {
    const currentTests = formData.diagnosticTests || [];
    const newTests = currentTests.includes(test)
      ? currentTests.filter(t => t !== test)
      : [...currentTests, test];
    setFormData({...formData, diagnosticTests: newTests});
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surgeries">Number of Surgeries</Label>
          <Input
            id="surgeries"
            type="text"
            value={formatNumberWithCommas(formData.surgeries)}
            onChange={(e) => handleFormattedNumberChange('surgeries', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="injections">Number of Injections</Label>
          <Input
            id="injections"
            type="text"
            value={formatNumberWithCommas(formData.injections)}
            onChange={(e) => handleFormattedNumberChange('injections', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Surgery Types</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
          {surgeryTypeOptions.map(surgery => (
            <div key={surgery} className="flex items-center space-x-2">
              <Checkbox
                id={surgery}
                checked={formData.surgeryTypes?.includes(surgery) || false}
                onCheckedChange={() => toggleSurgeryType(surgery)}
              />
              <Label htmlFor={surgery} className="text-sm">{surgery}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Injection Types (by Location)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
          {injectionTypeOptions.map(injection => (
            <div key={injection} className="flex items-center space-x-2">
              <Checkbox
                id={injection}
                checked={formData.injectionTypes?.includes(injection) || false}
                onCheckedChange={() => toggleInjectionType(injection)}
              />
              <Label htmlFor={injection} className="text-sm">{injection}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Diagnostic Testing (EMG/NCS for TBI cases)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto border rounded-md p-3">
          {diagnosticTestOptions.map(test => (
            <div key={test} className="flex items-center space-x-2">
              <Checkbox
                id={test}
                checked={formData.diagnosticTests?.includes(test) || false}
                onCheckedChange={() => toggleDiagnosticTest(test)}
              />
              <Label htmlFor={test} className="text-sm">{test}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physicalTherapySessions">PT Sessions</Label>
          <Input
            id="physicalTherapySessions"
            type="text"
            value={formatNumberWithCommas(formData.physicalTherapySessions)}
            onChange={(e) => handleFormattedNumberChange('physicalTherapySessions', e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chiropracticSessions">Chiro Sessions</Label>
          <Input
            id="chiropracticSessions"
            type="text"
            value={formatNumberWithCommas(formData.chiropracticSessions)}
            onChange={(e) => handleFormattedNumberChange('chiropracticSessions', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="treatmentGap"
          checked={formData.treatmentGap || false}
          onCheckedChange={(checked) => setFormData({...formData, treatmentGap: !!checked})}
        />
        <Label htmlFor="treatmentGap">Gap in Treatment?</Label>
      </div>

      {formData.treatmentGap && (
        <div className="space-y-2">
          <Label htmlFor="treatmentGaps">Days of Treatment Gap</Label>
          <Input
            id="treatmentGaps"
            type="text"
            value={formatNumberWithCommas(formData.treatmentGaps)}
            onChange={(e) => handleFormattedNumberChange('treatmentGaps', e.target.value)}
            placeholder="Enter number of days"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="futureSurgeryRecommended"
          checked={formData.futureSurgeryRecommended || false}
          onCheckedChange={(checked) => setFormData({...formData, futureSurgeryRecommended: !!checked})}
        />
        <Label htmlFor="futureSurgeryRecommended">Future Surgery Recommended?</Label>
      </div>

      {formData.futureSurgeryRecommended && (
        <div className="space-y-2">
          <Label htmlFor="futureSurgeryDetails">Future Surgery Description</Label>
          <Textarea
            id="futureSurgeryDetails"
            value={formData.futureSurgeryDetails || ''}
            onChange={(e) => setFormData({...formData, futureSurgeryDetails: e.target.value})}
            placeholder="Describe recommended future surgery"
          />
        </div>
      )}
    </div>
  );
};

export default MedicalTreatmentStep;
