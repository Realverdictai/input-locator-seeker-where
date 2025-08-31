import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Sparkles, UserCircle, Glasses } from "lucide-react";
import { UserType } from "@/types/auth";
import { CaseData } from "@/types/verdict";
import { supabase } from "@/integrations/supabase/client";

interface AIMediatorProps {
  stepTitle: string;
  stepNumber: number;
  totalSteps: number;
  userType: UserType;
  formData: Partial<CaseData>;
}

const AIMediator = ({ stepTitle, stepNumber, totalSteps, userType, formData }: AIMediatorProps) => {
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousFormDataRef = useRef<string>("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const isFormDataEmpty = () => {
    if (!formData || Object.keys(formData).length === 0) return true;
    
    // Check if all values are empty, null, undefined, or empty arrays
    return Object.values(formData).every(value => {
      if (value === null || value === undefined || value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && Object.keys(value).length === 0) return true;
      return false;
    });
  };

  const getMediatorAdvice = async () => {
    if (isLoading) return;
    
    // If no user input yet, show waiting message
    if (isFormDataEmpty()) {
      setAdvice(getWaitingMessage());
      return;
    }
    
    setIsLoading(true);
    setIsAnimating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-mediator-advice', {
        body: {
          stepTitle,
          stepNumber,
          totalSteps,
          userType,
          formData: JSON.stringify(formData)
        }
      });

      if (error) throw error;
      
      setAdvice(data.advice);
    } catch (error) {
      console.error('Error getting mediator advice:', error);
      setAdvice(getDefaultAdvice());
    } finally {
      setIsLoading(false);
      setIsAnimating(false);
    }
  };

  const getWaitingMessage = () => {
    const waitingMessages = {
      plaintiff_lawyer: "I'm ready to provide guidance once you begin entering information for this step. Please start by filling out the fields above.",
      defense_lawyer: "Waiting for your input on this step. I'll analyze and provide strategic advice as you complete the information above.",
      insurance_company: "Please begin entering the required information for this step. I'll provide risk assessment guidance as you proceed."
    };
    
    return waitingMessages[userType] || "Please start entering information for this step. I'll provide analysis as you proceed.";
  };

  const getDefaultAdvice = () => {
    const perspectives = {
      plaintiff_lawyer: "As an experienced plaintiff's attorney, I recommend focusing on building the strongest case possible at this step.",
      defense_lawyer: "From a defense perspective, this is a critical stage to evaluate potential exposure and settlement opportunities.",
      insurance_company: "Consider how this information affects your risk assessment and potential settlement authority."
    };
    
    return perspectives[userType] || "This step is important for building a comprehensive case evaluation.";
  };

  useEffect(() => {
    // When step changes, always start with waiting message
    setAdvice(getWaitingMessage());
    // Reset previous form data to ensure fresh analysis
    previousFormDataRef.current = "";
  }, [stepTitle, stepNumber]);

  // Watch for form data changes and provide real-time commentary
  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    const previousFormDataString = previousFormDataRef.current;
    
    // Skip if it's the initial load or no form data
    if (!previousFormDataString || currentFormDataString === previousFormDataString) {
      previousFormDataRef.current = currentFormDataString;
      return;
    }

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the advice update to avoid too many API calls
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('Form data changed, getting new advice:', formData);
      getMediatorAdvice();
    }, 1500); // Wait 1.5 seconds after user stops typing

    previousFormDataRef.current = currentFormDataString;

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [formData]);

  if (!isVisible) return null;

  return (
    <Card className="mb-6 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Animated Attorney Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white shadow-lg transition-all duration-300 ${isAnimating ? 'animate-pulse scale-110' : ''}`}>
              <div className="relative">
                <UserCircle className="w-10 h-10" />
                <Glasses className="w-6 h-6 absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-amber-300" />
              </div>
            </div>
            {isAnimating && (
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            )}
          </div>

          {/* Mediator Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-amber-900 text-lg">
                Judge Iskander - AI Settlement Mediator
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-amber-700 hover:text-amber-900"
              >
                ×
              </Button>
            </div>
            
            <div className="bg-white/70 rounded-lg p-4 border border-amber-200">
              {isLoading ? (
                <div className="flex items-center gap-2 text-amber-700">
                  <MessageCircle className="w-5 h-5 animate-pulse" />
                  <span className="italic">Judge Iskander is reviewing this step...</span>
                </div>
              ) : (
                <p className="text-amber-900 leading-relaxed">
                  <span className="font-medium">💼 "{advice}"</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <UserCircle className="w-4 h-4" />
                <span>Retired Attorney & Settlement Specialist</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={getMediatorAdvice}
                disabled={isLoading}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Get New Advice
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIMediator;