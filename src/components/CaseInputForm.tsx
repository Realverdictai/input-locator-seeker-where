
import { useState } from "react";
import { CaseData } from "@/types/verdict";
import { UserType } from "@/types/auth";
import FormWizard from "./FormWizard";
import PartiesStep from "./wizard-steps/PartiesStep";
import CaseTypeStep from "./wizard-steps/CaseTypeStep";
import DateOfLossStep from "./wizard-steps/DateOfLossStep";
import InjuryTypeStep from "./wizard-steps/InjuryTypeStep";
import VenueStep from "./wizard-steps/VenueStep";
import AccidentTypeStep from "./wizard-steps/AccidentTypeStep";
import VehicleInfoStep from "./wizard-steps/VehicleInfoStep";
import LiabilityImpactStep from "./wizard-steps/LiabilityImpactStep";
import MedicalTreatmentStep from "./wizard-steps/MedicalTreatmentStep";
import SpecialsEarningsStep from "./wizard-steps/SpecialsEarningsStep";
import LegalInsuranceStep from "./wizard-steps/LegalInsuranceStep";
import FinalReviewStep from "./wizard-steps/FinalReviewStep";
import ProductLiabilityStep from "./wizard-steps/ProductLiabilityStep";
import MedicalMalpracticeStep from "./wizard-steps/MedicalMalpracticeStep";
import PremisesLiabilityStep from "./wizard-steps/PremisesLiabilityStep";
import DocumentUploadStep from "./wizard-steps/DocumentUploadStep";
import SettlementStrategyStep from "./wizard-steps/SettlementStrategyStep";

interface CaseInputFormProps {
  onSubmit: (data: CaseData) => void;
  isLoading: boolean;
  userType: UserType;
}

const CaseInputForm = ({ onSubmit, isLoading, userType }: CaseInputFormProps) => {
  console.log("CaseInputForm rendering");
  
  const [formData, setFormData] = useState<Partial<CaseData>>({
    numberOfPlaintiffs: 1,
    numberOfDefendants: 1,
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
    diagnosticTests: [],
    treatmentGap: false,
    damageMedia: [],
    damageScore: 0,
    narrative: undefined,
    plaintiffBottomLine: undefined,
    defenseAuthority: undefined,
    defenseRangeLow: undefined,
    defenseRangeHigh: undefined,
    plaintiffVehicle: '',
    defendantVehicle: '',
    plaintiffVehicleSize: '',
    defendantVehicleSize: '',
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
      console.log("Form is not valid - missing required fields");
      // You could show a toast or alert here
    }
  };

  const isFormValid = () => {
    // Allow evaluation if narrative text is provided or required fields are filled
    const hasNarrative = !!(formData.narrative && formData.narrative.trim());
    const basicValid = !!(
      formData.caseType && formData.caseType.length > 0 &&
      formData.injuryTypes &&
      formData.injuryTypes.length > 0
    );
    const isValid = hasNarrative || basicValid;
    console.log("Form validation:", {
      caseType: formData.caseType,
      injuryTypes: formData.injuryTypes,
      hasNarrative,
      isValid
    });
    return isValid;
  };

  const isMotorVehicle = formData.caseType?.includes('motor-vehicle-accident');
  const isProduct = formData.caseType?.includes('product-liability');
  const isMedical = formData.caseType?.includes('medical-malpractice');
  const isPremises = formData.caseType?.includes('premises-liability');

  const steps = [
    {
      title: "Upload Documents (Optional)",
      description: "Upload letters or demands to auto-fill case info",
      component: (
        <DocumentUploadStep
          formData={formData}
          setFormData={setFormData}
          onQuickEvaluate={handleComplete}
        />
      )
    },
    {
      title: "Parties",
      description: "Enter the number of plaintiffs and defendants",
      component: <PartiesStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Settlement Position",
      description: "Specify bottom line or authority information",
      component: (
        <SettlementStrategyStep
          formData={formData}
          setFormData={setFormData}
          userType={userType}
        />
      )
    },
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
      title: "Venue (Optional)",
      description: "Choose the county where the case will be filed",
      component: <VenueStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Accident Type (Optional)",
      description: "Specify the type of accident that occurred",
      component: <AccidentTypeStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Vehicle Info",
      description: "Provide make, model and size for each vehicle",
      component: <VehicleInfoStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Product Details",
      description: "Information about the defective product",
      component: <ProductLiabilityStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Medical Malpractice Details",
      description: "Provider information and alleged negligence",
      component: <MedicalMalpracticeStep formData={formData} setFormData={setFormData} />
    },
    {
      title: "Premises Details",
      description: "Location and hazard description",
      component: <PremisesLiabilityStep formData={formData} setFormData={setFormData} />
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

  const filteredSteps = steps.filter(step => {
    if (step.title === 'Vehicle Info') return isMotorVehicle;
    if (step.title === 'Product Details') return isProduct;
    if (step.title === 'Medical Malpractice Details') return isMedical;
    if (step.title === 'Premises Details') return isPremises;
    if (step.title === 'Accident Type (Optional)') return isMotorVehicle || isPremises;
    return true;
  });

  return (
    <FormWizard
      steps={filteredSteps}
      onComplete={handleComplete}
      isLoading={isLoading}
      canProceed={isFormValid()}
    />
  );
};

export default CaseInputForm;
