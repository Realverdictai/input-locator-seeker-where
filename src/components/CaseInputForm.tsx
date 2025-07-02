
import { useState } from "react";
import { CaseData } from "@/types/verdict";
import FormWizard from "./FormWizard";
import BasicInfoStep from "./wizard-steps/BasicInfoStep";
import MedicalInfoStep from "./wizard-steps/MedicalInfoStep";
import PlaintiffInfoStep from "./wizard-steps/PlaintiffInfoStep";
import LegalFactorsStep from "./wizard-steps/LegalFactorsStep";
import InsuranceInfoStep from "./wizard-steps/InsuranceInfoStep";
import AdditionalInfoStep from "./wizard-steps/AdditionalInfoStep";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
}

const CaseInputForm = ({ onSubmit, isLoading }: CaseInputFormProps) => {
  console.log("CaseInputForm rendering");
  
  const [formData, setFormData] = useState<Partial<CaseData>>({
    liabilityPercentage: 100,
    plaintiffAge: 35,
    prop213Applicable: false,
    priorWorkersComp: false,
    priorAccident: false,
    subsequentAccident: false,
    multipleDefendants: false,
    defendantPolicies: [{ defendantName: "Primary Defendant", policyLimit: 0 }],
    impactSeverity: 5,
    futureSurgeryRecommended: false,
    daysBetweenAccidentAndTreatment: 0,
    surgeryTypes: [],
    injectionTypes: [],
  });

  const handleComplete = () => {
    console.log("Form completed with data:", formData);
    
    if (isFormValid()) {
      onSubmit(formData as CaseData);
    } else {
      console.log("Form is not valid");
    }
  };

  const isFormValid = () => {
    // Only require injury type - make other fields optional for more flexible evaluation
    const isValid = !!(formData.injuryType);
    console.log("Form validation:", { 
      injuryType: formData.injuryType, 
      venue: formData.venue, 
      dateOfLoss: formData.dateOfLoss,
      isValid 
    });
    return isValid;
  };

  const steps = [
    {
      title: "Basic Information",
      description: "Enter basic case details including injury type, venue, and accident information",
      component: <BasicInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Medical Information",
      description: "Provide medical details including specials, treatments, and procedures",
      component: <MedicalInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Plaintiff Information", 
      description: "Enter plaintiff demographics and economic information",
      component: <PlaintiffInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Legal Factors",
      description: "Specify legal considerations and case-specific factors",
      component: <LegalFactorsStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Insurance Information",
      description: "Define insurance coverage and policy details",
      component: <InsuranceInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Additional Information",
      description: "Add any additional factors or notes about the case",
      component: <AdditionalInfoStep formData={formData} setFormData={setFormData} />
    }
  ];

  return (
    <FormWizard 
      steps={steps}
      onComplete={handleComplete}
      isLoading={isLoading}
      canProceed={isFormValid()}
    />
  );
};

export default CaseInputForm;
