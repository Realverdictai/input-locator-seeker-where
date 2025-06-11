
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CaseInputForm from "@/components/CaseInputForm";
import VerdictResults from "@/components/VerdictResults";
import { CaseData, VerdictEstimate } from "@/types/verdict";
import { evaluateCase } from "@/lib/verdictCalculator";

const Index = () => {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [verdictEstimate, setVerdictEstimate] = useState<VerdictEstimate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleCaseSubmit = async (data: CaseData) => {
    setIsEvaluating(true);
    setCaseData(data);
    
    // Simulate evaluation processing time
    setTimeout(() => {
      const estimate = evaluateCase(data);
      setVerdictEstimate(estimate);
      setIsEvaluating(false);
    }, 1500);
  };

  const handleReset = () => {
    setCaseData(null);
    setVerdictEstimate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verdict AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced litigation evaluation assistant for personal injury cases in California. 
            Get data-driven verdict and settlement estimates based on case specifics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Case Information
              </CardTitle>
              <CardDescription>
                Enter the details of your personal injury case for evaluation
              </CardDescription>
            </CardHeader>
            <CardContent>
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

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Evaluation Results
              </CardTitle>
              <CardDescription>
                AI-powered verdict and settlement analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!verdictEstimate && !isEvaluating && (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Complete the case information to receive your evaluation
                </div>
              )}
              
              {isEvaluating && (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyzing case data and generating estimates...</p>
                </div>
              )}

              {verdictEstimate && <VerdictResults estimate={verdictEstimate} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
