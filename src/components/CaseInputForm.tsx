
import { useState } from "react";
import { CaseData } from "@/types/verdict";
import FormWizard from "./FormWizard";
import CaseTypeStep from "./wizard-steps/CaseTypeStep";
import DateOfLossStep from "./wizard-steps/DateOfLossStep";
import InjuryTypeStep from "./wizard-steps/InjuryTypeStep";
import VenueStep from "./wizard-steps/VenueStep";
import AccidentTypeStep from "./wizard-steps/AccidentTypeStep";
import LiabilityImpactStep from "./wizard-steps/LiabilityImpactStep";
import MedicalTreatmentStep from "./wizard-steps/MedicalTreatmentStep";
import SpecialsEarningsStep from "./wizard-steps/SpecialsEarningsStep";
import LegalInsuranceStep from "./wizard-steps/LegalInsuranceStep";
import FinalReviewStep from "./wizard-steps/FinalReviewStep";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
}

const CaseInputForm = ({ onSubmit, isLoading }: CaseInputFormProps) => {
  console.log("CaseInputForm rendering");
  
  const [formData, setFormData] = useState<Partial<CaseData>>({
    liabilityPercentage: 0,
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
    injuryTypes: [],
    treatmentGap: false,
    numberOfDefendants: 1,
  });

  const handleComplete = () => {
    console.log("Form completed with data:", formData);
    
    if (isFormValid()) {
      // Convert injuryTypes array to single injuryType for backward compatibility
      const submitData = {
        ...formData,
        injuryType: formData.injuryTypes?.[0] || 'soft-tissue'
      } as CaseData;
      onSubmit(submitData);
    } else {
      console.log("Form is not valid");
    }
  };

  const isFormValid = () => {
    // Require case type and at least one injury type
    const isValid = !!(formData.caseType && formData.injuryTypes && formData.injuryTypes.length > 0);
    console.log("Form validation:", { 
      caseType: formData.caseType,
      injuryTypes: formData.injuryTypes,
      isValid 
    });
    return isValid;
  };

  const steps = [
    {
      title: "Case Type",
      description: "Select the type of case you're evaluating",
      component: <CaseTypeStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Date of Loss",
      description: "Enter when the incident occurred",
      component: <DateOfLossStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Injury Type",
      description: "Select all applicable injury types",
      component: <InjuryTypeStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Venue",
      description: "Choose the county where the case will be filed",
      component: <VenueStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Accident Type", 
      description: "Specify the type of accident that occurred",
      component: <AccidentTypeStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Liability & Impact",
      description: "Define liability and impact severity details",
      component: <LiabilityImpactStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Medical Treatment",
      description: "Enter medical treatment details and procedures",
      component: <MedicalTreatmentStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Specials & Earnings",
      description: "Input medical costs and economic damages",
      component: <SpecialsEarningsStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Legal & Insurance Info",
      description: "Provide legal factors and insurance details",
      component: <LegalInsuranceStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Final Review",
      description: "Review all information and add medical summary",
      component: <FinalReviewStep formData={formData} setFormData={setFormData} />
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
