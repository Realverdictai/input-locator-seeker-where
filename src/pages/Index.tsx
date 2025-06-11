
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CaseInputForm from "@/components/CaseInputForm";
import VerdictResults from "@/components/VerdictResults";
import AuthForm from "@/components/AuthForm";
import MediationDashboard from "@/components/MediationDashboard";
import { CaseData, VerdictEstimate } from "@/types/verdict";
import { evaluateCase } from "@/lib/verdictCalculator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  console.log("Index component rendering");
  
  const { user, userProfile, loading, signOut } = useAuth();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [verdictEstimate, setVerdictEstimate] = useState<VerdictEstimate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentSessionCode, setCurrentSessionCode] = useState<string | null>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const { toast } = useToast();

  const handleAuthSuccess = () => {
    // User will be automatically set by the auth hook
  };

  const handleStartEvaluation = (sessionCode?: string) => {
    setCurrentSessionCode(sessionCode || null);
    setShowEvaluation(true);
  };

  const handleBackToDashboard = () => {
    setShowEvaluation(false);
    setCaseData(null);
    setVerdictEstimate(null);
    setCurrentSessionCode(null);
  };

  const handleCaseSubmit = async (data: CaseData) => {
    console.log("Case submitted:", data);
    setIsEvaluating(true);
    setCaseData(data);
    
    // Simulate evaluation processing time
    setTimeout(async () => {
      try {
        const estimate = evaluateCase(data);
        console.log("Evaluation complete:", estimate);
        setVerdictEstimate(estimate);
        
        // Save case evaluation to database
        if (user) {
          const { error } = await supabase
            .from('case_evaluations')
            .insert([{
              user_id: user.id,
              case_data: data
            }]);

          if (error) {
            console.error('Error saving case evaluation:', error);
          }

          // If this is part of a mediation session, update the session
          if (currentSessionCode) {
            await updateMediationSession(data, estimate);
          }
        }
        
        setIsEvaluating(false);
      } catch (error) {
        console.error("Error evaluating case:", error);
        setIsEvaluating(false);
      }
    }, 2000);
  };

  const updateMediationSession = async (caseData: CaseData, estimate: VerdictEstimate) => {
    try {
      // Get the current session
      const { data: session, error: fetchError } = await supabase
        .from('mediation_sessions')
        .select('*')
        .eq('session_code', currentSessionCode)
        .single();

      if (fetchError) throw fetchError;

      // Get the latest case evaluation ID
      const { data: evaluation, error: evalError } = await supabase
        .from('case_evaluations')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (evalError) throw evalError;

      // Update session with evaluation ID
      const updateData: any = {};
      if (userProfile?.user_type === 'pi_lawyer') {
        updateData.pi_evaluation_id = evaluation.id;
      } else {
        updateData.insurance_evaluation_id = evaluation.id;
      }

      const { error: updateError } = await supabase
        .from('mediation_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) throw updateError;

      // Check if both parties have submitted and generate mediation proposal
      const updatedSession = { ...session, ...updateData };
      if (updatedSession.pi_evaluation_id && updatedSession.insurance_evaluation_id) {
        await generateMediationProposal(updatedSession.id);
      }

    } catch (error) {
      console.error('Error updating mediation session:', error);
    }
  };

  const generateMediationProposal = async (sessionId: string) => {
    // This would typically call an edge function to generate the proposal
    // For now, we'll create a simple proposal
    const proposal = {
      settlement_amount: verdictEstimate?.midVerdict || 0,
      rationale: "Based on the submitted case evaluations from both parties",
      key_differences: ["Liability assessment", "Medical damages valuation"],
      common_ground: ["Basic injury type", "Treatment timeline"],
      recommendation: "Recommend settlement discussion based on mid-range evaluation"
    };

    try {
      const { error } = await supabase
        .from('mediation_sessions')
        .update({ 
          mediation_proposal: proposal,
          status: 'proposal_ready'
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Mediation Proposal Generated!",
        description: "Both parties have submitted their evaluations. The mediator's proposal is ready.",
      });
    } catch (error) {
      console.error('Error generating mediation proposal:', error);
    }
  };

  const handleReset = () => {
    setCaseData(null);
    setVerdictEstimate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  if (!showEvaluation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Verdict AI - Legal Platform
              </h1>
              <p className="text-gray-600">
                {userProfile.company_name} - {userProfile.user_type === 'pi_lawyer' ? 'PI Lawyer' : 'Insurance/Defense'}
              </p>
            </div>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
          
          <MediationDashboard 
            userProfile={userProfile} 
            onStartEvaluation={handleStartEvaluation}
          />
        </div>
      </div>
    );
  }

  console.log("Rendering Index with state:", { caseData: !!caseData, verdictEstimate: !!verdictEstimate, isEvaluating });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Verdict AI - Case Evaluation
            </h1>
            {currentSessionCode && (
              <div className="bg-blue-100 p-2 rounded mb-4">
                <p className="text-blue-800 font-medium">
                  Mediation Session: {currentSessionCode}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleBackToDashboard} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
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
