
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CaseInputForm from "@/components/CaseInputForm";
import VerdictResults from "@/components/VerdictResults";
import { CaseData, VerdictEstimate } from "@/types/verdict";
import { evaluateCase } from "@/lib/verdictCalculator";

const Index = () => {
  console.log("Index component rendering");
  
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [verdictEstimate, setVerdictEstimate] = useState<VerdictEstimate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleCaseSubmit = async (data: CaseData) => {
    console.log("Case submitted:", data);
    setIsEvaluating(true);
    setCaseData(data);
    
    // Simulate evaluation processing time
    setTimeout(() => {
      try {
        const estimate = evaluateCase(data);
        console.log("Evaluation complete:", estimate);
        setVerdictEstimate(estimate);
        setIsEvaluating(false);
      } catch (error) {
        console.error("Error evaluating case:", error);
        setIsEvaluating(false);
      }
    }, 2000);
  };

  const handleReset = () => {
    setCaseData(null);
    setVerdictEstimate(null);
  };

  console.log("Rendering Index with state:", { caseData: !!caseData, verdictEstimate: !!verdictEstimate, isEvaluating });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verdict AI - Personal Injury Evaluator
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Comprehensive litigation evaluation assistant for California personal injury cases. 
            Get data-driven verdict and settlement estimates with advanced case analysis.
          </p>
          <div className="mt-4 p-3 bg-green-100 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-green-700 font-medium">
              🎉 First 10 case evaluations are FREE!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Comprehensive Case Analysis
                </CardTitle>
                <CardDescription>
                  Enter detailed case information for accurate evaluation including medical, economic, and legal factors
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                <CaseInputForm onSubmit={handleCaseSubmit} isLoading={isEvaluating} />
                {verdictEstimate && (
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    Evaluate New Case
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Advanced Evaluation Results
                </CardTitle>
                <CardDescription>
                  AI-powered comprehensive verdict and settlement analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                {!verdictEstimate && !isEvaluating && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    Complete the comprehensive case information to receive your detailed evaluation
                  </div>
                )}
                
                {isEvaluating && (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Analyzing comprehensive case data and generating detailed estimates...</p>
                    <p className="text-sm text-gray-500 mt-2">Processing medical records, legal factors, and insurance coverage...</p>
                  </div>
                )}

                {verdictEstimate && <VerdictResults estimate={verdictEstimate} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
