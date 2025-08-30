
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import AIMediator from "./AIMediator";
import { UserType } from "@/types/auth";
import { CaseData } from "@/types/verdict";

interface FormWizardProps {
  steps: {
    title: string;
    description: string;
    component: React.ReactNode;
  }[];
  onComplete: () => void;
  isLoading?: boolean;
  canProceed?: boolean;
  userType?: UserType;
  formData?: Partial<CaseData>;
}

const FormWizard = ({ steps, onComplete, isLoading = false, canProceed = true, userType, formData }: FormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Step {currentStep + 1} of {steps.length}
          </h3>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {userType && formData && (
            <AIMediator
              stepTitle={steps[currentStep].title}
              stepNumber={currentStep + 1}
              totalSteps={steps.length}
              userType={userType}
              formData={formData}
            />
          )}
          {steps[currentStep].component}
          
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="flex gap-2">
              {!isLastStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLastStep && (isLoading || !canProceed)}
                className="flex items-center gap-2"
              >
                {isLastStep ? (
                  isLoading ? "Evaluating..." : "Evaluate Case"
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormWizard;
